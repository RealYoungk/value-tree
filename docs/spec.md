# ValuTree Spec

**최종 수정:** 2026.03.03

---

## 1. 제품 정의

### 한 줄 정의

회사명을 입력하면 AI가 밸류에이션 수식 트리를 자동 생성하는 도구

### 타겟 유저

밸류에이션이 어려워서 확신 없이 투자하는 개인투자자 (1차 유저: 나 자신)

### 풀려는 문제

- 밸류에이션이 어렵다 → 확신 없이 매수 → 조금 오르면 팔고, 살 타이밍에 못 삼
- 근본 원인: 논리적 밸류에이션을 구조화하는 프레임이 없음
- 기존 도구(HTS, 매매일지, 스프레드시트)는 "기록"만 하지 "사고 구조"를 제공하지 않음

### 핵심 기능 (MVP)

회사명 입력 → AI가 밸류에이션 트리 자동 생성. AI가 웹 검색으로 데이터를 수집하고, 핵심 밸류 드라이버를 트리 구조로 구성하며, 각 노드마다 설명(description)과 출처를 포함한다.

### 차별점

| 기존 도구 | ValuTree |
|-----------|----------|
| 기록 중심 (메모, 매매일지) | 밸류에이션을 트리로 구조화해서 볼 수 있음 |
| 사용자가 다 해야 함 | 회사명만 입력하면 끝 |
| 근거 없는 감 | 출처 포함된 근거 기반 분석 |
| 적정가치를 직접 계산해야 함 | AI가 수식 트리를 자동 생성 |
| 시총 비교를 따로 해야 함 | 적정가치 vs 시총 비교 즉시 제공 |

### MVP 범위 밖

**안 만드는 것:**

- ❌ 종목 추천 / 매수·매도 신호
- ❌ 매매 알림 / 리마인더
- ❌ 포트폴리오 관리
- ❌ 소셜 기능 / 커뮤니티
- ❌ 해외 주식 (한국 주식만)

**이후 로드맵 (TOBE):**

- 드릴다운: leaf 노드 클릭 → AI에게 해당 노드만 확장 요청
- 수정: 노드 값 수정 → 상위 재계산
- 트리 구조 변경: 방법론 교체, 노드 추가/삭제
- 저장: Firestore에 Valuation 저장
- 히스토리: 과거 분석 목록
- MCP 연동: opendart(재무제표), openkrx(시총/종목코드)
- 바이오텍 고도화: PubMed, Clinical Trials MCP
- 점진적 렌더링: 자동 딥 드릴 + 실시간 UI 업데이트
- 반응형/적응형 UI: 디바이스별 브레이크포인트
- 해외 주식 지원

---

## 2. 도메인 설계

**상태:** 확정 (10개 회사 × 8개 방법론 검증 완료)

### 엔티티

#### Valuation

한 회사에 대한 밸류에이션 분석 한 건. 같은 회사를 여러 번 분석하면 여러 개 생성됨.

| 필드 | 타입 | 설명 |
|------|------|------|
| id | String | 고유 식별자 |
| companyName | String | 분석 대상 회사명 (예: "지아이이노베이션") |
| companyCode | String | 종목코드 (예: "358570") |
| companyMarketCap | double | 분석 시점 시가총액. 적정가치와 비교하기 위한 참고값 |
| tree | Node | 밸류에이션 트리의 최상위 노드 |
| createdAt | DateTime | 생성 시점 |
| updatedAt | DateTime | 마지막 수정 시점 |

#### Node

트리의 모든 노드. 재귀적 구조로 children이 또 Node.

| 필드 | 타입 | 설명 |
|------|------|------|
| id | String | 고유 식별자 |
| name | String | 값의 이름 (예: "피크매출", "성공확률", "타겟 환자수") |
| value | double | 현재 값 (예: 8250, 25, 55000) |
| unit | String | 단위 (예: "억원", "%", "명/년") |
| formula | String? | 수식 표현 (예: "타겟환자수 × 약가 × 점유율"). 없으면 말단 값 |
| description | String? | 이 값이 어떻게 나왔는지에 대한 설명 |
| sources | List\<Source\> | 출처 목록 |
| children | List\<Node\> | 하위 노드들 |
| createdAt | DateTime | 생성 시점 |
| updatedAt | DateTime | 마지막 수정 시점 |

