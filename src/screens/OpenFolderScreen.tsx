"use client"

import type React from "react"
import { memo } from "react"
import { View, StyleSheet, Text } from "react-native"
import { type RouteProp, useRoute } from "@react-navigation/native"
import FiltersFolderComponents from "../components/Filters/FiltersFolderComponents"
import NewActionComponent from "../components/NewAction/NewActionComponent"
import type { RootStackParamList } from "../components/types"

type OpenFolderScreenRouteProp = RouteProp<RootStackParamList, "OpenFolderPage">

// Optimización 1: Componente memoizado con mejor tipado
const OpenFolderScreen: React.FC = memo(() => {
  const route = useRoute<OpenFolderScreenRouteProp>()
  const { item: folder } = route.params

  // Optimización 2: Validación de parámetros
  if (!folder) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: Carpeta no encontrada</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FiltersFolderComponents folder={folder} />
      <NewActionComponent folder={{ folder }} />
    </View>
  )
})

OpenFolderScreen.displayName = "OpenFolderScreen"

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#ff4d4d",
    fontFamily: "Karla-Regular",
    textAlign: "center",
  },
})

export default OpenFolderScreen
