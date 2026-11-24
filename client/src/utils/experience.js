export function parseExperienceLevel(value) {
  const empty = { type: "", min: "", max: "", more: "" };
  if (!value) return empty;
  if (value === "Без опыта") return { ...empty, type: "none" };

  const range = value.match(/^От\s+(\d+)\s+до\s+(\d+)\s+лет?$/i);
  if (range) return { type: "range", min: range[1], max: range[2], more: "" };

  const more = value.match(/^Более\s+(\d+)\s+лет?$/i);
  if (more) return { ...empty, type: "more", more: more[1] };

  return empty;
}

export function buildExperienceLevel({ type, min, max, more }) {
  if (type === "none") return "Без опыта";
  if (type === "range") return `От ${min} до ${max} лет`;
  if (type === "more") return `Более ${more} лет`;
  return "";
}

export function experienceFilterLabel(value) {
  if (!value?.type) return "";
  if (value.type === "none") return "Без опыта";
  if (value.type === "range") return `От ${value.min} до ${value.max} лет`;
  if (value.type === "more") return `Более ${value.more} лет`;
  return "";
}

export function matchesExperienceFilter(level, filter) {
  if (!filter?.type) return true;
  const parsed = parseExperienceLevel(level);
  if (!parsed.type) return false;

  if (filter.type === "none") return parsed.type === "none";

  const toBounds = (item) => {
    if (item.type === "none") return [0, 0];
    if (item.type === "range") return [Number(item.min), Number(item.max)];
    if (item.type === "more") return [Number(item.more) + 1, Infinity];
    return null;
  };

  const candidate = toBounds(parsed);
  if (!candidate) return false;

  if (filter.type === "range") {
    const min = Number(filter.min);
    const max = Number(filter.max);
    return candidate[0] <= max && candidate[1] >= min;
  }

  if (filter.type === "more") {
    return candidate[0] > Number(filter.more);
  }

  return true;
}
