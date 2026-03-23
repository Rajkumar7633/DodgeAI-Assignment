import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  answerFromDataset,
  noLlmConfiguredMessage,
} from "./graph-qa";

export type LlmProvider =
  | "openai_compatible"
  | "gemini"
  | "cohere"
  | "huggingface";

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

function getProvider(): LlmProvider {
  const p = (process.env.LLM_PROVIDER || "openai_compatible").toLowerCase();
  if (p === "gemini" || p === "google") return "gemini";
  if (p === "cohere") return "cohere";
  if (p === "huggingface" || p === "hf") return "huggingface";
  return "openai_compatible";
}

export function hasLlmCredentials(provider: LlmProvider): boolean {
  switch (provider) {
    case "gemini":
      return !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
    case "cohere":
      return !!process.env.COHERE_API_KEY;
    case "huggingface":
      return !!process.env.HUGGINGFACE_API_KEY;
    default:
      return !!(
        process.env.OPENAI_API_KEY ||
        process.env.GROQ_API_KEY ||
        process.env.OPENROUTER_API_KEY
      );
  }
}

function lastUserContent(messages: ChatMessage[]): string {
  const u = [...messages].reverse().find((m) => m.role === "user");
  return u?.content?.trim() ?? "";
}

async function callOpenAICompatible(
  messages: ChatMessage[],
  system: string
): Promise<string> {
  const baseUrl =
    process.env.OPENAI_BASE_URL ||
    process.env.OPENROUTER_BASE_URL ||
    "https://api.openai.com/v1";
  const key =
    process.env.OPENAI_API_KEY ||
    process.env.GROQ_API_KEY ||
    process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error("NO_LLM_KEY");
  }
  const model =
    process.env.OPENAI_MODEL || process.env.GROQ_MODEL || "gpt-4o-mini";
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      ...(process.env.OPENROUTER_SITE_URL
        ? { "HTTP-Referer": process.env.OPENROUTER_SITE_URL }
        : {}),
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: system }, ...messages],
      temperature: 0.3,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`LLM error ${res.status}: ${t}`);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content?.trim() || "";
}

async function callGemini(
  messages: ChatMessage[],
  system: string
): Promise<string> {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) throw new Error("NO_LLM_KEY");
  const genAI = new GoogleGenerativeAI(key);
  const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: system,
  });
  const transcript = messages
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");
  const result = await model.generateContent(transcript);
  return result.response.text().trim();
}

async function callCohere(
  messages: ChatMessage[],
  system: string
): Promise<string> {
  const key = process.env.COHERE_API_KEY;
  if (!key) throw new Error("NO_LLM_KEY");
  const last =
    [...messages].reverse().find((m) => m.role === "user")?.content || "";
  const res = await fetch("https://api.cohere.ai/v1/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: process.env.COHERE_MODEL || "command-r-plus-08-2024",
      message: last,
      preamble: system,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Cohere error ${res.status}: ${t}`);
  }
  const data = (await res.json()) as { text?: string };
  return (data.text || "").trim();
}

async function callHuggingFace(
  messages: ChatMessage[],
  system: string
): Promise<string> {
  const key = process.env.HUGGINGFACE_API_KEY;
  const model =
    process.env.HUGGINGFACE_MODEL ||
    "meta-llama/Meta-Llama-3-8B-Instruct";
  if (!key) throw new Error("NO_LLM_KEY");
  const prompt = `${system}\n\n${messages
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n")}\nassistant:`;
  const res = await fetch(
    `https://api-inference.huggingface.co/models/${model}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: { max_new_tokens: 512, return_full_text: false },
      }),
    }
  );
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`HF error ${res.status}: ${t}`);
  }
  const data = (await res.json()) as
    | { generated_text?: string }[]
    | { generated_text?: string };
  if (Array.isArray(data)) {
    return (data[0]?.generated_text || "").trim();
  }
  return (data.generated_text || "").trim();
}

export async function runGraphChat(
  messages: ChatMessage[],
  graphContext: string
): Promise<string> {
  const provider = getProvider();
  const userText = lastUserContent(messages);

  if (!hasLlmCredentials(provider)) {
    const fromData = answerFromDataset(userText);
    if (fromData) return fromData;
    return noLlmConfiguredMessage();
  }

  const system = `You are Dodge AI, a graph agent for Order to Cash. Use only the graph context below when citing numbers or relationships. If the answer is not in the context, say so briefly.

Graph context:
${graphContext}`;

  try {
    switch (provider) {
      case "gemini":
        return await callGemini(messages, system);
      case "cohere":
        return await callCohere(messages, system);
      case "huggingface":
        return await callHuggingFace(messages, system);
      default:
        return await callOpenAICompatible(messages, system);
    }
  } catch (err) {
    const fromData = answerFromDataset(userText);
    if (fromData) return fromData;
    if (err instanceof Error && err.message === "NO_LLM_KEY") {
      return noLlmConfiguredMessage();
    }
    return (
      "The model request failed. Check your API key and quotas. " +
      "You can still explore the graph by clicking nodes, or ask about a specific document number (6+ digits) for a lookup from the dataset."
    );
  }
}
