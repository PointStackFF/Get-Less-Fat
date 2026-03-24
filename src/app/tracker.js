"use client";
import "./globals.css";
import { useState, useEffect } from "react";

const START_DATE = "2026-03-23";
const GOAL_DATE = "2026-06-12";
const START_WEIGHT = 213;
const GOAL_WEIGHT = 189;
const TOTAL_DAYS = Math.round((new Date(GOAL_DATE) - new Date(START_DATE)) / (1000 * 60 * 60 * 24));

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

function getDayNum(dateStr) {
  const diff = new Date(dateStr) - new Date(START_DATE);
  return Math.round(diff / (1000 * 60 * 60 * 24)) + 1;
}

function getTargetWeight(dateStr) {
  const day = getDayNum(dateStr) - 1;
  const progress = Math.min(day / TOTAL_DAYS, 1);
  return +(START_WEIGHT - progress * (START_WEIGHT - GOAL_WEIGHT)).toFixed(1);
}

function getDaysLeft() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const goal = new Date(GOAL_DATE);
  return Math.max(0, Math.round((goal - today) / (1000 * 60 * 60 * 24)));
}

const HABITS = [
  { id: "calories", label: "Hit calorie target", icon: "🍽️" },
  { id: "protein", label: "Hit protein target", icon: "💪" },
  { id: "workout", label: "Worked out", icon: "🚴" },
  { id: "noSnacking", label: "No late-night snacking", icon: "🌙" },
  { id: "steps", label: "8k+ steps", icon: "👟" },
  { id: "noIntoxicants", label: "No intoxicants", icon: "🚫" },
];

const styles = `
  .tab { cursor: pointer; padding: 10px 22px; font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; border: none; background: transparent; transition: all 0.2s; color: #4a5270; border-bottom: 2px solid transparent; }
  .tab.active { color: #00e5ff; border-bottom: 2px solid #00e5ff; }
  .tab:hover { color: #a0b0c8; }
  .habit-btn { width: 100%; display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: #111827; border: 1px solid #1e2740; border-radius: 8px; cursor: pointer; transition: all 0.15s; font-family: 'DM Mono', monospace; font-size: 13px; color: #8090b0; }
  .habit-btn.checked { background: #0d2030; border-color: #00e5ff44; color: #e8eaf0; }
  .habit-btn:hover { border-color: #2a3a5a; }
  .check-circle { width: 22px; height: 22px; border-radius: 50%; border: 2px solid #2a3a5a; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.15s; }
  .check-circle.done { background: #00e5ff22; border-color: #00e5ff; }
  .inp { width: 100%; background: #111827; border: 1px solid #1e2740; border-radius: 8px; padding: 12px 16px; color: #e8eaf0; font-family: 'DM Mono', monospace; font-size: 15px; outline: none; transition: border-color 0.2s; }
  .inp:focus { border-color: #00e5ff55; }
  .inp::placeholder { color: #2a3a5a; }
  .save-btn { width: 100%; padding: 14px; background: #00e5ff; color: #0a0e1a; border: none; border-radius: 8px; font-family: 'Bebas Neue', sans-serif; font-size: 18px; letter-spacing: 3px; cursor: pointer; transition: all 0.2s; }
  .save-btn:hover { background: #33edff; transform: translateY(-1px); }
  .save-btn.saved { background: #00c853; }
  .save-btn.error { background: #ff5252; }
  .stat-card { background: #0f1524; border: 1px solid #1a2038; border-radius: 12px; padding: 20px; }
  .log-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid #111827; font-size: 12px; }
`;

