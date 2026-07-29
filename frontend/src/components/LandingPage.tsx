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
  UserPlus,
  Cpu,
  Calculator
} from 'lucide-react';

interface LandingPageProps {
  onLoginClick: () => void;
  onRegisterClick: () => void;
}

export const LandingPage = ({ onLoginClick, onRegisterClick }: LandingPageProps) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white">
      {/* ---------------------------------------------------- */}
      {/* NAVEGACIÓN SUPERIOR */}
      {/* ---------------------------------------------------- */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
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

          {/* Menú de Navegación */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#funcionalidades" className="hover:text-emerald-400 transition-colors">Funcionalidades</a>
            <a href="#beneficios" className="hover:text-emerald-400 transition-colors">Beneficios</a>
            <a href="#destinatarios" className="hover:text-emerald-400 transition-colors">¿Para quién es?</a>
            <a href="#faq" className="hover:text-emerald-400 transition-colors">Preguntas Frecuentes</a>
          </nav>

          {/* Botones de Acción */}
          <div className="flex items-center gap-3">
            <button
              onClick={onLoginClick}
              className="px-4 py-2 text-sm font-semibold text-slate-200 hover:text-white transition-colors flex items-center gap-2 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800"
            >
              <LogIn className="w-4 h-4 text-emerald-400" />
              <span>Ingresar</span>
            </button>
            <button
              onClick={onRegisterClick}
              className="px-4 py-2.5 text-sm font-bold text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:brightness-110 transition-all rounded-lg shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Registrarse Gratis</span>
            </button>
          </div>
        </div>
      </header>

      {/* ---------------------------------------------------- */}
      {/* HERO SECTION */}
      {/* ---------------------------------------------------- */}
      <section className="relative pt-20 pb-24 overflow-hidden">
        {/* Luces de fondo y gradientes decorativos */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[300px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Badge superior */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Plataforma Cloud de Ingeniería Eléctrica</span>
            </div>

            {/* Título Principal */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
              Cálculos Eléctricos y <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                Carpetas Técnicas AEA
              </span> en Segundos
            </h1>

            {/* Subtítulo */}
            <p className="text-lg sm:text-xl text-slate-300 leading-relaxed font-normal">
              La herramienta web integral para instaladores e ingenieros que automatiza el dimensionamiento de conductores, verificación de protecciones, esquemas unifilares y generación de informes normativos en PDF.
            </p>

            {/* Botones de CTA */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={onRegisterClick}
                className="w-full sm:w-auto px-8 py-4 text-base font-bold text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:brightness-110 transition-all rounded-xl shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-3 group"
              >
                <span>Probar Gratis Ahora</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={onLoginClick}
                className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-slate-200 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all rounded-xl flex items-center justify-center gap-2"
              >
                <Calculator className="w-5 h-5 text-emerald-400" />
                <span>Acceder a la Calculadora</span>
              </button>
            </div>

            {/* Garantía e íconos de confianza */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Conforme a Reglamentación AEA 90364-7-770</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Formato de Carpeta Técnica Modelo Apta</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Despliegue Ultrarrápido en Cloudflare</span>
              </div>
            </div>
          </div>

          {/* Vista Previa de la Interfaz (Mockup) */}
          <div className="mt-16 relative max-w-5xl mx-auto">
            <div className="rounded-2xl p-2 bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-800 shadow-2xl shadow-emerald-950/40">
              <div className="bg-slate-950 rounded-xl overflow-hidden border border-slate-800/80">
                {/* Simulated App Header */}
                <div className="h-10 bg-slate-900/90 px-4 flex items-center justify-between border-b border-slate-800 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    <span className="ml-2 font-mono text-[11px] text-slate-400">electro-saas.pages.dev/proyecto-vivienda</span>
                  </div>
                  <span className="font-semibold text-emerald-400">Informe Técnico AEA 770</span>
                </div>

                {/* Simulated Content Dashboard */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950">
                  <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2">
                    <div className="text-xs text-slate-400 font-semibold">Grado de Electrificación</div>
                    <div className="text-xl font-bold text-emerald-400">MEDIO (72.42 m²)</div>
                    <div className="text-[11px] text-slate-400">Cantidad mínima de circuitos: 3</div>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2">
                    <div className="text-xs text-slate-400 font-semibold">Potencia Máx. Simultánea (DPMS)</div>
                    <div className="text-xl font-bold text-teal-300">5.66 kVA / 4.81 kW</div>
                    <div className="text-[11px] text-slate-400">Corriente total de cálculo: 25.75 A</div>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2">
                    <div className="text-xs text-slate-400 font-semibold">Verificación RAEA</div>
                    <div className="text-xl font-bold text-cyan-400">I_B ≤ I_n ≤ I_z (CUMPLIDO)</div>
                    <div className="text-[11px] text-slate-400">Protección: PIA 32A / Dif 40A</div>
                  </div>

                  {/* Tabla Previa */}
                  <div className="md:col-span-3 mt-2 p-4 rounded-lg bg-slate-900/60 border border-slate-800 overflow-x-auto">
                    <div className="flex items-center justify-between mb-3 text-xs font-bold text-slate-300">
                      <span>RESUMEN DE CIRCUITOS Y SECCIONES CALCULADAS</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px]">Exportable a PDF</span>
                    </div>
                    <table className="w-full text-left text-xs font-mono text-slate-300">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="pb-2">Circuito</th>
                          <th className="pb-2">Tipo</th>
                          <th className="pb-2">Bocas</th>
                          <th className="pb-2">Sección L1-N</th>
                          <th className="pb-2">Protección</th>
                          <th className="pb-2">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        <tr>
                          <td className="py-2 text-white font-semibold">Circuito 1</td>
                          <td className="py-2 text-emerald-400">IUG c/toma</td>
                          <td className="py-2">6</td>
                          <td className="py-2 font-bold">2.50 mm²</td>
                          <td className="py-2">PIA 10A Curva B</td>
                          <td className="py-2 text-emerald-400">✓ Apto</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-white font-semibold">Circuito 2</td>
                          <td className="py-2 text-emerald-400">IUG</td>
                          <td className="py-2">8</td>
                          <td className="py-2 font-bold">1.50 mm²</td>
                          <td className="py-2">PIA 10A Curva B</td>
                          <td className="py-2 text-emerald-400">✓ Apto</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-white font-semibold">Circuito 3</td>
                          <td className="py-2 text-teal-400">TUG</td>
                          <td className="py-2">9</td>
                          <td className="py-2 font-bold">2.50 mm²</td>
                          <td className="py-2">PIA 16A Curva C</td>
                          <td className="py-2 text-emerald-400">✓ Apto</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* SECCIÓN 1: ¿QUÉ HACE LA APLICACIÓN? */}
      {/* ---------------------------------------------------- */}
      <section id="funcionalidades" className="py-20 bg-slate-900/50 border-t border-b border-slate-800/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-xs font-bold text-emerald-400 tracking-wider uppercase">Funcionalidades Principales</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white">
              Todo lo que necesitas para tus Proyectos Eléctricos
            </p>
            <p className="text-slate-400 text-base">
              ElectroSaaS automatiza las tareas complejas de diseño, verificación y documentación para que te enfoques en la ejecución.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Card 1 */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 transition-all hover:-translate-y-1 group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5 text-emerald-400 group-hover:scale-110 transition-transform">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Cálculo de Conductores</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Determina secciones recomendadas, capacidad de corriente ($I_z$), caídas de tensión y factores de agrupamiento según normas AEA.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-teal-500/50 transition-all hover:-translate-y-1 group">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-5 text-teal-400 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Verificación de Protecciones</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Validación estricta de la regla $I_B \le I_n \le I_z$, poder de corte, curvas de disparo e interruptores diferenciales.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 transition-all hover:-translate-y-1 group">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-5 text-cyan-400 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Carpeta Técnica en PDF</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Genera en 1-clic el informe técnico oficial con carátula, memorias descriptivas, resumen de cálculo y listado de materiales.
              </p>
            </div>

            {/* Card 4 */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 transition-all hover:-translate-y-1 group">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-5 text-indigo-400 group-hover:scale-110 transition-transform">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Diagramas & Cómputo BOM</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Visualización unifilar y cuadro de cómputo métrico consolidando protecciones, cañerías, cajas, accesorios y conductores.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* SECCIÓN 2: BENEFICIOS */}
      {/* ---------------------------------------------------- */}
      <section id="beneficios" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-xs font-bold text-emerald-400 tracking-wider uppercase">Por qué elegir nuestra solución</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white">
              Diseñado para Aumentar tu Productividad
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 flex items-start gap-5">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Ahorro de Tiempo del 80%</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Olvídate de planillas Excel propensas a errores o cálculos a mano. Genera memorias de cálculo completas en menos de 5 minutos.
                </p>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 flex items-start gap-5">
              <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Cumplimiento Normativo Garantizado</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Los algoritmos evalúan automáticamente las tablas de la AEA 90364-7-770 y regulaciones de entes como ERSeP o colegios profesionales.
                </p>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 flex items-start gap-5">
              <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Documentación Impecable y Profesional</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Exporta archivos PDF con carátula formal, índice estructurado y cuadros normativos listos para firmar y presentar ante la autoridad.
                </p>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 flex items-start gap-5">
              <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
                <Cloud className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Acceso 100% Cloud (Cloudflare Pages)</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Sin descargas ni instalaciones de software. Accede de forma segura desde cualquier navegador web con máxima velocidad global.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* SECCIÓN 3: A QUIÉNES LES SERVIRÍA (DESTINATARIOS) */}
      {/* ---------------------------------------------------- */}
      <section id="destinatarios" className="py-20 bg-slate-900/50 border-t border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-xs font-bold text-emerald-400 tracking-wider uppercase">Público Objetivo</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white">
              Diseñado para Especialistas del Sector Eléctrico
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Wrench className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Electricistas Habilitados</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ideal para instaladores registrados (Categoría I, II y III) que deben confeccionar y firmar la Carpeta Técnica Apta para habilitaciones de servicio.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Ingenieros & Proyectistas</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Herramienta ágil para agilizar el dimensionamiento de alimentadores, tableros seccionales y cómputo de materiales en proyectos residenciales.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Arquitectos & Obras</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Perfecto para estimar la potencia total instalada, grados de electrificación y presupuestos de materiales en etapas tempranas de obra.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Estudiantes & Docentes</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Excelente recurso pedagógico para estudiar la Reglamentación AEA 770 y verificar ejercicios prácticos de dimensionamiento de cables.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* SECCIÓN 4: PREGUNTAS FRECUENTES (FAQ) */}
      {/* ---------------------------------------------------- */}
      <section id="faq" className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-xs font-bold text-emerald-400 tracking-wider uppercase">Resolución de Dudas</h2>
            <p className="text-3xl font-extrabold text-white">Preguntas Frecuentes</p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: '¿Qué norma técnica utiliza la plataforma para realizar los cálculos?',
                a: 'ElectroSaaS aplica rigurosamente las tablas de capacidad de corriente, caídas de tensión, factores de simultaneidad y secciones mínimas fijadas en la Reglamentación AEA 90364-7-770 (Viviendas Unifamiliares) y normativas complementarias.',
              },
              {
                q: '¿Los informes exportados en PDF sirven para habilitaciones oficiales?',
                a: 'Sí, la estructura del informe mapea fielmente la Carpeta Técnica Modelo Apta requerida por entes reguladores como ERSeP (Ley N° 10281) y municipalidades.',
              },
              {
                q: '¿Es necesario instalar algún programa en la computadora?',
                a: 'No. ElectroSaaS es una aplicación web moderna (SPA) alojada en Cloudflare Pages, lo que significa que puedes acceder desde cualquier navegador en Windows, Mac, Linux o tablets sin instalar nada.',
              },
              {
                q: '¿Puedo personalizar los datos de la carátula antes de descargar el PDF?',
                a: 'Sí. Dentro de la vista de informe contarás con un panel de "Editar Datos de Portada" para ingresar el Propietario, Ubicación de la Obra y tus datos profesionales (Matrícula, Categoría, Teléfono).',
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 text-left font-bold text-white flex items-center justify-between gap-4 focus:outline-none"
                >
                  <span className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                    {faq.q}
                  </span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openFaq === idx ? 'rotate-180 text-emerald-400' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 pt-1 text-sm text-slate-300 border-t border-slate-800/60 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* BANNER CTA FINAL */}
      {/* ---------------------------------------------------- */}
      <section className="py-16 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border-t border-b border-emerald-500/20 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            ¿Listo para optimizar tus proyectos eléctricos?
          </h2>
          <p className="text-slate-300 text-base max-w-2xl mx-auto">
            Únete a los profesionales que ya ahorran tiempo en el dimensionamiento y confección de carpetas técnicas normativas.
          </p>
          <div className="pt-2 flex items-center justify-center gap-4">
            <button
              onClick={onRegisterClick}
              className="px-8 py-4 text-base font-bold text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:brightness-110 transition-all rounded-xl shadow-xl shadow-emerald-500/30"
            >
              Comenzar Ahora Gratis
            </button>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* FOOTER */}
      {/* ---------------------------------------------------- */}
      <footer className="bg-slate-950 py-12 border-t border-slate-900 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-slate-200">ElectroSaaS AEA 90364-7-770</span>
            <span>— Plataforma de Ingeniería Eléctrica</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a>
            <a href="#beneficios" className="hover:text-white transition-colors">Beneficios</a>
            <a href="#destinatarios" className="hover:text-white transition-colors">Público</a>
            <button onClick={onLoginClick} className="hover:text-emerald-400 transition-colors font-semibold">Acceso Clientes</button>
          </div>

          <div>
            © {new Date().getFullYear()} ElectroSaaS. Desplegado en Cloudflare Pages.
          </div>
        </div>
      </footer>
    </div>
  );
};
