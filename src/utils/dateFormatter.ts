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

export function formatDateISO8601(
  year: unknown,
  month: unknown,
  day: unknown,
): string {
  const formattedYear = typeof year === "string" ? year : "";
  const formattedMonth = typeof month === "string" ? month : "";
  const formattedDay = typeof day === "string" ? day : "";

  return `${formattedYear}-${formattedMonth}-${formattedDay}`;
}
