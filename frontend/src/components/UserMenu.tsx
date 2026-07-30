import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const UserMenu = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <div className="absolute top-4 right-4 flex gap-4">
        <button onClick={() => navigate('/login')} className="text-white hover:text-blue-400">Login</button>
        <button onClick={() => navigate('/register')} className="text-white hover:text-blue-400">Registro</button>
      </div>
    );
  }

  return (
    <div className="absolute top-4 right-4 flex items-center gap-4 text-white">
      <span>Hola, {user?.username}</span>
      <button 
        onClick={() => { logout(); navigate('/'); }} 
        className="bg-red-600 px-3 py-1 rounded hover:bg-red-700"
      >
        Cerrar Sesión
      </button>
    </div>
  );
};
