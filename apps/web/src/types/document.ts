export enum DocumentType {
  GROUP = 'GROUP',
  PAGE = 'PAGE',
}

export interface Document {
  id: string;
  title: string;
  content?: string; // Content might not be fetched in list view
  spaceId: string;
  parentId?: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  children?: Document[]; // For tree structure
  creator?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

export interface CreateDocumentDto {
  title: string;
  content?: string;
  parentId?: string;
  spaceId: string; // Needed for creation
}

export interface UpdateDocumentDto {
  title?: string;
  content?: string;
  parentId?: string; // For moving
  order?: number; // For reordering
}
