import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import App from './App';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { AppEntry } from './components/AppEntry'; // Importamos el nuevo componente
import { useAuth } from './context/AuthContext';

// Este componente servirá de guardia para proteger las rutas de la app
const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, user, loading } = useAuth();
  
  if (loading) return <div>Cargando...</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  if (user?.subscriptionStatus !== 'active') {
    return <Navigate to="/#precio" replace />;
  }
  
  return children;
};

// Ya no necesitamos AuthRedirect aquí, la lógica pasa al flujo de login/entry
const LoginPageWrapper = () => {
    const navigate = useNavigate();
    return <LoginPage onRegisterClick={() => navigate('/register')} onLandingClick={() => navigate('/')} />;
};

const RegisterPageWrapper = () => {
    const navigate = useNavigate();
    return <RegisterPage onLoginClick={() => navigate('/login')} onLandingClick={() => navigate('/')} />;
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
