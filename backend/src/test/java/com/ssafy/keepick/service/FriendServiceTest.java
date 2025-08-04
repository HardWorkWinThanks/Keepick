package com.ssafy.keepick.service;

import com.ssafy.keepick.friend.application.FriendService;
import com.ssafy.keepick.friend.application.FriendStatus;
import com.ssafy.keepick.friend.application.dto.FriendshipDto;
import com.ssafy.keepick.friend.controller.request.FriendCreateRequest;
import com.ssafy.keepick.friend.domain.Friendship;
import com.ssafy.keepick.friend.domain.FriendshipStatus;
import com.ssafy.keepick.friend.persistence.FriendshipRepository;
import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.exception.ErrorCode;
import com.ssafy.keepick.member.domain.Member;
import com.ssafy.keepick.member.persistence.MemberRepository;
import com.ssafy.keepick.testconfig.TestSecurityConfig;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.*;

@SpringBootTest
@Import(TestSecurityConfig.class)
@Transactional
class FriendServiceTest {

    @Autowired
    MemberRepository memberRepository;

    @Autowired
    FriendshipRepository friendshipRepository;

    @Autowired
    FriendService friendService;

    @DisplayName("상태에 따른 친구 목록을 한다.")
    @Test
    void getFriendList() {
    }

    @DisplayName("새로운 친구 요청을 생성한다.")
    @Test
    void createFriendRequestTest() {
        // given
        Member sender = createMember(1);
        Member receiver = createMember(2);
        memberRepository.save(sender);
        memberRepository.save(receiver);

        FriendCreateRequest request = FriendCreateRequest.builder().friendId(receiver.getId()).build();

        // when
        FriendshipDto dto = friendService.createFriendRequest(request, sender.getId());

        // then
        // Dto 검증
        assertThat(dto.getFriendId()).isEqualTo(receiver.getId());
        assertThat(dto.getFriendshipStatus()).isEqualTo(FriendshipStatus.ACCEPTED);
        assertThat(dto.getFriendStatus()).isEqualTo(FriendStatus.SENT);
        assertThat(dto.getCreatedAt()).isNotNull();
        
        // 양방향 관계 검증
        Friendship friendship = friendshipRepository.findBySenderIdAndReceiverId(sender.getId(), receiver.getId()).get();
        assertThat(friendship.getStatus()).isEqualTo(FriendshipStatus.ACCEPTED);
        Friendship revserFriendship = friendshipRepository.findBySenderIdAndReceiverId(receiver.getId(), sender.getId()).get();
        assertThat(revserFriendship.getStatus()).isEqualTo(FriendshipStatus.PENDING);
    }

    @DisplayName("서로 친구 요청을 보내면 친구가 된다.")
    @Test
    void createFriendRequestTogetherTest() {
        // given
        Member sender = createMember(1);
        Member receiver = createMember(2);
        memberRepository.save(sender);
        memberRepository.save(receiver);

        FriendCreateRequest request1 = FriendCreateRequest.builder().friendId(receiver.getId()).build();
        FriendCreateRequest request2 = FriendCreateRequest.builder().friendId(sender.getId()).build();

        // when
        FriendshipDto dto1 = friendService.createFriendRequest(request1, sender.getId());
        FriendshipDto dto2 = friendService.createFriendRequest(request2, receiver.getId());

        // then
        // Dto 검증
        assertThat(dto1.getFriendshipStatus()).isEqualTo(FriendshipStatus.ACCEPTED);
        assertThat(dto1.getFriendStatus()).isEqualTo(FriendStatus.SENT);
        assertThat(dto2.getFriendshipStatus()).isEqualTo(FriendshipStatus.ACCEPTED);
        assertThat(dto2.getFriendStatus()).isEqualTo(FriendStatus.FRIEND);

        // 양방향 관계 검증
        Friendship friendship = friendshipRepository.findBySenderIdAndReceiverId(sender.getId(), receiver.getId()).get();
        assertThat(friendship.getStatus()).isEqualTo(FriendshipStatus.ACCEPTED);
        Friendship revserFriendship = friendshipRepository.findBySenderIdAndReceiverId(receiver.getId(), sender.getId()).get();
        assertThat(revserFriendship.getStatus()).isEqualTo(FriendshipStatus.ACCEPTED);
    }

    @DisplayName("이미 친구인 회원에서 친구 요청을 보낼 수 없다.")
    @Test
    void createAlreadyFriendRequestTest() {
        // given
        Member sender = createMember(1);
        Member receiver = createMember(2);
        memberRepository.save(sender);
        memberRepository.save(receiver);
        
        // sender <-> receiver 친구
        Friendship friendship1 = Friendship.createFriendship(sender, receiver); friendship1.accept();
        Friendship friendship2 = Friendship.createFriendship(receiver, sender); friendship2.accept();
        friendshipRepository.save(friendship1);
        friendshipRepository.save(friendship2);

        FriendCreateRequest request = FriendCreateRequest.builder().friendId(receiver.getId()).build();

        // when & then
        assertThatThrownBy(() -> friendService.createFriendRequest(request, sender.getId()))
                .isInstanceOf(BaseException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.FRIENDSHIP_DUPLICATE);
    }

