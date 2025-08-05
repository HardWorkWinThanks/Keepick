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
  - **IMPORTANT**: Use v5 syntax - NO `onSuccess`/`onError` callbacks in useQuery/useMutation
  - Handle side effects in `useEffect` or separate mutation success handlers
  - Use `data`, `error`, `isLoading` return values from hooks
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



## FSD Architecture Guidelines for Claude Agents

### CRITICAL: Definitive FSD Architecture Rules
When acting as frontend-fsd-architect agent, you MUST follow these EXACT rules:

## Layer Hierarchy (Dependency Direction: ↓ only)
```
app/           # Application layer (Next.js App Router pages, layouts)
  ↓
pages/         # Page compositions (combining widgets and features)
  ↓
widgets/       # Composite UI blocks (combining multiple features)
  ↓  
features/      # Business logic features (isolated functionality)
  ↓
entities/      # Business entities (data models, domain logic)
  ↓
shared/        # Infrastructure (API, utils, types, config)
```

## Layer Responsibilities (ABSOLUTE RULES)

### `entities/` - Business Entities
- **Purpose**: Pure business data and domain logic
- **Contains**: Data models, entity state, domain operations
- **Examples**: `entities/user/`, `entities/post/`, `entities/group/`
- **Structure**:
  ```
  entities/user/
  ├── model/
  │   ├── userSlice.ts    # User data state
  │   ├── types.ts        # User interfaces/types
  │   └── selectors.ts    # Data selectors
  ├── api/
  │   └── userApi.ts      # User-specific API calls
  └── index.ts
  ```

### `features/` - Business Features  
- **Purpose**: Isolated business functionality using entities
- **Contains**: Feature logic, feature-specific UI, feature workflows
- **Examples**: `features/auth/`, `features/post-creation/`, `features/user-profile/`
- **Rules**: 
  - Can import from `entities/` and `shared/`
  - CANNOT cross-import between features
  - CANNOT import from `widgets/` or `app/`

### `pages/` - Page Compositions
- **Purpose**: Complete page layouts combining widgets and features
- **Contains**: Page-specific logic, page compositions, route-specific state
- **Examples**: `pages/LoginPage/`, `pages/DashboardPage/`, `pages/ProfilePage/`
- **Rules**: Can import from `widgets/`, `features/`, `entities/`, `shared/`

### `widgets/` - Composite UI
- **Purpose**: Complex UI blocks combining multiple features
- **Contains**: Composite components, layout components
- **Examples**: `widgets/header/`, `widgets/post-feed/`, `widgets/user-dashboard/`
- **Rules**: Can import from `features/`, `entities/`, `shared/`

### `shared/` - Infrastructure
- **Purpose**: Reusable utilities, API clients, common types
- **Contains**: HTTP client, common hooks, utility functions, global types
- **Rules**: CANNOT import from any upper layers
- **Structure**:
  ```
  shared/
  ├── api/http/           # HTTP client, interceptors
  ├── config/             # App configuration, store setup
  ├── lib/                # Utility functions
  ├── types/              # Global/API types
  └── ui/                 # Basic UI components (Button, Input)
  ```

## Authentication Implementation Rules

### User Data → `entities/user/`
```typescript
// entities/user/model/userSlice.ts
interface UserState {
  currentUser: User | null;
  isLoading: boolean;
}
```

### Authentication Logic → `features/auth/`
```typescript
// features/auth/model/authSlice.ts  
interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
}
```

### HTTP Client → `shared/api/http/`
```typescript
// shared/api/http/client.ts
// JWT interceptors, token refresh logic
```

### App Initialization → `shared/config/`
```typescript
// shared/config/AuthInitializer.tsx  
// App-wide initialization logic
```

## Absolute Prohibitions

❌ **NEVER put user data in features/auth/**
❌ **NEVER put business entities in shared/**
❌ **NEVER import from features/ to features/**
❌ **NEVER put Redux slices in shared/store/features/**
❌ **NEVER mix authentication state with user data**

## File Naming Conventions
- Slices: `userSlice.ts`, `authSlice.ts`
- API: `userApi.ts`, `authApi.ts`  
- Hooks: `useAuth.ts`, `useUser.ts`
- Types: `types.ts`, `index.ts`

## Redux Store Structure
```typescript
// shared/config/store.ts
reducer: {
  user: userReducer,     // from entities/user
  auth: authReducer,     // from features/auth
  // ... other entities and features
}
```

**These rules are FINAL and must NOT be changed during implementation.**

### Code Modification Policy
**IMPORTANT**: When providing solutions, Claude agents should:
1. **Show code examples** rather than directly modifying files
2. **Explain what needs to be changed** and let the user copy-paste
3. **Only modify files when explicitly requested** by the user
4. **Provide clear instructions** on which files to modify and how

## Important Notes
- The project uses Next.js App Router (not Pages Router)
- HTTPS is required for development due to WebRTC requirements
- Korean language support (lang="ko" in layout)
- Strict TypeScript configuration enabled