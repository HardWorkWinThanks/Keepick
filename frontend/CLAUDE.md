# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Keepick is a Next.js 15.4.4 application with React 19 that appears to be a social photo-sharing platform with video conferencing capabilities. The project uses TypeScript, TailwindCSS, and follows Feature-Sliced Design (FSD) architecture principles.

## Development Commands

- `npm run dev` - Start development server with HTTPS (custom server.js with SSL certificates)
- `npm run build` - Build the application for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint for code quality checks

## Architecture & Structure

### FSD Architecture
The project follows Feature-Sliced Design with these main layers:

- **app/** - Application layer (Next.js App Router pages and layout)
- **pages/** - Deprecated pages (contains legacy LoginPage)
- **widgets/** - Composite UI blocks (auth widgets, video-conference)
- **features/** - Business logic features (auth, social-login)
- **shared/** - Shared resources across the application
  - **api/** - API utilities (socket connections)
  - **assets/** - SVG icons and components
  - **config/** - Application configuration and providers
  - **store/** - Redux Toolkit store configuration
  - **styles/** - Global CSS styles
  - **types/** - TypeScript type definitions

### Key Technologies & Patterns

- **State Management**: Redux Toolkit with auth slice
- **Data Fetching**: TanStack Query (React Query) v5
- **UI Components**: Radix UI with custom components in `src/components/ui/`
- **Styling**: TailwindCSS with CVA (Class Variance Authority)
- **Forms**: React Hook Form with Zod validation
- **Real-time Communication**: Socket.io client and MediaSoup for WebRTC
- **Authentication**: Social login (Naver, Kakao) with custom handlers

### Provider Hierarchy
```
Providers (StoreProvider → QueryProvider)
├── Redux Store (auth state)
└── React Query Client
```

### Custom Server
The application runs on a custom HTTPS server (`server.js`) with SSL certificates in the `certs/` directory, accessible on both localhost and local network IP.

### Component Architecture
- UI components are in `src/components/ui/` (shadcn/ui style)
- Layout components in `src/components/layout/`
- Feature-specific components organized within their respective feature directories
- Shared assets like icons are React components in `src/shared/assets/`

### Authentication Flow
- Social login handlers in `src/features/auth/social-login/`
- Auth state managed via Redux slice
- Login widgets and pages for user authentication

### Video Conferencing
- MediaSoup integration for WebRTC functionality
- Video conference widgets with control panels and video grids
- Socket.io for real-time communication

## Path Aliases
- `@/*` maps to `./src/*`

## Important Notes
- The project uses Next.js App Router (not Pages Router)
- HTTPS is required for development due to WebRTC requirements
- Korean language support (lang="ko" in layout)
- Strict TypeScript configuration enabled