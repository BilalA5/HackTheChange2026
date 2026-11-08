import { useState } from 'react';
import { scenarios } from '@/data/scenarios/index.js';
import { useAuth } from '@/features/auth/auth-context.js';
import ScenarioDetail from './home/ScenarioDetail.jsx';
import ScenarioList from './home/ScenarioList.jsx';
import { statusOf } from './home/status.js';
import WorldMap from './home/WorldMap.jsx';
import { useProgress } from './useProgress.js';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomePage() {
  const { user } = useAuth();
  const progress = useProgress();
  const firstReady = scenarios.find((scenario) => statusOf(scenario, progress) === 'ready') ?? scenarios[0];
  const [selectedId, setSelectedId] = useState(firstReady.id);
  const selected = scenarios.find((scenario) => scenario.id === selectedId);
  const finishedCount = Object.keys(progress.completed).length;

  return (
    <div className="mx-auto flex max-w-[1500px] flex-col gap-6 px-4 py-6 sm:px-8 sm:py-8">
      <title>Your world · Flint</title>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[14px] text-tx-3">
            {greeting()}, {user.name.split(' ')[0]}
          </p>
          <h1 className="mt-1 text-[clamp(1.8rem,1.3rem+1.4vw,2.6rem)] font-normal leading-[1.05] tracking-[-0.04em]">
            Pick a scenario and get to work.
          </h1>
        </div>
        <p className="text-[14px] text-tx-2">
          {finishedCount} of {scenarios.length} scenarios finished
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex flex-col gap-6">
          <WorldMap scenarios={scenarios} progress={progress} selectedId={selectedId} onSelect={setSelectedId} />
          <ScenarioList scenarios={scenarios} progress={progress} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
        <ScenarioDetail
          key={selected.id}
          scenario={selected}
          status={statusOf(selected, progress)}
          review={progress.completed[selected.id]}
        />
      </div>
    </div>
  );
}
