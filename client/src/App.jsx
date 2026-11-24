import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CompanyPage from "./pages/CompanyPage";
import ResumePage from "./pages/ResumePage";
import VacancyPage from "./pages/VacancyPage";
import VacanciesListPage from "./pages/VacanciesListPage";
import VacancyDetailsPage from "./pages/VacancyDetailsPage";
import MyVacanciesPage from "./pages/MyVacanciesPage";
import ResumesListPage from "./pages/ResumesListPage";
import ResumeDetailsPage from "./pages/ResumeDetailsPage";
import MyApplicationsPage from "./pages/MyApplicationsPage";
import EmployerApplicationsPage from "./pages/EmployerApplicationsPage";
import EmployerAllApplicationsPage from "./pages/EmployerAllApplicationsPage";
import ApplicationResumePage from "./pages/ApplicationResumePage";
import InvitationsPage from "./pages/InvitationsPage";
import NotificationsPage from "./pages/NotificationsPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<HomePage />} />
            <Route path="/invitations" element={<InvitationsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />

            <Route element={<ProtectedRoute role="candidate" />}>
              <Route path="/vacancies" element={<VacanciesListPage />} />
              <Route path="/vacancy/:id" element={<VacancyDetailsPage />} />
              <Route path="/resume" element={<ResumePage />} />
              <Route path="/my-applications" element={<MyApplicationsPage />} />
            </Route>

            <Route element={<ProtectedRoute role="employer" />}>
              <Route path="/company" element={<CompanyPage />} />
              <Route path="/vacancy/new" element={<VacancyPage />} />
              <Route path="/vacancy/:id/edit" element={<VacancyPage />} />
              <Route path="/vacancy/:id/applications" element={<EmployerApplicationsPage />} />
              <Route path="/applications/all" element={<EmployerAllApplicationsPage />} />
              <Route path="/my-vacancies" element={<MyVacanciesPage />} />
              <Route path="/resumes" element={<ResumesListPage />} />
              <Route path="/resume/:id" element={<ResumeDetailsPage />} />
              <Route path="/application/:appId/resume" element={<ApplicationResumePage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
