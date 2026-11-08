import { useState } from 'react';
import { Link } from 'react-router';
import { roles } from '@/data/roles.js';
import { useAppTheme } from '@/shared/useAppTheme.js';
import { faq } from './faq.js';
import {
  ActionRow,
  ArrowUpRight,
  Chart,
  Chevron,
  Composer,
  Download,
  FlintMark,
  Play,
  Shield,
  Spark,
  Stage,
  Toolbar,
} from './parts.jsx';
import './landing.css';

const FONTS =
  'https://fonts.googleapis.com/css2?family=EB+Garamond&family=Geist:wght@400;500;600&family=Geist+Mono&family=Inter:wght@400;500;600&display=swap';

const IMG = '/assets/landing';
const CAMPUS = '/assets/board/campus.jpg';
const poolPrice = roles.find((role) => role.id === 'energy-analyst').chart;

function StartButton({ className = '', children = 'Start a project' }) {
  return (
    <Link
      to="/login"
      className={`inline-flex items-center justify-center gap-[8px] font-medium text-white ${className}`}
    >
      <Play size={11} />
      {children}
    </Link>
  );
}

function Logo({ tone = 'light', className = '' }) {
  return (
    <a
      href="#top"
      aria-label="Flint home"
      className={`font-display flex items-center gap-[6px] text-[23px] font-medium tracking-[-0.04em] ${className}`}
    >
      <FlintMark size={24} tone={tone} />
      Flint
    </a>
  );
}

function Header() {
  return (
    <header className="relative z-10 mx-auto flex h-[64px] max-w-[1130px] items-center px-4 text-white min-[1162px]:px-0">
      <Logo />
      <nav
        aria-label="Sections"
        className="ml-5 flex gap-[14px] text-[13px] font-medium sm:ml-[70px] sm:gap-[28px] sm:text-[14px]"
      >
        <a href="#how" className="hover:opacity-80">
          How it works
        </a>
        <a href="#roles" className="hover:opacity-80">
          Roles
        </a>
        <a href="#faq" className="hover:opacity-80">
          FAQ
        </a>
      </nav>
      <Link to="/login" className="ml-auto text-[14px] font-medium hover:opacity-80">
        Log in
      </Link>
    </header>
  );
}

function OverlayPanel() {
  return (
    <div
      className="absolute left-[129px] top-[10px] h-[232px] w-[518px] rounded-[18px] text-white shadow-[inset_0_0_0_1.5px_rgba(255,255,255,0.38)]"
      style={{ background: 'var(--panel-tint)' }}
    >
      <div className="bubble-blue absolute right-[21px] top-[17px] flex h-[28px] items-center rounded-[14px] rounded-br-[4px] px-[10.5px] text-[11.7px]">
        Why did pool prices drop?
      </div>
      <p className="absolute left-[17px] top-[57px] whitespace-nowrap text-[11.6px] leading-[19px] text-white/95">
        “Start with the AESO numbers: $133.63/MWh in 2023, $62.78 in 2024. Pull supply and demand
        <br />
        for both years, then tell me which one moved first, and by how much.”
      </p>
      <div className="absolute left-[23px] top-[113px]">
        <ActionRow width={463} />
      </div>
      <div className="absolute left-[13px] top-[145px]">
        <Composer width={492} />
      </div>
    </div>
  );
}

