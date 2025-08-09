'use client'

import React from 'react'
import { useSidebar } from '../model/useSidebar'
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
  const sidebarProps = useSidebar()

  return (
    <div className={`min-h-screen ${className}`} style={{ backgroundColor }}>
      <AppSidebar {...sidebarProps} {...sidebarConfig} />
      
      <div className={`transition-all duration-200 ease-out ${
        sidebarProps.sidebarPinned ? "ml-[240px]" : "ml-0"
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
        
        {/* 헤더 아래부터 시작하는 메인 영역 */}
        <div className="pt-14">
          {children}
        </div>
      </div>
    </div>
  )
}