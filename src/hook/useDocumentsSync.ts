// src/hook/useDocumentsSync.ts
import { useSupabaseSubscription } from '../contexts/SupabaseSubscriptionContext';

const useDocumentsSync = () => {
  const { isSubscribed } = useSupabaseSubscription();
  
  // Este hook ahora solo expone el estado de suscripción si es necesario
  return { isSubscribed };
};

export default useDocumentsSync;