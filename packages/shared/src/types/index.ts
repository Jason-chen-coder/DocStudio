// User types
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

// Space types
export interface Space {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
}

// Document types
export interface Document {
  id: string;
  spaceId: string;
  parentId: string | null;
  title: string;
  ydocKey: string;
  createdAt: Date;
  updatedAt: Date;
}

// Permission types
export type Role = 'owner' | 'editor' | 'viewer';

export interface SpacePermission {
  userId: string;
  spaceId: string;
  role: Role;
}

export interface ShareToken {
  id: string;
  docId: string;
  permission: 'read' | 'write';
  expiresAt: Date | null;
}
