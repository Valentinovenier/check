import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  user: { id: string; username: string; subscriptionStatus: string; planType: string } | null;
  login: (token: string) => void;
  logout: () => void;
  updateUserSubscription: (newStatus: string, newToken?: string) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const decodeToken = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    return {
      userId: payload.userId,
      username: payload.username,
      subscription_status: payload.subscription_status,
      plan_type: payload.plan_type || 'basic'
    };
  } catch (e) {
    console.error("Error decodificando token:", e);
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<{ id: string; username: string; subscriptionStatus: string; planType: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = decodeToken(token);
      if (decoded && decoded.userId) {
        setIsAuthenticated(true);
        setUser({ id: decoded.userId, username: decoded.username, subscriptionStatus: decoded.subscription_status, planType: decoded.plan_type });

        // Si el estado en el token no es 'active', verificar en segundo plano contra el backend D1 por si el Webhook ya lo activó
        if (decoded.subscription_status !== 'active' && decoded.username !== 'vale07venier@gmail.com') {
          fetch('/api/check-subscription', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data && data.status === 'active') {
              if (data.token) {
                localStorage.setItem('token', data.token);
              }
              setUser({ id: decoded.userId, username: decoded.username, subscriptionStatus: 'active', planType: data.plan_type || 'pro' });
            }
          })
          .catch(err => console.error("Error validando suscripción inicial en AuthContext:", err));
        }
      } else {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = (token: string) => {
    localStorage.setItem('token', token);
    const decoded = decodeToken(token);
    if (decoded && decoded.userId) {
      setIsAuthenticated(true);
      setUser({ id: decoded.userId, username: decoded.username, subscriptionStatus: decoded.subscription_status, planType: decoded.plan_type });
    }
  };

  const updateUserSubscription = (newStatus: string, newToken?: string, newPlanType?: string) => {
    if (newToken) {
      localStorage.setItem('token', newToken);
    }
    setUser(prev => prev ? { ...prev, subscriptionStatus: newStatus, planType: newPlanType || prev.planType } : null);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, updateUserSubscription, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
