# AI YouTube Summarizer

This is a Next.js application that uses AI to summarize YouTube videos.

## Supabase Authentication Setup

This project uses Supabase for user authentication. To get it running locally, follow these steps:

### 1. Configure Environment Variables

You'll need to get your Supabase project URL and anon key.

1.  Create a file named `.env.local` in the root of the project.
2.  Add the following content to it:

    ```bash
    NEXT_PUBLIC_SUPABASE_URL=YOUR_PROJECT_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_PUBLIC_KEY
    ```

3.  Replace `YOUR_PROJECT_URL` and `YOUR_ANON_PUBLIC_KEY` with your actual credentials from the Supabase dashboard.

### 2. Install Dependencies

If you haven't already, install the project dependencies:

```bash
npm install
```

### 3. Run the Development Server

Start the local development server:

```bash
npm run dev
```

### 4. Test Authentication

Once the server is running, you can test the authentication flow:

-   Navigate to `http://localhost:3000/auth/sign-up` to create a new account.
-   Navigate to `http://localhost:3000/auth/sign-in` to log in.
-   After logging in, you should be redirected to `http://localhost:3000/dashboard`.
-   Try accessing `/dashboard` when logged out; you should be redirected to the sign-in page.
-   Use the "Sign Out" button in the header to log out.
