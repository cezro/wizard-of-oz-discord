import { GoogleGenAI } from "@google/genai";

import type { AppConfig } from "../config.js";
import type { ProcessResult, StandupPipelineData } from "../types.js";
import { formatMessageLog, STANDUP_SYSTEM_PROMPT } from "./prompts.js";

const GEMINI_TIMEOUT_MS = 90_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function processStandup(
  config: AppConfig,
  data: StandupPipelineData,
): Promise<ProcessResult> {
  if (data.messages.length === 0) {
    return { kind: "empty" };
  }

  const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
  const userContent = formatMessageLog(data.messages);

  const response = await Promise.race([
    ai.models.generateContent({
      model: config.geminiModel,
      contents: userContent,
      config: {
        systemInstruction: STANDUP_SYSTEM_PROMPT,
        temperature: 0.1,
      },
    }),
    sleep(GEMINI_TIMEOUT_MS).then(() => {
      throw new Error(
        `Gemini request timed out after ${GEMINI_TIMEOUT_MS / 1000}s`,
      );
    }),
  ]);

  const markdown = response.text?.trim();
  if (!markdown) {
    throw new Error("Gemini returned an empty summary");
  }

  return { kind: "summary", markdown };
}
