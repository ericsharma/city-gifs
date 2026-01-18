# Changelog

## [1.1.3] - 2026-01-18
- Added native mobile sharing for camera locations using Web Share API
- Implemented camera share functionality with automatic fallback to clipboard on desktop
- Added map state persistence (3D mode, borough visibility, zoom/pan position)
- Fixed camera popup bug that prevented closing when sharing via URL
- Fixed share URL to use camera coordinates instead of map center position
- Added toast notifications for share actions and errors
- Enhanced social sharing with Open Graph and Twitter meta tags
- Refactored camera popup into dedicated CameraPopupCard component
- Improved camera popup UI with better visual hierarchy
- Added shareable links that preserve map view state (zoom, bearing, pitch)
- Fixed URL parameter handling to prevent conflicting auto-expand behavior

## [1.1.2] - 2026-01-10
- Implemented automatic guided tour for new users
- Enhanced map error handling during camera selection transitions
- Fixed theme dropdown z-index issues on mobile
- Added static PWA loading screen for instant feedback
- Improved map loading experience with branded full-screen spinner
- Optimized initial map zoom level for mobile devices
- Disabled distracting zoom animations during guided tour on mobile
- Refactored mobile map controls layout for better accessibility

## [1.1.1] - 2026-01-10
- Added theme switcher to header and improved guided tour styling
- Fixed search box styling to match theme conventions
- Removed duplicate camera data file

## [1.1.0] - 2026-01-10
- Added interactive guided tour of map features using `driver.js`
- Replaced Leaflet with Shadcn map component for better UI integration
- Added borough border highlighting using GeoJSON data
- Implemented camera filtering by borough
- Added compass control for map orientation
- Consolidated map controls for improved usability
- Updated README with library and data attributions
- Removed old borough ledger and distinct marker colors per borough

## [1.0.1] - 2025-12-20
- Updated Docker documentation with security hardening details
- Improved deployment guidance and Docker Compose recommendations
- Changed name from generic name

## [1.0.0] - 2025-12-20
- Initial release
- Interactive map with NYC traffic cameras
- GIF creation from live camera feeds
- PWA support
- Docker containerization