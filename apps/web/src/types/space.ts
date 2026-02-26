export type Role = 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER';

export interface Space {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  myRole?: Role;
  _count?: {
    documents: number;
    permissions: number;
  };
}

export interface SpaceMember {
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role: Role;
  joinedAt: string;
}

export interface CreateSpaceDto {
  name: string;
  description?: string;
  isPublic?: boolean;
}

export interface UpdateSpaceDto {
  name?: string;
  description?: string;
  isPublic?: boolean;
}

export interface InviteMemberDto {
    email?: string;
    role: Role;
}

export interface InvitationResponse {
    token: string;
    url?: string; // constructed on client or server
    expiresAt: string;
    // ...
}

