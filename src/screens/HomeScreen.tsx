import React from "react"
import { memo } from "react"
import { View, StyleSheet } from "react-native"
import FiltersScreen from "./FiltersScreen"
import NewActionComponent from "../components/NewAction/NewActionComponent"

// Optimización 1: Componente memoizado para evitar re-renders innecesarios
const HomeScreen: React.FC = memo(() => {
  return (
    <View style={styles.container}>
      <FiltersScreen filterType="all" />
      <NewActionComponent />
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F5F7",
  },
})

export default HomeScreen
