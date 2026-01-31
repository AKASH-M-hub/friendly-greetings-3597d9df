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

To get started with the project, please refer to the [Setup Instructions](./SETUP_INSTRUCTIONS.md).

## Project Structure

- `/src/components`: Reusable UI components.
- `/src/pages`: Main application pages (Dashboard, Meeting Room, etc.).
- `/src/hooks`: Custom React hooks (Data fetching, Session logic).
- `/src/sql`: Database schema and migration scripts.
- `/supabase`: Edge functions (if applicable).
