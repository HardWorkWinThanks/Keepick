'use client'

interface HighlightGlowCardProps {
  children: React.ReactNode
  className?: string
}

export const HighlightGlowCard: React.FC<HighlightGlowCardProps> = ({ 
  children, 
  className = "" 
}) => {
  return (
    <div className={`relative group cursor-pointer ${className}`}>
      {/* 글로우 효과 */}
      <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-lg opacity-0 group-hover:opacity-30 transition-opacity duration-500 blur-sm"></div>
      
      {/* 펄스 효과 */}
      <div className="relative transition-all duration-300 group-hover:scale-105">
        {children}
      </div>
    </div>
  )
}