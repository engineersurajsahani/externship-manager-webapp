# Externship Manager — Frontend

A modern React-based frontend application for the Externship Manager project. Built with React 18, Tailwind CSS, and Framer Motion for a responsive and interactive user experience. Features include role-based dashboards, project management, attendance tracking, real-time chat, and comprehensive user management.

## 🚀 Quick Start

1. **Navigate to Frontend**: `cd frontend-react/`
2. **Install Dependencies**: `npm install`
3. **Setup Environment**: Copy `.env.example` to `.env` and configure
4. **Start Backend**: Ensure backend server is running on port 5050
5. **Start Frontend**: `npm start`
6. **Access App**: Open `http://localhost:3000`

## 📋 Prerequisites

### Required Software
- **Node.js**: v16.0.0 or higher (v18+ recommended for optimal React 18 support)
- **npm**: v7.0.0 or higher (comes with Node.js)
- **Backend API**: Externship Manager backend running on port 5050

### System Requirements
- **Operating System**: macOS, Linux, or Windows
- **Memory**: 1GB RAM minimum (2GB+ recommended)
- **Storage**: 500MB free space for node_modules
- **Browser**: Chrome 88+, Firefox 85+, Safari 14+, Edge 88+

### Backend Dependency
The frontend requires the Externship Manager backend API to be running:
- **Default Backend URL**: `http://localhost:5050/api`
- **Setup Instructions**: See `../backend/README.md`
- **Required Backend Features**: Authentication, user management, project APIs

## ⚙️ Environment Configuration

Create a `.env` file in the `frontend-react/` directory:

```bash
# API Configuration
REACT_APP_API_URL=http://localhost:5050/api

# Application Configuration
REACT_APP_NAME=Externship Manager
REACT_APP_VERSION=1.0.0

# Development Settings
GENERATE_SOURCEMAP=true
SKIP_PREFLIGHT_CHECK=true

# Optional: Custom Configuration
REACT_APP_ENABLE_ANALYTICS=false
REACT_APP_DEBUG_MODE=false
```

### Environment Variables Explained
- `REACT_APP_API_URL`: Backend API base URL (must start with REACT_APP_)
- `REACT_APP_NAME`: Application display name
- `REACT_APP_VERSION`: Application version
- `GENERATE_SOURCEMAP`: Enable source maps for debugging (development only)
- `SKIP_PREFLIGHT_CHECK`: Skip React preflight checks for conflicting dependencies

## 📦 Installation & Dependencies

### Core Dependencies
```bash
npm install
```

**Production Dependencies:**
- **react** (^18.2.0): Core React library
- **react-dom** (^18.2.0): React DOM rendering
- **react-router-dom** (^6.20.0): Client-side routing and navigation
- **axios** (^1.6.0): HTTP client for API requests
- **framer-motion** (^10.16.0): Animation and gesture library
- **react-icons** (^4.12.0): Popular icon libraries (Fi, Fa, etc.)
- **@heroicons/react** (^2.0.18): Heroicons icon library
- **recharts** (^2.10.0): Chart and data visualization library

**UI & Styling:**
- **tailwindcss** (^3.3.0): Utility-first CSS framework
- **autoprefixer** (^10.4.16): CSS vendor prefixing
- **postcss** (^8.4.31): CSS processing

**Development Dependencies:**
- **react-scripts** (5.0.1): Create React App build scripts with testing utilities included

### Manual Installation (if needed)
```bash
# Core React and routing
npm install react react-dom react-router-dom

# HTTP client and animations
npm install axios framer-motion

# UI components and icons
npm install react-icons

# Tailwind CSS and plugins
npm install -D tailwindcss @tailwindcss/forms autoprefixer postcss

# Testing utilities
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

## 🚀 Running the Application

### Development Mode (Recommended)
```bash
npm start
```
- Opens `http://localhost:3000` automatically
- Hot reloading enabled for instant updates
- Source maps enabled for debugging
- React DevTools support

### Production Build
```bash
npm run build
```
- Creates optimized production build in `build/` directory
- Minified and compressed assets
- Ready for deployment

### Available Scripts
- `npm start`: Start development server with hot reload
- `npm run build`: Build production-ready application
- `npm test`: Run test suite in interactive watch mode
- `npm run eject`: Eject from Create React App (irreversible)

