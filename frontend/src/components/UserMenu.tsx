import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, LogIn, UserPlus, Zap } from 'lucide-react';

export const UserMenu = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleVerPlanes = () => {
    if (window.location.pathname === '/') {
      const el = document.getElementById('precio');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    navigate('/#precio');
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate('/login')} 
          className="flex items-center gap-2 text-slate-300 hover:text-white px-3.5 py-2 rounded-lg transition-colors text-sm font-semibold"
        >
          <LogIn className="w-4 h-4" /> Iniciar sesión
        </button>
        <button 
          onClick={handleVerPlanes} 
          className="flex items-center gap-2 text-slate-950 font-bold bg-gradient-to-r from-emerald-400 to-teal-400 hover:brightness-110 px-4 py-2 rounded-lg transition-all text-sm shadow-md shadow-emerald-500/20"
        >
          <Zap className="w-4 h-4" /> Ver Planes
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-white bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition-colors text-sm border border-slate-700"
      >
        <User className="w-4 h-4 text-emerald-400" />
        <span className="max-w-[150px] truncate">{user?.username}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-xl py-2 z-50">
          <div className="px-4 py-2 border-b border-slate-800">
            <p className="text-xs text-slate-400">Sesión iniciada como</p>
            <p className="text-sm font-semibold text-white truncate">{user?.username}</p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                {user?.role === 'admin' ? 'Administrador' : user?.planType === 'pro' ? 'Plan Pro' : 'Plan Básico'}
              </span>
            </div>
          </div>

          <button 
            onClick={() => { setIsOpen(false); navigate('/app'); }} 
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <Zap className="w-4 h-4 text-emerald-400" /> Ir a la Aplicación
          </button>
          
          <button 
            onClick={() => { logout(); setIsOpen(false); navigate('/'); }} 
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors border-t border-slate-800 mt-1"
          >
            <LogOut className="w-4 h-4" /> Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
};

