import { createClient } from '@/utils/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

export interface AuthUser {
  id: string
  email: string
  name: string
  avatar?: string
  role?: string
  emailVerified: boolean
  lastSignInAt?: string
}

export interface AuthState {
  user: AuthUser | null
  session: Session | null
  loading: boolean
  error: string | null
}

export interface AuthError {
  message: string
  code: string
  type: 'AUTH_ERROR' | 'NETWORK_ERROR' | 'VALIDATION_ERROR' | 'UNKNOWN_ERROR'
}

/**
 * Enterprise-grade authentication utility class
 * Provides centralized session management with comprehensive error handling
 */
export class AuthManager {
  private static instance: AuthManager
  private supabase = createClient()
  private authStateListeners: ((state: AuthState) => void)[] = []
  private currentState: AuthState = {
    user: null,
    session: null,
    loading: true,
    error: null
  }

  private constructor() {
    this.initializeAuthStateListener()
  }

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager()
    }
    return AuthManager.instance
  }

  /**
   * Initialize auth state listener with comprehensive error handling
   */
  private initializeAuthStateListener() {
    this.supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        console.log(`[AuthManager] Auth state changed: ${event}`, {
          hasSession: !!session,
          userId: session?.user?.id,
          timestamp: new Date().toISOString()
        })

        const user = session?.user ? this.transformUser(session.user) : null
        
        this.currentState = {
          user,
          session,
          loading: false,
          error: null
        }

        // Notify all listeners
        this.notifyListeners(this.currentState)

        // Handle specific events
        if (event === 'SIGNED_OUT') {
          console.log('[AuthManager] User signed out, clearing state')
          this.clearLocalState()
        }

        if (event === 'TOKEN_REFRESHED') {
          console.log('[AuthManager] Token refreshed successfully')
        }

      } catch (error: any) {
        console.error('[AuthManager] Error in auth state listener:', error)
        this.currentState = {
          user: null,
          session: null,
          loading: false,
          error: this.formatError(error).message
        }
        this.notifyListeners(this.currentState)
      }
    })
  }

  /**
   * Transform Supabase user to our AuthUser format
   */
  private transformUser(user: any): AuthUser {
    return {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.full_name || 
            user.user_metadata?.name || 
            user.email?.split('@')[0] || 
            'User',
      avatar: user.user_metadata?.avatar_url || null,
      role: user.user_metadata?.role || 'user',
      emailVerified: !!user.email_confirmed_at,
      lastSignInAt: user.last_sign_in_at
    }
  }

  /**
   * Subscribe to auth state changes
   */
  public onAuthStateChange(callback: (state: AuthState) => void): () => void {
    this.authStateListeners.push(callback)
    
    // Immediately call with current state
    callback(this.currentState)
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback)
      if (index > -1) {
        this.authStateListeners.splice(index, 1)
      }
    }
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(state: AuthState) {
    this.authStateListeners.forEach(listener => {
      try {
        listener(state)
      } catch (error) {
        console.error('[AuthManager] Error in auth state listener callback:', error)
      }
    })
  }

  /**
   * Get current auth state
   */
  public getCurrentState(): AuthState {
    return { ...this.currentState }
  }

  /**
   * Get current user with retry logic
   */
  public async getCurrentUser(): Promise<AuthUser | null> {
    const MAX_RETRIES = 3
    const RETRY_DELAY = 500

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const { data: { user }, error } = await this.supabase.auth.getUser()
        
        if (error) {
          throw error
        }

        if (user) {
          const authUser = this.transformUser(user)
          console.log(`[AuthManager] Got current user (attempt ${attempt}):`, {
            userId: authUser.id,
            email: authUser.email
          })
          return authUser
        }

        return null

      } catch (error: any) {
        console.warn(`[AuthManager] Get user attempt ${attempt} failed:`, error.message)
        
        if (attempt === MAX_RETRIES) {
          throw this.formatError(error)
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt))
      }
    }

    return null
  }

  /**
   * Check if user is authenticated
   */
  public async isAuthenticated(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser()
      return !!user
    } catch (error) {
      console.error('[AuthManager] Authentication check failed:', error)
      return false
    }
  }

  /**
   * Sign in with email and password
   */
  public async signIn(email: string, password: string): Promise<{ user: AuthUser | null, error: AuthError | null }> {
    try {
      console.log('[AuthManager] Attempting sign in for:', email)
      
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password
      })

      if (error) {
        throw error
      }

      const user = data.user ? this.transformUser(data.user) : null
      
      console.log('[AuthManager] Sign in successful:', {
        userId: user?.id,
        email: user?.email,
        hasSession: !!data.session
      })

      return { user, error: null }

    } catch (error: any) {
      console.error('[AuthManager] Sign in failed:', error)
      return { user: null, error: this.formatError(error) }
    }
  }

  /**
   * Sign up with email and password
   */
  public async signUp(email: string, password: string): Promise<{ user: AuthUser | null, error: AuthError | null }> {
    try {
      console.log('[AuthManager] Attempting sign up for:', email)
      
      const { data, error } = await this.supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password
      })

      if (error) {
        throw error
      }

      const user = data.user ? this.transformUser(data.user) : null
      
      console.log('[AuthManager] Sign up successful:', {
        userId: user?.id,
        email: user?.email,
        needsVerification: !user?.emailVerified
      })

      return { user, error: null }

    } catch (error: any) {
      console.error('[AuthManager] Sign up failed:', error)
      return { user: null, error: this.formatError(error) }
    }
  }

  /**
   * Sign out with comprehensive cleanup
   */
  public async signOut(): Promise<{ error: AuthError | null }> {
    try {
      console.log('[AuthManager] Attempting sign out')
      
      const { error } = await this.supabase.auth.signOut()
      
      if (error) {
        throw error
      }

      this.clearLocalState()
      console.log('[AuthManager] Sign out successful')
      
      return { error: null }

    } catch (error: any) {
      console.error('[AuthManager] Sign out failed:', error)
      return { error: this.formatError(error) }
    }
  }

  /**
   * Clear local state on sign out
   */
  private clearLocalState() {
    // Clear any cached data
    try {
      localStorage.removeItem('user-preferences')
      localStorage.removeItem('dashboard-state')
      // Add other cleanup as needed
    } catch (error) {
      console.warn('[AuthManager] Error clearing local state:', error)
    }
  }

  /**
   * Format errors consistently
   */
  private formatError(error: any): AuthError {
    if (!error) {
      return {
        message: 'Unknown authentication error',
        code: 'UNKNOWN_ERROR',
        type: 'UNKNOWN_ERROR'
      }
    }

    let message = error.message || 'Authentication failed'
    let code = error.code || 'UNKNOWN_ERROR'
    let type: AuthError['type'] = 'AUTH_ERROR'

    // Map common Supabase errors to user-friendly messages
    if (message.includes('Invalid login credentials')) {
      message = 'Email or password is incorrect'
      code = 'INVALID_CREDENTIALS'
    } else if (message.includes('Email not confirmed')) {
      message = 'Please verify your email before signing in'
      code = 'EMAIL_NOT_CONFIRMED'
    } else if (message.includes('User already registered')) {
      message = 'An account with this email already exists'
      code = 'USER_ALREADY_EXISTS'
    } else if (message.includes('Password should be at least')) {
      message = 'Password must be at least 6 characters long'
      code = 'WEAK_PASSWORD'
      type = 'VALIDATION_ERROR'
    } else if (message.includes('Invalid email')) {
      message = 'Please enter a valid email address'
      code = 'INVALID_EMAIL'
      type = 'VALIDATION_ERROR'
    } else if (message.includes('fetch') || message.includes('network')) {
      message = 'Network error. Please check your connection and try again'
      code = 'NETWORK_ERROR'
      type = 'NETWORK_ERROR'
    }

    return { message, code, type }
  }

  /**
   * Refresh session manually
   */
  public async refreshSession(): Promise<{ error: AuthError | null }> {
    try {
      console.log('[AuthManager] Refreshing session manually')
      
      const { data, error } = await this.supabase.auth.refreshSession()
      
      if (error) {
        throw error
      }

      console.log('[AuthManager] Session refreshed successfully')
      return { error: null }

    } catch (error: any) {
      console.error('[AuthManager] Session refresh failed:', error)
      return { error: this.formatError(error) }
    }
  }
}

// Export singleton instance
export const authManager = AuthManager.getInstance()

// Export convenience functions
export const getCurrentUser = () => authManager.getCurrentUser()
export const isAuthenticated = () => authManager.isAuthenticated()
export const signIn = (email: string, password: string) => authManager.signIn(email, password)
export const signUp = (email: string, password: string) => authManager.signUp(email, password)
export const signOut = () => authManager.signOut()
export const onAuthStateChange = (callback: (state: AuthState) => void) => authManager.onAuthStateChange(callback)

// Error mapping utility
export function mapAuthError(message: string): string {
  if (!message) return "Authentication failed"
  if (message.includes("Invalid login credentials")) return "Email or password is incorrect."
  if (message.includes("Email not confirmed")) return "Please verify your email before signing in."
  if (message.includes("User already registered")) return "An account with this email exists. Try signing in."
  if (message.includes("Failed to fetch") || message.includes("504")) return "Network timeout contacting auth server. Try again."
  return message
}

// Type guards
export function isAuthError(error: any): error is AuthError {
  return error && typeof error.message === 'string' && typeof error.code === 'string'
}

export function isAuthUser(user: any): user is AuthUser {
  return user && typeof user.id === 'string' && typeof user.email === 'string'
}
