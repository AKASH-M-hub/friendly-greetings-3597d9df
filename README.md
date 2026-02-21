# Chrono - Skill Exchange Platform

Chrono is a time-banking platform where users can teach skills to earn credits and use those credits to learn from others. It features real-time video sessions, a credit mining system, and a comprehensive dashboard for managing teaching and learning activities.

## Features

- **Time Banking System**:
  - Teach to earn 1 credit per minute.
  - Learn to spend 1 credit per minute.
  - Real-time credit transfer during sessions.
- **Live Video Sessions**:
  - Integrated Google Meet support.
  - Timer-based session tracking.
  - Secure room management.
- **Smart Learning Dashboard**:
  - Filter available seminars by category.
  - Request to join sessions.
  - View scheduled classes.
- **Teaching Tools**:
  - Create and manage seminars.
  - Track incoming requests.
  - View session history and earnings.
- **User Profiles**:
  - Expertise declaration.
  - Rating and review system.

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **UI Framework**: Tailwind CSS, Shadcn UI, Framer Motion
- **Backend & Auth**: Supabase (PostgreSQL, Auth, Realtime)
- **Icons**: Lucide React

## Getting Started

To get started with the project, please refer to the [Setup Instructions](./docs/SETUP_INSTRUCTIONS.md).

## Project Structure

```
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Main application pages
│   ├── hooks/          # Custom React hooks
│   ├── contexts/       # React context providers
│   ├── integrations/   # Third-party integrations (Supabase)
│   ├── types/          # TypeScript type definitions
│   └── lib/            # Utility functions
├── supabase/
│   ├── functions/      # Edge functions
│   ├── migrations/     # Database migrations
│   └── sql/            # Database scripts & schemas
├── docs/               # Project documentation
└── public/             # Static assets
```

## Documentation

All project documentation is in the [`docs/`](./docs/) folder:

- [Setup Instructions](./docs/SETUP_INSTRUCTIONS.md)
- [Dependencies](./docs/DEPENDENCIES.md)
- [Deployment Checklist](./docs/DEPLOYMENT_CHECKLIST.md)
- [Quick Deploy Guide](./docs/QUICK_DEPLOY_GUIDE.md)
- [Security Reference](./docs/SECURITY_QUICK_REFERENCE.md)
