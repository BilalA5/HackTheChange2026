import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { getScenario } from '@/data/scenarios/index.js';
import { useAuth } from '@/features/auth/auth-context.js';
import { useProgress } from '@/features/app/useProgress.js';
import { requestReview } from '@/services/chat.js';
import { completeScenario } from '@/services/progress.js';
import { useAppTheme } from '@/shared/useAppTheme.js';
import ChatPanel from './ChatPanel.jsx';
import NotesViewer from './NotesViewer.jsx';
import Sidebar from './Sidebar.jsx';
import TopBar from './TopBar.jsx';
import { useConversation } from './useConversation.js';
import './workspace.css';

const FONTS =
  'https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=Geist+Mono:wght@400;500;600&display=swap';

function ScenarioWorkspace({ scenario }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const progress = useProgress();
  const finished = progress.completed[scenario.id];

  const conversations = {
    manager: useConversation({ scenario, persona: 'manager', userId: user.id }),
    coach: useConversation({ scenario, persona: 'coach', userId: user.id }),
  };
  const [active, setActive] = useState('manager');
  const [notesOpen, setNotesOpen] = useState(true);
  const [reviewStatus, setReviewStatus] = useState(finished ? 'done' : 'idle');

  const submitForReview = async () => {
    setActive('manager');
    setReviewStatus('reviewing');
    conversations.manager.post('Thanks, reviewing your submission now.');
    const review = await requestReview({ scenarioId: scenario.id });
    await completeScenario(user.id, scenario.id, review);
    conversations.manager.post(review.summary, { kind: 'review', review });
    setReviewStatus('done');
  };

  return (
    <div className="relative min-h-full bg-[var(--page)] xl:h-full xl:overflow-hidden">
      <title>{`${scenario.shortTitle} · Flint`}</title>
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="stylesheet" href={FONTS} precedence="default" />
      <div className="absolute inset-x-0 top-0 h-[2px] bg-black" aria-hidden="true" />
      <TopBar
        onBack={() => navigate('/app')}
        level={progress.level}
        scores={finished?.scores}
        userName={user.name}
      />
      <main
        className={`grid gap-y-8 px-4 pb-6 xl:h-full xl:gap-y-0 xl:pb-0 xl:pl-[17px] xl:pr-[14px] ${
          notesOpen ? 'xl:grid-cols-[278px_minmax(0,1fr)_minmax(0,600px)]' : 'xl:grid-cols-[278px_minmax(0,1fr)]'
        }`}
      >
        <div className="xl:h-full xl:min-h-0">
          <Sidebar
            scenario={scenario}
            notesOpen={notesOpen}
            onOpenNotes={() => setNotesOpen(true)}
            reviewStatus={reviewStatus}
            onSubmit={submitForReview}
          />
        </div>
        <div className="h-[760px] min-h-0 xl:h-full">
          <ChatPanel conversations={conversations} active={active} onSelect={setActive} />
        </div>
        {notesOpen && (
          <div className="h-[760px] min-h-0 xl:h-full xl:pb-[14px] xl:pt-[122px]">
            <NotesViewer scenario={scenario} onClose={() => setNotesOpen(false)} />
          </div>
        )}
      </main>
    </div>
  );
}

export default function ScenarioPage() {
  useAppTheme('workspace');
  const { scenarioId } = useParams();
  const scenario = getScenario(scenarioId);

  if (!scenario) return <Navigate to="/app" replace />;
  return <ScenarioWorkspace key={scenario.id} scenario={scenario} />;
}
