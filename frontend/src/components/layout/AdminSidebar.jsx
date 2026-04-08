import { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../stores/authStore';
import { useMessagesStore } from '../../stores/messagesStore';
import { LayoutDashboard, Users, Wallet, FileText, MessageSquare, LogOut, ClipboardList, HardHat, BarChart2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export const AdminSidebar = () => {
  const { t, language } = useLanguage();
  const { user, logout } = useAuth();
  const { unreadCount, fetchUnread } = useMessagesStore();
  const navigate = useNavigate();
  const isRTL = language === 'ar';

  useEffect(() => {
    if (user?.id) fetchUnread(user.id);
    const interval = setInterval(() => {
      if (user?.id) fetchUnread(user.id);
    }, 15000);
    return () => clearInterval(interval);
  }, [user?.id, fetchUnread]);

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const navItems = [
    { path: '/admin/dashboard', label: t('dashboard') || 'Tableau de Bord', icon: LayoutDashboard },
    { path: '/admin/employes',  label: t('employees') || 'Employés',         icon: Users },
    { path: '/admin/pointage',  label: 'Pointages',                           icon: ClipboardList },
    { path: '/admin/avances',   label: t('advances') || 'Avances',            icon: Wallet },
    { path: '/admin/rapports',  label: t('reports') || 'Rapports',            icon: FileText },
    { path: '/messages',        label: t('messages') || 'Messages',           icon: MessageSquare },
  ];

  return (
    <div
      className={`w-60 min-h-screen fixed top-0 bottom-0 z-[100] flex flex-col ${isRTL ? 'right-0' : 'left-0'}`}
      style={{ backgroundColor: '#FFFFFF', borderRight: '1px solid #E2E8F0' }}
    >
      {/* Brand */}
      <div className="px-5 pt-6 pb-5" style={{ borderBottom: '1px solid #F1F5F9' }}>
        <div className={`flex items-center gap-3 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: '#1E40AF' }}>
            <HardHat size={20} color="#FFFFFF" strokeWidth={2} />
          </div>
          <div className={isRTL ? 'text-right' : ''}>
            <h1 className="font-bold leading-none" style={{ fontSize: '17px', color: '#1E293B' }}>
              KL <span style={{ color: '#1E40AF' }}>BÉTON</span>
            </h1>
            <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500, marginTop: 2 }}>
              Administration
            </p>
          </div>
        </div>

        {/* Connected user */}
        <div className="rounded-xl p-3" style={{ backgroundColor: '#F8FAFC', border: '1px solid #F1F5F9' }}>
          <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>
            {t('connectedAs') || 'Connecté'}
          </p>
          <p className={`font-semibold truncate ${isRTL ? 'text-right' : ''}`}
            style={{ fontSize: '14px', color: '#1E293B' }}>
            {user?.email?.split('@')[0]}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink key={item.path} to={item.path}>
            {({ isActive }) => (
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative ${isRTL ? 'flex-row-reverse' : ''}`}
                style={{
                  backgroundColor: isActive ? '#EFF6FF' : 'transparent',
                  color: isActive ? '#1E40AF' : '#64748B',
                }}
              >
                {isActive && (
                  <div className={`absolute ${isRTL ? 'right-0' : 'left-0'} top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full`}
                    style={{ backgroundColor: '#1E40AF' }} />
                )}
                <item.icon size={20} strokeWidth={isActive ? 2.2 : 1.8} style={{ flexShrink: 0 }} />
                <span className={`flex-1 ${isRTL ? 'text-right' : ''}`}
                  style={{ fontSize: '14px', fontWeight: isActive ? 600 : 500 }}>
                  {item.label}
                </span>
                {item.path === '/messages' && unreadCount > 0 && (
                  <span className="w-5 h-5 rounded-md flex items-center justify-center font-semibold text-white"
                    style={{ backgroundColor: '#DC2626', fontSize: '11px', flexShrink: 0 }}>
                    {unreadCount}
                  </span>
                )}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-6 pt-3" style={{ borderTop: '1px solid #F1F5F9' }}>
        <button
          onClick={handleLogout}
          className={`w-full rounded-xl font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${isRTL ? 'flex-row-reverse' : ''}`}
          style={{
            height: '42px', fontSize: '14px',
            backgroundColor: '#FEF2F2',
            color: '#DC2626',
            border: '1px solid #FECACA',
          }}
        >
          <LogOut size={18} />
          <span>{t('logout') || 'Déconnexion'}</span>
        </button>
      </div>
    </div>
  );
};