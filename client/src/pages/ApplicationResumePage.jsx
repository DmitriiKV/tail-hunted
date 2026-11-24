import { useNavigate, useParams } from "react-router-dom";
import ResumeView from "../components/ResumeView";
import { useLoad } from "../hooks/useLoad";
import { applicationService } from "../services/applicationService";

export default function ApplicationResumePage() {
  const { appId } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useLoad(() => applicationService.resume(appId), [appId]);

  return (
    <div className="auth-container">
      <button className="btn-small" onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
        ← К откликам
      </button>
      {loading && <p className="muted">Загрузка…</p>}
      {error && <p className="error">{error}</p>}
      {data && <ResumeView resume={data.resume} />}
    </div>
  );
}
