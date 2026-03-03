import Link from "next/link";
import { 
  DollarSign, 
  AlertCircle, 
  Split, 
  LayoutDashboard, 
  Search, 
  Zap, 
  TrendingUp, 
  ArrowRight, 
  CheckCircle2,
  MinusCircle,
  Clock
} from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white transition-transform group-hover:scale-110">
              <DollarSign className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">ValueTree</span>
          </Link>
          <Link
            href="/"
            className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-zinc-800 hover:shadow-lg active:scale-95"
          >
            시작하기
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="px-6 py-20 text-center sm:py-32 bg-gradient-to-b from-white to-zinc-50">
        <div className="mx-auto max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-600 mb-6">
            <Zap className="h-3.5 w-3.5 text-zinc-900" />
            AI 기반 밸류에이션 자동화
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-6xl lg:leading-[1.15]">
            감으로 하는 투자는 그만. <br className="hidden sm:block" />
            <span className="text-zinc-400">논리로 증명하는 밸류에이션.</span>
          </h1>
          <p className="mt-8 text-lg leading-relaxed text-zinc-600 sm:text-xl max-w-2xl mx-auto">
            ValueTree는 회사명만 입력하면 AI가 실시간 데이터를 수집하고 수식 트리를
            자동으로 생성합니다. 복잡한 분석 과정을 시각화된 구조로 경험하세요.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-6 pb-24">
        {/* The Problem */}
        <section className="mb-24">
          <div className="rounded-3xl bg-white p-8 shadow-sm sm:p-12 border border-zinc-100">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-center mb-12">
              기존 투자의 어려움을 해결합니다
            </h2>
            <div className="grid gap-12 sm:grid-cols-3">
              <div className="flex flex-col gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-lg">확신 없는 매수</h3>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  뉴스와 소문에 의존한 투자는 변동성에 취약합니다. 나만의 논리적 근거가 있어야 흔들리지 않습니다.
                </p>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                  <Split className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-lg">파편화된 정보</h3>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  흩어진 뉴스, 공시, 리포트를 하나의 구조화된 트리로 통합하여 기업의 가치를 입체적으로 파악합니다.
                </p>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-50 text-zinc-600">
                  <Clock className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-lg">분석의 번거로움</h3>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  직접 엑셀을 두드리는 수고를 AI가 대신합니다. 당신은 도출된 논리를 검토하고 판단하는 데만 집중하세요.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* The Solution */}
        <section className="mb-32 space-y-32">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              ValueTree만의 핵심 기능
            </h2>
          </div>

          {/* Feature 1 */}
          <div className="grid gap-12 sm:grid-cols-2 lg:gap-20 items-center">
            <div className="space-y-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-white">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="text-3xl font-bold">회사명 하나면 충분합니다</h3>
              <p className="text-zinc-600 leading-relaxed text-lg">
                분석하고 싶은 회사 이름을 입력하면 AI가 최신 공시, 뉴스, 재무 데이터를 검색하여 최적의 방법론을 선택하고 가치를 산출합니다.
              </p>
            </div>
            <div className="rounded-3xl bg-zinc-100 p-8 shadow-inner border border-zinc-200/50">
              <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-xl shadow-zinc-200/50 border border-zinc-100">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold text-zinc-800">엔비디아(NVIDIA)</span>
                <span className="ml-auto rounded-lg bg-zinc-900 px-2.5 py-1.5 text-[10px] font-bold text-white uppercase tracking-wider">
                  Analyzing...
                </span>
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="grid gap-12 sm:grid-cols-2 lg:gap-20 items-center">
            <div className="order-last sm:order-none rounded-3xl bg-zinc-100 p-8 shadow-inner border border-zinc-200/50">
              <div className="space-y-4">
                <div className="rounded-2xl bg-white p-5 shadow-lg border border-zinc-100">
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Estimated Value</div>
                  <div className="text-2xl font-black text-zinc-900">$3.5 Trillion</div>
                </div>
                <div className="ml-8 relative">
                  <div className="absolute -left-4 top-0 bottom-0 w-0.5 bg-zinc-200" />
                  <div className="rounded-xl bg-white p-4 shadow-md border border-zinc-100 mb-3 relative">
                    <div className="absolute -left-4 top-1/2 w-4 h-0.5 bg-zinc-200" />
                    <div className="text-xs font-bold text-zinc-500">Data Center Rev.</div>
                    <div className="text-lg font-bold">$120B</div>
                  </div>
                  <div className="rounded-xl bg-white p-4 shadow-md border border-zinc-100 relative">
                    <div className="absolute -left-4 top-1/2 w-4 h-0.5 bg-zinc-200" />
                    <div className="text-xs font-bold text-zinc-500">Gaming Rev.</div>
                    <div className="text-lg font-bold">$20B</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-white">
                <LayoutDashboard className="h-6 w-6" />
              </div>
              <h3 className="text-3xl font-bold">투명한 수식 트리</h3>
              <p className="text-zinc-600 leading-relaxed text-lg">
                결과만 보여주지 않습니다. 어떤 데이터가 사용되었고 어떤 계산 과정을 거쳤는지 투명한 트리 구조로 제공하여 사용자가 직접 논리를 검증할 수 있습니다.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="grid gap-12 sm:grid-cols-2 lg:gap-20 items-center">
            <div className="space-y-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-white">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-3xl font-bold">업사이드 즉시 확인</h3>
              <p className="text-zinc-600 leading-relaxed text-lg">
                현재 시가총액과 계산된 적정 가치를 실시간으로 비교합니다. 현재 가격이 싼지 비싼지, 기대 수익률은 얼마인지 즉각적인 인사이트를 얻으세요.
              </p>
            </div>
            <div className="rounded-3xl bg-zinc-900 p-8 shadow-2xl border border-white/10 overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-transparent opacity-50" />
              <div className="relative z-10 space-y-6">
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Market Cap</div>
                    <div className="text-xl font-bold text-white">$2.8T</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Fair Value</div>
                    <div className="text-xl font-bold text-blue-400">$3.5T</div>
                  </div>
                </div>
                <div className="pt-6 border-t border-white/10">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 font-medium">Potential Upside</span>
                    <span className="text-3xl font-black text-emerald-400 flex items-center gap-2">
                      +25%
                      <TrendingUp className="h-6 w-6" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison */}
        <section className="mb-32">
          <h2 className="text-2xl font-bold tracking-tight mb-8 flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            왜 ValueTree인가요?
          </h2>
          <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="px-8 py-5 font-bold text-zinc-900">Feature</th>
                  <th className="px-8 py-5 font-semibold text-zinc-400">전통적 방식</th>
                  <th className="px-8 py-5 font-bold text-zinc-900 bg-zinc-100/50">ValueTree</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                <tr>
                  <td className="px-8 py-5 font-semibold text-zinc-900">데이터 수집</td>
                  <td className="px-8 py-5 text-zinc-500">
                    <div className="flex items-center gap-2">
                      <MinusCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>수동 검색 및 입력</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 font-bold text-zinc-900 bg-zinc-100/50">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>AI 자동 수집</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="px-8 py-5 font-semibold text-zinc-900">분석 시간</td>
                  <td className="px-8 py-5 text-zinc-500">
                    <div className="flex items-center gap-2">
                      <MinusCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>수시간~수일 소요</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 font-bold text-zinc-900 bg-zinc-100/50">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>1분 내외</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="px-8 py-5 font-semibold text-zinc-900">논리 시각화</td>
                  <td className="px-8 py-5 text-zinc-500">
                    <div className="flex items-center gap-2">
                      <MinusCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>불투명한 결론</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 font-bold text-zinc-900 bg-zinc-100/50">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>수식 트리 구조</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-[3rem] bg-zinc-900 p-12 text-center text-white sm:p-24 relative overflow-hidden group">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-800 to-transparent opacity-50 transition-transform duration-1000 group-hover:scale-110" />
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight sm:text-5xl mb-6">
              이제 더 스마트하게 <br /> 투자하세요
            </h2>
            <p className="text-zinc-400 text-lg mb-12 leading-relaxed">
              당신의 첫 번째 밸류에이션 트리를 만드는 데는 1분도 걸리지 않습니다. 지금 바로 무료로 시작해보세요.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-3 rounded-full bg-white px-10 py-5 text-lg font-black text-zinc-900 transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] active:scale-95"
            >
              분석 시작하기
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-16 text-center">
        <div className="flex items-center justify-center gap-2 mb-4 opacity-50">
          <div className="h-6 w-6 flex items-center justify-center rounded bg-zinc-900 text-white">
            <DollarSign className="h-3.5 w-3.5" />
          </div>
          <span className="font-bold tracking-tight">ValueTree</span>
        </div>
        <p className="text-xs font-medium text-zinc-400 tracking-widest uppercase">
          © 2026 ValueTree. Logically Driven Investing.
        </p>
      </footer>
    </div>
  );
}