### Development Server Details
- **URL**: `http://localhost:3000`
- **Hot Reload**: Automatic browser refresh on file changes
- **Error Overlay**: In-browser error display during development
- **Proxy**: API requests automatically proxied to backend

## 🏗️ Project Architecture

### Directory Structure
```
frontend-react/
├── public/
│   ├── index.html           # Main HTML template
│   ├── manifest.json        # PWA manifest
│   └── reset-data.html      # Database reset utility
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Base UI components (Button, Card, Input)
│   │   ├── forms/          # Form components
│   │   ├── modals/         # Modal dialogs
│   │   ├── widgets/        # Dashboard widgets
│   │   └── common/         # Common components
│   ├── contexts/           
│   │   └── AuthContext.jsx # Authentication state management
│   ├── pages/              # Main application pages
│   │   ├── Dashboard.jsx   # Role-based dashboard
│   │   ├── Login.jsx       # Authentication page
│   │   ├── Projects.jsx    # Project management
│   │   ├── Attendance.jsx  # Attendance tracking
│   │   ├── DailyUpdates.jsx # Daily progress updates
│   │   ├── Chat.jsx        # Real-time messaging
│   │   └── UserManagement.jsx # User administration
│   ├── services/
│   │   └── api.js          # API client with interceptors
│   ├── utils/              # Utility functions and helpers
│   ├── App.jsx             # Main application component
│   ├── index.js            # Application entry point
│   └── index.css           # Global styles and Tailwind imports
├── tailwind.config.js      # Tailwind CSS configuration
├── postcss.config.js       # PostCSS configuration
└── package.json            # Dependencies and scripts
```

### Key Features
- **Role-Based UI**: Different interfaces for Admin, PM, TL, Intern
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Real-time Updates**: WebSocket integration for chat and notifications
- **Authentication**: JWT-based auth with automatic token refresh
- **State Management**: React Context for global state
- **Routing**: Protected routes with role-based access control
- **Animations**: Smooth transitions with Framer Motion
- **Form Handling**: Comprehensive form validation and submission

## 🔐 Authentication & Access Control

### Demo Accounts (Development)
After running the backend seed script, use these credentials:

**Admin Access:**
- Email: `admin@example.com`
- Password: `admin123`
- Features: Full system access, user management, all reports

**Project Manager:**
- Email: `pm@example.com`
- Password: `pm123456`
- Features: Project creation, team assignment, project reports

**Team Leader:**
- Email: `tl@example.com`
- Password: `tl123456`
- Features: Team management, progress tracking, attendance review

**Intern:**
- Email: `intern1@example.com`
- Password: `intern123`
- Features: Daily updates, attendance marking, project participation

### Authentication Flow
1. **Login**: User enters credentials on login page
2. **Token Generation**: Backend returns JWT access + refresh tokens
3. **Storage**: Tokens stored in localStorage with user data
4. **API Requests**: Automatic token attachment via Axios interceptors
5. **Token Refresh**: Automatic renewal when access token expires
6. **Protected Routes**: Role validation on sensitive pages

### Security Features
- **JWT Tokens**: Secure authentication with automatic refresh
- **Role-Based Access**: UI components adapt to user permissions
- **Protected Routes**: Navigation guards for sensitive pages
- **Token Validation**: Client-side token expiration checking
- **Secure Storage**: Proper localStorage handling with cleanup

## 🎨 UI Components & Styling

### Design System
- **Color Palette**: Tailwind CSS color system with custom theme
- **Typography**: System font stack with proper hierarchy
- **Spacing**: Consistent spacing using Tailwind scale
- **Components**: Reusable component library in `src/components/ui/`

### Key UI Components
- **Button**: Various sizes, variants, and loading states
- **Card**: Container component with optional glass effect
- **Input**: Form inputs with validation and icons
- **Modal**: Overlay dialogs with animations
- **Loading**: Spinner and skeleton loading states
- **Toast**: Notification system for user feedback

### Responsive Design
- **Mobile First**: Designed for mobile devices first
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Flexible Layouts**: CSS Grid and Flexbox for adaptable designs
- **Touch Friendly**: Appropriate touch targets and interactions

## 📊 Pages & Functionality

