import { NextResponse, type NextRequest } from 'next/server'
import { createServer } from '@/lib/supabase/server'

export async function middleware(request: NextRequest) {
  const supabase = await createServer()
  const response = NextResponse.next()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Redirect unauthenticated users from protected routes
  if (!user && pathname === '/dashboard') {
    return NextResponse.redirect(new URL('/auth/sign-in', request.url))
  }

  // Redirect authenticated users from auth routes
  if (user && (pathname === '/auth/sign-in' || pathname === '/auth/sign-up')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
