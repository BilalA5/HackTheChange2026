export const IMG = '/assets/onboarding';

export const guide = {
  name: 'Rowan',
  title: 'Your guide',
  role: 'Manager',
  photo: `${IMG}/guide-face.jpg`,
  wide: `${IMG}/guide-wide.jpg`,
};

export const learner = {
  name: 'Sanjay Chauhan',
  firstName: 'Sanjay',
  role: 'Product Designer',
  photo: `${IMG}/learner-sanjay.jpg`,
};

export const steps = [
  { id: 'brief', short: 'Brief' },
  { id: 'kickoff', short: 'Kickoff' },
  { id: 'understanding', short: 'Understanding' },
  { id: 'workspace', short: 'Workspace' },
  { id: 'feedback', short: 'Feedback' },
  { id: 'presentation', short: 'Presentation' },
  { id: 'portfolio', short: 'Portfolio' },
  { id: 'jobs', short: 'Get hired' },
];

export const lines = {
  permissions: 'Before we go in, turn these on for a smooth experience.',
  scenarios: "These are the scenarios you'll work through to get you job ready.",
  tools: "You'll use real tools and workflows that companies are actually looking for.",
  sayBack: "Hold Space, and say what's on the screen.",
  collaborate:
    'While you work through the project, you can collaborate with your manager, and if you get stuck on anything, just click here for a guided walkthrough.',
  present:
    "Once you've completed the project, you'll present it to your team, and they'll ask you questions, just like in the real world.",
  portfolio: "The scenario's done, and your project gets added to your portfolio.",
  levelUp: 'As you complete projects and level up, more and more roles open up for you.',
};

export const caseStudy = {
  company: 'Airbnb',
  title: 'Reducing Host Cancellations',
  titleAt: 'Reducing Host Cancellations at Airbnb',
  category: 'Cost reduction',
  tools: [
    { name: 'Claude', icon: `${IMG}/logo-claude.svg` },
    { name: 'Google Sheets', icon: `${IMG}/logo-sheets.svg` },
    { name: 'ChatGPT', icon: `${IMG}/logo-chatgpt.svg` },
  ],
  workflows: [
    'Group the cancellations by reason with Claude',
    'Price the problem and the fix in Google Sheets',
    'Pressure test your plan with ChatGPT',
  ],
  skills: ['Root cause analysis', 'Trend analysis', 'Financial modelling', 'Presenting to a team'],
  stages: [
    { title: 'Create your proposal template', time: '15 min' },
    { title: 'Analyze the host cancellation trends', time: '30 min' },
    { title: 'Find the root cause of cancellations', time: '35 min' },
    { title: 'Perform an operational cost analysis', time: '40 min' },
    { title: 'Map your recommendations', time: '30 min' },
    { title: 'Finalize and submit your proposal', time: '20 min' },
    { title: 'Present your proposal to stakeholders', time: '25 min' },
  ],
  totalTime: '3 hr 15 min',
  deliverables: [{ title: 'Host Cancellation Reduction Proposal', kind: 'PDF (proposal)' }],
  stage: {
    title: 'Find why hosts cancel',
    requirements: ['Name the top reason hosts cancel', 'Back it with the data', 'Say what the fix will cost'],
    resource: 'Cancellations by reason.csv',
    draft: 'Why hosts cancel.pdf',
    upcoming: ['Forecast the impact', 'Build the rollout plan', 'Present to the team'],
  },
};
