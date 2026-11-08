const labels = {
  insight: 'Insight',
  quality: 'Quality',
  communication: 'Communication',
  reliability: 'Reliability',
};

export default function ReviewCard({ review }) {
  return (
    <article className="self-stretch rounded-[15px] border border-[var(--raised-line)] border-l-[3px] border-l-[var(--accent)] bg-[var(--raised)] px-[16px] pb-[18px] pt-[14px]">
      <div className="flex items-center justify-between">
        <h4 className="font-mono-ui text-[9.5px] font-medium uppercase tracking-[0.17em] text-[#9a9a9a]">Review</h4>
        <span className="rounded-full bg-[var(--accent)]/15 px-[10px] py-[3px] text-[12px] font-medium text-[var(--accent)]">
          +{review.xp} XP
        </span>
      </div>
      <p className="mt-[10px] text-[14.5px] leading-[21px] text-[#ededed]">{review.summary}</p>
      <dl className="mt-[16px] grid grid-cols-2 gap-x-[18px] gap-y-[12px]">
        {Object.entries(review.scores).map(([key, score]) => (
          <div key={key}>
            <dt className="flex justify-between text-[12.5px] text-[#a5a29c]">
              {labels[key]}
              <span className="tabular-nums text-[#ededed]">{Math.round(score * 100)}</span>
            </dt>
            <dd className="mt-[6px] h-[4px] rounded-full bg-[#333]">
              <i className="block h-full rounded-full bg-[var(--ring)]" style={{ width: `${score * 100}%` }} />
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
