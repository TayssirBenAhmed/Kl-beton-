import { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../stores/authStore';
import { useMessagesStore } from '../../stores/messagesStore';
import { ClipboardList, History, BarChart2, MessageSquare, LogOut, HardHat, Sun, Moon } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';

export const ChefNavbar = () => {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const { unreadCount, fetchUnread } = useMessagesStore();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.id) fetchUnread(user.id);
    const interval = setInterval(() => {
      if (user?.id) fetchUnread(user.id);
    }, 15000);
    return () => clearInterval(interval);
  }, [user?.id, fetchUnread]);

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const navItems = [
    { path: '/chef/pointage',   label: t('attendance') || 'Pointage',    icon: ClipboardList },
    { path: '/chef/audit',      label: t('audit') || 'Audit',            icon: BarChart2     },
    { path: '/chef/historique', label: t('history') || 'Historique',     icon: History       },
    { path: '/messages',        label: t('messages') || 'Messages',      icon: MessageSquare },
  ];

  // ── Couleurs thème ──────────────────────────────────────────────
  const navBg      = isDarkMode ? '#1E293B' : '#FFFFFF';
  const navBorder  = isDarkMode ? '#334155' : '#E2E8F0';
  const txtMain    = isDarkMode ? '#F1F5F9' : '#1E293B';
  const txtMuted   = isDarkMode ? '#94A3B8' : '#94A3B8';
  const activeBg   = isDarkMode ? '#1E3A6E' : '#EFF6FF';
  const activeClr  = '#1E40AF';
  const inactiveClr= isDarkMode ? '#94A3B8' : '#64748B';
  const toggleBg   = isDarkMode ? '#0F172A' : '#F8FAFC';
  const toggleBdr  = isDarkMode ? '#475569' : '#E2E8F0';

  return (
    <nav
      className="h-16 flex items-center px-6 gap-4 sticky top-0 z-[100]"
      style={{
        backgroundColor: navBg,
        borderBottom: `1px solid ${navBorder}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        transition: 'background-color 0.2s, border-color 0.2s',
      }}>

      {/* ── Brand ── */}
      <div className="flex items-center gap-3 mr-3 shrink-0">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1E40AF' }}>
          <HardHat size={18} color="#FFFFFF" strokeWidth={2} />
        </div>
        <div>
          <div className="font-bold" style={{ fontSize: '16px', color: txtMain }}>
            KL <span style={{ color: '#1E40AF' }}>BÉTON</span>
          </div>
          <div style={{ fontSize: '10px', color: txtMuted, fontWeight: 500 }}>
            Chef centrale
          </div>
        </div>
      </div>

      <div className="w-px h-8 shrink-0" style={{ backgroundColor: navBorder }} />

      {/* ── Nav links ── */}
      <div className="flex items-center gap-1 flex-1">
        {navItems.map((item) => (
          <NavLink key={item.path} to={item.path}>
            {({ isActive }) => (
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all relative"
                style={{
                  backgroundColor: isActive ? activeBg : 'transparent',
                  color: isActive ? activeClr : inactiveClr,
                }}>
                <item.icon size={18} strokeWidth={isActive ? 2.2 : 1.8} style={{ flexShrink: 0 }} />
                <span className="whitespace-nowrap" style={{ fontSize: '14px', fontWeight: isActive ? 600 : 500 }}>
                  {item.label}
                </span>
                {item.path === '/messages' && unreadCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-md flex items-center justify-center font-semibold text-white"
                    style={{ backgroundColor: '#DC2626', fontSize: '11px' }}>
                    {unreadCount}
                  </span>
                )}
              </div>
            )}
          </NavLink>
        ))}
      </div>

      {/* ── Right actions ── */}
      <div className="flex items-center gap-3 shrink-0">

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={isDarkMode ? 'Mode clair' : 'Mode sombre'}
          style={{
            width: 38, height: 38, borderRadius: 10, border: `1px solid ${toggleBdr}`,
            backgroundColor: toggleBg, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: isDarkMode ? '#FCA311' : '#64748B',
            transition: 'all 0.15s',
          }}>
          {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* User info */}
        <div className="hidden xl:block text-right">
          <p style={{ fontSize: '11px', color: txtMuted, fontWeight: 500 }}>Chef actif</p>
          <p className="font-semibold" style={{ fontSize: '14px', color: txtMain }}>{user?.email?.split('@')[0]}</p>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 rounded-lg font-medium transition-all active:scale-[0.98]"
          style={{
            height: '38px', fontSize: '13px',
            backgroundColor: isDarkMode ? '#3B1212' : '#FEF2F2',
            color: '#DC2626',
            border: `1px solid ${isDarkMode ? '#7F1D1D' : '#FECACA'}`,
          }}>
          <LogOut size={16} />
          <span>{t('logout') || 'Sortir'}</span>
        </button>
      </div>
    </nav>
  );
};
