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

export function pregnancyWeek(dueDate: string) {
  const due = new Date(dueDate);
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
