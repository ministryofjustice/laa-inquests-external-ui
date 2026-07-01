const DATE_PADDING = 2;

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

export function formatISODateDDMMYYYY(isoDate: string): string {
  const date = new Date(isoDate);
  const day = String(date.getUTCDate()).padStart(DATE_PADDING, "0");
  const month = String(date.getUTCMonth() + 1).padStart(DATE_PADDING, "0");
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
}
