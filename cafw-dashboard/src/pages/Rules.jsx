import { useEffect, useState } from "react";
import { getRules, toggleRule } from "../api";
import { useTheme } from "../ThemeContext";

export default function Rules() {
    const t = useTheme();
    const [rules, setRules] = useState([]);

    useEffect(() => {
        getRules().then(r => setRules(r.data)).catch(console.error);
    }, []);

    const handleToggle = async (rule) => {
        await toggleRule(rule.id, !rule.is_active);
        setRules(prev => prev.map(r =>
            r.id === rule.id ? { ...r, is_active: !r.is_active } : r
        ));
    };

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
                    Rules Management
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

            <div style={{ ...card, overflow: "hidden" }}>
                <div style={{ padding: "16px 24px",
                    borderBottom: `1px solid ${t.cardBorder}`,
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center" }}>
          <span style={{ fontSize: "16px", fontWeight: "600", color: t.text }}>
            Active Security Rules
          </span>
                    <span style={{ fontSize: "13px", color: t.textSub }}>
            {rules.filter(r => r.is_active).length} of {rules.length} active
          </span>
                </div>

                {rules.length === 0 ? (
                    <div style={{ padding: "28px 24px", color: t.textMuted, fontSize: "14px" }}>
                        No rules configured yet.
                    </div>
                ) : rules.map(rule => (
                    <div key={rule.id} style={{
                        display: "flex", alignItems: "center", gap: "16px",
                        padding: "16px 24px", borderBottom: `1px solid ${t.cardBorder}`,
                        transition: "background .15s", flexWrap: "wrap"
                    }}>
                        <div style={{ width: "11px", height: "11px", borderRadius: "50%",
                            background: rule.is_active ? "#22c55e" : "#94a3b8",
                            flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: "180px" }}>
                            <div style={{ fontSize: "14px", fontWeight: "500",
                                color: t.text }}>{rule.name}</div>
                            <div style={{ fontSize: "13px", color: t.textMuted,
                                marginTop: "3px" }}>{rule.description}</div>
                        </div>
                        <span style={{ fontSize: "12px", color: t.textMuted,
                            background: t.tableHead, padding: "3px 10px",
                            borderRadius: "4px", fontFamily: "monospace" }}>
              {rule.category}
            </span>
                        <div onClick={() => handleToggle(rule)} style={{
                            width: "44px", height: "24px", borderRadius: "12px",
                            cursor: "pointer", flexShrink: 0,
                            background: rule.is_active ? "#2563eb" : t.inputBorder,
                            position: "relative", transition: "background .2s"
                        }}>
                            <div style={{
                                position: "absolute", top: "4px",
                                left: rule.is_active ? "23px" : "4px",
                                width: "16px", height: "16px", borderRadius: "50%",
                                background: "#fff", transition: "left .2s",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                            }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}