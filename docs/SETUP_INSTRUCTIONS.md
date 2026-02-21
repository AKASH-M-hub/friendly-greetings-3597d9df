# Setup Instructions

Follow these steps to set up the Chrono project locally.

## Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- A Supabase account

## 1. Clone the Repository

```bash
git clone <repository-url>
cd friendly-greetings-3597d9df
```

## 2. Install Dependencies

Install the required Node.js packages:

```bash
npm install
```

## 3. Environment Configuration

Create a `.env` file in the root directory and add your Supabase credentials. You can use the example below:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

> **Note**: These keys are found in your Supabase Project Settings > API.

## 4. Database Setup

1.  Log in to your Supabase Dashboard.
2.  Go to the **SQL Editor**.
3.  Open the file `src/sql/master_schema.sql` from this project.
4.  Copy the content and run it in the Supabase SQL Editor.
    -   This script creates the necessary tables (`profiles`, `teaching_sessions`, `session_requests`, etc.).
    -   It sets up Row Level Security (RLS) policies.
    -   It creates the `handle_new_user` trigger for user signup.

## 5. Google Authentication (Optional)

To enable Google Sign-In:
1.  Go to Supabase Authentication > Providers > Google.
2.  Enable Google and provide your **Client ID** and **Client Secret** (obtained from Google Cloud Console).
3.  Add the Supabase Callback URL to your Google Cloud Console "Authorized redirect URIs".

## 6. Run the Application

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:8080`.

## Troubleshooting

-   **White Screen / 400 Errors**: Ensure you have run the latest `master_schema.sql`. Old versions of the schema might be missing columns or have incorrect RLS policies.
-   **Auth Errors**: Verify your `.env` variables are correct and that you have restarted the server after changing them.
