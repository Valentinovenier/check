import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Zap } from 'lucide-react';

export const TermsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-semibold">Volver al inicio</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40">
              <Zap className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="font-bold text-white text-sm">ElectroSaaS</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Términos y Condiciones de Servicio</h1>
            <p className="text-xs text-slate-400">Última actualización: Agosto 2026</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 text-sm text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-2">1. Aceptación de los Términos</h2>
            <p>
              Al acceder, registrarse o utilizar la plataforma ElectroSaaS (&quot;el Servicio&quot;), usted acepta quedar vinculado legalmente por los presentes Términos y Condiciones. Si no está de acuerdo con alguna parte de los términos, no podrá acceder ni utilizar el Servicio.
            </p>
          </section>

          <section className="bg-amber-950/20 border border-amber-500/30 p-4 rounded-xl">
            <h2 className="text-lg font-bold text-amber-300 mb-2">2. Alcance Técnico y Descargo de Responsabilidad Profesional</h2>
            <p className="text-amber-100/90 leading-relaxed mb-3">
              ElectroSaaS es una herramienta informática de asistencia para el cálculo, dimensionamiento preliminar y generación de documentación de instalaciones eléctricas basada en criterios normativos (AEA 90364, AEA 770, AEA 771, normas IRAM e IEC aplicables).
            </p>
            <p className="text-amber-100/90 leading-relaxed">
              <strong>IMPORTANTE:</strong> Los resultados, esquemas y memorias de cálculo generados no eximen de la revisión, verificación y validación técnica profesional. La responsabilidad legal, civil y profesional por el diseño, firma, presentación ante entes reguladores/distribuidoras y ejecución de cualquier instalación eléctrica recae de forma exclusiva e indelegable sobre el profesional matriculado e instalador habilitado interviniente en la obra.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">3. Cuentas de Usuario y Seguridad</h2>
            <p>
              Usted es responsable de mantener la confidencialidad de su cuenta y contraseña, así como de restringir el acceso a su computadora o dispositivo. Acepta asumir la responsabilidad de todas las actividades que ocurran bajo su cuenta.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">4. Suscripciones, Pagos y Facturación</h2>
            <p className="mb-2">
              El acceso a las funcionalidades completas de la plataforma está sujeto a planes de suscripción mensual o anual procesados a través de plataformas de pago autorizadas (Mercado Pago).
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li>Las suscripciones se renuevan automáticamente según el ciclo contratado a menos que se cancelen previamente.</li>
              <li>El usuario puede cancelar su suscripción en cualquier momento desde su panel o plataforma de pago.</li>
              <li>No se emitirán reembolsos proporcionales por períodos de servicio ya transcurridos salvo exigencia legal aplicable.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">5. Propiedad Intelectual de los Proyectos</h2>
            <p>
              Toda la información, datos de circuitos, esquemas unifilares y proyectos creados por el usuario pertenecen en su totalidad al usuario. ElectroSaaS no reclama ningún derecho de propiedad sobre los proyectos generados por sus clientes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">6. Modificaciones al Servicio</h2>
            <p>
              Nos reservamos el derecho de modificar, actualizar o discontinuar temporal o permanentemente cualquier función del Servicio con previo aviso razonable cuando fuere técnicamente viable.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">7. Contacto</h2>
            <p>
              Para cualquier consulta sobre estos términos de servicio, puede contactarse a través del canal oficial de soporte técnico provisto en la plataforma.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};
