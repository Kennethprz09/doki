import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGlobalStore } from '../../store/globalStore';
import { useDocumentsStore } from '../../store/documentsStore';
import { checkInternetConnection } from '../../utils/actions';
import { supabase } from '../../supabase/supabaseClient';
import { Document } from '../types';

interface ActionColorPickerProps {
  field: {
    visible?: boolean;
    item?: Document;
  };
  onClose: () => void;
}

const ActionColorPicker: React.FC<ActionColorPickerProps> = ({ field, onClose }) => {
  const setLoading = useGlobalStore((state) => state.setLoading);
  const updateDocument = useDocumentsStore((state) => state.updateDocument);

  const colors = [
    '#FF5722', '#9C27B0', '#2196F3', '#4CAF50', '#795548',
    '#FF9800', '#E91E63', '#00BCD4', '#8BC34A', '#9E9E9E',
    '#FFEB3B', '#FFC1E3', '#80DEEA', '#CDDC39', '#BDBDBD',
    '#FFE082', '#FFAB91', '#B3E5FC', '#A5D6A7', '#888888',
  ];

  const [showVisible, setShowVisible] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  useEffect(() => {
    setShowVisible(field.visible || false);
  }, [field]);

  const handleClose = () => {
    setShowVisible(false);
    setSelectedColor(null);
    onClose();
  };

  const handleColorSelection = async (color: string) => {
    setShowVisible(false);

    const isOffline = await checkInternetConnection();
    if (isOffline) {
      return;
    }

    if (!field.item?.id) {
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('documents')
        .update({ color })
        .eq('id', field.item.id)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) {
        throw error;
      }

      updateDocument({ id: field.item.id, changes: { color } });
      handleClose();
    } catch (error) {
      console.error('Error al procesar el color seleccionado:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmColor = () => {
    if (selectedColor) {
      handleColorSelection(selectedColor);
    }
  };

  return (
    <Modal visible={showVisible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlayContainer}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.overlayBackground} />
        </TouchableWithoutFeedback>
        <View style={styles.modal}>
          <Text style={styles.title}>Seleccionar un color</Text>
          <View style={styles.grid}>
            {colors.map((color) => (
              <TouchableOpacity
                key={color}
                style={[styles.colorCircle, { backgroundColor: color }]}
                onPress={() => setSelectedColor(color)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {selectedColor === color && (
                  <Ionicons name="checkmark-outline" size={24} color="white" />
                )}
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.confirmButton, !selectedColor && styles.disabledButton]}
            onPress={handleConfirmColor}
            disabled={!selectedColor}
          >
            <Text style={styles.buttonText}>Continuar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fondo semitransparente
  },
  overlayBackground: {
    ...StyleSheet.absoluteFillObject, // Ocupa todo el espacio del contenedor padre
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Karla-Bold',
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  colorCircle: {
    width: '18%',
    height: 50,
    borderRadius: 25,
    marginBottom: 10,
    marginHorizontal: '1%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButton: {
    marginTop: 20,
    padding: 15,
    borderRadius: 5,
    width: '80%',
    alignItems: 'center',
    backgroundColor: '#ff8c00',
  },
  buttonText: {
    color: 'white',
    fontFamily: 'Karla-Bold',
  },
  disabledButton: {
    backgroundColor: '#ff8c00',
    opacity: 0.5,
  },
});

export default ActionColorPicker;