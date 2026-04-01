export default function StatCard({ label, value, color = "#fff" }) {
    return (
        <div style={{
            background: "#111", border: "1px solid #222",
            borderRadius: "10px", padding: "16px 20px", flex: 1
        }}>
            <div style={{ fontSize: "11px", color: "#555", textTransform: "uppercase",
                letterSpacing: ".05em", marginBottom: "8px" }}>
                {label}
            </div>
            <div style={{ fontSize: "28px", fontWeight: "600", color }}>
                {value ?? "—"}
            </div>
        </div>
    );
}