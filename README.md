# Externship Manager — Frontend

A modern, responsive React-based frontend application built with React 18, Tailwind CSS, and Framer Motion. Features role-based dashboards, project management, real-time chat via Socket.IO, attendance tracking, daily progress updates, and comprehensive user management.

## 🚀 Quick Start

```bash
cd frontend-react
npm install
npm start
```

**Application will be available at:** `http://localhost:3000`

## 📋 Prerequisites

- **Node.js**: v16+ (v18+ recommended for React 18)
- **npm**: v7.0.0+
- **Backend API**: Externship Manager backend running on `http://localhost:5050`

## ⚙️ Environment Configuration

Create `.env` file in the `frontend-react/` directory:

```bash
# API Configuration
REACT_APP_API_URL=http://localhost:5050/api

# App Configuration
REACT_APP_NAME=Externship Manager
REACT_APP_VERSION=1.0.0

# Development Settings
GENERATE_SOURCEMAP=true
SKIP_PREFLIGHT_CHECK=true
```

### Environment Variables Explained
- `REACT_APP_API_URL`: Backend API base URL (must start with `REACT_APP_`)
- `REACT_APP_NAME`: Application display name
- `REACT_APP_VERSION`: Current version number
- `GENERATE_SOURCEMAP`: Enable/disable source maps (`false` for production)
- `SKIP_PREFLIGHT_CHECK`: Skip React dependency conflict checks

## 📦 Installation

### All Dependencies
```bash
npm install
```

### Core Dependencies
- **react** (^18.2.0): Core React library
- **react-dom** (^18.2.0): React DOM rendering
- **react-router-dom** (^6.20.0): Client-side routing
- **axios** (^1.6.0): HTTP client with interceptors
- **socket.io-client** (^4.8.1): Real-time messaging
- **framer-motion** (^10.16.0): Animations and gestures
- **react-icons** (^4.12.0): Icon library
- **@heroicons/react** (^2.0.18): Heroicons
- **recharts** (^2.10.0): Charts and data visualization

### UI & Styling
- **tailwindcss** (^3.3.0): Utility-first CSS framework
- **autoprefixer** (^10.4.16): CSS vendor prefixing
- **postcss** (^8.4.31): CSS processing

### Development
- **react-scripts** (5.0.1): Create React App tooling

## 🏃 Running the Application

### Development Mode
```bash
npm start
```
- Opens `http://localhost:3000` automatically
- Hot reload enabled
- Source maps for debugging
- React DevTools support

### Production Build
```bash
npm run build
```
- Creates optimized build in `build/` folder
- Minified and compressed assets
- Ready for deployment

### Available Scripts
- `npm start`: Start development server
- `npm run build`: Build for production
- `npm test`: Run test suite
- `npm run lint`: Lint code
- `npm run lint:fix`: Auto-fix linting issues

## 🏗️ Project Architecture

```
frontend-react/
├── public/
│   ├── index.html           # Main HTML template
│   └── manifest.json        # PWA manifest
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Base components (Button, Card, Input, Modal)
│   │   ├── forms/          # Form components
│   │   ├── modals/         # Modal dialogs (ProjectModal, UserModal)
│   │   ├── widgets/        # Dashboard widgets
│   │   └── common/         # Common components
│   ├── contexts/
│   │   └── AuthContext.jsx # Authentication state management
│   ├── pages/              # Main application pages
│   │   ├── Dashboard.jsx   # Role-based dashboard
│   │   ├── Login.jsx       # Authentication page
│   │   ├── Projects.jsx    # Project management
│   │   ├── Attendance.jsx  # Attendance tracking
│   │   ├── DailyUpdates.jsx # Progress updates
│   │   ├── Chat.jsx        # Real-time messaging
│   │   └── UserManagement.jsx # User admin (Admin only)
│   ├── services/
│   │   ├── api.js          # Axios instance with interceptors
│   │   └── socketConfig.js # Socket.IO configuration
│   ├── utils/              # Helper functions
│   ├── App.jsx             # Main app component with routing
│   ├── index.jsx           # Application entry point
│   └── index.css           # Global styles + Tailwind imports
├── tailwind.config.js      # Tailwind configuration
├── postcss.config.js       # PostCSS configuration
└── package.json            # Dependencies and scripts
```

## 🔐 Authentication & Access Control

### Demo Accounts
After running backend seed script, use these credentials:

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Admin** | `admin@example.com` | `admin123` | Full system access, user management |
| **Project Manager** | `pm@example.com` | `pm123456` | Project creation, team management |
| **Team Leader** | `tl@example.com` | `tl123456` | Team oversight, progress tracking |
| **Intern** | `intern1@example.com` | `intern123` | Daily updates, attendance, projects |

