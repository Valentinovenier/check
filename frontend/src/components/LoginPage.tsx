import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { startPayment } from '../utils/payment';
import { FREE_ACCESS_MODE } from '../config/accessConfig';

interface LoginPageProps {
  onRegisterClick: () => void;
  onLandingClick?: () => void;
}

export const LoginPage = ({ onRegisterClick, onLandingClick }: LoginPageProps) => {
  const [searchParams] = useSearchParams();
  const planParam = searchParams.get('plan');
  const selectedPlan: 'basic' | 'pro' | null = (planParam === 'basic' || planParam === 'pro') ? planParam : null;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Error de inicio de sesión');
      }

      const data = await response.json();
      const token = data.token;
      login(token);

      if (FREE_ACCESS_MODE) {
        // Modo gratuito: ir directo a la app sin verificar suscripción
        navigate('/app');
      } else {
        // Modo de pago: verificar estado de suscripción
        const subResponse = await fetch('/api/check-subscription', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const subData = await subResponse.json();
        
        if (subData.status === 'active') {
          navigate('/app');
        } else if (selectedPlan) {
          await startPayment(selectedPlan);
        } else {
          navigate('/#precio');
        }
      }
    } catch (err: any) {
      setError(err.message);
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
            ← Volver
          </button>
        )}
        <h3 className="text-2xl font-bold text-white text-center mb-1">Iniciar Sesión</h3>
        {FREE_ACCESS_MODE ? (
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="inline-flex items-center gap-1.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Acceso Gratuito Habilitado
            </span>
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center mb-6">Ingresá con tu cuenta para continuar</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white text-xs font-semibold mb-1" htmlFor="login-username">Correo Electrónico</label>
            <input 
              type="email" 
              placeholder="tu@email.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all placeholder:text-slate-500"
              id="login-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-white text-xs font-semibold mb-1" htmlFor="login-password">Contraseña</label>
            <input 
              type="password" 
              placeholder="Tu contraseña"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all placeholder:text-slate-500"
              id="login-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-400 text-xs mt-2 bg-red-950/40 p-2 rounded-lg border border-red-800/40">{error}</p>}
          <div className="pt-2">
            <button 
              type="submit" 
              className="w-full py-3 text-slate-950 font-bold bg-gradient-to-r from-emerald-400 to-teal-400 rounded-xl hover:brightness-110 transition-all shadow-lg shadow-emerald-500/25 text-sm"
            >
              Iniciar Sesión
            </button>
          </div>
          <div className="text-center pt-2">
            <button 
              type="button"
              className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
              onClick={onRegisterClick}
            >
              ¿No tenés cuenta? <span className="font-semibold text-emerald-400 underline">Registrarse Gratis</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
