export interface CommentWithAuthor {
  id: string;
  authorId: string | null;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  complaintId?: string | null;
  noticeId?: string | null;
  voteId?: string | null;
  author?: {
    name: string;
  } | null;
}

export interface FormattedCommentResponse {
  comment: {
    id: string;
    userId: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    writerName: string;
  };
  board: {
    id: string;
    boardType: string;
  };
}
