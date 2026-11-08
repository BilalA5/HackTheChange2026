import { useTour } from '../tour.js';
import Player from '../components/Player.jsx';
import ChatThread from '../components/scenario/ChatThread.jsx';
import Composer from '../components/scenario/Composer.jsx';
import LevelChip from '../components/scenario/LevelChip.jsx';
import StagePanel from '../components/scenario/StagePanel.jsx';

export default function Feedback() {
  const { next } = useTour();

  return (
    <Player
      step="feedback"
      guide={false}
      turn={
        <>
          Click <span className="text-tx">Submit</span>
        </>
      }
    >
      <LevelChip />
      <StagePanel />
      <ChatThread answered />
      <Composer attachment onSubmit={next} />
    </Player>
  );
}
