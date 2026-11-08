import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  users: defineTable({
    id: v.string(),
    name: v.string(),
    email: v.string(),
    onboarded: v.boolean(),
  }).index('by_external_id', ['id']),

  plans: defineTable({
    userId: v.string(),
    plan: v.any(),
  }).index('by_user', ['userId']),

  progress: defineTable({
    userId: v.string(),
    xp: v.number(),
    completed: v.any(),
  }).index('by_user', ['userId']),

  conversations: defineTable({
    userId: v.string(),
    stopId: v.string(),
    persona: v.string(),
    messages: v.any(),
  })
    .index('by_thread', ['userId', 'stopId', 'persona'])
    .index('by_user', ['userId']),
});
