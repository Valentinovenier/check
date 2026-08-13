import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { startPayment } from '../utils/payment';

interface RegisterPageProps {
  onLoginClick: () => void;
  onLandingClick?: () => void;
}

export const RegisterPage = ({ onLoginClick, onLandingClick }: RegisterPageProps) => {
  const [searchParams] = useSearchParams();
  const planParam = searchParams.get('plan');
  const selectedPlan: 'basic' | 'pro' = planParam === 'basic' ? 'basic' : 'pro';

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
        // Redirigir directamente al checkout de suscripción de MercadoPago con el plan seleccionado por el usuario
        await startPayment(selectedPlan);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="px-8 py-6 mt-4 text-left bg-gray-800 shadow-lg rounded-lg max-w-md w-full">
        {onLandingClick && (
          <button
            onClick={onLandingClick}
            className="text-xs font-semibold text-emerald-400 hover:underline mb-4 inline-block"
          >
            ← Volver a la Landing Page
          </button>
        )}
        <h3 className="text-2xl font-bold text-white text-center mb-2">Crear tu Cuenta</h3>
        <p className="text-xs text-slate-400 text-center mb-6">
          Regístrate para continuar con la suscripción al {selectedPlan === 'pro' ? 'Plan Acceso Total (Pro)' : 'Plan Calculadora (Básico)'}
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="mt-4">
            <div>
              <label className="block text-white text-sm" htmlFor="username">Email / Nombre de Usuario</label>
              <input 
                type="text" 
                placeholder="tu@email.com"
                className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-gray-700 text-white"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="mt-4">
              <label className="block text-white text-sm" htmlFor="password">Contraseña</label>
              <input 
                type="password" 
                placeholder="Contraseña"
                className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-gray-700 text-white"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="mt-4">
              <label className="block text-white text-sm" htmlFor="confirmPassword">Confirmar Contraseña</label>
              <input 
                type="password" 
                placeholder="Repite tu contraseña"
                className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-gray-700 text-white"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            
            <div className="flex items-center justify-between mt-6">
              <button 
                type="submit" 
                disabled={loading}
                className="px-6 py-2 text-slate-950 font-bold bg-emerald-400 rounded-lg hover:bg-emerald-300 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Procesando...' : `Registrarse y Pagar Plan ${selectedPlan === 'pro' ? 'Pro' : 'Básico'}`}
              </button>
              <button 
                type="button"
                className="text-sm text-emerald-400 hover:underline"
                onClick={onLoginClick}
              >
                ¿Ya tienes cuenta? Iniciar Sesión
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

