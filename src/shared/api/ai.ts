import { generateText, Output } from "ai";
import { google } from "@ai-sdk/google";
import {
  valuationSchema,
  intentSchema,
  type Valuation,
  type Intent,
} from "@/entities/session";
import {
  SYSTEM_PROMPT,
  buildRouterPrompt,
  buildResearchPrompt,
  buildStructuringPrompt,
  buildAnswerPrompt,
  buildUpdatePrompt,
} from "./prompts";
import { fetchCompanyData } from "./financial-data";
import { formatCurrencyUnitsInText, formatKrwFromEok } from "@/shared/utils/currency";

const USE_MOCK = process.env.USE_MOCK === "true";

// Fast model for routing, answer, research (flash for speed)
const fastModel = google(process.env.GOOGLE_MODEL_FAST ?? "gemini-2.5-flash");
// Pro model for structuring (better schema generation, faster than flash for structured output)
const proModel = google(process.env.GOOGLE_MODEL_PRO ?? "gemini-2.5-pro");

export interface ChatRequest {
  message: string;
  history: { role: "user" | "assistant"; content: string }[];
  currentValuation?: Valuation;
}

export interface ChatResponse {
  message: string;
  valuation?: Valuation;
}

// --- Mock data ---
function getMockValuation(companyName: string): Valuation {
  return {
    companyName,
    companyCode: companyName === "삼성전자" ? "005930" : "000000",
    companyMarketCap: 3580000,
    methodology: "SOTP (Sum-of-the-Parts)",
    tree: {
      id: "node-0-0",
      name: "적정가치",
      value: 4520000,
      unit: "억원",
      formula: "반도체 + 디스플레이 + MX/네트워크 + 하만/기타",
      description:
        "삼성전자는 사업부별 특성이 극명하게 다르므로 SOTP가 가장 적합합니다. 반도체는 시클리컬 고성장, 디스플레이는 성숙기, MX는 안정적 캐시카우 성격으로 각각 다른 밸류에이션 배수를 적용해야 합니다.",
      sources: [],
      children: [
        {
          id: "node-1-0",
          name: "반도체 (DS) 사업부",
          value: 3200000,
          unit: "억원",
          formula: "영업이익 × EV/EBITDA 배수",
          description:
            "HBM 수요 폭발과 AI 서버 투자 사이클에서 메모리 반도체 업황이 구조적으로 개선 중입니다. SK하이닉스 대비 HBM 점유율은 낮지만, 전통 DRAM/NAND에서의 지배적 위치와 파운드리 사업의 옵셔널리티를 반영합니다.",
          sources: [],
          children: [
            {
              id: "node-2-0",
              name: "메모리 반도체",
              value: 2700000,
              unit: "억원",
              formula: "영업이익 × 배수",
              description:
                "DRAM 시장점유율 약 40%, NAND 약 33%로 양쪽 모두 1~2위. 2025년 HBM3E 양산 본격화로 ASP 상승 기대. 다만 SK하이닉스 대비 HBM 기술 격차(약 6개월)를 할인 요인으로 반영했습니다.",
              sources: [],
              children: [
                {
                  id: "node-3-0",
                  name: "영업이익 (메모리)",
                  value: 270000,
                  unit: "억원",
                  formula: null,
                  description:
                    "2025E 메모리 영업이익. 컨센서스 범위 25~30조원을 기준으로 중앙값에 가까운 27조원을 채택. DRAM 비트그로스 둔화 가능성과 NAND 재고 조정 리스크를 반영.",
                  sources: [],
                  children: [],
                },
                {
                  id: "node-3-1",
                  name: "적용 배수",
                  value: 10,
                  unit: "배",
                  formula: null,
                  description:
                    "글로벌 메모리 피어 평균 EV/EBITDA 8~12배. SK하이닉스 11배, Micron 9배. 삼성은 DRAM 점유율 프리미엄 반영하되 HBM 격차 할인하여 10배 적용.",
                  sources: [],
                  children: [],
                },
              ],
            },
            {
              id: "node-2-1",
              name: "파운드리/시스템LSI",
              value: 500000,
              unit: "억원",
              formula: "영업이익 × 배수",
              description:
                "파운드리 점유율 약 12%로 TSMC(60%)에 크게 뒤지나, 2nm GAA 공정 전환이 성공하면 재평가 여지. 현재는 적자~BEP 수준이므로 매출 기반 PSR로 보완 평가.",
              sources: [],
              children: [
                {
                  id: "node-3-2",
                  name: "매출액 (파운드리)",
                  value: 200000,
                  unit: "억원",
                  formula: null,
                  description:
                    "2025E 파운드리+시스템LSI 매출. 퀄컴 등 주요 고객 물량 회복과 GAA 공정 매출 기여 시작 반영.",
                  sources: [],
                  children: [],
                },
                {
                  id: "node-3-3",
                  name: "적용 PSR",
                  value: 2.5,
                  unit: "배",
                  formula: null,
                  description:
                    "TSMC PSR 8~10배 대비 대폭 할인. 수율 이슈, 고객 다변화 부족, 적자 지속 리스크 반영. 중장기 턴어라운드 시 상향 여지.",
                  sources: [],
                  children: [],
                },
              ],
            },
          ],
        },
        {
          id: "node-1-1",
          name: "MX/네트워크 사업부",
          value: 850000,
          unit: "억원",
          formula: "영업이익 × PER",
          description:
            "갤럭시 시리즈 중심의 스마트폰 사업. 글로벌 점유율 약 20%로 애플과 양강 구도. AI 폰 프리미엄화 전략이 ASP 상승을 견인하나 성장률은 한 자릿수로 성숙기 진입.",
          sources: [],
          children: [
            {
              id: "node-2-2",
              name: "영업이익 (MX)",
              value: 120000,
              unit: "억원",
              formula: null,
              description:
                "2025E MX 사업부 영업이익. 갤럭시 S25 시리즈 호조와 폴더블 라인업 확대 효과. OPM 약 10% 수준 유지 전망.",
              sources: [],
              children: [],
            },
            {
              id: "node-2-3",
              name: "적용 PER",
              value: 7,
              unit: "배",
              formula: null,
                  description:
                    "애플 PER 30배 대비 할인. 하드웨어 중심 사업 구조, 생태계 락인 약함, 중국 업체 추격 리스크 반영. 하드웨어 피어(샤오미 등) 8~12배 범위의 하단 수준을 적용.",
              sources: [],
              children: [],
            },
          ],
        },
        {
          id: "node-1-2",
          name: "디스플레이 (SDC) 사업부",
          value: 350000,
          unit: "억원",
          formula: "영업이익 × 배수",
          description:
            "OLED 시장 지배적 위치(중소형 점유율 약 50%). 아이폰향 패널이 매출 핵심. IT용 OLED 확대가 새 성장 동력이나 중국 BOE의 추격이 구조적 리스크.",
          sources: [],
          children: [
            {
              id: "node-2-4",
              name: "영업이익 (SDC)",
              value: 50000,
              unit: "억원",
              formula: null,
              description:
                "2025E 디스플레이 영업이익. 아이폰16 OLED 물량 증가와 IT용 OLED(태블릿/노트북) 신규 매출 반영.",
              sources: [],
              children: [],
            },
            {
              id: "node-2-5",
              name: "적용 배수",
              value: 7,
              unit: "배",
              formula: null,
              description:
                "디스플레이 피어(LG디스플레이, BOE) 평균 5~8배. 삼성의 기술 리더십 프리미엄 반영하되 패널 가격 하락 사이클 리스크 감안.",
              sources: [],
              children: [],
            },
          ],
        },
        {
          id: "node-1-3",
          name: "하만/기타",
          value: 120000,
          unit: "억원",
          formula: null,
          description:
            "하만(차량 인포테인먼트), 의료기기 등. 전체 기업가치에서 비중은 작으나 전장 시장 성장에 따른 옵셔널리티 존재. 별도 DCF 대신 가시성이 높은 장부가 기준을 적용.",
          sources: [],
          children: [],
        },
      ],
    },
  };
}

