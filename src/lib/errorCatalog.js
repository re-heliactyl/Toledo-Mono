/**
 * Centralized Error Catalog for Overnode Console (Toledo)
 * Defines error codes, human titles, probable root causes, and troubleshooting tips.
 */

export const ERROR_CATALOG = {
  // --- SERVER CREATION & MANAGEMENT ERRORS ---
  'ERR-SRV-401': {
    code: 'ERR-SRV-401',
    title: 'Server Creation Failed (Node Error)',
    cause: 'The target node is offline, rebooting, or experiencing daemon (Wings) connectivity issues. This issue is isolated to the selected node rather than a global system failure.',
    suggestion: 'Try selecting a different node/location, or wait a few minutes for the node daemon to reconnect.',
  },
  'ERR-SRV-LIMIT': {
    code: 'ERR-SRV-LIMIT',
    title: 'Server Limit Exceeded',
    cause: 'You have reached the maximum number of servers allowed by your current package.',
    suggestion: 'Delete an unused server or upgrade your account package/resources in the Store.',
  },
  'ERR-SRV-RAM': {
    code: 'ERR-SRV-RAM',
    title: 'Insufficient RAM Allocation',
    cause: 'Your account does not have enough free RAM available to create or modify this server.',
    suggestion: 'Reduce the server RAM allocation or purchase additional RAM from the Store.',
  },
  'ERR-SRV-DISK': {
    code: 'ERR-SRV-DISK',
    title: 'Insufficient Disk Space',
    cause: 'Your account does not have enough free disk space remaining for this server configuration.',
    suggestion: 'Reduce requested disk size or add more disk space from the Store.',
  },
  'ERR-SRV-CPU': {
    code: 'ERR-SRV-CPU',
    title: 'Insufficient CPU Limit',
    cause: 'Your account does not have enough unallocated CPU limit remaining.',
    suggestion: 'Reduce CPU percentage or purchase additional CPU resources.',
  },
  'ERR-SRV-NO-ALLOC': {
    code: 'ERR-SRV-NO-ALLOC',
    title: 'No Available Allocation',
    cause: 'The selected node has no free port allocations available for server deployment.',
    suggestion: 'Select a different node/location or open a support ticket to request allocations.',
  },
  'ERR-SRV-EGG': {
    code: 'ERR-SRV-EGG',
    title: 'Invalid or Disabled Egg',
    cause: 'The selected server egg template is currently disabled or unavailable on this system.',
    suggestion: 'Choose a different server egg or contact staff if this egg should be available.',
  },

  // --- FILE MANAGER ERRORS ---
  'ERR-FILE-SAVE': {
    code: 'ERR-FILE-SAVE',
    title: 'Failed to Save File',
    cause: 'Disk write operation failed. The server disk space may be full, permissions denied, or daemon connection timed out.',
    suggestion: 'Verify server storage limit, check file permissions, or refresh the file manager.',
  },
  'ERR-FILE-READ': {
    code: 'ERR-FILE-READ',
    title: 'Failed to Read File',
    cause: 'Unable to open or stream file contents from the server node daemon.',
    suggestion: 'Ensure the file exists, is not corrupt or locked by another process.',
  },
  'ERR-FILE-DELETE': {
    code: 'ERR-FILE-DELETE',
    title: 'Failed to Delete File',
    cause: 'File/folder deletion rejected by daemon or operating system permissions.',
    suggestion: 'Check if the server process is currently locking the file.',
  },

  // --- HTTP & API NETWORK ERRORS ---
  'ERR-HTTP-400': {
    code: 'ERR-HTTP-400',
    title: 'Bad Request',
    cause: 'The server rejected the request parameters or request body format.',
    suggestion: 'Double-check your input values and try again.',
  },
  'ERR-HTTP-401': {
    code: 'ERR-HTTP-401',
    title: 'Unauthorized / Session Expired',
    cause: 'Your session has expired, token is invalid, or login credentials are required.',
    suggestion: 'Re-authenticate or refresh your session login.',
  },
  'ERR-HTTP-403': {
    code: 'ERR-HTTP-403',
    title: 'Access Forbidden',
    cause: 'You do not have permission or ownership required to execute this operation.',
    suggestion: 'Check your permissions or contact server administrator.',
  },
  'ERR-HTTP-404': {
    code: 'ERR-HTTP-404',
    title: 'Resource Not Found',
    cause: 'The target API endpoint, server, user, or object could not be found.',
    suggestion: 'Verify the ID or link and refresh the page.',
  },
  'ERR-HTTP-408': {
    code: 'ERR-HTTP-408',
    title: 'Request Timeout',
    cause: 'The server or background worker took too long to complete your request.',
    suggestion: 'Check your internet connection or try again shortly.',
  },
  'ERR-HTTP-429': {
    code: 'ERR-HTTP-429',
    title: 'Rate Limit Exceeded',
    cause: 'You have sent too many requests in a short time frame.',
    suggestion: 'Please slow down and wait a few seconds before trying again.',
  },
  'ERR-HTTP-500': {
    code: 'ERR-HTTP-500',
    title: 'Internal Server Error',
    cause: 'An unhandled server-side exception occurred on Toledo backend.',
    suggestion: 'Copy diagnostic details and report to Overnode technical team.',
  },
  'ERR-HTTP-502': {
    code: 'ERR-HTTP-502',
    title: 'Bad Gateway (Node Offline)',
    cause: 'Toledo backend could not establish communication with remote Pterodactyl node / Wings daemon.',
    suggestion: 'The remote node may be restarting or offline.',
  },
  'ERR-HTTP-503': {
    code: 'ERR-HTTP-503',
    title: 'Service Temporarily Unavailable',
    cause: 'The system or background service is temporarily undergoing maintenance or overloaded.',
    suggestion: 'Please try again in a few minutes.',
  },
  'ERR-HTTP-504': {
    code: 'ERR-HTTP-504',
    title: 'Gateway Timeout (Node Timeout)',
    cause: 'Remote node daemon did not return a response within the expected time limit.',
    suggestion: 'Node may be under heavy load or restarting.',
  },

  // --- COINS & STORE ERRORS ---
  'ERR-COINS-INSUFFICIENT': {
    code: 'ERR-COINS-INSUFFICIENT',
    title: 'Insufficient Coin Balance',
    cause: 'You do not have enough coins in your wallet to complete this transaction.',
    suggestion: 'Earn more coins via AFK, daily rewards, or linkvertise tasks.',
  },

  // --- DEFAULT FALLBACK ---
  'ERR-UNKNOWN': {
    code: 'ERR-UNKNOWN',
    title: 'Unexpected Error',
    cause: 'An unexpected issue occurred while processing your action.',
    suggestion: 'Retry the action or check console log for details.',
  }
};

