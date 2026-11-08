function groupByCompany(stops) {
  const groups = new Map();
  for (const stop of stops) {
    const key = `${stop.map.x},${stop.map.y}`;
    if (!groups.has(key)) groups.set(key, { key, map: stop.map, company: stop.company, logo: stop.logo, stops: [] });
    groups.get(key).stops.push(stop);
  }
  return [...groups.values()];
}

function Pin({ group, statusOf, selectedId, onSelect }) {
  const statuses = group.stops.map(statusOf);
  const here = statuses.includes('current');
  const finished = statuses.every((status) => status === 'done');
  const selected = group.stops.some((stop) => stop.id === selectedId);
  const target = group.stops.find((stop) => statusOf(stop) === 'current') ?? group.stops[0];
  const prominent = here || selected;

  return (
    <button
      type="button"
      onClick={() => onSelect(target.id)}
      aria-label={`${group.company}${here ? ', you are here' : ''}`}
      className="group pointer-events-auto absolute -translate-x-1/2 -translate-y-full"
      style={{ left: `${group.map.x}%`, top: `${group.map.y}%`, zIndex: prominent ? 2 : 1 }}
    >
      {here && <span className="app-ping absolute left-1/2 top-full h-9 w-9 rounded-full bg-white/50" />}
      <span
        className={`relative flex items-center gap-2 whitespace-nowrap rounded-full shadow-[0_10px_24px_-10px_rgba(0,0,0,.7)] transition duration-200 group-hover:-translate-y-0.5 ${
          prominent
            ? 'h-[34px] bg-white pl-[10px] pr-[14px] text-[13.5px] text-[#141416]'
            : 'h-[28px] bg-[#141416]/80 pl-[8px] pr-[11px] text-[12.5px] text-white/85 backdrop-blur-md'
        } ${selected && !here ? 'ring-2 ring-spark ring-offset-2 ring-offset-transparent' : ''}`}
      >
        <img src={group.logo} alt="" className={`h-4 w-4 object-contain ${prominent ? 'brightness-0' : ''}`} />
        <b className="font-medium">{group.company}</b>
        {here && (
          <span className="flex items-center gap-[6px] text-spark-deep">
            <i className="h-[6px] w-[6px] rounded-full bg-spark" />
            You're here
          </span>
        )}
        {!here && finished && <span className="text-spark">Done</span>}
      </span>
      <span
        className={`absolute left-1/2 top-full h-[7px] w-[2px] -translate-x-1/2 ${prominent ? 'bg-white' : 'bg-[#141416]/80'}`}
      />
    </button>
  );
}

export default function CompanyPins({ stops, statusOf, selectedId, onSelect }) {
  return groupByCompany(stops).map((group) => (
    <Pin key={group.key} group={group} statusOf={statusOf} selectedId={selectedId} onSelect={onSelect} />
  ));
}
