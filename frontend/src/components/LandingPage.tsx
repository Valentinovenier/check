import { useState } from 'react';
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
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const handleSubscribeClick = () => {
    if (isAuthenticated) {
      startPayment();
    } else {
      navigate('/register');
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
                Electro<span className="text-emerald-400">SaaS</span>
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
          {/* Badge de confianza */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold">
              <Star className="w-4 h-4 fill-emerald-400" />
              Norma AEA 90364-7-770 — Reglamentación Ley 10281
            </div>
          </div>

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
          TARJETA SUSCRIPCIÓN PREMIUM
      ═══════════════════════════════════════════════ */}
      <section id="precio" className="py-24 px-4 bg-slate-900/30">
        <div className="text-center mb-12">
          <span className="text-xs font-bold text-emerald-400 tracking-wider uppercase mb-4 block">Planes</span>
          <h2 className="text-3xl font-bold text-white">Suscripción Premium</h2>
          <p className="text-slate-400 mt-2">Acceso completo a todas las funcionalidades de la plataforma.</p>
        </div>
        <div className="max-w-md mx-auto bg-slate-900 border border-emerald-500/30 rounded-3xl p-8 shadow-2xl shadow-emerald-500/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <Crown className="w-8 h-8 text-emerald-400" />
          </div>
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

          <h3 className="text-2xl font-bold text-white mb-1">Acceso Total</h3>
          <p className="text-slate-400 text-sm mb-5">Todo incluido, sin límites.</p>
          <div className="flex items-baseline gap-1 mb-7">
            <span className="text-4xl font-black text-white">$9.000</span>
            <span className="text-slate-400">/ mes</span>
          </div>
          <ul className="space-y-4 mb-8 text-slate-300">
            {[
              'Cálculos normativos AEA',
              'Informes técnicos en PDF',
              'Proyectos ilimitados',
              'Soporte prioritario',
            ].map((feature, i) => (
              <li key={i} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
          <button
            onClick={handleSubscribeClick}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
          >
            Suscribirse Ahora
          </button>
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
              ¿Por qué usar ElectroSaaS?
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
                desc: 'Cumplimiento estricto de AEA 90364-7-770 y normativas provinciales (ERSeP/ENRE). Reducís los rechazos en entes de fiscalización y distribuidoras.',
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
                a: 'La plataforma aplica la norma AEA 90364-7-770 (Instalaciones en Viviendas) y la reglamentación de la Ley 10281. Para instalaciones industriales, incorpora los criterios de dimensionamiento según IRAM y AEA de aplicación general.',
              },
              {
                q: '¿Puedo descargar los informes en PDF?',
                a: 'Sí. Todos los informes generados se pueden descargar como PDF directamente desde la plataforma. El PDF incluye carátula, memoria descriptiva, matriz de cálculo de conductores, resumen de protecciones y lista de materiales.',
              },
              {
                q: '¿Requiere instalar algún software?',
                a: 'No. ElectroSaaS funciona 100% en el navegador web. No necesitás descargar ni instalar nada. Basta con un navegador moderno (Chrome, Firefox, Edge) y conexión a Internet.',
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
          BANNER CTA FINAL
      ═══════════════════════════════════════════════ */}
      <section className="py-24 relative overflow-hidden border-t border-slate-800/80">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/30 via-slate-950 to-teal-900/20 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-500/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold mb-6">
            <Zap className="w-4 h-4" />
            Comenzá hoy
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-6 leading-tight">
            Empezá a generar tus Carpetas Técnicas{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
              en minutos
            </span>
          </h2>
          <p className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto">
            Calculá, verificá y documentá tus instalaciones eléctricas de forma ágil, normativa y profesional.
          </p>
          <button
            onClick={handleSubscribeClick}
            className="px-10 py-4 text-base font-bold text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:brightness-110 transition-all rounded-xl shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-3 group mx-auto"
          >
            <span>Acceder a la Plataforma</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
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
            <nav className="flex items-center gap-6 text-sm text-slate-500">
              <a href="#funcionalidades" className="hover:text-slate-300 transition-colors">Funcionalidades</a>
              <a href="#beneficios" className="hover:text-slate-300 transition-colors">Beneficios</a>
              <a href="#faq" className="hover:text-slate-300 transition-colors">FAQ</a>
              <button onClick={onLoginClick} className="hover:text-emerald-400 transition-colors flex items-center gap-1">
                <LogIn className="w-3.5 h-3.5" />
                Iniciar Sesión
              </button>
            </nav>

            {/* Copyright */}
            <p className="text-xs text-slate-600">
              © {new Date().getFullYear()} ElectroSaaS. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
