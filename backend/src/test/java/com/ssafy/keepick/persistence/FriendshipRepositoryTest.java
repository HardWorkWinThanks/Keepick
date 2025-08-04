package com.ssafy.keepick.persistence;

import com.ssafy.keepick.friend.domain.Friendship;
import com.ssafy.keepick.friend.domain.FriendshipStatus;
import com.ssafy.keepick.friend.persistence.FriendshipRepository;
import com.ssafy.keepick.member.domain.Member;
import com.ssafy.keepick.member.persistence.MemberRepository;
import jakarta.persistence.EntityManager;
import org.hibernate.Hibernate;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
public class FriendshipRepositoryTest {

    @Autowired
    EntityManager em;

    @Autowired
    FriendshipRepository friendshipRepository;

    @Autowired
    MemberRepository memberRepository;

    @DisplayName("친구 요청한 회원을 함께 조회한다.")
    @Test
    void findWithSenderById() {
        // given
        Member sender = createMember(1);
        Member receiver = createMember(2);

        memberRepository.save(sender);
        memberRepository.save(receiver);

        Friendship friendship = Friendship.createFriendship(sender, receiver);
        friendshipRepository.save(friendship);

        em.flush();
        em.clear();

        // when
        Friendship findFriendship = friendshipRepository.findWithSenderById(friendship.getId()).get();

        // then
        assertThat(findFriendship).isNotNull();

        assertThat(Hibernate.isInitialized(findFriendship.getSender())).isTrue();
        assertThat(Hibernate.isInitialized(findFriendship.getReceiver())).isFalse();
    }

    @DisplayName("두 회원이 친구인지 확인한다.")
    @Test
    void existsAcceptedFriendshipBetween() {
        // given
        Member member = createMember(0);
        Member member1 = createMember(1);
        Member member2 = createMember(2);
        Member member3 = createMember(3);

        memberRepository.save(member);
        memberRepository.save(member1);
        memberRepository.save(member2);
        memberRepository.save(member3);

        Friendship friendship1 = Friendship.createFriendship(member, member1);
        Friendship friendship2 = Friendship.createFriendship(member, member2); friendship2.accept();
        Friendship friendship3 = Friendship.createFriendship(member, member3); friendship3.reject();
        friendshipRepository.save(friendship1);
        friendshipRepository.save(friendship2);
        friendshipRepository.save(friendship3);

        // when
        boolean b1 = friendshipRepository.existsAcceptedFriendshipBetween(member.getId(), member1.getId());
        boolean b2 = friendshipRepository.existsAcceptedFriendshipBetween(member.getId(), member2.getId());
        boolean b3 = friendshipRepository.existsAcceptedFriendshipBetween(member.getId(), member3.getId());

        // then
        assertThat(b1).isFalse();
        assertThat(b2).isTrue();
        assertThat(b3).isFalse();
    }

    @DisplayName("회원이 보낸 친구 요청을 조회한다.")
    @Test
    void findSentAllByMemberIdTest() {
        // given
        Member sender = createMember(0);
        Member receiver1 = createMember(1);
        Member receiver2 = createMember(2);
        Member receiver3 = createMember(3);

        memberRepository.save(sender);
        memberRepository.save(receiver1);
        memberRepository.save(receiver2);
        memberRepository.save(receiver3);

        Friendship friendship1 = createFriendshipRequest(sender, receiver1);
        Friendship friendship2 = createFriendshipRequest(sender, receiver2); friendship2.accept();
        Friendship friendship3 = createFriendshipRequest(sender, receiver3); friendship3.reject();

        // when
        List<Friendship> list = friendshipRepository.findSentAllByMemberId(sender.getId());

        // then
        assertThat(list.size()).isEqualTo(2);
        assertThat(list).contains(friendship1, friendship3);
        assertThat(list).doesNotContain(friendship2);

        assertThat(list).extracting("sender").contains(receiver1, receiver3);
        assertThat(list).extracting("status").doesNotContain(FriendshipStatus.ACCEPTED);
    }

    @DisplayName("회원이 받은 친구 요청을 조회한다.")
    @Test
    void findReceivedAllByMemberIdTest() {
        // given
        Member receiver = createMember(0);
        Member sender1 = createMember(1);
        Member sender2 = createMember(2);
        Member sender3 = createMember(3);

        memberRepository.save(receiver);
        memberRepository.save(sender1);
        memberRepository.save(sender2);
        memberRepository.save(sender3);

        Friendship friendship1 = createFriendshipRequest(sender1, receiver);
        Friendship friendship2 = createFriendshipRequest(sender2, receiver); friendship2.accept();
        Friendship friendship3 = createFriendshipRequest(sender3, receiver); friendship3.reject();

        // when
        List<Friendship> list = friendshipRepository.findReceivedAllByMemberId(receiver.getId());

        // then
        assertThat(list.size()).isEqualTo(2);
        assertThat(list).contains(friendship1, friendship3);
        assertThat(list).doesNotContain(friendship2);

        assertThat(list).extracting("receiver").contains(sender1, sender3);
        assertThat(list).extracting("status").doesNotContain(FriendshipStatus.ACCEPTED);
    }


    @DisplayName("회원과 친구인 회원을 모두 조회한다.")
    @Test
    void findAcceptedAllByMemberIdTest() {
        // given
        Member sender = createMember(1);
        Member receiver = createMember(2);

        memberRepository.save(sender);
        memberRepository.save(receiver);

        Friendship friendship1 = Friendship.createFriendship(sender, receiver); friendship1.accept();
        Friendship friendship2 = Friendship.createFriendship(receiver, sender); friendship2.accept();
        friendshipRepository.save(friendship1);
        friendshipRepository.save(friendship2);

        em.flush();
        em.clear();

        // when
        List<Friendship> list = friendshipRepository.findAcceptedAllByMemberId(sender.getId());

        // then
        assertThat(list.size()).isEqualTo(1);

        Friendship friendship = list.get(0);
        assertThat(friendship.getId()).isEqualTo(friendship2.getId());
        assertThat(friendship.getSender().getId()).isEqualTo(receiver.getId());
        assertThat(friendship.getReceiver().getId()).isEqualTo(sender.getId());

        System.out.println("friendship = " + friendship);
        System.out.println("sender = " + friendship.getSender());
        System.out.println("sender = " + friendship.getSender().getId());
        System.out.println("sender = " + friendship.getSender().getName());
        System.out.println("receiver = " + friendship.getReceiver());
        System.out.println("receiver = " + friendship.getReceiver().getId());
        System.out.println("receiver = " + friendship.getReceiver().getName());
    }


    private Member createMember(int n) {
        return Member.builder().name("test"+n).email("email"+n).nickname("nick"+n).provider("google").providerId("google"+n).identificationUrl("url").build();
    }

    private Friendship createFriendshipRequest(Member sender, Member receiver) {
        Friendship friendship1 = Friendship.createFriendship(sender, receiver);friendship1.accept();
        Friendship friendship2 = Friendship.createFriendship(receiver, sender);
        friendshipRepository.save(friendship1);
        friendshipRepository.save(friendship2);
        return friendship2;
    }
}
