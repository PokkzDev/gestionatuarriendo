import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define which paths are accessible based on user roles
const roleBasedRoutes = {
  // Only PROPIETARIO and AMBOS can access these routes
  propietarioRoutes: ['/mis-propiedades'],
  
  // Only ARRENDATARIO and AMBOS can access these routes
  arrendatarioRoutes: ['/mi-arriendo'],
  
  // Routes that require any authenticated user
  authenticatedRoutes: ['/mis-gastos', '/mi-cuenta'],
  
  // Routes that are public but should redirect authenticated users to home
  publicOnlyRoutes: [],
};

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Ignore API routes and static files
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') || 
    pathname.includes('.') ||
    pathname.startsWith('/images')
  ) {
    return NextResponse.next();
  }
  
  // Get the user token from next-auth
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });

  // Check if user is trying to access a protected propietario route
  if (roleBasedRoutes.propietarioRoutes.some(route => pathname.startsWith(route))) {
    // If not logged in, redirect to login
    if (!token) {
      const url = new URL('/login', request.url);
      return NextResponse.redirect(url);
    }
    
    // If logged in but not propietario or ambos, redirect to home
    if (token.role !== 'PROPIETARIO' && token.role !== 'AMBOS') {
      const url = new URL('/', request.url);
      return NextResponse.redirect(url);
    }
  }
  
  // Check if user is trying to access a protected arrendatario route
  if (roleBasedRoutes.arrendatarioRoutes.some(route => pathname.startsWith(route))) {
    // If not logged in, redirect to login
    if (!token) {
      const url = new URL('/login', request.url);
      return NextResponse.redirect(url);
    }
    
    // If logged in but not arrendatario or ambos, redirect to home
    if (token.role !== 'ARRENDATARIO' && token.role !== 'AMBOS') {
      const url = new URL('/', request.url);
      return NextResponse.redirect(url);
    }
  }
  
  // Check if user is trying to access a route that requires authentication
  if (roleBasedRoutes.authenticatedRoutes.some(route => pathname.startsWith(route))) {
    // If not logged in, redirect to login
    if (!token) {
      const url = new URL('/login', request.url);
      return NextResponse.redirect(url);
    }
  }
  
  // Allow the request to proceed
  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /images (public files)
     * 4. /favicon.ico, etc. (static files)
     */
    '/((?!api|_next|images|[\\w-]+\\.\\w+).*)',
  ],
}; 