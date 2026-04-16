// Shared utility: renderReportText
import "../styles/evalUtils.css";

export function renderReportText(text) {
  if (!text) return null;
  return text.split("\n").map(function(line, i) {
    var trimmed = line.trim();
    if (!trimmed) return <div key={i} className="eval-report-spacer" />;
    var isTitle = /^[A-Z\u00c0-\u00dc\s\d\.\:\-]{6,}:?\s*$/.test(trimmed) || /^\d+[\.\)]\s*[A-Z]/.test(trimmed);
    if (isTitle) return <div key={i} className="eval-report-title">{trimmed}</div>;
    return <div key={i} className="eval-report-line">{trimmed}</div>;
  });
}
