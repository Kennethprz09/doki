import * as Network from 'expo-network';
import { Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { syncUser } from '../utils/actions';

const useNetInfo = (): boolean => {
  const [isConnected, setIsConnected] = useState<boolean>(true);

  useEffect(() => {
    const checkNetwork = async () => {
      const networkState = await Network.getNetworkStateAsync();
      const wasConnected = isConnected;
      setIsConnected(networkState.isConnected ?? true);

      if (!networkState.isConnected && isConnected) {
        Alert.alert('Sin conexión', 'No tienes conexión a Internet. Mostrando datos offline.');
      } else if (networkState.isConnected && !wasConnected) {
        // Sincronizar datos del usuario cuando la conexión se restaura
        await syncUser();
      }
    };

    checkNetwork();

    const interval = setInterval(checkNetwork, 10000); // Verifica cada 10 segundos

    return () => clearInterval(interval);
  }, [isConnected]);

  return isConnected;
};

export default useNetInfo;