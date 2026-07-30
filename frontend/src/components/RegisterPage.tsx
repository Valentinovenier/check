import React, { useState } from 'react';

interface RegisterPageProps {
  onLoginClick: () => void;
  onLandingClick?: () => void;
}

export const RegisterPage = ({ onLoginClick, onLandingClick }: RegisterPageProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden. Por favor, verifícalas.');
      return;
    }

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Error de registro');
      }

      setSuccess('Usuario registrado exitosamente. Ahora puedes iniciar sesión.');
      setUsername('');
      setPassword('');
      setConfirmPassword('');
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
        <h3 className="text-2xl font-bold text-white text-center mb-2">Registrarse</h3>
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
            <div className="mt-4">
              <label className="block text-white" htmlFor="confirmPassword">Confirmar Contraseña</label>
              <input 
                type="password" 
                placeholder="Repite tu contraseña"
                className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 bg-gray-700 text-white"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            {success && <p className="text-green-500 text-sm mt-2">{success}</p>}
            <div className="flex items-baseline justify-between">
              <button 
                type="submit" 
                className="px-6 py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-900"
              >
                Registrarse
              </button>
              <a 
                href="#" 
                className="text-sm text-blue-600 hover:underline"
                onClick={onLoginClick}
              >
                ¿Ya tienes una cuenta? Iniciar Sesión
              </a>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
