"use client";

import React from "react";
import { View, Text, StyleSheet, ScrollView, Linking } from "react-native";
import LoadingButton from "../common/LoadingButton";
import type { ModalProps } from "../types";
import BaseModal from "../common/BaseModal";

interface PrivacyPoliciesModalProps extends ModalProps {}

// Optimización 1: Modal de políticas mejorado con mejor contenido y UX
const PrivacyPoliciesModal: React.FC<PrivacyPoliciesModalProps> = ({
  visible,
  onClose,
}) => {
  return (
    <BaseModal visible={visible} onClose={onClose}>
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>Políticas de Privacidad</Text>

        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Última actualización: 10/02/2026
            </Text>
            <Text style={styles.sectionContent}>
              ANDRES FELIPE SAAVEDRA TRUJILLO
            </Text>

            <Text style={styles.sectionContent}>C.C.: 1130610004</Text>
            <Text style={styles.sectionContent}>NIT: 1130610004 - 1</Text>

            <Text style={styles.sectionContent}>
              Matrícula Mercantil: 1196423-1 Domicilio: Cali, Valle del Cauca,
              Colombia Correo de contacto: soporte@appdoki.com La presente
              Política de Privacidad describe cómo recopilamos, usamos y
              protegemos la información de los usuarios, en cumplimiento de la
              Ley 1581 de 2012 y el Decreto 1377 de 2013.
            </Text>

            <Text style={styles.sectionContent}>
              Mas información aqui:
            </Text>

            <Text style={styles.sectionContentLink}>
              <LoadingButton
                title="Ver políticas completas"
                onPress={() => Linking.openURL("https://appdoki.com/politicas-de-privacidad")}
                style={styles.closeButton}
              />
            </Text>
          </View>
        </ScrollView>

        <LoadingButton
          title="Entendido"
          onPress={onClose}
          style={styles.closeButton}
        />
      </View>
    </BaseModal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    width: "90%",
    maxHeight: "100%",
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
    maxHeight: 600,
    marginBottom: 20,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Karla-Bold",
    color: "#333",
  },
  sectionContent: {
    fontSize: 14,
    fontFamily: "Karla-Regular",
    color: "#666",
    lineHeight: 20,
    marginBottom: 10,
  },
  closeButton: {
    marginTop: 10,
  },
  sectionContentLink: {
    height: 45
  },
});

export default PrivacyPoliciesModal;