    @DisplayName("자신에게 친구 요청할 수 없다.")
    @Test
    void createFriendRequestToMeTest() {
        // given
        Member member = createMember(1);
        memberRepository.save(member);

        FriendCreateRequest request = FriendCreateRequest.builder().friendId(member.getId()).build();

        // when & then
        assertThatThrownBy(() -> friendService.createFriendRequest(request, member.getId()))
                .isInstanceOf(BaseException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_PARAMETER);
    }

    @DisplayName("친구 요청을 거절한 회원에게 다시 친구 요청을 보낼 수 있다.")
    @Test
    void createReFriendRequestTest() {
        // given
        Member sender = createMember(1);
        Member receiver = createMember(2);
        memberRepository.save(sender);
        memberRepository.save(receiver);

        FriendCreateRequest request = FriendCreateRequest.builder().friendId(receiver.getId()).build();
        friendService.createFriendRequest(request, sender.getId());
        Friendship friendship = friendshipRepository.findBySenderIdAndReceiverId(receiver.getId(), sender.getId()).get();
        friendship.reject(); // receiver가 sender에게 받은 친구 요청 거절
        System.out.println("friendship.getStatus() = " + friendship.getStatus()); // REJECTED

        // when
        FriendshipDto dto = friendService.createFriendRequest(request, sender.getId());
        
        // then
        assertThat(dto.getFriendshipStatus()).isEqualTo(FriendshipStatus.ACCEPTED);
        assertThat(dto.getFriendStatus()).isEqualTo(FriendStatus.SENT);

        Friendship reFriendship = friendshipRepository.findBySenderIdAndReceiverId(receiver.getId(), sender.getId()).get();
        assertThat(reFriendship.getStatus()).isEqualTo(FriendshipStatus.PENDING);
        System.out.println("friendship.getStatus() = " + friendship.getStatus()); // PENDING
    }

    @DisplayName("친구 요청을 수락한다.")
    @Test
    void acceptFriendRequestTest() {
        // given
        Member sender = createMember(1);
        Member receiver = createMember(2);
        memberRepository.save(sender);
        memberRepository.save(receiver);

        // sender -> receiver 친구 요청 생성
        Friendship friendship1 = Friendship.createFriendship(sender, receiver); friendship1.accept();
        Friendship friendship2 = Friendship.createFriendship(receiver, sender);
        friendshipRepository.save(friendship1);
        friendshipRepository.save(friendship2);

        // when
        FriendshipDto dto = friendService.acceptFriendRequest(friendship2.getId(), receiver.getId());

        // then
        assertThat(dto.getFriendshipStatus()).isEqualTo(FriendshipStatus.ACCEPTED);
        assertThat(dto.getFriendStatus()).isEqualTo(FriendStatus.FRIEND);
        assertThat(dto.getFriendId()).isEqualTo(sender.getId());

        boolean b1 = friendshipRepository.existsAcceptedFriendshipBetween(sender.getId(), receiver.getId());
        boolean b2 = friendshipRepository.existsAcceptedFriendshipBetween(receiver.getId(), sender.getId());
        assertThat(b1).isTrue();
        assertThat(b2).isTrue();
    }

    @DisplayName("친구 요청을 거절한다.")
    @Test
    void rejectFriendRequestTest() {
        // given
        Member sender = createMember(1);
        Member receiver = createMember(2);
        memberRepository.save(sender);
        memberRepository.save(receiver);

        // sender -> receiver 친구 요청 생성
        Friendship friendship1 = Friendship.createFriendship(sender, receiver); friendship1.accept();
        Friendship friendship2 = Friendship.createFriendship(receiver, sender);
        friendshipRepository.save(friendship1);
        friendshipRepository.save(friendship2);

        // when
        FriendshipDto dto = friendService.rejectFriendRequest(friendship2.getId(), receiver.getId());

        // then
        assertThat(dto.getFriendshipStatus()).isEqualTo(FriendshipStatus.REJECTED);
        assertThat(dto.getFriendStatus()).isEqualTo(FriendStatus.RECEIVED);
        assertThat(dto.getFriendId()).isEqualTo(sender.getId());

        boolean b1 = friendshipRepository.existsAcceptedFriendshipBetween(sender.getId(), receiver.getId());
        boolean b2 = friendshipRepository.existsAcceptedFriendshipBetween(receiver.getId(), sender.getId());
        assertThat(b1).isTrue();
        assertThat(b2).isFalse();
    }

    @DisplayName("자신이 받은 친구 요청만 처리할 수 있다.")
    @Test
    void processOnlyFriendRequestToMe() {
        // given
        Member sender = createMember(0);
        Member receiver1 = createMember(1);
        Member receiver2 = createMember(2);
        memberRepository.save(sender);
        memberRepository.save(receiver1);

        // sender -> receiver1 친구 요청 생성
        Friendship friendship1 = Friendship.createFriendship(sender, receiver1); friendship1.accept();
        Friendship friendship2 = Friendship.createFriendship(receiver1, sender);
        friendshipRepository.save(friendship1);
        friendshipRepository.save(friendship2);

        // when & then
        assertThatThrownBy(() -> friendService.rejectFriendRequest(friendship2.getId(), receiver2.getId()))
                .isInstanceOf(BaseException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.FRIENDSHIP_FORBIDDEN);

    }

    private Member createMember(int n) {
        return Member.builder().name("test"+n).email("email"+n).nickname("nick"+n).provider("google").providerId("google"+n).identificationUrl("url").build();
    }

}
