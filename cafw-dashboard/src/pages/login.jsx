import { useState, useEffect, useRef } from "react";
import {
    authSetup, authVerifySetup,
    authLogin, authVerifyLogin,
    authForgotPassword, authResetPassword
} from "../api";

function getStrength(p) {
    let s = 0;
    if (p.length >= 8)           s++;
    if (p.length >= 12)          s++;
    if (/[A-Z]/.test(p))         s++;
    if (/[0-9]/.test(p))         s++;
    if (/[^A-Za-z0-9]/.test(p))  s++;
    return s;
}
const SL = ["","Very Weak","Weak","Fair","Strong","Very Strong"];
const SC = ["","#ef4444","#f59e0b","#eab308","#22c55e","#16a34a"];

const c = {
    bg:    "#060d1a",
    card:  "#0d1424",
    cardB: "#1a2540",
    inp:   "#080f1e",
    inpB:  "#1e2d4a",
    text:  "#e2e8f0",
    sub:   "#64748b",
    muted: "#334155",
    blue:  "#3b82f6",
    green: "#10b981",
    red:   "#ef4444",
    amber: "#f59e0b",
    line:  "#1a2540",
};

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(8px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }
  @keyframes lockPulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,.3); }
    50%     { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
  }
  .fade-up { animation: fadeUp .25s ease forwards; }
  .auth-inp {
    width: 100%; padding: 11px 14px;
    background: #080f1e; border: 1.5px solid #1e2d4a;
    border-radius: 8px; font-size: 14px; color: #e2e8f0;
    outline: none; transition: border .2s, box-shadow .2s;
    font-family: inherit;
  }
  .auth-inp:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59,130,246,.12);
  }
  .auth-inp::placeholder { color: #334155; }
  .otp-box {
    width: 44px; height: 52px;
    background: #080f1e; border: 1.5px solid #1e2d4a;
    border-radius: 8px; font-size: 22px; font-weight: 700;
    text-align: center; color: #e2e8f0; outline: none;
    transition: all .2s; font-family: monospace;
    caret-color: #3b82f6;
  }
  .otp-box:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59,130,246,.15);
  }
  .otp-box.filled {
    border-color: #3b82f6;
    background: rgba(59,130,246,.08);
  }
  .btn-pri {
    width: 100%; padding: 12px;
    background: linear-gradient(135deg,#2563eb,#1d4ed8);
    border: none; border-radius: 8px; color: #fff;
    font-size: 14px; font-weight: 600; cursor: pointer;
    box-shadow: 0 4px 14px rgba(37,99,235,.3);
    transition: all .2s; font-family: inherit;
    display: flex; align-items: center;
    justify-content: center; gap: 7px;
  }
  .btn-pri:hover:not(:disabled) {
    background: linear-gradient(135deg,#3b82f6,#2563eb);
    box-shadow: 0 6px 20px rgba(37,99,235,.4);
    transform: translateY(-1px);
  }
  .btn-pri:disabled {
    background: #0d1e3a; color: #475569;
    box-shadow: none; cursor: not-allowed;
  }
  .btn-ghost {
    width: 100%; padding: 11px;
    background: transparent; border: 1px solid #1e2d4a;
    border-radius: 8px; color: #64748b; font-size: 14px;
    cursor: pointer; transition: all .2s; font-family: inherit;
  }
  .btn-ghost:hover {
    border-color: #2d4a7a; color: #93c5fd;
    background: rgba(37,99,235,.05);
  }
  .link-btn {
    background: none; border: none; color: #3b82f6;
    font-size: 12px; cursor: pointer; padding: 0;
    font-family: inherit; transition: color .15s;
  }
  .link-btn:hover { color: #60a5fa; }
  .eye-btn {
    position: absolute; right: 12px; top: 50%;
    transform: translateY(-50%); background: none;
    border: none; cursor: pointer; color: #475569;
    display: flex; align-items: center; padding: 4px;
    transition: color .15s;
  }
  .eye-btn:hover { color: #94a3b8; }
`;

const Spinner = () => (
    <span style={{
        width:"14px", height:"14px",
        border:"2px solid rgba(255,255,255,.2)",
        borderTopColor:"#fff", borderRadius:"50%",
        display:"inline-block",
        animation:"spin .65s linear infinite"
    }}/>
);

const ErrBox = ({msg}) => !msg ? null : (
    <div style={{
        background:"rgba(239,68,68,.07)",
        border:"1px solid rgba(239,68,68,.2)",
        borderRadius:"8px", padding:"10px 12px",
        display:"flex", gap:"8px", alignItems:"flex-start",
    }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
             style={{flexShrink:0, marginTop:"1px"}}>
            <circle cx="12" cy="12" r="10"
                    stroke="#ef4444" strokeWidth="1.5"/>
            <line x1="12" y1="8" x2="12" y2="12"
                  stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="12" y1="16" x2="12.01" y2="16"
                  stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span style={{fontSize:"13px", color:"#fca5a5",
            lineHeight:"1.5"}}>{msg}</span>
    </div>
);

const SucBox = ({msg}) => !msg ? null : (
    <div style={{
        background:"rgba(16,185,129,.07)",
        border:"1px solid rgba(16,185,129,.2)",
        borderRadius:"8px", padding:"10px 12px",
        display:"flex", gap:"8px", alignItems:"flex-start",
    }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
             style={{flexShrink:0, marginTop:"1px"}}>
            <circle cx="12" cy="12" r="10"
                    stroke="#10b981" strokeWidth="1.5"/>
            <path d="M9 12l2 2 4-4" stroke="#10b981"
                  strokeWidth="1.5" strokeLinecap="round"
                  strokeLinejoin="round"/>
        </svg>
        <span style={{fontSize:"13px", color:"#6ee7b7",
            lineHeight:"1.5"}}>{msg}</span>
    </div>
);

const Label = ({children}) => (
    <div style={{
        fontSize:"11px", fontWeight:"600", color:c.sub,
        marginBottom:"7px", textTransform:"uppercase",
        letterSpacing:".6px",
    }}>{children}</div>
);

const Divider = ({label}) => (
    <div style={{display:"flex", alignItems:"center", gap:"10px"}}>
        <div style={{flex:1, height:"1px", background:c.line}}/>
        <span style={{fontSize:"10px", color:c.muted,
            whiteSpace:"nowrap", letterSpacing:".6px"}}>{label}</span>
        <div style={{flex:1, height:"1px", background:c.line}}/>
    </div>
);

const StepDots = ({steps, current}) => (
    <div style={{display:"flex", gap:"5px", alignItems:"center"}}>
        {steps.map((s,i) => {
            const ci = steps.indexOf(current);
            return (
                <div key={i} style={{
                    height:"5px", borderRadius:"3px", transition:"all .3s",
                    width: s===current ? "18px" : "5px",
                    background: s===current ? c.blue
                        : i<ci ? c.green : c.muted,
                }}/>
            );
        })}
    </div>
);

function OtpRow({value, setValue, onEnter}) {
    const refs = Array.from({length:6}, () => useRef());

    useEffect(() => { refs[0].current?.focus(); }, []);

    const handleChange = (i, val) => {
        if (!/^\d*$/.test(val)) return;
        const next = [...value];
        next[i] = val.slice(-1);
        setValue(next);
        if (val && i < 5) refs[i+1].current?.focus();
    };

    const handleKey = (i, e) => {
        if (e.key === "Backspace") {
            if (!value[i] && i > 0) {
                const next=[...value]; next[i-1]=""; setValue(next);
                refs[i-1].current?.focus();
            } else {
                const next=[...value]; next[i]=""; setValue(next);
            }
        }
        if (e.key === "Enter" && onEnter) onEnter();
    };

    const handlePaste = (e) => {
        const p = e.clipboardData.getData("text")
            .replace(/\D/g,"").slice(0,6);
        if (p.length === 6) {
            setValue(p.split(""));
            refs[5].current?.focus();
        }
        e.preventDefault();
    };

    return (
        <div style={{display:"flex", gap:"8px",
            justifyContent:"center", width:"100%"}}>
            {value.map((d,i) => (
                <input key={i} ref={refs[i]}
                       className={`otp-box${d?" filled":""}`}
                       type="text" inputMode="numeric"
                       maxLength={1} value={d} placeholder="·"
                       onChange={e => handleChange(i, e.target.value)}
                       onKeyDown={e => handleKey(i, e)}
                       onPaste={handlePaste}
                />
            ))}
        </div>
    );
}

function StrengthBar({pass}) {
    if (!pass) return null;
    const s = getStrength(pass);
    return (
        <div style={{marginTop:"8px"}}>
            <div style={{display:"flex", gap:"3px", marginBottom:"4px"}}>
                {[1,2,3,4,5].map(i => (
                    <div key={i} style={{
                        flex:1, height:"3px", borderRadius:"2px",
                        transition:"all .3s",
                        background:i<=s?SC[s]:c.muted,
                        boxShadow:i<=s?`0 0 5px ${SC[s]}50`:"none",
                    }}/>
                ))}
            </div>
            <div style={{fontSize:"11px", color:SC[s],
                fontWeight:"500"}}>
                {SL[s]}{s>=4?" ✓":""}
            </div>
        </div>
    );
}

function TimerDisplay({seconds}) {
    const color = seconds<60 ? c.red
        : seconds<120 ? c.amber : c.sub;
    const r=16, circ=2*Math.PI*r;
    const dash=(seconds/300)*circ;
    return (
        <div style={{display:"flex", alignItems:"center", gap:"10px",
            background:c.inp, borderRadius:"8px", padding:"10px 14px",
            border:`1px solid ${c.inpB}`}}>
            <svg width="40" height="40"
                 style={{flexShrink:0, transform:"rotate(-90deg)"}}>
                <circle cx="20" cy="20" r={r} fill="none"
                        stroke={c.muted} strokeWidth="2.5"/>
                <circle cx="20" cy="20" r={r} fill="none"
                        stroke={color} strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeDasharray={circ}
                        strokeDashoffset={circ-dash}
                        style={{transition:
                                "stroke-dashoffset 1s linear,stroke .3s"}}/>
            </svg>
            <div>
                <div style={{fontSize:"16px", fontWeight:"700",
                    color, fontFamily:"monospace", lineHeight:1}}>
                    {Math.floor(seconds/60)}:
                    {String(seconds%60).padStart(2,"0")}
                </div>
                <div style={{fontSize:"11px", color:c.muted,
                    marginTop:"3px"}}>
                    {seconds===0 ? "OTP expired" : "OTP valid"}
                </div>
            </div>
            <div style={{marginLeft:"auto", fontSize:"11px",
                color:c.sub}}>remaining</div>
        </div>
    );
}

function PassField({label:lbl, value, onChange,
                       show, setShow, placeholder, onKeyDown}) {
    return (
        <div>
            {lbl && <Label>{lbl}</Label>}
            <div style={{position:"relative"}}>
                <input className="auth-inp"
                       type={show?"text":"password"}
                       value={value} onChange={onChange}
                       placeholder={placeholder||"••••••••••••"}
                       onKeyDown={onKeyDown}
                       style={{paddingRight:"46px"}}
                />
                <button className="eye-btn"
                        onClick={()=>setShow(p=>!p)}
                        tabIndex={-1} type="button">
                    {show ? (
                        <svg width="16" height="16" viewBox="0 0 24 24"
                             fill="none" stroke="currentColor"
                             strokeWidth="1.5" strokeLinecap="round"
                             strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                            <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                    ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24"
                             fill="none" stroke="currentColor"
                             strokeWidth="1.5" strokeLinecap="round"
                             strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                    )}
                </button>
            </div>
        </div>
    );
}

export default function Login({setupDone, onLogin, onSetupComplete}) {
    const [screen, setScreen]       = useState(
        setupDone ? "login" : "setup"
    );
    const [loading, setLoading]     = useState(false);
    const [error, setError]         = useState("");
    const [success, setSuccess]     = useState("");
    const [showPass, setShowPass]   = useState(false);
    const [showPass2, setShowPass2] = useState(false);
    const [showProv, setShowProv]   = useState(false);
    const [capsLock, setCapsLock]   = useState(false);
    const [otpTimer, setOtpTimer]   = useState(0);
    const [lockTimer, setLockTimer] = useState(0);
    const [pending, setPending]     = useState("");
    const timerRef = useRef(null);

    // setup fields
    const [setupName, setSetupName]   = useState("");
    const [setupEmail, setSetupEmail] = useState("");
    const [setupPass, setSetupPass]   = useState("");
    const [setupPass2, setSetupPass2] = useState("");
    const [setupKey, setSetupKey]     = useState("");
    const [setupOtp, setSetupOtp]     = useState(
        ["","","","","",""]);
    const [strength, setStrength]     = useState(0);

    // login fields
    const [loginEmail, setLoginEmail] = useState(
        () => localStorage.getItem("cafw_email") || "");
    const [loginPass, setLoginPass]   = useState("");
    const [rememberMe, setRememberMe] = useState(
        () => !!localStorage.getItem("cafw_email"));
    const [loginOtp, setLoginOtp]     = useState(
        ["","","","","",""]);

    // forgot fields
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotOtp, setForgotOtp]     = useState(
        ["","","","","",""]);
    const [resetPass, setResetPass]     = useState("");
    const [resetPass2, setResetPass2]   = useState("");
    const [forgotStep, setForgotStep]   = useState("email");

    useEffect(() => {
        if (otpTimer > 0) {
            timerRef.current = setTimeout(
                () => setOtpTimer(p=>p-1), 1000);
        }
        return () => clearTimeout(timerRef.current);
    }, [otpTimer]);

    const go = (s) => {
        setError(""); setSuccess("");
        setShowPass(false); setShowPass2(false);
        setScreen(s);
    };

    const otp = (arr) => arr.join("");
    const startTimer = () => setOtpTimer(300);

    // ── SETUP ──
    const handleSetup = async () => {
        setError("");
        if (!setupName||!setupEmail||!setupPass||
            !setupPass2||!setupKey) {
            setError("Please fill in all fields."); return;
        }
        if (!/\S+@\S+\.\S+/.test(setupEmail)) {
            setError("Enter a valid email."); return;
        }
        if (setupPass !== setupPass2) {
            setError("Passwords do not match."); return;
        }
        if (strength < 3) {
            setError("Password too weak. Add uppercase, numbers, symbols.");
            return;
        }
        setLoading(true);
        try {
            await authSetup({
                full_name:     setupName,
                email:         setupEmail,
                password:      setupPass,
                provision_key: setupKey,
            });
            setPending(setupEmail);
            setSetupOtp(["","","","","",""]);
            startTimer();
            go("otp_setup");
            setSuccess(`Verification OTP sent to ${setupEmail}`);
        } catch(e) {
            setError(e.response?.data?.detail || "Setup failed.");
        } finally { setLoading(false); }
    };

    const handleVerifySetup = async () => {
        const code = otp(setupOtp);
        setError("");
        if (code.length !== 6) {
            setError("Enter the complete 6-digit OTP."); return;
        }
        if (otpTimer === 0) {
            setError("OTP expired. Please start again."); return;
        }
        setLoading(true);
        try {
            await authVerifySetup({email:pending, otp:code});
            setSuccess("Admin account created. System is now secured.");
            onSetupComplete();
            setTimeout(() => go("login"), 1500);
        } catch(e) {
            setError(e.response?.data?.detail || "Invalid OTP.");
            setSetupOtp(["","","","","",""]);
        } finally { setLoading(false); }
    };

    // ── LOGIN ──
    const handleLogin = async () => {
        setError("");
        if (!loginEmail||!loginPass) {
            setError("Please fill in all fields."); return;
        }
        if (!/\S+@\S+\.\S+/.test(loginEmail)) {
            setError("Enter a valid email."); return;
        }
        setLoading(true);
        try {
            await authLogin({email:loginEmail, password:loginPass});
            if (rememberMe)
                localStorage.setItem("cafw_email", loginEmail);
            else localStorage.removeItem("cafw_email");
            setPending(loginEmail);
            setLoginOtp(["","","","","",""]);
            startTimer();
            go("otp_login");
            setSuccess(`OTP sent to ${loginEmail}. Check your inbox.`);
        } catch(e) {
            const msg = e.response?.data?.detail || "Login failed.";
            setError(msg);
            if (e.response?.status === 423) {
                const m = msg.match(/(\d+) seconds/);
                const s = m ? parseInt(m[1]) : 30;
                setLockTimer(s);
                const iv = setInterval(() => {
                    setLockTimer(p => {
                        if (p<=1) {
                            clearInterval(iv);
                            setError(""); return 0;
                        }
                        return p-1;
                    });
                }, 1000);
            }
        } finally { setLoading(false); }
    };

    const handleVerifyLogin = async () => {
        const code = otp(loginOtp);
        setError("");
        if (code.length !== 6) {
            setError("Enter the complete 6-digit OTP."); return;
        }
        if (otpTimer === 0) {
            setError("OTP expired. Go back and sign in again."); return;
        }
        setLoading(true);
        try {
            const res = await authVerifyLogin(
                {email:pending, otp:code});
            setSuccess("Authentication successful. Redirecting...");
            setTimeout(() =>
                onLogin(res.data.user, res.data.token), 900);
        } catch(e) {
            setError(e.response?.data?.detail || "Invalid OTP.");
            setLoginOtp(["","","","","",""]);
        } finally { setLoading(false); }
    };

    // ── FORGOT ──
    const handleForgotSend = async () => {
        setError("");
        if (!/\S+@\S+\.\S+/.test(forgotEmail)) {
            setError("Enter a valid email."); return;
        }
        setLoading(true);
        try {
            await authForgotPassword({email:forgotEmail});
            setPending(forgotEmail);
            setForgotOtp(["","","","","",""]);
            startTimer();
            setForgotStep("otp");
            setSuccess(`Reset OTP sent to ${forgotEmail}.`);
        } catch(e) {
            setError(e.response?.data?.detail || "Failed.");
        } finally { setLoading(false); }
    };

    const handleForgotVerifyOtp = () => {
        setError("");
        const code = otp(forgotOtp);
        if (code.length !== 6) {
            setError("Enter the complete 6-digit OTP."); return;
        }
        if (otpTimer === 0) {
            setError("OTP expired. Please start again."); return;
        }
        setForgotStep("reset"); setSuccess("");
    };

    const handleResetPassword = async () => {
        setError("");
        if (!resetPass||!resetPass2) {
            setError("Please fill in both fields."); return;
        }
        if (resetPass !== resetPass2) {
            setError("Passwords do not match."); return;
        }
        if (getStrength(resetPass) < 3) {
            setError("Password is too weak."); return;
        }
        setLoading(true);
        try {
            await authResetPassword({
                email:pending, otp:otp(forgotOtp),
                new_password:resetPass
            });
            setSuccess("Password reset! Please sign in.");
            setTimeout(() => {
                go("login");
                setForgotStep("email");
                setForgotEmail("");
                setForgotOtp(["","","","","",""]);
                setResetPass(""); setResetPass2("");
            }, 1500);
        } catch(e) {
            setError(e.response?.data?.detail || "Reset failed.");
        } finally { setLoading(false); }
    };

    return (
        <div style={{
            minHeight:"100vh", display:"flex",
            flexDirection:"column", alignItems:"center",
            justifyContent:"center", background:c.bg,
            padding:"20px",
            fontFamily:"'Segoe UI',system-ui,sans-serif",
            position:"relative", overflow:"hidden",
        }}>
            <style>{CSS}</style>

            {/* Grid bg */}
            <div style={{
                position:"absolute", inset:0, pointerEvents:"none",
                backgroundImage:`
          linear-gradient(rgba(59,130,246,.025) 1px,
            transparent 1px),
          linear-gradient(90deg,rgba(59,130,246,.025) 1px,
            transparent 1px)`,
                backgroundSize:"48px 48px",
            }}/>
            <div style={{
                position:"absolute", top:"-200px", left:"50%",
                transform:"translateX(-50%)",
                width:"600px", height:"400px", pointerEvents:"none",
                background:"radial-gradient(ellipse,rgba(37,99,235,.08) 0%,transparent 65%)",
            }}/>

            {/* Logo */}
            <div className="fade-up" style={{
                textAlign:"center", marginBottom:"20px",
                position:"relative", zIndex:2,
                width:"100%", maxWidth:"400px",
            }}>
                <div style={{
                    width:"60px", height:"60px",
                    margin:"0 auto 12px",
                    background:"linear-gradient(135deg,#0d2050,#1e3a8a)",
                    borderRadius:"16px", display:"flex",
                    alignItems:"center", justifyContent:"center",
                    boxShadow:"0 0 0 1px rgba(59,130,246,.3),0 0 30px rgba(37,99,235,.2)",
                }}>
                    <svg width="32" height="32"
                         viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z"
                              fill="rgba(37,99,235,.25)" stroke="#60a5fa"
                              strokeWidth="1.5" strokeLinejoin="round"/>
                        <path d="M9 12l2 2 4-4" stroke="#60a5fa"
                              strokeWidth="1.5" strokeLinecap="round"
                              strokeLinejoin="round"/>
                    </svg>
                </div>
                <h1 style={{fontSize:"19px", fontWeight:"700",
                    color:c.text, margin:"0 0 4px",
                    letterSpacing:"-.2px"}}>
                    Firewall Admin Dashboard
                </h1>
                <div style={{display:"flex", alignItems:"center",
                    justifyContent:"center", gap:"6px"}}>
                    <div style={{width:"6px", height:"6px",
                        borderRadius:"50%", background:c.green,
                        boxShadow:`0 0 7px ${c.green}`,
                        animation:"blink 2s infinite"}}/>
                    <span style={{fontSize:"11px", color:c.sub,
                        letterSpacing:".7px",
                        textTransform:"uppercase"}}>
            {screen==="setup" || screen==="otp_setup"
                ? "Initial System Setup"
                : "Restricted Admin Access"}
          </span>
                </div>
            </div>

            {/* Card */}
            <div className="fade-up" style={{
                background:c.card, borderRadius:"14px",
                border:`1px solid ${c.cardB}`,
                padding:"24px", width:"100%", maxWidth:"400px",
                boxShadow:"0 0 0 1px rgba(255,255,255,.02),0 24px 60px rgba(0,0,0,.6)",
                position:"relative", zIndex:2,
            }}>

                {/* Badge */}
                <div style={{
                    display:"flex", alignItems:"center", gap:"8px",
                    background: screen==="setup"||screen==="otp_setup"
                        ? "rgba(245,158,11,.06)"
                        : "rgba(37,99,235,.06)",
                    border: `1px solid ${
                        screen==="setup"||screen==="otp_setup"
                            ? "rgba(245,158,11,.2)"
                            : "rgba(37,99,235,.15)"}`,
                    borderRadius:"7px", padding:"7px 10px",
                    marginBottom:"20px",
                }}>
                    <svg width="13" height="13"
                         viewBox="0 0 24 24" fill="none"
                         style={{flexShrink:0}}>
                        <rect x="3" y="11" width="18" height="11" rx="2"
                              stroke={screen==="setup"||screen==="otp_setup"
                                  ? "#f59e0b" : "#64748b"}
                              strokeWidth="1.5"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"
                              stroke={screen==="setup"||screen==="otp_setup"
                                  ? "#f59e0b" : "#64748b"}
                              strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <span style={{fontSize:"11px", color:
                            screen==="setup"||screen==="otp_setup"
                                ? "#fcd34d" : c.sub, flex:1}}>
            {screen==="setup"||screen==="otp_setup"
                ? "One-time admin provisioning — requires setup key"
                : "Admin access only · Activity monitored"}
          </span>
                    <div style={{display:"flex",
                        alignItems:"center", gap:"3px"}}>
                        <div style={{width:"5px", height:"5px",
                            borderRadius:"50%", background:c.green,
                            boxShadow:`0 0 4px ${c.green}`}}/>
                        <span style={{fontSize:"10px",
                            color:c.green, fontWeight:"600"}}>
              LIVE
            </span>
                    </div>
                </div>

                {/* ══ SETUP ══ */}
                {screen==="setup" && (
                    <div style={{display:"flex",
                        flexDirection:"column", gap:"14px"}}>
                        <div>
                            <h2 style={{fontSize:"17px", fontWeight:"700",
                                color:c.text, margin:"0 0 2px"}}>
                                Initial Admin Setup
                            </h2>
                            <p style={{fontSize:"12px", color:c.sub, margin:0}}>
                                Create the first administrator account
                            </p>
                        </div>

                        <div style={{
                            background:"rgba(245,158,11,.06)",
                            border:"1px solid rgba(245,158,11,.2)",
                            borderRadius:"8px", padding:"10px 12px",
                            fontSize:"12px", color:"#fcd34d",
                            lineHeight:"1.6",
                        }}>
                            ⚠ This setup can only be performed once.
                            After completion, public registration
                            will be permanently disabled.
                        </div>

                        <div>
                            <Label>Full Name</Label>
                            <input className="auth-inp"
                                   type="text" value={setupName}
                                   onChange={e=>{setSetupName(e.target.value);
                                       setError("");}}
                                   placeholder="Administrator name"
                                   autoFocus
                            />
                        </div>

                        <div>
                            <Label>Email Address</Label>
                            <input className="auth-inp"
                                   type="email" value={setupEmail}
                                   onChange={e=>{setSetupEmail(e.target.value);
                                       setError("");}}
                                   placeholder="admin@company.com"
                            />
                        </div>

                        <div>
                            <PassField label="Password" value={setupPass}
                                       onChange={e=>{setSetupPass(e.target.value);
                                           setStrength(getStrength(e.target.value));
                                           setError("");}}
                                       show={showPass} setShow={setShowPass}
                                       placeholder="Min. 8 characters"
                            />
                            <StrengthBar pass={setupPass}/>
                        </div>

                        <div>
                            <PassField label="Confirm Password"
                                       value={setupPass2}
                                       onChange={e=>{setSetupPass2(e.target.value);
                                           setError("");}}
                                       show={showPass2} setShow={setShowPass2}
                                       placeholder="Re-enter password"
                            />
                            {setupPass2&&setupPass!==setupPass2 && (
                                <div style={{fontSize:"11px",
                                    color:c.red, marginTop:"5px"}}>
                                    Passwords do not match
                                </div>
                            )}
                        </div>

                        <div>
                            <Label>Admin Provisioning Key</Label>
                            <div style={{position:"relative"}}>
                                <input className="auth-inp"
                                       type={showProv?"text":"password"}
                                       value={setupKey}
                                       onChange={e=>{setSetupKey(e.target.value);
                                           setError("");}}
                                       placeholder="Enter the provisioning key"
                                       style={{paddingRight:"46px"}}
                                />
                                <button className="eye-btn"
                                        onClick={()=>setShowProv(p=>!p)}
                                        tabIndex={-1} type="button">
                                    {showProv ? (
                                        <svg width="16" height="16"
                                             viewBox="0 0 24 24" fill="none"
                                             stroke="currentColor" strokeWidth="1.5"
                                             strokeLinecap="round"
                                             strokeLinejoin="round">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                                            <line x1="1" y1="1" x2="23" y2="23"/>
                                        </svg>
                                    ) : (
                                        <svg width="16" height="16"
                                             viewBox="0 0 24 24" fill="none"
                                             stroke="currentColor" strokeWidth="1.5"
                                             strokeLinecap="round"
                                             strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                            <circle cx="12" cy="12" r="3"/>
                                        </svg>
                                    )}
                                </button>
                            </div>
                            <div style={{fontSize:"11px", color:c.muted,
                                marginTop:"5px"}}>
                                Default key: CAFW-ADMIN-SETUP-2024
                                (change in .env)
                            </div>
                        </div>

                        <ErrBox msg={error}/>

                        <button className="btn-pri"
                                onClick={handleSetup} disabled={loading}>
                            {loading
                                ? <><Spinner/>Setting up...</>
                                : "Create Admin Account →"}
                        </button>
                    </div>
                )}

                {/* ══ OTP SETUP ══ */}
                {screen==="otp_setup" && (
                    <div style={{display:"flex",
                        flexDirection:"column", gap:"15px"}}>
                        <div style={{display:"flex",
                            justifyContent:"space-between",
                            alignItems:"flex-start"}}>
                            <div>
                                <h2 style={{fontSize:"17px",
                                    fontWeight:"700", color:c.text,
                                    margin:"0 0 2px"}}>
                                    Verify Email
                                </h2>
                                <p style={{fontSize:"12px",
                                    color:c.sub, margin:0}}>
                                    Enter the OTP sent to your inbox
                                </p>
                            </div>
                            <StepDots steps={["s","o"]} current="o"/>
                        </div>

                        <SucBox msg={success}/>

                        <div>
                            <Label>6-Digit Verification Code</Label>
                            <OtpRow value={setupOtp}
                                    setValue={setSetupOtp}
                                    onEnter={handleVerifySetup}/>
                        </div>

                        <TimerDisplay seconds={otpTimer}/>
                        <ErrBox msg={error}/>

                        <button className="btn-pri"
                                onClick={handleVerifySetup}
                                disabled={loading||
                                    otp(setupOtp).length!==6||
                                    otpTimer===0}>
                            {loading
                                ? <><Spinner/>Verifying...</>
                                : "Verify & Complete Setup →"}
                        </button>

                        <button className="btn-ghost"
                                onClick={()=>go("setup")}>
                            ← Back to Setup
                        </button>
                    </div>
                )}

                {/* ══ LOGIN ══ */}
                {screen==="login" && (
                    <div style={{display:"flex",
                        flexDirection:"column", gap:"15px"}}>
                        <div style={{display:"flex",
                            justifyContent:"space-between",
                            alignItems:"flex-start"}}>
                            <div>
                                <h2 style={{fontSize:"17px",
                                    fontWeight:"700", color:c.text,
                                    margin:"0 0 2px"}}>
                                    Admin Sign In
                                </h2>
                                <p style={{fontSize:"12px",
                                    color:c.sub, margin:0}}>
                                    Authorized personnel only
                                </p>
                            </div>
                            <StepDots steps={["l","o"]} current="l"/>
                        </div>

                        {lockTimer>0 && (
                            <div style={{
                                background:"rgba(239,68,68,.06)",
                                border:"1px solid rgba(239,68,68,.2)",
                                borderRadius:"10px", padding:"12px 14px",
                                display:"flex", alignItems:"center",
                                justifyContent:"space-between", gap:"12px",
                            }}>
                                <div>
                                    <div style={{fontSize:"13px",
                                        fontWeight:"600", color:"#fca5a5",
                                        marginBottom:"2px"}}>
                                        Account Temporarily Locked
                                    </div>
                                    <div style={{fontSize:"12px",
                                        color:"#f87171"}}>
                                        Too many failed attempts
                                    </div>
                                </div>
                                <div style={{
                                    width:"50px", height:"50px",
                                    borderRadius:"50%",
                                    border:"2px solid rgba(239,68,68,.3)",
                                    background:"rgba(239,68,68,.08)",
                                    display:"flex", flexDirection:"column",
                                    alignItems:"center",
                                    justifyContent:"center",
                                    flexShrink:0,
                                    animation:"lockPulse 1s infinite",
                                }}>
                                    <div style={{fontSize:"17px",
                                        fontWeight:"800", color:"#fca5a5",
                                        lineHeight:1,
                                        fontFamily:"monospace"}}>
                                        {lockTimer}
                                    </div>
                                    <div style={{fontSize:"9px",
                                        color:"#f87171", marginTop:"1px",
                                        letterSpacing:".4px"}}>SEC</div>
                                </div>
                            </div>
                        )}

                        <div>
                            <Label>Email Address</Label>
                            <input className="auth-inp"
                                   type="email" value={loginEmail}
                                   onChange={e=>{setLoginEmail(e.target.value);
                                       setError("");}}
                                   onKeyDown={e=>e.key==="Enter"&&handleLogin()}
                                   placeholder="admin@company.com"
                                   autoFocus
                            />
                        </div>

                        <div>
                            <div style={{display:"flex",
                                justifyContent:"space-between",
                                alignItems:"center",
                                marginBottom:"7px"}}>
                                <Label>Password</Label>
                                <button className="link-btn"
                                        onClick={()=>go("forgot")}>
                                    Forgot password?
                                </button>
                            </div>
                            <PassField value={loginPass}
                                       onChange={e=>{setLoginPass(e.target.value);
                                           setError("");
                                           setCapsLock(
                                               e.nativeEvent?.getModifierState?.(
                                                   "CapsLock")||false);}}
                                       show={showPass} setShow={setShowPass}
                                       onKeyDown={e=>e.key==="Enter"&&handleLogin()}
                            />
                            {capsLock && (
                                <div style={{fontSize:"11px",
                                    color:c.amber, marginTop:"5px"}}>
                                    ▲ Caps Lock is on
                                </div>
                            )}
                        </div>

                        <label style={{display:"flex",
                            alignItems:"center", gap:"8px",
                            cursor:"pointer", userSelect:"none"}}>
                            <div onClick={()=>setRememberMe(p=>!p)}
                                 style={{
                                     width:"16px", height:"16px",
                                     borderRadius:"4px",
                                     border:`1.5px solid ${
                                         rememberMe?c.blue:c.inpB}`,
                                     background:rememberMe?c.blue:"transparent",
                                     display:"flex", alignItems:"center",
                                     justifyContent:"center", flexShrink:0,
                                     transition:"all .15s", cursor:"pointer",
                                     boxShadow:rememberMe
                                         ? `0 0 7px rgba(59,130,246,.35)`:"none",
                                 }}>
                                {rememberMe && (
                                    <svg width="9" height="9"
                                         viewBox="0 0 10 10" fill="none">
                                        <path d="M2 5l2.5 2.5L8 2.5"
                                              stroke="#fff" strokeWidth="1.5"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"/>
                                    </svg>
                                )}
                            </div>
                            <span style={{fontSize:"13px",
                                color:c.sub}}>
                Remember my email
              </span>
                        </label>

                        <ErrBox msg={error}/>

                        <button className="btn-pri"
                                onClick={handleLogin}
                                disabled={loading||lockTimer>0}>
                            {loading
                                ? <><Spinner/>Authenticating...</>
                                : lockTimer>0
                                    ? `Locked — ${lockTimer}s`
                                    : "Sign In →"}
                        </button>
                    </div>
                )}

                {/* ══ OTP LOGIN ══ */}
                {screen==="otp_login" && (
                    <div style={{display:"flex",
                        flexDirection:"column", gap:"15px"}}>
                        <div style={{display:"flex",
                            justifyContent:"space-between",
                            alignItems:"flex-start"}}>
                            <div>
                                <h2 style={{fontSize:"17px",
                                    fontWeight:"700", color:c.text,
                                    margin:"0 0 2px"}}>
                                    Two-Factor Authentication
                                </h2>
                                <p style={{fontSize:"12px",
                                    color:c.sub, margin:0}}>
                                    Enter the OTP sent to your inbox
                                </p>
                            </div>
                            <StepDots steps={["l","o"]} current="o"/>
                        </div>

                        <div style={{
                            background:"rgba(16,185,129,.06)",
                            border:"1px solid rgba(16,185,129,.15)",
                            borderRadius:"8px", padding:"10px 12px",
                            fontSize:"12px", color:"#6ee7b7",
                            display:"flex", gap:"8px",
                            alignItems:"center",
                        }}>
                            <svg width="14" height="14"
                                 viewBox="0 0 24 24" fill="none">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                                      stroke="#10b981" strokeWidth="1.5"/>
                                <polyline points="22,6 12,13 2,6"
                                          stroke="#10b981" strokeWidth="1.5"
                                          strokeLinecap="round"/>
                            </svg>
                            <div>
                                OTP sent to <strong>{pending}</strong>
                                <div style={{fontSize:"11px",
                                    color:"#34d399", marginTop:"1px"}}>
                                    Check your inbox and spam folder
                                </div>
                            </div>
                        </div>

                        <SucBox msg={success}/>

                        <div>
                            <Label>Enter 6-Digit OTP</Label>
                            <OtpRow value={loginOtp}
                                    setValue={setLoginOtp}
                                    onEnter={handleVerifyLogin}/>
                        </div>

                        <TimerDisplay seconds={otpTimer}/>
                        <ErrBox msg={error}/>

                        <button className="btn-pri"
                                onClick={handleVerifyLogin}
                                disabled={loading||
                                    otp(loginOtp).length!==6||
                                    otpTimer===0}>
                            {loading
                                ? <><Spinner/>Verifying...</>
                                : "Verify & Sign In →"}
                        </button>

                        <button className="btn-ghost"
                                onClick={()=>go("login")}>
                            ← Back to Sign In
                        </button>
                    </div>
                )}

                {/* ══ FORGOT ══ */}
                {screen==="forgot" && (
                    <div style={{display:"flex",
                        flexDirection:"column", gap:"15px"}}>
                        <div style={{display:"flex",
                            justifyContent:"space-between",
                            alignItems:"flex-start"}}>
                            <div>
                                <h2 style={{fontSize:"17px",
                                    fontWeight:"700", color:c.text,
                                    margin:"0 0 2px"}}>
                                    {forgotStep==="email"
                                        ? "Reset Password"
                                        : forgotStep==="otp"
                                            ? "Enter Reset OTP"
                                            : "Set New Password"}
                                </h2>
                                <p style={{fontSize:"12px",
                                    color:c.sub, margin:0}}>
                                    {forgotStep==="email"
                                        ? "OTP will be sent to your email"
                                        : forgotStep==="otp"
                                            ? `OTP sent to ${pending}`
                                            : "Choose a strong new password"}
                                </p>
                            </div>
                            <StepDots
                                steps={["e","o","r"]}
                                current={forgotStep==="email"?"e"
                                    :forgotStep==="otp"?"o":"r"}/>
                        </div>

                        <SucBox msg={success}/>

                        {forgotStep==="email" && <>
                            <div>
                                <Label>Email Address</Label>
                                <input className="auth-inp"
                                       type="email" value={forgotEmail}
                                       onChange={e=>{setForgotEmail(e.target.value);
                                           setError("");}}
                                       onKeyDown={e=>e.key==="Enter"&&
                                           handleForgotSend()}
                                       placeholder="admin@company.com"
                                       autoFocus
                                />
                            </div>
                            <ErrBox msg={error}/>
                            <button className="btn-pri"
                                    onClick={handleForgotSend}
                                    disabled={loading}>
                                {loading
                                    ? <><Spinner/>Sending...</>
                                    : "Send Reset OTP →"}
                            </button>
                        </>}

                        {forgotStep==="otp" && <>
                            <div>
                                <Label>6-Digit Reset Code</Label>
                                <OtpRow value={forgotOtp}
                                        setValue={setForgotOtp}
                                        onEnter={handleForgotVerifyOtp}/>
                            </div>
                            <TimerDisplay seconds={otpTimer}/>
                            <ErrBox msg={error}/>
                            <button className="btn-pri"
                                    onClick={handleForgotVerifyOtp}
                                    disabled={otp(forgotOtp).length!==6||
                                        otpTimer===0}>
                                Verify OTP →
                            </button>
                        </>}

                        {forgotStep==="reset" && <>
                            <div>
                                <PassField label="New Password"
                                           value={resetPass}
                                           onChange={e=>{setResetPass(e.target.value);
                                               setError("");}}
                                           show={showPass} setShow={setShowPass}
                                           placeholder="Min. 8 characters"
                                />
                                <StrengthBar pass={resetPass}/>
                            </div>
                            <div>
                                <PassField label="Confirm New Password"
                                           value={resetPass2}
                                           onChange={e=>{setResetPass2(e.target.value);
                                               setError("");}}
                                           show={showPass2} setShow={setShowPass2}
                                           placeholder="Re-enter new password"
                                />
                                {resetPass2&&resetPass!==resetPass2 && (
                                    <div style={{fontSize:"11px",
                                        color:c.red, marginTop:"5px"}}>
                                        Passwords do not match
                                    </div>
                                )}
                            </div>
                            <ErrBox msg={error}/>
                            <button className="btn-pri"
                                    onClick={handleResetPassword}
                                    disabled={loading}>
                                {loading
                                    ? <><Spinner/>Resetting...</>
                                    : "Reset Password →"}
                            </button>
                        </>}

                        <button className="btn-ghost" onClick={()=>{
                            go("login");
                            setForgotStep("email");
                            setForgotEmail("");
                            setForgotOtp(["","","","","",""]);
                            setResetPass(""); setResetPass2("");
                        }}>
                            ← Back to Sign In
                        </button>
                    </div>
                )}

                {/* Footer */}
                <div style={{
                    marginTop:"20px", paddingTop:"14px",
                    borderTop:`1px solid ${c.line}`,
                    display:"flex", justifyContent:"space-between",
                    alignItems:"center",
                }}>
          <span style={{fontSize:"11px",
              color:c.muted}}>CAFW v1.0.0</span>
                    <div style={{display:"flex",
                        alignItems:"center", gap:"4px"}}>
                        <div style={{width:"5px", height:"5px",
                            borderRadius:"50%", background:c.green,
                            boxShadow:`0 0 4px ${c.green}`}}/>
                        <span style={{fontSize:"11px",
                            color:c.muted}}>Systems Operational</span>
                    </div>
                </div>
            </div>

            <div style={{marginTop:"16px", fontSize:"11px",
                color:c.muted, textAlign:"center",
                position:"relative", zIndex:2,
                lineHeight:"1.6"}}>
                Centralized Application-Context Aware Firewall<br/>
                All access attempts are monitored and logged
            </div>
        </div>
    );
}