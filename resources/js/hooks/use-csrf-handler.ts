import { router } from '@inertiajs/react';
import { useEffect } from 'react';

interface CSRFErrorHandlerOptions {
  onTokenExpired?: () => void;
  onTokenRefreshed?: () => void;
  enableAutoReload?: boolean;
  reloadDelay?: number;
  showNotifications?: boolean;
}

interface CSRFError extends Error {
  response?: {
    status: number;
    data?: {
      message?: string;
      error?: string;
    };
  };
}

/**
 * CSRF Error Handler Hook
 *
 * Handles CSRF token expiration and JWT token refresh scenarios.
 * Provides automatic recovery mechanisms and user notifications.
 */
export function useCSRFHandler(options: CSRFErrorHandlerOptions = {}) {
  const {
    onTokenExpired,
    onTokenRefreshed,
    enableAutoReload = true,
    reloadDelay = 1000,
    showNotifications = true,
  } = options;

  useEffect(() => {
    /**
     * Handle CSRF token expiration errors
     */
    const handleCSRFError = (event: CustomEvent) => {
      const { detail } = event;
      const error = detail?.response;

      // Check for CSRF token expiration (419) or JWT token expiration (401)
      if (error?.status === 419 || error?.status === 401) {
        console.warn('CSRF/JWT token expired, attempting recovery...', {
          status: error.status,
          message: error.data?.message || 'Token expired'
        });

        // Call user-provided callback
        if (onTokenExpired) {
          onTokenExpired();
        }

        // Show user notification
        if (showNotifications) {
          showNotification(
            error.status === 419
              ? 'Session expired. Refreshing...'
              : 'Authentication expired. Please wait...',
            'warning'
          );
        }

        // Attempt token refresh or page reload
        if (enableAutoReload) {
          setTimeout(() => {
            attemptTokenRecovery(error.status);
          }, reloadDelay);
        }
      }
    };

    /**
     * Attempt to recover from token expiration
     */
    const attemptTokenRecovery = async (status: number) => {
      try {
        if (status === 419) {
          // Traditional CSRF token - reload page to get new token
          console.log('Reloading page to obtain new CSRF token...');
          window.location.reload();
        } else if (status === 401) {
          // JWT token - attempt refresh or redirect to login
          console.log('JWT token expired, attempting refresh...');

          // For now, reload page (future: implement JWT refresh)
          // TODO: Implement JWT token refresh endpoint
          window.location.reload();
        }

        if (onTokenRefreshed) {
          onTokenRefreshed();
        }
      } catch (refreshError) {
        console.error('Token recovery failed:', refreshError);

        // Fallback: redirect to login or show error
        if (showNotifications) {
          showNotification('Session recovery failed. Please refresh the page.', 'error');
        }
      }
    };

    /**
     * Show user notification
     */
    const showNotification = (message: string, type: 'warning' | 'error' | 'info') => {
      // Use browser's built-in notification or custom notification system
      if (type === 'error') {
        console.error(message);
        // Could integrate with a toast notification library here
      } else {
        console.warn(message);
      }

      // Optional: Use browser notifications if available
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('StructLogr', {
          body: message,
          icon: '/favicon.ico'
        });
      }
    };

    /**
     * Handle Inertia error events
     */
    const handleInertiaError = (event: CustomEvent) => {
      const { detail } = event;
      if (detail?.response?.status === 419 || detail?.response?.status === 401) {
        handleCSRFError(event);
      }
    };

    // Listen to Inertia error events
    document.addEventListener('inertia:error', handleInertiaError);

    // Also listen to general fetch/axios errors
    const handleGlobalError = (event: ErrorEvent) => {
      // Check if this is a network error that might be CSRF related
      const error = event.error as CSRFError;
      if (error?.response?.status === 419 || error?.response?.status === 401) {
        handleCSRFError(new CustomEvent('csrf-error', { detail: { response: error.response } }));
      }
    };

    window.addEventListener('error', handleGlobalError);

    // Cleanup function
    return () => {
      document.removeEventListener('inertia:error', handleInertiaError);
      window.removeEventListener('error', handleGlobalError);
    };
  }, [onTokenExpired, onTokenRefreshed, enableAutoReload, reloadDelay, showNotifications]);

  /**
   * Manually trigger token refresh
   */
  const refreshToken = async () => {
    try {
      console.log('Manually refreshing token...');

      // For CSRF tokens, reload the page
      if (document.querySelector('meta[name="csrf-token"]')) {
        window.location.reload();
        return;
      }

      // For JWT tokens, call refresh endpoint (future implementation)
      // TODO: Implement JWT refresh logic
      console.warn('JWT refresh not implemented yet, falling back to page reload');
      window.location.reload();
    } catch (error) {
      console.error('Manual token refresh failed:', error);
      throw error;
    }
  };

  /**
   * Get current token status
   */
  const getTokenStatus = () => {
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    const jwtToken = localStorage.getItem('jwt_token'); // Future JWT support

    return {
      hasCSRFToken: !!csrfToken,
      hasJWTToken: !!jwtToken,
      csrfToken,
      jwtToken,
      isExpired: false // Would need validation logic for JWT
    };
  };

  return {
    refreshToken,
    getTokenStatus,
  };
}

// TypeScript declarations for global types
declare global {
  interface Window {
    csrfToken?: string;
    jwtToken?: string;
  }

  interface CustomEvent {
    detail?: {
      response?: {
        status: number;
        data?: any;
      };
    };
  }
}

export default useCSRFHandler;