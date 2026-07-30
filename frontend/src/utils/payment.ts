export const startPayment = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
      },
    });
    const data = await response.json();
    if (data.init_point) {
      window.location.href = data.init_point;
    } else if (data.error) {
      console.error('Error en API de suscripción:', data.error, data.details);
      alert('Hubo un error al iniciar el pago. Intenta de nuevo más tarde.');
    }
  } catch (e) {
    console.error('Error al iniciar pago:', e);
    alert('Error de conexión al iniciar el pago.');
  }
};
