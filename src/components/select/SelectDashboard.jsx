import React, { useMemo, useState } from "react";
import { C, f, sp, font, mono } from "../../constants";
import { Card } from "../Atoms";
import { getDummyIslandMachines, todayKey, timeLabel } from "../../dummyData";
import {
  filterMachines,
  getGoodMachineCandidates,
  normalizeMachineRows,
  summarizeIsland,
} from "./selectSelectors";

const FILTERS = [
  { id: "all", label: "全台" },
  { id: "candidates", label: "良台候補" },
  { id: "playing", label: "実戦中のみ" },
];

const VERDICT_META = {
  strong:  { label: "本命", color: C.green },
  good:    { label: "候補", color: C.teal },
  watch:   { label: "様子見", color: C.yellow },
  avoid:   { label: "低優先", color: C.red },
  unknown: { label: "不足", color: C.sub },
};

function Header({ title, summary, updatedAt }) {
  return (
    <div style={{ flexShrink: 0, padding: "10px 14px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: C.text, fontFamily: font }}>
            台選び
          </div>
          <div style={{ fontSize: 12, color: C.sub, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {title} ・ 島全体 {summary.total}台
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: C.sub }}>更新 {updatedAt}</div>
          <div style={{ fontSize: 11, color: C.green, fontWeight: 800, marginTop: 4 }}>
            候補 {summary.candidates}台
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterTabs({ active, onChange }) {
  return (
    <div style={{
      display: "flex", gap: 4,
      background: C.surfaceHi, borderRadius: 12, padding: 3,
      border: `1px solid ${C.border}`,
      margin: "0 14px 12px",
    }}>
      {FILTERS.map((t) => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            className="b"
            onClick={() => onChange(t.id)}
            style={{
              flex: 1,
              minHeight: 40,
              background: isActive ? C.surface : "transparent",
              border: "none",
              borderRadius: 9,
              color: isActive ? C.blue : C.sub,
              fontSize: 12,
              fontWeight: isActive ? 800 : 700,
              fontFamily: font,
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function DummyBanner() {
  return (
    <div style={{
      margin: "0 0 12px",
      padding: "8px 12px",
      background: "rgba(234,179,8,0.12)",
      border: "1px solid rgba(234,179,8,0.4)",
      borderRadius: 10,
      color: "#fcd34d",
      fontSize: 11,
      fontFamily: font,
      lineHeight: 1.5,
    }}>
      ※ 台選びはダミー島データです。実データ化は P-EVIDENCE エンジン移植後に行います。
    </div>
  );
}

function machineColor(machine) {
  const meta = VERDICT_META[machine.verdict] || VERDICT_META.unknown;
  const opacity = Math.max(0.18, Math.min(0.72, machine.confidence / 110));
  if (machine.verdict === "unknown") {
    return {
      bg: C.surfaceHi,
      border: C.border,
      color: C.sub,
    };
  }
  return {
    bg: `color-mix(in srgb, ${meta.color} ${Math.round(opacity * 100)}%, var(--surface))`,
    border: `color-mix(in srgb, ${meta.color} 58%, transparent)`,
    color: meta.color,
  };
}

function Heatmap({ machines, selectedId, onSelect }) {
  if (machines.length === 0) {
    return (
      <Card style={{ padding: "28px 16px", textAlign: "center" }}>
        <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.6 }}>
          この条件に合う台はありません。
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div style={{ padding: "12px 14px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 12, color: C.sub, fontWeight: 800, letterSpacing: 0.4 }}>
          島ヒートマップ
        </div>
        <div style={{ fontSize: 10, color: C.sub }}>
          淡い ← 信頼度 → 濃い
        </div>
      </div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
        gap: 6,
        padding: "0 12px 12px",
      }}>
        {machines.map((m) => {
          const active = selectedId === m.id;
          const col = machineColor(m);
          return (
            <button
              key={m.id}
              className="b"
              onClick={() => onSelect(m.id)}
              aria-label={`${m.machineNumber}番台 信頼度${m.confidence}%`}
              style={{
                minHeight: 46,
                borderRadius: 8,
                border: active ? `2px solid ${C.blue}` : `1px solid ${col.border}`,
                background: col.bg,
                color: C.text,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                padding: "4px 2px",
                boxShadow: active ? "0 0 0 2px color-mix(in srgb, var(--blue) 22%, transparent)" : "none",
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 900, fontFamily: mono, lineHeight: 1 }}>
                {m.machineNumber}
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: col.color, lineHeight: 1 }}>
                {m.confidence}%
              </span>
            </button>
          );
        })}
      </div>
      <Legend />
    </Card>
  );
}

function Legend() {
  const items = [
    ["本命", C.green],
    ["候補", C.teal],
    ["様子見", C.yellow],
    ["低優先", C.red],
  ];
  return (
    <div style={{ display: "flex", gap: 8, padding: "0 12px 12px", flexWrap: "wrap" }}>
      {items.map(([label, color]) => (
        <div key={label} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, color: C.sub }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: color, display: "inline-block" }} />
          {label}
        </div>
      ))}
    </div>
  );
}

function SelectedPanel({ machine, onStart }) {
  if (!machine) return null;
  const meta = VERDICT_META[machine.verdict] || VERDICT_META.unknown;
  return (
    <Card style={{ borderColor: `color-mix(in srgb, ${meta.color} 34%, var(--border))` }}>
      <div style={{ padding: "14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start", marginBottom: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: C.text, fontFamily: mono, lineHeight: 1 }}>
              {machine.machineNumber}番台
            </div>
            <div style={{ fontSize: 12, color: C.sub, marginTop: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {machine.machineName}
            </div>
          </div>
          <div style={{
            flexShrink: 0,
            padding: "5px 10px",
            borderRadius: 999,
            color: meta.color,
            background: `color-mix(in srgb, ${meta.color} 16%, transparent)`,
            border: `1px solid color-mix(in srgb, ${meta.color} 35%, transparent)`,
            fontSize: 11,
            fontWeight: 900,
          }}>
            {meta.label}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8, marginBottom: 12 }}>
          <MiniMetric label="EV/K" value={sp(machine.evPerK)} unit="円" color={machine.evPerK >= 0 ? C.green : C.red} />
          <MiniMetric label="ボーダー差" value={sp(machine.borderDiff, 1)} unit="" color={machine.borderDiff >= 0 ? C.green : C.red} />
          <MiniMetric label="信頼度" value={f(machine.confidence)} unit="%" color={meta.color} />
        </div>

        <div style={{ fontSize: 11, color: C.sub, lineHeight: 1.5, marginBottom: 12 }}>
          根拠: {machine.lastSignal} / 試行 {f(machine.sampleRot)}回転
        </div>

        <button
          className="b"
          onClick={() => onStart(machine)}
          style={{
            width: "100%",
            minHeight: 52,
            borderRadius: 12,
            border: "none",
            background: C.blue,
            color: "#fff",
            fontSize: 15,
            fontWeight: 900,
            fontFamily: font,
          }}
        >
          この台で実戦開始
        </button>
      </div>
    </Card>
  );
}

function MiniMetric({ label, value, unit, color }) {
  return (
    <div style={{
      background: C.bg,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      padding: "10px 8px",
      minWidth: 0,
    }}>
      <div style={{ fontSize: 10, color: C.sub, fontWeight: 700, marginBottom: 5 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
        <span style={{ fontSize: 15, fontWeight: 900, color, fontFamily: mono, fontVariantNumeric: "tabular-nums" }}>
          {value}
        </span>
        {unit && <span style={{ fontSize: 10, color: C.sub, fontWeight: 700 }}>{unit}</span>}
      </div>
    </div>
  );
}

function CandidateList({ rows, selectedId, onSelect }) {
  if (rows.length === 0) return null;
  return (
    <Card>
      <div style={{ padding: "12px 14px 4px" }}>
        <div style={{ fontSize: 12, color: C.sub, fontWeight: 800, letterSpacing: 0.4 }}>
          良台候補 TOP5
        </div>
      </div>
      {rows.map((m) => {
        const active = selectedId === m.id;
        const meta = VERDICT_META[m.verdict] || VERDICT_META.unknown;
        return (
          <button
            key={m.id}
            className="b"
            onClick={() => onSelect(m.id)}
            style={{
              width: "100%",
              minHeight: 58,
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              border: "none",
              borderTop: `1px solid ${C.border}`,
              background: active ? "color-mix(in srgb, var(--blue) 10%, transparent)" : "transparent",
              color: C.text,
              textAlign: "left",
            }}
          >
            <div style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: `color-mix(in srgb, ${meta.color} 18%, transparent)`,
              border: `1px solid color-mix(in srgb, ${meta.color} 38%, transparent)`,
              color: meta.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 900,
              fontFamily: mono,
              flexShrink: 0,
            }}>
              {m.rank}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>
                {m.machineNumber}番台
              </div>
              <div style={{ fontSize: 10, color: C.sub, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {m.machineName}
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: m.evPerK >= 0 ? C.green : C.red, fontFamily: mono }}>
                {sp(m.evPerK)}
                <span style={{ fontSize: 10, color: C.sub, marginLeft: 2, fontFamily: font }}>円/K</span>
              </div>
              <div style={{ fontSize: 10, color: meta.color, marginTop: 2, fontWeight: 800 }}>
                信頼度 {m.confidence}%
              </div>
            </div>
          </button>
        );
      })}
    </Card>
  );
}

export default function SelectDashboard({ S, onStart }) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [refreshTick] = useState(0);
  const updatedAt = useMemo(() => {
    void refreshTick;
    return timeLabel(new Date());
  }, [refreshTick]);
  const machines = useMemo(() => getDummyIslandMachines(todayKey()), []);
  const normalized = useMemo(() => normalizeMachineRows(machines), [machines]);
  const summary = useMemo(() => summarizeIsland(normalized), [normalized]);
  const filtered = useMemo(() => filterMachines(normalized, activeFilter), [normalized, activeFilter]);
  const top = useMemo(() => getGoodMachineCandidates(normalized, 5), [normalized]);
  const [selectedId, setSelectedId] = useState(() => (summary.best?.id || normalized[0]?.id || null));
  const selected = normalized.find((m) => m.id === selectedId) || top[0] || normalized[0] || null;
  const title = selected?.machineName || S?.machineName || "島全体";

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Header title={title} summary={summary} updatedAt={updatedAt} />
      <FilterTabs active={activeFilter} onChange={setActiveFilter} />

      <div style={{
        flex: 1,
        overflowY: "auto",
        overflowX: "hidden",
        padding: "0 14px calc(20px + env(safe-area-inset-bottom))",
      }}>
        <DummyBanner />
        <SelectedPanel machine={selected} onStart={onStart} />
        <Heatmap machines={filtered} selectedId={selectedId} onSelect={setSelectedId} />
        <CandidateList rows={top} selectedId={selectedId} onSelect={setSelectedId} />
      </div>
    </div>
  );
}
