import ChooseRole from './ChooseRole.jsx';
import Pace from './Pace.jsx';
import StartingPoint from './StartingPoint.jsx';
import YourPlan from './YourPlan.jsx';

export const screens = [
  { slug: 'role', title: 'What do you want to be?', Screen: ChooseRole },
  { slug: 'starting-point', title: 'Where are you starting from?', Screen: StartingPoint },
  { slug: 'pace', title: 'Your pace', Screen: Pace },
  { slug: 'plan', title: 'Your plan', Screen: YourPlan },
];
