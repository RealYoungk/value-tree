/**
 * Server-only module: fetches real financial data from
 * 공공데이터포털 (stock price/market cap) + OpenDART (financial statements).
 */

export interface StockInfo {
  stockCode: string;
  stockName: string;
  marketCap: number; // 억원
  closePrice: number; // 원
  listedShares: number;
}

export interface FinancialData {
  revenue: number | null; // 매출액 (억원)
  operatingIncome: number | null; // 영업이익 (억원)
  netIncome: number | null; // 당기순이익 (억원)
  totalAssets: number | null; // 자산총계 (억원)
  totalEquity: number | null; // 자본총계 (억원)
  totalDebt: number | null; // 부채총계 (억원)
  year: string;
  reportType: string; // 11011=사업보고서, 11012=반기, 11013=1분기, 11014=3분기
}

export interface CompanyData {
  stock: StockInfo | null;
  financials: FinancialData | null;
}

// --- 공공데이터포털: 주식 시세 ---
export async function searchStock(
  companyName: string,
): Promise<StockInfo | null> {
  const apiKey = process.env.DATA_GO_KR_API_KEY;
  if (!apiKey) {
    console.warn("[financial-data] DATA_GO_KR_API_KEY not set, skipping stock lookup");
    return null;
  }

  try {
    const url = new URL(
      "https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/getStockPriceInfo",
    );
    url.searchParams.set("serviceKey", apiKey);
    url.searchParams.set("likeItmsNm", companyName);
    url.searchParams.set("numOfRows", "1");
    url.searchParams.set("resultType", "json");

    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) {
      console.error("[financial-data] 공공데이터포털 API error:", res.status);
      return null;
    }

    const json = await res.json();
    const items = json?.response?.body?.items?.item;
    if (!items || (Array.isArray(items) && items.length === 0)) {
      return null;
    }

    const item = Array.isArray(items) ? items[0] : items;

    const listedShares = Number(item.lstgStCnt) || 0;
    const closePrice = Number(item.clpr) || 0;
    const marketCap = Math.round((listedShares * closePrice) / 100_000_000); // 억원

    return {
      stockCode: item.srtnCd?.replace(/^0+/, "") || item.isinCd || "",
      stockName: item.itmsNm || companyName,
      marketCap,
      closePrice,
      listedShares,
    };
  } catch (err) {
    console.error("[financial-data] searchStock error:", err);
    return null;
  }
}

// --- OpenDART: 재무제표 ---
export async function getFinancials(
  companyName: string,
): Promise<FinancialData | null> {
  const apiKey = process.env.OPENDART_API_KEY;
  if (!apiKey) {
    console.warn("[financial-data] OPENDART_API_KEY not set, skipping financials lookup");
    return null;
  }

  try {
    // Step 1: corp_code 조회 via 공시검색
    const corpCode = await findCorpCode(apiKey, companyName);
    if (!corpCode) {
      console.warn(`[financial-data] corp_code not found for "${companyName}"`);
      return null;
    }

    // Step 2: 최신 사업보고서 재무제표 조회
    // Try report types in order: 사업보고서(11011) → 반기(11012) → 3분기(11014) → 1분기(11013)
    const currentYear = new Date().getFullYear();
    const reportTypes = ["11011", "11012", "11014", "11013"];

    for (const year of [String(currentYear - 1), String(currentYear - 2)]) {
      for (const reprtCode of reportTypes) {
        const financials = await fetchDartFinancials(
          apiKey,
          corpCode,
          year,
          reprtCode,
        );
        if (financials) return financials;
      }
    }

    return null;
  } catch (err) {
    console.error("[financial-data] getFinancials error:", err);
    return null;
  }
}

async function findCorpCode(
  apiKey: string,
  companyName: string,
): Promise<string | null> {
  const url = new URL("https://opendart.fss.or.kr/api/company.json");
  url.searchParams.set("crtfc_key", apiKey);
  url.searchParams.set("corp_name", companyName);

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const json = await res.json();
  if (json.status !== "000") return null;

  return json.corp_code || null;
}

