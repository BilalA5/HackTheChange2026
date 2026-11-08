import { useMemo } from 'react';
import { buildPlan, withArticle } from '@/features/plan/buildPlan.js';
import { paces } from '@/features/plan/questions.js';
import Question, { Choice } from '../components/Question.jsx';
import { useTour } from '../tour.js';

export default function Pace() {
  const { answers, setAnswers } = useTour();
  const preview = useMemo(() => answers.hoursPerWeek && buildPlan(answers), [answers]);

  return (
    <Question
      step={2}
      title="How much time can you give it each week?"
      hint="Be honest. A plan you keep beats a plan you abandon."
      canContinue={Boolean(answers.hoursPerWeek)}
    >
      <div className="absolute left-1/2 top-[330px] flex -translate-x-1/2 gap-5">
        {paces.map((pace) => {
          const selected = answers.hoursPerWeek === pace.hours;
          return (
            <Choice
              key={pace.hours}
              selected={selected}
              onSelect={() => setAnswers({ hoursPerWeek: pace.hours })}
              className="flex h-[150px] w-[200px] flex-col items-center justify-center rounded-[28px] text-center"
            >
              <span className="font-serif text-[40px] leading-none tracking-[-0.03em]">{pace.label}</span>
              <span className={`mt-3 text-[14.5px] ${selected ? 'text-[#55555b]' : 'text-tx-2'}`}>{pace.detail}</span>
            </Choice>
          );
        })}
      </div>
      <p
        className={`absolute inset-x-0 top-[528px] m-0 text-center text-[17px] text-tx-2 transition-opacity duration-500 ${preview ? 'opacity-100' : 'opacity-0'}`}
        aria-live="polite"
      >
        {preview && (
          <>
            That puts you job-ready as <b className="font-medium text-tx">{withArticle(preview.roleTitle)}</b> in about{' '}
            <b className="font-medium text-tx">{preview.totalWeeks} weeks</b>.
          </>
        )}
      </p>
    </Question>
  );
}
