import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const AppEntry = () => {
    const { isAuthenticated, loading, updateUserSubscription } = useAuth();
    const navigate = useNavigate();
    const [retryCount, setRetryCount] = useState(0);
    const [statusMessage, setStatusMessage] = useState('Verificando tu suscripción...');
    const [isFailed, setIsFailed] = useState(false);

    const checkStatus = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const res = await fetch('/api/check-subscription' + window.location.search, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                const text = await res.text();
                console.error("Respuesta no OK de check-subscription:", text);
            }

            const data = await res.json();
            console.log("Respuesta check-subscription:", data);

            if (data.status === 'active') {
                setStatusMessage('¡Suscripción confirmada! Redirigiendo a la plataforma...');
                updateUserSubscription('active', data.token, data.plan_type);
                setTimeout(() => navigate('/app'), 800);
            } else if (retryCount < 4) {
                setStatusMessage(`Procesando confirmación con Mercado Pago (intento ${retryCount + 1} de 4)...`);
                const timer = setTimeout(() => {
                    setRetryCount(prev => prev + 1);
                }, 2500);
                return () => clearTimeout(timer);
            } else {
                setIsFailed(true);
                setStatusMessage('Aún no hemos recibido la confirmación automática del pago.');
            }
        } catch (err) {
            console.error("Error en check-subscription:", err);
            if (retryCount < 3) {
                const timer = setTimeout(() => setRetryCount(prev => prev + 1), 2500);
                return () => clearTimeout(timer);
            } else {
                setIsFailed(true);
                setStatusMessage('Ocurrió un error al verificar tu pago.');
            }
        }
    };

    useEffect(() => {
        if (loading) return;
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        checkStatus();
    }, [isAuthenticated, loading, retryCount]);

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white px-4">
            {!isFailed ? (
                <>
                    <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4" />
                    <h2 className="text-xl font-bold mb-2 text-center">Verificando tu acceso</h2>
                    <p className="text-sm text-slate-400 text-center max-w-sm">
                        {statusMessage}
                    </p>
                </>
            ) : (
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full text-center shadow-xl">
                    <h2 className="text-xl font-bold mb-3 text-white">Validación en Proceso</h2>
                    <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                        {statusMessage} Si ya realizaste el pago en Mercado Pago, la activación puede tardar unos segundos adicionales en sincronizarse.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={() => { setIsFailed(false); setRetryCount(0); }}
                            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 font-bold text-slate-950 text-sm rounded-xl transition-all"
                        >
                            Reintentar Verificación
                        </button>
                        <button
                            onClick={() => navigate('/#precio')}
                            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 font-semibold text-slate-300 text-sm rounded-xl transition-all border border-slate-700"
                        >
                            Volver a Planes
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};


