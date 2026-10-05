/**
 * Formats a date into a concise relative time string in English.
 * Examples: "just now", "5m ago", "2h ago", "yesterday", "3d ago".
 */
export function formatRelativeTime(dateInput) {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const diffInSeconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

  if (diffInSeconds < 60) {
    return "just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return "yesterday";
  }
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w ago`;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });
}

/**
 * Returns the target navigation route based on notification action prefix.
 */
export function getNotificationRoute(action) {
  if (!action || typeof action !== "string") {
    return "/notifications";
  }

  if (action.startsWith("ticket:") || action.startsWith("ticket_")) {
    return "/support";
  }

  if (action.startsWith("security:passkey")) {
    return "/passkeys";
  }

  if (action.startsWith("security:") || action.startsWith("user:")) {
    return "/account";
  }

  if (action.startsWith("coins:") || action.startsWith("billing:")) {
    return "/wallet";
  }

  return "/notifications";
}

