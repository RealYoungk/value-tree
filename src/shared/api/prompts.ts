export const SYSTEM_PROMPT = `당신은 글로벌 주식 밸류에이션 전문 분석가입니다.

역할:
- 한국 주식 및 미국 주식을 포함한 글로벌 기업의 사업 구조, 재무 데이터, 산업 동향을 종합적으로 분석합니다.
- 각 기업의 특성과 산업군에 가장 적합한 밸류에이션 접근법(SOTP, rNPV, DCF, PER 등)을 스스로 판단합니다.
- 모든 판단에 대해 "왜"를 논리적으로 설명합니다.

핵심 원칙:
- 한국어로 응답합니다.
- 수치에는 반드시 단위를 붙입니다 (억원, $, %, 배, 명 등).
- 미국 기업 분석 시 리서치는 달러($) 기준으로 수행하되, 최종 트리 데이터의 value는 시스템 규격인 **"억원"**으로 환산하여 입력합니다. (기준 환율을 리서치 시점의 환율로 적용하고 description에 명시하세요.)
- 텍스트 답변에서 금액이 1조원 이상이면 "조원"을 우선 사용합니다.
- 모든 선택에는 사고과정을 드러냅니다. 결론만 제시하지 않습니다.

밸류에이션 태도:
- **보수적이 아닌 합리적**으로 추정하세요. 보수적 편향은 과소평가를, 낙관적 편향은 과대평가를 낳습니다.
- 시장 컨센서스(애널리스트 평균 추정치)가 있으면 이를 기본 앵커로 사용하세요. 컨센서스와 다른 수치를 쓸 때는 반드시 이유를 설명하세요.
- 배수를 적용할 때 "보수적으로 할인"하지 마세요. 피어 비교와 시장 데이터에 기반한 합리적 배수를 사용하세요.
- 고성장 기업에 성숙기 기업의 낮은 배수를 적용하면 안 됩니다. 성장률이 다르면 배수도 달라야 합니다.`;

// --- Router: classify user intent ---
export function buildRouterPrompt(
  message: string,
  history: { role: string; content: string }[],
  hasValuation: boolean,
): string {
  const historyText = history
    .slice(-6)
    .map((h) => `${h.role === "user" ? "사용자" : "AI"}: ${h.content}`)
    .join("\n");

  return `사용자의 메시지를 분류하세요.

${historyText ? `최근 대화:\n${historyText}\n\n` : ""}현재 밸류에이션 트리 존재 여부: ${hasValuation ? "있음" : "없음"}

사용자 메시지: "${message}"

분류 기준:
- "analyze": 특정 회사의 밸류에이션 분석을 새로 요청 (회사명을 companyName에 포함)
- "update": 현재 트리의 수정을 요청 (값 변경, 노드 추가/삭제 등). 트리가 없으면 사용 불가
- "answer": 그 외 질문, 설명 요청, 일반 대화`;
}

// --- Real data types for prompt injection ---
export interface RealDataForPrompt {
  stock?: { marketCap: number; closePrice: number; stockCode: string } | null;
  financials?: { revenue: number | null; operatingIncome: number | null; netIncome: number | null; totalAssets: number | null; totalEquity: number | null; totalDebt: number | null; year: string } | null;
}

function formatRealDataSection(realData?: RealDataForPrompt): string {
  if (!realData?.stock && !realData?.financials) return "";

  let section = "\n\n## 실제 시장 데이터 (공공데이터포털/OpenDART 기준)\n아래는 공식 API에서 조회한 실제 데이터입니다. 이 수치를 기본 사실로 사용하고, 모델 지식과 다를 경우 이 데이터를 우선하세요.\n";
  if (realData.stock) {
    section += `- 종목코드: ${realData.stock.stockCode}\n`;
    section += `- 시가총액: ${realData.stock.marketCap.toLocaleString()}억원\n`;
    section += `- 종가: ${realData.stock.closePrice.toLocaleString()}원\n`;
  }
  if (realData.financials) {
    const f = realData.financials;
    section += `- 재무제표 기준연도: ${f.year}\n`;
    if (f.revenue != null) section += `- 매출액: ${f.revenue.toLocaleString()}억원\n`;
    if (f.operatingIncome != null) section += `- 영업이익: ${f.operatingIncome.toLocaleString()}억원\n`;
    if (f.netIncome != null) section += `- 당기순이익: ${f.netIncome.toLocaleString()}억원\n`;
    if (f.totalAssets != null) section += `- 자산총계: ${f.totalAssets.toLocaleString()}억원\n`;
    if (f.totalEquity != null) section += `- 자본총계: ${f.totalEquity.toLocaleString()}억원\n`;
    if (f.totalDebt != null) section += `- 부채총계: ${f.totalDebt.toLocaleString()}억원\n`;
  }
  return section;
}

