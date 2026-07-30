import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { startPayment } from '../utils/payment';

export const PaywallPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    startPayment();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="p-8 bg-gray-800 rounded-lg shadow-xl text-center">
        <h2 className="text-3xl font-bold mb-4">Redirigiendo a Mercado Pago...</h2>
        <p className="mb-6 text-gray-400">Por favor, espera un momento mientras preparamos tu pago.</p>
        <button 
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-gray-700 rounded-lg hover:bg-gray-600 font-bold text-sm"
        >
          Volver a la Página de Inicio
        </button>
      </div>
    </div>
  );
};
