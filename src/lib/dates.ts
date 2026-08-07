const MONTH_NAMES_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export const WEEKDAY_LABELS_PT = ["D", "S", "T", "Q", "Q", "S", "S"];
export const WEEKDAY_SHORT_PT = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

export function formatDatePtBR(date: Date): string {
  return date.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export function formatMonthYearPtBR(year: number, month: number): string {
  return `${MONTH_NAMES_PT[month]} ${year}`;
}

/** Normalizes a Date to a stable "YYYY-M-D" key, ignoring time-of-day. */
function toDayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/**
 * A date's *local* calendar day as a zero-padded "YYYY-MM-DD" string --
 * used as the StudyDay.date storage key. Storing a plain string (rather
 * than a DateTime) sidesteps local-vs-UTC round-trip ambiguity: a DateTime
 * read back from Postgres would need re-interpreting through local getters
 * to recover "which day was this", which silently breaks if the server's
 * timezone isn't UTC. A string carries no timezone to get wrong.
 */
export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Inverse of toDateKey: a local Date at midnight for that calendar day. */
export function fromDateKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Number of distinct calendar days with at least one check-in. */
export function countActiveDays(checkinDates: Date[]): number {
  return new Set(checkinDates.map(toDayKey)).size;
}

function toDayIndex(date: Date): number {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
}

/** Length of the consecutive run of active days ending at `days[endIndex]`. */
function runEndingAt(days: number[], endIndex: number): number {
  let length = 1;
  let i = endIndex;
  while (i > 0 && days[i] - days[i - 1] === 1) {
    length += 1;
    i -= 1;
  }
  return length;
}

export type StreakStatus =
  | { kind: "active"; days: number }
  | { kind: "none" }
  | { kind: "lost"; days: number };

/**
 * Full streak status, distinguishing "never checked in" from "had a streak
 * and let it lapse" -- both show 0 on a plain streak count, but call for
 * different messaging ("você não tem sequência" vs. "você perdeu a
 * sequência"). A streak stays "active" through today even before today's
 * check-in; it only lapses once a full day passes with none.
 */
export function getStreakStatus(checkinDates: Date[]): StreakStatus {
  if (checkinDates.length === 0) return { kind: "none" };

  const activeDayIndices = Array.from(new Set(checkinDates.map(toDayIndex))).sort((a, b) => a - b);
  const todayIndex = toDayIndex(new Date());
  const lastActiveIndex = activeDayIndices[activeDayIndices.length - 1];

  const isAlive = lastActiveIndex === todayIndex || lastActiveIndex === todayIndex - 1;
  const days = runEndingAt(activeDayIndices, activeDayIndices.length - 1);

  return isAlive ? { kind: "active", days } : { kind: "lost", days };
}

/** Longest run of consecutive active days ever, not just the current streak. */
export function calculateLongestStreak(checkinDates: Date[]): number {
  if (checkinDates.length === 0) return 0;

  const days = Array.from(new Set(checkinDates.map(toDayIndex))).sort((a, b) => a - b);
  let longest = 1;
  let current = 1;
  for (let i = 1; i < days.length; i++) {
    current = days[i] === days[i - 1] + 1 ? current + 1 : 1;
    longest = Math.max(longest, current);
  }
  return longest;
}

/** Shifts a (year, month) pair by `delta` months, month is 0-indexed. */
export function addMonths(year: number, month: number, delta: number) {
  const date = new Date(year, month + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
}

export type CalendarCell = {
  day: number | null;
  isActive: boolean;
  isToday: boolean;
  photoUrl: string | null;
};

/**
 * Builds a Sunday-first month grid (leading blanks + one cell per day),
 * matching the original mockup's buildCalendar(), but driven by real
 * check-ins instead of a hardcoded "day 1 is active" rule. Each active day
 * carries a photo (the most recent check-in's, if there's more than one
 * that day) so the calendar cell can use it as a background.
 */
export function buildMonthCalendar(
  year: number,
  month: number,
  checkins: Array<{ createdAt: Date; photoUrl: string }>
): CalendarCell[] {
  // `checkins` is expected newest-first, so the first match per day wins,
  // giving us that day's most recent check-in photo.
  const photoByDay = new Map<number, string>();
  for (const c of checkins) {
    if (c.createdAt.getFullYear() !== year || c.createdAt.getMonth() !== month) continue;
    const day = c.createdAt.getDate();
    if (!photoByDay.has(day)) photoByDay.set(day, c.photoUrl);
  }

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  const firstWeekday = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: CalendarCell[] = [];
  for (let i = 0; i < firstWeekday; i++) {
    cells.push({ day: null, isActive: false, isToday: false, photoUrl: null });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({
      day,
      isActive: photoByDay.has(day),
      isToday: isCurrentMonth && today.getDate() === day,
      photoUrl: photoByDay.get(day) ?? null,
    });
  }
  return cells;
}

/** Whole days between two dates (ignoring time-of-day), always >= 0. */
export function daysBetween(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  const diffMs = b.getTime() - a.getTime();
  return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
}

/** Start of the current ISO week (Monday) at 00:00. */
export function startOfWeek(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // shift Sunday to end of week
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Start of the current calendar day at 00:00. */
export function startOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Start of the current calendar month, day 1 at 00:00. */
export function startOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** "12min" below an hour, "2h 30" once it crosses one, "1h" exactly on the hour -- for the live check-in timer. */
export function formatElapsed(ms: number): string {
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${String(minutes).padStart(2, "0")}`;
}
