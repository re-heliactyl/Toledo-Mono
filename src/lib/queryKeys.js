export const queryKeys = {
  // Global & User State
  state: ['state'],
  settings: ['settings'],
  user: {
    root: ['user'],
    profile: () => ['user', 'profile'],
    resources: () => ['user', 'resources'],
    notifications: (page = 1) => ['user', 'notifications', page],
    notificationCounts: () => ['user', 'notifications', 'counts'],
    unread: ['notifications-unread'],
    notificationsList: ['notifications'],
  },

  // Servers domain
  servers: {
    all: ['servers'],
    list: () => ['servers', 'list'],
    subusers: () => ['servers', 'subusers'],
    detail: (id) => ['servers', 'detail', String(id)],
    startup: (id) => ['servers', 'startup', String(id)],
    minecraft: (id) => ['servers', 'minecraft', String(id)],
    renewal: (id) => ['servers', 'renewal', String(id)],
    resources: (id) => ['servers', 'resources', String(id)],
  },

  // Eggs, Nodes, Locations
  infrastructure: {
    eggs: ['infrastructure', 'eggs'],
    locations: ['infrastructure', 'locations'],
    nodes: ['infrastructure', 'nodes'],
    radar: (id) => ['infrastructure', 'radar', id ? String(id) : 'all'],
  },

  // Coins, Economy & Billing
  economy: {
    wallet: ['economy', 'wallet'],
    billing: ['economy', 'billing'],
    transactions: (page = 1) => ['economy', 'transactions', page],
    invoices: () => ['economy', 'invoices'],
    store: ['economy', 'store'],
    bundles: ['economy', 'bundles'],
    boostTypes: ['economy', 'boost-types'],
    activeBoosts: ['economy', 'active-boosts'],
    daily: ['economy', 'daily'],
    dailyHistory: () => ['economy', 'daily', 'history'],
    leaderboard: () => ['economy', 'leaderboard'],
    afk: ['economy', 'afk'],
    staking: ['economy', 'staking'],
    achievements: ['economy', 'achievements'],
  },

  // Tickets & Support
  support: {
    all: ['support'],
    list: (filters = {}) => ['support', 'list', filters],
    detail: (id) => ['support', 'detail', String(id)],
    counts: () => ['support', 'counts'],
    stats: () => ['support', 'stats'],
  },

  // Admin domain
  admin: {
    overview: ['admin', 'overview'],
    stats: ['admin', 'stats'],
    backups: ['admin', 'backups'],
    config: ['admin', 'config'],
    reboot: ['admin', 'reboot'],
    users: (filters = {}) => ['admin', 'users', filters],
    userDetail: (id) => ['admin', 'users', String(id)],
    allowlist: ['admin', 'allowlist'],
    updater: ['admin', 'updater'],
    updaterStatus: ['admin', 'updater', 'status'],
  },
};
