"use client"

import React from "react"
import { memo } from "react"
import type { Document } from "../types"
import FiltersFolderScreen from "../../screens/FiltersFolderScreen"

interface FiltersFolderComponentsProps {
  folder: Document | null
}

// Optimización 1: Wrapper component que usa el screen optimizado
const FiltersFolderComponents: React.FC<FiltersFolderComponentsProps> = memo(({ folder }) => {
  return <FiltersFolderScreen folder={folder} />
})

FiltersFolderComponents.displayName = "FiltersFolderComponents"

export default FiltersFolderComponents
