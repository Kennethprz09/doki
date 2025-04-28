import React from 'react';
import { View, Text } from 'react-native';

interface ToastProps {
  text1: string;
  text2?: string;
}

const toastConfig = {
  error: ({ text1, text2 }: ToastProps) => (
    <View
      style={{
        height: 60,
        width: '100%',
        backgroundColor: '#E53935',
        paddingHorizontal: 30,
        borderRadius: 8,
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      }}
    >
      <Text style={{ color: 'white', fontFamily: 'Karla-Bold' }}>{text1}</Text>
      {text2 && (
        <Text style={{ color: 'white', fontSize: 12, fontFamily: 'Karla-Regular' }}>
          {text2}
        </Text>
      )}
    </View>
  ),
};

export default toastConfig;