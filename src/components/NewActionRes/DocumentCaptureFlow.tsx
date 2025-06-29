import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import CameraModal from './CameraModal';
import PreviewModal from './PreviewModal';
import SimpleCropper from './SimpleCropper';
import * as ImageManipulator from 'expo-image-manipulator';

const DocumentCaptureFlow: React.FC<{
  visible: boolean;
  onClose: () => void;
  onSave: (frontUri: string, backUri?: string) => void;
}> = ({ visible, onClose, onSave }) => {
  const [step, setStep] = useState<'camera' | 'preview' | 'crop' | 'rotate'>('camera');
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [isFront, setIsFront] = useState(true);

  const handleCapture = (uri: string) => {
    setCurrentImage(uri);
    setStep('preview');
  };

  const handleRetake = () => {
    setStep('camera');
  };

  const handleCrop = () => {
    setStep('crop');
  };

  const handleRotate = async (degrees: number) => {
    if (!currentImage) return;
    
    const result = await ImageManipulator.manipulateAsync(
      currentImage,
      [{ rotate: degrees }],
      { format: ImageManipulator.SaveFormat.JPEG }
    );
    
    setCurrentImage(result.uri);
    
    if (isFront) {
      setFrontImage(result.uri);
    } else {
      setBackImage(result.uri);
    }
  };

  const handleCropComplete = (uri: string) => {
    setCurrentImage(uri);
    
    if (isFront) {
      setFrontImage(uri);
    } else {
      setBackImage(uri);
    }
    
    setStep('preview');
  };

  const handleAccept = () => {
    if (isFront && !backImage) {
      setIsFront(false);
      setStep('camera');
    } else {
      if (frontImage) {
        onSave(frontImage, backImage || undefined);
        onClose();
      }
    }
  };

  return (
    <Modal visible={visible} transparent={false} animationType="slide">
      {step === 'camera' && (
        <CameraModal
          onCapture={handleCapture}
          onClose={onClose}
          documentType={isFront ? "frontal" : "trasero"}
        />
      )}
      
      {step === 'preview' && currentImage && (
        <PreviewModal
          imageUri={currentImage}
          onRetake={handleRetake}
          onCrop={handleCrop}
          onRotate={handleRotate}
          onAccept={handleAccept}
          isFront={isFront}
          hasBackImage={!!backImage}
        />
      )}
      
      {step === 'crop' && currentImage && (
        <SimpleCropper
          imageUri={currentImage}
          onCrop={handleCropComplete}
          onCancel={() => setStep('preview')}
        />
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  // Estilos según sea necesario
});

export default DocumentCaptureFlow;