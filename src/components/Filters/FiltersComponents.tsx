"use client"

import React from "react"
import { memo } from "react"
import FiltersScreen from "../../screens/FiltersScreen"

interface FiltersComponentsProps {
  filterType: "all" | "favorites"
}

// Optimización 1: Wrapper component que usa el screen optimizado
const FiltersComponents: React.FC<FiltersComponentsProps> = memo(({ filterType }) => {
  return <FiltersScreen filterType={filterType} />
})

FiltersComponents.displayName = "FiltersComponents"

export default FiltersComponents
