import type React from "react"
import { memo } from "react"
import { View, StyleSheet } from "react-native"
import FiltersComponents from "../components/Filters/FiltersComponents"
import NewActionComponent from "../components/NewAction/NewActionComponent"

// Optimización 1: Componente memoizado para evitar re-renders innecesarios
const HomeScreen: React.FC = memo(() => {
  return (
    <View style={styles.container}>
      <FiltersComponents filterType="all" />
      <NewActionComponent />
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
})

export default HomeScreen
