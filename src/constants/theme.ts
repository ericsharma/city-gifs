import type React from 'react';

// Design token constants — mirrors CSS custom properties defined in index.css.
// Used by always-dark components that need reliable color values regardless of OS theme.

export const COLORS = {
  amber: '#D4952B',       // --primary
  bgDeepest: '#0D0C0A',   // camera viewport base (deeper than --background)
  bgDark: '#1A1814',      // --background (dark)
  bgPanel: '#242019',     // --card (dark)
  bgSubtle: '#2E2A22',    // --secondary / --muted (dark)
  border: '#4A453B',      // --border (dark)
  textLight: '#EBE8E2',   // panel headings
  textLabel: '#D4D0C8',   // form labels in dark panels
  textDim: '#6B665C',     // --muted-foreground (dark)
  textSubtle: '#A09A8F',  // secondary labels
  red: '#EF4444',         // --destructive
} as const;

// Frosted glass panel — used by top/bottom HUD bars in the live preview
export const GLASS_STYLE: React.CSSProperties = {
  background: 'rgba(13, 12, 10, 0.75)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
};

// CSS filter applied to the ambient background and to immersive-mode captures
export const CAMERA_FILTER = 'blur(8px) saturate(1.3) brightness(1.1)';
