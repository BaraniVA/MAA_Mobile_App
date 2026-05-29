export function formatToday() {
  return new Date().toISOString().slice(0, 10);
}

export function displayDate(isoDate: string) {
  const date = new Date(isoDate);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
}

export function isValidProfileName(value: string) {
  return /^[a-zA-Z\s\-'.]+$/.test(value.trim());
}

export function parseDueDateInput(value: string) {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export function pregnancyWeek(dueDate: string) {
  const due = parseDueDateInput(dueDate);
  if (!due) {
    return 0;
  }

  const conception = new Date(due);
  conception.setDate(conception.getDate() - 280);
  const now = new Date();
  const diffDays = Math.max(0, Math.floor((now.getTime() - conception.getTime()) / (1000 * 60 * 60 * 24)));
  return Math.max(1, Math.min(42, Math.floor(diffDays / 7) + 1));
}

export function trimesterFromWeek(week: number) {
  if (week <= 13) return "First Trimester";
  if (week <= 27) return "Second Trimester";
  return "Third Trimester";
}

export function formatDateTimeLocal(date: string, time: string) {
  return `${date}T${time}:00`;
}
