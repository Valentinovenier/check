export const startPayment = async (planType: 'basic' | 'pro') => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Tu sesión ha expirado o no has iniciado sesión. Por favor, inicia sesión nuevamente.');
      window.location.href = '/login';
      return;
    }

    const response = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ planType })
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      alert('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
      window.location.href = '/login';
      return;
    }

    if (!response.ok) {
      const text = await response.text();
      console.error('Error en API de suscripción:', text);
      alert('Hubo un error al iniciar el pago. Intenta de nuevo más tarde.');
      return;
    }

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