const getNonEmptyString = (val) => (typeof val === 'string' && val.trim() !== '' ? val : null);

/**
 * Resolves specific error code and diagnostic information based on error object and request context.
 */
export function resolveErrorDetails(error, fallback = 'Something went wrong', context = {}) {
  const status = error?.response?.status || error?.status || null;
  const url = error?.config?.url || error?.url || context.url || '';
  const data = error?.response?.data;
  
  const rawText = 
    getNonEmptyString(data?.error) || 
    getNonEmptyString(data?.error?.message) || 
    getNonEmptyString(data?.message) || 
    (data?.errors && Array.isArray(data.errors) && getNonEmptyString(data.errors[0]?.detail)) ||
    (data?.errors && Array.isArray(data.errors) && getNonEmptyString(data.errors[0]?.code)) ||
    getNonEmptyString(typeof data === 'string' ? data : null) ||
    getNonEmptyString(error?.message) || 
    fallback;

  const serverErrorText = rawText;
  const lowerText = serverErrorText.toLowerCase();

  const isServerCreate = url.includes('/servers') || url.includes('/api/v5/servers');
  const isFileManager = url.includes('/files') || context.feature === 'file-manager';

  let matchedCatalogKey = null;

  // 1. Check Server creation specifics
  if (isServerCreate) {
    const isDaemonOrNodeError = 
      lowerText.includes('failed to create a server') || 
      lowerText.includes('daemon') || 
      lowerText.includes('wings') || 
      lowerText.includes('node') || 
      status === 502 || 
      status === 504;

    if (isDaemonOrNodeError) {
      matchedCatalogKey = 'ERR-SRV-401';
    } else if (lowerText.includes('server limit')) {
      matchedCatalogKey = 'ERR-SRV-LIMIT';
    } else if (lowerText.includes('ram')) {
      matchedCatalogKey = 'ERR-SRV-RAM';
    } else if (lowerText.includes('disk')) {
      matchedCatalogKey = 'ERR-SRV-DISK';
    } else if (lowerText.includes('cpu')) {
      matchedCatalogKey = 'ERR-SRV-CPU';
    } else if (lowerText.includes('allocation')) {
      matchedCatalogKey = 'ERR-SRV-NO-ALLOC';
    } else if (lowerText.includes('egg')) {
      matchedCatalogKey = 'ERR-SRV-EGG';
    }
  }

  // 2. Check File Manager specifics
  if (!matchedCatalogKey && isFileManager) {
    if (lowerText.includes('save') || lowerText.includes('write')) {
      matchedCatalogKey = 'ERR-FILE-SAVE';
    } else if (lowerText.includes('read') || lowerText.includes('open')) {
      matchedCatalogKey = 'ERR-FILE-READ';
    } else if (lowerText.includes('delete') || lowerText.includes('remove')) {
      matchedCatalogKey = 'ERR-FILE-DELETE';
    }
  }

  // 3. Coins / Wallet check
  if (!matchedCatalogKey && lowerText.includes('insufficient coins')) {
    matchedCatalogKey = 'ERR-COINS-INSUFFICIENT';
  }

  // 4. HTTP Status Code map
  if (!matchedCatalogKey && status) {
    const statusKey = `ERR-HTTP-${status}`;
    if (ERROR_CATALOG[statusKey]) {
      matchedCatalogKey = statusKey;
    }
  }

  // 5. Fallback to Catalog entry or generic HTTP code
  const entry = ERROR_CATALOG[matchedCatalogKey] || {
    code: status ? `ERR-${status}` : 'ERR-GENERIC',
    title: 'Operation Error',
    cause: 'An issue occurred during the server request execution.',
    suggestion: 'Review input data or try again shortly.',
  };

  const code = entry.code;
  const title = entry.title;
  const cause = entry.cause;
  const suggestion = entry.suggestion;

  const rawDetails = {
    code,
    status: status || 'N/A',
    message: serverErrorText,
    url,
    method: error?.config?.method?.toUpperCase() || context.method || 'REQUEST',
    timestamp: new Date().toISOString(),
    responsePayload: data || null,
  };

  return {
    code,
    title,
    message: serverErrorText,
    cause,
    suggestion,
    status,
    rawDetails,
  };
}
