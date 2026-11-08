import Brief from './Brief.jsx';
import ChooseRole from './ChooseRole.jsx';
import Feedback from './Feedback.jsx';
import FirstScenario from './FirstScenario.jsx';
import GetHired from './GetHired.jsx';
import Kickoff from './Kickoff.jsx';
import Pace from './Pace.jsx';
import Portfolio from './Portfolio.jsx';
import Presentation from './Presentation.jsx';
import StartingPoint from './StartingPoint.jsx';
import Understanding from './Understanding.jsx';
import WelcomeBack from './WelcomeBack.jsx';
import Workspace from './Workspace.jsx';
import YourPlan from './YourPlan.jsx';
import YourWorld from './YourWorld.jsx';

export const screens = [
  { slug: 'welcome', title: 'Welcome', Screen: WelcomeBack },
  { slug: 'role', title: 'What do you want to be?', Screen: ChooseRole },
  { slug: 'starting-point', title: 'Where are you starting from?', Screen: StartingPoint },
  { slug: 'pace', title: 'Your pace', Screen: Pace },
  { slug: 'plan', title: 'Your plan', Screen: YourPlan },
  { slug: 'your-world', title: 'Your world', Screen: YourWorld },
  { slug: 'brief', title: 'Brief', Screen: Brief },
  { slug: 'kickoff', title: 'Kickoff', Screen: Kickoff },
  { slug: 'understanding', title: 'Understanding', Screen: Understanding },
  { slug: 'workspace', title: 'Workspace', Screen: Workspace },
  { slug: 'feedback', title: 'Feedback', Screen: Feedback },
  { slug: 'presentation', title: 'Presentation', Screen: Presentation },
  { slug: 'portfolio', title: 'Portfolio', Screen: Portfolio },
  { slug: 'get-hired', title: 'Get hired', Screen: GetHired },
  { slug: 'first-scenario', title: 'First scenario', Screen: FirstScenario },
];
