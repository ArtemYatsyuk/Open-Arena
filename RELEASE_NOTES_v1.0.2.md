## Open Arena v1.0.2

### Critical Bug Fixes
- Fixed 500 Internal Server Errors on all API endpoints
- Fixed JSON parsing errors when server returns error responses
- Added global error handlers to prevent backend crashes
- Fixed Vite proxy configuration with better error logging

### Improvements
- Added `fetchJson` helper with proper error handling
- All admin components now show error messages instead of crashing
- Model selector fallback to `owl-alpha` when API fails
- Better error messages for API failures
- Unhandled exception and rejection handlers in backend

### Setup
1. Ensure backend is running: `cd backend && npx tsx src/index.ts`
2. Frontend: `cd frontend && npm run dev`

### Default Admin
- Email: `admin@openarena.local`
- Password: `admin123`
