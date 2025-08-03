package com.ssafy.keepick.friend.persistence;

import com.ssafy.keepick.friend.domain.Friendship;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface FriendshipRepository  extends JpaRepository<Friendship, Long> {

    @EntityGraph(attributePaths = {"sender"})
    Optional<Friendship> findByIdWithSender(Long id);

    // 보낸 친구 요청 목록
    List<Friendship> findAllWithReceiverBySenderId(Long senderId);

    // 받은 친구 요청 목록
    List<Friendship> findAllWithSenderByReceiverId(Long receiverId);

    // 친구 목록 조회
    List<Friendship> findAcceptedAllByMemberId(Long memberId);
}
