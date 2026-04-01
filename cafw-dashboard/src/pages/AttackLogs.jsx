import { useEffect, useState } from "react";
import { getLogs } from "../api";
import { useTheme } from "../ThemeContext";

export default function AttackLogs() {
    const t = useTheme();
    const [logs, setLogs]         = useState([]);
    const [category, setCategory] = useState("");

    useEffect(() => {
        getLogs(category ? { category } : {})
            .then(r => setLogs(r.data)).catch(console.error);
    }, [category]);

    const card = {
        background: t.card, borderRadius: "14px",
        boxShadow: t.shadow, border: `1px solid ${t.cardBorder}`
    };

    return (
        <div style={{ padding: "24px 32px", flex: 1 }}>

            <div style={{ display: "flex", alignItems: "center",
                justifyContent: "space-between", marginBottom: "20px",
                flexWrap: "wrap", gap: "12px" }}>
                <h1 style={{ fontSize: "22px", fontWeight: "700", color: t.text }}>
                    Log Analysis
                </h1>
                <button onClick={t.toggle} style={{
                    padding: "9px 20px", borderRadius: "8px", cursor: "pointer",
                    border: `1.5px solid ${t.cardBorder}`, background: t.card,
                    color: t.text, fontSize: "14px", fontWeight: "500",
                    transition: "all .2s"
                }}>
                    {t.dark ? "☀ Light" : "🌙 Dark"}
                </button>
            </div>

            <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
                {["", "SQL Injection", "XSS", "Command Injection", "Path Traversal"].map(c => (
                    <button key={c} onClick={() => setCategory(c)} style={{
                        padding: "7px 16px", borderRadius: "20px", fontSize: "13px",
                        cursor: "pointer",
                        border: `1px solid ${category === c ? "#2563eb" : t.cardBorder}`,
                        background: category === c ? "#2563eb" : t.card,
                        color: category === c ? "#fff" : t.textSub,
                        transition: "all .15s", fontWeight: category === c ? "500" : "400"
                    }}>
                        {c || "All"}
                    </button>
                ))}
            </div>

            <div style={{ ...card, overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse",
                    fontSize: "13px", minWidth: "600px" }}>
                    <thead>
                    <tr style={{ background: t.tableHead }}>
                        {["Time","IP Address","Method","Endpoint","Category","Action"].map(h => (
                            <th key={h} style={{ padding: "12px 14px", textAlign: "left",
                                color: t.textMuted, fontWeight: "600", fontSize: "12px",
                                borderBottom: `1px solid ${t.cardBorder}` }}>{h}</th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {logs.length === 0 ? (
                        <tr><td colSpan={6} style={{ padding: "24px 14px",
                            color: t.textMuted, fontSize: "14px" }}>No logs yet.</td></tr>
                    ) : logs.map(log => (
                        <tr key={log.id}
                            style={{ borderBottom: `1px solid ${t.cardBorder}` }}>
                            <td style={{ padding: "11px 14px", color: t.textSub,
                                fontFamily: "monospace", fontSize: "12px" }}>
                                {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td style={{ padding: "11px 14px", fontFamily: "monospace",
                                fontSize: "12px", color: t.text }}>{log.ip_address}</td>
                            <td style={{ padding: "11px 14px" }}>
                  <span style={{ background: t.tableHead, padding: "3px 8px",
                      borderRadius: "4px", fontFamily: "monospace",
                      fontSize: "12px", color: t.textSub }}>{log.method}</span>
                            </td>
                            <td style={{ padding: "11px 14px", color: t.textSub,
                                fontSize: "13px", maxWidth: "180px",
                                overflow: "hidden", textOverflow: "ellipsis",
                                whiteSpace: "nowrap" }}>{log.endpoint}</td>
                            <td style={{ padding: "11px 14px" }}>
                  <span style={{ background: "#fef2f2", color: "#ef4444",
                      padding: "3px 10px", borderRadius: "6px",
                      fontSize: "12px", fontWeight: "600" }}>{log.category}</span>
                            </td>
                            <td style={{ padding: "11px 14px" }}>
                  <span style={{ background: "#fef2f2", color: "#ef4444",
                      padding: "3px 10px", borderRadius: "6px",
                      fontSize: "12px", fontWeight: "600" }}>BLOCKED</span>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}