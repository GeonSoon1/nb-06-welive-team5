import { ComplaintStatus } from '@prisma/client';

export interface ComplaintWithAuthor {
  id: string;
  authorId: string | null;
  title: string;
  content: string;
  isPublic: boolean;
  viewCount: number;
  commentsCount: number;
  status: ComplaintStatus;
  createdAt: Date;
  updatedAt: Date;
  author?: {
    name: string;
    apartmentUnit?: {
      dong: string;
      ho: string;
    } | null;
  } | null;
  comments?: {
    id: string;
    authorId: string | null;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    author?: { name: string } | null;
  }[];
}

export interface ComplaintListResponse {
  complaintId: string;
  userId: string | null;
  title: string;
  writerName: string;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  viewsCount: number;
  commentsCount: number;
  status: ComplaintStatus;
  dong: string;
  ho: string;
}

export interface ComplaintDetailResponse extends ComplaintListResponse {
  content: string;
  boardType: string;
  comments: {
    id: string;
    userId: string | null;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    writerName: string;
  }[];
}
