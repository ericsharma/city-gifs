interface CityLogoProps {
  size?: number
  className?: string
}

export function CityLogo({ 
  size = 60, 
  className = '' 
}: CityLogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      xmlns="http://www.w3.org/2000/svg" 
      fill="currentColor"
      className={className}
    >
      {/* Building 1 */}
      <rect 
        x="10" 
        y="50" 
        width="15" 
        height="50" 
        className="animate-signal-modulate"
        style={{ animationDelay: '0.0s' }}
      />
      
      {/* Building 2 */}
      <rect 
        x="30" 
        y="20" 
        width="15" 
        height="80" 
        className="animate-signal-modulate"
        style={{ animationDelay: '0.4s' }}
      />
      
      {/* Building 3 */}
      <rect 
        x="50" 
        y="40" 
        width="15" 
        height="60" 
        className="animate-signal-modulate"
        style={{ animationDelay: '0.2s' }}
      />
      
      {/* Building 4 */}
      <rect 
        x="75" 
        y="55" 
        width="15" 
        height="45" 
        className="animate-signal-modulate"
        style={{ animationDelay: '0.6s' }}
      />

      {/* Recording dot */}
      <circle 
        cx="82" 
        cy="30" 
        r="6" 
        className="animate-pulse-red"
      />
    </svg>
  )
}

export default CityLogo