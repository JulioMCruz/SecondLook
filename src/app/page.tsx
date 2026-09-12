import Link from "next/link";
import LandingReveal from "@/components/landing/LandingReveal";
import ProcessWalkthrough from "@/components/landing/ProcessWalkthrough";

export default function HomePage() {
  return (
    <main className="relative mx-auto flex min-h-full w-full max-w-5xl flex-col px-6 py-10">
      <LandingReveal />
      <div className="decor sl-hero-glow" aria-hidden />
      <div className="decor sl-embers" aria-hidden />

      <header className="relative flex items-center justify-between">
        <p className="text-sm font-semibold tracking-wide">SecondLook</p>
        <Link
          href="/login"
          className="rounded-full border border-[var(--line)] bg-white/70 px-4 py-2 text-sm font-medium"
        >
          Sign in
        </Link>
      </header>

      <section className="relative mt-16 max-w-2xl sl-reveal sl-in" data-sl-reveal>
        <p className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">A receipt for the pitch</p>
        <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
          Paste the claim they sold you. Keep the receipt.
        </h1>
        <p className="mt-5 text-lg leading-7 text-[var(--muted)]">
          Sales decks say every competitor already automated the work. SecondLook runs a free first look,
          shows the gap, and unlocks a paid follow-up so you keep a Fact / Hypothesis / Unknown brief — not
          another tool to buy.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/login?demo=1" className="sl-cta-glow rounded-full bg-[var(--green)] px-6 py-3 text-sm font-medium text-white">
            Try with demo
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-[var(--line)] bg-white/80 px-6 py-3 text-sm font-medium"
          >
            Sign in
          </Link>
        </div>
        <p className="mt-4 text-xs text-[var(--muted)]">
          Judges: demo account, no email. First look is free. Second look uses a Test Store purchase.
        </p>
      </section>

      <ProcessWalkthrough />

      <section className="relative mt-16 grid gap-4 md:grid-cols-3" data-sl-reveal>
        {[
          {
            k: "01 Free",
            t: "First look",
            d: "Search the live web, save sources, and name the hole in the pitch.",
          },
          {
            k: "02 Paid",
            t: "Second look",
            d: "Entitlement second_look unlocks the follow-up search. Fail stays locked.",
          },
          {
            k: "03 Yours",
            t: "The brief",
            d: "Fact, Hypothesis, or Unknown — plus time and cost — stored on your account.",
          },
        ].map((card) => (
          <article key={card.k} className="sl-card-glow rounded-2xl border border-[var(--line)] bg-white/80 p-5">
            <p className="font-mono text-[10px] tracking-widest text-[var(--muted)]">{card.k}</p>
            <h3 className="mt-2 text-base font-semibold">{card.t}</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{card.d}</p>
          </article>
        ))}
      </section>

      <section className="sl-card-glow relative mt-10 rounded-2xl border border-[var(--line)] bg-white/80 p-6" data-sl-reveal>
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

      <footer className="relative mt-16 flex flex-wrap items-center justify-between gap-3 pb-8 text-xs text-[var(--muted)]">
        <p>SecondLook · keep the receipt</p>
        <Link href="/login?demo=1" className="font-medium text-[var(--green)]">
          Open the demo →
        </Link>
      </footer>
    </main>
  );
}
