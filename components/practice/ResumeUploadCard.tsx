"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Loader2 } from "lucide-react";

export default function ResumeUploadCard() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/practice/resume/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok || !payload?.ok) {
        setError(payload?.message || "We couldn't upload that resume. Please try again.");
        return;
      }

      router.refresh();
    } catch (uploadError) {
      console.warn("Resume upload failed", uploadError);
      setError("We couldn't upload that resume. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm transition hover:border-blue-300 hover:bg-blue-50/40">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        {uploading ? <Loader2 size={22} className="animate-spin" aria-hidden="true" /> : <FileUp size={22} aria-hidden="true" />}
      </span>
      <div>
        <p className="font-semibold text-slate-950">{uploading ? "Uploading resume…" : "Upload a resume"}</p>
        <p className="mt-1 text-sm text-slate-500">PDF or DOCX, up to 8 MB</p>
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="mt-1 inline-flex min-h-10 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Choose file
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
      {error ? <p className="text-sm text-amber-700">{error}</p> : null}
    </div>
  );
}
