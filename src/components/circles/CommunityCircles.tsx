import React, { useCallback, useEffect, useState } from "react";
import { CIRCLES, useCirclePeriods } from "./useCirclePeriods";

// ─────────────────────────────────────────────────────────────────────────────
// SVG geometry
// ─────────────────────────────────────────────────────────────────────────────

const SVG_W = 480;
const CX = SVG_W / 2;
const CY = SVG_W / 2;
const MAX_R = 192;
const RING_W = MAX_R / CIRCLES.length; // ~32

function outerR(i: number) { return MAX_R - i * RING_W; }
function innerR(i: number) { return Math.max(0, MAX_R - (i + 1) * RING_W); }
function midR(i: number)   { return (outerR(i) + innerR(i)) / 2; }

// Annular ring path using evenodd fill rule (creates a donut shape)
function annularPath(cx: number, cy: number, ro: number, ri: number): string {
  const outer = `M${cx + ro},${cy} A${ro},${ro},0,1,0,${cx - ro},${cy} A${ro},${ro},0,1,0,${cx + ro},${cy}Z`;
  if (ri <= 0) return outer;
  const inner = `M${cx + ri},${cy} A${ri},${ri},0,1,0,${cx - ri},${cy} A${ri},${ri},0,1,0,${cx + ri},${cy}Z`;
  return outer + inner;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const CommunityCircles: React.FC = () => {
  const {
    periods,
    activePId,
    setActivePId,
    activePeriod,
    setNumber,
    addPeriod,
    removePeriod,
  } = useCirclePeriods();

  const [selId, setSelId] = useState<string>(CIRCLES[0].id);
  const [hovId, setHovId] = useState<string | null>(null);
  const [addingP, setAddingP] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [editVal, setEditVal] = useState("0");

  const selCircle = CIRCLES.find((c) => c.id === selId)!;

  useEffect(() => {
    setEditVal(String(activePeriod?.numbers[selId] ?? 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePId, selId]);

  const setNum = useCallback(
    (raw: string) => {
      setEditVal(raw);
      const n = Math.max(0, parseInt(raw, 10) || 0);
      setNumber(selId, n);
    },
    [selId, setNumber],
  );

  const confirmAdd = useCallback(() => {
    if (!newLabel.trim()) return;
    addPeriod(newLabel);
    setAddingP(false);
    setNewLabel("");
  }, [newLabel, addPeriod]);

  const trend = periods.map((p) => ({
    label: p.label,
    val: p.numbers[selId] ?? 0,
  }));
  const maxTrend = Math.max(...trend.map((t) => t.val), 1);

  return (
    <div className="cc-root">

      {/* ── Period bar ──────────────────────────────────────────────────── */}
      <div className="cc-period-bar">
        <span className="cc-period-title">6-Month Period</span>
        <div className="cc-tabs">
          {periods.map((p) => (
            <div
              key={p.id}
              className={`cc-tab${p.id === activePId ? " cc-tab--active" : ""}`}
            >
              <button className="cc-tab-btn" onClick={() => setActivePId(p.id)}>
                {p.label}
              </button>
              {periods.length > 1 && (
                <button
                  className="cc-tab-x"
                  onClick={() => removePeriod(p.id)}
                  title="Remove period"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {addingP ? (
            <div className="cc-add-form">
              <input
                autoFocus
                className="cc-add-input"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && confirmAdd()}
                placeholder="e.g. H2 2025"
              />
              <button className="btn btn--sm btn--primary" onClick={confirmAdd}>
                Add
              </button>
              <button className="btn btn--sm" onClick={() => setAddingP(false)}>
                ✕
              </button>
            </div>
          ) : (
            <button
              className="btn btn--sm cc-add-period-btn"
              onClick={() => setAddingP(true)}
            >
              + Period
            </button>
          )}
        </div>
      </div>

      {/* ── Main layout ─────────────────────────────────────────────────── */}
      <div className="cc-layout">

        {/* ── SVG diagram ─────────────────────────────────────────────── */}
        <div className="cc-svg-wrap">
          <svg
            viewBox={`0 0 ${SVG_W} ${SVG_W}`}
            className="cc-svg"
            aria-label="Community circles diagram"
          >
            <defs>
              <filter id="cc-glow-sm" x="-25%" y="-25%" width="150%" height="150%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="cc-glow-lg" x="-35%" y="-35%" width="170%" height="170%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {CIRCLES.map((c, i) => {
              const ro   = outerR(i);
              const ri   = innerR(i);
              const rm   = midR(i);
              const isSel = c.id === selId;
              const isHov = c.id === hovId;
              const num  = activePeriod?.numbers[c.id] ?? 0;
              const textY = CY - rm;

              return (
                <g
                  key={c.id}
                  onClick={() => setSelId(c.id)}
                  onMouseEnter={() => setHovId(c.id)}
                  onMouseLeave={() => setHovId(null)}
                  style={{ cursor: "pointer" }}
                >
                  <path
                    d={annularPath(CX, CY, ro, ri)}
                    fillRule="evenodd"
                    fill={isSel ? c.fillSel : c.fill}
                    stroke={c.stroke}
                    strokeWidth={isSel ? 2.5 : isHov ? 1.8 : 1}
                    filter={
                      isSel
                        ? "url(#cc-glow-lg)"
                        : isHov
                        ? "url(#cc-glow-sm)"
                        : undefined
                    }
                    opacity={isSel ? 1 : isHov ? 0.92 : 0.72}
                    style={{ transition: "all 0.2s ease" }}
                  />

                  {/* Short name label */}
                  <text
                    x={CX}
                    y={textY - 7}
                    textAnchor="middle"
                    fill={isSel ? c.stroke : "rgba(255,255,255,0.36)"}
                    fontSize="7"
                    fontFamily="Space Grotesk, sans-serif"
                    fontWeight="600"
                    letterSpacing="0.9"
                    style={{ pointerEvents: "none", transition: "fill 0.2s" }}
                  >
                    {c.shortName.toUpperCase()}
                  </text>

                  {/* Count */}
                  <text
                    x={CX}
                    y={textY + 7}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={isSel ? "#ffffff" : "rgba(255,255,255,0.72)"}
                    fontSize={isSel ? "15" : "13"}
                    fontFamily="DM Mono, monospace"
                    fontWeight="700"
                    style={{ pointerEvents: "none", transition: "all 0.2s" }}
                  >
                    {num}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* ── Detail panel ────────────────────────────────────────────── */}
        <div className="cc-panel">

          {/* Selected circle header */}
          <div
            className="cc-panel-header"
            style={{ borderLeftColor: selCircle.stroke }}
          >
            <span
              className="cc-panel-dot"
              style={{
                background: selCircle.stroke,
                boxShadow: `0 0 10px ${selCircle.stroke}`,
              }}
            />
            <h3 className="cc-panel-name">{selCircle.name}</h3>
          </div>

          <p className="cc-panel-def">{selCircle.definition}</p>

          {/* Number editor */}
          <div className="cc-num-editor">
            <div className="cc-num-label">Count — {activePeriod?.label}</div>
            <div className="cc-num-row">
              <button
                className="cc-num-btn"
                style={{ borderColor: selCircle.stroke, color: selCircle.stroke }}
                onClick={() =>
                  setNum(String(Math.max(0, (parseInt(editVal) || 0) - 1)))
                }
              >
                −
              </button>
              <input
                type="number"
                min="0"
                className="cc-num-input"
                value={editVal}
                onChange={(e) => setNum(e.target.value)}
                style={{
                  borderColor: selCircle.stroke,
                  color: selCircle.stroke,
                  boxShadow: `0 0 0 3px ${selCircle.stroke}22`,
                }}
              />
              <button
                className="cc-num-btn"
                style={{ borderColor: selCircle.stroke, color: selCircle.stroke }}
                onClick={() =>
                  setNum(String((parseInt(editVal) || 0) + 1))
                }
              >
                +
              </button>
            </div>
          </div>

          {/* All circles summary */}
          <div className="cc-summary">
            <div className="cc-summary-hdr">
              All Circles — {activePeriod?.label}
            </div>
            {CIRCLES.map((c) => (
              <div
                key={c.id}
                className={`cc-summary-row${c.id === selId ? " cc-summary-row--active" : ""}`}
                onClick={() => setSelId(c.id)}
                style={{
                  borderColor:
                    c.id === selId ? `${c.stroke}55` : "transparent",
                  background:
                    c.id === selId ? `${c.stroke}0e` : undefined,
                }}
              >
                <span
                  className="cc-summary-dot"
                  style={{
                    background: c.stroke,
                    boxShadow: `0 0 6px ${c.stroke}`,
                  }}
                />
                <span className="cc-summary-name">{c.shortName}</span>
                <span
                  className="cc-summary-num"
                  style={{ color: c.stroke }}
                >
                  {activePeriod?.numbers[c.id] ?? 0}
                </span>
              </div>
            ))}
          </div>

          {/* Trend chart — only shown when >1 period */}
          {periods.length > 1 && (
            <div className="cc-trend">
              <div className="cc-trend-hdr">
                {selCircle.shortName} — Trend
              </div>
              <div className="cc-trend-chart">
                {trend.map(({ label, val }) => (
                  <div key={label} className="cc-trend-col">
                    <div className="cc-trend-bar-bg">
                      <div
                        className="cc-trend-bar"
                        style={{
                          height: `${Math.max(2, Math.round((val / maxTrend) * 60))}px`,
                          background: selCircle.stroke,
                          boxShadow: `0 0 8px ${selCircle.stroke}`,
                        }}
                      />
                    </div>
                    <div className="cc-trend-val" style={{ color: selCircle.stroke }}>
                      {val}
                    </div>
                    <div className="cc-trend-lbl">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityCircles;
