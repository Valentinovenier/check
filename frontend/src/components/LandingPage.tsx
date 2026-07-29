import { useState } from 'react';
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
  Sparkles,
  ChevronDown,
  Building2,
  Wrench,
  GraduationCap,
  HelpCircle,
  LogIn,
  Cpu,
  Calculator,
  Crown
} from 'lucide-react';

interface LandingPageProps {
  onLoginClick: () => void;
  onRegisterClick: () => void;
}

export const LandingPage = ({ onLoginClick }: LandingPageProps) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white">
      {/* NAVEGACIÓN SUPERIOR */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 p-0.5 shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
              </div>
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
                Electro<span className="text-emerald-400">SaaS</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-400 block -mt-1 tracking-wider uppercase">
                Norma AEA 90364-7-770
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#funcionalidades" className="hover:text-emerald-400 transition-colors">Funcionalidades</a>
            <a href="#beneficios" className="hover:text-emerald-400 transition-colors">Beneficios</a>
            <a href="#faq" className="hover:text-emerald-400 transition-colors">Preguntas Frecuentes</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={onLoginClick}
              className="px-6 py-2.5 text-sm font-bold text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:brightness-110 transition-all rounded-lg shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Iniciar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-20 pb-24 overflow-hidden">
        {/* Efectos de luces */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[300px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tight">
            Calculadora Eléctrica <br />
            <span className="text-emerald-400">AEA 770</span> Profesional
          </h1>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            La solución integral para instaladores e ingenieros. Dimensionamiento, protecciones y generación de informes normativos en segundos.
          </p>
          <button
            onClick={onLoginClick}
            className="px-8 py-4 text-base font-bold text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:brightness-110 transition-all rounded-xl shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-3 group mx-auto"
          >
            <span>Acceder a la Plataforma</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* SECCIÓN FUNCIONALIDADES */}
      <section id="funcionalidades" className="py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800">
              <Cpu className="w-8 h-8 text-emerald-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Cálculo de Conductores</h3>
              <p className="text-sm text-slate-400">Dimensionamiento completo según normas.</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800">
              <ShieldCheck className="w-8 h-8 text-teal-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Protecciones</h3>
              <p className="text-sm text-slate-400">Verificación de reglas de seguridad.</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800">
              <FileText className="w-8 h-8 text-cyan-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Informes PDF</h3>
              <p className="text-sm text-slate-400">Carpeta técnica lista para presentar.</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800">
              <Layers className="w-8 h-8 text-indigo-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Cómputo BOM</h3>
              <p className="text-sm text-slate-400">Listado consolidado de materiales.</p>
            </div>
        </div>
      </section>

      {/* TARJETA DE PAGO PREMIUM */}
      <section className="py-20 px-4 bg-slate-900/30">
        <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white">Suscripción Premium</h2>
        </div>
        <div className="max-w-md mx-auto bg-slate-900 border border-emerald-500/30 rounded-3xl p-8 shadow-2xl shadow-emerald-500/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <Crown className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Acceso Total</h3>
          <div className="flex items-baseline gap-1 mb-6">
            <span className="text-4xl font-black text-white">$15.000</span>
            <span className="text-slate-400">/ mes</span>
          </div>
          
          <ul className="space-y-4 mb-8 text-slate-300">
            {[
              "Cálculos normativos AEA 90364-7-770",
              "Informes técnicos en PDF",
              "Cómputo métrico automático",
              "Soporte prioritario"
            ].map((feature, i) => (
              <li key={i} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                {feature}
              </li>
            ))}
          </ul>

          <button
            onClick={onLoginClick}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all"
          >
            Suscribirse Ahora
          </button>
        </div>
      </section>

      {/* SECCIÓN BENEFICIOS */}
      <section id="beneficios" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800">
              <Clock className="w-8 h-8 text-emerald-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Ahorro de Tiempo</h3>
              <p className="text-sm text-slate-400">Genera memorias de cálculo en minutos.</p>
            </div>
            <div className="p-8 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800">
              <Cloud className="w-8 h-8 text-indigo-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Acceso 100% Cloud</h3>
              <p className="text-sm text-slate-400">Accede desde cualquier dispositivo.</p>
            </div>
        </div>
      </section>

      {/* SECCIÓN DESTINATARIOS */}
      <section id="destinatarios" className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
                { icon: Wrench, title: "Electricistas" },
                { icon: Users, title: "Ingenieros" },
                { icon: Building2, title: "Arquitectos" },
                { icon: GraduationCap, title: "Estudiantes" }
            ].map((item, i) => (
                <div key={i} className="p-6 rounded-2xl bg-slate-950 border border-slate-800">
                    <item.icon className="w-8 h-8 text-emerald-400 mb-4" />
                    <h3 className="text-lg font-bold text-white">{item.title}</h3>
                </div>
            ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold text-white text-center mb-12">Preguntas Frecuentes</h2>
          <div className="space-y-4">
            {[
              { q: '¿Qué norma técnica utiliza?', a: 'AEA 90364-7-770.' },
              { q: '¿Los informes sirven?', a: 'Sí, formato profesional listo para firmar.' },
            ].map((faq, idx) => (
              <div key={idx} className="rounded-xl bg-slate-900 border border-slate-800 p-5">
                <p className="font-bold text-white">{faq.q}</p>
                <p className="text-sm text-slate-400 mt-2">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-12 text-center text-slate-500 text-xs border-t border-slate-900">
        © {new Date().getFullYear()} ElectroSaaS.
      </footer>
    </div>
  );
};
