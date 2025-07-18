# BroGolfTracker - Golf Tournament Management System

## Overview

BroGolfTracker is a full-stack golf tournament management system built with React, Express, and PostgreSQL. The application allows users to manage golf tournaments, track scores, maintain leaderboards, and handle player registrations. It features a responsive design with separate mobile and desktop interfaces, role-based access control, and comprehensive tournament management capabilities.

**Current Status**: Production-ready with complete authentication, tournament management, scoring system, and cross-browser compatibility.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **UI Components**: Radix UI primitives with custom styling
- **Styling**: Tailwind CSS with custom golf-themed color scheme
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: bcryptjs for password hashing (session-based auth ready)
- **API Design**: RESTful endpoints with proper error handling

### Database Architecture
- **Database**: PostgreSQL (configured for Neon serverless)
- **Schema Management**: Drizzle migrations with automatic schema generation
- **Connection**: Connection pooling with @neondatabase/serverless

## Key Components

### Authentication System
- User registration and login with bcrypt password hashing
- Role-based access control (admin/regular users)
- Client-side user state management with localStorage persistence
- Protected routes based on authentication status

### Tournament Management
- Active tournament system with date-based scheduling
- Multi-round tournament support
- Daily and overall buy-in tracking
- Tournament status management

### Course Management
- Golf course creation with location and yardage information
- Hole-by-hole configuration (par, yardage, handicap ranking)
- Course selection for tournament rounds

### Scorecard System
- Group-based scorecards with multiple players
- Hole-by-hole score entry
- Real-time score validation and storage
- Score history tracking

### Leaderboard System
- Overall tournament leaderboards
- Daily round leaderboards
- Net score calculations with handicap adjustments
- Position tracking and ranking

### User Interface
- Responsive design with mobile-first approach
- Bottom navigation for mobile devices
- Desktop sidebar navigation
- Golf-themed color scheme and branding
- Toast notifications for user feedback

## Data Flow

1. **User Authentication**: Login/registration → JWT/session storage → role-based route access
2. **Tournament Setup**: Admin creates tournament → configures rounds → assigns courses
3. **Score Entry**: Admin creates scorecards → assigns players → enters scores
4. **Leaderboard Updates**: Score submissions → automatic leaderboard recalculation → real-time display
5. **Data Persistence**: All operations use Drizzle ORM → PostgreSQL with connection pooling

## External Dependencies

### Frontend Dependencies
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Accessible UI component primitives
- **@hookform/resolvers**: Form validation with Zod schemas
- **wouter**: Lightweight React router
- **date-fns**: Date manipulation utilities

### Backend Dependencies
- **drizzle-orm**: Type-safe database ORM
- **@neondatabase/serverless**: PostgreSQL serverless driver
- **bcryptjs**: Password hashing
- **zod**: Schema validation
- **express**: Web framework

### Development Dependencies
- **vite**: Build tool and development server
- **tailwindcss**: Utility-first CSS framework
- **typescript**: Type checking and compilation
- **esbuild**: Fast JavaScript bundler for production

## Deployment Strategy

### Development
- Vite development server for frontend with hot module replacement
- tsx for running TypeScript backend with file watching
- Replit-specific development tools and error overlays

### Production Build
- Frontend: Vite build with optimized bundling and tree-shaking
- Backend: esbuild compilation to ESM format
- Static file serving through Express for SPA routing

### Database
- Drizzle migrations for schema management
- Environment-based database URL configuration
- Connection pooling for production scalability

### Environment Configuration
- DATABASE_URL for PostgreSQL connection
- NODE_ENV for environment-specific behavior
- Replit-specific environment variables for development tools

The application follows a modern full-stack architecture with clear separation of concerns, type safety throughout, and scalable deployment patterns suitable for both development and production environments.

## Recent Changes

### July 18, 2025 - Authentication Fix & Complete Rebranding
- Fixed authentication system - resolved login issues and created user accounts
- Completed rebranding from "Stick-IT" to "BroGolfTracker" across all files and documentation
- Updated all user-facing text, titles, and branding elements
- Fixed critical authentication issue causing blank screens in Safari and Edge browsers
- Resolved missing icon import (Volleyball → Target) in navigation component
- Added comprehensive error boundaries for graceful error handling
- Enhanced Safari/Edge compatibility with CSS fixes and meta tags
- Added proper error handling throughout authentication flow
- Created deployment documentation and build scripts
- Confirmed login functionality working across all browsers

### July 18, 2025 - Achievement System & Tournament-Course Association
- Implemented complete achievement system with 16 different badges across 4 tiers (Bronze, Silver, Gold, Platinum)
- Created achievements database tables with progress tracking and completion timestamps
- Built achievement service with automatic milestone detection for scoring, tournament, streak, and special achievements
- Added achievements page with progress tracking, statistics, and filtering by category
- Updated navigation to include achievements/badges section
- Added tournament-course association: tournaments now require a specific golf course selection
- Updated database schema to include courseId foreign key in tournaments table
- Enhanced tournament creation form with course selection dropdown
- Updated all related database relations and API endpoints

### July 18, 2025 - Tournament Management UX Improvements
- Fixed tournament creation API issues with schema validation for buy-in amounts
- Added dedicated "Tournament Management" navigation item for better UX organization
- Created separate tournament management page with comprehensive tournament and rounds overview
- Removed "Rounds" as separate menu item since rounds are a subset of tournaments
- Improved navigation structure with logical grouping of admin features
- Added proper tournament stats and round management interface
- Fixed tournament creation dialog functionality with proper course selection

### Deployment Ready
- Production build process configured with frontend/backend compilation
- Database schema complete with test data
- Build script (build-deploy.sh) created for easy deployment
- Static file serving properly configured for production