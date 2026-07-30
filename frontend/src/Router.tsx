import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import App from './App';
import { UserMenu } from './components/UserMenu';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { PaywallPage } from './components/PaywallPage';
import { useAuth } from './context/AuthContext';

// Este componente servirá de guardia para proteger las rutas de la app
const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, user, loading } = useAuth();
  
  if (loading) return <div>Cargando...</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  // Verificamos si la suscripción está activa. 
  // Nota: Si el usuario recién se registra y no tiene suscripción aún,
  // el estado podría ser null, undefined o 'inactive'.
  if (user?.subscriptionStatus !== 'active') {
    return <Navigate to="/paywall" />;
  }
  
  return children;
};

const AuthRedirect = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/app');
        }
    }, [isAuthenticated, navigate]);

    return null;
};

const LoginPageWrapper = () => {
    const navigate = useNavigate();
    return (
        <>
            <AuthRedirect />
            <LoginPage onRegisterClick={() => navigate('/register')} onLandingClick={() => navigate('/')} />
        </>
    );
};

const RegisterPageWrapper = () => {
    const navigate = useNavigate();
    return (
        <>
            <AuthRedirect />
            <RegisterPage onLoginClick={() => navigate('/login')} onLandingClick={() => navigate('/')} />
        </>
    );
};

const LandingPageWrapper = () => {
    const navigate = useNavigate();
    return (
        <>
            <UserMenu />
            <LandingPage onLoginClick={() => navigate('/login')} onRegisterClick={() => navigate('/register')} />
        </>
    );
};

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/" element={<LandingPageWrapper />} />
        <Route path="/login" element={<LoginPageWrapper />} />
        <Route path="/register" element={<RegisterPageWrapper />} />
        <Route path="/paywall" element={<PaywallPage />} />
        
        {/* Rutas Privadas (La App) */}
        <Route path="/app/*" element={
          <PrivateRoute>
            <App />
          </PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
};
