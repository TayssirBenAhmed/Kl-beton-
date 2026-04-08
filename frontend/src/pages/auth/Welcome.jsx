import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../stores/authStore'
import {
  ArrowRight,
  ClipboardCheck,
  Users,
  DollarSign,
  CalendarClock,
  HardHat,
  Building2,
  Shield,
  Zap,
  BarChart3,
  Smartphone,
  Cloud,
  ChevronDown,
  Clock,
  TrendingUp,
  FileText,
  Award,
  HelpCircle,
  Mail,
  Phone,
  MapPin
} from 'lucide-react'

export const Welcome = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    if (isAuthenticated) {
      navigate(user?.role === 'admin' ? '/admin/dashboard' : '/chef/pointage')
    }
  }, [isAuthenticated, user, navigate])
  const [openDropdown, setOpenDropdown] = useState(null)

  const features = [
    {
      icon: ClipboardCheck,
      title: "Pointage Intelligent",
      description: "Saisie en 1 clic avec validation automatique",
      color: "#E63946"
    },
    {
      icon: Users,
      title: "Gestion des Équipes",
      description: "Organisez vos chefs et ouvriers efficacement",
      color: "#457B9D"
    },
    {
      icon: DollarSign,
      title: "Calcul de Paie",
      description: "Génération automatique des fiches de paie",
      color: "#A8DADC"
    },
    {
      icon: CalendarClock,
      title: "Historique Complet",
      description: "Suivi détaillé des présences et absences",
      color: "#1D3557"
    },
    {
      icon: BarChart3,
      title: "Statistiques Avancées",
      description: "Tableaux de bord en temps réel",
      color: "#E63946"
    },
    {
      icon: Shield,
      title: "Sécurité Maximale",
      description: "Données protégées et conformes",
      color: "#457B9D"
    }
  ]

  const stats = [
    { value: "500+", label: "Chantiers" },
    { value: "15k+", label: "Employés" },
    { value: "98%", label: "Satisfaction" },
    { value: "24/7", label: "Support" }
  ]

  // Données pour les dropdowns cards
  const dropdownItems = {
    offres: [
      {
        icon: ClipboardCheck,
        title: "Pointage chantier",
        description: "Solution de pointage mobile pour vos équipes",
        color: "#E63946"
      },
      {
        icon: Users,
        title: "Gestion RH",
        description: "Administration du personnel simplifiée",
        color: "#457B9D"
      },
      {
        icon: DollarSign,
        title: "Paie automatique",
        description: "Calcul et génération des fiches de paie",
        color: "#A8DADC"
      },
      {
        icon: BarChart3,
        title: "Rapports avancés",
        description: "Tableaux de bord et analyses",
        color: "#1D3557"
      }
    ],
    pourquoi: [
      {
        icon: Shield,
        title: "Notre histoire",
        description: "10 ans d'expertise dans le BTP",
        color: "#E63946"
      },
      {
        icon: Award,
        title: "Nos valeurs",
        description: "Innovation, fiabilité, proximité",
        color: "#457B9D"
      },
      {
        icon: Users,
        title: "Ils nous font confiance",
        description: "500+ entreprises clientes",
        color: "#A8DADC"
      },
      {
        icon: TrendingUp,
        title: "Notre croissance",
        description: "+40% de croissance annuelle",
        color: "#1D3557"
      }
    ],
    aPropos: [
      {
        icon: Building2,
        title: "Notre équipe",
        description: "Des experts à votre service",
        color: "#E63946"
      },
      {
        icon: Zap,
        title: "Notre technologie",
        description: "Une solution cloud sécurisée",
        color: "#457B9D"
      },
      {
        icon: Clock,
        title: "Notre histoire",
        description: "Depuis 2014 à vos côtés",
        color: "#A8DADC"
      },
      {
        icon: FileText,
        title: "Nos actualités",
        description: "Nouvelles fonctionnalités, événements",
        color: "#1D3557"
      }
    ]
  }

  // Auto-rotation des fonctionnalités
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % features.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1D3557 0%, #457B9D 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Image de fond overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'url("https://images.unsplash.com/photo-1541888946425-d81bb19240f5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.15,
        zIndex: 1
      }} />

      {/* Éléments décoratifs animés */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 90, 180],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{
          position: 'absolute',
          top: '-100px',
          right: '-100px',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(230,57,70,0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          zIndex: 2
        }}
      />

      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          rotate: [0, -90, -180],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{
          position: 'absolute',
          bottom: '-150px',
          left: '-150px',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(168,218,220,0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          zIndex: 2
        }}
      />

      {/* NAVBAR - Fond sombre semi-transparent (comme avant) */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, type: "spring" }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          padding: '16px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 100,
          background: 'rgba(29, 53, 71, 0.9)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(230,57,70,0.2)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
        }}
      >
        {/* Logo à gauche */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, #E63946, #457B9D)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(230,57,70,0.2)'
          }}>
            <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>KL</span>
          </div>
          <span style={{ fontSize: '18px', fontWeight: '600', color: 'white' }}>KL Béton</span>
        </motion.div>

        {/* Menu central avec dropdowns */}
        <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
          {/* Dropdown Nos offres */}
          <div
            style={{ position: 'relative' }}
            onMouseEnter={() => setOpenDropdown('offres')}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <button
              style={{
                background: 'none',
                border: 'none',
                fontSize: '16px',
                fontWeight: '500',
                color: openDropdown === 'offres' ? '#E63946' : 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 12px',
                borderRadius: '8px',
                transition: 'all 0.3s ease'
              }}
            >
              Nos offres
              <ChevronDown
                size={16}
                style={{
                  transform: openDropdown === 'offres' ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.3s ease',
                  color: openDropdown === 'offres' ? '#E63946' : 'white'
                }}
              />
            </button>

            {/* Dropdown Card */}
            <AnimatePresence>
              {openDropdown === 'offres' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '450px',
                    background: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                    padding: '20px',
                    marginTop: '10px',
                    zIndex: 1000,
                    border: '1px solid rgba(230,57,70,0.1)'
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    {dropdownItems.offres.map((item, index) => {
                      const Icon = item.icon
                      return (
                        <motion.a
                          key={index}
                          href="#"
                          whileHover={{ x: 5 }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px',
                            borderRadius: '12px',
                            textDecoration: 'none',
                            color: '#1D3557',
                            transition: 'background 0.3s ease',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#F1FAEE'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{
                            width: '40px',
                            height: '40px',
                            background: `${item.color}15`,
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Icon size={20} color={item.color} />
                          </div>
                          <div>
                            <p style={{ fontWeight: '600', fontSize: '14px', marginBottom: '2px' }}>{item.title}</p>
                            <p style={{ fontSize: '12px', color: '#457B9D' }}>{item.description}</p>
                          </div>
                        </motion.a>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Dropdown Pourquoi KL ? */}
          <div
            style={{ position: 'relative' }}
            onMouseEnter={() => setOpenDropdown('pourquoi')}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <button
              style={{
                background: 'none',
                border: 'none',
                fontSize: '16px',
                fontWeight: '500',
                color: openDropdown === 'pourquoi' ? '#E63946' : 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 12px',
                borderRadius: '8px'
              }}
            >
              Pourquoi KL ?
              <ChevronDown
                size={16}
                style={{
                  transform: openDropdown === 'pourquoi' ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.3s ease',
                  color: openDropdown === 'pourquoi' ? '#E63946' : 'white'
                }}
              />
            </button>

            <AnimatePresence>
              {openDropdown === 'pourquoi' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '450px',
                    background: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                    padding: '20px',
                    marginTop: '10px',
                    zIndex: 1000,
                    border: '1px solid rgba(230,57,70,0.1)'
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    {dropdownItems.pourquoi.map((item, index) => {
                      const Icon = item.icon
                      return (
                        <motion.a
                          key={index}
                          href="#"
                          whileHover={{ x: 5 }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px',
                            borderRadius: '12px',
                            textDecoration: 'none',
                            color: '#1D3557',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#F1FAEE'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{
                            width: '40px',
                            height: '40px',
                            background: `${item.color}15`,
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Icon size={20} color={item.color} />
                          </div>
                          <div>
                            <p style={{ fontWeight: '600', fontSize: '14px', marginBottom: '2px' }}>{item.title}</p>
                            <p style={{ fontSize: '12px', color: '#457B9D' }}>{item.description}</p>
                          </div>
                        </motion.a>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Dropdown À propos */}
          <div
            style={{ position: 'relative' }}
            onMouseEnter={() => setOpenDropdown('aPropos')}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <button
              style={{
                background: 'none',
                border: 'none',
                fontSize: '16px',
                fontWeight: '500',
                color: openDropdown === 'aPropos' ? '#E63946' : 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 12px',
                borderRadius: '8px'
              }}
            >
              À propos
              <ChevronDown
                size={16}
                style={{
                  transform: openDropdown === 'aPropos' ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.3s ease',
                  color: openDropdown === 'aPropos' ? '#E63946' : 'white'
                }}
              />
            </button>

            <AnimatePresence>
              {openDropdown === 'aPropos' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '450px',
                    background: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                    padding: '20px',
                    marginTop: '10px',
                    zIndex: 1000,
                    border: '1px solid rgba(230,57,70,0.1)'
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    {dropdownItems.aPropos.map((item, index) => {
                      const Icon = item.icon
                      return (
                        <motion.a
                          key={index}
                          href="#"
                          whileHover={{ x: 5 }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px',
                            borderRadius: '12px',
                            textDecoration: 'none',
                            color: '#1D3557',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#F1FAEE'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{
                            width: '40px',
                            height: '40px',
                            background: `${item.color}15`,
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Icon size={20} color={item.color} />
                          </div>
                          <div>
                            <p style={{ fontWeight: '600', fontSize: '14px', marginBottom: '2px' }}>{item.title}</p>
                            <p style={{ fontSize: '12px', color: '#457B9D' }}>{item.description}</p>
                          </div>
                        </motion.a>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Bouton Se connecter */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/login')}
          style={{
            padding: '10px 24px',
            background: '#E63946',
            border: 'none',
            borderRadius: '30px',
            color: 'white',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 10px rgba(230,57,70,0.3)'
          }}
        >
          Me connecter
          <ArrowRight size={16} />
        </motion.button>
      </motion.nav>

      {/* Hero Section */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '120px 80px 80px',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Left Content */}
        <div style={{ flex: 1, maxWidth: '600px' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 style={{
              fontSize: '64px',
              fontWeight: '800',
              color: 'white',
              lineHeight: 1.1,
              marginBottom: '24px'
            }}>
              Gérez vos{' '}
              <span style={{
                background: 'linear-gradient(135deg, #E63946, #A8DADC)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                chantiers
              </span>
              <br />en toute simplicité
            </h1>

            <p style={{
              fontSize: '18px',
              color: '#A8DADC',
              marginBottom: '40px',
              lineHeight: 1.6
            }}>
              La solution complète de pointage et de gestion de paie pour le BTP.
              Plus de 500 entreprises nous font confiance.
            </p>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '60px' }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/login')}
                style={{
                  padding: '16px 40px',
                  background: '#E63946',
                  border: 'none',
                  borderRadius: '50px',
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 10px 30px rgba(230,57,70,0.3)'
                }}
              >
                Commencer maintenant
                <ArrowRight size={20} />
              </motion.button>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: '50px' }}>
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  <p style={{
                    fontSize: '32px',
                    fontWeight: '800',
                    color: 'white',
                    marginBottom: '4px'
                  }}>
                    {stat.value}
                  </p>
                  <p style={{ color: '#A8DADC', fontSize: '14px' }}>
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Content - Feature Showcase */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', position: 'relative' }}>
          <motion.div
            animate={{
              y: [0, -20, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              width: '400px',
              height: '500px',
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(10px)',
              borderRadius: '40px',
              padding: '40px',
              border: '1px solid rgba(168,218,220,0.2)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Feature Carousel */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                {React.createElement(features[currentSlide].icon, {
                  size: 80,
                  color: features[currentSlide].color,
                  style: { marginBottom: '30px' }
                })}

                <h3 style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  color: 'white',
                  marginBottom: '20px'
                }}>
                  {features[currentSlide].title}
                </h3>

                <p style={{
                  fontSize: '16px',
                  color: '#A8DADC',
                  lineHeight: 1.8,
                  marginBottom: '30px'
                }}>
                  {features[currentSlide].description}
                </p>

                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  {features.map((_, index) => (
                    <motion.div
                      key={index}
                      animate={{
                        scale: index === currentSlide ? 1.2 : 1,
                        backgroundColor: index === currentSlide ? '#E63946' : 'rgba(168,218,220,0.3)'
                      }}
                      style={{
                        width: '30px',
                        height: '4px',
                        borderRadius: '2px',
                        cursor: 'pointer'
                      }}
                      onClick={() => setCurrentSlide(index)}
                    />
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Floating icons */}
            <motion.div
              animate={{
                rotate: [0, 360],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                width: '60px',
                height: '60px',
                background: 'rgba(230,57,70,0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <HardHat color="#E63946" size={30} />
            </motion.div>

            <motion.div
              animate={{
                rotate: [0, -360],
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{
                position: 'absolute',
                bottom: '30px',
                left: '20px',
                width: '50px',
                height: '50px',
                background: 'rgba(69,123,157,0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Smartphone color="#457B9D" size={25} />
            </motion.div>

            <motion.div
              animate={{
                y: [0, -15, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{
                position: 'absolute',
                top: '100px',
                left: '20px',
                width: '40px',
                height: '40px',
                background: 'rgba(168,218,220,0.2)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Cloud color="#A8DADC" size={20} />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" style={{
        padding: '100px 80px',
        background: '#F1FAEE',
        position: 'relative',
        zIndex: 10
      }}>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{
            fontSize: '48px',
            fontWeight: '800',
            color: '#1D3557',
            textAlign: 'center',
            marginBottom: '20px'
          }}
        >
          Tout ce dont vous avez besoin
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{
            fontSize: '18px',
            color: '#457B9D',
            textAlign: 'center',
            maxWidth: '600px',
            margin: '0 auto 60px'
          }}
        >
          Une solution complète pour gérer vos chantiers, vos équipes et votre paie
        </motion.p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '30px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10, scale: 1.02 }}
                style={{
                  background: 'white',
                  padding: '40px 30px',
                  borderRadius: '30px',
                  boxShadow: '0 20px 40px rgba(29,53,71,0.1)',
                  border: '1px solid rgba(168,218,220,0.3)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.2
                  }}
                  style={{
                    width: '60px',
                    height: '60px',
                    background: `${feature.color}20`,
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '24px'
                  }}
                >
                  <Icon size={30} color={feature.color} />
                </motion.div>

                <h3 style={{
                  fontSize: '22px',
                  fontWeight: '700',
                  color: '#1D3557',
                  marginBottom: '12px'
                }}>
                  {feature.title}
                </h3>

                <p style={{
                  fontSize: '15px',
                  color: '#457B9D',
                  lineHeight: 1.6
                }}>
                  {feature.description}
                </p>

                {/* Decorative line */}
                <motion.div
                  animate={{
                    width: ['0%', '100%', '0%'],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.3
                  }}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    height: '3px',
                    background: `linear-gradient(90deg, transparent, ${feature.color}, transparent)`
                  }}
                />
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" style={{
        padding: '100px 80px',
        background: 'linear-gradient(135deg, #1D3557 0%, #457B9D 100%)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <motion.h2
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          style={{
            fontSize: '48px',
            fontWeight: '800',
            color: 'white',
            marginBottom: '20px',
            position: 'relative',
            zIndex: 10
          }}
        >
          Prêt à révolutionner votre gestion ?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{
            fontSize: '18px',
            color: '#A8DADC',
            marginBottom: '40px',
            maxWidth: '600px',
            margin: '0 auto 40px',
            position: 'relative',
            zIndex: 10
          }}
        >
          Rejoignez plus de 500 entreprises qui nous font déjà confiance
        </motion.p>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/login')}
          style={{
            padding: '20px 60px',
            background: '#E63946',
            border: 'none',
            borderRadius: '60px',
            color: 'white',
            fontSize: '20px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 20px 40px rgba(230,57,70,0.3)',
            position: 'relative',
            zIndex: 10
          }}
        >
          Commencer gratuitement
          <ArrowRight size={24} />
        </motion.button>

        {/* Floating elements */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -30, 0],
              x: [0, i % 2 === 0 ? 20 : -20, 0],
              rotate: [0, 360, 0],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              position: 'absolute',
              bottom: `${20 + i * 15}%`,
              left: `${10 + i * 20}%`,
              width: `${10 + i * 5}px`,
              height: `${10 + i * 5}px`,
              background: `rgba(168,218,220,${0.1 + i * 0.05})`,
              borderRadius: '50%',
              zIndex: 1
            }}
          />
        ))}
      </section>

      {/* Footer */}
      <footer style={{
        padding: '60px 80px',
        background: '#1D3557',
        borderTop: '1px solid rgba(168,218,220,0.1)'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr repeat(3, 1fr)',
          gap: '60px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #E63946, #A8DADC)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#1D3557' }}>KL</span>
              </div>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'white' }}>KL Béton</span>
            </div>
            <p style={{ color: '#A8DADC', lineHeight: 1.8 }}>
              La solution innovante pour la gestion de pointage et de paie dans le BTP.
            </p>
          </div>

          {Object.entries({
            'Produit': ['Fonctionnalités', 'Tarifs', 'FAQ'],
            'Support': ['Aide', 'Documentation', 'Contact'],
            'Légal': ['Confidentialité', 'Conditions', 'Cookies']
          }).map(([section, links], i) => (
            <div key={i}>
              <h4 style={{ color: 'white', fontWeight: '600', marginBottom: '20px' }}>{section}</h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {links.map((link, j) => (
                  <li key={j} style={{ marginBottom: '12px' }}>
                    <motion.a
                      href="#"
                      whileHover={{ x: 5 }}
                      style={{ color: '#A8DADC', textDecoration: 'none', cursor: 'pointer' }}
                    >
                      {link}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: '60px',
          paddingTop: '30px',
          borderTop: '1px solid rgba(168,218,220,0.1)',
          textAlign: 'center',
          color: '#A8DADC'
        }}>
          © 2024 KL Béton Construction. Tous droits réservés.
        </div>
      </footer>

      {/* Scroll indicator */}
      <motion.div
        animate={{
          y: [0, 10, 0],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          position: 'absolute',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          zIndex: 20
        }}
      >
        <span style={{ fontSize: '14px', opacity: 0.7 }}>Découvrir</span>
        <ChevronDown size={24} />
      </motion.div>
    </div>
  )
}