// --- Research (for analyze) ---
export function buildResearchPrompt(companyName: string, realData?: RealDataForPrompt): string {
  const realDataSection = formatRealDataSection(realData);

  return `"${companyName}" 주식의 밸류에이션 분석을 위해 이 회사에 대해 최대한 폭넓게 검색하고 수집해주세요.
${realDataSection}
수집해야 할 정보:
1. **기본 정보**: 종목코드(한국은 6자리 숫자, 미국은 Ticker), 현재 시가총액, 주가, 기준 환율(미국 기업인 경우)
2. **사업 구조**: 이 회사가 어떤 사업들을 하는지, 매출 구성, 사업부별 비중과 성장성
3. **재무 데이터**: 매출, 영업이익, 순이익, EBITDA, FCF, 순자산 등 주요 재무지표
4. **밸류에이션 참고**: PER, PBR, PSR, EV/EBITDA 등 현재 멀티플과 동종업계 비교
5. **산업 동향**: 시장 규모, 성장률, 경쟁 구도
6. **최근 이벤트**: 실적 발표, 신제품, M&A, 규제 변화 등
7. **증권사/애널리스트 뷰**: 목표주가, 밸류에이션 방법, 핵심 가정. 가능하면 복수의 시각을 수집하세요.

미국 기업이라면 모든 재무 지표를 USD($) 기준으로 먼저 수집하고, 분석 시점의 환율을 함께 파악하세요.`;
}