**파생 속성:**

| getter | 로직 | 설명 |
|--------|------|------|
| hasChildren | `children.isNotEmpty` | 하위 노드가 있는 노드. 펼침/접힘 UI에 사용 |

#### Source

노드에 붙는 출처 정보.

| 필드 | 타입 | 설명 |
|------|------|------|
| label | String | 출처명 (예: "GLOBOCAN 2023 (IARC)") |
| url | String | 출처 링크 |

### Dart 코드

```dart
class Valuation {
  final String id;
  final String companyName;
  final String companyCode;
  final double companyMarketCap;
  final Node tree;
  final DateTime createdAt;
  final DateTime updatedAt;
}

class Node {
  final String id;
  final String name;
  final double value;
  final String unit;
  final String? formula;
  final String? description;
  final List<Source> sources;
  final List<Node> children;
  final DateTime createdAt;
  final DateTime updatedAt;

  bool get hasChildren => children.isNotEmpty;
}

class Source {
  final String label;
  final String url;
}
```

### 설계 결정 기록

**NodeType을 없앤 이유**

초기에 formula / data / assumption 세 가지 타입을 enum으로 정의했으나 제거함.

1. 세 타입이 배타적이지 않다. data 노드도 여러 출처 중 선택하는 수식을 가질 수 있고, assumption도 출처가 있을 수 있다. 어떤 노드든 드릴다운하면 children이 생기면서 사실상 formula가 된다.
2. 고정 데이터가 아니라 상태에 따라 바뀐다. "전이성 흑색종 10만명"은 처음엔 말단이지만, 드릴다운하면 "전체 34만 × Stage IV 30%"가 되어 수식 노드가 된다.
3. getter로 파생 가능한 걸 저장하면 안 된다. 타입이 바뀔 때마다 마이그레이션이 필요해지고, 데이터 정합성이 깨질 수 있다.

대신 각 속성으로 독립적 판단: 수식이 있는 노드는 `formula != null`, 출처가 있는 노드는 `sources.isNotEmpty`, 하위 노드가 있는 노드는 `hasChildren`.

**alternatives를 없앤 이유**

초기에 노드마다 alternatives(대안)와 selectedAlternativeId를 뒀으나 제거함. children으로 표현 가능하고, MVP에서 수정 기능을 지원하지 않으므로 대안 선택 UI가 불필요.

**수정 기능을 MVP에서 뺀 이유**

검증할 것은 "AI가 만든 트리가 투자 판단에 도움이 되는가"이지 "수정이 편한가"가 아님. 트리 품질이 좋으면 수정 요구가 자연스럽게 나오고, 그때 만들면 됨.

### 검증 결과

10개 회사, 8가지 밸류에이션 방법론으로 검증. 모든 케이스가 현재 엔티티로 표현 가능.

| 방법론 | 검증 회사 | 핵심 구조 |
|--------|----------|----------|
| SOTP | 삼성전자, 카카오 | 사업부/자회사별 합산 |
| rNPV | 지아이이노베이션, 펩트론 | 피크매출 × 성공확률 ÷ 할인 |
| PER | 크래프톤, 한화에어로스페이스 | 이익 × 배수 |
| PBR | KB금융 | 순자산 × PBR × 주식수 |
| PSR | 쿠팡 | 매출 × PSR |
| DCF | 에코프로비엠 | FCF 현재가치 합 + 터미널밸류 |
| NAV | 맥쿼리인프라 | 자산별 DCF 합산 |
| EV/EBITDA | 현대차 | EBITDA × 배수 - 순부채 |

