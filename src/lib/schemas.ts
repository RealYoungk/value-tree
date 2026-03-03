import { z } from "zod";

// --- Source ---
export const sourceSchema = z.object({
  label: z.string().describe("출처명 (예: 'GLOBOCAN 2023')"),
  url: z.string().describe("출처 URL"),
});

// --- Fixed-depth Node schemas (bottom-up) ---
const baseFields = {
  id: z.string().describe("고유 식별자 (예: 'node-1-2')"),
  name: z.string().describe("값의 이름 (예: '피크매출')"),
  value: z.number().describe("현재 값 (예: 8250)"),
  unit: z.string().describe("단위 (예: '억원', '%', '명/년')"),
  formula: z
    .string()
    .nullable()
    .describe("수식 표현 (예: '타겟환자수 × 약가 × 점유율'). 말단 노드면 null"),
  description: z
    .string()
    .nullable()
    .describe("이 값의 산출 근거 설명"),
  sources: z.array(sourceSchema).describe("출처 목록"),
};

export const nodeLevel4Schema = z.object({
  ...baseFields,
});

export const nodeLevel3Schema = z.object({
  ...baseFields,
  children: z.array(nodeLevel4Schema).describe("하위 노드"),
});

export const nodeLevel2Schema = z.object({
  ...baseFields,
  children: z.array(nodeLevel3Schema).describe("하위 노드"),
});

export const nodeLevel1Schema = z.object({
  ...baseFields,
  children: z.array(nodeLevel2Schema).describe("하위 노드"),
});

export const nodeLevel0Schema = z.object({
  ...baseFields,
  children: z.array(nodeLevel1Schema).describe("하위 노드"),
});

// --- Valuation (top-level response) ---
export const valuationSchema = z.object({
  companyName: z.string().describe("회사명 (예: '삼성전자')"),
  companyCode: z.string().describe("종목코드 6자리 (예: '005930')"),
  companyMarketCap: z.number().describe("분석 시점 시가총액 (억원)"),
  methodology: z.string().describe("사용한 밸류에이션 방법론 (예: 'SOTP', 'rNPV', 'PER')"),
  tree: nodeLevel0Schema.describe("밸류에이션 트리 루트 노드"),
});

// --- Router intent ---
export const intentSchema = z.object({
  intent: z
    .enum(["answer", "analyze", "update"])
    .describe(
      "answer: 질문에 텍스트로 답변, analyze: 새 회사 밸류에이션 분석, update: 현재 트리 수정",
    ),
  companyName: z
    .string()
    .nullable()
    .describe("분석할 회사명 (analyze일 때만, 나머지는 null)"),
});

// --- TypeScript types ---
export type Source = z.infer<typeof sourceSchema>;
export type Valuation = z.infer<typeof valuationSchema>;
export type Intent = z.infer<typeof intentSchema>;

/** Generic recursive Node type for frontend rendering */
export interface TreeNode {
  id: string;
  name: string;
  value: number;
  unit: string;
  formula: string | null;
  description: string | null;
  sources: Source[];
  children?: TreeNode[];
}
