"use client";

import Link from "next/link";
import ContactForm from "@/components/landing/ContactForm";
import LandingReveal from "@/components/landing/LandingReveal";
import ProcessRail from "@/components/landing/ProcessRail";
import { LangSwitch, useT } from "@/components/LocaleProvider";

export default function HomePage() {
  const { t } = useT();
  const stamps = [
    { k: t.fact, d: t.stampFact },
    { k: t.hypothesis, d: t.stampHyp },
    { k: t.unknown, d: t.stampUnk },
  ];

  return (
    <main className="relative min-h-full w-full">
      <LandingReveal />

      <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-[var(--line)]/70 bg-[var(--paper)]/92 px-6 py-3 backdrop-blur">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="" className="h-8 w-8 rounded-md object-cover object-[center_38%]" />
          <span className="text-sm font-semibold tracking-wide">SecondLook</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <a href="#how" className="hidden text-[var(--muted)] sm:inline">
            {t.nav.how}
          </a>
          <a href="#you-get" className="hidden text-[var(--muted)] md:inline">
            {t.nav.get}
          </a>
          <a href="#contact" className="text-[var(--muted)]">
            {t.nav.contact}
          </a>
          <LangSwitch />
          <Link
            href="/login"
            className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-medium"
          >
            {t.nav.signIn}
          </Link>
        </nav>
      </header>

      <section className="relative px-6 pt-28 pb-8 md:pt-32 md:pb-12">
        <div className="decor sl-hero-glow" aria-hidden />
        <div className="decor sl-embers" aria-hidden />

        <div className="relative mx-auto grid max-w-5xl items-start gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          <div data-sl-reveal className="sl-reveal sl-in max-w-xl">
            <p className="text-sm text-[var(--muted)]">{t.heroKicker}</p>
            <h1 className="sl-serif mt-4 text-[2.7rem] font-medium leading-[1.08] tracking-tight md:text-6xl">
              {t.heroTitle1}
              <span className="mt-2 block text-[var(--green)]">{t.heroTitle2}</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-[var(--muted)]">{t.heroBody}</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/login?demo=1"
                className="sl-cta-glow inline-flex min-h-11 items-center rounded-full bg-[var(--green)] px-6 py-3 text-sm font-medium text-white"
              >
                {t.tryDemo}
              </Link>
              <a href="#how" className="text-sm font-medium text-[var(--green)]">
                {t.seeWorkflow}
              </a>
            </div>
            <p className="mt-3 text-xs text-[var(--muted)]">{t.judgesNote}</p>
          </div>

          <article className="sl-receipt relative lg:-rotate-1" data-sl-reveal>
            <p className="font-mono text-[10px] tracking-widest text-[var(--muted)]">{t.receiptKicker}</p>
            <p className="mt-5 text-xs text-[var(--muted)]">{t.youPasted}</p>
            <p className="mt-1 text-base font-medium leading-6">{t.sampleClaim}</p>
            <div className="mt-5 grid gap-4 border-t border-dashed border-[var(--line)] pt-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--green)]">
                  {t.youReceived}
                </p>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{t.sampleBrief}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                  {t.alsoOnFile}
                </p>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{t.alsoOnFileBody}</p>
              </div>
            </div>
            <p className="mt-6 font-mono text-[10px] text-[var(--muted)]">{t.accountFile}</p>
          </article>
        </div>
      </section>

      <section id="you-get" className="mx-auto max-w-5xl px-6 py-12 md:py-16">
        <p className="text-sm text-[var(--muted)]">{t.gainKicker}</p>
        <h2 className="sl-serif mt-2 max-w-2xl text-3xl font-medium tracking-tight md:text-4xl">
          {t.gainTitle}
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <article className="rounded-2xl border border-[var(--line)] bg-white p-6" data-sl-reveal>
            <p className="font-mono text-[10px] tracking-widest text-[var(--muted)]">{t.alwaysFree}</p>
            <h3 className="sl-serif mt-2 text-2xl font-medium">{t.firstLook}</h3>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{t.afterPaste}</p>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-[var(--ink)]">
              <li>{t.gainFree1}</li>
              <li>{t.gainFree2}</li>
              <li>{t.gainFree3}</li>
            </ul>
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{t.gainFreeNote}</p>
          </article>
          <article className="rounded-2xl border border-[var(--line)] bg-white p-6" data-sl-reveal>
            <p className="font-mono text-[10px] tracking-widest text-[var(--green)]">{t.ifYouPay}</p>
            <h3 className="sl-serif mt-2 text-2xl font-medium">{t.writtenBrief}</h3>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{t.unlockAdds}</p>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-[var(--ink)]">
              <li>{t.gainPaid1}</li>
              <li>{t.gainPaid2}</li>
              <li>{t.gainPaid3}</li>
            </ul>
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{t.gainPaidNote}</p>
          </article>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-5xl px-6 py-8 md:py-12">
        <p className="text-sm text-[var(--muted)]">{t.workflow}</p>
        <h2 className="sl-serif mt-2 max-w-2xl text-3xl font-medium tracking-tight md:text-4xl">
          {t.workflowTitle}
        </h2>
        <ol className="mt-10 divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {t.walk.map((step) => (
            <li key={step.n} className="grid gap-2 py-5 md:grid-cols-[4.5rem_11rem_1fr] md:gap-6 md:py-6">
              <p className="font-mono text-xs text-[var(--green)]">{step.n}</p>
              <p className="text-sm font-semibold">{step.t}</p>
              <p className="text-sm leading-6 text-[var(--muted)]">{step.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <ProcessRail />

      <section className="mx-auto max-w-5xl px-6 py-12 md:py-16" data-sl-reveal>
        <p className="text-sm text-[var(--muted)]">{t.whoKicker}</p>
        <h2 className="sl-serif mt-2 max-w-2xl text-3xl font-medium tracking-tight md:text-4xl">
          {t.whoTitle}
        </h2>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)]">{t.whoBody1}</p>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">{t.whoBody2}</p>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-8 md:py-12" data-sl-reveal>
        <p className="text-sm text-[var(--muted)]">{t.stampsKicker}</p>
        <h2 className="sl-serif mt-2 text-3xl font-medium tracking-tight">{t.stampsTitle}</h2>
        <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
          {stamps.map((row, i) => (
            <div
              key={row.k}
              className={`grid gap-2 px-5 py-5 md:grid-cols-[9rem_1fr] md:items-baseline ${
                i !== 0 ? "border-t border-[var(--line)]" : ""
              }`}
            >
              <p className="font-mono text-sm text-[var(--green)]">{row.k}</p>
              <p className="text-sm leading-6 text-[var(--muted)]">{row.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="contact" className="mx-auto grid max-w-5xl gap-10 px-6 py-16 md:grid-cols-[0.9fr_1.1fr] md:py-20">
        <div>
          <p className="text-sm text-[var(--muted)]">{t.contactKicker}</p>
          <h2 className="sl-serif mt-2 text-3xl font-medium tracking-tight">{t.contactTitle}</h2>
          <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
            {t.contactBody}{" "}
            <a className="text-[var(--green)]" href="mailto:julio.cruz@eb-ms.net">
              julio.cruz@eb-ms.net
            </a>
            .
          </p>
        </div>
        <ContactForm />
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3 px-6 pb-10 text-xs text-[var(--muted)]">
        <p>{t.footerTag}</p>
        <div className="flex gap-4">
          <a href="#how">{t.workflow}</a>
          <a href="#contact">{t.nav.contact}</a>
          <Link href="/login?demo=1" className="font-medium text-[var(--green)]">
            {t.openDemo}
          </Link>
        </div>
      </footer>
    </main>
  );
}
