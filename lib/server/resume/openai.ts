const OPENAI_MODEL = process.env.OPENAI_RESUME_MODEL?.trim() || "gpt-4o-mini";

type OpenAIResponsesOutputText = {
  output_text?: string;
  output?: Array<{
    content?: Array<{ type?: string; text?: string }>;
  }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
};

export class ResumeAIError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "ResumeAIError";
    this.code = code;
  }
}

function extractStructuredOutputText(response: OpenAIResponsesOutputText) {
  if (typeof response.output_text === "string" && response.output_text.trim()) {
    return response.output_text.trim();
  }

  const chunks = (response.output ?? [])
    .flatMap((item) => item.content ?? [])
    .filter((item) => item.type === "output_text" || item.type === "text")
    .map((item) => item.text ?? "")
    .join("")
    .trim();

  return chunks || null;
}

/**
 * Same OpenAI Responses API + strict json_schema pattern already proven in
 * recruiter-dashboard/lib/server/ai-screening/openai.ts -- reused here rather
 * than reintroducing a different call shape or SDK.
 */
export async function callOpenAIJson<T>(input: {
  system: string;
  user: string;
  schemaName: string;
  schema: Record<string, unknown>;
  timeoutMs?: number;
}): Promise<{ data: T; inputTokens: number | null; outputTokens: number | null }> {
  const apiKey = process.env.OPENAI_API_KEY?.trim().replace(/^"|"$/g, "");

  if (!apiKey) {
    throw new ResumeAIError("OPENAI_UNAVAILABLE", "AI resume enhancement is not configured.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), input.timeoutMs ?? 45_000);

  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        input: [
          { role: "system", content: [{ type: "input_text", text: input.system }] },
          { role: "user", content: [{ type: "input_text", text: input.user }] },
        ],
        text: {
          format: {
            type: "json_schema",
            name: input.schemaName,
            strict: true,
            schema: input.schema,
          },
        },
      }),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new ResumeAIError("OPENAI_TIMEOUT", "AI resume analysis timed out. Please try again.");
    }
    throw new ResumeAIError("OPENAI_REQUEST_FAILED", "Could not reach the AI service. Please try again.");
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error("OpenAI resume request failed", response.status, body.slice(0, 500));
    throw new ResumeAIError("OPENAI_REQUEST_FAILED", "The AI service returned an error. Please try again.");
  }

  const payload = (await response.json()) as OpenAIResponsesOutputText;
  const outputText = extractStructuredOutputText(payload);

  if (!outputText) {
    throw new ResumeAIError("OPENAI_EMPTY_RESPONSE", "The AI service returned an empty response.");
  }

  let data: T;
  try {
    data = JSON.parse(outputText) as T;
  } catch {
    throw new ResumeAIError("OPENAI_MALFORMED_RESPONSE", "The AI service returned a malformed response.");
  }

  return {
    data,
    inputTokens: payload.usage?.input_tokens ?? null,
    outputTokens: payload.usage?.output_tokens ?? null,
  };
}

export { OPENAI_MODEL };
