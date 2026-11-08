import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

const byUser = (ctx, userId) =>
  ctx.db
    .query('progress')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .unique();

export const get = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const progress = await byUser(ctx, userId);
    return progress ? { xp: progress.xp, completed: progress.completed } : null;
  },
});

export const complete = mutation({
  args: {
    userId: v.string(),
    stopId: v.string(),
    entry: v.object({
      title: v.string(),
      company: v.string(),
      logo: v.string(),
      tools: v.array(v.string()),
      color: v.union(v.string(), v.null()),
      summary: v.string(),
      scores: v.record(v.string(), v.number()),
      xp: v.number(),
      completedAt: v.string(),
    }),
  },
  handler: async (ctx, { userId, stopId, entry }) => {
    const progress = await byUser(ctx, userId);
    if (!progress) {
      await ctx.db.insert('progress', { userId, xp: entry.xp, completed: { [stopId]: entry } });
      return;
    }
    const firstTime = !progress.completed[stopId];
    await ctx.db.patch(progress._id, {
      xp: progress.xp + (firstTime ? entry.xp : 0),
      completed: { ...progress.completed, [stopId]: entry },
    });
  },
});

export const reset = mutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const progress = await byUser(ctx, userId);
    if (progress) await ctx.db.delete(progress._id);
  },
});