### Authentication Flow
1. **Login**: User enters credentials on `/login`
2. **Token Storage**: JWT tokens stored in localStorage:
   - `token` (access token)
   - `refreshToken` (refresh token)
   - `userEmail` and `userData` (user info)
3. **Auto-Injection**: Axios interceptor adds `Authorization: Bearer <token>` to all requests
4. **Auto-Refresh**: On 401 error, automatically attempts `POST /auth/refresh`
5. **Session Management**: Invalid tokens redirect to login page

### Security Features
- ✅ JWT-based authentication with automatic refresh
- ✅ Role-based UI rendering and route protection
- ✅ Secure token storage with cleanup on logout
- ✅ Client-side token expiration checking
- ✅ Protected routes with navigation guards

## 📱 Pages & Features

### 1. Dashboard (`/dashboard`)
**Role-Specific Interface**
- **Intern**: Submit updates, view attendance, access projects
- **Team Leader**: Team overview, update reviews, attendance stats
- **Project Manager**: Project stats, team management, analytics
- **Admin**: System overview, user stats, all reports

**Features:**
- Quick action buttons
- Real-time statistics
- Recent activity feed
- Refresh button for live data

---

### 2. Projects (`/projects`)
**Permissions:**
- **Admin**: Full CRUD access to all projects
- **Project Manager**: Create/manage own projects
- **Team Leader**: View assigned projects
- **Intern**: View assigned projects only

**Features:**
- Create new projects with details
- Edit/delete projects (Admin/PM)
- Assign/unassign team members
- Archive/unarchive projects
- View project details and timelines
- Set weekly goals

**API Calls:**
- `GET /projects` - List projects
- `POST /projects` - Create project
- `PUT /projects/:id` - Update project
- `PUT /projects/:id/assign` - Assign users
- `PUT /projects/:id/unassign` - Remove users
- `PUT /projects/:id/archive` - Toggle archive

---

### 3. Daily Updates (`/daily-updates`)
**Submit Update** (`/daily-updates/submit`)
- Required fields: `workDone`, `planForTomorrow`
- Optional: `challenges`, `attachments`, `project`
- Auto-loads today's update if exists
- Supports file uploads via FormData
- Automatically marks attendance

**View Updates**
- **Interns**: Project-specific cards with quick submit
- **TL/PM/Admin**: Filtered list view with date/project/user filters
- Review capability for managers
- Export functionality

**API Calls:**
- `POST /updates` - Submit/update today's update
- `GET /updates/my` - Get user's updates
- `GET /updates/today` - Check today's update
- `GET /updates/team` - Team updates (TL+)
- `PUT /updates/:id/review` - Review update (TL+)

---

### 4. Attendance (`/attendance`)
**Views:**
- **Interns**: Personal calendar view
- **Team Leaders**: Team attendance with project breakdowns
- **Admins**: System-wide reports

**Features:**
- Calendar visualization
- Attendance percentage
- Monthly/yearly statistics
- Manual attendance marking (TL+)
- Report generation (Admin)

**API Calls:**
- `GET /attendance/my` - User's attendance
- `GET /attendance/user/:userId` - Specific user (TL+)
- `POST /attendance/mark` - Manual marking (TL+)
- `GET /attendance/stats` - Project stats (PM+)
- `GET /attendance/report` - Global report (Admin)

---

### 5. Chat (`/chat`)
**Real-time Messaging** (Socket.IO)
- Project-based chat rooms
- Message history persistence
- Typing indicators
- Online user count
- Real-time message delivery
- User role badges

**Features:**
- Left panel: Project list
- Right panel: Message feed
- Send text messages
- File attachments support
- Auto-scroll to latest message
- User presence tracking

**API Calls:**
- `GET /chat/:projectId/messages` - Load history (up to 1000)
- `POST /chat/:projectId/messages` - Send message

**Socket Events:**
- `join-project` - Join chat room
- `send-message` - Send message
- `new-message` - Receive message
- `typing-start` / `typing-stop` - Typing indicators
- `user-joined` / `user-left` - Presence updates

---

### 6. User Management (`/users`)
**Admin Only**
- Create users with role assignment
- Edit user details
- Toggle active/inactive status
- Delete users (cannot delete self)
- Filter by role

**API Calls:**
- `GET /users` - List all users
- `POST /users` - Create user
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user
- `GET /users/role/:role` - Filter by role

---

## 🎨 UI Components & Styling

