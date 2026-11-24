import { formatDate, formatSalary } from "../utils/format";

const GENDER = { male: "Мужской", female: "Женский" };

export default function ResumeView({ resume }) {
  return (
    <div className="card">
      <h2>{resume.res_title}</h2>
      <dl className="facts">
        <div>
          <dt>Специализация</dt>
          <dd>{resume.professional_area || "—"}</dd>
        </div>
        <div>
          <dt>Стаж</dt>
          <dd>{resume.experience_level || "—"}</dd>
        </div>
        <div>
          <dt>Ожидания по зарплате</dt>
          <dd>{formatSalary(resume.salary_expectation) || "—"}</dd>
        </div>
        <div>
          <dt>Регион</dt>
          <dd>{resume.preferred_region || "—"}</dd>
        </div>
        <div>
          <dt>Предпочтительный график</dt>
          <dd>
            {resume.preferred_schedule?.includes("Не имеет значения")
              ? "Не имеет значения"
              : resume.preferred_schedule?.length
                ? resume.preferred_schedule.join(", ")
                : "Не указан"}
          </dd>
        </div>
        <div>
          <dt>Пол</dt>
          <dd>{GENDER[resume.gender] || "—"}</dd>
        </div>
        <div>
          <dt>Дата рождения</dt>
          <dd>{resume.birth_date ? formatDate(resume.birth_date) : "—"}</dd>
        </div>
      </dl>

      <h3>Навыки</h3>
      <p>{resume.skills || "Не указаны"}</p>
      <h3>Опыт</h3>
      <p style={{ whiteSpace: "pre-wrap" }}>{resume.experience || "Не указан"}</p>
      <h3>Образование</h3>
      <p>{resume.education || "Не указано"}</p>
    </div>
  );
}
