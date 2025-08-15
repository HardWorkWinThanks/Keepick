export interface Group {
  groupId: number;
  name: string;
  description: string;
  thumbnailUrl: string;
  memberCount: number;
  createdId: number;
  creatorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  invitationId?: number;
  memberId: number;
  name: string;
  nickname: string;
  email?: string;
  profileUrl?: string;
  profileImageUrl?: string | null;
  joinedAt: string;
  role: "OWNER" | "MEMBER";
}

export interface GroupListItem {
  groupId: number;
  name: string;
  memberCount: number;
  invitationId?: number;
  invitationStatus: "PENDING" | "ACCEPTED" | "REJECTED";
  thumbnailUrl?: string;
  createdAt: string;
}

export interface AlbumType {
  id: string;
  name: string;
  subtitle: string;
}

export interface GroupPhoto {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  startDate?: string;
  endDate?: string;
}