import * as Network from 'expo-network';
import { Alert } from 'react-native';
import { syncUser, listDocuments } from '@src/utils/actions';
import { useEffect, useState } from 'react';

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
        // Sincronizar datos cuando la conexión se restaura
        await syncUser();
        await listDocuments({});
      }
    };

    checkNetwork();

    const interval = setInterval(checkNetwork, 10000); // Verifica cada 10 segundos

    return () => clearInterval(interval);
  }, [isConnected]);

  return isConnected;
};

export default useNetInfo;