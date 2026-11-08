import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

const byId = (ctx, id) =>
  ctx.db
    .query('users')
    .withIndex('by_external_id', (q) => q.eq('id', id))
    .unique();

const publicUser = ({ id, name, email, onboarded }) => ({ id, name, email, onboarded });

export const get = query({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    const user = await byId(ctx, id);
    return user && publicUser(user);
  },
});

export const signIn = mutation({
  args: { id: v.string(), name: v.string(), email: v.string() },
  handler: async (ctx, { id, name, email }) => {
    const existing = await byId(ctx, id);
    if (existing) {
      await ctx.db.patch(existing._id, { name, email });
      return publicUser({ ...existing, name, email });
    }
    const user = { id, name, email, onboarded: false };
    await ctx.db.insert('users', user);
    return user;
  },
});

export const update = mutation({
  args: {
    id: v.string(),
    changes: v.object({ name: v.optional(v.string()), onboarded: v.optional(v.boolean()) }),
  },
  handler: async (ctx, { id, changes }) => {
    const user = await byId(ctx, id);
    if (!user) throw new Error('Unknown user.');
    await ctx.db.patch(user._id, changes);
    return publicUser({ ...user, ...changes });
  },
});
