'use client'

interface SimpleHoverCardProps {
  children: React.ReactNode
  className?: string
}

export const SimpleHoverCard: React.FC<SimpleHoverCardProps> = ({ 
  children, 
  className = "" 
}) => {
  return (
    <div className={`transition-all duration-300 hover:scale-105 cursor-pointer ${className}`}>
      {children}
    </div>
  )
}