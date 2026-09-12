import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative mx-auto flex min-h-full w-full max-w-5xl flex-col px-6 py-10">
      <div
        className="decor absolute inset-x-0 top-0 h-64"
        aria-hidden
        style={{
          background:
            "radial-gradient(600px 200px at 20% 0%, rgba(31,107,74,0.16), transparent 70%)",
        }}
      />
      <header className="relative flex items-center justify-between">
        <p className="text-sm font-semibold tracking-wide">SecondLook</p>
        <Link
          href="/login"
          className="rounded-full bg-[var(--green)] px-4 py-2 text-sm font-medium text-white"
        >
          Sign in
        </Link>
      </header>

      <section className="relative mt-16 max-w-2xl">
        <p className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">A receipt for the pitch</p>
        <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
          Paste the claim they sold you. Keep the receipt.
        </h1>
        <p className="mt-5 text-lg leading-7 text-[var(--muted)]">
          First look is free. Unlock the second look to chase the gap, then save a Fact / Hypothesis brief in your account.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="rounded-full bg-[var(--green)] px-5 py-3 text-sm font-medium text-white"
          >
            Sign in
          </Link>
          <Link
            href="/login?demo=1"
            className="rounded-full border border-[var(--line)] px-5 py-3 text-sm font-medium"
          >
            Try with demo
          </Link>
        </div>
      </section>

      <section className="relative mt-16 rounded-2xl border border-[var(--line)] bg-white/70 p-6">
        <p className="text-xs uppercase tracking-wider text-[var(--muted)]">Sample brief</p>
        <p className="mt-3 text-sm text-[var(--muted)]">Claim</p>
        <p className="text-base font-medium">All my competitors already answer WhatsApp with AI.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--green)]">Hypothesis</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Vendor pages talk about WhatsApp bots. Local operator evidence is thin. Do not treat this as a closed fact.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider">Where</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Claim is generic. Sources are national marketing sites, not your street.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
