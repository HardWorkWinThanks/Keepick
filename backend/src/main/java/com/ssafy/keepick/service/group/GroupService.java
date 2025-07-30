package com.ssafy.keepick.service.group;

import com.ssafy.keepick.common.exception.BaseException;
import com.ssafy.keepick.entity.Group;
import com.ssafy.keepick.entity.GroupMember;
import com.ssafy.keepick.entity.GroupMemberStatus;
import com.ssafy.keepick.entity.Member;
import com.ssafy.keepick.repository.GroupMemberRepository;
import com.ssafy.keepick.repository.GroupRepository;
import com.ssafy.keepick.repository.MemberRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

import static com.ssafy.keepick.common.exception.ErrorCode.GROUP_NOT_FOUND;
import static com.ssafy.keepick.common.exception.ErrorCode.NOT_FOUND;

@Service
@RequiredArgsConstructor
@Transactional
public class GroupService {

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final MemberRepository memberRepository;

    public GroupResult.GroupInfo createGroup(GroupCommand.Create command) {
        // 그룹 생성
        Member member = memberRepository.findById(command.getMemberId()).orElseThrow(() -> new BaseException(NOT_FOUND));
        Group group = new Group(command.getName(), member);
        groupRepository.save(group);
        // 그룹에 가입
        GroupMember groupMember = new GroupMember(group, member, GroupMemberStatus.ACCEPTED);
        groupMemberRepository.save(groupMember);
        List<GroupMember> invitees = memberRepository.findAllById(command.getMembers()).stream().map(m -> new GroupMember(group, m)).toList();
        groupMemberRepository.saveAll(invitees);
        return GroupResult.GroupInfo.from(group);
    }

    public List<GroupResult.GroupMemberInfo> getGroups(GroupCommand.MyGroup command) {
        return groupMemberRepository
                .findGroupsByMember(command.getMemberId(), command.getStatus())
                .stream()
                .map(GroupResult.GroupMemberInfo::from)
                .toList();
    }

    public GroupResult.GroupInfo getGroup(Long groupId) {
        Group group = groupRepository.findById(groupId).orElseThrow(() -> new BaseException(GROUP_NOT_FOUND));
        return GroupResult.GroupInfo.from(group);
    }

    public List<GroupResult.Member> getMembers(Long groupId) {
        return groupMemberRepository.findJoinedMembersById(groupId).stream().map(GroupResult.Member::from).toList();
    }

}
