import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useTheme } from "./ThemeContext";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import AttackLogs from "./pages/AttackLogs";
import Rules from "./pages/Rules";
import Login from "./pages/Login";
import { authStatus } from "./api";

export default function App() {
    const t = useTheme();
    const [isLoggedIn, setIsLoggedIn] = useState(
        () => !!localStorage.getItem("cafw_token")
    );
    const [user, setUser] = useState(
        () => JSON.parse(localStorage.getItem("cafw_user") || "null")
    );
    const [setupDone, setSetupDone] = useState(null);

    useEffect(() => {
        authStatus()
            .then(r => setSetupDone(r.data.setup_complete))
            .catch(() => setSetupDone(true));
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("cafw_token");
        localStorage.removeItem("cafw_user");
        setIsLoggedIn(false);
        setUser(null);
    };

    const handleLogin = (userData, token) => {
        localStorage.setItem("cafw_token", token);
        localStorage.setItem("cafw_user", JSON.stringify(userData));
        setUser(userData);
        setIsLoggedIn(true);
    };

    if (setupDone === null) {
        return (
            <div style={{
                minHeight: "100vh", display: "flex",
                alignItems: "center", justifyContent: "center",
                background: "#060d1a", color: "#64748b",
                fontFamily: "sans-serif", fontSize: "14px",
                gap: "10px"
            }}>
        <span style={{
            width: "16px", height: "16px",
            border: "2px solid #1e3a8a",
            borderTopColor: "#3b82f6",
            borderRadius: "50%",
            display: "inline-block",
            animation: "spin .7s linear infinite"
        }}/>
                Initializing CAFW...
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
        );
    }

    if (!isLoggedIn) {
        return (
            <Login
                setupDone={setupDone}
                onLogin={handleLogin}
                onSetupComplete={() => setSetupDone(true)}
            />
        );
    }

    return (
        <BrowserRouter>
            <div style={{
                display: "flex", minHeight: "100vh",
                background: t.bg, color: t.text,
                fontFamily: "'Segoe UI', system-ui, sans-serif",
                transition: "all .2s"
            }}>
                <Sidebar onLogout={handleLogout} user={user} />
                <div style={{ flex: 1, display: "flex",
                    flexDirection: "column", minWidth: 0,
                    overflowX: "hidden" }}>
                    <Routes>
                        <Route path="/" element={
                            <Dashboard onLogout={handleLogout} user={user} />} />
                        <Route path="/logs" element={<AttackLogs />} />
                        <Route path="/rules" element={<Rules />} />
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </div>
            </div>
        </BrowserRouter>
    );
}