function ProductFrame() {
  return (
    <div className="relative mx-auto mt-[73px] max-w-[1152px] px-4 min-[1184px]:px-0">
      <div className="relative">
        <img
          src={`${IMG}/hero-wallpaper.jpg`}
          alt=""
          className="absolute inset-x-[-8px] bottom-[-20px] top-[8px] h-[calc(100%+12px)] w-[calc(100%+16px)] max-w-none opacity-70 blur-[16px]"
        />
        <Stage w={1152} h={676} className="frame-shadow overflow-hidden rounded-[10px]">
          <img src={`${IMG}/hero-wallpaper.jpg`} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <FlintMark size={14} className="absolute left-[12px] top-[8px]" />

          <div className="absolute left-[188px] top-[84px] h-[496px] w-[770px] overflow-hidden rounded-[14px] bg-[#05060a] shadow-[0_20px_50px_rgba(40,30,60,0.32)]">
            <div className="absolute inset-x-0 top-0 flex h-[27px] items-center gap-[6px] bg-[#1c1d22] pl-[10px]">
              <span className="h-[10px] w-[10px] rounded-full bg-[#ec6a5e]" />
              <span className="h-[10px] w-[10px] rounded-full bg-[#d7a53f]" />
              <span className="h-[10px] w-[10px] rounded-full bg-[#61c554]" />
              <span className="ml-[260px] text-[11px] text-white/45">Your board · Energy Analyst</span>
            </div>
            <img
              src={CAMPUS}
              alt="The Flint campus, with a building for every company you work with"
              className="absolute inset-x-0 bottom-[54px] top-[27px] h-[415px] w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 flex h-[54px] items-center gap-6 bg-[#1c1d22] px-[18px] text-[11px] text-white/60">
              <span>
                <b className="font-medium text-white">Stop 1</b> · Pool price &amp; demand
              </span>
              <span>Week 1 of 23</span>
              <span>+150 XP</span>
              <span className="ml-auto rounded-[6px] bg-[#2e6f40] px-3 py-[6px] text-[12px] text-white">
                Start this stop
              </span>
            </div>
            <OverlayPanel />
          </div>

          <div className="absolute left-[488px] top-[40px]">
            <Toolbar />
          </div>
        </Stage>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section id="top" className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[max(1040px,61.2vw)] select-none overflow-hidden max-sm:[mask-image:linear-gradient(#000_60%,transparent_72%)]">
        <img
          src={`${IMG}/hero-sky.jpg`}
          alt=""
          className="absolute left-1/2 top-0 w-full min-w-[1700px] max-w-none -translate-x-1/2"
        />
      </div>
      <div className="relative">
        <Header />
        <h1 className="font-serif-hero mx-auto mt-[64px] px-4 text-center text-[clamp(46px,9.4vw,80px)] font-normal leading-[0.975] tracking-[-0.016em] text-white">
          Learn a job
          <br />
          by doing it
        </h1>
        <div className="mx-auto mt-[17px] h-px w-[340px] max-w-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)]" />
        <p className="mx-auto mt-[21px] max-w-[640px] px-4 text-center text-[18.5px] font-medium leading-[26px] tracking-[-0.018em] text-white">
          Real projects on Alberta data, with a manager and a coach beside you.
          <br className="hidden sm:block" /> Leave with a portfolio you can show.
        </p>
        <div className="mt-[32px] flex justify-center">
          <StartButton className="btn-start h-[44px] rounded-[10px] px-5 text-[15.5px]" />
        </div>
        <ProductFrame />
      </div>
    </section>
  );
}

function PriceBars() {
  const max = Math.max(...poolPrice.points.map(([, value]) => value));
  return (
    <div className="flex h-[150px] items-end justify-center gap-[48px]" aria-hidden="true">
      {poolPrice.points.map(([year, value], index) => (
        <div key={year} className="flex flex-col items-center gap-2">
          <span className="text-[14px] font-medium tabular-nums text-white/80">${value.toFixed(0)}</span>
          <span
            className="bar-grow w-[64px] rounded-t-[10px] bg-white/45"
            style={{ height: (value / max) * 100, animationDelay: `${index * 140}ms` }}
          />
          <span className="text-[13px] text-white/60">{year}</span>
        </div>
      ))}
    </div>
  );
}

function BriefCard() {
  return (
    <article className="card-blue relative overflow-hidden rounded-[32px] px-[16px] pb-[40px] pt-[40px] text-white sm:px-[40px] sm:pb-[72px]">
      <h3 className="font-display text-[23px] font-medium leading-[34px] tracking-[-0.018em] sm:text-[28px]">
        Your manager
        <span className="pill-glass mx-[6px] inline-flex h-[34px] items-center gap-[5px] rounded-full px-[9px] align-top">
          <Chart size={16} />
          briefs
        </span>
        you on a real problem
      </h3>
      <p className="mt-[19px] max-w-[470px] text-[16px] leading-[27px] tracking-[-0.015em] text-white/95 sm:text-[18px]">
        Every project starts like a first week on the job: a goal, the data, and a deadline.
      </p>
      <Stage w={514} h={363} className="mt-[3.5px]">
        <div className="font-display absolute inset-x-0 top-[9px] text-center text-[39px] font-semibold leading-[48px] tracking-[-0.01em] text-white/55">
          −53%
        </div>
        <div className="absolute inset-x-0 top-[59px] flex items-center justify-center gap-[6px] text-[16px] leading-[22px] text-white/70">
          <span className="h-[5px] w-[5px] rounded-full bg-[#ffd166]" />
          Alberta pool price, 2023 to 2024
        </div>
        <div className="absolute inset-x-0 top-[100px]">
          <PriceBars />
        </div>
        <div className="dim-composer absolute left-0 top-[290px] h-[73px] w-[514px] rounded-[10px] px-[28px] py-[14px] text-[13px] leading-[20px] text-white/70">
          <b className="font-medium text-white">The brief:</b> find out why the price fell, and say what it means for a
          retailer buying power next year.
        </div>
      </Stage>
    </article>
  );
}

function CoachCard() {
  return (
    <article className="card-light relative overflow-hidden rounded-[32px] px-[16px] pb-[32px] pt-[38px] sm:px-[41px] sm:pb-[61px]">
      <h3 className="font-display text-[23px] font-medium leading-[37px] tracking-[-0.018em] text-[#23252d] sm:text-[28px]">
        When you get stuck, your coach
        <span className="mx-[6px] inline-flex h-[34px] items-center gap-[4px] rounded-full bg-white/70 px-[9px] align-top">
          <Spark size={16} />
          steps in
        </span>
      </h3>
      <p className="mt-[16px] max-w-[470px] text-[16px] leading-[27px] tracking-[-0.015em] text-[#878a97] sm:text-[18px]">
        Ask anything, any time. Your coach helps you think it through without doing it for you.
      </p>
      <Stage w={512} h={338} className="mt-[3.5px]">
        <div className="absolute left-[168px] top-[16px]">
          <Toolbar flat label="Coach" />
        </div>
        <div className="absolute inset-x-0 top-[71px] h-[267px] rounded-[16px] bg-[linear-gradient(180deg,#525257,#49494e)] text-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]">
          <div className="bubble-blue absolute right-[21px] top-[17px] flex h-[28px] items-center rounded-[14px] rounded-br-[4px] px-[10.5px] text-[11.7px]">
            I don’t know where to start
          </div>
          <p className="absolute left-[17px] top-[57px] text-[11.7px] leading-[15px] text-white/55">
            Jenna, your coach
          </p>
          <p className="absolute left-[17px] top-[72px] w-[460px] text-[11.6px] leading-[19px] text-white/95">
            Name the requirement you’re on and the last thing you tried. If you haven’t started, load the 2023 and 2024
            pool prices into a sheet and chart them side by side. That takes ten minutes. Do that first, then tell me
            what you see.
          </p>
          <div className="absolute left-[23px] top-[148px]">
            <ActionRow width={463} />
          </div>
          <div className="absolute left-[13px] top-[180px]">
            <Composer width={486} to="Jenna" />
          </div>
        </div>
      </Stage>
    </article>
  );
}

function HowSection() {
  return (
    <section id="how" className="mx-auto mt-[120px] max-w-[1248px] scroll-mt-[40px] px-4 sm:mt-[261px]">
      <h2 className="font-display text-[34px] font-medium leading-[1.14] sm:text-[56px]">
        <span className="heading-fade">How Flint works on every project</span>
      </h2>
      <div className="mt-[48px] grid gap-[28px] lg:grid-cols-2">
        <BriefCard />
        <CoachCard />
      </div>
    </section>
  );
}

function SectionHeading({ title, subtitle }) {
  return (
    <div className="px-4 text-center">
      <h2 className="font-display text-[34px] font-medium leading-[1.14] sm:text-[56px]">
        <span className="heading-fade-center">{title}</span>
      </h2>
      <p className="mt-[15px] text-[16px] leading-[28px] text-[#8b8e9b] sm:text-[17.4px]">{subtitle}</p>
    </div>
  );
}

const wentWell = [
  <>
    You led with the answer: <b>supply grew faster than demand</b>, and you showed it in one chart.
  </>,
  <>
    Your numbers match the source. <b>$133.63 to $62.78/MWh</b> is exactly what AESO reports.
  </>,
  <>You named what it means for a retailer: lock in less forward supply at last year’s prices.</>,
];

const nextTime = [
  <>Say how sure you are. One line on what could change the picture beats a page of caveats.</>,
  <>
    Keep the summary to <b>three sentences</b>. You had five.
  </>,
];

const scores = [
  ['Insight', 86],
  ['Quality', 78],
  ['Communication', 72],
  ['Reliability', 90],
];

function Bullets({ items, top }) {
  return (
    <ul
      className="absolute left-[131px] w-[372px] text-[10px] leading-[13.5px] tracking-[-0.019em] text-[#777] [&_b]:font-normal [&_b]:text-[#111]"
      style={{ top }}
    >
      {items.map((item, index) => (
        <li
          key={index}
          className="relative mb-[5.5px] pl-[7.5px] before:absolute before:left-0 before:top-[5.5px] before:h-[2px] before:w-[2px] before:rounded-full before:bg-[#777]"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function ReviewWindow() {
  return (
    <Stage w={896} h={542} className="overflow-hidden rounded-[28px]">
      <div className="feature-surface absolute inset-0" />
      <div className="absolute left-[112px] top-[112px] h-[440px] w-[672px] rounded-[10px] bg-white/45 p-[4px]">
        <div className="relative h-full w-full rounded-[7px] bg-[#f3f3f3]">
          <span className="absolute left-[7.5px] top-[12px] h-[6px] w-[6px] rounded-full bg-[#ff5f57]" />
          <span className="absolute left-[17.5px] top-[12px] h-[6px] w-[6px] rounded-full bg-[#febc2e]" />
          <span className="absolute left-[27.5px] top-[12px] h-[6px] w-[6px] rounded-full bg-[#28c840]" />
          <div className="absolute left-[221px] top-[7px] flex h-[15px] w-[222px] items-center justify-center rounded-[4px] bg-[#e7e7e7] text-[7.5px] text-[#7f7f7f]">
            Your portfolio · Stop 3
          </div>

          <div className="absolute inset-x-[3px] bottom-0 top-[30px] rounded-t-[6px] bg-[#fafafa] shadow-[0_0_0_0.5px_#dedede]">
            <span className="absolute right-[6px] top-[6.5px] flex h-[13.5px] items-center gap-[3px] rounded-[4px] bg-white px-[6px] text-[7px] text-[#4b4b4b] shadow-[inset_0_0_0_0.5px_#dcdcdc]">
              <Download size={7.5} />
              Add to portfolio
            </span>

            <p className="absolute left-[123px] top-[19.5px] text-[8.5px] font-medium leading-[11px] text-[#9b9b9b]">
              Reviewed by Avery · +150 XP
            </p>
            <h3 className="absolute left-[123px] top-[35px] whitespace-nowrap text-[16.5px] font-semibold leading-[22px] tracking-[-0.019em] text-[#1c1c1c]">
              Why Alberta’s Power Prices Halved
            </h3>
            <div className="absolute left-[123px] top-[67.5px] flex h-[17px] items-center rounded-[4px] bg-[#ececee] px-[1px] text-[7.8px] text-[#8f8fa8]">
              <span className="grid h-[14px] w-[40px] place-items-center rounded-[3px] bg-white font-medium text-[#55556b] shadow-[0_0_1px_rgba(0,0,0,0.2)]">
                Review
              </span>
              <span className="mx-[8px]">Brief</span>
              <span className="mr-[6px]">Your work</span>
            </div>

            <h4 className="absolute left-[123px] top-[99.5px] text-[12px] font-semibold leading-[16px] text-[#1c1c1c]">
              What went well
            </h4>
            <Bullets items={wentWell} top={123} />
            <h4 className="absolute left-[123px] top-[218px] text-[12px] font-semibold leading-[16px] text-[#1c1c1c]">
              Next time
            </h4>
            <Bullets items={nextTime} top={241} />

            <h4 className="absolute left-[123px] top-[290px] text-[12px] font-semibold leading-[16px] text-[#1c1c1c]">
              Scores
            </h4>
            <dl className="absolute left-[123px] top-[314px] grid w-[380px] grid-cols-2 gap-x-[22px] gap-y-[10px]">
              {scores.map(([label, value]) => (
                <div key={label}>
                  <dt className="flex justify-between text-[8.5px] text-[#777]">
                    {label}
                    <span className="tabular-nums text-[#111]">{value}</span>
                  </dt>
                  <dd className="m-0 mt-[4px] h-[3px] rounded-full bg-[#e6e6e9]">
                    <i className="block h-full rounded-full bg-[#3b6ff0]" style={{ width: `${value}%` }} />
                  </dd>
                </div>
              ))}
            </dl>

            <div className="absolute left-[200px] top-[372px] flex h-[22px] w-[260px] items-center rounded-full bg-[#f4f4f4]/95 pl-[14px] text-[8.3px] text-[#8b8b8b] shadow-[0_0_8px_rgba(255,255,255,0.9)]">
              Ask Avery about this review...
              <span className="absolute right-[4px] grid h-[17px] w-[17px] place-items-center rounded-full bg-[#e6e6e6] text-[#222]">
                <ArrowUpRight size={9} />
              </span>
            </div>
          </div>
        </div>
      </div>
    </Stage>
  );
}

function ReviewSection() {
  return (
    <section className="mt-[120px] sm:mt-[260px]">
      <SectionHeading
        title="A review on every project"
        subtitle="Your manager scores insight, quality, communication and reliability, and tells you what to fix."
      />
      <div className="mx-auto mt-[32px] max-w-[928px] px-4 sm:mt-[57px]">
        <ReviewWindow />
      </div>
    </section>
  );
}

const team = [
  {
    name: 'Avery',
    role: 'Manager',
    note: 'Sets the brief, reviews your work',
    photo: '/assets/onboarding/cast-avery.jpg',
  },
  { name: 'Jenna', role: 'Coach', note: 'There whenever you are stuck', photo: '/assets/cast/coach-jenna.webp' },
  { name: 'Jordan', role: 'Manager', note: 'Runs your capstone', photo: '/assets/onboarding/cast-jordan.jpg' },
  { name: 'You', role: 'Analyst', note: 'Doing the work' },
];

function TeamCard() {
  return (
    <Stage w={384} h={366} className="overflow-hidden rounded-[28px]">
      <div className="feature-surface absolute inset-0" />
      <div className="absolute left-[24px] top-[24px] h-[320px] w-[336px] rounded-[12px] bg-[linear-gradient(180deg,#f1f2f7,#f4f5fa)]">
        <p className="absolute left-[18px] top-[18px] whitespace-nowrap text-[15.5px] font-medium leading-[24px] tracking-[-0.012em] text-[#34353b]">
          Your team <span className="text-[12px] font-normal text-[#73747f]">(4)</span>
        </p>
        <span className="absolute left-[205px] top-[18px] flex h-[24px] w-[113px] items-center justify-center gap-[5px] rounded-[5px] bg-[#e6e8f1] text-[10.8px] font-medium text-[#22232a]">
          <Shield />
          On every stop
        </span>
        {team.map(({ name, role, note, photo }, index) => (
          <div
            key={name}
            className={`absolute left-[18px] h-[58px] w-[300px] ${index < 3 ? 'border-b border-[#e7e8ee]' : ''}`}
            style={{ top: 49 + index * 58 }}
          >
            {photo ? (
              <img
                src={photo}
                alt=""
                className="absolute left-0 top-[13px] h-[32px] w-[32px] rounded-full object-cover"
              />
            ) : (
              <span className="absolute left-0 top-[13px] grid h-[32px] w-[32px] place-items-center rounded-full bg-[#2b2d33] text-[11px] font-semibold text-white">
                You
              </span>
            )}
            <p className="absolute left-[44px] top-[11px] whitespace-nowrap text-[13.3px] font-medium leading-[20px] tracking-[-0.012em] text-[#16171b]">
              {name}
            </p>
            <p className="absolute left-[44px] top-[29px] whitespace-nowrap text-[10.2px] leading-[16px] text-[#7e7f89]">
              {note}
            </p>
            <span className="absolute right-0 top-[20px] text-[11.5px] text-[#2c2d33]">{role}</span>
          </div>
        ))}
      </div>
    </Stage>
  );
}

const draftBars = [
  [84, 112, 103.5],
  [191.5, 112, 127.5],
  [84, 123.7, 179.5],
  [84, 135.4, 117],
  [74, 147, 58.5],
  [84, 158.7, 156],
  [84, 170.4, 119],
  [206.5, 170.4, 76.5],
  [74, 182, 32.5],
  [110, 182, 60.5],
];

const CodeLine = ({ n, children }) => (
  <div className="flex h-[11.7px] items-center whitespace-pre">
    <span className="w-[32px] pr-[10px] text-right text-[#9fa1a8]">{n}</span>
    <span>{children}</span>
  </div>
);

function Notebook() {
  return (
    <div className="editor-shadow absolute left-[21.5px] top-[150.5px] h-[193.5px] w-[341px] overflow-hidden rounded-[10px] bg-white">
      <div className="absolute inset-x-0 top-0 h-[25px] border-b border-[#eceef2] bg-[#f8f9fb]">
        <span className="absolute left-[6px] top-[9px] h-[6px] w-[6px] rounded-full bg-[#ff5f57]/30" />
        <span className="absolute left-[15px] top-[9px] h-[6px] w-[6px] rounded-full bg-[#febc2e]/30" />
        <span className="absolute left-[24px] top-[9px] h-[6px] w-[6px] rounded-full bg-[#28c840]/30" />
        <div className="absolute left-[150px] top-[4px] h-[17px] rounded-[3px] px-[6px] text-[9.5px] leading-[17px] text-[#8b8d96] shadow-[inset_0_0_0_1px_#e1e3e8]">
          pool_price.py
        </div>
      </div>
      <div className="font-code absolute left-[25px] top-[36.5px] text-[9.4px] text-[#24262d]">
        <CodeLine n={1}>
          <span className="text-[#9b9da5]"> # Why did the pool price fall?</span>
        </CodeLine>
        <CodeLine n={2} />
        <CodeLine n={3}>
          <span className="text-[#a626c5]"> import</span> pandas <span className="text-[#a626c5]">as</span> pd
        </CodeLine>
        <CodeLine n={4} />
        <CodeLine n={5}>
          {' '}
          prices = pd.<span className="text-[#2f6fd6]">read_csv</span>(
          <span className="text-[#23883a]">'aeso_annual.csv'</span>)
        </CodeLine>
        {[6, 7, 8, 9, 10, 11, 12, 13, 14].map((n) => (
          <CodeLine key={n} n={n} />
        ))}
      </div>
      {draftBars.map(([x, y, width], index) => (
        <span key={index} className="skeleton absolute h-[8px]" style={{ left: x, top: y, width }} />
      ))}
    </div>
  );
}

function SplitCard() {
  const [position, setPosition] = useState(50);
  const clipLeft = `inset(0 ${100 - position}% 0 0)`;
  const clipRight = `inset(0 0 0 ${position}%)`;
  const lineX = (position / 100) * 384;

  return (
    <Stage w={384} h={366} className="overflow-hidden rounded-[28px]">
      <div className="feature-surface absolute inset-0" />

      <div className="absolute inset-0" style={{ clipPath: clipLeft }}>
        <div className="absolute left-[10px] top-[10px] h-[345px] w-[364px] rounded-[14px] shadow-[inset_0_0_0_2px_#49ba61]" />
        <span className="absolute left-[24px] top-[24px] grid h-[29px] w-[96px] place-items-center rounded-[6px] bg-[#2e6f40] text-[11.4px] font-medium text-white">
          After review
        </span>
        <div className="absolute left-[24px] top-[66px] h-[120px] w-[336px] rounded-[10px] bg-[#e3e6f1]/90" />
      </div>

      <div className="absolute inset-0" style={{ clipPath: clipRight }}>
        <span className="absolute left-[262px] top-[24px] grid h-[29px] w-[98px] place-items-center rounded-[6px] bg-[#686c75] text-[11.4px] font-medium text-white">
          Your first draft
        </span>
      </div>

      <Notebook />

      <div className="absolute inset-0" style={{ clipPath: clipLeft }}>
        <div className="absolute left-[42px] top-[81px] text-[#23242a]">
          <p className="font-display flex items-center gap-[4px] text-[12.5px] font-medium leading-[16px] tracking-[-0.01em]">
            <Spark size={13} />
            Avery’s note
          </p>
          <div className="mt-[8px] text-[12px] leading-[19.5px] tracking-[-0.008em]">
            <p className="whitespace-nowrap">
              Split the drop into{' '}
              <code className="font-code rounded-[4px] bg-[#dbe5fb] px-[3px] py-[1px] text-[10.4px] text-[#3b6ff0]">
                supply
              </code>{' '}
              and{' '}
              <code className="font-code rounded-[4px] bg-[#dbe5fb] px-[3px] py-[1px] text-[10.4px] text-[#3b6ff0]">
                demand
              </code>
            </p>
            <p>before you explain it.</p>
          </div>
        </div>
      </div>

      <div className="absolute inset-y-0 w-[1px] bg-[#23252b]" style={{ left: lineX }} />
      <input
        type="range"
        min="4"
        max="96"
        value={position}
        onChange={(event) => setPosition(Number(event.target.value))}
        aria-label="Compare your first draft with the reviewed version"
        className="split-range absolute inset-0 z-10 m-0 h-full w-full"
      />
      <div
        className="split-handle absolute top-[170.5px] z-[5] flex h-[24px] w-[24px] -translate-x-1/2 items-center justify-center gap-[3px] rounded-full bg-[#2a2c32] text-white"
        style={{ left: lineX }}
      >
        <svg
          width="5"
          height="9"
          viewBox="0 0 5 9"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          aria-hidden="true"
        >
          <path d="M4 1 1 4.5 4 8" />
        </svg>
        <svg
          width="5"
          height="9"
          viewBox="0 0 5 9"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          aria-hidden="true"
        >
          <path d="m1 1 3 3.5L1 8" />
        </svg>
      </div>
    </Stage>
  );
}

const paces = [
  ['3', 'hrs'],
  ['6', 'hrs'],
  ['10', 'hrs'],
  ['15', 'hrs'],
];

function PaceCard() {
  return (
    <Stage w={384} h={366} className="overflow-hidden rounded-[28px]">
      <div className="feature-surface absolute inset-0" />
      <img
        src={CAMPUS}
        alt="Your board, with every stop on your plan"
        className="absolute left-[24px] top-[24px] h-[246px] w-[336px] rounded-t-[12px] object-cover"
      />
      <div className="absolute left-[24px] top-[270px] h-[72px] w-[336px] rounded-b-[12px] bg-[linear-gradient(180deg,#e8e9ee,#eaebf0)]">
        {paces.map(([hours, unit], index) => (
          <div
            key={hours}
            className={`key-cap absolute top-[12px] h-[48px] w-[72px] rounded-[9px] pl-[13px] pt-[7px] text-[#111] ${
              index === 1 ? 'shadow-[inset_0_0_0_2px_#3b6ff0]' : ''
            }`}
            style={{ left: 12 + index * 80 }}
          >
            <p className="text-[15px] font-medium leading-[17px]">{hours}</p>
            <p className="text-[10.5px] leading-[15px] text-[#666]">{unit} a week</p>
          </div>
        ))}
      </div>
    </Stage>
  );
}

const promises = [
  {
    Card: TeamCard,
    lead: 'A team from day one.',
    body: 'A manager runs each project and a coach stays with you the whole way.',
  },
  {
    Card: SplitCard,
    lead: 'Feedback you can see.',
    body: 'Drag to compare your first draft with the version after your manager’s review.',
  },
  {
    Card: PaceCard,
    lead: 'Your pace, your plan.',
    body: 'Tell us your goal and your hours. Flint lays out every project on your board.',
  },
];

const tools = [
  ['python', 'Python'],
  ['pandas', 'pandas'],
  ['googlesheets', 'Google Sheets'],
  ['jupyter', 'Jupyter'],
  ['anthropic', 'Claude'],
];

function PromiseSection() {
  return (
    <section className="mt-[120px] sm:mt-[261px]">
      <SectionHeading
        title="Built for Alberta’s next jobs"
        subtitle="Real work, a real team around you, and proof you can show an employer."
      />
      <div className="mx-auto mt-[32px] grid max-w-[1248px] gap-[40px] px-4 sm:mt-[65px] md:grid-cols-3 md:gap-[32px]">
        {promises.map(({ Card, lead, body }) => (
          <div key={lead}>
            <Card />
            <p className="mt-[26px] text-[19px] leading-[27.5px] tracking-[-0.022em] text-[#6e7079]">
              <span className="font-medium tracking-[-0.014em] text-[#23242a]">{lead}</span> {body}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-[60px] px-4 text-center text-[11.8px] font-medium uppercase leading-[16px] tracking-[0.15em] text-[#868995] sm:mt-[80px]">
        Work in the tools teams use
      </p>
      <ul className="mx-auto mt-[24px] flex max-w-[900px] flex-wrap items-center justify-center gap-x-[58px] gap-y-3 px-4 text-[15.7px] text-[#4b4d57]">
        {tools.map(([key, name]) => (
          <li key={key} className="flex items-center gap-[14px]">
            <img src={`/assets/roles/tools/${key}.svg`} alt="" className="h-[22px] w-[22px]" />
            {name}
          </li>
        ))}
      </ul>
    </section>
  );
}

function RoleCard({ role }) {
  return (
    <li className="feature-surface flex flex-col rounded-[24px] p-[22px]">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-[22px] font-medium leading-[1.15] tracking-[-0.02em] text-[#17171c]">
          {role.title}
        </h3>
        {role.tag && (
          <span className="rounded-full bg-white/70 px-[10px] py-[3px] text-[12px] font-medium text-[#3b6ff0]">
            {role.tag}
          </span>
        )}
      </div>
      <ul className="mt-[14px] flex flex-col gap-[6px] text-[14.5px] leading-[20px] text-[#4b4d57]">
        {role.projects.slice(0, 3).map((project) => (
          <li key={project} className="flex gap-[8px]">
            <span className="mt-[8px] h-[4px] w-[4px] shrink-0 rounded-full bg-[#8b8e9b]" />
            {project}
          </li>
        ))}
      </ul>
      <div className="mt-auto flex items-center gap-[8px] pt-[18px]">
        {role.tools.slice(0, 4).map((tool) => (
          <span
            key={tool.name}
            title={tool.name}
            className="grid h-[30px] w-[30px] place-items-center rounded-[8px] bg-white/70"
          >
            <img src={tool.src} alt={tool.name} className="h-[16px] w-[16px] object-contain" />
          </span>
        ))}
      </div>
    </li>
  );
}

function RolesSection() {
  const popular = roles.filter((role) => role.popular);
  return (
    <section id="roles" className="mx-auto mt-[120px] max-w-[1248px] scroll-mt-[40px] px-4 sm:mt-[261px]">
      <h2 className="font-display text-[34px] font-medium leading-[1.14] sm:text-[56px]">
        <span className="heading-fade">Pick the job you want</span>
      </h2>
      <p className="mt-[15px] max-w-[640px] text-[16px] leading-[28px] text-[#8b8e9b] sm:text-[17.4px]">
        The roles growing in Alberta, each with its own set of projects. Not on the list? Tell us yours and Flint builds
        the plan.
      </p>
      <ul className="mt-[40px] grid gap-[20px] sm:grid-cols-2 lg:grid-cols-4">
        {popular.map((role) => (
          <RoleCard key={role.id} role={role} />
        ))}
      </ul>
    </section>
  );
}

function ChatCard() {
  const lines = [
    ['Avery', 'Pool price fell 53% last year. Why?'],
    ['You', 'New wind and solar came online faster than demand grew.'],
    ['Avery', 'Show me. Which number moved first?'],
    ['You', 'Supply. Installed renewables rose before load did.'],
    ['Avery', 'Good. Now what does it mean for a retailer?'],
    ['You', 'Buy less forward power at last year’s price.'],
  ];
  return (
    <Stage w={464} h={592} className="overflow-hidden rounded-[24px]">
      <div className="feature-surface absolute inset-0" />
      <div className="absolute left-[47px] top-[47px] h-[489px] w-[352px] rounded-[12px] bg-white/35 shadow-[0_8px_18px_rgba(90,100,140,0.14)]" />
      <div className="chat-sheet absolute left-[52.5px] top-[53px] h-[477px] w-[341px] rounded-[10px] shadow-[0_0_0_1px_rgba(255,255,255,0.4)]">
        <p className="absolute left-[29.5px] top-[30px] whitespace-nowrap text-[9.8px] leading-[14px] text-[#676a78]">
          Stop 3 · Energy Analyst
        </p>
        <h3 className="absolute left-[30px] top-[49px] w-[265px] text-[19.5px] font-medium leading-[25px] tracking-[-0.008em] text-[#555866]">
          Why Alberta’s Power Prices Halved
        </h3>
        <div className="absolute left-[25px] top-[142px] flex h-[22px] items-center rounded-[5px] bg-[#eef0f4] pl-[6px] pr-[10px] text-[9.8px] text-[#7d8093]">
          Brief
          <span className="mx-[10px] grid h-[18px] w-[50px] place-items-center rounded-[4px] bg-white text-[9.4px] font-medium text-[#434552] shadow-[0_0_1px_rgba(0,0,0,0.25)]">
            Chat
          </span>
          Review
        </div>
        <div className="absolute left-[30px] top-[176px] w-[280px]">
          {lines.map(([who, line], index) => (
            <div key={index} className="h-[46px]">
              <p className="text-[10.1px] leading-[14px]">
                <span className={who === 'You' ? 'text-[#31b9ee]' : 'text-[#55586a]'}>{who}</span>
              </p>
              <p className="mt-[2.5px] text-[10.1px] leading-[14px] text-[#55586a]">{line}</p>
            </div>
          ))}
        </div>
      </div>
    </Stage>
  );
}

const stats = [
  [
    '53',
    '%',
    'Real Alberta data',
    'Alberta’s average pool price fell from $133.63 to $62.78/MWh between 2023 and 2024. Your first brief asks why.',
  ],
  ['4', '', 'Scores per review', 'Insight, quality, communication and reliability, on every project you submit.'],
  ['1', '', 'Portfolio at the end', 'Every reviewed project lands in a portfolio you can bring to an interview.'],
];

function DataSection() {
  return (
    <section className="mx-auto mt-[120px] grid max-w-[1184px] items-start gap-[40px] px-4 sm:mt-[340px] lg:grid-cols-[464px_1fr] lg:gap-[73px]">
      <ChatCard />
      <div>
        <h2 className="font-display text-[34px] font-medium leading-[1.14] tracking-[-0.026em] text-[#1e1f25] sm:text-[48px] lg:mt-[5px]">
          Work that counts
        </h2>
        <div className="mt-[24px] sm:mt-[49.5px]">
          {stats.map(([value, unit, title, body], index) => (
            <div
              key={title}
              className={`grid gap-x-[20px] py-[20px] sm:grid-cols-[171px_1fr] sm:py-0 sm:pt-[31px] ${
                index < 2 ? 'border-b border-[#ececf0] sm:h-[173px]' : 'sm:h-[140px]'
              }`}
            >
              <p className="font-display text-[48px] font-normal leading-[48px] tracking-[-0.01em] text-[#111] sm:mt-[17px]">
                {value}
                {unit && <span className="text-[30px]">{unit}</span>}
              </p>
              <div>
                <h3 className="font-display text-[35.8px] font-normal leading-[44px] tracking-[0.002em] text-[#1e1f25] max-sm:text-[28px]">
                  {title}
                </h3>
                <p className="mt-[8px] max-w-[408px] text-[17.2px] leading-[28px] text-[#979aa5]">{body}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[13px] text-[#979aa5]">Source: {poolPrice.source}.</p>
      </div>
    </section>
  );
}

function FaqItem({ question, answer, last }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={last ? '' : 'border-b border-[#e6e6e9]'}>
      <h3>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="flex min-h-[68px] w-full items-center justify-between gap-4 text-left text-[20px] font-medium leading-[28px] tracking-[-0.04em] text-[#111] sm:text-[23.5px]"
        >
          {question}
          <Chevron
            size={32}
            sw={1.5}
            className="faq-chevron -mr-[2px] shrink-0 text-[#60626a]"
            style={{ transform: open ? 'rotate(180deg)' : undefined }}
          />
        </button>
      </h3>
      <div className="faq-panel" data-open={open}>
        <div className="overflow-hidden">
          <p className="max-w-[860px] pb-[22px] text-[17px] leading-[27px] text-[#6e7079]">{answer}</p>
        </div>
      </div>
    </div>
  );
}

function Faq() {
  const questions = faq.filter((item) => item.suggested !== false).slice(0, 7);
  return (
    <section id="faq" className="mx-auto mt-[120px] max-w-[1248px] scroll-mt-[40px] px-4 sm:mt-[258px]">
      <h2 className="font-display text-[30px] font-medium leading-[46px] tracking-[-0.04em] text-black sm:text-[40px]">
        Frequently asked questions
      </h2>
      <div className="mt-[46px]">
        {questions.map(({ question, answer }, index) => (
          <FaqItem key={question} question={question} answer={answer} last={index === questions.length - 1} />
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <div className="page-end-fade relative mt-[80px] overflow-hidden pt-[1px] sm:mt-[127px]">
      <div className="relative mx-auto max-w-[1248px] px-4">
        <img
          src={`${IMG}/cta-keys.jpg`}
          alt=""
          className="keys-mask pointer-events-none absolute left-[749px] top-[175px] hidden h-[340px] w-[460px] max-w-none min-[1240px]:block"
        />
        <div className="relative pt-[160px] sm:pt-[220px]">
          <h2 className="text-[24px] font-medium leading-[35px] tracking-[-0.047em] sm:text-[28px]">
            <span className="block text-black">Real work experience for Alberta’s next jobs.</span>
            <span className="cta-fade block">Start your first project today.</span>
          </h2>
          <StartButton className="btn-start-soft mt-[29px] h-[44px] rounded-[6px] px-6 text-[16px] font-semibold" />
        </div>

        <footer className="relative mt-[120px] flex flex-wrap items-center justify-between gap-4 border-t border-[#ced3e0] py-[24px] sm:mt-[211px]">
          <Logo tone="dark" className="text-[#0d0e12]" />
          <p className="text-[13px] leading-[20px] tracking-[-0.018em] text-[#6e7180]">
            © 2026 Flint. Made in Alberta for HackTheChange.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default function LandingPage() {
  useAppTheme('landing');

  return (
    <main>
      <title>Flint · Learn a job by doing it</title>
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="stylesheet" href={FONTS} precedence="default" />
      <Hero />
      <HowSection />
      <ReviewSection />
      <PromiseSection />
      <RolesSection />
      <DataSection />
      <Faq />
      <Footer />
    </main>
  );
}
