import axios from 'axios'
import { resolveErrorDetails } from './errorCatalog'

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true
})

export function isUserBannedError(error) {
  return error?.response?.status === 403 && error?.response?.data?.code === 'USER_BANNED';
}

export function getBanPayload(error) {
  return error?.response?.data?.ban || null;
}

export function redirectToBannedPage() {
  if (typeof window === 'undefined') {
    return;
  }

  if (window.location.pathname !== '/banned') {
    window.location.href = '/banned';
  }
}

export function isAuthPage() {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname;
  return path === '/auth' || path.startsWith('/auth/');
}

/**
 * Returns a clean error message string for legacy callers and UI inputs.
 */
export function getApiErrorMessage(error, fallback = 'Something went wrong') {
  return resolveErrorDetails(error, fallback).message;
}

/**
 * Returns a formatted error string including diagnostic code and cause explanation.
 */
export function getFormattedApiError(error, fallback = 'Something went wrong') {
  const details = resolveErrorDetails(error, fallback);
  return `[${details.code}] ${details.message} (${details.cause})`;
}

/**
 * Returns the full structured error diagnostic object.
 */
export function getApiErrorObject(error, fallback = 'Something went wrong', context = {}) {
  return resolveErrorDetails(error, fallback, context);
}

export function showApiErrorToast(toast, error, fallback, title = 'Error', context = {}) {
  const details = resolveErrorDetails(error, fallback, context);
  
  if (isAuthPage()) {
    toast({
      title,
      description: details.message,
      variant: 'destructive',
    });
    return;
  }

  toast({
    title,
    description: details.message,
    errorCode: details.code,
    cause: details.cause,
    suggestion: details.suggestion,
    errorDetails: details.rawDetails,
    variant: 'destructive',
  });
}
