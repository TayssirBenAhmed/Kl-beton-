import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../stores/authStore';
import toast from 'react-hot-toast';
import { Lock, Mail, Loader, ChevronRight, Eye, EyeOff, Building2, HardHat, Shield } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { motion } from 'framer-motion';

const LANG_LABELS = { fr: 'FR', ar: 'ع', en: 'EN' };

export const Login = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focused, setFocused] = useState('');
  const [showPass, setShowPass] = useState(false);
  const isRTL = language === 'ar';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error(t('incompleteEntry') || 'Remplissez tous les champs'); return; }
    const result = await login(email, password);
    if (result.success) {
      const role = result.user?.role?.toUpperCase();
      toast.success(t('updateSuccess'));
      navigate(role === 'ADMIN' ? '/admin/dashboard' : '/chef/pointage');
    } else {
      toast.error(result.error || t('connectionError'));
    }
  };

  const labels = {
    fr: { title: 'Bon retour', subtitle: 'Connectez-vous à votre espace', emailLabel: 'Adresse email', passLabel: 'Mot de passe', btn: 'Accéder', forgot: 'Mot de passe oublié ?' },
    ar: { title: 'مرحباً بك', subtitle: 'سجّل دخولك إلى حسابك', emailLabel: 'البريد الإلكتروني', passLabel: 'كلمة المرور', btn: 'دخول', forgot: 'نسيت كلمة المرور؟' },
    en: { title: 'Welcome back', subtitle: 'Sign in to your workspace', emailLabel: 'Email address', passLabel: 'Password', btn: 'Sign in', forgot: 'Forgot password?' },
  };
  const L = labels[language] || labels.fr;

  const inputStyle = (name) => ({
    width: '100%', paddingLeft: 44, paddingRight: name === 'password' ? 44 : 14,
    paddingTop: 13, paddingBottom: 13, borderRadius: 12, outline: 'none',
    fontSize: '15px', fontWeight: 500, color: '#1E293B', backgroundColor: '#F8FAFC',
    border: focused === name ? '2px solid #1E40AF' : '1px solid #E2E8F0',
    boxShadow: focused === name ? '0 0 0 3px rgba(30,64,175,0.08)' : 'none',
    transition: 'all 0.2s', boxSizing: 'border-box',
  });

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} style={{
      minHeight: '100vh', display: 'flex',
      background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 60%, #F0F9FF 100%)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background geometric pattern */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.03,
        backgroundImage: 'radial-gradient(#1E40AF 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }} />

      {/* Left decorative panel — hidden on small screens */}
      <div style={{
        flex: 1, display: 'none', position: 'relative',
        background: 'linear-gradient(160deg, #1E3A8A 0%, #1E40AF 50%, #1D4ED8 100%)',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '60px 50px', overflow: 'hidden',
      }} className="lg-left-panel">
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -120, left: -60, width: 400, height: 400, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '40%', right: -40, width: 200, height: 200, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          {/* Big logo */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ width: 96, height: 96, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <HardHat size={48} color="white" strokeWidth={1.5} />
            </div>
            <h2 style={{ fontSize: '42px', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.03em', margin: 0, lineHeight: 1 }}>
              KL <span style={{ color: '#93C5FD' }}>BÉTON</span>
            </h2>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.18em', marginTop: 8 }}>Construction</p>
          </div>

          <div style={{ width: 48, height: 1, backgroundColor: 'rgba(255,255,255,0.15)', margin: '0 auto 40px' }} />

          {/* Features */}
          {[
            { icon: Shield, label: 'Accès sécurisé', desc: 'Authentification multi-niveaux' },
            { icon: Building2, label: 'Gestion RH', desc: 'Pointage & personnel centralisés' },
            { icon: HardHat, label: 'Suivi chantier', desc: 'Audit et rapports en temps réel' },
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, textAlign: 'left' }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <f.icon size={20} color="white" strokeWidth={1.8} />
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', margin: 0, marginBottom: 2 }}>{f.label}</p>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', fontWeight: 500, margin: 0 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div style={{ flex: '0 0 auto', width: '100%', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', position: 'relative', zIndex: 2 }}>

        {/* Language switcher */}
        <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', gap: 6 }}>
          {Object.entries(LANG_LABELS).map(([code, label]) => (
            <button key={code} onClick={() => setLanguage(code)} style={{
              width: 38, height: 38, borderRadius: 10, fontWeight: 600, fontSize: '13px', cursor: 'pointer',
              backgroundColor: language === code ? '#1E40AF' : '#FFFFFF',
              color: language === code ? '#FFFFFF' : '#64748B',
              border: language === code ? 'none' : '1px solid #E2E8F0',
              transition: 'all 0.15s',
            }}>
              {label}
            </button>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          style={{ width: '100%', maxWidth: 420 }}>

          {/* Logo / brand */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{ width: 72, height: 72, borderRadius: 22, backgroundColor: '#1E40AF', boxShadow: '0 8px 32px rgba(30,64,175,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
              <HardHat size={34} color="#FFFFFF" strokeWidth={1.8} />
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#1E293B', letterSpacing: '-0.03em', margin: 0, lineHeight: 1 }}>
              KL <span style={{ color: '#1E40AF' }}>BÉTON</span>
            </h1>
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: 6, marginBottom: 0 }}>Construction</p>
          </div>

          {/* Card */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: 20, border: '1px solid #E2E8F0', boxShadow: '0 8px 40px rgba(0,0,0,0.07)', padding: '36px 32px' }}>
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1E293B', margin: 0, marginBottom: 6, letterSpacing: '-0.02em' }}>{L.title}</h2>
              <p style={{ fontSize: '14px', color: '#64748B', fontWeight: 500, margin: 0 }}>{L.subtitle}</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: 8, letterSpacing: '0.01em' }}>
                  {L.emailLabel}
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: focused === 'email' ? '#1E40AF' : '#94A3B8', transition: 'color 0.2s' }} />
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    onFocus={() => setFocused('email')} onBlur={() => setFocused('')}
                    placeholder="votre@email.tn" autoComplete="email"
                    style={inputStyle('email')}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#374151', letterSpacing: '0.01em' }}>{L.passLabel}</label>
                  <button type="button" style={{ fontSize: '12px', color: '#1E40AF', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>{L.forgot}</button>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: focused === 'password' ? '#1E40AF' : '#94A3B8', transition: 'color 0.2s' }} />
                  <input
                    type={showPass ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocused('password')} onBlur={() => setFocused('')}
                    placeholder="••••••••" autoComplete="current-password"
                    style={inputStyle('password')}
                  />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading} style={{
                width: '100%', height: 50, borderRadius: 14, fontWeight: 700, fontSize: '15px',
                backgroundColor: '#1E40AF', color: '#FFFFFF', border: 'none',
                boxShadow: '0 6px 20px rgba(30,64,175,0.3)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                transition: 'all 0.2s', opacity: loading ? 0.7 : 1,
                letterSpacing: '0.01em',
              }}>
                {loading ? <Loader className="animate-spin" size={20} /> : (
                  <><span>{L.btn}</span><ChevronRight size={20} strokeWidth={2.5} /></>
                )}
              </button>
            </form>

            {/* Security badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 24, padding: '10px 14px', backgroundColor: '#F0FDF4', borderRadius: 10, border: '1px solid #BBF7D0' }}>
              <Shield size={14} style={{ color: '#059669', flexShrink: 0 }} />
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#059669' }}>Connexion sécurisée — données chiffrées</span>
            </div>
          </div>

          {/* Language footer */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20 }}>
            {Object.entries(LANG_LABELS).map(([code]) => (
              <button key={code} onClick={() => setLanguage(code)} style={{
                padding: '6px 14px', borderRadius: 8, fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                backgroundColor: language === code ? '#EFF6FF' : 'transparent',
                color: language === code ? '#1E40AF' : '#94A3B8',
                border: language === code ? '1px solid #BFDBFE' : '1px solid transparent',
                transition: 'all 0.15s',
              }}>
                {code === 'ar' ? 'عربي' : code === 'fr' ? 'Français' : 'English'}
              </button>
            ))}
          </div>

          <p style={{ textAlign: 'center', fontSize: '11px', color: '#CBD5E1', fontWeight: 500, marginTop: 16 }}>
            © 2025 KL Béton Construction — Tous droits réservés
          </p>
        </motion.div>
      </div>

      {/* CSS for large screen left panel */}
      <style>{`
        @media (min-width: 1024px) {
          .lg-left-panel { display: flex !important; }
        }
      `}</style>
    </div>
  );
};