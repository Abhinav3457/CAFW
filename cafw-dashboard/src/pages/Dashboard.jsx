import { useEffect, useState } from "react";
import { getStats, getCategoryBreakdown, getRecentAttacks } from "../api";
import { useTheme } from "../ThemeContext";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

const DONUT_COLORS = ["#ef4444", "#22c55e", "#f59e0b", "#3b82f6", "#8b5cf6"];

const weekData = [
    { day: "Mon", blocked: 145, allowed: 60 },
    { day: "Tue", blocked: 280, allowed: 90 },
    { day: "Wed", blocked: 100, allowed: 40 },
    { day: "Thu", blocked: 220, allowed: 105 },
    { day: "Fri", blocked: 210, allowed: 145 },
    { day: "Sat", blocked: 130, allowed: 130 },
    { day: "Sun", blocked: 215, allowed: 110 },
];

export default function Dashboard({ onLogout }) {
    const t = useTheme();
    const [stats, setStats]           = useState(null);
    const [breakdown, setBreakdown]   = useState([]);
    const [recent, setRecent]         = useState([]);
    const [loading, setLoading]       = useState(true);

    const fetchData = () => {
        setLoading(true);
        Promise.all([
            getStats(),
            getCategoryBreakdown(),
            getRecentAttacks()
        ]).then(([s, b, r]) => {
            setStats(s.data);
            setBreakdown(b.data);
            setRecent(r.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    };

    useEffect(() => { fetchData(); }, []);

    const card = {
        background: t.card, borderRadius: "14px",
        boxShadow: t.shadow, border: `1px solid ${t.cardBorder}`,
        transition: "all .2s"
    };

    return (
        <div style={{ flex: 1 }}>

            {/* Top Bar */}
            <div style={{
                display: "flex", alignItems: "center",
                justifyContent: "space-between",
                padding: "24px 32px 16px",
                background: t.topbar, transition: "all .2s",
                flexWrap: "wrap", gap: "12px",
                borderBottom: `1px solid ${t.cardBorder}`
            }}>
                <div>
                    <h1 style={{ fontSize: "20px", fontWeight: "700", color: t.text }}>
                        Security Dashboard
                    </h1>
                    <p style={{ fontSize: "13px", color: t.textSub, marginTop: "2px" }}>
                        Centralized Application-Context Aware Firewall
                    </p>
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <button onClick={fetchData} style={{
                        padding: "9px 18px", borderRadius: "8px", cursor: "pointer",
                        border: `1.5px solid ${t.cardBorder}`, background: t.card,
                        color: t.text, fontSize: "14px", fontWeight: "500",
                        transition: "all .2s"
                    }}>
                        ↻ Refresh
                    </button>
                    <button onClick={onLogout} style={{
                        padding: "9px 18px", borderRadius: "8px", cursor: "pointer",
                        border: "1.5px solid #fecaca", background: "#fef2f2",
                        color: "#ef4444", fontSize: "14px", fontWeight: "500"
                    }}>
                        ⏻ Logout
                    </button>
                </div>
            </div>

            <div style={{ padding: "24px 32px 32px",
                display: "flex", flexDirection: "column", gap: "20px" }}>

                {loading && (
                    <div style={{ textAlign: "center", padding: "40px",
                        color: t.textSub, fontSize: "15px" }}>
                        Loading dashboard data...
                    </div>
                )}

                {!loading && <>

                    {/* Stat Cards */}
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: "16px"
                    }}>
                        {[
                            { label: "Total Requests Today",
                                value: stats?.total_attacks_today ?? 0,
                                color: t.text, sub: "All incoming requests" },
                            { label: "Blocked Requests",
                                value: stats?.attacks_blocked_today ?? 0,
                                color: "#ef4444", sub: "Attacks stopped" },
                            { label: "Unique Attacker IPs",
                                value: stats?.unique_attacker_ips ?? 0,
                                color: "#f59e0b", sub: "Distinct sources" },
                            { label: "Top Attack Type",
                                value: stats?.top_attack_category ?? "None",
                                color: "#8b5cf6", sub: "Most common threat" },
                        ].map(s => (
                            <div key={s.label} style={{ ...card, padding: "22px 24px" }}>
                                <div style={{ fontSize: "13px", color: t.textSub,
                                    marginBottom: "8px" }}>{s.label}</div>
                                <div style={{ fontSize: "30px", fontWeight: "700",
                                    color: s.color, lineHeight: 1 }}>{s.value}</div>
                                <div style={{ fontSize: "12px", color: t.textMuted,
                                    marginTop: "8px" }}>{s.sub}</div>
                            </div>
                        ))}
                    </div>

                    {/* Line Chart */}
                    <div style={{ ...card, padding: "24px 28px" }}>
                        <div style={{
                            display: "flex", justifyContent: "space-between",
                            alignItems: "center", marginBottom: "20px",
                            flexWrap: "wrap", gap: "10px"
                        }}>
                            <div style={{ fontSize: "17px", fontWeight: "600", color: t.text }}>
                                Attack Statistics — Last 7 Days
                            </div>
                            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                                {[["#ef4444","Blocked Attacks"],["#22c55e","Allowed Requests"]].map(([c,l]) => (
                                    <span key={l} style={{ fontSize: "13px", color: t.textSub,
                                        display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "24px", height: "2px",
                        background: c, display: "inline-block" }}></span>
                                        {l}
                  </span>
                                ))}
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={240}>
                            <LineChart data={weekData}>
                                <CartesianGrid strokeDasharray="3 3"
                                               stroke={t.dark ? "#1e293b" : "#f1f5f9"} />
                                <XAxis dataKey="day"
                                       tick={{ fill: t.textMuted, fontSize: 13 }}
                                       axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: t.textMuted, fontSize: 13 }}
                                       axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{
                                    background: t.card, border: `1px solid ${t.cardBorder}`,
                                    borderRadius: "8px", color: t.text, fontSize: "13px" }} />
                                <Line type="monotone" dataKey="blocked" stroke="#ef4444"
                                      strokeWidth={2.5} dot={{ fill: "#ef4444", r: 4 }} />
                                <Line type="monotone" dataKey="allowed" stroke="#22c55e"
                                      strokeWidth={2.5} dot={{ fill: "#22c55e", r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Bottom Row */}
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: "16px"
                    }}>

                        {/* Recent Logs */}
                        <div style={{ ...card, padding: "20px 24px", overflowX: "auto" }}>
                            <div style={{ display: "flex", justifyContent: "space-between",
                                alignItems: "center", marginBottom: "16px" }}>
                                <div style={{ fontSize: "17px", fontWeight: "600",
                                    color: t.text }}>Recent Logs</div>
                                <a href="/logs" style={{ fontSize: "13px",
                                    color: "#2563eb", textDecoration: "none" }}>
                                    View all →
                                </a>
                            </div>
                            <table style={{ width: "100%", borderCollapse: "collapse",
                                fontSize: "13px", minWidth: "380px" }}>
                                <thead>
                                <tr style={{ background: t.tableHead }}>
                                    {["Timestamp","IP Address","Attack Type","Status"].map(h => (
                                        <th key={h} style={{ padding: "8px 10px", textAlign: "left",
                                            color: t.textMuted, fontWeight: "600", fontSize: "12px",
                                            borderBottom: `1px solid ${t.cardBorder}` }}>{h}</th>
                                    ))}
                                </tr>
                                </thead>
                                <tbody>
                                {recent.length === 0 ? (
                                    <tr><td colSpan={4} style={{ padding: "20px 10px",
                                        color: t.textMuted, fontSize: "14px" }}>
                                        No attacks logged yet. Send some Postman tests!
                                    </td></tr>
                                ) : recent.map(log => (
                                    <tr key={log.id}
                                        style={{ borderBottom: `1px solid ${t.cardBorder}` }}>
                                        <td style={{ padding: "9px 10px", color: t.textSub,
                                            fontSize: "12px" }}>
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                        <td style={{ padding: "9px 10px",
                                            fontFamily: "monospace", fontSize: "12px",
                                            color: t.text }}>{log.ip_address}</td>
                                        <td style={{ padding: "9px 10px",
                                            fontSize: "13px", color: t.text }}>{log.category}</td>
                                        <td style={{ padding: "9px 10px" }}>
                        <span style={{ background: "#fef2f2", color: "#ef4444",
                            padding: "3px 10px", borderRadius: "6px",
                            fontSize: "12px", fontWeight: "600" }}>Blocked</span>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Top Targeted Endpoints */}
                        <div style={{ ...card, padding: "20px 24px" }}>
                            <div style={{ fontSize: "17px", fontWeight: "600",
                                color: t.text, marginBottom: "8px" }}>
                                Top Targeted Endpoints
                            </div>
                            {breakdown.length === 0 ? (
                                <div style={{ color: t.textMuted, fontSize: "14px",
                                    paddingTop: "16px" }}>No data yet.</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={240}>
                                    <PieChart>
                                        <Pie
                                            data={breakdown.map(b => ({
                                                name: b.category, value: b.count }))}
                                            cx="50%" cy="50%"
                                            innerRadius={55} outerRadius={85}
                                            dataKey="value" paddingAngle={3}>
                                            {breakdown.map((_, i) => (
                                                <Cell key={i}
                                                      fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Legend iconType="square" iconSize={11}
                                                formatter={v => (
                                                    <span style={{ fontSize: "13px",
                                                        color: t.textSub }}>{v}</span>
                                                )} />
                                        <Tooltip contentStyle={{ background: t.card,
                                            border: `1px solid ${t.cardBorder}`,
                                            borderRadius: "8px", color: t.text,
                                            fontSize: "13px" }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* Attack Types Distribution */}
                        <div style={{ ...card, padding: "20px 24px" }}>
                            <div style={{ fontSize: "17px", fontWeight: "600",
                                color: t.text, marginBottom: "8px" }}>
                                Attack Types Distribution
                            </div>
                            {breakdown.length === 0 ? (
                                <div style={{ color: t.textMuted, fontSize: "14px",
                                    paddingTop: "16px" }}>No data yet.</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={240}>
                                    <PieChart>
                                        <Pie
                                            data={breakdown.map(b => ({
                                                name: b.category, value: b.count }))}
                                            cx="50%" cy="50%"
                                            innerRadius={55} outerRadius={85}
                                            dataKey="value" paddingAngle={3}>
                                            {breakdown.map((_, i) => (
                                                <Cell key={i}
                                                      fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Legend iconType="square" iconSize={11}
                                                formatter={v => (
                                                    <span style={{ fontSize: "13px",
                                                        color: t.textSub }}>{v}</span>
                                                )} />
                                        <Tooltip contentStyle={{ background: t.card,
                                            border: `1px solid ${t.cardBorder}`,
                                            borderRadius: "8px", color: t.text,
                                            fontSize: "13px" }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </>}
            </div>
        </div>
    );
}
