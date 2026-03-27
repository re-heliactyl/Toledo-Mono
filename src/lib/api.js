import axios from 'axios'

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

export function getApiErrorMessage(error, fallback = 'Something went wrong') {
  return error?.response?.data?.error || error?.message || fallback;
}

export function showApiErrorToast(toast, error, fallback, title = 'Error') {
  toast({
    title,
    description: getApiErrorMessage(error, fallback),
    variant: 'destructive',
  });
}
