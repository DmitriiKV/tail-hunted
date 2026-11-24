export const APPLICATION_STATUS = {
  pending: { label: "Не просмотрен", tone: "warn" },
  viewed: { label: "Просмотрен", tone: "info" },
  invited: { label: "Приглашение", tone: "ok" },
  rejected: { label: "Отказ", tone: "bad" },
};

export const INVITATION_STATUS = {
  pending: { label: "Ждёт ответа", tone: "warn" },
  accepted: { label: "Принято", tone: "ok" },
  rejected: { label: "Отклонено", tone: "bad" },
  cancelled: { label: "Отозвано", tone: "" },
};

export const DECLINE_REASONS = [
  "Не подходит зарплата",
  "Не подходит регион или формат",
  "Уже нашёл работу",
  "Неинтересна позиция",
];

export const scoreTone = (score) => (score >= 70 ? "high" : score >= 40 ? "mid" : "low");
