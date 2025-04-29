import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TouchableWithoutFeedback } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useUserStore } from '../store/userStore';
import { useDocumentsStore } from '../store/documentsStore';
import { RootStackParamList } from './types';

interface ProfileModalProps {
  isVisible: boolean;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isVisible, onClose }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const setDocuments = useDocumentsStore((state) => state.setDocuments);
  const setDocumentsFavorite = useDocumentsStore((state) => state.setDocumentsFavorite);

  const [showVisible, setShowVisible] = useState(false);

  useEffect(() => {
    setShowVisible(isVisible || false);
  }, [isVisible]);

  const logout = async () => {
    setDocuments([]);
    setDocumentsFavorite([]);
    setUser(null);

    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('user');

    setShowVisible(false);
    navigation.navigate('Login');
  };

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={showVisible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {user?.name?.[0] ?? 'U'}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>
                    {user?.name && user?.surname ? `${user.name} ${user.surname}` : 'Usuario'}
                  </Text>
                  <Text style={styles.userEmail}>
                    {user?.email ?? 'No email'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.modalOption} onPress={() => navigation.navigate('MyAccountPage')}>
                <Text style={styles.modalOptionText}>Mi cuenta</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalOption} onPress={logout}>
                <Text style={styles.modalOptionText}>Cerrar sesión</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: 300,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ff8c00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  userInfo: {
    flex: 1,
    paddingHorizontal: 15,
  },
  userName: {
    fontSize: 18,
    fontFamily: 'Karla-Bold',
  },
  userEmail: {
    fontSize: 14,
    fontFamily: 'Karla-Regular',
    color: '#555',
  },
  modalOption: {
    paddingVertical: 10,
    width: '100%',
  },
  modalOptionText: {
    fontSize: 16,
    fontFamily: 'Karla-Bold',
    color: '#000',
  },
});
export default ProfileModal;