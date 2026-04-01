import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const COLORS = {
    "SQL Injection": "#ef4444",
    "XSS": "#f59e0b",
    "Command Injection": "#ef4444",
    "Path Traversal": "#f59e0b",
    "Abnormal Input": "#3b82f6",
};

export default function AttackChart({ data }) {
    if (!data || data.length === 0) {
        return (
            <div style={{ color: "#555", fontSize: "13px", padding: "20px 0" }}>
                No attack data yet — run some Postman tests first.
            </div>
        );
    }
    return (
        <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <XAxis dataKey="category" tick={{ fill: "#555", fontSize: 11 }} />
                <YAxis tick={{ fill: "#555", fontSize: 11 }} />
                <Tooltip
                    contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: "8px" }}
                    labelStyle={{ color: "#fff" }}
                    itemStyle={{ color: "#aaa" }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {data.map((entry, i) => (
                        <Cell key={i} fill={COLORS[entry.category] || "#6366f1"} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}