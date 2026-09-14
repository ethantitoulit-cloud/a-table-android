export const localDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const today = () => localDateKey(new Date());

export const moveDate = (value: string, days: number) => {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + days);
  return localDateKey(date);
};

export const mondayOf = (value: Date | string = new Date()) => {
  const date = typeof value === "string" ? new Date(`${value}T12:00:00`) : new Date(value);
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return localDateKey(date);
};

export const christmasWeek = () => {
  const now = new Date();
  const thisChristmas = new Date(now.getFullYear(), 11, 25, 12);
  return mondayOf(now > thisChristmas ? new Date(now.getFullYear() + 1, 11, 25, 12) : thisChristmas);
};

export const niceDate = (value = today()) => new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(new Date(`${value}T12:00:00`));

export const expiryInfo = (expires?: string | null) => {
  if (!expires) return null;
  const limit = new Date(`${expires}T12:00:00`);
  const current = new Date();
  current.setHours(12, 0, 0, 0);
  const days = Math.ceil((limit.getTime() - current.getTime()) / 86400000);
  if (days < 0) return { days, label: "Date dépassée", level: "expired" };
  if (days === 0) return { days, label: "À consommer aujourd’hui", level: "today" };
  if (days <= 3) return { days, label: `À consommer sous ${days} jour${days > 1 ? "s" : ""}`, level: "soon" };
  return { days, label: `Jusqu’au ${limit.toLocaleDateString("fr-FR")}`, level: "later" };
};
