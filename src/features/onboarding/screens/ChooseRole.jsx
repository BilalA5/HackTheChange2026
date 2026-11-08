import { useState } from 'react';
import { roles, sections } from '@/data/roles.js';
import { play } from '@/shared/sound.js';
import { CheckIcon } from '../components/icons.jsx';
import Question from '../components/Question.jsx';
import { useTour } from '../tour.js';

function RoleCard({ role, selected, onSelect }) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className={`group relative block h-[190px] w-full overflow-hidden rounded-[18px] bg-card text-left transition duration-200 ease-tour hover:-translate-y-0.5 ${
          selected
            ? 'shadow-[0_0_0_3px_#F4F4F3,0_18px_36px_-16px_rgba(0,0,0,.8)]'
            : 'shadow-[0_0_0_1px_rgba(255,255,255,.07)]'
        }`}
      >
        <img
          src={role.poster}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover object-top transition duration-500 ease-tour group-hover:scale-[1.04]"
        />
        <span className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
        {selected && (
          <i className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-tx text-onink">
            <CheckIcon className="h-3 w-3" />
          </i>
        )}
        <span className="absolute inset-x-[14px] bottom-[13px] text-[16.5px] font-medium leading-[1.1] tracking-[-0.03em] text-white">
          {role.title}
        </span>
      </button>
    </li>
  );
}

export default function ChooseRole() {
  const { answers, setAnswers, next } = useTour();
  const [section, setSection] = useState(() => roles.find((r) => r.id === answers.roleId)?.section ?? 'popular');
  const shown = roles.filter((role) => (section === 'popular' ? role.popular : role.section === section));
  const custom = answers.customRole ?? '';

  const pick = (roleId) => {
    play('tick');
    setAnswers({ roleId, customRole: '' });
  };
  const type = (event) => setAnswers({ roleId: null, customRole: event.target.value });

  return (
    <Question
      step={0}
      title="What do you want to be?"
      hint="Pick the job you're aiming for. Your whole plan is built around it."
      canContinue={Boolean(answers.roleId || custom.trim())}
    >
      <nav
        className="no-scrollbar absolute left-[180px] right-[180px] top-[292px] flex gap-2 overflow-x-auto"
        aria-label="Fields"
      >
        {sections.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              play('tick', { volume: 0.6 });
              setSection(id);
            }}
            aria-pressed={section === id}
            className={`h-9 shrink-0 rounded-full px-4 text-[14px] transition ${
              section === id ? 'bg-tx text-onink' : 'bg-field text-tx-2 hover:text-tx'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      <ul className="no-scrollbar absolute left-[180px] right-[180px] top-[348px] grid h-[352px] grid-cols-6 content-start gap-4 overflow-y-auto pb-2 pt-1">
        {shown.map((role) => (
          <RoleCard key={role.id} role={role} selected={answers.roleId === role.id} onSelect={() => pick(role.id)} />
        ))}
      </ul>

      <label className="absolute bottom-[20px] left-[150px] z-30 flex h-11 w-[420px] items-center gap-3 rounded-full bg-field pl-5 pr-2 text-[14px] text-tx-3 shadow-[inset_0_1px_0_rgba(255,255,255,.05)] focus-within:shadow-[0_0_0_1.5px_rgba(244,244,243,.6)]">
        <span className="shrink-0">Something else?</span>
        <input
          value={custom}
          onChange={type}
          onKeyDown={(event) => event.key === 'Enter' && custom.trim() && next()}
          placeholder="Type any job title"
          maxLength={60}
          className="min-w-0 flex-1 bg-transparent text-tx outline-none placeholder:text-tx-4"
        />
      </label>
    </Question>
  );
}
