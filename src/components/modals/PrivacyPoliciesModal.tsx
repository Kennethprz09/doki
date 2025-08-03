"use client"

import React from "react"
import { View, Text, StyleSheet, ScrollView } from "react-native"
import LoadingButton from "../common/LoadingButton"
import type { ModalProps } from "../types"
import BaseModal from "../common/BaseModal"

interface PrivacyPoliciesModalProps extends ModalProps {}

// Optimización 1: Modal de políticas mejorado con mejor contenido y UX
const PrivacyPoliciesModal: React.FC<PrivacyPoliciesModalProps> = ({ visible, onClose }) => {
  return (
    <BaseModal visible={visible} onClose={onClose}>
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>Políticas de Privacidad</Text>

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Información que recopilamos</Text>
            <Text style={styles.sectionContent}>
              Recopilamos información personal como tu nombre, correo electrónico y los documentos que subes a nuestra
              plataforma únicamente para proporcionar nuestros servicios.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Uso de la información</Text>
            <Text style={styles.sectionContent}>
              Utilizamos tu información para gestionar tu cuenta, procesar tus documentos y mejorar nuestros servicios.
              No vendemos ni compartimos tu información personal con terceros.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Seguridad</Text>
            <Text style={styles.sectionContent}>
              Implementamos medidas de seguridad técnicas y organizativas para proteger tu información personal contra
              acceso no autorizado, alteración o destrucción.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Tus derechos</Text>
            <Text style={styles.sectionContent}>
              Tienes derecho a acceder, rectificar o eliminar tu información personal. Puedes contactarnos en cualquier
              momento para ejercer estos derechos.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Contacto</Text>
            <Text style={styles.sectionContent}>
              Si tienes preguntas sobre estas políticas de privacidad, puedes contactarnos a través de nuestra
              aplicación o sitio web.
            </Text>
          </View>
        </ScrollView>

        <LoadingButton title="Entendido" onPress={onClose} style={styles.closeButton} />
      </View>
    </BaseModal>
  )
}

const styles = StyleSheet.create({
  modalContainer: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Karla-Bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  scrollContainer: {
    maxHeight: 400,
    marginBottom: 20,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Karla-Bold",
    color: "#333",
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 14,
    fontFamily: "Karla-Regular",
    color: "#666",
    lineHeight: 20,
  },
  closeButton: {
    marginTop: 10,
  },
})

export default PrivacyPoliciesModal
