import React from "react";
import { useState, useCallback } from "react";
import { KeyboardAvoidingView, Platform, View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import Toast from "react-native-toast-message";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../components/types";
import { resetPassword } from "../supabase/auth";
import { useFormValidation, commonValidationRules } from "../hooks/useFormValidation";
import FormInput from "../components/common/FormInput";
import LoadingButton from "../components/common/LoadingButton";

interface ForgotPasswordScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const { errors, validateForm, clearError } = useFormValidation({
    email: commonValidationRules.email,
  });

  const updateEmail = useCallback(
    (value: string) => {
      setEmail(value);
      clearError("email");
      setSuccessMessage("");
    },
    [clearError],
  );

  const handleResetPassword = useCallback(async () => {
    try {
      if (!validateForm({ email })) {
        return;
      }

      setLoading(true);
      setSuccessMessage("");

      const { success, message, errorMessage } = await resetPassword(email);

      if (!success) {
        console.error("Password reset failed:", errorMessage);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: errorMessage || "Error al procesar la solicitud",
        });
        return;
      }

      const successMsg = message || "Se ha enviado una nueva contraseña a tu correo.";
      setSuccessMessage(successMsg);

      Toast.show({
        type: "success",
        text1: "Éxito",
        text2: successMsg,
      });

      setTimeout(() => {
        navigation.navigate("Login");
      }, 2000);
    } catch (error: any) {
      console.error("Unexpected error in handleResetPassword:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Error al enviar la nueva contraseña.",
      });
    } finally {
      setLoading(false);
    }
  }, [email, validateForm, navigation]);

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* ── Back button ── */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate("Login")} accessibilityLabel="Volver">
          <View style={styles.backButtonInner}>
            <Text style={styles.backButtonText}>← Volver</Text>
          </View>
        </TouchableOpacity>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconEmoji}>🔑</Text>
          </View>
          <Text style={styles.title}>Recuperar contraseña</Text>
          <Text style={styles.subtitle}>Te enviaremos una nueva contraseña a tu correo electrónico</Text>
        </View>

        {/* ── Card ── */}
        <View style={styles.card}>
          <FormInput iconName="mail-outline" placeholder="Correo electrónico" value={email} onChangeText={updateEmail} error={errors.email} keyboardType="email-address" autoCapitalize="none" autoComplete="email" theme="dark" />
          {successMessage ? (
            <View style={styles.successContainer}>
              <Text style={styles.successMessage}>{successMessage}</Text>
            </View>
          ) : null}
          <LoadingButton title="Enviar instrucciones" onPress={handleResetPassword} loading={loading} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardView: { flex: 1, backgroundColor: "#0A0A0A" },
  scrollView: { flex: 1, backgroundColor: "#0A0A0A" },
  scrollContainer: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  backButton: { marginBottom: 32 },
  backButtonInner: { alignSelf: "flex-start" },
  backButtonText: { fontFamily: "Karla-SemiBold", color: "#FF8C00", fontSize: 15 },
  header: { alignItems: "center", marginBottom: 36 },
  iconContainer: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#1C1C1E", justifyContent: "center", alignItems: "center", marginBottom: 20 },
  iconEmoji: { fontSize: 32 },
  title: { fontFamily: "Karla-Bold", fontSize: 26, color: "#FFFFFF", marginBottom: 10, textAlign: "center" },
  subtitle: { fontFamily: "Karla-Regular", color: "#6B7280", fontSize: 14, textAlign: "center", lineHeight: 20 },
  card: { backgroundColor: "#1C1C1E", borderRadius: 20, padding: 24 },
  successContainer: { marginBottom: 16, padding: 12, backgroundColor: "rgba(16,185,129,0.12)", borderRadius: 10, borderLeftWidth: 3, borderLeftColor: "#10B981" },
  successMessage: { color: "#10B981", fontSize: 14, fontFamily: "Karla-Regular" },
});

export default ForgotPasswordScreen;