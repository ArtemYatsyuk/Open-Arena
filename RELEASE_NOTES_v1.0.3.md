## Open Arena v1.0.3

### NVIDIA Integration
- **New Model**: NVIDIA Nemotron Nano 30B reasoning model
- **API Base**: https://integrate.api.nvidia.com/v1
- **Model ID**: nvidia/nemotron-3-nano-omni-30b-a3b-reasoning
- **Context Window**: 32,000 tokens
- **Streaming**: Enabled

### Bug Fixes
- Fixed Vite WebSocket HMR connection issues
- Improved error handling for API failures
- Fixed JSON parsing errors on failed requests
- Added global error handlers to prevent backend crashes

### Improvements
- Updated ModelSelector with NVIDIA branding and colors
- Added NVIDIA-specific API headers for compatibility
- Better error messages for API failures
- All admin components now show error messages instead of crashing

### Setup
1. Ensure backend is running: `cd backend && npx tsx src/index.ts`
2. Frontend: `cd frontend && npm run dev`

### Default Admin
- Email: `admin@openarena.local`
- Password: `admin123`