주의사항 (설계를 깨진 않지만 인지): DCF 연도별 반복 노드로 UI가 길어질 수 있음, 상장 자회사 시총 참조 시 스냅샷 vs 실시간 이슈, EV→시총 변환 중간 단계 필요.

---

## 3. 시스템 설계

### 전체 흐름

```
[사용자]                    [앱]                          [AI (Gemini)]
   │                         │                                │
   │  "지아이이노베이션" 입력  │                                │
   │ ──────────────────────> │                                │
   │                         │  시스템 프롬프트 + 회사명 전송    │
   │                         │ ─────────────────────────────> │
   │                         │                                │ 웹 검색 tool로
   │                         │                                │ 재무/IR/임상 데이터 수집
   │                         │                                │
   │                         │                                │ 밸류에이션 트리 JSON 생성
   │                         │    구조화된 JSON 응답            │
   │                         │ <───────────────────────────── │
   │                         │                                │
   │                         │  JSON → Valuation/Node 파싱     │
   │                         │  트리 UI 렌더링                  │
   │   완성된 밸류에이션 트리   │                                │
   │ <────────────────────── │                                │
```

### AI 프롬프트

**시스템 프롬프트:**

```
너는 주식 밸류에이션 전문가다.

사용자가 회사명을 입력하면, 해당 회사의 적정 기업가치를 수식 트리로 산출하라.

## 규칙

1. 회사의 업종, 성장 단계, 사업 구조에 가장 적합한 밸류에이션 방법론을 선택하라.

2. 모든 노드는 밸류에이션 판단에 의미 있는 수준까지 분해하라.
   - 더 분해해도 판단이 달라지지 않는 수준에서 멈춰라.
   - 불필요하게 세분화하지 마라. (예: 삼성전자 메모리 사업을 DRAM SKU별로 나누는 것은 과도)
   - 반대로, 밸류에이션 결과를 크게 바꾸는 핵심 변수는 반드시 분해하라.

3. 각 노드에는:
   - value: 구체적인 숫자 (추정이라도 넣어라)
   - formula: 수식이 있으면 자연어로 표현 (예: "타겟환자수 × 약가 × 점유율")
   - description: 이 값이 어떻게 도출됐는지 설명
   - sources: 출처가 있으면 label과 url을 포함

4. 최상위 노드의 name은 "{회사명} 적정가치"로 하라.

5. 통화 단위는 원화 기준, 억원 단위를 기본으로 하되 맥락에 맞게 조정하라.

6. 검색 tool을 적극 활용하여 최신 데이터를 수집하라.
   - 최근 재무제표, 실적 컨센서스
   - 업종별 밸류에이션 멀티플
   - 바이오텍이면 임상 데이터, 파이프라인 현황
   - 시장 규모 리서치 보고서
   - 증권사 리포트, IR 자료
```

**사용자 프롬프트:** `{회사명}` — 그게 전부. 회사명만 보내면 AI가 알아서 방법론 선택 + 데이터 수집 + 트리 생성.

### JSON 응답 스키마

Gemini Structured Output으로 강제. `$ref`를 이용한 재귀 구조 지원됨.

```json
{
  "$defs": {
    "Source": {
      "type": "object",
      "properties": {
        "label": { "type": "string" },
        "url": { "type": "string" }
      },
      "required": ["label", "url"]
    },
    "Node": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "value": { "type": "number" },
        "unit": { "type": "string" },
        "formula": { "type": "string" },
        "description": { "type": "string" },
        "sources": {
          "type": "array",
          "items": { "$ref": "#/$defs/Source" }
        },
        "children": {
          "type": "array",
          "items": { "$ref": "#/$defs/Node" }
        }
      },
      "required": ["name", "value", "unit", "children"]
    }
  },
  "type": "object",
  "properties": {
    "companyName": { "type": "string" },
    "companyCode": { "type": "string" },
    "companyMarketCap": { "type": "number" },
    "tree": { "$ref": "#/$defs/Node" }
  },
  "required": ["companyName", "companyCode", "companyMarketCap", "tree"]
}
```

