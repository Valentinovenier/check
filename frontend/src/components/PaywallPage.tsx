import React from 'react';

export const PaywallPage = () => {
  const handlePay = async () => {
    // Aquí llamarás al endpoint de backend para obtener la URL de pago
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/create-payment-preference', {
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' 
        },
      });
      const data = await response.json();
      if (data.init_point) {
        window.location.href = data.init_point;
      }
    } catch (e) {
      console.error('Error al iniciar pago:', e);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="p-8 bg-gray-800 rounded-lg shadow-xl text-center">
        <h2 className="text-3xl font-bold mb-4">Acceso Restringido</h2>
        <p className="mb-6 text-gray-400">Debes tener una suscripción activa para usar esta aplicación.</p>
        <button 
          onClick={handlePay}
          className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 font-bold"
        >
          Pagar Suscripción con Mercado Pago
        </button>
      </div>
    </div>
  );
};
