import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const AppEntry = () => {
    const { isAuthenticated, loading, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (loading) return;

        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        // Llamada explícita para verificar el estado de suscripción real en el backend
        // Esto ignora el JWT y consulta la BD (incluyendo el bypass)
        fetch('/api/check-subscription', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'active') {
                navigate('/app');
            } else {
                navigate('/#precio');
            }
        })
        .catch(() => {
            navigate('/#precio');
        });
    }, [isAuthenticated, loading, navigate]);

    return <div>Verificando acceso...</div>;
};
