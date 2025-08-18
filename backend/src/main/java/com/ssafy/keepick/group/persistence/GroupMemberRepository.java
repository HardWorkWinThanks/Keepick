package com.ssafy.keepick.group.persistence;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.ssafy.keepick.group.domain.GroupMember;
import com.ssafy.keepick.group.domain.GroupMemberStatus;

public interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {

    List<GroupMember> findByGroupId(Long groupId);

    Optional<GroupMember> findByGroupIdAndMemberId(Long groupId, Long memberId);

    Optional<GroupMember> findByGroupIdAndMemberIdAndStatus(Long groupId, Long memberId, GroupMemberStatus status);
    
    // 대기중인 초대 조회
    @Query("SELECT gm " +
            "FROM GroupMember gm " +
            "WHERE gm.id = :id " +
            "AND gm.status = GroupMemberStatus.PENDING")
    Optional<GroupMember> findPendingInvitationById(Long id);

    // 회원이 가입한/초대받은/거절한 그룹 목록 조회
    @Query("SELECT gm " +
            "FROM GroupMember gm join fetch gm.group g " +
            "WHERE gm.member.id = :memberId " +
            "AND gm.status = :status")
    List<GroupMember> findGroupsByMember(Long memberId, GroupMemberStatus status);

    // 그룹에 가입한 회원 목록 조회
    @Query("SELECT gm " +
            "FROM GroupMember gm join fetch gm.member m " +
            "WHERE gm.group.id = :groupId " +
            "AND gm.status = GroupMemberStatus.ACCEPTED")
    List<GroupMember> findJoinedMembersById(Long groupId);
    
    // 사용자가 특정 그룹의 멤버인지 확인 (ACCEPTED 상태만)
    boolean existsByGroupIdAndMemberIdAndStatus(Long groupId, Long memberId, GroupMemberStatus status);
}
