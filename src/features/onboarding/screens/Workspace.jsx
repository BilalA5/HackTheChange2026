import { lines } from '../content.js';
import { GuideCursor } from '../components/hints.jsx';
import Player from '../components/Player.jsx';
import ChatThread from '../components/scenario/ChatThread.jsx';
import Composer from '../components/scenario/Composer.jsx';
import LevelChip from '../components/scenario/LevelChip.jsx';
import StagePanel from '../components/scenario/StagePanel.jsx';

export default function Workspace() {
  return (
    <Player step="workspace" guide={false} caption={lines.collaborate}>
      <LevelChip />
      <StagePanel highlightResources />
      <GuideCursor x={233} y={322} />
      <ChatThread />
      <Composer />
    </Player>
  );
}
