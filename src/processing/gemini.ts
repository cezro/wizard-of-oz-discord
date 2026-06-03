import { GoogleGenAI } from "@google/genai";

import type { AppConfig } from "../config.js";
import type { ProcessResult, StandupPipelineData } from "../types.js";
import { formatMessageLog, STANDUP_SYSTEM_PROMPT } from "./prompts.js";

export async function processStandup(
  config: AppConfig,
  data: StandupPipelineData,
): Promise<ProcessResult> {
  if (data.messages.length === 0) {
    return { kind: "empty" };
  }

  const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
  const userContent = formatMessageLog(data.messages);

  const response = await ai.models.generateContent({
    model: config.geminiModel,
    contents: userContent,
    config: {
      systemInstruction: STANDUP_SYSTEM_PROMPT,
      temperature: 0.1,
    },
  });

  const markdown = response.text?.trim();
  if (!markdown) {
    throw new Error("Gemini returned an empty summary");
  }

  return { kind: "summary", markdown };
}
