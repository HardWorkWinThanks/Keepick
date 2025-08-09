'use client'

import { useState } from 'react'

export const useSidebar = (initialPinned = false) => {
  const [sidebarHovered, setSidebarHovered] = useState(false)
  const [sidebarPinned, setSidebarPinned] = useState(initialPinned)

  const toggleSidebarPin = () => {
    setSidebarPinned(!sidebarPinned)
    if (sidebarPinned) {
      setSidebarHovered(false)
    }
  }

  return {
    sidebarHovered,
    sidebarPinned,
    setSidebarHovered,
    toggleSidebarPin
  }
}