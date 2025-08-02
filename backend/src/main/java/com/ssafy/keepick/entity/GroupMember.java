package com.ssafy.keepick.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class GroupMember extends BaseTimeEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    private Group group;

    private LocalDateTime deletedAt;

    @Enumerated(EnumType.STRING)
    private GroupMemberStatus status;

    private GroupMember(Group group, Member member) {
        this.group = group;
        this.member = member;
        this.status = GroupMemberStatus.PENDING;
    }

    public static GroupMember createGroupMember(Group group, Member member) {
        return new GroupMember(group, member);
    }

    public void invite() {
        if(this.status == GroupMemberStatus.ACCEPTED) throw new IllegalStateException();
        this.status = GroupMemberStatus.PENDING;
    }

    public void accept() {
        if(this.status != GroupMemberStatus.PENDING) throw new IllegalStateException();
        this.status = GroupMemberStatus.ACCEPTED;
        this.group.increaseMemberCount();
    }

    public void reject() {
        if(this.status != GroupMemberStatus.PENDING) throw new IllegalStateException();
        this.status = GroupMemberStatus.REJECTED;
    }

    public void leave() {
        if(this.status != GroupMemberStatus.ACCEPTED) throw new IllegalStateException();
        this.status = GroupMemberStatus.LEFT;
        this.deletedAt = LocalDateTime.now();
        this.group.decreaseMemberCount();
    }

}


