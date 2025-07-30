package com.ssafy.keepick.repository;

import com.ssafy.keepick.entity.GroupMember;
import com.ssafy.keepick.entity.GroupMemberStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {

    List<GroupMember> findByGroupId(Long groupId);

    Optional<GroupMember> findByGroupIdAndMemberId(Long groupId, Long memberId);

    Optional<GroupMember> findByGroupIdAndMemberIdAndStatusAndDeletedAtIsNull(Long groupId, Long memberId, GroupMemberStatus status);
    
    Optional<GroupMember> findByIdAndStatusAndDeletedAtIsNull(Long id, GroupMemberStatus status);

    // 회원이 가입한/초대받은/거절한 그룹 목록 조회
    @Query("SELECT gm FROM GroupMember gm join fetch gm.group g WHERE gm.member.id = :memberId AND gm.status = :status AND gm.deletedAt is null")
    List<GroupMember> findGroupsByMember(Long memberId, GroupMemberStatus status);

    // 그룹에 가입한 회원 목록 조회
    @Query("SELECT gm FROM GroupMember gm join fetch gm.member m WHERE gm.group.id = :groupId AND gm.status = GroupMemberStatus.ACCEPTED AND gm.deletedAt is null AND m.deletedAt is null")
    List<GroupMember> findJoinedMembersById(Long groupId);
}
