export interface User {
  id: string;
  email: string;
}

export interface JoinRoomData {
  room: string;
  email?: string;
}

export interface OfferData {
  sdp: RTCSessionDescriptionInit;
  senderID: string;
}

export interface AnswerData {
  sdp: RTCSessionDescriptionInit;
  senderID: string;
}

export interface CandidateData {
  candidate: RTCIceCandidateInit;
  senderID: string;
}

export interface UserExitData {
  id: string;
}

export interface ErrorData {
  message: string;
}
