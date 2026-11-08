/**
 * Where the learner stands on their plan. Stops open in order: everything before the current stop is
 * done, the current stop is the first one that isn't, and the rest stay locked until they're reached.
 */
export function progressOf(plan, progress) {
  const done = (stop) => Boolean(progress.completed[stop.id]);
  const currentIndex = plan.stops.findIndex((stop) => !done(stop));
  const current = currentIndex < 0 ? null : plan.stops[currentIndex];

  const statusOf = (stop) => {
    if (done(stop)) return 'done';
    if (stop.id === current?.id) return 'current';
    return 'locked';
  };

  const doneCount = plan.stops.filter(done).length;
  const phases = plan.phases.map((phase) => ({
    ...phase,
    done: phase.stopIds.filter((id) => progress.completed[id]).length,
    total: phase.stopIds.length,
  }));

  const previousOf = (stop) => plan.stops[plan.stops.findIndex((s) => s.id === stop.id) - 1] ?? null;
  const nextOf = (stop) => plan.stops[plan.stops.findIndex((s) => s.id === stop.id) + 1] ?? null;

  return {
    current,
    statusOf,
    doneCount,
    phases,
    previousOf,
    nextOf,
    week: current?.week ?? plan.totalWeeks,
    complete: !current,
  };
}

export function readinessOf(plan, progress) {
  const doneKind = (kind) => plan.stops.some((stop) => stop.kind === kind && progress.completed[stop.id]);
  const projects = Object.keys(progress.completed).length;
  const checks = [
    { label: 'Finish your capstone project', done: doneKind('capstone') },
    {
      label: plan.startingPoint === 'working' ? 'Make your promotion case' : 'Pass the mock interview loop',
      done: doneKind('interview'),
    },
    { label: `Five reviewed projects in your portfolio (${Math.min(projects, 5)} of 5)`, done: projects >= 5 },
    { label: `Reach level 5 (you're level ${progress.level})`, done: progress.level >= 5 },
  ];
  return { checks, percent: Math.round((checks.filter((check) => check.done).length / checks.length) * 100) };
}