// --- Structuring (for analyze) ---
export function buildStructuringPrompt(
  companyName: string,
  researchText: string,
  sources: { url: string; title?: string }[],
  realData?: RealDataForPrompt,
): string {
  const sourceList = sources
    .map((s, i) => `[${i + 1}] ${s.title || s.url} — ${s.url}`)
    .join("\n");

  const realDataSection = formatRealDataSection(realData);
  const marketCapNote = realData?.stock
    ? `\n\n**중요**: companyMarketCap은 반드시 ${realData.stock.marketCap}(억원)으로 설정하세요. 이는 실제 시장 데이터입니다.`
    : "";

  return `다음은 "${companyName}"에 대한 리서치 결과입니다:${realDataSection}${marketCapNote}

---
${researchText}
---

참고 출처 목록:
${sourceList || "(출처 없음)"}

위 정보를 바탕으로 "${companyName}"의 밸류에이션 트리를 JSON 구조로 생성해주세요.

## 글로벌 대응 규칙
- **companyCode**: 한국 기업은 6자리 숫자 코드(예: "051910"), 미국 기업은 티커(예: "TSLA", "NVDA")를 입력하세요.
- **통화 환산**: 미국 기업인 경우, 리서치된 달러($) 데이터를 시스템 표준인 **"억원"** 단위로 환산하여 value에 입력하세요.
- **환율 명시**: 루트 노드의 description 최상단에 적용한 기준 환율(예: "적용 환율: 1,350원/USD")을 반드시 명시하세요.

## 밸류에이션 방법론

이 회사의 성장 단계, 산업 특성, 수익 구조를 고려하여 가장 적합한 밸류에이션 방법론을 **스스로 판단**하세요. 어떤 방법론이든 사용할 수 있습니다.

단, 다음 원칙은 반드시 지키세요:
- **Forward vs Trailing**: 과거 실적과 미래 추정치 중 어느 쪽이 이 회사를 더 잘 설명하는지 판단하고, 그 이유를 밝히세요.
- **교차검증**: 산출된 적정가치가 현재 시가총액과 크게 다르면(±30% 이상), 루트 노드 description에서 **왜 시장과 다른 뷰를 갖는지** 또는 **시장의 현재 밸류에이션이 정당한 이유**를 논리적으로 설명하세요.
- **피어 배수**: 배수를 적용할 때는 동일한 성장 단계/산업군의 피어를 사용하세요.

## 사고과정을 보여주는 트리

이 트리의 목적은 단순 계산 결과가 아니라, **"이 회사를 어떻게 밸류에이션해야 하는가"에 대한 분석가의 사고과정**을 구조화하는 것입니다.

트리를 만들 때 다음 질문들에 대한 답이 트리 안에 자연스럽게 녹아 있어야 합니다:
- 왜 이 밸류에이션 방법론을 선택했는가? (루트 노드의 description에)
- 이 회사의 가치를 어떤 구성요소로 나눌 것인가? 왜 이렇게 나누는가?
- 각 구성요소의 가치는 어떤 논리로 산출되는가?
- 핵심 가정(배수, 성장률, 할인율 등)은 왜 이 수치인가? 다른 소스는 뭐라고 하는가?
- 말단 데이터는 어디서 온 것인가?

## 깊이 규칙

각 노드를 **외부 검증 가능한 원시 데이터에 도달할 때까지** 계속 분해하세요.
- 나쁜 예: "반도체 사업부 가치 = 50조원" ← 이건 결론이지 분해가 아님
- 좋은 예: "반도체 가치" → "영업이익 × 배수" → "영업이익 = 매출 × OPM" → "매출 = 메모리 + 비메모리" → ...
- 트리 깊이는 최대 5레벨(루트 포함)입니다. 적극 활용하세요.

## description 활용

description은 이 트리의 핵심입니다. 각 노드의 description에는:
- 이 노드가 왜 여기 있는지 (구조적 이유)
- 이 수치를 왜 이렇게 잡았는지 (판단 근거)
- 다른 선택지가 있었다면 왜 이걸 택했는지 (대안 비교)

## 노드 필드 규칙

- **루트**: name은 "적정가치", value는 최종 산출된 적정가치 (억원 단위)
- **수식 노드**: formula 필드에 "A × B + C" 형태로 기재
- **말단 노드**: formula는 null, 외부 검증 가능한 실제 데이터 값을 value에 기재
- **노드 ID**: "node-{level}-{index}" 형식 (예: node-0-0, node-1-0)
- **sources**: 위 출처 목록에 제공된 URL만 사용하세요. 출처 목록이 비어있으면 sources는 빈 배열 []로 두세요. **절대로 URL을 만들어내지 마세요.**
- **companyMarketCap**: 현재 시가총액 (억원)
- **companyCode**: 한국 기업은 6자리 숫자, 미국 기업은 Ticker (모르면 "N/A")
- **단위**: 금액 "억원", 비율 "%", 배수 "배" (내부 계산은 억원을 기준으로 하되, 설명에는 달러 병기 가능)`;
}

// --- Answer (text only) ---
export function buildAnswerPrompt(
  message: string,
  history: { role: string; content: string }[],
  currentTree?: string,
): string {
  const historyText = history
    .slice(-10)
    .map((h) => `${h.role === "user" ? "사용자" : "AI"}: ${h.content}`)
    .join("\n");

  return `${historyText ? `대화 기록:\n${historyText}\n\n` : ""}${currentTree ? `현재 밸류에이션 트리:\n${currentTree}\n\n` : ""}사용자: ${message}

위 맥락을 참고하여 사용자의 질문에 답변하세요. 간결하게 답변하되, 밸류에이션 트리에 대한 질문이면 트리의 구체적인 노드와 수치를 참조하세요.

금액 표기 규칙:
- 10,000억원 이상은 "N조 M억원" 형식으로 표기하세요.
- 큰 금액을 억원만으로 길게 나열하지 마세요.`;
}

// --- Update (modify existing tree) ---
export function buildUpdatePrompt(
  message: string,
  currentTree: string,
): string {
  return `현재 밸류에이션 트리:
${currentTree}

사용자 요청: "${message}"

위 요청에 따라 밸류에이션 트리를 수정해주세요.

규칙:
1. 요청된 부분만 수정하세요. 나머지는 그대로 유지합니다.
2. 수정된 값이 상위 노드에 영향을 주면, **영향받는 모든 상위 노드의 value를 재계산**하세요.
3. 수정된 노드의 description에 변경 이유를 기재하세요 (예: "사용자 요청에 따라 15% → 20%로 변경").
4. formula가 있는 노드는 children의 값이 바뀌면 value도 재계산하세요.
5. 기존 노드 ID, 구조, 출처는 변경하지 않습니다 (수정 대상 제외).`;
}