### 응답 예시 (축약)

```json
{
  "companyName": "지아이이노베이션",
  "companyCode": "358570",
  "companyMarketCap": 10000,
  "tree": {
    "name": "지아이이노베이션 적정가치",
    "value": 15000,
    "unit": "억원",
    "formula": "파이프라인 rNPV 합 + 보유현금 - 순부채",
    "description": "SOTP 기반 rNPV 방법론. 주요 파이프라인 3개 + 초기 파이프라인 일괄 반영",
    "sources": [],
    "children": [
      {
        "name": "파이프라인 rNPV 합",
        "value": 13000,
        "unit": "억원",
        "formula": "GI-102 + GI-301 + GI-101A + 초기 파이프라인",
        "description": "각 파이프라인별 rNPV 산출 후 합산",
        "sources": [],
        "children": [
          {
            "name": "GI-102 rNPV",
            "value": 8000,
            "unit": "억원",
            "formula": "피크매출 × 순이익률 × 성공확률 ÷ (1+할인율)^연수",
            "description": "흑색종 + 요로상피암 적응증 합산. FDA 패스트트랙 지정 감안",
            "sources": [
              { "label": "ESMO 2025 포스터", "url": "https://..." },
              { "label": "하나금융투자 (2025.06)", "url": "https://..." }
            ],
            "children": [
              {
                "name": "피크매출",
                "value": 16500,
                "unit": "억원",
                "formula": "타겟환자수 × 환자당약가 × 점유율",
                "children": [
                  { "name": "타겟 환자수", "value": 75000, "unit": "명/년", "children": [] },
                  { "name": "환자당 연간 약가", "value": 150000, "unit": "달러/년", "children": [] },
                  { "name": "피크 시장점유율", "value": 12, "unit": "%", "children": [] }
                ]
              }
            ]
          }
        ]
      },
      { "name": "보유 현금", "value": 2500, "unit": "억원", "children": [] },
      { "name": "순부채", "value": 500, "unit": "억원", "children": [] }
    ]
  }
}
```

---

## 4. UI/UX 개괄

모바일/태블릿 퍼스트 세로 레이아웃.

### 화면 구성

```
┌─────────────────────────────────────────┐
│  🔍 회사명 입력                    [분석]  │  ← 화면 1: 입력
└─────────────────────────────────────────┘

         ↓ 로딩 (AI 분석 중...)

┌─────────────────────────────────────────┐
│  지아이이노베이션                          │  ← 화면 2: 결과
│  358570 | 현재 시총 1조원                  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  적정가치  1.5조원                   │  │  ← 결론 카드
│  │  현재 시총  1.0조원                   │  │
│  │  업사이드  +50%  ▲                   │  │
│  └────────────────────────────────────┘  │
│                                          │
│  밸류에이션 트리                           │
│                                          │
│  ▼ 적정가치 = 1.5조원                     │  ← 트리 시작
│    = 파이프라인 rNPV 합 + 현금 - 부채       │
│    │                                      │
│    ▼ 파이프라인 rNPV 합 = 1.3조원          │
│      │                                    │
│      ▼ GI-102 rNPV = 8,000억원            │
│        = 피크매출 × 순이익률 × PoS ÷ ...   │
│        📎 출처 2건                         │
│        │                                  │
│        ▶ 피크매출 = 1.65조원          [접힘] │
│        ▶ 성공확률 = 28.8%             [접힘] │
│      │                                    │
│      ▶ GI-301 rNPV = 3,000억원       [접힘] │
│    │                                      │
│    ▶ 보유 현금 = 2,500억원                 │
│    ▶ 순부채 = 500억원                      │
│                                          │
│  ※ 공개 데이터 기반 추정치이며              │
│    투자 권유가 아닙니다.                    │
└─────────────────────────────────────────┘
```

### 인터랙션

