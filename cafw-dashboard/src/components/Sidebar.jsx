import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/logs', label: 'Attack Logs', icon: '📋' },
  { path: '/rules', label: 'Rules', icon: '🔒' },
];

const sidebarStyles = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '260px',
    height: '100vh',
    background: '#1e293b',
    borderRight: '1px solid #334155',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 100,
  },
  logo: {
    padding: '24px',
    borderBottom: '1px solid #334155',
  },
  logoTitle: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#f1f5f9',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoSub: {
    fontSize: '11px',
    color: '#64748b',
    margin: '4px 0 0 36px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  nav: {
    flex: 1,
    padding: '16px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 500,
    color: '#94a3b8',
    transition: 'all 0.2s',
    textDecoration: 'none',
  },
  linkActive: {
    background: 'rgba(59, 130, 246, 0.15)',
    color: '#60a5fa',
  },
  footer: {
    padding: '20px 24px',
    borderTop: '1px solid #334155',
    fontSize: '12px',
    color: '#475569',
  },
};

function Sidebar() {
  return (
    <div style={sidebarStyles.container}>
      <div style={sidebarStyles.logo}>
        <h1 style={sidebarStyles.logoTitle}>
          <span>🛡️</span> CAFW
        </h1>
        <p style={sidebarStyles.logoSub}>Security Dashboard</p>
      </div>

      <nav style={sidebarStyles.nav}>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            style={({ isActive }) => ({
              ...sidebarStyles.link,
              ...(isActive ? sidebarStyles.linkActive : {}),
            })}
          >
            <span style={{ fontSize: '18px' }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div style={sidebarStyles.footer}>
        CAFW v1.0.0 • Real-time monitoring
      </div>
    </div>
  );
}

export default Sidebar;
