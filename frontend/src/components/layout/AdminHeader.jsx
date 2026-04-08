import { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../stores/authStore';
import { Globe, User as UserIcon, ChevronDown, LogOut, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

export const AdminHeader = () => {
  const { language, setLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [showLangMenu, setShowLangMenu]       = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const languages = [
    { code: 'fr', label: 'Français' },
    { code: 'ar', label: 'العربية'  },
    { code: 'en', label: 'English'  },
  ];

  // ── Couleurs thème ──────────────────────────────────────────────
  const surface   = isDarkMode ? '#1E293B' : '#FFFFFF';
  const border    = isDarkMode ? '#334155' : '#E2E8F0';
  const txtMain   = isDarkMode ? '#F1F5F9' : '#1E293B';
  const txtMuted  = isDarkMode ? '#94A3B8' : '#94A3B8';
  const btnBg     = isDarkMode ? '#0F172A' : '#F8FAFC';
  const btnBorder = isDarkMode ? '#475569' : '#E2E8F0';
  const dropBg    = isDarkMode ? '#1E293B' : '#FFFFFF';
  const dropBorder= isDarkMode ? '#334155' : '#E2E8F0';

  const btnBase = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backgroundColor: btnBg, border: `1px solid ${btnBorder}`,
    borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
  };

  return (
    <header style={{
      height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 28px', backgroundColor: surface,
      borderBottom: `1px solid ${border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      position: 'relative', zIndex: 50, transition: 'background-color 0.2s, border-color 0.2s',
    }}>

      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: '#1E40AF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#FFF', letterSpacing: '-0.02em' }}>KL</span>
        </div>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: txtMuted, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0, lineHeight: 1 }}>KL Béton</p>
          <p style={{ fontSize: 14, fontWeight: 800, color: txtMain, margin: 0, letterSpacing: '-0.01em', lineHeight: 1.2 }}>Contrôle Général</p>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

        {/* ── Theme toggle ── */}
        <button
          onClick={toggleTheme}
          title={isDarkMode ? 'Passer en mode clair' : 'Passer en mode sombre'}
          style={{ ...btnBase, width: 38, height: 38, color: isDarkMode ? '#FCA311' : '#64748B' }}>
          {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* ── Language ── */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowLangMenu(!showLangMenu); setShowProfileMenu(false); }}
            style={{ ...btnBase, height: 38, padding: '0 12px', gap: 6, color: txtMain, fontSize: 13, fontWeight: 700 }}>
            <Globe size={15} color="#1E40AF" />
            {language?.toUpperCase()}
            <ChevronDown size={13} style={{ color: txtMuted, transform: showLangMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          <AnimatePresence>
            {showLangMenu && (
              <motion.div
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', width: 160, borderRadius: 12,
                  overflow: 'hidden', backgroundColor: dropBg, border: `1px solid ${dropBorder}`,
                  boxShadow: isDarkMode ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.1)' }}>
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => { setLanguage(lang.code); setShowLangMenu(false); }}
                    style={{ width: '100%', padding: '10px 14px', textAlign: 'left', border: 'none', cursor: 'pointer',
                      fontSize: 13, fontWeight: language === lang.code ? 700 : 500,
                      color: language === lang.code ? '#1E40AF' : (isDarkMode ? '#CBD5E1' : '#475569'),
                      backgroundColor: language === lang.code ? (isDarkMode ? '#1E3A6E' : '#EFF6FF') : 'transparent',
                      transition: 'background 0.12s' }}>
                    {lang.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Profile ── */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowProfileMenu(!showProfileMenu); setShowLangMenu(false); }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px 5px 5px',
              borderRadius: 10, border: `1px solid ${btnBorder}`, backgroundColor: btnBg, cursor: 'pointer',
              transition: 'background-color 0.2s' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: '#1E40AF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserIcon size={15} color="#FFFFFF" strokeWidth={2.5} />
            </div>
            <div style={{ textAlign: 'left', display: 'none' }} className="sm-block">
              <p style={{ fontSize: 10, fontWeight: 600, color: txtMuted, margin: 0, lineHeight: 1, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Direction</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: txtMain, margin: 0, lineHeight: 1.3 }}>{user?.email?.split('@')[0]}</p>
            </div>
            <ChevronDown size={13} style={{ color: txtMuted, transform: showProfileMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', width: 240, borderRadius: 14,
                  overflow: 'hidden', backgroundColor: dropBg, border: `1px solid ${dropBorder}`,
                  boxShadow: isDarkMode ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.1)', padding: 6 }}>

                {/* User info */}
                <div style={{ padding: '10px 12px 10px', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#1E40AF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <UserIcon size={17} color="#FFF" strokeWidth={2.5} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 10, fontWeight: 600, color: txtMuted, margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Compte</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: txtMain, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
                    </div>
                  </div>
                </div>

                <div style={{ height: 1, backgroundColor: border, margin: '0 4px 4px' }} />

                {/* Logout */}
                <button
                  onClick={logout}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                    borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    color: '#DC2626', backgroundColor: 'transparent', transition: 'background 0.12s', textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = isDarkMode ? '#3B1212' : '#FEF2F2'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <LogOut size={16} />
                  Déconnexion
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      <style>{`
        @media (min-width: 640px) { .sm-block { display: block !important; } }
      `}</style>
    </header>
  );
};
