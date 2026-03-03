import { generateText, Output, stepCountIs } from "ai";
import { google } from "@ai-sdk/google";
import {
  valuationSchema,
  intentSchema,
  type Valuation,
  type Intent,
} from "./schemas";
import {
  SYSTEM_PROMPT,
  buildRouterPrompt,
  buildResearchPrompt,
  buildStructuringPrompt,
  buildAnswerPrompt,
  buildUpdatePrompt,
} from "./prompts";

export interface ChatRequest {
  message: string;
  history: { role: "user" | "assistant"; content: string }[];
  currentValuation?: Valuation;
}

export interface ChatResponse {
  message: string;
  valuation?: Valuation;
}

// --- Router: classify user intent ---
async function routeIntent(req: ChatRequest): Promise<Intent> {
  const { output } = await generateText({
    model: google("gemini-2.5-flash"),
    output: Output.object({ schema: intentSchema }),
    prompt: buildRouterPrompt(
      req.message,
      req.history,
      req.currentValuation != null,
    ),
  });

  if (!output) {
    return { intent: "answer", companyName: null };
  }

  // Can't update without an existing tree
  if (output.intent === "update" && !req.currentValuation) {
    return { intent: "answer", companyName: null };
  }

  return output;
}

// --- Answer: text-only response ---
async function handleAnswer(req: ChatRequest): Promise<ChatResponse> {
  const treeJson = req.currentValuation
    ? JSON.stringify(req.currentValuation, null, 2)
    : undefined;

  const { text } = await generateText({
    model: google("gemini-2.5-flash"),
    system: SYSTEM_PROMPT,
    prompt: buildAnswerPrompt(req.message, req.history, treeJson),
  });

  return { message: text };
}

// --- Analyze: new valuation (2-step: search → structure) ---
async function handleAnalyze(
  req: ChatRequest,
  companyName: string,
): Promise<ChatResponse> {
  // Step 1: Research with Google Search
  const { text: researchText, sources: rawSources } = await generateText({
    model: google("gemini-2.5-flash"),
    system: SYSTEM_PROMPT,
    tools: {
      google_search: google.tools.googleSearch({}),
    },
    stopWhen: stepCountIs(5),
    prompt: buildResearchPrompt(companyName),
  });

  const sources = (rawSources ?? [])
    .filter((s) => s.sourceType === "url")
    .map((s) => ({
      url: (s as { url: string }).url,
      title: (s as { title?: string }).title,
    }));

  // Step 2: Structure into valuation tree
  const { output } = await generateText({
    model: google("gemini-2.5-flash"),
    system: SYSTEM_PROMPT,
    output: Output.object({ schema: valuationSchema }),
    prompt: buildStructuringPrompt(companyName, researchText, sources),
  });

  if (!output) {
    throw new Error("밸류에이션 트리를 생성하지 못했습니다.");
  }

  return {
    message: `${output.companyName}의 밸류에이션 분석을 완료했습니다. ${output.methodology} 방법론을 적용했습니다.`,
    valuation: output,
  };
}

// --- Update: modify existing tree ---
async function handleUpdate(req: ChatRequest): Promise<ChatResponse> {
  const treeJson = JSON.stringify(req.currentValuation, null, 2);

  const { output } = await generateText({
    model: google("gemini-2.5-flash"),
    system: SYSTEM_PROMPT,
    output: Output.object({ schema: valuationSchema }),
    prompt: buildUpdatePrompt(req.message, treeJson),
  });

  if (!output) {
    throw new Error("트리 수정에 실패했습니다.");
  }

  return {
    message: "밸류에이션 트리를 수정했습니다.",
    valuation: output,
  };
}

// --- Main orchestrator ---
export async function handleChat(req: ChatRequest): Promise<ChatResponse> {
  const intent = await routeIntent(req);

  switch (intent.intent) {
    case "answer":
      return handleAnswer(req);
    case "analyze":
      return handleAnalyze(req, intent.companyName ?? req.message);
    case "update":
      return handleUpdate(req);
  }
}
