import { resolveRole } from '@/features/plan/buildPlan.js';
import { startingPoints } from '@/features/plan/questions.js';
import Question, { Choice } from '../components/Question.jsx';
import { useTour } from '../tour.js';

export default function StartingPoint() {
  const { answers, setAnswers } = useTour();
  const role = resolveRole(answers);

  return (
    <Question
      step={1}
      title="Where are you starting from?"
      hint={`We'll set the difficulty of your ${role.title} projects, and add the basics if you need them.`}
      canContinue={Boolean(answers.startingPoint)}
    >
      <div className="absolute left-1/2 top-[330px] grid w-[880px] -translate-x-1/2 grid-cols-2 gap-4">
        {startingPoints.map((option) => {
          const selected = answers.startingPoint === option.id;
          return (
            <Choice
              key={option.id}
              selected={selected}
              onSelect={() => setAnswers({ startingPoint: option.id })}
              className="flex h-[132px] flex-col justify-center rounded-[24px] px-7"
            >
              <span className="text-[21px] font-medium tracking-[-0.025em]">{option.label}</span>
              <span className={`mt-2 text-[15px] leading-[1.4] ${selected ? 'text-[#55555b]' : 'text-tx-2'}`}>
                {option.detail}
              </span>
            </Choice>
          );
        })}
      </div>
    </Question>
  );
}
