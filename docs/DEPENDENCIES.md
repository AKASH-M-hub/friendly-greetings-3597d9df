# Project Dependencies

## Production Dependencies

These packages are required for the application to run.

### Core Framework
- `react`: ^18.3.1
- `react-dom`: ^18.3.1
- `react-router-dom`: ^6.30.1 - Routing
- `vite`: ^5.4.19 - Build tool

### Backend & Data
- `@supabase/supabase-js`: ^2.93.3 - Supabase client
- `@tanstack/react-query`: ^5.83.0 - Data fetching state management
- `zod`: ^3.25.76 - Schema validation
- `react-hook-form`: ^7.61.1 - Form handling

### UI Components & Styling
- `tailwindcss`: ^3.4.17 - Utility-first CSS
- `framer-motion`: ^12.29.2 - Animations
- `lucide-react`: ^0.462.0 - Icons
- `sonner`: ^1.7.4 - Toast notifications
- `class-variance-authority`: ^0.7.1 - Component variants
- `clsx`, `tailwind-merge`: Class name utilities

### Radix UI Primitives (Headless UI)
- `@radix-ui/react-dialog`
- `@radix-ui/react-dropdown-menu`
- `@radix-ui/react-label`
- `@radix-ui/react-slot`
- `@radix-ui/react-switch`
- `@radix-ui/react-tabs`
- `@radix-ui/react-avatar`
- ...and others (see `package.json` for full list)

### Utilities
- `date-fns`: ^3.6.0 - Date formatting
- `jspdf`: ^4.0.0 - PDF generation
- `recharts`: ^2.15.4 - Charting library

## Development Dependencies

Tools used for building and testing.

- `typescript`: ^5.8.3
- `eslint`: ^9.32.0 - Linting
- `vitest`: ^3.2.4 - Testing framework
- `autoprefixer`, `postcss` - CSS processing
