// frontend/src/components/SubscribeButton.tsx
export const SubscribeButton = () => {
  const handleSubscribe = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.init_point) {
        window.location.href = data.init_point; // Redirige a Mercado Pago
    } else {
        alert('Error al iniciar la suscripción');
    }
  };

  return (
    <button onClick={handleSubscribe} className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 font-bold">
      Suscribirse por $15.000 ARS/mes
    </button>
  );
};
