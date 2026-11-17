import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CompanyPage from "./pages/CompanyPage";
import ResumePage from "./pages/ResumePage";
import VacancyPage from "./pages/VacancyPage";
import VacanciesListPage from "./pages/VacanciesListPage";
import MyVacanciesPage from "./pages/MyVacanciesPage";
import ResumesListPage from "./pages/ResumesListPage";
import MyApplicationsPage from "./pages/MyApplicationsPage";
import EmployerApplicationsPage from "./pages/EmployerApplicationsPage";
import ApplicationResumePage from "./pages/ApplicationResumePage";
import VacancyDetailsPage from "./pages/VacancyDetailsPage";
import ResumeDetailsPage from "./pages/ResumeDetailsPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/vacancies" element={<ProtectedRoute role="candidate"><VacanciesListPage /></ProtectedRoute>} />
          <Route
            path="/vacancy/:id"
            element={
              <ProtectedRoute role="candidate">
                <VacancyDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />

          <Route path="/company" element={
            <ProtectedRoute role="employer"><CompanyPage /></ProtectedRoute>
          } />

          <Route path="/resume" element={
            <ProtectedRoute role="candidate"><ResumePage /></ProtectedRoute>
          } />

          <Route path="/vacancy/new" element={
            <ProtectedRoute role="employer"><VacancyPage /></ProtectedRoute>
          } />

          <Route path="/vacancy/:id/edit" element={
            <ProtectedRoute role="employer"><VacancyPage /></ProtectedRoute>
          } />

          <Route path="/my-vacancies" element={
            <ProtectedRoute role="employer"><MyVacanciesPage /></ProtectedRoute>
          } />
          <Route path="/resumes" element={
            <ProtectedRoute role="employer"><ResumesListPage /></ProtectedRoute>
          } />
          <Route
            path="/my-applications"
            element={
              <ProtectedRoute role="candidate">
                <MyApplicationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vacancy/:id/applications"
            element={
              <ProtectedRoute role="employer">
                <EmployerApplicationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/application/:appId/resume"
            element={
              <ProtectedRoute role="employer">
                <ApplicationResumePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resume/:id"
            element={
              <ProtectedRoute role="employer">
                <ResumeDetailsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}