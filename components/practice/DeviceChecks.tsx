"use client";

import { AlertTriangle, CheckCircle2, Loader2, Mic, RotateCw, Sun, Video, Wifi } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type DeviceStatus = "checking" | "ready" | "blocked" | "missing";
type NetworkStatus = "checking" | "good" | "slow" | "offline";

const SLOW_NETWORK_MS = 800;
const VOICE_LEVEL_THRESHOLD = 0.06;

function classifyMediaError(error: unknown): DeviceStatus {
  return error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "SecurityError")
    ? "blocked"
    : "missing";
}

function StatusBadge({ tone, children }: { tone: "checking" | "ok" | "warn" | "bad"; children: React.ReactNode }) {
  const toneClass = {
    checking: "bg-slate-100 text-slate-600",
    ok: "bg-teal-50 text-teal-700",
    warn: "bg-amber-50 text-amber-800",
    bad: "bg-rose-50 text-rose-700",
  }[tone];
  const icon =
    tone === "checking" ? (
      <Loader2 size={15} className="animate-spin" aria-hidden="true" />
    ) : tone === "ok" ? (
      <CheckCircle2 size={15} aria-hidden="true" />
    ) : (
      <AlertTriangle size={15} aria-hidden="true" />
    );

  return (
    <p className={`mt-4 flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${toneClass}`} role="status">
      {icon}
      {children}
    </p>
  );
}

function CheckCard({
  icon: Icon,
  label,
  detail,
  children,
}: {
  icon: typeof Video;
  label: string;
  detail: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <Icon size={20} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-950">{label}</h2>
          <p className="text-sm text-slate-500">{detail}</p>
        </div>
      </div>
      <div className="mt-auto">{children}</div>
    </div>
  );
}

function deviceBadge(status: DeviceStatus, readyText: string, device: string) {
  if (status === "checking") return <StatusBadge tone="checking">Checking {device}…</StatusBadge>;
  if (status === "ready") return <StatusBadge tone="ok">{readyText}</StatusBadge>;
  if (status === "blocked") return <StatusBadge tone="warn">Allow {device} access in your browser</StatusBadge>;
  return <StatusBadge tone="bad">No {device} found</StatusBadge>;
}

/**
 * Live camera, microphone and network checks for the practice precheck.
 * Nothing here gates the interview; it tells the candidate what to fix
 * before they start. Media is released on unmount so the interview room can
 * take the devices.
 */
