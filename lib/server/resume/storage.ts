import { randomUUID } from "crypto";

export class ResumeStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResumeStorageError";
  }
}

function getConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const bucket = process.env.PRACTICE_RESUME_BUCKET?.trim() || "resumes";

  if (!supabaseUrl || !serviceRoleKey) {
    throw new ResumeStorageError("Resume storage is not configured.");
  }

  return { supabaseUrl, serviceRoleKey, bucket };
}

function sanitizeFileName(fileName: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
  return safeName || "resume";
}

function encodeObjectPath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

export async function uploadCandidateFile(input: {
  candidateId: string;
  fileName: string;
  contentType: string;
  buffer: Buffer;
  subdir: string;
}) {
  const { supabaseUrl, serviceRoleKey, bucket } = getConfig();
  const objectKey = [
    "practice-candidate",
    input.candidateId,
    input.subdir,
    `${Date.now()}-${randomUUID()}-${sanitizeFileName(input.fileName)}`,
  ].join("/");

  const uploadUrl = `${supabaseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${encodeObjectPath(objectKey)}`;
  const body = input.buffer.buffer.slice(
    input.buffer.byteOffset,
    input.buffer.byteOffset + input.buffer.byteLength
  ) as ArrayBuffer;

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": input.contentType || "application/octet-stream",
      "x-upsert": "false",
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new ResumeStorageError(errorText || `Resume upload failed with status ${response.status}`);
  }

  return { bucket, key: objectKey };
}

export async function createSignedDownloadUrl(objectKey: string, expiresInSeconds = 300) {
  const { supabaseUrl, serviceRoleKey, bucket } = getConfig();
  const signUrl = `${supabaseUrl}/storage/v1/object/sign/${encodeURIComponent(bucket)}/${encodeObjectPath(objectKey)}`;

  const response = await fetch(signUrl, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ expiresIn: expiresInSeconds }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new ResumeStorageError(errorText || `Could not create a download link (status ${response.status})`);
  }

  const payload = (await response.json()) as { signedURL?: string };
  if (!payload.signedURL) {
    throw new ResumeStorageError("Storage did not return a signed URL.");
  }

  return `${supabaseUrl}/storage/v1${payload.signedURL}`;
}
