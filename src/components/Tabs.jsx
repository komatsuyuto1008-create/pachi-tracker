import React, { useState, useEffect, useRef } from "react";
import { C, f, sc, sp, tsNow, font, mono } from "../constants";
import { NI, Card, MiniStat, Btn, SecLabel, KV } from "./Atoms";

/* ================================================================
   RotTab — 回転数入力 + リアルタイム実測統計パネル
================================================================ */
export function RotTab({ border, rows, setRows, S, ev }) {
    const [input, setInput] = useState("");
    const [showHitModal, setShowHitModal] = useState(false);
    const [trayBalls, setTrayBalls] = useState("");
    const tableRef = useRef(null);

    useEffect(() => {
        if (tableRef.current) tableRef.current.scrollTop = tableRef.current.scrollHeight;
    }, [rows]);

    const dataRows = rows.filter((r) => r.type === "data");
    const last = dataRows[dataRows.length - 1];

    const rotCol = (v) => {
        if (v == null || isNaN(v)) return C.text;
        if (v >= border + 3) return C.green;
        if (v >= border) return "#86efac";
        if (v >= border - 3) return C.yellow;
        return C.red;
    };

    const decide = () => {
        const val = Number(input);
        if (!input || isNaN(val) || val < 0) return;

        const prevCumRot = last ? last.cumRot : S.startRot;
        const thisRot = val - prevCumRot;
        const newInvest = (last ? last.invest : 0) + 1000;
        const newAvg = parseFloat(((val - S.startRot) / (newInvest / 1000)).toFixed(1));

        setRows((r) => [...r, { type: "data", thisRot, cumRot: val, avgRot: newAvg, invest: newInvest }]);
        S.pushLog({ type: "1K決定", time: tsNow(), rot: thisRot, cash: 1000 });
        setInput("");
    };

    const doStart = () => {
        const val = Number(input);
        if (!input || isNaN(val) || val < 0) return;

        S.setStartRot(val);
        setRows((r) => [...r, { type: "start", cumRot: val }]);
        S.pushLog({ type: "スタート", time: tsNow(), rot: val });
        setInput("");
    };

    const handleHitSubmit = () => {
        const tray = Number(trayBalls) || 0;
        // 上皿玉数を記録 — 投資補正用に加算
        S.setTotalTrayBalls((p) => p + tray);
        // jpLog に初当たりエントリ（未完了）を追加
        S.pushJP({
            trayBalls: tray,
            displayBalls: 0,
            rounds: 0,
            finalBalls: null,  // null = 連チャン中（未確定）
            netGain: 0,
            time: tsNow(),
        });
        S.pushLog({ type: "初当たり", time: tsNow(), tray });
        setShowHitModal(false);
        setTrayBalls("");
        S.setTab("history");
    };

    // Stats from ev engine
    const hasData = ev.jpCount > 0;

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            {/* Table Header */}
            <div style={{ display: "grid", gridTemplateColumns: "55px 1fr 1fr 1fr 70px", background: "linear-gradient(to right, #f97316, #ea580c)", padding: "12px 4px", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
                {["種別", "総回転数", "今回", "平均", "投資額"].map((h) => (
                    <div key={h} style={{ textAlign: "center", fontSize: 11, fontWeight: 800, color: "#fff", fontFamily: font, letterSpacing: 1 }}>{h}</div>
                ))}
            </div>

            {/* Data Rows */}
            <div ref={tableRef} style={{ flex: 1, overflowY: "auto", minHeight: 0, paddingBottom: 10 }}>
                {rows.length === 0 && (
                    <div style={{ textAlign: "center", color: C.sub, fontSize: 13, padding: "80px 16px", fontFamily: font, opacity: 0.6 }}>
                        開始回転数を入力して「スタート」を押してください
                    </div>
                )}
                {rows.map((row, i) => {
                    if (row.type === "start") return (
                        <div key={i} className="fin" style={{ display: "grid", gridTemplateColumns: "55px 1fr 1fr 1fr 70px", padding: "12px 4px", background: "rgba(255,255,255,0.02)", borderBottom: `1px solid ${C.border}` }}>
                            <div style={{ textAlign: "center" }}><span style={{ fontSize: 10, fontWeight: 700, color: C.blue, background: C.blue + "20", borderRadius: 6, padding: "3px 7px", border: `1px solid ${C.blue}40` }}>現</span></div>
                            <div style={{ textAlign: "center", fontSize: 14, color: C.subHi, fontFamily: mono }}>{f(row.cumRot)}</div>
                            <div style={{ textAlign: "center", fontSize: 11, color: C.sub }}>—</div>
                            <div style={{ textAlign: "center", fontSize: 11, fontWeight: 800, color: C.yellow, letterSpacing: 2 }}>START</div>
                            <div style={{ textAlign: "center", fontSize: 11, color: C.sub }}>—</div>
                        </div>
                    );
                    return (
                        <div key={i} className="fin" style={{ display: "grid", gridTemplateColumns: "55px 1fr 1fr 1fr 70px", padding: "14px 4px", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)", borderBottom: `1px solid ${C.border}` }}>
                            <div style={{ textAlign: "center" }}><span style={{ fontSize: 10, fontWeight: 700, color: C.blue, background: C.blue + "20", borderRadius: 6, padding: "3px 7px", border: `1px solid ${C.blue}40` }}>現</span></div>
                            <div style={{ textAlign: "center", fontSize: 14, color: C.subHi, fontFamily: mono }}>{f(row.cumRot)}</div>
                            <div style={{ textAlign: "center", fontSize: 16, fontWeight: 700, color: rotCol(row.thisRot), fontFamily: mono }}>{row.thisRot}</div>
                            <div style={{ textAlign: "center", fontSize: 16, fontWeight: 600, color: rotCol(row.avgRot), fontFamily: mono }}>{row.avgRot}</div>
                            <div style={{ textAlign: "center", fontSize: 12, color: C.sub, fontFamily: mono }}>{f(row.invest)}円</div>
                        </div>
                    );
                })}
            </div>

            {/* Bottom Panel */}
            <div style={{ background: C.surface, borderTop: `1px solid ${C.border}`, flexShrink: 0, paddingBottom: 10, boxShadow: "0 -4px 20px rgba(0,0,0,0.4)", borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 16px 10px" }}>
                    <span style={{ fontSize: 12, color: C.sub, fontWeight: 600 }}>操作</span>
                    <button className="b" onClick={() => setRows((r) => r.slice(0, -1))} style={{ background: "rgba(239, 68, 68, 0.1)", border: `1px solid ${C.red}40`, borderRadius: 8, color: C.red, fontSize: 11, padding: "6px 12px", fontFamily: font, fontWeight: 700 }}>一行削除</button>
                </div>

                {/* Real-time Stats Panel */}
                <div style={{ margin: "0 12px 10px", background: "rgba(0,0,0,0.2)", border: `1px solid ${ev.bDiff >= 0 ? C.green + "30" : C.red + "30"}`, borderRadius: 12, overflow: "hidden" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
                        {[
                            { label: "実測ボーダー", val: ev.measuredBorder > 0 ? f(ev.measuredBorder, 1) : "—", unit: "回/K", col: C.subHi },
                            { label: "1Kスタート", val: ev.start1K > 0 ? f(ev.start1K, 1) : "—", unit: "回/K", col: sc(ev.bDiff) },
                            { label: "期待値/K", val: ev.ev1K !== 0 ? sp(ev.ev1K, 0) : "—", unit: "円", col: sc(ev.ev1K) },
                        ].map(({ label, val, unit, col }, idx) => (
                            <div key={label} style={{ textAlign: "center", padding: "10px 2px", borderRight: idx < 2 ? `1px solid ${C.border}` : "none" }}>
                                <div style={{ fontSize: 8, color: C.sub, letterSpacing: 0.5, marginBottom: 4, fontWeight: 600 }}>{label}</div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: col, fontFamily: mono, lineHeight: 1 }}>{val}</div>
                                <div style={{ fontSize: 8, color: C.sub, marginTop: 2 }}>{unit}</div>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderTop: `1px solid ${C.border}` }}>
                        {[
                            { label: "仕事量", val: ev.workAmount !== 0 ? sp(ev.workAmount, 0) : "—", unit: "円", col: sc(ev.workAmount) },
                            { label: "時給", val: ev.wage !== 0 ? sp(ev.wage, 0) : "—", unit: "円/h", col: sc(ev.wage) },
                            { label: "平均1R出玉", val: ev.avg1R > 0 ? f(ev.avg1R, 1) : "—", unit: "玉", col: C.teal },
                        ].map(({ label, val, unit, col }, idx) => (
                            <div key={label} style={{ textAlign: "center", padding: "10px 2px", borderRight: idx < 2 ? `1px solid ${C.border}` : "none" }}>
                                <div style={{ fontSize: 8, color: C.sub, letterSpacing: 0.5, marginBottom: 4, fontWeight: 600 }}>{label}</div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: col, fontFamily: mono, lineHeight: 1 }}>{val}</div>
                                <div style={{ fontSize: 8, color: C.sub, marginTop: 2 }}>{unit}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Input */}
                <div style={{ padding: "0 12px 12px" }}>
                    <NI v={input} set={setInput} w="100%" ph="データカウンタの数値を入力" big onEnter={decide} />
                </div>

                {/* Action Buttons */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, padding: "0 12px 12px" }}>
                    <Btn label="1K決定" onClick={decide} primary />
                    <Btn label="スタート" onClick={doStart} bg={C.green} fg="#fff" bd="none" />
                    <Btn label="初当たり" onClick={() => setShowHitModal(true)} bg={C.orange} fg="#fff" bd="none" />
                </div>
            </div>

            {/* Hit Modal — 初当たり時の上皿玉数入力 */}
            {showHitModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
                    <Card style={{ width: "100%", maxWidth: 320, padding: 20 }}>
                        <SecLabel label="初当たり入力" />
                        <div style={{ marginBottom: 20 }}>
                            <div style={{ fontSize: 13, color: C.sub, marginBottom: 12 }}>上皿の残り玉数を入力してください</div>
                            <NI v={trayBalls} set={setTrayBalls} w="100%" big center ph="0〜125" />
                        </div>
                        <div style={{ display: "flex", gap: 10 }}>
                            <Btn label="決定" onClick={handleHitSubmit} primary />
                            <Btn label="キャンセル" onClick={() => setShowHitModal(false)} />
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}

/* ================================================================
   HistoryTab — 大当たり履歴（R数/表記出玉/最終残玉入力）
================================================================ */
export function HistoryTab({ jpLog, sesLog, pushJP, delJPLast, delSesLast, S, ev }) {
    const [sub, setSub] = useState("jp");

    // 連チャン入力 state
    const [iRounds, setIRounds] = useState("");
    const [iDisplayBalls, setIDisplayBalls] = useState("");
    const [iFinalBalls, setIFinalBalls] = useState("");

    // 最新の未完了エントリがあるか
    const lastEntry = jpLog.length > 0 ? jpLog[jpLog.length - 1] : null;
    const isChainActive = lastEntry && lastEntry.finalBalls == null;

    // 連チャン終了：最終残玉を確定
    const handleChainEnd = () => {
        const rounds = Number(iRounds) || 0;
        const displayBalls = Number(iDisplayBalls) || 0;
        const finalBalls = Number(iFinalBalls) || 0;
        if (rounds <= 0 || finalBalls <= 0) return;

        const trayBalls = lastEntry.trayBalls || 0;
        const netGain = finalBalls - trayBalls;

        // 最新エントリを上書き（確定）
        S.setJpLog((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                rounds,
                displayBalls,
                finalBalls,
                netGain,
            };
            return updated;
        });

        S.pushLog({ type: "連チャン終了", time: tsNow(), rounds, displayBalls, finalBalls, netGain });
        setIRounds("");
        setIDisplayBalls("");
        setIFinalBalls("");

        // 即座に回転数入力画面へ遷移
        S.setTab("rot");
    };

    // 通常の履歴保存（連チャン中でないとき — 手動エントリ）
    const handleManualSave = () => {
        const rounds = Number(iRounds) || 0;
        const displayBalls = Number(iDisplayBalls) || 0;
        const finalBalls = Number(iFinalBalls) || 0;
        if (rounds <= 0) return;

        const trayBalls = 0;
        const netGain = finalBalls - trayBalls;

        pushJP({
            trayBalls,
            displayBalls,
            rounds,
            finalBalls: finalBalls > 0 ? finalBalls : null,
            netGain: finalBalls > 0 ? netGain : 0,
            time: tsNow(),
        });

        setIRounds("");
        setIDisplayBalls("");
        setIFinalBalls("");
    };

    // 完了済みエントリのサマリー
    const completedEntries = jpLog.filter(j => j.finalBalls != null);

    return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Sub Tab */}
            <div style={{ display: "flex", background: "rgba(0,0,0,0.2)", padding: "4px", margin: "12px 14px", borderRadius: 12, flexShrink: 0 }}>
                {[["jp", "大当たり履歴"], ["ses", "稼働ログ"]].map(([id, lbl]) => (
                    <button key={id} className="b" onClick={() => setSub(id)} style={{
                        flex: 1, background: sub === id ? C.surfaceHi : "transparent", border: "none",
                        borderRadius: 8, color: sub === id ? C.text : C.sub, fontSize: 13, fontWeight: sub === id ? 700 : 500,
                        padding: "10px 0", fontFamily: font, boxShadow: sub === id ? "0 2px 8px rgba(0,0,0,0.2)" : "none"
                    }}>{lbl}</button>
                ))}
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "0 14px 80px" }}>
                {sub === "jp" ? (
                    <div>
                        {/* 連チャン中バナー */}
                        {isChainActive && (
                            <div style={{ background: `linear-gradient(135deg, ${C.orange}20, ${C.red}10)`, border: `1px solid ${C.orange}40`, borderRadius: 12, padding: "12px 16px", marginBottom: 12 }}>
                                <div style={{ fontSize: 12, fontWeight: 800, color: C.orange, marginBottom: 4 }}>🔥 連チャン中</div>
                                <div style={{ fontSize: 10, color: C.sub }}>上皿玉: {f(lastEntry.trayBalls)}玉 ｜ {lastEntry.time}</div>
                            </div>
                        )}

                        {/* Input Card */}
                        <Card style={{ padding: 16, marginBottom: 16 }}>
                            <SecLabel label={isChainActive ? "連チャン終了入力" : "履歴追加"} />
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
                                <div>
                                    <div style={{ fontSize: 9, color: C.sub, marginBottom: 4 }}>ラウンド数(R)</div>
                                    <NI v={iRounds} set={setIRounds} w="100%" center ph="40" />
                                </div>
                                <div>
                                    <div style={{ fontSize: 9, color: C.sub, marginBottom: 4 }}>表記出玉</div>
                                    <NI v={iDisplayBalls} set={setIDisplayBalls} w="100%" center ph="4500" />
                                </div>
                                <div>
                                    <div style={{ fontSize: 9, color: C.sub, marginBottom: 4 }}>最終残玉</div>
                                    <NI v={iFinalBalls} set={setIFinalBalls} w="100%" center ph="5200" />
                                </div>
                            </div>
                            {isChainActive ? (
                                <Btn label="🏁 連チャン終了 → 通常時へ" onClick={handleChainEnd} bg={C.orange} fg="#fff" bd="none" />
                            ) : (
                                <Btn label="履歴を保存" onClick={handleManualSave} primary />
                            )}
                        </Card>

                        {/* 実測サマリー — 常時表示 */}
                        <div style={{ margin: "0 0 16px", background: "rgba(0,0,0,0.2)", border: `1px solid ${C.teal}30`, borderRadius: 12, overflow: "hidden" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
                                {[
                                    { label: "平均1R出玉", val: ev.avg1R > 0 ? f(ev.avg1R, 1) : "—", unit: "玉", col: C.teal },
                                    { label: "サポ増減/回", val: ev.jpCount > 0 ? sp(ev.sapoPerJP, 1) : "—", unit: "玉", col: sc(ev.sapoPerJP) },
                                    { label: "平均R数", val: ev.avgRpJ > 0 ? f(ev.avgRpJ, 1) : "—", unit: "R", col: C.blue },
                                    { label: "初当たり", val: ev.jpCount > 0 ? ev.jpCount.toString() : "0", unit: "回", col: C.green },
                                ].map(({ label, val, unit, col }, idx) => (
                                    <div key={label} style={{ textAlign: "center", padding: "10px 2px", borderRight: idx < 3 ? `1px solid ${C.border}` : "none" }}>
                                        <div style={{ fontSize: 8, color: C.sub, letterSpacing: 0.5, marginBottom: 4, fontWeight: 600 }}>{label}</div>
                                        <div style={{ fontSize: 14, fontWeight: 800, color: col, fontFamily: mono, lineHeight: 1 }}>{val}</div>
                                        <div style={{ fontSize: 8, color: C.sub, marginTop: 2 }}>{unit}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* History Cards */}
                        {jpLog.length === 0 ? (
                            <div style={{ textAlign: "center", color: C.sub, padding: "40px 16px", fontSize: 12 }}>履歴がありません</div>
                        ) : (
                            [...jpLog].reverse().map((j, i) => (
                                <Card key={i} style={{ padding: "12px 16px", background: j.finalBalls == null ? "rgba(249, 115, 22, 0.05)" : "rgba(255,255,255,0.02)" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                        <span style={{ fontSize: 10, fontWeight: 800, color: j.finalBalls == null ? C.orange : C.blue, background: (j.finalBalls == null ? C.orange : C.blue) + "20", padding: "2px 6px", borderRadius: 4 }}>
                                            {j.finalBalls == null ? "連チャン中" : `${j.rounds}R`}
                                        </span>
                                        <span style={{ fontSize: 10, color: C.sub, fontFamily: mono }}>{j.time}</span>
                                    </div>
                                    {j.finalBalls != null ? (
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                                            <div>
                                                <div style={{ fontSize: 8, color: C.sub }}>表記出玉</div>
                                                <div style={{ fontSize: 14, fontWeight: 700, color: C.yellow, fontFamily: mono }}>{f(j.displayBalls)}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 8, color: C.sub }}>純増出玉</div>
                                                <div style={{ fontSize: 14, fontWeight: 700, color: C.green, fontFamily: mono }}>{f(j.netGain)}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 8, color: C.sub }}>最終残玉</div>
                                                <div style={{ fontSize: 14, fontWeight: 700, color: C.teal, fontFamily: mono }}>{f(j.finalBalls)}</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: 11, color: C.sub }}>上皿: {f(j.trayBalls)}玉 — 大当たり中…</div>
                                    )}
                                </Card>
                            ))
                        )}
                        <Btn label="最新履歴を削除" onClick={delJPLast} bg="rgba(239, 68, 68, 0.1)" fg={C.red} bd={C.red + "30"} />
                    </div>
                ) : (
                    <div>
                        {sesLog.length === 0 ? (
                            <div style={{ textAlign: "center", color: C.sub, padding: "40px 16px", fontSize: 12 }}>ログがありません</div>
                        ) : (
                            sesLog.map((e, i) => (
                                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${C.border}` }}>
                                    <div>
                                        <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{e.type}</div>
                                        <div style={{ fontSize: 10, color: C.sub, fontFamily: mono }}>{e.time}</div>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        {e.rot != null && <div style={{ fontSize: 12, color: C.blue, fontFamily: mono }}>{f(e.rot)}回</div>}
                                        {e.cash != null && <div style={{ fontSize: 12, color: C.red, fontFamily: mono }}>-{f(e.cash)}円</div>}
                                        {e.tray != null && <div style={{ fontSize: 10, color: C.teal }}>上皿:{f(e.tray)}玉</div>}
                                        {e.netGain != null && <div style={{ fontSize: 10, color: C.green }}>純増:{f(e.netGain)}玉</div>}
                                    </div>
                                </div>
                            ))
                        )}
                        <Btn label="最新ログを削除" onClick={delSesLast} bg="rgba(239, 68, 68, 0.1)" fg={C.red} bd={C.red + "30"} />
                    </div>
                )}
            </div>
        </div>
    );
}

/* ================================================================
   SettingsTab — 設定＆リセット
================================================================ */
export function SettingsTab({ s, onReset }) {
    const [confirming, setConfirming] = useState(false);

    return (
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px 80px" }}>
            <Card>
                <SecLabel label="基本設定" />
                {[
                    { lbl: "貸し玉個数", v: s.rentBalls, set: s.setRentBalls, unit: "玉/1K" },
                    { lbl: "交換率", v: s.exRate, set: s.setExRate, unit: "玉/1K" },
                    { lbl: "合成確率分母", v: s.synthDenom, set: s.setSynthDenom, unit: "1/x" },
                    { lbl: "1h消化回転数", v: s.rotPerHour, set: s.setRotPerHour, unit: "回/h" },
                    { lbl: "目標ボーダー", v: s.border, set: s.setBorder, unit: "回/K" },
                ].map(({ lbl, v, set, unit }) => (
                    <div key={lbl} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", borderBottom: `1px solid ${C.border}` }}>
                        <div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{lbl}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <NI v={v} set={set} w={80} center />
                            <span style={{ fontSize: 10, color: C.sub, minWidth: 40 }}>{unit}</span>
                        </div>
                    </div>
                ))}
            </Card>

            <div style={{ padding: "0 4px" }}>
                <div style={{ fontSize: 11, color: C.sub, marginBottom: 16, lineHeight: 1.6 }}>⚠️ 以下のボタンを押すと、現在のセッションデータ（回転数、獲得出玉、履歴など）がすべて消去されます。設定値は保持されます。</div>

                {!confirming ? (
                    <Btn label="データをリセット" onClick={() => setConfirming(true)} bg="linear-gradient(135deg, #180808, #2d1010)" fg={C.red} bd={C.red + "40"} />
                ) : (
                    <div style={{ display: "flex", gap: 10 }}>
                        <Btn label="本当にリセットしますか？" onClick={() => { onReset(); setConfirming(false); }} bg={C.red} fg="#fff" bd="none" />
                        <Btn label="キャンセル" onClick={() => setConfirming(false)} bg={C.surfaceHi} fg={C.text} bd={C.borderHi} />
                    </div>
                )}
            </div>
        </div>
    );
}
