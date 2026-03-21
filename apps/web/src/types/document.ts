export enum DocumentType {
  GROUP = 'GROUP',
  PAGE = 'PAGE',
}

export interface Document {
  id: string;
  title: string;
  content?: string; // Content might not be fetched in list view
  commentsData?: string | null; // JSON-serialized comment threads
  spaceId: string;
  parentId?: string | null;
  order: number;
  ydocKey?: string | null; // Yjs collaboration room key (Stage 4)
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  deletedAt?: string | null; // 软删除时间（回收站）
  children?: Document[]; // For tree structure
  creator?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

export interface DocumentFavorite {
  id: string;
  documentId: string;
  createdAt: string;
  document: {
    id: string;
    title: string;
    spaceId: string;
    updatedAt: string;
    creator?: {
      id: string;
      name: string;
      avatarUrl?: string;
    };
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
  commentsData?: string; // JSON-serialized comment threads
  parentId?: string | null; // For moving
  order?: number; // For reordering
}

export interface MoveDocumentDto {
  parentId: string | null; // null = 移到根节点
  order: number;           // 小数位法计算后的新 order 值
}

export interface DocumentSnapshot {
  id: string;
  docId: string;
  content: string; // Tiptap JSON string or plain text (stored in DB)
  contentJson?: object | null; // Decoded Tiptap ProseMirror JSON (returned by findOne API)
  message?: string | null;
  createdBy: string;
  createdAt: string;
  creator?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}
