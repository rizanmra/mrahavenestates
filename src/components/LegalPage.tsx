export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="pt-28">
      <section className="px-6 py-16 lg:px-10">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-4xl text-white">{title}</h1>
          <div className="mt-8 space-y-4 leading-relaxed text-[color:var(--muted)]">
            {children}
          </div>
        </div>
      </section>
    </div>
  );
}
