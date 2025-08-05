package com.ssafy.keepick.friend.domain;

import com.ssafy.keepick.global.entity.BaseTimeEntity;
import com.ssafy.keepick.group.domain.GroupMemberStatus;
import com.ssafy.keepick.member.domain.Member;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
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

    private Friendship(Member sender, Member receiver, FriendshipStatus status) {
        this.sender = sender;
        this.receiver = receiver;
        this.status = status;
    }

    public static Friendship createFriendship(Member sender, Member receiver) {
        return new Friendship(sender, receiver, FriendshipStatus.PENDING);
    }

    public static Friendship createAcceptedFriendship(Member sender, Member receiver) {
        return new Friendship(sender, receiver, FriendshipStatus.ACCEPTED);
    }

    public void accept() {
        this.status = FriendshipStatus.ACCEPTED;
    }

    public void reject() {
        this.status = FriendshipStatus.REJECTED;
    }

    public boolean request() {
        // sender -> receiver 로 친구 요청을 처리하고, 수락되었는지 여부를 반환
        if (this.status == FriendshipStatus.ACCEPTED) {
            return true;
        }
        if (this.status != FriendshipStatus.PENDING) {
            this.status = FriendshipStatus.PENDING;
        }
        return false;
    }

    public boolean isProcessableBy(Long memberId) {
        return this.sender.getId().equals(memberId);
    }

}

