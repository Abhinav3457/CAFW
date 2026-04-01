const BADGE = {
    "SQL Injection": { bg: "#3b0000", color: "#ef4444" },
    "XSS":          { bg: "#3b2000", color: "#f59e0b" },
    "Command Injection": { bg: "#3b0000", color: "#ef4444" },
    "Path Traversal":    { bg: "#3b2000", color: "#f59e0b" },
};

function Badge({ label }) {
    const s = BADGE[label] || { bg: "#1a1a2e", color: "#6366f1" };
    return (
        <span style={{
            background: s.bg, color: s.color, padding: "2px 8px",
            borderRadius: "10px", fontSize: "10px", fontWeight: "600"
        }}>{label}</span>
    );
}

export default function LogTable({ logs }) {
    if (!logs || logs.length === 0) {
        return <div style={{ color: "#555", fontSize: "13px", padding: "16px" }}>No logs yet.</div>;
    }
    return (
        <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                <tr style={{ borderBottom: "1px solid #222" }}>
                    {["Time", "IP", "Method", "Endpoint", "Category", "Action"].map(h => (
                        <th key={h} style={{ padding: "8px 12px", color: "#555",
                            textAlign: "left", fontWeight: "500", fontSize: "11px" }}>{h}</th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {logs.map(log => (
                    <tr key={log.id} style={{ borderBottom: "1px solid #1a1a1a" }}>
                        <td style={{ padding: "8px 12px", color: "#555", fontFamily: "monospace" }}>
                            {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td style={{ padding: "8px 12px", color: "#aaa", fontFamily: "monospace" }}>
                            {log.ip_address}
                        </td>
                        <td style={{ padding: "8px 12px" }}>
                <span style={{ background: "#1a1a1a", padding: "1px 6px",
                    borderRadius: "4px", fontFamily: "monospace", color: "#aaa" }}>
                  {log.method}
                </span>
                        </td>
                        <td style={{ padding: "8px 12px", color: "#aaa", maxWidth: "160px",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {log.endpoint}
                        </td>
                        <td style={{ padding: "8px 12px" }}>
                            <Badge label={log.category} />
                        </td>
                        <td style={{ padding: "8px 12px" }}>
                <span style={{ background: "#3b0000", color: "#ef4444",
                    padding: "2px 8px", borderRadius: "10px", fontSize: "10px", fontWeight: "600" }}>
                  BLOCKED
                </span>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}