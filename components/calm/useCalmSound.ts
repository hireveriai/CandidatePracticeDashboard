"use client";
import { useEffect, useRef, useState } from "react";

export default function useCalmSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return localStorage.getItem("autoCalm") === "true" ? "ocean" : null;
  });
  const shouldAutoStart = useRef(current === "ocean");

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
    audioRef.current = null;
    setCurrent(null);
  };

  useEffect(() => {
    if (shouldAutoStart.current && !audioRef.current) {
      const audio = new Audio("/sounds/ocean.mp3");
      audio.loop = true;
      audio.volume = 0.25;
      audio.play();
      audioRef.current = audio;
    }

    return () => {
      audioRef.current?.pause();
    };
  }, []);

  return { playSound, stopSound, current };
}
