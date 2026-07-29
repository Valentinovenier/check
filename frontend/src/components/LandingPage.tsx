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
  Calculator
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
      <section className="relative pt-20 pb-24 text-center">
        <h1 className="text-5xl font-black text-white mb-6">Calculadora Eléctrica AEA 770</h1>
        <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">Dimensionamiento, protecciones y generación de informes en minutos.</p>
        <button
          onClick={onLoginClick}
          className="px-8 py-4 text-base font-bold text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:brightness-110 transition-all rounded-xl"
        >
          Acceder a la Plataforma
        </button>
      </section>

      {/* FOOTER simplificado */}
      <footer className="bg-slate-950 py-12 border-t border-slate-900 text-center text-slate-400 text-xs">
        © {new Date().getFullYear()} ElectroSaaS.
      </footer>
    </div>
  );
};
