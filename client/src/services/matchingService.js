
import api from "../api/client";

export const matchingService = {
  // Рекомендованные вакансии для соискателя
  getRecommendedVacancies: (params = {}) =>
    api.get("/matching/vacancies", { params }).then((r) => r.data),

  // Процент совпадения соискателя с вакансией
  getVacancyMatchScore: (vacancyId) =>
    api.get(`/matching/vacancies/${vacancyId}/score`).then((r) => r.data),

  // Рекомендованные резюме под выбранную вакансию
  getRecommendedResumes: (vacancyId, params = {}) =>
    api.get(`/matching/resumes/${vacancyId}`, { params }).then((r) => r.data),

  // Процент совпадения резюме с выбранной вакансией
  getResumeMatchScore: (resumeId, vacancyId) =>
    api.get(`/matching/resumes/${resumeId}/score/${vacancyId}`).then((r) => r.data),
};
