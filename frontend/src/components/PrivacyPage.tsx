import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft, Zap } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
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
            <Lock className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Política de Privacidad</h1>
            <p className="text-xs text-slate-400">Última actualización: Agosto 2026</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 text-sm text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-2">1. Información que Recopilamos</h2>
            <p className="mb-2">
              Para brindar nuestros servicios, recopilamos la siguiente información:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li><strong>Datos de cuenta:</strong> Correo electrónico y contraseña cifrada.</li>
              <li><strong>Datos de proyectos y obras:</strong> Nombres de proyectos, parámetros de cálculo eléctrico, carátulas y diagramas guardados por el usuario.</li>
              <li><strong>Datos transaccionales:</strong> Identificadores de suscripción y estado de pago provistos por la pasarela de pago (no almacenamos números de tarjeta de crédito).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">2. Uso de la Información</h2>
            <p>
              Utilizamos la información recopilada exclusivamente para operar, mantener y mejorar la plataforma, procesar suscripciones, permitir la persistencia en la nube de sus cálculos y proyectos eléctricos, y brindar soporte técnico.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">3. Seguridad y Confidencialidad</h2>
            <p>
              Implementamos medidas de seguridad estándar de la industria, incluyendo cifrado SSL/TLS en tránsito y almacenamiento seguro en infraestructura de borde (Cloudflare). Las contraseñas se almacenan mediante algoritmos de hashing criptográfico seguro (bcrypt).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">4. No Divulgación a Terceros</h2>
            <p>
              No vendemos, alquilamos ni transferimos sus datos personales o la información confidencial de sus proyectos de ingeniería a terceros bajo ninguna circunstancia, salvo requerimiento legal expreso.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">5. Derechos del Usuario</h2>
            <p>
              Usted tiene derecho a acceder, rectificar o solicitar la eliminación total de su cuenta y de todos los proyectos asociados en cualquier momento contactando a nuestro soporte.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};
