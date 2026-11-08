export function statusOf(scenario, progress) {
  if (progress.completed[scenario.id]) return 'completed';
  if (scenario.comingSoon || progress.level < scenario.unlockLevel) return 'locked';
  return 'ready';
}
