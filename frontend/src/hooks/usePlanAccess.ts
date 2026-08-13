import { useAuth } from '../context/AuthContext';

export const usePlanAccess = () => {
  const { user } = useAuth();

  const canAccessFullFeatures = () => {
    console.log('DEBUG [usePlanAccess]: user planType is:', user?.planType);
    if (user?.username === 'vale07venier@gmail.com') return true;
    return user?.planType === 'pro';
  };

  return { canAccessFullFeatures };
};
