import { useState } from "react";
import { clearVideoIdIssues, getVideoIdIssues } from "../utils/adminLog";

export function DebugPanel() {
  const [issues, setIssues] = useState(getVideoIdIssues());

  return (
    <div className="screen debug-panel">
      <h1>Video ID Issues</h1>
      <p className="subtitle">
        Songs that needed a live YouTube search this session (missing or stale stored videoId).
        Only recorded on this device — see README for the full picture.
      </p>
      {issues.length === 0 ? (
        <p className="turn-card-hint">No issues recorded yet.</p>
      ) : (
        <ul className="debug-issue-list">
          {issues.map((issue, i) => (
            <li key={i}>
              <span className={`debug-issue-reason ${issue.reason}`}>{issue.reason}</span>
              <span className="debug-issue-song">
                {issue.title} — {issue.artist}
              </span>
              <span className="debug-issue-meta">
                {issue.songId} · {new Date(issue.timestamp).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      )}
      <button
        className="pill-btn"
        onClick={() => {
          clearVideoIdIssues();
          setIssues([]);
        }}
      >
        Clear log
      </button>
    </div>
  );
}
