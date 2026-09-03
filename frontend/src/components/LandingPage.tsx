import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { startPayment } from '../utils/payment';
import { UserMenu } from './UserMenu';
import {
  Zap,
  ShieldCheck,
  FileText,
  Layers,
  Clock,
  Cloud,
  Users,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  Building2,
  Wrench,
  GraduationCap,
  LogIn,
  Cpu,
  Crown,
  Star,
  Download,
  Globe,
  Award,
  BarChart3,
  BookOpen,
} from 'lucide-react';

interface LandingPageProps {
  onLoginClick: () => void;
  onRegisterClick?: () => void;
}

export const LandingPage = ({ onLoginClick }: LandingPageProps) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [planPrices, setPlanPrices] = useState({ basic: '$4.500', pro: '$9.000' });
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/plans')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setPlanPrices({
            basic: data.basic?.formatted || '$4.500',
            pro: data.pro?.formatted || '$9.000'
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleSubscribeClick = (planType: 'basic' | 'pro') => {
    if (isAuthenticated) {
      startPayment(planType);
    } else {
      navigate(`/register?plan=${planType}`);
    }
  };

  const handleAccessPlatform = () => {
    if (isAuthenticated) {
        navigate('/app');
    } else {
      const el = document.getElementById('precio');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.location.hash = 'precio';
      }
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white">

      {/* ═══════════════════════════════════════════════
          NAVEGACIÓN SUPERIOR
      ═══════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 p-0.5 shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
              </div>
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
                Electro<p className="text-emerald-400">Check</p>
              </span>
              
            </div>
          </div>

          {/* Navegación */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#funcionalidades" className="hover:text-emerald-400 transition-colors">Funcionalidades</a>
            <a href="#beneficios" className="hover:text-emerald-400 transition-colors">Beneficios</a>
            <a href="#destinatarios" className="hover:text-emerald-400 transition-colors">¿Para quién es?</a>
            <a href="#precio" className="hover:text-emerald-400 transition-colors font-semibold text-emerald-400">Precio</a>
            <a href="#faq" className="hover:text-emerald-400 transition-colors">Preguntas Frecuentes</a>
          </nav>

          {/* UserMenu integrado */}
          <div className="flex items-center gap-3">
            <UserMenu />
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════════ */}
      <section className="relative pt-24 pb-28 overflow-hidden">
        {/* Blobs de fondo */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-emerald-500/15 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[300px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[350px] h-[250px] bg-teal-600/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          {/* Título principal */}
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15] mb-6">
              Cálculos Eléctricos y <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                Carpetas Técnicas AEA
              </span>{' '}
              en Segundos
            </h1>
            <p className="text-lg sm:text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              La plataforma web para proyectistas electricos, ingenieros y estudiantes que automatiza el dimensionamiento de
              conductores, verificación de protecciones, tableros y genera informes técnicos
              profesionales en PDF.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={handleAccessPlatform}
                className="px-8 py-4 text-base font-bold text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:brightness-110 transition-all rounded-xl shadow-xl shadow-emerald-500/25 flex items-center gap-3 group"
              >
                <span>{isAuthenticated ? 'Ir a la Aplicación' : 'Acceder a la Plataforma'}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <a
                href="#funcionalidades"
                className="px-8 py-4 text-base font-semibold text-slate-300 bg-slate-800/60 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 transition-all rounded-xl flex items-center gap-3"
              >
                <BookOpen className="w-5 h-5 text-slate-400" />
                <span>Ver Funcionalidades</span>
              </a>
            </div>
          </div>

          {/* Badges de características */}
          <div className="mt-14 flex flex-wrap justify-center gap-3">
            {[
              { icon: CheckCircle2, text: '100% en el Navegador' },
              { icon: CheckCircle2, text: 'Sin Instalaciones' },
              { icon: CheckCircle2, text: 'Norma AEA' },
              { icon: CheckCircle2, text: 'Informe PDF Descargable' },
              { icon: CheckCircle2, text: 'Viviendas (Comercios e industrias próximamente)' },
            ].map((badge, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-sm"
              >
                <badge.icon className="w-4 h-4 text-emerald-400" />
                {badge.text}
              </div>
            ))}
          </div>

          {/* Fin del Hero */}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECCIÓN FUNCIONALIDADES
      ═══════════════════════════════════════════════ */}
      <section id="funcionalidades" className="py-24 bg-slate-900/50 border-t border-b border-slate-800/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-emerald-400 tracking-wider uppercase mb-4 block">
              Funcionalidades Principales
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Todo lo que necesitas para tus Proyectos Eléctricos
            </h2>
            <p className="mt-4 text-slate-400 text-base">
              Una sola herramienta que centraliza desde el cálculo normativo hasta la documentación final.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Cpu,
                color: 'text-emerald-400',
                bg: 'bg-emerald-500/10 border-emerald-500/20',
                title: 'Dimensionamiento de Conductores',
                desc: 'Calcula la sección recomendada de cada circuito según la norma AEA y el tipo de instalación (vivienda, comercio o industria).',
              },
              {
                icon: ShieldCheck,
                color: 'text-teal-400',
                bg: 'bg-teal-500/10 border-teal-500/20',
                title: 'Verificación de Protecciones',
                desc: 'Validación automática de condiciones dadas por norma. Detecta incompatibilidades antes de presentar el proyecto.',
              },
              {
                icon: FileText,
                color: 'text-cyan-400',
                bg: 'bg-cyan-500/10 border-cyan-500/20',
                title: 'Carpeta Técnica en 1 Clic',
                desc: 'Genera informes PDF con memoria descriptiva, matriz de cálculo y carátula oficial, listos para presentar ante entes de fiscalización.',
              },
              
            ].map((feature, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl border ${feature.bg} flex items-center justify-center mb-5`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          TARJETAS DE SUSCRIPCIÓN
      ═══════════════════════════════════════════════ */}
      <section id="precio" className="py-24 px-4 bg-slate-900/30">
        <div className="text-center mb-12">
          <span className="text-xs font-bold text-emerald-400 tracking-wider uppercase mb-4 block">Planes</span>
          <h2 className="text-3xl font-bold text-white">Elige tu Plan</h2>
          <p className="text-slate-400 mt-2">Accede a las herramientas que necesitas.</p>
        </div>
        
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            {
              title: "Calculadora",
              badge: "Disponible",
              price: planPrices.basic,
              desc: "Acceso a cálculos de parámetros",
              features: [
                { name: "Cálculos normativos AEA", included: true },
                { name: "Informes técnicos PDF", included: true },
                { name: "Verificación de protecciones", included: false },
                { name: "Dimensionamiento de conductores", included: false },
                { name: "Soporte prioritario", included: false },
              ],
              buttonText: "Suscribirse Ahora",
              isPro: false,
              available: true,
              planType: 'basic' as const,
            },

            {
              title: "Acceso Total",
              badge: "Recomendado",
              price: planPrices.pro,
              desc: "Todo incluido, sin límites para tus proyectos",
              features: [
                { name: "Cálculos normativos AEA", included: true },
                { name: "Dimensionamiento de conductores", included: true },
                { name: "Verificación de protecciones", included: true },
                { name: "Informes técnicos PDF", included: true },
                { name: "Soporte prioritario", included: true },
              ],
              buttonText: "Suscribirse al Plan Pro",
              isPro: true,
              available: true,
              planType: 'pro' as const,
            }
          ].map((plan, i) => (
            <div
              key={i}
              className={`rounded-3xl p-8 shadow-2xl relative flex flex-col transition-all ${
                plan.isPro
                  ? 'bg-slate-900 border-2 border-emerald-400/80 shadow-emerald-950/40 hover:border-emerald-300 ring-1 ring-emerald-500/20'
                  : 'bg-slate-900 border-2 border-slate-700/60 shadow-slate-950/20 hover:border-emerald-500/50'
              }`}
            >
              <div className="absolute top-6 right-6 flex items-center gap-2">
                <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${
                  plan.isPro
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {plan.badge}
                </span>
                {plan.isPro && <Crown className="w-5 h-5 text-amber-400" />}
              </div>
              
              <h3 className="text-2xl font-bold mb-1 text-white">
                {plan.title}
              </h3>
              <p className="text-slate-400 text-sm mb-5">{plan.desc}</p>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-5xl font-black text-white">
                  {plan.price}
                </span>
                <span className="text-slate-400">/ mes</span>
              </div>
              
              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feat, idx) => (
                  <li
                    key={idx}
                    className={`flex items-center gap-3 ${
                      feat.included ? 'text-slate-100' : 'text-slate-500'
                    }`}
                  >
                    {feat.included ? (
                      <CheckCircle2
                        className="w-5 h-5 flex-shrink-0 text-emerald-400"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
                        <span className="text-red-500/60 font-bold text-xs">✕</span>
                      </div>
                    )}
                    <span>{feat.name}</span>
                  </li>
                ))}
              </ul>
              
              <button 
                onClick={() => handleSubscribeClick(plan.planType)} 
                className={`w-full py-4 font-bold rounded-xl transition-all shadow-lg cursor-pointer text-center ${
                  plan.isPro
                    ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:brightness-110 text-slate-950 shadow-emerald-500/30 font-extrabold'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 shadow-emerald-500/20'
                }`}
              >
                {plan.buttonText}
              </button>

            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECCIÓN BENEFICIOS
      ═══════════════════════════════════════════════ */}
      <section id="beneficios" className="py-24 relative border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-emerald-400 tracking-wider uppercase mb-4 block">
              Beneficios
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              ¿Por qué usar ElectroCheck?
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                icon: Clock,
                color: 'text-emerald-400',
                title: 'Ahorro de Tiempo de hasta 80%',
                desc: 'Pasa de horas haciendo cálculos manuales en Excel a generar el proyecto completo en minutos. Ingresás los datos, la plataforma hace el resto.',
              },
              {
                icon: Award,
                color: 'text-teal-400',
                title: 'Garantía de Cumplimiento Normativo',
                desc: 'Cumplimiento estricto de AEA.                                            Reducís los rechazos en entes de fiscalización y distribuidoras.',
              },
              {
                icon: FileText,
                color: 'text-cyan-400',
                title: 'Presentación Profesional',
                desc: 'Entregá a tus clientes carpetas técnicas con estética impecable, listas para firmar e imprimir. Mejorá tu imagen profesional.',
              },
              {
                icon: Cloud,
                color: 'text-indigo-400',
                title: '100% Online',
                desc: 'Accedé desde cualquier computadora, tablet o navegador sin instalaciones complicadas en tu computadora. Tus proyectos quedan guardados y accesibles siempre.',
              },
            ].map((benefit, i) => (
              <div
                key={i}
                className="p-8 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:border-slate-700 transition-all flex gap-6"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center">
                  <benefit.icon className={`w-6 h-6 ${benefit.color}`} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{benefit.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECCIÓN DESTINATARIOS
      ═══════════════════════════════════════════════ */}
      <section id="destinatarios" className="py-24 bg-slate-900/50 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-emerald-400 tracking-wider uppercase mb-4 block">
              ¿Para quién es?
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Diseñado para Profesionales del Sector Eléctrico
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Wrench,
                title: 'Electricistas Habilitados e Instaladores',
                desc: 'Confeccioná la documentación técnica requerida para la habilitación de obras, de forma rápida y sin errores.',
                color: 'text-emerald-400',
                bg: 'bg-emerald-500/10 border-emerald-500/20',
              },
              {
                icon: Users,
                title: 'Ingenieros y Proyectistas Eléctricos',
                desc: 'Acelerá la memoria de cálculo y la especificación de tableros en proyectos comerciales, industriales y residenciales.',
                color: 'text-teal-400',
                bg: 'bg-teal-500/10 border-teal-500/20',
              },
              {
                icon: Building2,
                title: 'Arquitectos y Directores de Obra',
                desc: 'Dimensioná demandas, computá materiales y estimá costos en etapa de diseño sin depender de un especialista.',
                color: 'text-cyan-400',
                bg: 'bg-cyan-500/10 border-cyan-500/20',
              },
              {
                icon: GraduationCap,
                title: 'Estudiantes y Docentes',
                desc: 'Herramienta didáctica para auditar proyectos, verificar ejercicios normativos y aprender el cálculo eléctrico aplicado.',
                color: 'text-indigo-400',
                bg: 'bg-indigo-500/10 border-indigo-500/20',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all"
              >
                <div className={`w-12 h-12 rounded-xl border ${item.bg} flex items-center justify-center mb-4`}>
                  <item.icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECCIÓN FAQ
      ═══════════════════════════════════════════════ */}
      <section id="faq" className="py-24 border-t border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-emerald-400 tracking-wider uppercase mb-4 block">FAQ</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Preguntas Frecuentes</h2>
          </div>
          <div className="space-y-4">
            {[
              {
                q: '¿Qué reglamentación utiliza para los cálculos?',
                a: 'La plataforma aplica las normas AEA vigentes para instalaciones eléctricas. Para instalaciones industriales, incorpora los criterios de dimensionamiento según IRAM y AEA de aplicación general.',
              },
              {
                q: '¿Puedo descargar los informes en PDF?',
                a: 'Sí. Todos los informes generados se pueden descargar como PDF directamente desde la plataforma. El PDF incluye carátula, memoria descriptiva, matriz de cálculo de conductores, resumen de protecciones y lista de materiales.',
              },
              {
                q: '¿Requiere instalar algún software?',
                a: 'No. ElectroCheck funciona 100% en el navegador web. No necesitás descargar ni instalar nada. Basta con un navegador moderno (Chrome, Firefox, Edge) y conexión a Internet.',
              },
              {
                q: '¿Los informes sirven para presentar ante la distribuidora o ente fiscalizador?',
                a: 'Sí. El formato y el contenido están pensados para cumplir los requisitos de presentación técnica. Igualmente, siempre es recomendable verificar con tu distribuidora local los requisitos específicos de formato que puedan exigir.',
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left group"
                >
                  <span className="font-bold text-white group-hover:text-emerald-400 transition-colors pr-4">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-300 ${
                      openFaq === idx ? 'rotate-180 text-emerald-400' : ''
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-5">
                    <p className="text-sm text-slate-400 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════ */}
      <footer className="py-12 border-t border-slate-800/80 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 p-0.5">
                <div className="w-full h-full bg-slate-950 rounded-md flex items-center justify-center">
                  <Zap className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
              <span className="text-sm font-bold text-slate-300">
                Electro<span className="text-emerald-400">SaaS</span>
              </span>
            </div>

            {/* Links */}
            <nav className="flex flex-wrap items-center gap-5 text-sm text-slate-500">
              <a href="#funcionalidades" className="hover:text-slate-300 transition-colors">Funcionalidades</a>
              <a href="#beneficios" className="hover:text-slate-300 transition-colors">Beneficios</a>
              <a href="#faq" className="hover:text-slate-300 transition-colors">FAQ</a>
              <a href="/terminos" className="hover:text-slate-300 transition-colors">Términos de Servicio</a>
              <a href="/privacidad" className="hover:text-slate-300 transition-colors">Privacidad</a>
              <button onClick={onLoginClick} className="hover:text-emerald-400 transition-colors flex items-center gap-1">
                <LogIn className="w-3.5 h-3.5" />
                Iniciar Sesión
              </button>
            </nav>

            {/* Copyright */}
            <p className="text-xs text-slate-600">
              © {new Date().getFullYear()} ElectroCheck. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
