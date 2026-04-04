import { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { authStatus } from "./api";
import Sidebar from "./components/Sidebar";
import { useTheme } from "./ThemeContext";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const AttackLogs = lazy(() => import("./pages/AttackLogs"));
const Rules = lazy(() => import("./pages/Rules"));
const Login = lazy(() => import("./pages/login"));


function getStoredUser() {
    const raw = localStorage.getItem("cafw_user");
    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw);
    } catch {
        localStorage.removeItem("cafw_user");
        return null;
    }
}


function LoadingScreen() {
    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#060d1a",
            color: "#64748b",
            fontFamily: "sans-serif",
            fontSize: "14px",
            gap: "10px"
        }}>
            <span style={{
                width: "16px",
                height: "16px",
                border: "2px solid #1e3a8a",
                borderTopColor: "#3b82f6",
                borderRadius: "50%",
                display: "inline-block",
                animation: "spin .7s linear infinite"
            }} />
            Initializing CAFW...
            <style>
                {`@keyframes spin { to { transform: rotate(360deg); } }`}
            </style>
        </div>
    );
}


function RouteLoader() {
    return (
        <div style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#64748b",
            fontSize: "14px"
        }}>
            Loading page...
        </div>
    );
}

export default function App() {
    const t = useTheme();

    const [isLoggedIn, setIsLoggedIn] = useState(
        () => !!localStorage.getItem("cafw_token")
    );
    const [user, setUser] = useState(() => getStoredUser());
    const [setupDone, setSetupDone] = useState(null);

    useEffect(() => {
        let isActive = true;

        authStatus()
            .then(r => {
                if (isActive) {
                    setSetupDone(r.data.setup_complete);
                }
            })
            .catch(() => {
                if (isActive) {
                    setSetupDone(true);
                }
            });

        return () => {
            isActive = false;
        };
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
        return <LoadingScreen />;
    }

    if (!isLoggedIn) {
        return (
            <Suspense fallback={<LoadingScreen />}>
                <Login
                    setupDone={setupDone}
                    onLogin={handleLogin}
                    onSetupComplete={() => setSetupDone(true)}
                />
            </Suspense>
        );
    }

    return (
        <BrowserRouter>
            <div style={{
                display: "flex",
                minHeight: "100vh",
                background: t.bg,
                color: t.text,
                fontFamily: "'Segoe UI', system-ui, sans-serif",
                transition: "all .2s"
            }}>
                <Sidebar onLogout={handleLogout} user={user} />

                <div style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    minWidth: 0,
                    overflowX: "hidden"
                }}>
                    <Suspense fallback={<RouteLoader />}>
                        <Routes>
                            <Route path="/" element={
                                <Dashboard onLogout={handleLogout} user={user} />
                            } />
                            <Route path="/logs" element={<AttackLogs />} />
                            <Route path="/rules" element={<Rules />} />
                            <Route path="*" element={<Navigate to="/" />} />
                        </Routes>
                    </Suspense>
                </div>
            </div>
        </BrowserRouter>
    );
}
