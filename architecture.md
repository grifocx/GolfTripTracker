# BroGolfTracker - Golf Tournament Management System - Architecture

## Overview

BroGolfTracker is a comprehensive full-stack web application designed for managing annual golf trips. It supports multiple users with handicap tracking, course management, score entry, and real-time leaderboards with net score calculations.

## System Architecture

### Technology Stack

#### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query v5 for server state management
- **UI Components**: Radix UI primitives with custom styling
- **Styling**: Tailwind CSS with custom golf-themed color scheme
- **Build Tool**: Vite for fast development and optimized production builds
- **Forms**: React Hook Form with Zod validation

#### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with connection pooling
- **ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: bcryptjs for password hashing
- **Validation**: Zod schemas for request/response validation

#### Database
- **Database**: PostgreSQL (Neon serverless compatible)
- **Schema Management**: Drizzle migrations
- **Connection**: @neondatabase/serverless with connection pooling

### Architecture Patterns

#### Data Flow
1. **Client Request** → React Query → API Routes → Storage Layer → Database
2. **Database** → Storage Layer → API Routes → React Query → UI Components
3. **Authentication** → Session Management → Role-based Access Control
4. **Tournament Selection** → Context Propagation → Round Management → Score Entry

#### Component Structure
```
client/src/
├── components/
│   ├── ui/           # Reusable UI components (shadcn/ui)
│   └── navigation.tsx # Navigation component
├── hooks/
│   ├── use-auth.tsx  # Authentication hook
│   └── use-toast.ts  # Toast notifications
├── lib/
│   ├── queryClient.ts # React Query configuration
│   └── utils.ts      # Utility functions
├── pages/            # Route components
└── App.tsx          # Main application component
```

#### Server Structure
```
server/
├── db.ts            # Database connection and configuration
├── storage.ts       # Data access layer (IStorage interface)
├── routes.ts        # API route handlers
├── index.ts         # Express server setup
└── vite.ts          # Vite integration for development
```

### Database Schema

#### Core Tables
- **users**: User accounts with roles and handicaps
- **tournaments**: Tournament definitions with buy-in amounts
- **courses**: Golf courses with par and yardage
- **holes**: Individual holes with handicap rankings
- **rounds**: Daily tournament rounds
- **scorecards**: Player groupings for score entry
- **scores**: Individual hole scores

#### Key Relationships
- Users → Scores (one-to-many)
- Tournaments → Rounds (one-to-many)
- Courses → Holes (one-to-many)
- Rounds → Scorecards (one-to-many)
- Scorecards → Scores (one-to-many)

### Authentication & Authorization

#### User Roles
- **Admin**: Full access to tournament management, score entry, and user management
- **Player**: Read-only access to leaderboards and personal information

#### Security Features
- Password hashing with bcryptjs
- Role-based route protection
- Session management with localStorage persistence
- Protected API endpoints with role validation

### API Design

#### RESTful Endpoints
- `GET /api/users` - List users
- `POST /api/users` - Register new user
- `POST /api/login` - User authentication
- `GET /api/tournaments` - List tournaments
- `POST /api/tournaments` - Create tournament
- `GET /api/courses` - List courses
- `POST /api/courses` - Create course
- `GET /api/leaderboard` - Get leaderboard data
- `POST /api/scores` - Submit scores

#### Data Validation
- Zod schemas for all API inputs/outputs
- Type-safe database operations with Drizzle
- Client-side form validation with React Hook Form

### Responsive Design

#### Mobile-First Approach
- Bottom navigation for mobile devices
- Responsive grid layouts
- Touch-friendly interface elements
- Optimized for on-course usage

#### Desktop Experience
- Sidebar navigation
- Multi-column layouts
- Enhanced data visualization
- Keyboard navigation support

### Performance Optimizations

#### Frontend
- React Query caching for server state
- Optimistic updates for better UX
- Lazy loading of route components
- Efficient re-renders with proper key usage

#### Backend
- Database connection pooling
- Efficient SQL queries with proper indexing
- Minimal API response payloads
- Express.js middleware optimization

### Development Workflow

#### Hot Reload Setup
- Vite frontend development server
- tsx backend file watching
- Automatic server restarts on changes
- Real-time database schema updates

#### Code Quality
- TypeScript strict mode
- Consistent code formatting
- Type-safe database operations
- Comprehensive error handling

### Deployment Strategy

#### Production Build
- Vite optimized frontend bundle
- esbuild backend compilation
- Static asset optimization
- Environment-based configuration

#### Database Management
- Drizzle schema migrations
- Connection pooling for scalability
- Environment variable configuration
- Backup and recovery procedures

## Key Features

### Tournament Management
- Multiple tournament support with dropdown selector
- Date-based tournament scheduling with status tracking (draft/in-progress/completed)
- Buy-in tracking (daily and overall)
- Round configuration with course assignment
- Clear tournament context throughout the interface
- Tournament-specific round management with visual confirmation

### Score Management
- Admin-only score entry
- Hole-by-hole scoring
- Group-based scorecards (4 players)
- Real-time score validation

### Leaderboard System
- Overall tournament leaderboards
- Daily round leaderboards
- Net score calculations using handicaps
- Lowest handicap as baseline for fair play

### User Management
- User registration and authentication
- Handicap tracking and updates
- Role-based access control
- Profile management

### Course Management
- Course creation with location details
- Hole-by-hole configuration
- Par and yardage tracking
- Handicap ranking system (1-18)

## Security Considerations

- Secure password hashing
- Role-based access control
- Input validation and sanitization
- SQL injection prevention
- XSS protection through proper escaping

## Recent Architectural Improvements

### Tournament Management Overhaul (July 18, 2025)
- Replaced single "active tournament" pattern with multi-tournament selector approach
- Enhanced user experience with clear tournament context throughout workflows
- Improved database queries to work with selected tournament paradigm
- Added visual confirmation for tournament-specific operations
- Implemented comprehensive status management (draft/in-progress/completed)

### Round Creation Enhancement (July 18, 2025)
- Implemented flexible round creation with tournament selection in dialog
- Moved round creation workflow to be independent of tournament pre-selection
- Enhanced data display to show tournament context with each round
- Added dynamic UI that adapts based on tournament selection state
- Improved user experience with intuitive tournament-to-round association

### Data Purge & Testing Capabilities
- Built-in database purge functionality for fresh testing environments
- Preserved critical data (users, courses) while clearing tournament-specific data
- Comprehensive testing workflow support for tournament setup validation

## Future Extensibility

The architecture supports easy extension for:
- Additional user roles and permission levels
- Tournament formats (match play, stroke play, team competitions)
- Advanced statistics and analytics with historical data
- Mobile application development with API-first design
- Third-party integrations (golf course APIs, handicap services)
- Multi-organization support with tenant isolation