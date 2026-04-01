import { NavLink } from "react-router-dom";
import { useTheme } from "../ThemeContext";

const links = [
    { to: "/",      label: "Dashboard",        icon: "▦" },
    { to: "/logs",  label: "Log Analysis",     icon: "◎" },
    { to: "/rules", label: "Rules Management", icon: "▤" },
];

export default function Sidebar({ onLogout, user }) {
    const t = useTheme();
    return (
        <aside style={{ width: "200px", minHeight: "100vh",
            background: t.sidebar, display: "flex",
            flexDirection: "column", flexShrink: 0, transition: "all .2s" }}>

            <div style={{ padding: "24px 20px 20px",
                display: "flex", alignItems: "center", gap: "10px",
                borderBottom: `1px solid ${t.dark ? "#1e293b" : "#2d3a4a"}` }}>
                <div style={{ width: "40px", height: "40px", background: "#2563eb",
                    borderRadius: "10px", display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>🛡</div>
                <div>
                    <div style={{ color: "#fff", fontWeight: "700",
                        fontSize: "14px" }}>AppFirewall</div>
                    <div style={{ color: "#64748b", fontSize: "11px" }}>CAFW v1.0</div>
                </div>
            </div>

            <nav style={{ flex: 1, display: "flex", flexDirection: "column",
                gap: "2px", padding: "16px 10px" }}>
                {links.map(link => (
                    <NavLink key={link.to} to={link.to} end={link.to === "/"}
                             style={({ isActive }) => ({
                                 display: "flex", alignItems: "center", gap: "10px",
                                 padding: "11px 14px", borderRadius: "8px", fontSize: "14px",
                                 color: isActive ? "#fff" : t.navText,
                                 background: isActive ? "#2563eb" : "transparent",
                                 textDecoration: "none", transition: "all .15s",
                                 fontWeight: isActive ? "500" : "400"
                             })}>
                        <span style={{ fontSize: "15px" }}>{link.icon}</span>
                        {link.label}
                    </NavLink>
                ))}
            </nav>

            <div style={{ padding: "12px 10px 20px",
                borderTop: `1px solid ${t.dark ? "#1e293b" : "#2d3a4a"}` }}>

                {user && (
                    <div style={{ padding: "10px 14px", marginBottom: "8px",
                        background: t.dark ? "#1e293b" : "#2d3a4a",
                        borderRadius: "8px" }}>
                        <div style={{ fontSize: "13px", fontWeight: "600",
                            color: "#fff", marginBottom: "2px" }}>
                            {user.full_name}
                        </div>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>
                            {user.email}
                        </div>
                    </div>
                )}

                <button onClick={t.toggle} style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    width: "100%", padding: "10px 14px", borderRadius: "8px",
                    background: "transparent", border: "none",
                    color: t.navText, fontSize: "13px",
                    cursor: "pointer", marginBottom: "2px"
                }}>
                    <span>{t.dark ? "☀" : "🌙"}</span>
                    {t.dark ? "Light mode" : "Dark mode"}
                </button>

                <button onClick={onLogout} style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    width: "100%", padding: "10px 14px", borderRadius: "8px",
                    background: "transparent", border: "none",
                    color: "#ef4444", fontSize: "13px", cursor: "pointer"
                }}>
                    <span>⏻</span> Sign out
                </button>
            </div>
        </aside>
    );
}