async function fetchDartFinancials(
  apiKey: string,
  corpCode: string,
  bsnsYear: string,
  reprtCode: string,
): Promise<FinancialData | null> {
  const url = new URL(
    "https://opendart.fss.or.kr/api/fnlttSinglAcnt.json",
  );
  url.searchParams.set("crtfc_key", apiKey);
  url.searchParams.set("corp_code", corpCode);
  url.searchParams.set("bsns_year", bsnsYear);
  url.searchParams.set("reprt_code", reprtCode);

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const json = await res.json();
  if (json.status !== "000" || !json.list) return null;

  const list: Array<{
    account_nm: string;
    thstrm_amount: string;
    fs_div: string;
  }> = json.list;

  // Prefer consolidated (CFS), fall back to individual (OFS)
  const cfs = list.filter((item) => item.fs_div === "CFS");
  const items = cfs.length > 0 ? cfs : list.filter((item) => item.fs_div === "OFS");

  if (items.length === 0) return null;

  function findAmount(accountName: string): number | null {
    const found = items.find((item) => item.account_nm === accountName);
    if (!found || !found.thstrm_amount) return null;
    const raw = Number(found.thstrm_amount.replace(/,/g, ""));
    if (isNaN(raw)) return null;
    return Math.round(raw / 100_000_000); // 원 → 억원
  }

  return {
    revenue: findAmount("매출액") ?? findAmount("수익(매출액)"),
    operatingIncome: findAmount("영업이익") ?? findAmount("영업이익(손실)"),
    netIncome: findAmount("당기순이익") ?? findAmount("당기순이익(손실)"),
    totalAssets: findAmount("자산총계"),
    totalEquity: findAmount("자본총계"),
    totalDebt: findAmount("부채총계"),
    year: bsnsYear,
    reportType: reprtCode,
  };
}

// --- Yahoo Finance: Global stock data (fallback for non-Korean stocks) ---

const KNOWN_TICKERS: Record<string, string> = {
  "엔비디아": "NVDA", "애플": "AAPL", "테슬라": "TSLA",
  "마이크로소프트": "MSFT", "구글": "GOOGL", "알파벳": "GOOGL",
  "아마존": "AMZN", "메타": "META", "넷플릭스": "NFLX",
  "AMD": "AMD", "인텔": "INTC", "브로드컴": "AVGO",
  "ASML": "ASML", "TSMC": "TSM", "ARM": "ARM",
};

// Yahoo Finance requires crumb + cookie auth. Cache them.
let yahooCrumb: string | null = null;
let yahooCookies: string | null = null;
let yahooCrumbExpiry = 0;

async function getYahooCrumb(): Promise<{ crumb: string; cookies: string } | null> {
  if (yahooCrumb && yahooCookies && Date.now() < yahooCrumbExpiry) {
    return { crumb: yahooCrumb, cookies: yahooCookies };
  }

  try {
    // Step 1: Get cookies from Yahoo
    const cookieRes = await fetch("https://fc.yahoo.com/", {
      redirect: "manual",
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const setCookie = cookieRes.headers.get("set-cookie") || "";

    // Step 2: Get crumb using cookies
    const crumbRes = await fetch(
      "https://query2.finance.yahoo.com/v1/test/getcrumb",
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Cookie: setCookie,
        },
      },
    );
    if (!crumbRes.ok) return null;

    const crumb = await crumbRes.text();
    if (!crumb || crumb.includes("<")) return null; // HTML error page

    yahooCrumb = crumb;
    yahooCookies = setCookie;
    yahooCrumbExpiry = Date.now() + 30 * 60 * 1000; // cache 30 min

    return { crumb, cookies: setCookie };
  } catch (err) {
    console.error("[financial-data] Yahoo crumb error:", err);
    return null;
  }
}

