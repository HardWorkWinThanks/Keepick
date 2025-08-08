'use client';

import { useRouter } from "next/navigation";

/**
 * 메인 랜딩페이지의 그룹 관리를 Keepick의 실제 라우팅과 연결하는 훅
 */
export const useMainGroups = () => {
  const router = useRouter();

  // 기본 그룹 데이터
  const groups = [
    { id: 1, name: "가족" },
    { id: 2, name: "친구들" },
    { id: 3, name: "회사" },
    { id: 4, name: "여행" },
    { id: 5, name: "취미" },
  ];

  const navigateToGroup = (groupName: string) => {
    // 실제 라우팅으로 처리
    router.push(`/group/${encodeURIComponent(groupName)}`);
  };

  return {
    groups,
    navigateToGroup,
  };
};