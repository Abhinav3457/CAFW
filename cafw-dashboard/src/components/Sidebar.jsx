import { NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { GridIcon, ListIcon, LockIcon, ShieldIcon } from './Icons';

const NAV = [
  { path: '/', label: 'Dashboard', icon: GridIcon },
  { path: '/logs', label: 'Attack Logs', icon: ListIcon },
  { path: '/rules', label: 'Rules', icon: LockIcon },
];

const s = {
  wrap: {
    position: 'fixed', top: 0, left: 0, width: 250, height: '100vh',
    background: 'linear-gradient(180deg, #0a1628 0%, #060d1c 100%)',
    borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column', zIndex: 100,
  },
  logo: { padding: '26px 22px 22px', borderBottom: '1px solid rgba(56,78,120,0.15)' },
  logoH1: { fontSize: 21, fontWeight: 800, color: '#f1f5f9', margin: 0, display: 'flex', alignItems: 'center', gap: 10, letterSpacing: '-0.5px' },
  logoSub: { fontSize: 9, color: '#3a4f7a', margin: '5px 0 0', textTransform: 'uppercase', letterSpacing: 2.5, fontWeight: 600 },
  section: { padding: '18px 20px 6px', fontSize: 9, color: '#3a4f7a', textTransform: 'uppercase', letterSpacing: 1.8, fontWeight: 700 },
  nav: { flex: 1, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 2 },
  link: {
    display: 'flex', alignItems: 'center', gap: 11, padding: '11px 16px',
    borderRadius: 10, fontSize: 13, fontWeight: 500, color: '#5a6f92',
    textDecoration: 'none', transition: 'all 0.2s', position: 'relative',
  },
  activeBar: {
    position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
    width: 3, height: 18, borderRadius: '0 3px 3px 0',
    background: 'linear-gradient(180deg, #3b82f6, #6366f1)',
    boxShadow: '0 0 12px rgba(59,130,246,0.4)',
  },
  footer: {
    padding: '18px 22px', borderTop: '1px solid rgba(56,78,120,0.15)',
    fontSize: 11, color: '#2a3a5c',
  },
};

export default function Sidebar() {
  const [hov, setHov] = useState(null);
  const loc = useLocation();
  const active = (p) => p === '/' ? loc.pathname === '/' : loc.pathname.startsWith(p);

  return (
    <div style={s.wrap}>
      <div style={s.logo}>
        <h1 style={s.logoH1}>
          <ShieldIcon size={24} strokeWidth={2.5} />
          CAFW
        </h1>
        <p style={s.logoSub}>Security Dashboard</p>
      </div>

      <div style={s.section}>Navigation</div>
      <nav style={s.nav}>
        {NAV.map(({ path, label, icon: Icon }) => {
          const on = active(path);
          return (
            <NavLink
              key={path} to={path} end={path === '/'}
              style={() => ({
                ...s.link,
                ...(on ? { background: 'rgba(59,130,246,0.1)', color: '#60a5fa', fontWeight: 600 } : {}),
                ...(hov === path && !on ? { background: 'rgba(255,255,255,0.02)', color: '#8494b2' } : {}),
              })}
              onMouseEnter={() => setHov(path)}
              onMouseLeave={() => setHov(null)}
            >
              {on && <div style={s.activeBar} />}
              <span style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 20, height: 20, transition: 'transform 0.2s',
                transform: hov === path ? 'scale(1.12)' : 'scale(1)',
                opacity: on ? 1 : 0.6,
              }}>
                <Icon size={18} />
              </span>
              <span>{label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div style={s.footer}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
          <div className="live-dot" />
          <span style={{ color: '#5a6f92', fontSize: 11, fontWeight: 500 }}>System Active</span>
        </div>
        <div>CAFW v1.0.0 — Real-time</div>
      </div>
    </div>
  );
}
