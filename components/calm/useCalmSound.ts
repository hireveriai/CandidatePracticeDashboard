"use client";
import { useRef, useState, useEffect } from "react";

export default function useCalmSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<string | null>(null);

  const playSound = (type: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(`/sounds/${type}.mp3`);
    audio.loop = true;
    audio.volume = 0.25;
    audio.play();

    audioRef.current = audio;
    setCurrent(type);
  };

  const stopSound = () => {
    audioRef.current?.pause();
    setCurrent(null);
  };

  // 🔹 Auto calm mode
  useEffect(() => {
    const auto = localStorage.getItem("autoCalm");
    if (auto === "true") {
      playSound("ocean");
    }
  }, []);

  return { playSound, stopSound, current };
}