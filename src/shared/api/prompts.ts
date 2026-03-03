export const SYSTEM_PROMPT = `당신은 한국 주식 밸류에이션 전문 분석가입니다.

역할:
- 회사의 사업 구조, 재무 데이터, 산업 동향을 종합적으로 분석합니다.
- 이 회사에 가장 적합한 밸류에이션 접근법을 스스로 판단합니다.
- 모든 판단에 대해 "왜"를 설명합니다.

핵심 원칙:
- 한국어로 응답합니다.
- 수치에는 반드시 단위를 붙입니다 (억원, %, 배, 명 등).
- 텍스트 답변에서 금액이 1조원 이상이면 "조원"을 우선 사용합니다 (예: 111조 7,494억원).
- JSON 트리 데이터의 unit은 기존 규칙대로 금액 "억원"을 유지합니다.
- 추정치는 보수/낙관 편향 없이, 검증 가능한 사실과 데이터에 기반해 산정합니다.
- 밸류에이션은 상/하방 분기 없이, 객관적 근거 기반의 단일 기준값으로 산출합니다.
- 모든 선택에는 사고과정을 드러냅니다. 결론만 제시하지 않습니다.
- 여러 소스에서 수치가 다르면 범위를 인지하고, 어떤 값을 왜 채택했는지 설명합니다.`;

// --- Router ---
export function buildRouterPrompt(
  message: string,
  history: { role: string; content: string }[],
  hasTree: boolean,
): string {
  const historyText = history
    .slice(-6)
    .map((h) => `${h.role === "user" ? "사용자" : "AI"}: ${h.content}`)
    .join("\n");

  return `사용자의 메시지 의도를 분류하세요.

${historyText ? `최근 대화:\n${historyText}\n` : ""}현재 밸류에이션 트리: ${hasTree ? "있음" : "없음"}

사용자 메시지: "${message}"

분류 기준:
- "analyze": 특정 회사에 대한 새로운 밸류에이션 분석 요청 (예: "삼성전자 분석해줘", "카카오 밸류에이션")
- "update": 현재 열려있는 트리의 수정 요청 (예: "성장률을 20%로 바꿔줘", "할인율 낮춰줘"). 트리가 없으면 update 불가.
- "answer": 그 외 모든 것 (질문, 설명 요청, 일반 대화)`;
}

// --- Research (for analyze) ---
export function buildResearchPrompt(companyName: string): string {
  return `"${companyName}" 주식의 밸류에이션 분석을 위해 이 회사에 대해 최대한 폭넓게 검색하고 수집해주세요.

수집해야 할 정보:
1. **기본 정보**: 종목코드, 현재 시가총액, 주가
2. **사업 구조**: 이 회사가 어떤 사업들을 하는지, 매출 구성, 사업부별 비중과 성장성
3. **재무 데이터**: 매출, 영업이익, 순이익, EBITDA, FCF, 순자산 등 주요 재무지표
4. **밸류에이션 참고**: PER, PBR, PSR, EV/EBITDA 등 현재 멀티플과 동종업계 비교
5. **산업 동향**: 시장 규모, 성장률, 경쟁 구도
6. **최근 이벤트**: 실적 발표, 신제품, M&A, 규제 변화 등
7. **증권사/애널리스트 뷰**: 목표주가, 밸류에이션 방법, 핵심 가정. 가능하면 복수의 시각을 수집하세요.

같은 지표라도 출처마다 다를 수 있습니다. 차이가 있으면 모두 기록하세요.`;
}

// --- Structuring (for analyze) ---
export function buildStructuringPrompt(
  companyName: string,
  researchText: string,
  sources: { url: string; title?: string }[],
): string {
  const sourceList = sources
    .map((s, i) => `[${i + 1}] ${s.title || s.url} — ${s.url}`)
    .join("\n");

  return `다음은 "${companyName}"에 대한 리서치 결과입니다:

---
${researchText}
---

참고 출처 목록:
${sourceList || "(출처 없음)"}

위 정보를 바탕으로 "${companyName}"의 밸류에이션 트리를 JSON 구조로 생성해주세요.

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

## 가정 수립 원칙

- 가정은 검증 가능한 데이터와 명시된 근거를 바탕으로 설정하세요.
- 보수/낙관 어느 한쪽으로 치우치지 말고, 단일 기준값을 합리적으로 선택하세요.
- 출처 간 괴리가 크면 범위와 불확실성을 description에 명시하세요.

## 노드 필드 규칙

- **루트**: name은 "적정가치", value는 최종 산출된 적정가치 (억원 단위)
- **수식 노드**: formula 필드에 "A × B + C" 형태로 기재
- **수식 노드 값 정합성**: value는 children 값을 formula에 대입해 계산한 결과와 일치해야 함
- **말단 노드**: formula는 null, 외부 검증 가능한 실제 데이터 값을 value에 기재
- **노드 ID**: "node-{level}-{index}" 형식 (예: node-0-0, node-1-0)
- **sources**: 근거가 있는 노드에 출처 포함. 위 출처 목록의 URL을 정확히 사용
- **companyMarketCap**: 현재 시가총액 (억원)
- **companyCode**: 종목코드 6자리 (모르면 "000000")
- **단위**: 금액 "억원", 비율 "%", 배수 "배"`;
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
