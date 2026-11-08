import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

const thread = { userId: v.string(), stopId: v.string(), persona: v.string() };

const find = (ctx, { userId, stopId, persona }) =>
  ctx.db
    .query('conversations')
    .withIndex('by_thread', (q) => q.eq('userId', userId).eq('stopId', stopId).eq('persona', persona))
    .unique();

export const get = query({
  args: thread,
  handler: async (ctx, args) => (await find(ctx, args))?.messages ?? null,
});

export const save = mutation({
  args: { ...thread, messages: v.any() },
  handler: async (ctx, { messages, ...args }) => {
    const existing = await find(ctx, args);
    if (existing) await ctx.db.patch(existing._id, { messages });
    else await ctx.db.insert('conversations', { ...args, messages });
  },
});

export const clear = mutation({
  args: thread,
  handler: async (ctx, args) => {
    const existing = await find(ctx, args);
    if (existing) await ctx.db.delete(existing._id);
  },
});

export const clearAll = mutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const threads = await ctx.db
      .query('conversations')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
    await Promise.all(threads.map((row) => ctx.db.delete(row._id)));
  },
});
