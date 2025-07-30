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

    public GroupMember(Group group, Member member) {
        this.group = group;
        this.member = member;
        this.invite();
    }

    public GroupMember(Group group, Member memebr, GroupMemberStatus status) {
        this.group = group;
        this.member = memebr;
        if(status == GroupMemberStatus.PENDING) this.invite();
        else if(status == GroupMemberStatus.ACCEPTED) this.accept();
        else if(status == GroupMemberStatus.REJECTED) this.reject();
    }

    public void invite() {
        this.status = GroupMemberStatus.PENDING;
    }

    public void accept() {
        this.status = GroupMemberStatus.ACCEPTED;
        this.group.increaseMemberCount();
    }

    public void reject() {
        this.status = GroupMemberStatus.REJECTED;
    }

    public void delete() {
        this.deletedAt = LocalDateTime.now();
        this.group.decreaseMemberCount();
    }

    public void undelete() {
        this.deletedAt = null;
    }
}


