"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "@/components/LocaleProvider";

type Status = "idle" | "listening" | "working" | "blocked";

type Props = {
  value: string;
  onTranscript: (text: string) => void;
  disabled?: boolean;
};

function pickMime() {
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  for (const t of types) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) return t;
  }
  return "";
}

export default function VoiceListen({ value, onTranscript, disabled }: Props) {
  const { t, locale } = useT();
  const [status, setStatus] = useState<Status>("idle");
  const [live, setLive] = useState("");
  const [meta, setMeta] = useState("");
  const [err, setErr] = useState("");
  const streamRef = useRef<MediaStream | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const barsRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => () => stopAll(), []);

  function stopViz() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    void ctxRef.current?.close();
    ctxRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function stopAll() {
    if (recRef.current && recRef.current.state !== "inactive") {
      try {
        recRef.current.stop();
      } catch {
        /* ignore */
      }
    }
    recRef.current = null;
    stopViz();
  }

  async function startViz(stream: MediaStream) {
    try {
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 32;
      src.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const nodes = barsRef.current?.querySelectorAll<HTMLElement>("[data-bar]");
      const tick = () => {
        analyser.getByteFrequencyData(data);
        nodes?.forEach((el, i) => {
          const v = data[i] || 0;
          el.style.transform = `scaleY(${Math.max(0.12, v / 180)})`;
        });
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      /* visualizer optional */
    }
  }

  async function sendClip(blob: Blob) {
    setStatus("working");
    setLive(t.voiceWorking);
    setMeta("");
    const body = new FormData();
    const ext = blob.type.includes("mp4") ? "m4a" : "webm";
    body.append("audio", blob, `claim.${ext}`);
    body.append("locale", locale);
    const res = await fetch("/api/voice/transcribe", { method: "POST", body });
    const data = (await res.json().catch(() => ({}))) as {
      claim?: string;
      raw?: string;
      sttModel?: string;
      polishModel?: string;
      error?: string;
    };
    if (!res.ok || !data.claim) {
      setErr(data.error || t.voiceFail);
      setStatus("idle");
      setLive("");
      return;
    }
    const raw = (data.raw || "").trim();
    if (raw && raw !== data.claim) {
      setLive(raw);
      setMeta(`${t.heardRaw} → ${t.polishedLine}`);
      await new Promise((r) => setTimeout(r, 700));
    }
    onTranscript(data.claim);
    setLive(data.claim);
    setMeta(`Nebius ${data.sttModel || "STT"} → ${data.polishModel || "brief model"}`);
    setStatus("idle");
  }

  async function toggle() {
    if (disabled) return;
    if (status === "working") return;
    if (status === "listening") {
      recRef.current?.stop();
      return;
    }
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus("blocked");
      setErr(t.voiceBlocked);
      return;
    }
    setErr("");
    setLive("");
    setMeta("");
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = pickMime();
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      recRef.current = rec;
      rec.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      rec.onerror = () => {
        setErr(t.voiceFail);
        setStatus("idle");
        stopAll();
      };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        stopViz();
        recRef.current = null;
        void sendClip(blob);
      };
      rec.start(200);
      setStatus("listening");
      await startViz(stream);
    } catch {
      setStatus("blocked");
      setErr(t.voiceMic);
    }
  }

  const listening = status === "listening";
  const working = status === "working";
  const display =
    live || (listening ? t.voiceListen : working ? t.voiceWorking : value);

  return (
    <div className="sl-voice">
      <button
        type="button"
        onClick={toggle}
        disabled={disabled || working || status === "blocked"}
        className={`sl-orb ${listening || working ? "sl-orb-on" : ""}`}
        aria-pressed={listening}
        aria-label={listening ? "Stop recording" : "Speak the claim"}
      >
        <span className="sl-orb-core" />
        <span className="sl-orb-ring" />
        <span className="sl-orb-ring sl-orb-ring-2" />
      </button>

      <div ref={barsRef} className={`sl-bars ${listening ? "sl-bars-on" : ""}`} aria-hidden>
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} data-bar className="sl-bar-el" />
        ))}
      </div>

      <p className="sl-serif sl-voice-line">
        {live && status === "idle" && value && live !== value ? (
          <>
            <span className="text-[var(--muted)] line-through">{live}</span>
            <span className="mt-1 block">{value}</span>
          </>
        ) : (
          display || t.voiceHintIdle
        )}
      </p>
      <p className="sl-voice-hint">
        {listening ? t.voiceHintListen : working ? t.voiceHintWork : t.voiceHintIdle}
      </p>
      {meta ? <p className="mt-2 font-mono text-[10px] tracking-wide text-[var(--muted)]">{meta}</p> : null}
      {err ? <p className="mt-2 text-sm text-red-700">{err}</p> : null}
    </div>
  );
}
