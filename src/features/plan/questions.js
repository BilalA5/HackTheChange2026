export const startingPoints = [
  {
    id: 'new',
    label: "I'm new to this",
    detail: 'Student or first job hunt. Start me from the ground up.',
    pace: 1.25,
  },
  {
    id: 'switching',
    label: "I'm switching careers",
    detail: 'I have work experience, just not in this field.',
    pace: 1.1,
  },
  {
    id: 'some',
    label: "I've built a few things",
    detail: 'Coursework or side projects. I know the basics.',
    pace: 1,
  },
  {
    id: 'working',
    label: 'I already work in the field',
    detail: 'I want harder projects and a promotion-ready portfolio.',
    pace: 0.85,
  },
];

export const paces = [
  { hours: 3, label: '3 hrs', detail: 'A couple of evenings' },
  { hours: 6, label: '6 hrs', detail: 'An hour most days' },
  { hours: 10, label: '10 hrs', detail: 'A serious side project' },
  { hours: 20, label: '20 hrs', detail: 'Half-time, all in' },
];

export const startingPointById = Object.fromEntries(startingPoints.map((option) => [option.id, option]));