export default function Tracker() {
  const [logs, setLogs] = useState({});
  const [view, setView] = useState("checkin");
  const [today] = useState(getTodayStr());
  const [form, setForm] = useState({ weight: "", calories: "", habits: {} });
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("glf-logs");
      if (raw) setLogs(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (logs[today]) {
      const d = logs[today];
      setForm({ weight: d.weight || "", calories: d.calories || "", habits: d.habits || {} });
    }
  }, [loaded, today]);

  function saveLog() {
    const updated = {
      ...logs,
      [today]: { weight: form.weight, calories: form.calories, habits: form.habits, date: today },
    };
    setLogs(updated);
    try {
      localStorage.setItem("glf-logs", JSON.stringify(updated));
      setSaved("saved");
    } catch {
      setSaved("error");
    }
    setTimeout(() => setSaved(false), 3000);
  }

  const logEntries = Object.values(logs).sort((a, b) => a.date > b.date ? 1 : -1);
  const latestWeight = [...logEntries].reverse().find(e => e.weight)?.weight;
  const totalLost = latestWeight ? +(START_WEIGHT - parseFloat(latestWeight)).toFixed(1) : 0;
  const daysLeft = getDaysLeft();
  const targetToday = getTargetWeight(today);
  const onTrack = latestWeight ? parseFloat(latestWeight) <= targetToday + 0.5 : null;

  const chartEntries = logEntries.filter(e => e.weight);
  const chartWidth = 600;
  const chartHeight = 200;
  const pad = { t: 20, r: 20, b: 40, l: 50 };
  const innerW = chartWidth - pad.l - pad.r;
  const innerH = chartHeight - pad.t - pad.b;
  const minW = GOAL_WEIGHT - 2;
  const maxW = START_WEIGHT + 2;
  const wRange = maxW - minW;

  function xPos(dateStr) {
    const day = getDayNum(dateStr) - 1;
    return pad.l + (day / TOTAL_DAYS) * innerW;
  }
  function yPos(w) {
    return pad.t + ((maxW - w) / wRange) * innerH;
  }

  const targetPoints = [
    `${xPos(START_DATE)},${yPos(START_WEIGHT)}`,
    `${xPos(GOAL_DATE)},${yPos(GOAL_WEIGHT)}`,
  ].join(" ");

  const actualPath = chartEntries.length > 1
    ? chartEntries.map((e, i) => `${i === 0 ? "M" : "L"}${xPos(e.date)},${yPos(parseFloat(e.weight))}`).join(" ")
    : null;

  const streakDays = (() => {
    let streak = 0;
    const d = new Date(today);
    while (true) {
      const s = d.toISOString().split("T")[0];
      const entry = logs[s];
      if (!entry) break;
      const hab = entry.habits || {};
      const allDone = HABITS.every(h => hab[h.id]);
      if (!allDone) break;
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  })();

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0e1a",
      fontFamily: "'DM Mono', 'Courier New', monospace",
      color: "#e8eaf0",
      padding: "0 0 60px",
    }}>
      <style>{styles}</style>

      {/* Header */}
      <div style={{ background: "#0d1220", borderBottom: "1px solid #1a2038", padding: "24px 24px 0" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
            <div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: 4, color: "#00e5ff" }}>
                GET LESS FAT
              </div>
              <div style={{ fontSize: 11, color: "#4a5270", letterSpacing: 2, textTransform: "uppercase", marginTop: 2 }}>
                213 → 189 lbs · June 12
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 40, color: daysLeft <= 14 ? "#ff5252" : "#e8eaf0", lineHeight: 1 }}>
                {daysLeft}
              </div>
              <div style={{ fontSize: 10, color: "#4a5270", letterSpacing: 2, textTransform: "uppercase" }}>days left</div>
            </div>
          </div>

          <div style={{ height: 3, background: "#1a2038", borderRadius: 2, margin: "16px 0" }}>
            <div style={{
              height: "100%",
              width: `${Math.min(100, (totalLost / 24) * 100)}%`,
              background: "linear-gradient(90deg, #00e5ff, #00b8d4)",
              borderRadius: 2,
              transition: "width 0.5s ease",
            }} />
          </div>

          <div style={{ display: "flex", gap: 24, marginBottom: 0 }}>
            {[
              { label: "lost", value: totalLost > 0 ? `${totalLost} lbs` : "—", color: totalLost > 0 ? "#00e5ff" : "#4a5270" },
              { label: "to go", value: `${Math.max(0, 24 - totalLost).toFixed(1)} lbs`, color: "#e8eaf0" },
              { label: "streak", value: streakDays > 0 ? `${streakDays}🔥` : "—", color: streakDays > 0 ? "#ffd740" : "#4a5270" },
              { label: "on track", value: onTrack === null ? "—" : onTrack ? "YES" : "BEHIND", color: onTrack === null ? "#4a5270" : onTrack ? "#69f0ae" : "#ff5252" },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div style={{ fontSize: 11, color: "#4a5270", letterSpacing: 1, textTransform: "uppercase" }}>{label}</div>
                <div style={{ fontSize: 20, fontFamily: "'Bebas Neue', sans-serif", color }}>{value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", marginTop: 20, borderBottom: "1px solid #1a2038" }}>
            {[["checkin", "CHECK-IN"], ["progress", "PROGRESS"], ["log", "LOG"]].map(([id, label]) => (
              <button key={id} className={`tab ${view === id ? "active" : ""}`} onClick={() => setView(id)}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 24px 0" }}>

        {/* CHECK-IN */}
        {view === "checkin" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ fontSize: 11, color: "#4a5270", letterSpacing: 2, textTransform: "uppercase" }}>
              {today} · target {targetToday} lbs
            </div>

            <div>
              <div style={{ fontSize: 11, color: "#4a5270", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Morning Weight (lbs)</div>
              <input className="inp" type="number" step="0.1" placeholder="e.g. 211.4"
                value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} />
            </div>

            <div>
              <div style={{ fontSize: 11, color: "#4a5270", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Calories Today</div>
              <input className="inp" type="number" placeholder="e.g. 1840"
                value={form.calories} onChange={e => setForm(f => ({ ...f, calories: e.target.value }))} />
            </div>

            <div>
              <div style={{ fontSize: 11, color: "#4a5270", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Habits</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {HABITS.map(h => {
                  const checked = !!form.habits[h.id];
                  return (
                    <button key={h.id} className={`habit-btn ${checked ? "checked" : ""}`}
                      onClick={() => setForm(f => ({ ...f, habits: { ...f.habits, [h.id]: !f.habits[h.id] } }))}>
                      <div className={`check-circle ${checked ? "done" : ""}`}>
                        {checked && <svg width="12" height="12" viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3" fill="none" stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                      </div>
                      <span style={{ fontSize: 16 }}>{h.icon}</span>
                      <span>{h.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button className={`save-btn ${saved === "saved" ? "saved" : saved === "error" ? "error" : ""}`} onClick={saveLog}>
              {saved === "saved" ? "SAVED ✓" : saved === "error" ? "SAVE FAILED — TRY AGAIN" : "SAVE TODAY"}
            </button>
          </div>
        )}

        {/* PROGRESS */}
        {view === "progress" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div className="stat-card">
              <div style={{ fontSize: 11, color: "#4a5270", letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 }}>Weight vs. Target</div>
              {chartEntries.length < 2 ? (
                <div style={{ color: "#2a3a5a", fontSize: 13, padding: "20px 0", textAlign: "center" }}>
                  Log weight for 2+ days to see your chart
                </div>
              ) : (
                <svg width="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ overflow: "visible" }}>
                  {[189, 195, 200, 205, 210, 213].map(w => (
                    <g key={w}>
                      <line x1={pad.l} y1={yPos(w)} x2={pad.l + innerW} y2={yPos(w)} stroke="#1a2038" strokeWidth="1" />
                      <text x={pad.l - 8} y={yPos(w) + 4} fill="#2a3a5a" fontSize="10" textAnchor="end">{w}</text>
                    </g>
                  ))}
                  <polyline points={targetPoints} fill="none" stroke="#2a3a5a" strokeWidth="1.5" strokeDasharray="6,4" />
                  <line x1={xPos(GOAL_DATE)} y1={pad.t} x2={xPos(GOAL_DATE)} y2={pad.t + innerH} stroke="#00e5ff22" strokeWidth="1" />
                  <path d={actualPath} fill="none" stroke="#00e5ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  {chartEntries.map(e => (
                    <circle key={e.date} cx={xPos(e.date)} cy={yPos(parseFloat(e.weight))} r="4" fill="#00e5ff" />
                  ))}
                  <text x={pad.l} y={chartHeight - 8} fill="#2a3a5a" fontSize="10">Mar 23</text>
                  <text x={pad.l + innerW} y={chartHeight - 8} fill="#2a3a5a" fontSize="10" textAnchor="end">Jun 12</text>
                  <text x={pad.l + innerW * 0.5} y={pad.t + innerH * 0.85} fill="#2a3a5a" fontSize="10" textAnchor="middle">— — target pace</text>
                </svg>
              )}
            </div>

            <div className="stat-card">
              <div style={{ fontSize: 11, color: "#4a5270", letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 }}>Last 7 Days — Habit Completion</div>
              <div style={{ display: "flex", gap: 6 }}>
                {Array.from({ length: 7 }, (_, i) => {
                  const d = new Date(today);
                  d.setDate(d.getDate() - (6 - i));
                  const ds = d.toISOString().split("T")[0];
                  const entry = logs[ds];
                  const hab = entry?.habits || {};
                  const count = HABITS.filter(h => hab[h.id]).length;
                  const pct = count / HABITS.length;
                  const dayLabel = new Date(ds + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1);
                  return (
                    <div key={ds} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <div style={{ width: "100%", height: 60, background: "#111827", borderRadius: 6, display: "flex", alignItems: "flex-end", overflow: "hidden" }}>
                        <div style={{
                          width: "100%", height: `${pct * 100}%`,
                          background: pct === 1 ? "#69f0ae" : pct > 0.5 ? "#00e5ff" : pct > 0 ? "#ffd740" : "#1a2038",
                          transition: "height 0.3s ease", borderRadius: "0 0 4px 4px",
                        }} />
                      </div>
                      <div style={{ fontSize: 10, color: "#4a5270" }}>{dayLabel}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* LOG */}
        {view === "log" && (
          <div>
            <div style={{ fontSize: 11, color: "#4a5270", letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 }}>All Entries</div>
            {logEntries.length === 0 ? (
              <div style={{ color: "#2a3a5a", fontSize: 13, padding: "20px 0", textAlign: "center" }}>No entries yet. Start your first check-in.</div>
            ) : (
              [...logEntries].reverse().map(e => {
                const diff = e.weight ? +(parseFloat(e.weight) - START_WEIGHT).toFixed(1) : null;
                return (
                  <div key={e.date} className="log-row">
                    <div style={{ color: "#4a5270", minWidth: 90 }}>{e.date}</div>
                    <div style={{ minWidth: 70, color: e.weight ? "#e8eaf0" : "#2a3a5a" }}>{e.weight ? `${e.weight} lbs` : "—"}</div>
                    {diff !== null && (
                      <div style={{ minWidth: 60, color: diff < 0 ? "#69f0ae" : diff > 0 ? "#ff5252" : "#4a5270", fontSize: 11 }}>
                        {diff < 0 ? diff : `+${diff}`}
                      </div>
                    )}
                    <div style={{ color: "#4a5270", fontSize: 11, minWidth: 70 }}>{e.calories ? `${e.calories} cal` : "—"}</div>
                    <div style={{ display: "flex", gap: 4, flex: 1, justifyContent: "flex-end" }}>
                      {HABITS.map(h => (
                        <span key={h.id} style={{ fontSize: 14, opacity: e.habits?.[h.id] ? 1 : 0.15 }}>{h.icon}</span>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
