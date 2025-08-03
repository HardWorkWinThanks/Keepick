package com.ssafy.keepick.friend.domain;

import com.ssafy.keepick.global.entity.BaseTimeEntity;
import com.ssafy.keepick.group.domain.GroupMemberStatus;
import com.ssafy.keepick.member.domain.Member;
import jakarta.persistence.*;
import lombok.Getter;

@Getter
@Entity
public class Friendship extends BaseTimeEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private FriendshipStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    private Member sender;

    @ManyToOne(fetch = FetchType.LAZY)
    private Member receiver;

    private Friendship(Member sender, Member receiver) {
        this.sender = sender;
        this.receiver = receiver;
        this.status = FriendshipStatus.PENDING;
    }

    public static Friendship createFriendship(Member sender, Member receiver) {
        return new Friendship(sender, receiver);
    }

    public void accept() {
        this.status = FriendshipStatus.ACCEPTED;
    }

    public void reject() {
        this.status = FriendshipStatus.REJECTED;
    }

    public void request() {
        this.status = FriendshipStatus.PENDING;
    }

}

