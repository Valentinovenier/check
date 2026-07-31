import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const AppEntry = () => {
    const { isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        if (loading) return;

        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        fetch('/api/check-subscription', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(res => res.json())
        .then(data => {
            console.log("Respuesta check-subscription:", data);
            if (data.status === 'active') {
                navigate('/app');
            } else if (retryCount < 3) {
                // Reintentar cada 2.5 segundos hasta 3 veces para darle tiempo al webhook de MercadoPago
                const timer = setTimeout(() => {
                    setRetryCount(prev => prev + 1);
                }, 2500);
                return () => clearTimeout(timer);
            } else {
                console.log("Suscripción no activa tras reintentos, redirigiendo a landing");
                navigate('/#precio');
            }
        })
        .catch(err => {
            console.error("Error en check-subscription:", err);
            navigate('/#precio');
        });
    }, [isAuthenticated, loading, navigate, retryCount]);

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white px-4">
            <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4" />
            <h2 className="text-xl font-bold mb-2">Verificando tu acceso...</h2>
            <p className="text-sm text-slate-400 text-center max-w-sm">
                Estamos procesando la validación de tu cuenta y suscripción con MercadoPago.
            </p>
        </div>
    );
};