| 동작 | 결과 |
|------|------|
| 노드 탭 | 접힘/펼침 토글 |
| 출처 탭 | 출처 목록 펼침, 링크 클릭 시 외부 브라우저 |
| 수식 표시 | 수식이 있는 노드는 name 아래에 "= 수식" 표시 |
| 최상단 카드 | 적정가치 vs 시총 비교, 업사이드/다운사이드 % |

### 로딩 상태

- AI 호출 중: 스켈레톤 트리 + "분석 중..." 메시지
- 예상 소요 시간: 10-30초 (검색 tool 사용 횟수에 따라 변동)
- 에러 시: "분석에 실패했습니다. 다시 시도해주세요." + 재시도 버튼

---

## 5. 기술 구현

### 스택

- **프론트엔드:** Flutter Web
- **AI:** Gemini 2.5 Flash (Firebase AI Logic)
- **데이터 수집:** Gemini 내장 Google Search tool (grounding)

### 코드

**DataSource — Gemini API 래퍼 (도메인 모름):**

```dart
// data/gemini/datasources/gemini_data_source.dart
class GeminiDataSource {
  Future<Map<String, dynamic>> generateContent({
    required String systemInstruction,
    required String prompt,
    required Schema responseSchema,
  }) async {
    final model = FirebaseAI.instance.generativeModel(
      model: 'gemini-2.5-flash',
      systemInstruction: Content.text(systemInstruction),
      generationConfig: GenerationConfig(
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      ),
      tools: [Tool.googleSearch()],
    );
    final response = await model.generateContent([Content.text(prompt)]);
    return jsonDecode(response.text!) as Map<String, dynamic>;
  }
}
```

**Repository 인터페이스 (Domain Layer):**

```dart
// domain/valuation/repos/valuation_repository.dart
abstract interface class ValuationRepository {
  Future<Valuation> analyze(String companyName);
}
```

**Repository 구현 — 프롬프트 조립 + JSON→Entity 변환 (Data Layer):**

```dart
// data/repositories/valuation_repository_impl.dart
class ValuationRepositoryImpl implements ValuationRepository {
  ValuationRepositoryImpl(this._geminiDataSource);
  final GeminiDataSource _geminiDataSource;

  @override
  Future<Valuation> analyze(String companyName) async {
    final json = await _geminiDataSource.generateContent(
      systemInstruction: _systemPrompt,
      prompt: companyName,
      responseSchema: _valuationSchema,
    );
    return Valuation(
      id: const Uuid().v4(),
      companyName: json['companyName'] as String,
      companyCode: json['companyCode'] as String,
      companyMarketCap: (json['companyMarketCap'] as num).toDouble(),
      tree: _toNode(json['tree'] as Map<String, dynamic>),
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
  }

  Node _toNode(Map<String, dynamic> json) {
    return Node(
      id: const Uuid().v4(),
      name: json['name'] as String,
      value: (json['value'] as num).toDouble(),
      unit: json['unit'] as String,
      formula: json['formula'] as String?,
      description: json['description'] as String?,
      sources: (json['sources'] as List?)
          ?.map((s) => Source(label: s['label'] as String, url: s['url'] as String))
          .toList() ?? [],
      children: (json['children'] as List?)
          ?.map((c) => _toNode(c as Map<String, dynamic>))
          .toList() ?? [],
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
  }

  static const _systemPrompt = '''...''';  // 섹션 3의 시스템 프롬프트
  static final _valuationSchema = ...;      // 섹션 3의 JSON 스키마
}
```

**DI 등록 (Core Layer):**

```dart
// core/di/injection.dart
Future<void> initDependencies() async {
  getIt.registerSingleton(GeminiDataSource());
  getIt.registerSingleton<ValuationRepository>(
    ValuationRepositoryImpl(getIt<GeminiDataSource>()),
  );
}
```

**Bloc (Presentation Layer):**

