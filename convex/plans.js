import { v } from 'convex/values';
import { internalMutation, internalQuery, mutation, query } from './_generated/server';

const byUser = (ctx, userId) =>
  ctx.db
    .query('plans')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .unique();

export const get = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => (await byUser(ctx, userId))?.plan ?? null,
});

export const save = mutation({
  args: { userId: v.string(), plan: v.any() },
  handler: async (ctx, { userId, plan }) => {
    const existing = await byUser(ctx, userId);
    if (existing) await ctx.db.patch(existing._id, { plan });
    else await ctx.db.insert('plans', { userId, plan });
  },
});

export const read = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => (await byUser(ctx, userId))?.plan ?? null,
});

/** Saves a tailored plan unless the learner has built a new plan since tailoring started. */
export const replaceIfCurrent = internalMutation({
  args: { userId: v.string(), createdAt: v.string(), plan: v.any() },
  handler: async (ctx, { userId, createdAt, plan }) => {
    const existing = await byUser(ctx, userId);
    if (!existing || existing.plan.createdAt !== createdAt) return false;
    await ctx.db.patch(existing._id, { plan });
    return true;
  },
});
