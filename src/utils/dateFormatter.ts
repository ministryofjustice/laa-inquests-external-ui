const DATE_PADDING = 2;
const MONTH_INDEX_OFFSET = 1;

export function formatDateDDMMYYYY(
  year: unknown,
  month: unknown,
  day: unknown,
): string {
  const formattedYear = typeof year === "string" ? year : String(year);
  const formattedMonth = typeof month === "string" ? month : String(month);
  const formattedDay = typeof day === "string" ? day : String(day);

  // Pad day and month to 2 digits
  const dayPadded = formattedDay.padStart(DATE_PADDING, "0");
  const monthPadded = formattedMonth.padStart(DATE_PADDING, "0");

  return `${dayPadded}-${monthPadded}-${formattedYear}`;
}

export function formatDateISOYYYYMMDD(
  year: unknown,
  month: unknown,
  day: unknown,
): string {
  const formattedYear = typeof year === "string" ? year : String(year);
  const formattedMonth = typeof month === "string" ? month : String(month);
  const formattedDay = typeof day === "string" ? day : String(day);

  const monthPadded = formattedMonth.padStart(DATE_PADDING, "0");
  const dayPadded = formattedDay.padStart(DATE_PADDING, "0");

  return `${formattedYear}-${monthPadded}-${dayPadded}`;
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}/v;

export function formatISODateDDMMYYYY(isoDate: string): string {
  if (!ISO_DATE_PATTERN.test(isoDate)) {
    return isoDate;
  }
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) {
    return isoDate;
  }
  const day = String(date.getUTCDate()).padStart(DATE_PADDING, "0");
  const month = String(date.getUTCMonth() + MONTH_INDEX_OFFSET).padStart(
    DATE_PADDING,
    "0",
  );
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
}
