'use client'

import React, { useState, useEffect } from 'react'
import { useSidebar } from '../model/useSidebar'
import { useMainAuth } from "@/features/main-integration/model/useMainAuth"
import AppHeader from './AppHeader'
import AppSidebar from './AppSidebar'

interface AppLayoutProps {
  children: React.ReactNode
  showCenterButton?: boolean
  onSpillPhotos?: () => void
  centerButtonText?: string
  centerButtonTitle?: string
  showLogo?: boolean
  logoText?: string
  backgroundColor?: string
  sidebarConfig?: {
    showCreateGroupButton?: boolean
    showGroupsSection?: boolean  
    showFriendsSection?: boolean
    currentGroup?: {
      id: string
      name: string
      description: string
      thumbnailImage?: string
    }
    forceInitialPinned?: boolean
  }
  headerConfig?: {
    showLogo?: boolean
    logoText?: string
  }
  className?: string
}

export default function AppLayout({ 
  children, 
  showCenterButton = false,
  onSpillPhotos,
  centerButtonText = "!!!",
  centerButtonTitle = "사진 쏟기",
  showLogo = true,
  logoText = "Keepick",
  backgroundColor = "#111111",
  sidebarConfig = {
    showCreateGroupButton: true,
    showGroupsSection: true,
    showFriendsSection: true
  },
  headerConfig = {},
  className = ""
}: AppLayoutProps) {
  const sidebarProps = useSidebar(sidebarConfig?.forceInitialPinned)
  const { isLoggedIn } = useMainAuth()
  const [isMounted, setIsMounted] = useState(false)

  // Hydration 완료 후에만 인증 상태 기반 렌더링 적용
  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <div className={`min-h-screen ${className}`} style={{ backgroundColor }}>
      <AppSidebar {...sidebarProps} {...sidebarConfig} />
      
      <div className={`transition-all duration-200 ease-out ${
        isMounted && isLoggedIn && sidebarProps.sidebarPinned ? "ml-[240px]" : "ml-0"
      }`}>
        <AppHeader 
          sidebarPinned={sidebarProps.sidebarPinned}
          showCenterButton={showCenterButton}
          onSpillPhotos={onSpillPhotos}
          centerButtonText={centerButtonText}
          centerButtonTitle={centerButtonTitle}
          showLogo={showLogo}
          logoText={logoText}
          {...headerConfig}
        />
        
        {/* 메인 영역 */}
        <div>
          {children}
        </div>
      </div>
    </div>
  )
}