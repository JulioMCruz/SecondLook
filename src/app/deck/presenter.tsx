"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ExternalLink, FileText, LayoutGrid, Maximize, Play, Printer, StickyNote, X } from "lucide-react";
import styles from "./presenter.module.css";

const slides = [
  { id: "opening", label: "The decision", title: "A confident pitch.\nWhere is the proof?", subtitle: "SecondLook turns a sales claim into a cited evidence brief before you buy.", note: "Start with the owner's decision, not the technology. A confident salesperson creates urgency. SecondLook gives the owner something concrete to question before committing time or money." },
  { id: "customer", label: "The first customer", title: "A small business.\nA consequential purchase.", subtitle: "For owners evaluating an AI tool or service without a dedicated research team.", note: "This is our initial customer hypothesis, not proven demand. Start with owners buying WhatsApp automation or other AI services. The next validation is whether the brief changes a real vendor conversation and earns a paid follow-up." },
  { id: "evidence", label: "The real case", title: "Available tools are not\nproof of universal adoption.", subtitle: "“Every competitor in Miami already uses AI to answer WhatsApp.”", note: "This is the actual claim from the recorded demo. Vendor pages establish that tools are offered. They do not establish how many competitors use them. Insufficient evidence is a useful, honest result—not a claim that the seller is lying." },
  { id: "workflow", label: "How it works", title: "Research the gap.\nKeep the evidence.", subtitle: "One saved assessment connects the original claim to the next useful question.", note: "Walk through the free first look, generated follow-up, verified test purchase and second research pass. Explain that citations link back to saved passages. Do not claim independent source truth or universal accuracy." },
  { id: "deliverable", label: "The deliverable", title: "A brief you can bring\nto the next conversation.", subtitle: "The claim, findings, source passages and vendor questions in one document.", note: "Open PDF preview. This is the real demo assessment exported with the same generator used in the app. Show the executive summary, linked evidence and vendor questions. Email is available to signed-in email users; judges can preview and download directly." },
  { id: "technology", label: "Working integrations", title: "Each integration\nhas a job to do.", subtitle: "Live research, structured review and server-verified access.", note: "Linkup retrieves sources. Nebius plans and reviews structured findings and questions. RevenueCat verifies access before paid operations. The recorded checkout uses Test Store: no real money changes hands. Four EN/ES regression cases passed; this is a small test set." },
  { id: "business", label: "Business hypothesis", title: "Earn trust first.\nCharge for deeper research.", subtitle: "The first look reveals the gap. The paid step investigates it and produces a reusable brief.", note: "Separate implementation from commercial validation. The entitlement gate works in a test environment. Pricing, conversion and willingness to pay are not yet validated. Measure whether people use the questions, return and pay for the next assessment." },
  { id: "demo", label: "See it work", title: "Before you buy,\ncheck the proof.", subtitle: "Try the working product. Inspect the sources. Keep the brief.", note: "Open the live demo in a separate tab. Use the Miami competitors example, run the free assessment, inspect the gap, then demonstrate a failed and valid test purchase. If a provider is slow, use the published video and sample PDF as clearly labeled backups." },
];
const video = "https://www.youtube.com/watch?v=DPstAoHE2j8";
const pdf = "/deck/sample-evidence-brief.pdf";

