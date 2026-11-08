import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAppTheme } from '@/shared/useAppTheme.js';
import Chat from './Chat.jsx';
import NotesViewer from './NotesViewer.jsx';
import Sidebar from './Sidebar.jsx';
import TopBar from './TopBar.jsx';
import './workspace.css';

const FONTS =
  'https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=Geist+Mono:wght@400;500;600&display=swap';

export default function WorkspacePage() {
  useAppTheme('workspace');
  const navigate = useNavigate();
  const [notesOpen, setNotesOpen] = useState(true);

  return (
    <div className="relative min-h-full bg-[var(--page)] xl:h-full xl:overflow-hidden">
      <title>Task workspace · Flint</title>
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="stylesheet" href={FONTS} precedence="default" />
      <div className="absolute inset-x-0 top-0 h-[2px] bg-black" aria-hidden="true" />
      <TopBar onBack={() => navigate('/')} />
      <main
        className={`grid gap-y-8 px-4 pb-6 xl:h-full xl:gap-y-0 xl:pb-0 xl:pl-[17px] xl:pr-[14px] ${
          notesOpen ? 'xl:grid-cols-[278px_minmax(0,1fr)_686px]' : 'xl:grid-cols-[278px_minmax(0,1fr)]'
        }`}
      >
        <div className="xl:h-full xl:min-h-0">
          <Sidebar notesOpen={notesOpen} onOpenNotes={() => setNotesOpen(true)} />
        </div>
        <div className="h-[860px] min-h-0 xl:h-full">
          <Chat />
        </div>
        {notesOpen && (
          <div className="h-[760px] min-h-0 xl:h-full xl:pb-[14px] xl:pt-[122px]">
            <NotesViewer onClose={() => setNotesOpen(false)} />
          </div>
        )}
      </main>
    </div>
  );
}
