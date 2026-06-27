// KOFIC 날짜 네비게이션 공용 헬퍼

export function getMonday(dateStr: string): Date {
  const d = new Date(dateStr);
  const day = d.getDay(); // 0=일
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function toCompact(d: Date): string {
  return toIso(d).replace(/-/g, "");
}

export function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toIso(d);
}

// 주간: 월~일
export function buildShowRange(dateStr: string): string {
  const monday = getMonday(dateStr);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return `${toCompact(monday)}~${toCompact(sunday)}`;
}

// 주말: 금~일 (KOBIS weekGb=1 형식)
export function buildWeekendRange(dateStr: string): string {
  const monday = getMonday(dateStr);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return `${toCompact(friday)}~${toCompact(sunday)}`;
}

export function getLastMonday(): string {
  // 가장 최근에 완전히 끝난 주(일요일이 지난 주)의 월요일을 반환
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const day = yesterday.getDay(); // 0=일
  const lastSunday = new Date(yesterday);
  if (day !== 0) lastSunday.setDate(yesterday.getDate() - day);
  return toIso(getMonday(toIso(lastSunday)));
}