export default function DeviceChecks() {
  const [attempt, setAttempt] = useState(0);
  const [camera, setCamera] = useState<DeviceStatus>("checking");
  const [microphone, setMicrophone] = useState<DeviceStatus>("checking");
  const [level, setLevel] = useState(0);
  const [voiceHeard, setVoiceHeard] = useState(false);
  const [network, setNetwork] = useState<NetworkStatus>("checking");
  const [latency, setLatency] = useState<number | null>(null);
  const [environmentConfirmed, setEnvironmentConfirmed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;
    let audioContext: AudioContext | null = null;
    let frame = 0;

    async function acquire(): Promise<MediaStream | null> {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCamera("missing");
        setMicrophone("missing");
        return null;
      }
      try {
        const both = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setCamera("ready");
        setMicrophone("ready");
        return both;
      } catch {
        // Try each device alone so the card can say which one is the problem.
        const tracks: MediaStreamTrack[] = [];
        try {
          tracks.push(...(await navigator.mediaDevices.getUserMedia({ video: true })).getTracks());
          setCamera("ready");
        } catch (error) {
          setCamera(classifyMediaError(error));
        }
        try {
          tracks.push(...(await navigator.mediaDevices.getUserMedia({ audio: true })).getTracks());
          setMicrophone("ready");
        } catch (error) {
          setMicrophone(classifyMediaError(error));
        }
        return tracks.length ? new MediaStream(tracks) : null;
      }
    }

    acquire().then((acquired) => {
      if (!acquired) return;
      if (cancelled) {
        acquired.getTracks().forEach((track) => track.stop());
        return;
      }
      stream = acquired;
      if (videoRef.current && acquired.getVideoTracks().length) {
        videoRef.current.srcObject = acquired;
      }

      const audioTracks = acquired.getAudioTracks();
      if (!audioTracks.length || typeof AudioContext === "undefined") return;
      audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      audioContext.createMediaStreamSource(new MediaStream(audioTracks)).connect(analyser);
      const samples = new Uint8Array(analyser.fftSize);
      let lastUpdate = 0;

      const tick = (now: number) => {
        analyser.getByteTimeDomainData(samples);
        let sum = 0;
        for (const sample of samples) {
          const centred = (sample - 128) / 128;
          sum += centred * centred;
        }
        const rms = Math.sqrt(sum / samples.length);
        if (now - lastUpdate > 80) {
          lastUpdate = now;
          setLevel(Math.min(1, rms * 4));
          if (rms > VOICE_LEVEL_THRESHOLD) setVoiceHeard(true);
        }
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((track) => track.stop());
      void audioContext?.close();
    };
  }, [attempt]);

  useEffect(() => {
    let cancelled = false;

    async function measure() {
      if (!navigator.onLine) {
        setNetwork("offline");
        return;
      }
      const started = performance.now();
      try {
        await fetch(`/favicon.ico?network-check=${Date.now()}`, { cache: "no-store" });
        if (cancelled) return;
        const elapsed = Math.round(performance.now() - started);
        setLatency(elapsed);
        setNetwork(elapsed > SLOW_NETWORK_MS ? "slow" : "good");
      } catch {
        if (!cancelled) setNetwork("offline");
      }
    }

    void measure();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = () => {
    setCamera("checking");
    setMicrophone("checking");
    setNetwork("checking");
    setLatency(null);
    setLevel(0);
    setVoiceHeard(false);
    setAttempt((value) => value + 1);
  };

  const needsRetry =
    camera === "blocked" || camera === "missing" || microphone === "blocked" || microphone === "missing" || network === "offline";

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <CheckCard icon={Video} label="Camera" detail="Face centred and well lit">
          <div className="mt-4 overflow-hidden rounded-lg bg-slate-900">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={`aspect-video w-full -scale-x-100 object-cover ${camera === "ready" ? "" : "opacity-0"}`}
            />
          </div>
          {deviceBadge(camera, "Camera is working", "camera")}
        </CheckCard>

        <CheckCard icon={Mic} label="Microphone" detail="Say a few words to test">
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
            <div
              className="h-full rounded-full bg-teal-500 transition-[width] duration-100"
              style={{ width: `${Math.round(level * 100)}%` }}
            />
          </div>
          {microphone === "ready"
            ? voiceHeard
              ? <StatusBadge tone="ok">Your voice is coming through</StatusBadge>
              : <StatusBadge tone="checking">Listening — say something</StatusBadge>
            : deviceBadge(microphone, "Microphone is working", "microphone")}
        </CheckCard>

        <CheckCard icon={Wifi} label="Network" detail="Stable connection for video">
          {network === "checking" ? (
            <StatusBadge tone="checking">Testing your connection…</StatusBadge>
          ) : network === "good" ? (
            <StatusBadge tone="ok">Connection looks good{latency !== null ? ` (${latency} ms)` : ""}</StatusBadge>
          ) : network === "slow" ? (
            <StatusBadge tone="warn">Connection is slow — close other apps or move closer to Wi‑Fi</StatusBadge>
          ) : (
            <StatusBadge tone="bad">You appear to be offline</StatusBadge>
          )}
        </CheckCard>

        <CheckCard icon={Sun} label="Environment" detail="Quiet room, few distractions">
          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-md bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={environmentConfirmed}
              onChange={(event) => setEnvironmentConfirmed(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600"
            />
            I&rsquo;m in a quiet, well-lit place and won&rsquo;t be interrupted.
          </label>
        </CheckCard>
      </div>

      {needsRetry ? (
        <button
          type="button"
          onClick={retry}
          className="inline-flex w-fit items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <RotateCw size={15} aria-hidden="true" />
          Run checks again
        </button>
      ) : null}
    </div>
  );
}