// --- Router: classify user intent ---
async function routeIntent(req: ChatRequest): Promise<Intent> {
  if (USE_MOCK) {
    const msg = req.message.trim();
    if (req.currentValuation && (msg.includes("바꿔") || msg.includes("수정") || msg.includes("변경") || msg.includes("낮춰") || msg.includes("높여"))) {
      return { intent: "update", companyName: null };
    }
    const isCompanyQuery = msg.length <= 20 && !msg.includes("?") && !msg.includes("뭐") && !msg.includes("왜") && !msg.includes("어떻게");
    if (isCompanyQuery && !req.currentValuation) {
      return { intent: "analyze", companyName: msg };
    }
    if (isCompanyQuery && req.currentValuation && req.currentValuation.companyName !== msg) {
      return { intent: "analyze", companyName: msg };
    }
    return { intent: "answer", companyName: null };
  }

  const { output } = await generateText({
    model: fastModel,
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

  if (output.intent === "update" && !req.currentValuation) {
    return { intent: "answer", companyName: null };
  }

  return output;
}

// --- Answer: text-only response ---
async function handleAnswer(req: ChatRequest): Promise<ChatResponse> {
  if (USE_MOCK) {
    if (req.currentValuation) {
      return {
        message: `${req.currentValuation.companyName}의 현재 적정가치는 ${formatKrwFromEok(req.currentValuation.tree.value)}으로, 시가총액 ${formatKrwFromEok(req.currentValuation.companyMarketCap)} 대비 ${(((req.currentValuation.tree.value - req.currentValuation.companyMarketCap) / req.currentValuation.companyMarketCap) * 100).toFixed(1)}% 업사이드가 있습니다. SOTP 기준 반도체 사업부가 전체 가치의 약 70%를 차지합니다.`,
      };
    }
    return { message: "안녕하세요! 회사명을 입력하시면 AI 밸류에이션 분석을 시작합니다. 예: 삼성전자, 카카오, 네이버" };
  }

  const treeJson = req.currentValuation
    ? JSON.stringify(req.currentValuation, null, 2)
    : undefined;

  const { text } = await generateText({
    model: fastModel,
    system: SYSTEM_PROMPT,
    prompt: buildAnswerPrompt(req.message, req.history, treeJson),
  });

  return { message: formatCurrencyUnitsInText(text) };
}

// --- Research: fetch data + LLM research (called by /api/chat/research) ---
export interface ResearchResult {
  researchText: string;
  realData?: {
    stock?: { marketCap: number; closePrice: number; stockCode: string; stockName: string; listedShares: number } | null;
    financials?: { revenue: number | null; operatingIncome: number | null; netIncome: number | null; totalAssets: number | null; totalEquity: number | null; totalDebt: number | null; year: string; reportType: string } | null;
  };
}

export async function handleResearch(
  companyName: string,
  onProgress?: (status: string) => void,
): Promise<ResearchResult> {
  if (USE_MOCK) {
    return {
      researchText: `${companyName}에 대한 mock 리서치 결과입니다.`,
      realData: undefined,
    };
  }

  // Fetch real financial data
  onProgress?.(`${companyName}의 시장 데이터를 조회하고 있습니다...`);
  const companyData = await fetchCompanyData(companyName);
  const realData = (companyData.stock || companyData.financials)
    ? { stock: companyData.stock, financials: companyData.financials }
    : undefined;

  // Research with Google Search grounding
  onProgress?.(`${companyName}에 대해 리서치하고 있습니다...`);
  const { text: researchText } = await generateText({
    model: fastModel,
    system: SYSTEM_PROMPT,
    prompt: buildResearchPrompt(companyName, realData),
    tools: {
      googleSearch: google.tools.googleSearch({}),
    },
  });

  return { researchText, realData };
}

// --- Structure: build valuation tree from research (called by /api/chat/structure) ---
export interface StructureRequest {
  companyName: string;
  researchText: string;
  realData?: ResearchResult["realData"];
}

export interface StructureResult {
  message: string;
  valuation: Valuation;
}

export async function handleStructure(
  req: StructureRequest,
  onProgress?: (status: string) => void,
): Promise<StructureResult> {
  if (USE_MOCK) {
    const valuation = getMockValuation(req.companyName);
    return {
      message: `${valuation.companyName}의 밸류에이션 분석을 완료했습니다. ${valuation.methodology} 방법론을 적용했습니다.`,
      valuation,
    };
  }

  onProgress?.("밸류에이션 트리를 구성하고 있습니다...");
  const { output } = await generateText({
    model: proModel,
    system: SYSTEM_PROMPT,
    output: Output.object({ schema: valuationSchema }),
    prompt: buildStructuringPrompt(req.companyName, req.researchText, [], req.realData),
  });

  if (!output) {
    throw new Error("밸류에이션 트리를 생성하지 못했습니다.");
  }

  // Override companyMarketCap with real data if available
  if (req.realData?.stock) {
    output.companyMarketCap = req.realData.stock.marketCap;
    output.companyCode = req.realData.stock.stockCode;
  }

  return {
    message: `${output.companyName}의 밸류에이션 분석을 완료했습니다. ${output.methodology} 방법론을 적용했습니다.`,
    valuation: output,
  };
}

// --- Update: modify existing tree ---
async function handleUpdate(req: ChatRequest): Promise<ChatResponse> {
  if (USE_MOCK) {
    const updated = JSON.parse(JSON.stringify(req.currentValuation)) as Valuation;
    updated.tree.description = `${updated.tree.description} (사용자 요청에 따라 수정됨)`;
    return {
      message: "밸류에이션 트리를 수정했습니다.",
      valuation: updated,
    };
  }

  const treeJson = JSON.stringify(req.currentValuation, null, 2);

  const { output } = await generateText({
    model: fastModel,
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
// For "analyze" intent, returns { intent: "analyze", companyName } so the client
// can call /api/chat/research and /api/chat/structure separately (Vercel 60s timeout fix).
export type ChatResult =
  | { type: "response"; data: ChatResponse }
  | { type: "intent"; data: { intent: "analyze"; companyName: string } };

export async function handleChat(
  req: ChatRequest,
  onProgress?: (status: string) => void,
): Promise<ChatResult> {
  onProgress?.("의도를 분석하고 있습니다...");
  const intent = await routeIntent(req);

  switch (intent.intent) {
    case "answer":
      return { type: "response", data: await handleAnswer(req) };
    case "analyze":
      return {
        type: "intent",
        data: { intent: "analyze", companyName: intent.companyName ?? req.message },
      };
    case "update":
      onProgress?.("밸류에이션 트리를 수정하고 있습니다...");
      return { type: "response", data: await handleUpdate(req) };
  }
}
