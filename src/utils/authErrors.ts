// Authentication Error Handler
// Maps Supabase error codes to user-friendly messages

export interface AuthError {
  code: string
  message: string
}

/**
 * Get user-friendly error message for authentication errors
 */
export const getAuthErrorMessage = (error: any): string => {
  // Handle Supabase Auth errors
  if (error?.code) {
    switch (error.code) {
      case 'invalid_credentials':
      case 'invalid_grant':
        return 'Invalid email or password. Please check your credentials and try again.'

      case 'email_not_confirmed':
        return 'Your email address has not been confirmed. Please check your inbox for the confirmation email.'

      case 'user_not_found':
        return 'No account found with this email address.'

      case 'weak_password':
        return 'Password is too weak. Please use a stronger password.'

      case 'email_exists':
        return 'An account with this email already exists.'

      case 'over_email_send_rate_limit':
        return 'Too many requests. Please wait a few minutes before trying again.'

      case 'session_not_found':
      case 'refresh_token_not_found':
        return 'Your session has expired. Please login again.'

      case 'token_expired':
        return 'Your session has expired. Please login again.'

      case 'invalid_token':
        return 'Invalid authentication token. Please login again.'

      case 'user_banned':
        return 'Your account has been suspended. Please contact support.'

      case 'network_error':
        return 'Network error. Please check your internet connection and try again.'

      case 'timeout':
        return 'Request timeout. Please try again.'

      default:
        return error.message || 'An authentication error occurred. Please try again.'
    }
  }

  // Handle Edge Function errors
  if (error?.error) {
    return error.error
  }

  // Handle network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return 'Network error. Please check your internet connection and try again.'
  }

  // Handle generic errors
  if (error?.message) {
    return error.message
  }

  return 'An unexpected error occurred. Please try again.'
}

/**
 * Check if error is an authentication error
 */
export const isAuthError = (error: any): boolean => {
  return error?.code || error?.error || error?.message
}

/**
 * Check if error indicates session expiry
 */
export const isSessionExpired = (error: any): boolean => {
  const expiredCodes = [
    'session_not_found',
    'refresh_token_not_found',
    'token_expired',
    'invalid_token'
  ]

  return expiredCodes.includes(error?.code)
}

/**
 * Check if error indicates network issue
 */
export const isNetworkError = (error: any): boolean => {
  return (
    error?.code === 'network_error' ||
    error?.code === 'timeout' ||
    (error instanceof TypeError && error.message.includes('fetch'))
  )
}

/**
 * Error messages for multi-language support
 * TODO: Implement proper i18n for Arabic, French, and Tunisian Dialect
 */
export const ERROR_MESSAGES = {
  en: {
    invalid_credentials: 'Invalid email or password',
    session_expired: 'Your session has expired. Please login again.',
    network_error: 'Network error. Please check your connection.',
    generic_error: 'An unexpected error occurred',
    access_denied: 'Access denied. Admin privileges required.',
    account_inactive: 'Your account is inactive or suspended'
  },
  fr: {
    invalid_credentials: 'Email ou mot de passe invalide',
    session_expired: 'Votre session a expiré. Veuillez vous reconnecter.',
    network_error: 'Erreur réseau. Veuillez vérifier votre connexion.',
    generic_error: 'Une erreur inattendue s\'est produite',
    access_denied: 'Accès refusé. Privilèges administrateur requis.',
    account_inactive: 'Votre compte est inactif ou suspendu'
  },
  ar: {
    invalid_credentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    session_expired: 'انتهت صلاحية جلستك. يرجى تسجيل الدخول مرة أخرى.',
    network_error: 'خطأ في الشبكة. يرجى التحقق من اتصالك.',
    generic_error: 'حدث خطأ غير متوقع',
    access_denied: 'تم رفض الوصول. مطلوب امتيازات المسؤول.',
    account_inactive: 'حسابك غير نشط أو موقوف'
  }
}