```dart
// presentation/pages/result/result_bloc.dart
class ResultBloc extends Bloc<ResultEvent, ResultState> {
  ResultBloc({required ValuationRepository valuationRepository})
      : _valuationRepository = valuationRepository,
        super(const ResultState()) {
    on<ResultRequested>(_onRequested);
  }

  final ValuationRepository _valuationRepository;

  Future<void> _onRequested(
    ResultRequested event,
    Emitter<ResultState> emit,
  ) async {
    emit(state.copyWith(isLoading: true));
    try {
      final valuation = await _valuationRepository.analyze(event.companyName);
      emit(state.copyWith(valuation: valuation, isLoading: false));
    } on Exception {
      emit(state.copyWith(isLoading: false));
      rethrow;
    }
  }
}
```

### 데이터 흐름

```
[Gemini API]
     ↓ JSON
GeminiDataSource                    ← API 래퍼 (도메인 모름)
     ↓ Map<String, dynamic>
ValuationRepositoryImpl             ← 프롬프트 조립 + JSON→Entity 변환
     ↓ Valuation, Node, Source (Entity)
ResultBloc
     ↓ ResultState (Freezed)
ResultView (BlocSelector)
     ↓ UI
[사용자 화면]
```

---

## 6. 파일 구조 (Clean Architecture)

```
lib/
├── core/
│   ├── di/
│   │   └── injection.dart                # GetIt DI 컨테이너
│   └── extensions/
│
├── domain/
│   └── valuation/
│       ├── entities/
│       │   ├── valuation.dart            # Valuation (@freezed, JSON 없음)
│       │   ├── node.dart                 # Node (@freezed, JSON 없음)
│       │   └── source.dart              # Source (@freezed, JSON 없음)
│       ├── repos/
│       │   └── valuation_repository.dart  # abstract interface class
│       └── valuation.dart                # 배럴 파일
│
├── data/
│   ├── gemini/
│   │   ├── datasources/
│   │   │   └── gemini_data_source.dart   # Gemini API 래퍼 (도메인 모름)
│   │   └── gemini.dart                   # 배럴 파일
│   └── repositories/
│       └── valuation_repository_impl.dart # 프롬프트 조립 + JSON→Entity 변환
│
└── presentation/
    └── pages/
        ├── input/
        │   ├── input_page.dart           # HookWidget, DI 주입
        │   ├── input_bloc.dart
        │   ├── input_event.dart
        │   ├── input_state.dart
        │   └── input_view.dart
        └── result/
            ├── result_page.dart          # HookWidget, DI 주입
            ├── result_bloc.dart
            ├── result_event.dart
            ├── result_state.dart
            ├── result_view.dart
            └── widgets/
                ├── result_summary_view.dart  # 적정가치 vs 시총 카드
                ├── result_tree_view.dart      # 트리 전체
                └── result_node_view.dart      # 노드 하나
```

### 레이어별 책임

| 레이어 | 클래스 | 책임 |
|--------|--------|------|
| Domain | Valuation, Node, Source | 순수 엔티티. JSON 직렬화 없음 |
| Domain | ValuationRepository | `Future<Valuation> analyze(String companyName)` 인터페이스 |
| Data | GeminiDataSource | Gemini API 래퍼. 도메인을 모름. 프롬프트 받아서 JSON 반환 |
| Data | ValuationRepositoryImpl | 프롬프트 조립 + GeminiDataSource 호출 + JSON→Entity 변환 |
| Presentation | InputBloc | 회사명 입력 → 분석 요청 |
| Presentation | ResultBloc | 트리 데이터 보유 + 펼침/접힘 상태 관리 |

### 만드는 순서

1. `domain/` — Entity(@freezed, JSON 없음) + Repository 인터페이스
2. `data/gemini/` — GeminiDataSource (API 래퍼)
3. `data/repositories/` — ValuationRepositoryImpl (프롬프트 조립 + 변환)
4. `core/di/` — GetIt 등록
5. `presentation/pages/result/` — 트리 렌더링 (BlocSelector)
6. `presentation/pages/input/` — 입력 화면
7. 연결 후 테스트

---

*이 문서가 흔들릴 때 돌아올 기준점. 여기 없는 기능은 MVP에서 안 만든다.*
