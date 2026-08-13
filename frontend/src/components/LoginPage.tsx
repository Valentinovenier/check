import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { startPayment } from '../utils/payment';

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

      // Verificación directa en el cliente tras recibir el token
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
    } catch (err: any) {
      setError(err.message);
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
        <h3 className="text-2xl font-bold text-white text-center mb-2">Iniciar Sesión</h3>
        <form onSubmit={handleSubmit}>
          <div className="mt-4">
            <div>
              <label className="block text-white" htmlFor="username">Nombre de Usuario</label>
              <input 
                type="text" 
                placeholder="Nombre de Usuario"
                className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 bg-gray-700 text-white"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="mt-4">
              <label className="block text-white" htmlFor="password">Contraseña</label>
              <input 
                type="password" 
                placeholder="Contraseña"
                className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 bg-gray-700 text-white"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <div className="flex items-baseline justify-between">
              <button 
                type="submit" 
                className="px-6 py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-900"
              >
                Iniciar Sesión
              </button>
              <a 
                href="#" 
                className="text-sm text-blue-600 hover:underline"
                onClick={onRegisterClick}
              >
                Registrarse
              </a>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
