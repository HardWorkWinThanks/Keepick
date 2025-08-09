export interface Group {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
}

export interface GroupMember {
  id: string;
  userId: string;
  groupId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
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
}