const toNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(String(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(number) ? number : null;
};

const toTime = (value) => {
  const time = value ? new Date(value).getTime() : NaN;
  return Number.isFinite(time) ? time : null;
};

export const salaryOf = toNumber;

export function sortKeepingRank(items, sortType, { dateKey, salaryKey }) {
  // Режим умной ленты: сохраняем порядок ранжирования, полученный от backend.
  if (sortType === "match") return items;

  const readers = {
    newest: [(item) => toTime(item[dateKey]), -1],
    oldest: [(item) => toTime(item[dateKey]), 1],
    salary_asc: [(item) => toNumber(item[salaryKey]), 1],
    salary_desc: [(item) => toNumber(item[salaryKey]), -1],
  };
  const [read, direction] = readers[sortType] || readers.newest;

  return items
    .map((item, rank) => ({ item, rank, value: read(item) }))
    .sort((a, b) => {
      if (a.value === null && b.value !== null) return 1;
      if (a.value !== null && b.value === null) return -1;
      if (a.value !== b.value && a.value !== null) return (a.value - b.value) * direction;
      return a.rank - b.rank;
    })
    .map(({ item }) => item);
}
