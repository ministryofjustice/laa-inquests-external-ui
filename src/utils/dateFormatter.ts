export function formatDate(dateString: string): string {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return dateString;
  }

  const day = date.getDate();
  const month = date.toLocaleString("en-GB", { month: "short" });
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

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
