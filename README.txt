Tail-Hunted: страница «Все отклики» работодателя

1. Скопируйте App.jsx в client/src/App.jsx (с заменой).
2. Скопируйте EmployerAllApplicationsPage.jsx в client/src/pages/.
3. В вашей текущей client/src/pages/HomePage.jsx найдите кнопку «Все вакансии» в блоке «Новые отклики» и замените её на:

<Link to="/applications/all" className="btn-small">Все отклики</Link>

Если у этой кнопки уже есть другой className, можно сохранить его, изменив только to и текст.

Backend и база данных не меняются. Страница получает вакансии работодателя через существующий API, затем загружает отклики по каждой вакансии через существующий endpoint.
