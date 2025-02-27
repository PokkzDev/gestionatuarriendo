'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * RoleGuard component to protect routes based on user roles
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @param {string[]} props.allowedRoles - Roles that are allowed to access this component
 * @param {string} [props.redirectTo='/'] - Where to redirect if unauthorized
 * @param {React.ReactNode} [props.fallback=null] - What to show while checking authorization
 */
export default function RoleGuard({
  children,
  allowedRoles,
  redirectTo = '/',
  fallback = null
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    // If user is authenticated but doesn't have the required role, redirect
    if (status === 'authenticated') {
      const userRole = session?.user?.role;
      if (!allowedRoles.includes(userRole)) {
        router.push(redirectTo);
      }
    } else if (status === 'unauthenticated') {
      // If user is not authenticated, redirect to login
      router.push('/login');
    }
  }, [status, session, allowedRoles, redirectTo, router]);

  // Show fallback while loading or if not authenticated yet
  if (status === 'loading' || status === 'unauthenticated') {
    return fallback;
  }

  // Check if user has the required role
  const userRole = session?.user?.role;
  if (!allowedRoles.includes(userRole)) {
    return fallback;
  }

  // If user has the required role, render children
  return children;
} 