### Design System
- **Framework**: Tailwind CSS utility-first approach
- **Typography**: System font stack with proper hierarchy
- **Spacing**: Consistent Tailwind spacing scale
- **Colors**: Custom palette with role-based theming
- **Animations**: Framer Motion for smooth transitions

### Reusable Components
Located in `src/components/ui/`:
- **Button**: Multiple variants, sizes, loading states
- **Card**: Container with optional glass effect
- **Input**: Form inputs with validation and icons
- **Modal**: Overlay dialogs with animations
- **Loading**: Spinner and skeleton states
- **Toast**: Notification system


## 🔧 API Integration

### Axios Configuration (`src/services/api.js`)

**Base Setup:**
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5050/api';
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});
```

**Request Interceptor:**
- Automatically adds `Authorization: Bearer <token>` header
- Retrieves token from localStorage

**Response Interceptor:**
- Handles 401 errors with automatic token refresh
- Retries failed requests after refresh
- Redirects to login on refresh failure

### API Service Methods
All available in `apiService` object:
- Authentication: `login()`, `register()`, `refreshToken()`, `logout()`
- Users: `getAllUsers()`, `createUser()`, `updateUser()`, `deleteUser()`
- Projects: `getAllProjects()`, `createProject()`, `assignUserToProject()`
- Updates: `submitDailyUpdate()`, `getMyUpdates()`, `reviewUpdate()`
- Attendance: `getMyAttendance()`, `markAttendance()`, `getAttendanceStats()`
- Chat: `getProjectMessages()`, `sendMessage()`

## 💬 Real-time Chat (Socket.IO)

### Socket Configuration (`src/services/socketConfig.js`)

**Connection:**
```javascript
const socket = io('http://localhost:5050', {
  auth: { token: localStorage.getItem('token') }
});
```

**Event Handling:**
- Join project room on chat page load
- Send messages via socket
- Receive messages in real-time
- Track typing indicators
- Monitor user presence

## 🔄 Common User Flows

### Login → Dashboard
1. User enters credentials on `/login`
2. Frontend calls `POST /auth/login`
3. Backend returns tokens and user data
4. Tokens stored in localStorage
5. User redirected to `/dashboard`

### Submit Daily Update
1. Navigate to `/daily-updates/submit`
2. Fill required fields (workDone, planForTomorrow)
3. Optionally select project and add attachments
4. Click Submit → `POST /updates`
5. Backend automatically marks attendance
6. Success notification displayed

### Project Manager: Create & Assign Project
1. Go to `/projects` → Click "New Project"
2. Fill project details → `POST /projects`
3. Open team assignment modal
4. Select users and roles
5. Submit → `PUT /projects/:id/assign`
6. Users now see project in their list

### Team Leader: Review Updates
1. Navigate to `/daily-updates`
2. Filter by team/project
3. Click on update to open details
4. Add review comment and rating
5. Submit → `PUT /updates/:id/review`

## 🐛 Troubleshooting

### Backend Connection Failed
```bash
# Verify backend is running
curl http://localhost:5050/api/health

# Check REACT_APP_API_URL in .env
echo $REACT_APP_API_URL
```

### Authentication Issues
```javascript
// Clear localStorage in browser console
localStorage.clear()

// Check token expiration
const token = localStorage.getItem('token');
console.log(JSON.parse(atob(token.split('.')[1])));
```

### Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear React cache
npm start -- --reset-cache
```

### Styling Issues
```bash
# Verify Tailwind is processing
npm run build

# Check tailwind.config.js content paths
# Clear browser cache (Cmd/Ctrl + Shift + R)
```

### Socket.IO Connection Issues
- Verify backend Socket.IO server is running
- Check CORS configuration in backend
- Ensure token is valid and not expired
- Check browser console for socket errors

## 🚀 Production Deployment

### Build Process
```bash
# Create production build
npm run build

# Test build locally
npx serve -s build
```

### Production Environment
Create `.env.production`:
```bash
REACT_APP_API_URL=https://your-api-domain.com/api
REACT_APP_NAME=Externship Manager
REACT_APP_VERSION=1.0.0
GENERATE_SOURCEMAP=false
```

### Deployment Options

**Static Hosting (Recommended):**
- **Netlify**: Drag-drop `build/` folder or connect Git repo
- **Vercel**: Connect Git repository for auto-deployment
- **GitHub Pages**: Use `gh-pages` package

**Web Servers:**
- **Nginx**: Serve static files with SPA routing
- **Apache**: Configure `.htaccess` for React Router

### Nginx Configuration Example
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    root /path/to/build;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 🧪 Testing

### Run Tests
```bash
# Interactive watch mode
npm test

# Run once
npm test -- --watchAll=false

# With coverage
npm test -- --coverage
```

