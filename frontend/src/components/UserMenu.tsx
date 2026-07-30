import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, LogIn, UserPlus } from 'lucide-react';

export const UserMenu = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="absolute top-4 right-4 flex gap-3 z-50">
        <button 
          onClick={() => navigate('/login')} 
          className="flex items-center gap-2 text-white bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition-colors text-sm"
        >
          <LogIn className="w-4 h-4" /> Iniciar sesión
        </button>
        <button 
          onClick={() => navigate('/register')} 
          className="flex items-center gap-2 text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg transition-colors text-sm"
        >
          <UserPlus className="w-4 h-4" /> Registrarse
        </button>
      </div>
    );
  }

  return (
    <div className="absolute top-4 right-4 z-50" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-white bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition-colors text-sm border border-slate-700"
      >
        <User className="w-4 h-4" />
        <span>{user?.username}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-1">
          <button 
            onClick={() => { logout(); setIsOpen(false); navigate('/'); }} 
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
};