### Dashboard (`/dashboard`)
- **Role-specific widgets**: Different content based on user role
- **Statistics cards**: Key metrics and KPIs
- **Recent activity**: Latest updates and notifications
- **Quick actions**: Frequently used features

### Projects (`/projects`)
- **Project listing**: View all projects with filtering
- **Project creation**: Add new projects (Admin/PM only)
- **Team assignment**: Assign users to projects
- **Project details**: Comprehensive project information

### Daily Updates (`/daily-updates`)
- **Update submission**: Submit daily progress reports
- **Update history**: View historical updates with filtering
- **Progress tracking**: Monitor individual and team progress
- **Export functionality**: Download updates as reports

### Attendance (`/attendance`)
- **Attendance marking**: Mark daily attendance
- **Attendance history**: View attendance records
- **Statistics**: Attendance analytics and trends
- **Calendar view**: Visual attendance overview

### Chat (`/chat`)
- **Project-based messaging**: Chat within project teams
- **Real-time communication**: Instant message delivery
- **Message history**: Persistent chat history
- **File sharing**: Attachment support (if implemented)

### User Management (`/users`) - Admin Only
- **User listing**: View all system users
- **User creation**: Add new users with role assignment
- **User editing**: Modify user information and roles
- **User deactivation**: Manage user access

## 🔧 Configuration & Customization

### Tailwind CSS Configuration
```javascript
// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Custom color palette
      },
      fontFamily: {
        // Custom fonts
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
  ]
}
```

### API Client Configuration
```javascript
// src/services/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5050/api';

// Axios configuration with interceptors
// - Request interceptor: Adds authentication headers
// - Response interceptor: Handles token refresh and errors
```

## 🔧 Troubleshooting

### Common Issues

**Backend Connection Failed**
```bash
# Verify backend is running
curl http://localhost:5050/api/health

# Check API URL in .env
REACT_APP_API_URL=http://localhost:5050/api
```

**Build Errors**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear React cache
npm start -- --reset-cache
```

**Authentication Issues**
```bash
# Clear browser localStorage
localStorage.clear()

# Verify backend JWT configuration
# Check token expiration and refresh logic
```

**Styling Issues**
```bash
# Rebuild Tailwind CSS
npm run build:css

# Clear browser cache
# Hard refresh with Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
```

### Development Tips

**Hot Reloading**
- Save files to see instant updates
- Component state is preserved during updates
- CSS changes apply immediately

**Debugging Tools**
- **React DevTools**: Browser extension for component inspection
- **Redux DevTools**: If Redux is added later
- **Network Tab**: Monitor API requests and responses
- **Console Logs**: Use `console.log()` for debugging

**Performance Optimization**
- **Code Splitting**: Implemented with React.lazy()
- **Image Optimization**: Use appropriate formats and sizes
- **Bundle Analysis**: `npm run build` shows bundle size analysis

## 🚀 Production Deployment

### Build Process
```bash
# Create production build
npm run build

# Serve build locally for testing
npx serve -s build
```

### Deployment Options

**Static Hosting (Recommended)**
- **Netlify**: Drag and drop `build/` folder
- **Vercel**: Connect Git repository for automatic deployments
- **GitHub Pages**: Use `gh-pages` package for easy deployment

**Web Servers**
- **Nginx**: Serve static files with proper routing configuration
- **Apache**: Configure `.htaccess` for single-page application routing

### Environment Variables for Production
```bash
# Production .env
REACT_APP_API_URL=https://your-api-domain.com/api
REACT_APP_NAME=Externship Manager
REACT_APP_VERSION=1.0.0
GENERATE_SOURCEMAP=false
```

### Performance Considerations
- **Code Splitting**: Automatic with Create React App
- **Asset Optimization**: Images, fonts, and CSS are optimized
- **Caching**: Proper cache headers for static assets
- **CDN**: Consider using CDN for faster global delivery

## 🧪 Testing

### Running Tests
```bash
# Run all tests in watch mode
npm test

# Run tests once
npm test -- --watchAll=false

# Run with coverage
npm test -- --coverage
```

### Testing Structure
- **Unit Tests**: Individual component testing
- **Integration Tests**: Component interaction testing
- **E2E Tests**: Full user journey testing (if implemented)

### Testing Tools
- **Jest**: JavaScript testing framework
- **React Testing Library**: React component testing utilities
- **User Event**: Simulate user interactions
