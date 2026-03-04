import Link from "next/link";
import { 
  DollarSign, 
  AlertCircle, 
  Split, 
  Search, 
  Zap, 
  TrendingUp, 
  ArrowRight, 
  CheckCircle2,
  Compass,
  Anchor,
  ShieldCheck,
  BrainCircuit,
  BarChart3
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
      <header className="px-6 py-24 text-center sm:py-32 bg-gradient-to-b from-white to-zinc-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[grid-zinc-200_1px_20px_20px] [mask-image:radial-gradient(ellipse_at_center,white,transparent)] opacity-20" />
        <div className="mx-auto max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-4 py-1.5 text-sm font-semibold text-zinc-600 mb-8 border border-zinc-200">
            <Compass className="h-4 w-4 text-zinc-900" />
            투자의 길을 잃은 당신을 위한 나침반
          </div>
          <h1 className="text-4xl font-black tracking-tight text-zinc-900 sm:text-7xl lg:leading-[1.1]">
            더 이상 <span className="text-zinc-400">후회하지 않는</span><br />
            투자를 위하여.
          </h1>
          <p className="mt-8 text-lg leading-relaxed text-zinc-600 sm:text-xl max-w-2xl mx-auto font-medium">
            "팔껄, 살껄, 물탈걸, 불탈걸..." <br className="sm:hidden" />
            반복되는 후회의 끝은 언제나 <span className="text-zinc-900 font-bold underline decoration-zinc-300 underline-offset-4">명확한 기준</span>의 부재였습니다.
          </p>
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className="w-full sm:w-auto rounded-full bg-zinc-900 px-8 py-4 text-lg font-bold text-white transition-all hover:bg-zinc-800 hover:shadow-xl active:scale-95 flex items-center justify-center gap-2"
            >
              지금 바로 분석하기
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-6 pb-24">
        {/* Pain Points: The "Regret" Section */}
        <section className="mb-32">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "팔껄?", desc: "수익권일 때 못 팔아 고점에 물려있나요?", color: "bg-red-50 text-red-600" },
              { title: "살껄?", desc: "망설이다 날아가는 차트만 보고 있나요?", color: "bg-emerald-50 text-emerald-600" },
              { title: "물탈걸?", desc: "공포에 매수하지 못해 기회를 놓쳤나요?", color: "bg-blue-50 text-blue-600" },
              { title: "불탈걸?", desc: "확신이 없어 비중을 싣지 못했나요?", color: "bg-orange-50 text-orange-600" },
            ].map((item, i) => (
              <div key={i} className="group rounded-3xl bg-white p-8 border border-zinc-100 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
                <div className={`mb-4 inline-flex px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${item.color}`}>
                  Regret
                </div>
                <h3 className="text-2xl font-black mb-2">{item.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <p className="text-zinc-400 font-medium italic">
              "모든 투자의 고통은 가치에 대한 확신이 없을 때 시작됩니다."
            </p>
          </div>
        </section>

        {/* The Solution: Valuation as an Anchor */}
        <section className="mb-32">
          <div className="rounded-[3rem] bg-zinc-900 px-8 py-16 sm:px-16 sm:py-24 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-800 rounded-full blur-3xl opacity-50 -mr-32 -mt-32" />
            <div className="relative z-10 grid gap-12 lg:grid-cols-2 items-center">
              <div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-zinc-900 mb-6">
                  <Anchor className="h-6 w-6" />
                </div>
                <h2 className="text-3xl font-black sm:text-5xl leading-tight mb-8">
                  밸류에이션,<br />
                  당신의 흔들리지 않는<br />
                  투자의 닻(Anchor).
                </h2>
                <div className="space-y-6 text-zinc-400 text-lg leading-relaxed">
                  <p>
                    시장은 늘 요동칩니다. 뉴스와 소문, 차트의 파도 속에서 나를 지켜주는 것은 오직 <span className="text-white font-bold">수치로 증명된 기업의 가치</span>뿐입니다.
                  </p>
                  <p>
                    ValueTree는 복잡한 재무 데이터와 파편화된 정보를 하나의 논리적인 <span className="text-white font-bold">수식 트리</span>로 재구성하여, 당신이 언제 사고 팔아야 할지 스스로 판단할 수 있는 기준점을 제공합니다.
                  </p>
                </div>
              </div>
              <div className="grid gap-4">
                {[
                  { icon: ShieldCheck, title: "심리적 안정감", desc: "가격이 하락해도 가치를 알면 버틸 수 있습니다." },
                  { icon: BrainCircuit, title: "논리적 판단", desc: "남의 말이 아닌 나만의 계산으로 결정합니다." },
                  { icon: BarChart3, title: "기대 수익률", desc: "현재 가격 대비 얼마나 싼지 즉시 파악합니다." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-5 p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <item.icon className="h-8 w-8 text-zinc-400 shrink-0" />
                    <div>
                      <h4 className="font-bold text-white mb-1">{item.title}</h4>
                      <p className="text-zinc-500 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* How It Works: Tree Visualization */}
        <section className="mb-32 space-y-16">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-black sm:text-4xl mb-6">
              복잡한 분석을 1분 만에,<br />
              투명하게 시각화합니다.
            </h2>
            <p className="text-zinc-600">
              AI가 회사명을 기반으로 최적의 밸류에이션 방법론을 선택하고,<br className="hidden sm:block" />
              모든 계산 과정을 트리 구조로 투명하게 보여줍니다.
            </p>
          </div>

          <div className="grid gap-12 sm:grid-cols-2 lg:gap-20 items-center">
            <div className="space-y-8">
              <div className="flex gap-6 items-start">
                <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0 border border-zinc-200">
                  <span className="font-bold text-zinc-900">1</span>
                </div>
                <div>
                  <h4 className="text-xl font-bold mb-2">실시간 데이터 수집</h4>
                  <p className="text-zinc-500 leading-relaxed">
                    AI가 공시, 뉴스, 재무제표를 실시간으로 검색하여 최신 데이터를 확보합니다.
                  </p>
                </div>
              </div>
              <div className="flex gap-6 items-start">
                <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0 border border-zinc-200">
                  <span className="font-bold text-zinc-900">2</span>
                </div>
                <div>
                  <h4 className="text-xl font-bold mb-2">논리적 수식 트리 생성</h4>
                  <p className="text-zinc-500 leading-relaxed">
                    결과만 보여주는 블랙박스가 아닙니다. 어떤 데이터가 어떻게 계산되었는지 수식 트리가 투명하게 공개됩니다.
                  </p>
                </div>
              </div>
              <div className="flex gap-6 items-start">
                <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0 border border-zinc-200">
                  <span className="font-bold text-zinc-900">3</span>
                </div>
                <div>
                  <h4 className="text-xl font-bold mb-2">업사이드 즉시 확인</h4>
                  <p className="text-zinc-500 leading-relaxed">
                    현재 시가총액과 도출된 가치를 비교하여 현재 가격이 싼지 비싼지 한눈에 보여줍니다.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Abstract Tree Visualization */}
            <div className="relative">
              <div className="rounded-[2.5rem] bg-white p-8 shadow-2xl border border-zinc-100 overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-zinc-900 flex items-center justify-center text-white">
                      <Zap className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-zinc-400 uppercase">Analysis Target</div>
                      <div className="font-black text-zinc-900">엔비디아 (NVIDIA)</div>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-black">
                    Completed
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                    <div className="text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-widest">Intrinsic Value</div>
                    <div className="text-2xl font-black text-zinc-900">$3.5 Trillion</div>
                  </div>
                  <div className="ml-6 relative border-l-2 border-zinc-100 pl-6 space-y-3">
                    <div className="p-3 rounded-xl bg-white border border-zinc-100 shadow-sm relative">
                      <div className="absolute -left-6 top-1/2 w-6 h-0.5 bg-zinc-100" />
                      <div className="text-[10px] font-bold text-zinc-400 mb-0.5 uppercase">Data Center</div>
                      <div className="font-bold text-zinc-800">$120B Rev.</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-zinc-100 shadow-sm relative">
                      <div className="absolute -left-6 top-1/2 w-6 h-0.5 bg-zinc-100" />
                      <div className="text-[10px] font-bold text-zinc-400 mb-0.5 uppercase">Gaming</div>
                      <div className="font-bold text-zinc-800">$20B Rev.</div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 pt-8 border-t border-zinc-100 flex justify-between items-center">
                  <span className="font-bold text-zinc-400">Potential Upside</span>
                  <span className="text-3xl font-black text-emerald-500">+25.4%</span>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -z-10 -bottom-6 -right-6 w-full h-full bg-zinc-100 rounded-[2.5rem]" />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-[4rem] bg-zinc-900 p-12 text-center text-white sm:p-24 relative overflow-hidden group">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-800 to-transparent opacity-50 transition-transform duration-1000 group-hover:scale-110" />
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl font-black tracking-tight sm:text-6xl mb-8 leading-tight">
              당신의 투자를 <br /> 증명하세요
            </h2>
            <p className="text-zinc-400 text-lg mb-12 leading-relaxed font-medium">
              첫 번째 밸류에이션 트리를 만드는 데는 1분도 걸리지 않습니다.<br className="hidden sm:block" />
              지금 바로 확신 있는 투자를 시작해보세요.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-3 rounded-full bg-white px-12 py-6 text-xl font-black text-zinc-900 transition-all hover:scale-105 hover:shadow-[0_0_50px_rgba(255,255,255,0.2)] active:scale-95"
            >
              분석 시작하기
              <ArrowRight className="h-6 w-6" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-16 text-center">
        <div className="flex items-center justify-center gap-2 mb-6 opacity-30">
          <div className="h-6 w-6 flex items-center justify-center rounded bg-zinc-900 text-white">
            <DollarSign className="h-3.5 w-3.5" />
          </div>
          <span className="font-bold tracking-tight">ValueTree</span>
        </div>
        <p className="text-[10px] font-black text-zinc-400 tracking-[0.2em] uppercase">
          © 2026 ValueTree. Logically Driven Investing.
        </p>
        <p className="mt-4 text-[10px] text-zinc-300 max-w-md mx-auto px-6">
          ValueTree는 정보 제공 및 분석 보조 도구이며, 최종적인 투자 결정의 책임은 사용자 본인에게 있습니다.
        </p>
      </footer>
    </div>
  );
}
