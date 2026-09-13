"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Download, FileText, Loader2, Mail, X } from "lucide-react";
import { useT } from "./LocaleProvider";
import type { CheckRecord } from "@/lib/types";

export default function BriefPreview({ check, demo = false }: { check: CheckRecord; demo?: boolean }) {
  const { locale } = useT(); const es = locale === "es";
  const dialog = useRef<HTMLDialogElement>(null);
  const [url, setUrl] = useState(""); const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false); const [recipient, setRecipient] = useState("");
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  async function open() {
    dialog.current?.showModal(); setError("");
    if (url) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/checks/${check.id}/pdf`);
      if (!res.ok) throw Error(es ? "No se pudo generar el PDF. Revisa tu acceso e inténtalo de nuevo." : "Could not generate PDF. Check your access and try again.");
      setUrl(URL.createObjectURL(await res.blob()));
    } catch (e) { setError(e instanceof Error ? e.message : "PDF unavailable"); }
    finally { setLoading(false); }
  }
  async function send() {
    setSending(true); setError(""); setSent(false);
    try {
      const res = await fetch(`/api/checks/${check.id}/email`, { method: "POST" }); const data = await res.json();
      if (!res.ok || !data.emailed?.sent) throw Error(data.error || data.emailed?.error || "Email failed");
      setRecipient(data.emailed.to); setSent(true);
    } catch (e) { setError(e instanceof Error ? e.message : "Email failed"); }
    finally { setSending(false); }
  }
  return <>
    <button onClick={open} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--green)] px-5 py-3 text-sm font-medium text-white"><FileText size={16}/>{es ? "Vista previa del PDF" : "Preview PDF"}</button>
    <dialog ref={dialog} aria-labelledby="pdf-preview-title" className="m-auto h-[94dvh] max-h-[94dvh] w-[min(1200px,96vw)] max-w-none rounded-2xl border border-[#dfe5df] bg-[#eef1ed] p-0 shadow-2xl backdrop:bg-[#15241e]/65">
      <div className="flex h-full flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dfe5df] bg-white px-5 py-4">
          <div><h2 id="pdf-preview-title" className="text-base font-semibold">{es ? "Tu expediente de evidencia" : "Your evidence brief"}</h2><p className="mt-1 text-xs text-[var(--muted)]">SecondLook · PDF · {check.id.slice(-8)}</p></div>
          <div className="flex items-center gap-2">
            {url && <a href={url} download={`secondlook-${check.id.slice(-8)}.pdf`} className="inline-flex items-center gap-2 rounded-lg border border-[#dfe5df] bg-white px-3 py-2 text-sm"><Download size={15}/>{es ? "Descargar" : "Download"}</a>}
            {!demo && <button disabled={sending || !url} onClick={send} className="inline-flex items-center gap-2 rounded-lg bg-[var(--green)] px-3 py-2 text-sm text-white disabled:opacity-50">{sending ? <Loader2 size={15} className="animate-spin"/> : <Mail size={15}/>} {sending ? (es ? "Enviando…" : "Sending…") : (es ? "Enviar por email" : "Email PDF")}</button>}
            <button onClick={() => dialog.current?.close()} aria-label={es ? "Cerrar vista previa" : "Close preview"} className="rounded-lg p-2 hover:bg-[#eef1ed]"><X size={20}/></button>
          </div>
        </header>
        {sent && <div role="status" className="mx-5 mt-4 flex items-start gap-3 rounded-xl border border-[#a6c8b7] bg-[#eef9f2] px-4 py-3 text-[#164735] shadow-sm"><CheckCircle2 size={22} className="shrink-0"/><div><p className="text-sm font-semibold">{es ? "PDF enviado por email" : "PDF sent by email"}</p><p className="mt-1 text-xs">{recipient} · {es ? "El proveedor aceptó el envío con el PDF adjunto." : "Email provider accepted the message with your PDF attached."}</p></div><button onClick={() => setSent(false)} aria-label={es ? "Cerrar confirmación" : "Dismiss confirmation"} className="ml-auto p-1"><X size={15}/></button></div>}
        {error && <p role="alert" className="mx-5 mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error} {!url && <button onClick={open} className="ml-2 underline">{es ? "Reintentar" : "Retry"}</button>}</p>}
        {demo && <p className="px-5 pt-3 text-xs text-[var(--muted)]">{es ? "Sesión de demostración: descarga el PDF. Inicia sesión con email para enviarlo." : "Demo session: download your PDF. Sign in with email for delivery."}</p>}
        <div className="min-h-0 flex-1 p-3 sm:p-5">{loading ? <p role="status" className="flex h-full items-center justify-center gap-2 text-sm"><Loader2 size={18} className="animate-spin"/>{es ? "Preparando tu PDF…" : "Preparing your PDF…"}</p> : url && <iframe title={es ? "Informe PDF" : "PDF evidence brief"} src={`${url}#view=FitH&toolbar=0`} className="h-full w-full rounded-lg border border-[#dfe5df] bg-white"/>}</div>
      </div>
    </dialog>
  </>;
}
