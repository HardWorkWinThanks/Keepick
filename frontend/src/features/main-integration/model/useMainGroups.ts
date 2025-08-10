'use client';

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { GroupManagementApi } from "@/features/group-management";
import { groupListSelectors } from "@/entities/group";
import { useMainAuth } from "./useMainAuth";

/**
 * 메인 랜딩페이지의 그룹 관리를 Keepick의 실제 라우팅과 연결하는 훅
 */
export const useMainGroups = () => {
  const router = useRouter();
  const { isLoggedIn } = useMainAuth();

  // 실제 API 데이터 사용
  const { data: allGroups = [], isLoading: isGroupsLoading } = useQuery({
    queryKey: ['myGroups'],
    queryFn: GroupManagementApi.getMyGroups,
    enabled: isLoggedIn, // 로그인된 상태에서만 실행
    staleTime: 5 * 60 * 1000,
  });
  
  // entities 셀렉터를 사용해서 수락된 그룹만 필터링하고 정렬
  const groups = isLoggedIn ? groupListSelectors.sortByName(
    groupListSelectors.getAcceptedGroups(allGroups)
  ).map(group => ({
    id: group.groupId,
    name: group.name,
    thumbnailUrl: group.thumbnailUrl
  })) : [];

  const navigateToGroup = (groupName: string) => {
    // 그룹 이름으로 해당하는 그룹 ID를 찾아서 라우팅
    const group = allGroups.find(g => g.name === groupName);
    if (group) {
      router.push(`/group/${group.groupId}`);
    }
  };

  return {
    groups,
    navigateToGroup,
    isGroupsLoading
  };
};