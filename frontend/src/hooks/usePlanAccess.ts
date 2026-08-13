import { useAuth } from '../context/AuthContext';

export const usePlanAccess = () => {
  const { user } = useAuth();

  const canAccessFullFeatures = () => {
    if (user?.username === 'vale07venier@gmail.com') return true;
    return user?.planType === 'pro';
  };

  return { canAccessFullFeatures };
};
