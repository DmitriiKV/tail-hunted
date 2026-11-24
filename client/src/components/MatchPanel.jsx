import { scoreTone } from "../constants/status";

export default function MatchPanel({ match, title, missingTitle }) {
  if (!match) return null;
  const score = Math.round(match.score);

  return (
    <div className="match">
      <div className={`match-score ${scoreTone(score)}`}>{score}%</div>
      <div className="stack" style={{ flex: 1 }}>
        <strong>{title}</strong>
        {match.matched_skills.length > 0 && (
          <div className="chips">
            {match.matched_skills.map((skill) => (
              <span key={skill} className="chip ok">{skill}</span>
            ))}
          </div>
        )}
        {match.missing_skills.length > 0 && (
          <div>
            <div className="muted">{missingTitle}</div>
            <div className="chips">
              {match.missing_skills.map((skill) => (
                <span key={skill} className="chip bad">{skill}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
