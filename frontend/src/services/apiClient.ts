const API_BASE_URL = '/api';

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    // In development mode, always use dev mock token if no real token exists
    const isDevelopment = true;
    
    try {
      const stored = localStorage.getItem('intellicampus-auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        const token = parsed.state?.token || null;
        if (token) return token;
      }
      
      // If no token in localStorage and in dev mode, return dev mock token
      if (isDevelopment) {
        return 'dev-token-mock-authentication';
      }
      
      return null;
    } catch {
      // On error, still return dev token in dev mode
      if (isDevelopment) {
        return 'dev-token-mock-authentication';
      }
      return null;
    }
  }

  async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const token = this.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const contentType = response.headers.get('content-type') ?? '';
    let data: any = null;
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: text || `Request failed with status ${response.status}` };
      }
    }

    if (!response.ok) {
      // In development mode, never redirect to login - just throw the error
      const isDevelopment = true; // Match authStore.ts setting
      
      // Only redirect to login for auth token issues, not for permission errors
      if (response.status === 401 && typeof window !== 'undefined' && !isDevelopment) {
        const authErrorPatterns = [
          'Authentication required',
          'Invalid or expired token',
          'Provide a Bearer token'
        ];
        const isAuthTokenError = authErrorPatterns.some(pattern => 
          data?.error?.includes(pattern)
        );
        
        if (isAuthTokenError) {
          console.warn('[API] Token authentication failed, redirecting to login');
          try { localStorage.removeItem('intellicampus-auth'); } catch {}
          // Use setTimeout to allow any pending state updates to complete
          setTimeout(() => {
            window.location.href = '/auth/login';
          }, 100);
        }
      }
      
      // Improved error logging with proper stringification
      const errorDetails = {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        endpoint: endpoint,
        method: options.method || 'GET',
        errorMessage: data?.error || data?.message,
        responseData: data
      };
      
      if (isDevelopment) {
        console.error('[API] Request failed:', JSON.stringify(errorDetails, null, 2));
      } else {
        console.error('[API] Request failed:', {
          status: response.status,
          endpoint: endpoint,
          error: data?.error || data?.message
        });
      }
      
      throw new Error(data?.error || data?.message || `Request failed with status ${response.status}`);
    }

    return data;
  }

  get<T = any>(endpoint: string, params?: Record<string, any>) {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }
    return this.request<T>(url, { method: 'GET' });
  }

  post<T = any>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, { method: 'POST', body });
  }

  put<T = any>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, { method: 'PUT', body });
  }

  patch<T = any>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, { method: 'PATCH', body });
  }

  delete<T = any>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async uploadFile<T = any>(endpoint: string, formData: FormData): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    const contentType = response.headers.get('content-type') ?? '';
    let data: any = null;
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { error: await response.text() };
    }
    if (!response.ok) {
      throw new Error(data?.error || `Upload failed with status ${response.status}`);
    }
    return (data?.data ?? data) as T;
  }
}

export const api = new ApiClient(API_BASE_URL);
