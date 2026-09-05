import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { startPayment } from '../utils/payment';

interface RegisterPageProps {
  onLoginClick: () => void;
  onLandingClick?: () => void;
}

export const RegisterPage = ({ onLoginClick, onLandingClick }: RegisterPageProps) => {
  const initialPlan: 'basic' | 'pro' = 'basic';
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'pro'>(initialPlan);
  const [planPrices, setPlanPrices] = useState({ basic: '$4.500', pro: '$9.000' });

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

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden. Por favor, verifícalas.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, planType: selectedPlan }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error de registro');
      }

      if (data.token) {
        login(data.token);
        // Redirigir directamente al checkout de suscripción de MercadoPago con el plan seleccionado
        await startPayment(selectedPlan);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 px-4 py-8">
      <div className="px-6 sm:px-8 py-8 text-left bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl max-w-md w-full">
        {onLandingClick && (
          <button
            onClick={onLandingClick}
            className="text-xs font-semibold text-emerald-400 hover:underline mb-4 inline-block"
          >
            ← Volver a la Landing Page
          </button>
        )}
        
        <h3 className="text-2xl font-bold text-white text-center mb-1">Crear tu Cuenta</h3>
        <p className="text-xs text-slate-400 text-center mb-6">
          Selecciona tu plan y regístrate para acceder a la plataforma
        </p>

        {/* Selector interactivo de Plan */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => setSelectedPlan('basic')}
            className={`p-3 rounded-xl text-left border transition-all ${
              selectedPlan === 'basic'
                ? 'bg-emerald-500/15 border-emerald-400 text-white ring-1 ring-emerald-400'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Básico</span>
              {selectedPlan === 'basic' && <span className="w-2 h-2 rounded-full bg-emerald-400"></span>}
            </div>
            <p className="text-base font-extrabold text-white">{planPrices.basic} <span className="text-[10px] font-normal text-slate-400">/mes</span></p>
            
          </button>

          <button
            type="button"
            onClick={() => setSelectedPlan('pro')}
            className={`p-3 rounded-xl text-left border transition-all ${
              selectedPlan === 'pro'
                ? 'bg-emerald-500/15 border-emerald-400 text-white ring-1 ring-emerald-400'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Pro</span>
              {selectedPlan === 'pro' && <span className="w-2 h-2 rounded-full bg-emerald-400"></span>}
            </div>
            <p className="text-base font-extrabold text-white">{planPrices.pro} <span className="text-[10px] font-normal text-slate-400">/mes</span></p>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white text-xs font-semibold mb-1" htmlFor="username">Correo Electrónico</label>
            <input 
              type="email" 
              placeholder="tu@email.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all placeholder:text-slate-500"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-white text-xs font-semibold mb-1" htmlFor="password">Contraseña</label>
            <input 
              type="password" 
              placeholder="Mínimo 8 caracteres"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all placeholder:text-slate-500"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-white text-xs font-semibold mb-1" htmlFor="confirmPassword">Confirmar Contraseña</label>
            <input 
              type="password" 
              placeholder="Repite tu contraseña"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all placeholder:text-slate-500"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-red-400 text-xs mt-2 bg-red-950/40 p-2 rounded-lg border border-red-800/40">{error}</p>}
          
          <div className="pt-2">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 text-slate-950 font-bold bg-gradient-to-r from-emerald-400 to-teal-400 rounded-xl hover:brightness-110 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/25 text-sm"
            >
              {loading ? 'Procesando...' : `Registrarse y Pagar Plan ${selectedPlan === 'pro' ? `Pro (${planPrices.pro}/mes)` : `Básico (${planPrices.basic}/mes)`}`}
            </button>
          </div>

          <div className="text-center pt-2">
            <button 
              type="button"
              className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
              onClick={onLoginClick}
            >
              ¿Ya tienes cuenta? <span className="font-semibold text-emerald-400 underline">Iniciar Sesión</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

