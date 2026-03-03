const LOCALE = "ko-KR";
const EOK_PER_JO = 10_000;
const EOK_TEXT_PATTERN = /([+-]?(?:\d{1,3}(?:,\d{3})*|\d+)(?:\.\d+)?)\s*억원/g;

function formatLocalizedNumber(value: number): string {
  return value.toLocaleString(LOCALE, { maximumFractionDigits: 2 });
}

export function formatKrwFromEok(value: number): string {
  const sign = value < 0 ? "-" : "";
  const absolute = Math.abs(value);

  if (absolute < EOK_PER_JO) {
    return `${sign}${formatLocalizedNumber(absolute)}억원`;
  }

  const jo = Math.floor(absolute / EOK_PER_JO);
  const eok = absolute - (jo * EOK_PER_JO);

  if (eok === 0) {
    return `${sign}${jo.toLocaleString(LOCALE)}조원`;
  }

  return `${sign}${jo.toLocaleString(LOCALE)}조 ${formatLocalizedNumber(eok)}억원`;
}

export function formatValueByUnit(value: number, unit: string): string {
  if (unit === "억원") {
    return formatKrwFromEok(value);
  }

  return `${value.toLocaleString(LOCALE)}${unit}`;
}

export function formatCurrencyUnitsInText(text: string): string {
  return text.replace(EOK_TEXT_PATTERN, (full, rawAmount: string) => {
    const numeric = Number(rawAmount.replaceAll(",", ""));

    if (!Number.isFinite(numeric)) {
      return full;
    }

    return formatKrwFromEok(numeric);
  });
}
