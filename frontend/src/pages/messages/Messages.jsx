import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../stores/authStore';
import { useMessagesStore } from '../../stores/messagesStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send, User, ShieldCheck, MessageSquare, Zap, Paperclip, MoreVertical,
    Search, Circle, CheckCheck, Clock, Phone, Video, ArrowLeft
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

export const Messages = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { messages, fetchMessages, sendMessage, markRead } = useMessagesStore();
  const [content, setContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [receiverId, setReceiverId] = useState(null);
  const [focused, setFocused] = useState(false);
  const scrollRef = useRef(null);
  const isRTL = language === 'ar';

  useEffect(() => {
    if (!user) return;
    const targetRole = user.role === 'ADMIN' ? 'CHEF' : 'ADMIN';
    authAPI.getUsersByRole(targetRole).then(res => {
      if (res.success && res.data?.length > 0) setReceiverId(res.data[0].id);
    });
  }, [user]);

  useEffect(() => {
    if (user?.id) {
      fetchMessages(user.id);
      markRead(user.id);
    }
  }, [user?.id, fetchMessages, markRead]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim() || !receiverId) return;
    const res = await sendMessage(user.id, receiverId, content);
    if (res.success) setContent('');
    else toast.error(res.error);
  };

  const contactName = user?.role === 'ADMIN' ? 'Chef Centrale' : 'Administration';
  const contactInitial = user?.role === 'ADMIN' ? 'CC' : 'AD';

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: 'calc(100vh - 80px)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500, marginBottom: 4 }}>Communication interne</p>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1E293B', margin: 0 }}>
            Messagerie <span style={{ color: '#1E40AF' }}>directe</span>
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', backgroundColor: '#EFF6FF', borderRadius: 10, border: '1px solid #BFDBFE' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#059669' }} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#1E40AF' }}>Canal sécurisé actif</span>
        </div>
      </motion.div>

      {/* Main chat layout */}
      <div style={{ display: 'flex', gap: 20, flex: 1, minHeight: 0, height: 'calc(100vh - 220px)' }}>

        {/* Sidebar */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}
          style={{ width: 280, flexShrink: 0, backgroundColor: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          <div style={{ padding: '16px', borderBottom: '1px solid #F1F5F9' }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Contacts</p>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                  backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8,
                  fontSize: '13px', color: '#1E293B', outline: 'none', boxSizing: 'border-box',
                  fontWeight: 500
                }}
              />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
            {/* Active contact */}
            <div style={{
              padding: '12px', borderRadius: 12, backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12, backgroundColor: '#1E40AF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#FFFFFF', fontSize: '13px', fontWeight: 700, flexShrink: 0
              }}>
                {contactInitial}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B', margin: 0, marginBottom: 2 }}>{contactName}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#059669' }} />
                  <p style={{ fontSize: '11px', fontWeight: 500, color: '#059669', margin: 0 }}>En ligne</p>
                </div>
              </div>
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#1E40AF', flexShrink: 0 }} />
            </div>
          </div>

          {/* User badge */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={16} style={{ color: '#64748B' }} />
            </div>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#1E293B', margin: 0 }}>{user?.name || 'Utilisateur'}</p>
              <p style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 500, margin: 0 }}>{user?.role}</p>
            </div>
          </div>
        </motion.div>

        {/* Chat area */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Chat header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FAFBFC' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: '#1E40AF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: '13px', fontWeight: 700 }}>
                {contactInitial}
              </div>
              <div>
                <p style={{ fontSize: '15px', fontWeight: 700, color: '#1E293B', margin: 0, marginBottom: 2 }}>{contactName}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#059669' }} />
                  <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>En ligne • Temps réel</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <ShieldCheck size={16} style={{ color: '#1E40AF' }} />
              </button>
              <button style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <MoreVertical size={16} style={{ color: '#64748B' }} />
              </button>
            </div>
          </div>

          {/* Messages list */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <div style={{ width: 60, height: 60, borderRadius: 18, backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageSquare size={28} style={{ color: '#93C5FD' }} />
                </div>
                <p style={{ fontSize: '14px', color: '#94A3B8', fontWeight: 600, margin: 0 }}>Démarrez la conversation</p>
                <p style={{ fontSize: '12px', color: '#CBD5E1', fontWeight: 500, margin: 0 }}>Aucun message pour le moment</p>
              </div>
            ) : (
              messages.map((m, idx) => {
                const isMe = m.sender_id === user?.id;
                return (
                  <motion.div
                    key={m.id || idx}
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}
                  >
                    {!isMe && (
                      <div style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#1E40AF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '10px', fontWeight: 700, marginRight: 8, flexShrink: 0, alignSelf: 'flex-end', marginBottom: 2 }}>
                        {contactInitial}
                      </div>
                    )}
                    <div style={{ maxWidth: '65%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', gap: 4 }}>
                      <div style={{
                        padding: '10px 14px',
                        borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        backgroundColor: isMe ? '#1E40AF' : '#F8FAFC',
                        border: isMe ? 'none' : '1px solid #E2E8F0',
                        boxShadow: isMe ? '0 4px 12px rgba(30,64,175,0.2)' : '0 1px 4px rgba(0,0,0,0.04)',
                      }}>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: isMe ? '#FFFFFF' : '#1E293B', lineHeight: 1.5 }}>
                          {m.content}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: '10px', color: '#CBD5E1', fontWeight: 500 }}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMe && <CheckCheck size={12} style={{ color: '#93C5FD' }} />}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Input area */}
          <div style={{ padding: '16px 20px', borderTop: '1px solid #F1F5F9', backgroundColor: '#FAFBFC' }}>
            <form onSubmit={handleSend}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                backgroundColor: '#FFFFFF', border: focused ? '2px solid #1E40AF' : '1px solid #E2E8F0',
                borderRadius: 14, padding: '6px 8px 6px 14px',
                boxShadow: focused ? '0 0 0 3px rgba(30,64,175,0.08)' : 'none',
                transition: 'all 0.2s',
              }}>
                <button type="button" style={{ padding: 6, borderRadius: 8, color: '#94A3B8', cursor: 'pointer', background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Paperclip size={18} />
                </button>
                <input
                  type="text"
                  placeholder="Votre message..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  style={{
                    flex: 1, border: 'none', outline: 'none', fontSize: '14px',
                    fontWeight: 500, color: '#1E293B', backgroundColor: 'transparent',
                    padding: '8px 4px',
                  }}
                />
                <button
                  type="submit"
                  disabled={!content.trim()}
                  style={{
                    height: 40, paddingLeft: 18, paddingRight: 18,
                    backgroundColor: content.trim() ? '#1E40AF' : '#E2E8F0',
                    color: content.trim() ? '#FFFFFF' : '#94A3B8',
                    border: 'none', borderRadius: 10, cursor: content.trim() ? 'pointer' : 'default',
                    fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
                    transition: 'all 0.2s', boxShadow: content.trim() ? '0 4px 12px rgba(30,64,175,0.25)' : 'none',
                  }}
                >
                  <Send size={15} strokeWidth={2.5} />
                  <span>{t('send') || 'Envoyer'}</span>
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};