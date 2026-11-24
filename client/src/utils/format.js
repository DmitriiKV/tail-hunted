const DATE = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" });
const DATE_YEAR = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" });

export const formatSalary = (value) =>
  value ? `${Number(value).toLocaleString("ru-RU")} ₽` : null;

export function formatDate(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return (sameYear ? DATE : DATE_YEAR).format(date);
}

export function timeAgo(iso) {
  const minutes = Math.floor((Date.now() - new Date(iso + "Z").getTime()) / 60000);
  if (minutes < 1) return "только что";
  if (minutes < 60) return `${minutes} мин назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч назад`;
  return formatDate(iso);
}

export const apiError = (err, fallback) => err.response?.data?.error || fallback;

export const EMPLOYMENT_LABELS = {
  full: "Полная занятость",
  part: "Частичная занятость",
  project: "Проектная работа",
  internship: "Стажировка",
};
