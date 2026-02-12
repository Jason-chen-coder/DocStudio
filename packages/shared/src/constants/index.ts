// Permission roles
export const ROLES = {
  OWNER: 'owner' as const,
  EDITOR: 'editor' as const,
  VIEWER: 'viewer' as const,
};

// Permission capabilities
export const PERMISSIONS = {
  [ROLES.OWNER]: {
    read: true,
    write: true,
    share: true,
    delete: true,
  },
  [ROLES.EDITOR]: {
    read: true,
    write: true,
    share: false,
    delete: false,
  },
  [ROLES.VIEWER]: {
    read: true,
    write: false,
    share: false,
    delete: false,
  },
};
