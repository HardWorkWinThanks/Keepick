/**
 * 사용자 프로필 페이지에서 사용되는 데이터 구조를 정의합니다.
 */
export interface UserProfile {
  profileImage: string; // 사용자가 설정한 기본 프로필 이미지 URL
  email: string; // 사용자의 이메일 주소 (일반적으로 수정 불가)
  socialType: 'naver' | 'kakao' | 'google'; // 소셜 로그인 제공자 타입
  nickname: string; // 사용자의 닉네임
  aiProfileImage: string; // AI 얼굴 인식을 위해 사용되는 프로필 이미지 URL
}
