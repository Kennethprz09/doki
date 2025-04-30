import React, { useRef, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView } from 'expo-camera';

interface CameraModalProps {
    visible: boolean;
    onClose: () => void;
    onTakePicture: (photoUri: string) => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ visible, onClose, onTakePicture }) => {
    const cameraRef = useRef<any>(null);
    const [captured, setCaptured] = useState(false);

    const takePicture = async () => {
        if (!cameraRef.current) return;

        try {
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.8,
                base64: true,
            });
            setCaptured(true);
            setTimeout(() => setCaptured(false), 2000);
            onTakePicture(photo.uri);
        } catch (error) {
            console.error('Error al tomar la foto:', error);
            Alert.alert('Error', 'No se pudo tomar la foto.');
        }
    };

    return (
        <Modal visible={visible} transparent={false}>
            <CameraView style={styles.camera} autoFocus={true} type="back" ref={cameraRef}>
                <View style={styles.overlay} />
                <View style={styles.cameraControlsHeader}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Ionicons name="close" size={30} color="#FFF" />
                    </TouchableOpacity>
                </View>
                {captured && <Text style={styles.feedback}>¡Imagen capturada correctamente!</Text>}
            </CameraView>

            <View style={styles.cameraControls}>
                <TouchableOpacity style={styles.cameraButton} onPress={takePicture}>
                    <Ionicons name="camera" size={40} color="#FFF" />
                </TouchableOpacity>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    camera: {
        flex: 1,
    },
    overlay: {
        position: 'absolute',
        top: '20%',
        left: '10%',
        width: '80%',
        height: '60%',
        borderWidth: 2,
        borderColor: 'white',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    cameraControlsHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    cameraControls: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    cameraButton: {
        backgroundColor: '#ff8c00',
        borderRadius: 50,
        padding: 15,
    },
    closeButton: {
        backgroundColor: '#333',
        borderRadius: 50,
        padding: 15,
    },
    feedback: {
        position: 'absolute',
        bottom: 50,
        color: 'white',
        fontSize: 18,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: 10,
        alignSelf: 'center',
    },
});

export default CameraModal;