import React from 'react'
import { CityLogo } from './icons/CityLogo'
import { Button } from './ui/button'
import { Github } from 'lucide-react'

interface HeaderProps {
  className?: string
}

export function Header({ className = '' }: HeaderProps) {
  const handleGitHubClick = () => {
    window.open('https://github.com/ericsharma/city-gifs', '_blank', 'noopener,noreferrer')
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleGitHubClick()
    }
  }

  return (
    <header 
      className={`flex items-center justify-between px-4 py-3 md:px-6 md:py-4 bg-card/50 backdrop-blur-sm border-b border-border/20 ${className}`}
      role="banner"
    >
      {/* Logo and Title */}
      <div className="flex items-center gap-3 md:gap-4">
        <div className="flex-shrink-0" aria-hidden="true">
          <CityLogo 
            size={40}
            className="md:block hidden" 
          />
          <CityLogo 
            size={32}
            className="md:hidden" 
          />
        </div>
        <div className="flex flex-col">
          <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-foreground leading-tight">
            City Gifs
          </h1>
          <p 
            className="text-xs md:text-sm text-muted-foreground leading-tight hidden sm:block"
            aria-label="Application description"
          >
            Create GIFs from live city cameras
          </p>
        </div>
      </div>

      {/* GitHub Link */}
      <div className="flex items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={handleGitHubClick}
          onKeyDown={handleKeyDown}
          className="group hover:bg-accent focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all duration-300 min-h-[44px]"
          aria-label="View source code on GitHub (opens in new tab)"
          title="View source code on GitHub"
        >
          <Github 
            size={16} 
            className="mr-2 group-hover:scale-110 transition-transform duration-300" 
            aria-hidden="true"
          />
          <span className="hidden sm:inline">GitHub</span>
          <span className="sm:hidden">Code</span>
        </Button>
      </div>
    </header>
  )
}

export default Header