async function resolveYahooTicker(companyName: string): Promise<string | null> {
  if (KNOWN_TICKERS[companyName]) return KNOWN_TICKERS[companyName];
  if (/^[A-Z]{1,5}$/.test(companyName)) return companyName;

  try {
    const auth = await getYahooCrumb();
    const headers: Record<string, string> = { "User-Agent": "Mozilla/5.0" };
    if (auth) headers["Cookie"] = auth.cookies;

    const url = new URL("https://query2.finance.yahoo.com/v1/finance/search");
    url.searchParams.set("q", companyName);
    url.searchParams.set("quotesCount", "1");
    url.searchParams.set("newsCount", "0");
    if (auth) url.searchParams.set("crumb", auth.crumb);

    const res = await fetch(url.toString(), { headers });
    if (!res.ok) return null;

    const json = await res.json();
    return json?.quotes?.[0]?.symbol || null;
  } catch {
    return null;
  }
}

async function searchGlobalStock(
  companyName: string,
): Promise<{ stock: StockInfo; financials: FinancialData | null } | null> {
  try {
    const ticker = await resolveYahooTicker(companyName);
    if (!ticker) {
      console.warn(`[financial-data] Could not resolve ticker for "${companyName}"`);
      return null;
    }

    const auth = await getYahooCrumb();
    if (!auth) {
      console.warn("[financial-data] Yahoo auth failed, skipping global stock lookup");
      return null;
    }

    // Fetch quote + exchange rate in parallel
    const quoteUrl = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${ticker},KRW%3DX&crumb=${encodeURIComponent(auth.crumb)}`;
    const res = await fetch(quoteUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Cookie: auth.cookies,
      },
    });

    if (!res.ok) {
      console.error(`[financial-data] Yahoo quote API error: ${res.status}`);
      return null;
    }

    const json = await res.json();
    const results: Array<Record<string, unknown>> = json?.quoteResponse?.result || [];
    const quote = results.find((r) => r.symbol === ticker);
    const krwQuote = results.find((r) => r.symbol === "KRW=X");

    if (!quote) return null;

    const currency = (quote.currency as string) || "USD";
    const krwRate = currency === "KRW" ? 1 : (krwQuote?.regularMarketPrice as number) || 1380;

    const marketCapUsd = (quote.marketCap as number) || 0;
    const closePriceRaw = (quote.regularMarketPrice as number) || 0;
    const marketCapEok = Math.round((marketCapUsd * krwRate) / 100_000_000);

    const stock: StockInfo = {
      stockCode: ticker,
      stockName: (quote.shortName as string) || (quote.longName as string) || ticker,
      marketCap: marketCapEok,
      closePrice: Math.round(closePriceRaw * krwRate),
      listedShares: (quote.sharesOutstanding as number) || 0,
    };

    // Extract financials from quote data (limited but available)
    const revenueRaw = quote.revenue as number | undefined;
    let financials: FinancialData | null = null;
    if (revenueRaw) {
      financials = {
        revenue: Math.round((revenueRaw * krwRate) / 100_000_000),
        operatingIncome: null,
        netIncome: null,
        totalAssets: null,
        totalEquity: null,
        totalDebt: null,
        year: "TTM",
        reportType: "TTM",
      };
    }

    return { stock, financials };
  } catch (err) {
    console.error("[financial-data] searchGlobalStock error:", err);
    return null;
  }
}

// --- Orchestrator ---
export async function fetchCompanyData(
  companyName: string,
): Promise<CompanyData> {
  // Try Korean APIs first
  const [krStock, krFinancials] = await Promise.all([
    searchStock(companyName),
    getFinancials(companyName),
  ]);

  if (krStock) {
    console.log(`[financial-data] ${companyName}: KR stock found, marketCap=${krStock.marketCap}억원`);
    return { stock: krStock, financials: krFinancials };
  }

  // Fallback: try Yahoo Finance for global stocks
  console.log(`[financial-data] ${companyName}: KR not found, trying Yahoo Finance...`);
  const globalResult = await searchGlobalStock(companyName);

  if (globalResult) {
    console.log(`[financial-data] ${companyName}: Yahoo found, marketCap=${globalResult.stock.marketCap}억원`);
    return {
      stock: globalResult.stock,
      financials: globalResult.financials ?? krFinancials,
    };
  }

  console.log(`[financial-data] ${companyName}: no real data found, LLM-only`);
  return { stock: null, financials: null };
}
