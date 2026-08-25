export default function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6">
      {eyebrow && (
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-600" aria-hidden="true" />
          {eyebrow}
        </p>
      )}
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">{description}</p>
    </div>
  );
}
