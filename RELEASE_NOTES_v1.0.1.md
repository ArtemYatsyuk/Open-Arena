## Open Arena v1.0.1

### Bug Fixes
- Fixed backend crash during deployment
- Fixed SSE streaming for AI responses
- Fixed sidebar layout and resolution issues
- Fixed admin panel 500 errors
- Fixed model selector fallback to `owl-alpha`

### Improvements
- Added settings modal with customization options
- Added admin panel link in sidebar (admin only)
- Improved chat input area styling
- Better error handling for API requests

### Setup
1. Ensure backend is running: `cd backend && npx tsx src/index.ts`
2. Frontend: `cd frontend && npm run dev`

### Default Admin
- Email: `admin@openarena.local`
- Password: `admin123`
