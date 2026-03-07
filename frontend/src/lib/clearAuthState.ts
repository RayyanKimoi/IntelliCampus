/**
 * Utility to clear corrupted authentication state
 * 
 * Usage (in browser console):
 * - window.clearAuthState()
 */

export function clearAuthState() {
  if (typeof window === 'undefined') {
    console.error('clearAuthState can only be run in the browser');
    return;
  }

  try {
    console.log('[clearAuthState] Clearing localStorage auth state...');
    localStorage.removeItem('intellicampus-auth');
    console.log('[clearAuthState] ✅ Auth state cleared. Please refresh the page.');
    
    // Optionally reload the page
    const shouldReload = confirm('Auth state cleared. Reload page now?');
    if (shouldReload) {
      window.location.reload();
    }
  } catch (error) {
    console.error('[clearAuthState] Error clearing auth state:', error);
  }
}

// Expose to window for easy console access
if (typeof window !== 'undefined') {
  (window as any).clearAuthState = clearAuthState;
}

/**
 * Check current auth state in localStorage
 */
export function inspectAuthState() {
  if (typeof window === 'undefined') {
    console.error('inspectAuthState can only be run in the browser');
    return;
  }

  try {
    const stored = localStorage.getItem('intellicampus-auth');
    if (!stored) {
      console.log('[inspectAuthState] No auth state found in localStorage');
      return null;
    }

    const parsed = JSON.parse(stored);
    console.log('[inspectAuthState] Current auth state:', {
      hasState: !!parsed.state,
      hasUser: !!parsed.state?.user,
      hasToken: !!parsed.state?.token,
      isAuthenticated: parsed.state?.isAuthenticated,
      userEmail: parsed.state?.user?.email,
      userRole: parsed.state?.user?.role,
      token: parsed.state?.token,
      fullState: parsed
    });
    
    return parsed;
  } catch (error) {
    console.error('[inspectAuthState] Error reading auth state:', error);
    console.log('[inspectAuthState] Raw value:', localStorage.getItem('intellicampus-auth'));
    return null;
  }
}

// Expose to window for easy console access
if (typeof window !== 'undefined') {
  (window as any).inspectAuthState = inspectAuthState;
}


