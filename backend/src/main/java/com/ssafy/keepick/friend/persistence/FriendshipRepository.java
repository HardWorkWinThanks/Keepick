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

    Optional<Friendship> findBySenderIdAndReceiverId(Long senderId, Long receiverId);

    // 보낸 친구 요청 목록
    @Query("""
        SELECT f
        FROM Friendship f
            JOIN FETCH f.receiver r
        WHERE f.status IN (FriendshipStatus.PENDING, FriendshipStatus.REJECTED)
            AND f.sender.id = :senderId
        """)
    List<Friendship> findAllWithReceiverBySenderId(Long senderId);

    // 받은 친구 요청 목록
    @Query("""
        SELECT f
        FROM Friendship f
            JOIN FETCH f.sender s
        WHERE f.status IN (FriendshipStatus.PENDING, FriendshipStatus.REJECTED)
            AND f.receiver.id = :receiverId
        """)
    List<Friendship> findAllWithSenderByReceiverId(Long receiverId);

    // 친구 목록 조회
    @Query("""
        SELECT f
        FROM Friendship f
            JOIN FETCH f.sender s
            JOIN FETCH f.receiver r
        WHERE f.status = FriendshipStatus.ACCEPTED
            AND (s.id = :memberId OR r.id = :memberId)
        """)
    List<Friendship> findAcceptedAllByMemberId(Long memberId);
}
