import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import App from './App';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { AppEntry } from './components/AppEntry';
import { TermsPage } from './components/TermsPage';
import { PrivacyPage } from './components/PrivacyPage';
import { useAuth } from './context/AuthContext';
import { FREE_ACCESS_MODE } from './config/accessConfig';

// Este componente sirve de guardia para proteger las rutas de la app
const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Cargando...</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  // 0. Si el modo de acceso gratuito está activo, permitir acceso directo
  if (FREE_ACCESS_MODE) return children;

  // 1. Si el usuario es administrador, permitir acceso total
  if (user?.role === 'admin') return children;

  // 2. Si la suscripción está activa, permitir acceso
  if (user?.subscriptionStatus === 'active') return children;
  
  // 3. Si el estado no es 'active', redirigir a AppEntry para verificación/pago
  return <Navigate to="/app-entry" replace />;
};

const LoginPageWrapper = () => {
    const navigate = useNavigate();
    const search = window.location.search;
    return <LoginPage onRegisterClick={() => navigate('/register' + search)} onLandingClick={() => navigate('/')} />;
};

const RegisterPageWrapper = () => {
    const navigate = useNavigate();
    const search = window.location.search;
    return <RegisterPage onLoginClick={() => navigate('/login' + search)} onLandingClick={() => navigate('/')} />;
};

const LandingPageWrapper = () => {
    const navigate = useNavigate();
    return <LandingPage onLoginClick={() => navigate('/login')} onRegisterClick={() => navigate('/register')} />;
};

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/" element={<LandingPageWrapper />} />
        <Route path="/login" element={<LoginPageWrapper />} />
        <Route path="/register" element={<RegisterPageWrapper />} />
        <Route path="/terminos" element={<TermsPage />} />
        <Route path="/privacidad" element={<PrivacyPage />} />
        
        {/* Ruta intermedia de entrada segura */}
        <Route path="/app-entry" element={<AppEntry />} />
        
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
