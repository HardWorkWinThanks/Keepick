export interface Friend {
  id: number;
  name: string;
  avatar?: string;
}

export interface FriendRequest {
  id: number;
  name: string;
  avatar?: string;
  timestamp: string;
}