export default function Deck() {
  const [active, setActive] = useState(0);
  const [presenting, setPresenting] = useState(false);
  const [notes, setNotes] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [notice, setNotice] = useState("");
  const [pdfOpen, setPdfOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const shell = useRef<HTMLElement>(null);
  const start = useRef<number | null>(null);
  const go = useCallback((index: number) => {
    const next = Math.max(0, Math.min(slides.length - 1, index));
    setActive(next);
    window.history.replaceState(null, "", `#${slides[next].id}`);
  }, []);
  const present = (index: number) => { go(index); setPresenting(true); start.current = Date.now(); setElapsed(0); };
  const exit = useCallback(() => {
    setPresenting(false);
    if (document.fullscreenElement) void document.exitFullscreen();
  }, []);
  const fullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (shell.current?.requestFullscreen) await shell.current.requestFullscreen();
      else setNotice("Fullscreen is unavailable. Presentation mode still works in this window.");
    } catch { setNotice("Fullscreen is unavailable. Presentation mode still works in this window."); }
  }, []);
  useEffect(() => {
    const sync = () => {
      const index = slides.findIndex(s => `#${s.id}` === window.location.hash);
      if (index >= 0) setActive(index);
    };
    window.addEventListener("hashchange", sync);
    // Initialize from a shared slide link after hydration.
    const timer = window.setTimeout(sync, 0);
    return () => { window.clearTimeout(timer); window.removeEventListener("hashchange", sync); };
  }, []);
  useEffect(() => {
    if (!presenting) return;
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - (start.current ?? Date.now())) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [presenting]);
  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      if (!presenting || dialog.current?.open || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.target instanceof HTMLElement && event.target.closest("input,textarea,select,[contenteditable=true]")) return;
      if (event.key === " " && event.target instanceof HTMLElement && event.target.closest("button,a")) return;
      const next = ["ArrowRight", "ArrowDown", "PageDown", " "].includes(event.key);
      const previous = ["ArrowLeft", "ArrowUp", "PageUp"].includes(event.key);
      if (next || previous) { event.preventDefault(); go(active + (next ? 1 : -1)); }
      if (event.key === "Home") { event.preventDefault(); go(0); }
      if (event.key === "End") { event.preventDefault(); go(slides.length - 1); }
      if (event.key === "Escape") exit();
      if (event.key.toLowerCase() === "n") setNotes(v => !v);
      if (event.key.toLowerCase() === "f") void fullscreen();
    };
    window.addEventListener("keydown", keyboard);
    return () => window.removeEventListener("keydown", keyboard);
  }, [active, presenting, go, exit, fullscreen]);
  const openPdf = () => { setPdfOpen(true); dialog.current?.showModal(); };

  function visual(index: number) {
    switch (index) {
      case 0: return <div className={styles.receipt}><span className={styles.tag}>A SECOND LOOK</span><blockquote>“Everyone is already using it.”</blockquote><div className={styles.rule} /><p>One sales claim.</p><p>Sources you can inspect.</p><strong>A better question before you buy.</strong><span className={styles.seal}>EVIDENCE BEFORE URGENCY</span></div>;
      case 1: return <div className={styles.stack}>{[["The trigger", "A vendor says you are falling behind."], ["The friction", "You need proof, not another confident answer."], ["The outcome", "Ask the seller for the evidence that matters."]].map(([h,p]) => <article key={h}><span>{h}</span><h3>{p}</h3></article>)}</div>;
      case 2: return <div className={styles.receipt}><span className={styles.warning}>Insufficient evidence</span><h3>What the sources show</h3><p>WhatsApp AI services are marketed to Miami businesses.</p><div className={styles.rule} /><h3>What they do not establish</h3><p>That every competitor has adopted them.</p><a href="https://digismart.io/ai-automation-services-in-miami/" target="_blank" rel="noreferrer">Inspect a cited source <ExternalLink size={15} /></a><small>Actual demo finding · not proof that the claim is false</small></div>;
      case 3: return <ol className={styles.steps}>{[["01", "Start with a claim", "Type or dictate in English or Spanish."], ["02", "Inspect the first look", "Live sources expose missing proof."], ["03", "Unlock a focused search", "Verified access gates deeper research."], ["04", "Keep the brief", "Reviewed findings, passages and questions."]].map(([n,h,p]) => <li key={n}><b>{n}</b><div><h3>{h}</h3><p>{p}</p></div></li>)}</ol>;
      case 4: return <div className={styles.pdfVisual}><button className={styles.pdfPage} onClick={openPdf} aria-label="Preview the three-page evidence PDF"><Image src="/deck/brief-preview.png" alt="First page of the actual SecondLook evidence brief" width={1697} height={2400} /></button><div><span className={styles.tag}>ACTUAL DEMO REPORT</span><h3>Three pages. One decision record.</h3><p>Executive summary<br />Evidence & sources<br />Questions for the vendor</p><button onClick={openPdf}><FileText size={17} /> Preview PDF</button></div></div>;
      case 5: return <div className={styles.stack}>{[["Linkup", "Search the live web", "Retrieved sources stay with the assessment."], ["Nebius", "Structure and review findings", "Exact passages support the inference review."], ["RevenueCat", "Verify paid access", "The server checks the entitlement before paid operations."]].map(([h,p,d]) => <article key={h}><span>{h}</span><h3>{p}</h3><p>{d}</p></article>)}<small>Test Store · no real charge. Four EN/ES regression cases passed; not a general accuracy benchmark.</small></div>;
      case 6: return <div className={styles.stack}><article><span>WORKING TODAY</span><h3>Free first look → gated second look</h3><p>Targeted research and a downloadable evidence brief.</p></article><article><span>NEXT VALIDATION</span><h3>Does it change the buying conversation?</h3><p>Interview owners. Observe vendor follow-ups. Test willingness to pay.</p></article><article><span>FUTURE PRODUCT DIRECTION</span><h3>Bring back the vendor’s answer.</h3><p>Reassess the claim as new evidence arrives. Planned, not implemented.</p></article></div>;
      default: return <div className={styles.demo}><span className={styles.tag}>READY TO INSPECT</span><h3>Choose your walkthrough.</h3><a className={styles.primary} href="/login?demo=1" target="_blank" rel="noreferrer">Open live demo <ExternalLink size={18} /></a><a href={video} target="_blank" rel="noreferrer"><Play size={18} /> Watch the 4K demo</a><button onClick={openPdf}><FileText size={18} /> Preview the sample brief</button><small>No email code needed for the demo. Purchases use a test environment.</small></div>;
    }
  }

  return <main ref={shell} lang="en" className={`${styles.shell} ${presenting ? styles.presenting : ""}`}>
    <header className={styles.toolbar}>
      <Link className={styles.brand} href="/"><Image src="/logo.png" width={32} height={32} alt="" /><strong>SecondLook</strong><span> / Presentation</span></Link>
      <nav aria-label="Presentation tools">
        <button onClick={() => presenting ? exit() : present(active)}>{presenting ? <LayoutGrid size={17} /> : <Play size={17} />}{presenting ? "Overview" : "Present"}</button>
        <button onClick={openPdf}><FileText size={17} /><span>PDF preview</span></button>
        <a href={video} target="_blank" rel="noreferrer"><Play size={17} /><span>Video</span></a>
        <button onClick={() => window.print()}><Printer size={17} /><span>Print</span></button>
        {presenting && <button onClick={fullscreen} aria-label="Toggle fullscreen"><Maximize size={17} /></button>}
      </nav>
    </header>
    {!presenting && <section className={styles.intro}><span className={styles.tag}>BURNING TOKEN 2026 · JULIO CRUZ</span><h1>The story behind SecondLook.</h1><p>Eight slides. One real claim. A brief you can inspect.</p><div className={styles.introActions}><button className={styles.primary} onClick={() => present(active)}><Play size={17} /> Start presentation</button><a href="/login?demo=1" target="_blank" rel="noreferrer">Open the product <ExternalLink size={16} /></a></div><nav className={styles.index} aria-label="Slide previews">{slides.map((s,i) => <button key={s.id} onClick={() => present(i)}><small>{String(i+1).padStart(2,"0")}</small><span>{s.label}</span><ArrowRight size={16} /></button>)}</nav></section>}
    <div className={styles.slides}>
      {slides.map((slide,index) => <section id={slide.id} key={slide.id} className={`${styles.slide} ${index===active ? styles.active : ""}`} aria-label={`Slide ${index+1}: ${slide.label}`}>
        <div className={styles.slideTop}><span>SECONDLOOK</span><span>{String(index+1).padStart(2,"0")} / 08</span></div>
        <div className={styles.slideBody}><div className={styles.copy}><span className={styles.tag}>{slide.label}</span><h2>{slide.title}</h2><p>{slide.subtitle}</p>{index===0 && <span className={styles.byline}>Julio Cruz · Burning Token 2026</span>}</div><div className={styles.visual}>{visual(index)}</div></div>
        <footer className={styles.slideFooter}><span>Before you buy, check the proof.</span>{!presenting && <button onClick={() => present(index)}>Present this slide <ArrowRight size={15} /></button>}<span>secondlook.juliomcruz.workers.dev</span></footer>
      </section>)}
    </div>
    {presenting && <><div className={styles.controls}><button onClick={() => go(active-1)} disabled={active===0} aria-label="Previous slide"><ArrowLeft size={20} /></button><span aria-live="polite">{active+1} / {slides.length} · {slides[active].label}</span><button onClick={() => go(active+1)} disabled={active===slides.length-1} aria-label="Next slide"><ArrowRight size={20} /></button><button onClick={() => setNotes(v=>!v)} aria-pressed={notes}><StickyNote size={17} /> Notes</button><button onClick={() => { start.current=Date.now(); setElapsed(0); }} title="Reset rehearsal timer" aria-label="Reset rehearsal timer">{Math.floor(elapsed/60)}:{String(elapsed%60).padStart(2,"0")}</button></div><div className={styles.progress} role="progressbar" aria-label="Slide progress" aria-valuenow={active+1} aria-valuemin={1} aria-valuemax={8}><span style={{width:`${(active+1)/8*100}%`}} /></div>{notes && <aside className={styles.notes}><strong>Presenter notes · {slides[active].label}</strong><p>{slides[active].note}</p><small>Next: {slides[active+1]?.label ?? "Questions & discussion"} · Notes are visible on this screen.</small></aside>}<p className={styles.shortcuts}>← → Navigate · N Notes · F Fullscreen · Esc Overview</p></>}
    {notice && <p className={styles.notice} role="status">{notice}<button onClick={()=>setNotice("")} aria-label="Dismiss message"><X size={16}/></button></p>}
    <dialog ref={dialog} aria-label="Evidence brief preview" className={styles.dialog} onClose={()=>setPdfOpen(false)}><header><div><strong>Evidence brief</strong><small>Actual demo assessment · English · 3 pages</small></div><a href={pdf} target="_blank" rel="noreferrer">Open PDF <ExternalLink size={16}/></a><a href={pdf} download>Download</a><button onClick={()=>dialog.current?.close()} aria-label="Close PDF preview"><X size={20}/></button></header>{pdfOpen && <div className={styles.pdfPreview}>{["brief-preview.png", "brief-page-2.png", "brief-page-3.png"].map((file, index) => <Image key={file} src={`/deck/${file}`} width={1697} height={2400} alt={`Evidence brief — page ${index + 1} of 3`} />)}</div>}<p>Preview of the actual report. Open PDF for clickable source links.</p></dialog>
  </main>;
}
