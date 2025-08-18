'use client'

import { ReactNode, useState } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  placement?: 'center' | 'top-center'
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

interface ModalContentProps {
  children: ReactNode
  className?: string
}

interface ModalHeaderProps {
  children: ReactNode
  className?: string
}

interface ModalBodyProps {
  children: ReactNode
  className?: string
}

interface ModalFooterProps {
  children: ReactNode
  className?: string
}

export function Modal({ isOpen, onClose, children, placement = 'center', size = 'md' }: ModalProps) {
  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  }

  const placementClasses = {
    center: 'items-center justify-center',
    'top-center': 'items-start justify-center pt-20'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className={`flex min-h-screen w-full ${placementClasses[placement]} px-4`}>
        <div className={`relative w-full ${sizeClasses[size]} my-auto`}>
          {children}
        </div>
      </div>
    </div>
  )
}

export function ModalContent({ children, className = '' }: ModalContentProps) {
  return (
    <div className={`bg-[#222222] rounded-lg shadow-xl border border-white/10 ${className}`}>
      {children}
    </div>
  )
}

export function ModalHeader({ children, className = '' }: ModalHeaderProps) {
  return (
    <div className={`px-6 py-4 border-b border-white/10 ${className}`}>
      {children}
    </div>
  )
}

export function ModalBody({ children, className = '' }: ModalBodyProps) {
  return (
    <div className={`px-6 py-4 ${className}`}>
      {children}
    </div>
  )
}

export function ModalFooter({ children, className = '' }: ModalFooterProps) {
  return (
    <div className={`px-6 py-4 border-t border-white/10 flex gap-2 justify-end ${className}`}>
      {children}
    </div>
  )
}

// Hook for modal state management
export function useModal() {
  const [isOpen, setIsOpen] = useState(false)

  const onOpen = () => setIsOpen(true)
  const onClose = () => setIsOpen(false)
  const onToggle = () => setIsOpen(!isOpen)

  return { isOpen, onOpen, onClose, onToggle }
}