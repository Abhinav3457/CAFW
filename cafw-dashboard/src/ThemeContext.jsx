import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

function getInitialTheme() {
    if (typeof window === "undefined") {
        return false;
    }

    return window.localStorage.getItem("cafw_theme") === "dark";
}

export function ThemeProvider({ children }) {
    const [dark, setDark] = useState(getInitialTheme);
    const toggle = () => setDark(p => !p);

    useEffect(() => {
        window.localStorage.setItem("cafw_theme", dark ? "dark" : "light");
    }, [dark]);

    const t = {
        dark,
        toggle,
        bg:         dark ? "#0f172a" : "#f0f2f5",
        sidebar:    dark ? "#0f1f2e" : "#1e2a3a",
        card:       dark ? "#1e293b" : "#ffffff",
        cardBorder: dark ? "#334155" : "#e2e8f0",
        text:       dark ? "#f1f5f9" : "#1a1a2e",
        textSub:    dark ? "#94a3b8" : "#64748b",
        textMuted:  dark ? "#475569" : "#94a3b8",
        navActive:  "#2563eb",
        navText:    dark ? "#94a3b8" : "#8899aa",
        input:      dark ? "#1e293b" : "#f8fafc",
        inputBorder:dark ? "#334155" : "#e2e8f0",
        tableRow:   dark ? "#1e293b" : "#f8fafc",
        tableHead:  dark ? "#0f172a" : "#f1f5f9",
        shadow:     dark ? "0 1px 4px rgba(0,0,0,0.4)" : "0 1px 4px rgba(0,0,0,0.06)",
        topbar:     dark ? "#0f172a" : "#f0f2f5",
    };

    return (
        <ThemeContext.Provider value={t}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
};
