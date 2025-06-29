import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface NewButtonProps {
  onPress: () => void;
}

const NewButton: React.FC<NewButtonProps> = ({ onPress }) => (
  <TouchableOpacity style={styles.newButton} onPress={onPress}>
    <Text style={styles.plusSign}>+</Text>
    <Text style={styles.newText}>Nuevo</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  newButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff8c00',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  plusSign: {
    fontSize: 24,
    fontFamily: 'Karla-Bold',
    color: '#fff',
    marginRight: 10,
  },
  newText: {
    fontSize: 16,
    fontFamily: 'Karla-Bold',
    color: '#fff',
  },
});

export default NewButton;