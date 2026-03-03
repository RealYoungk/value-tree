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

// --- Orchestrator ---
export async function fetchCompanyData(
  companyName: string,
): Promise<CompanyData> {
  const [stock, financials] = await Promise.all([
    searchStock(companyName),
    getFinancials(companyName),
  ]);

  if (stock || financials) {
    console.log(
      `[financial-data] ${companyName}: stock=${!!stock}, financials=${!!financials}`,
    );
  }

  return { stock, financials };
}
