export const UserRole = {
  STUDENT: "STUDENT",
  ADMIN: "ADMIN",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const DocumentStatus = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  READY: "READY",
  FAILED: "FAILED",
} as const;

export type DocumentStatus = (typeof DocumentStatus)[keyof typeof DocumentStatus];

export const MessageRole = {
  USER: "USER",
  ASSISTANT: "ASSISTANT",
} as const;

export type MessageRole = (typeof MessageRole)[keyof typeof MessageRole];

export const UsageKind = {
  EMBEDDING: "EMBEDDING",
  CHAT: "CHAT",
  DOC_PROCESS: "DOC_PROCESS",
} as const;

export type UsageKind = (typeof UsageKind)[keyof typeof UsageKind];

export interface SourceReference {
  documentId: string;
  fileName: string;
  page: number | null;
  chunkId?: string;
  snippet?: string;
}

export interface UserPublic {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string | null;
  createdAt: string;
}

export interface CourseDto {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export interface DocumentDto {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  status: DocumentStatus;
  pageCount: number | null;
  chunkCount: number | null;
  failReason: string | null;
  courseId: string | null;
  courseName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationDto {
  id: string;
  title: string;
  courseId: string | null;
  updatedAt: string;
  createdAt: string;
}

export interface MessageDto {
  id: string;
  role: MessageRole;
  content: string;
  sources: SourceReference[];
  createdAt: string;
}

export interface ChatRequest {
  conversationId?: string;
  message: string;
  courseId?: string | null;
}

export interface ChatResponse {
  conversationId: string;
  message: MessageDto;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export const FILE_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
] as const;

export const MAX_FILE_MB = 15;
