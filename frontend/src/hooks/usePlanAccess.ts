import { useAuth } from '../context/AuthContext';

export const usePlanAccess = () => {
  const { user } = useAuth();

  const canAccessFullFeatures = () => {
    return user?.planType === 'pro';
  };

  return { canAccessFullFeatures };
};
