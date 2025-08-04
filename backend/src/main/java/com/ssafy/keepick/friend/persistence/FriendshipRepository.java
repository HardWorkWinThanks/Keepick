package com.ssafy.keepick.friend.persistence;

import com.ssafy.keepick.friend.domain.Friendship;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface FriendshipRepository  extends JpaRepository<Friendship, Long> {

    @EntityGraph(attributePaths = {"sender"})
    Optional<Friendship> findWithSenderById(Long id);

    Optional<Friendship> findBySenderIdAndReceiverId(Long senderId, Long receiverId);

    @Query("""
        SELECT COUNT(f) > 0
        FROM Friendship f
        WHERE f.sender.id = :senderId AND f.receiver.id = :receiverId
            AND f.status = FriendshipStatus.ACCEPTED
    """)
    boolean existsAcceptedFriendshipBetween(Long senderId, Long receiverId);

    // 보낸 친구 요청 목록
    @Query("""
        SELECT f
        FROM Friendship f JOIN FETCH f.sender
        WHERE f.receiver.id = :memberId
            AND f.status IN (FriendshipStatus.PENDING, FriendshipStatus.REJECTED)
    """)
    List<Friendship> findSentAllByMemberId(Long memberId);

    // 받은 친구 요청 목록
    @Query("""
        SELECT f
        FROM Friendship f JOIN FETCH f.receiver
        WHERE f.sender.id = :memberId
            AND f.status IN (FriendshipStatus.PENDING, FriendshipStatus.REJECTED)
    """)
    List<Friendship> findReceivedAllByMemberId(Long memberId);

    // 친구 목록 조회
    @EntityGraph(attributePaths = {"sender"})
    @Query("""
        SELECT f2
        FROM Friendship f1
        JOIN Friendship f2
            ON f1.sender.id = f2.receiver.id
            AND f1.receiver.id = f2.sender.id
        WHERE f1.sender.id = :memberId
            AND f1.status = FriendshipStatus.ACCEPTED
            AND f2.status = FriendshipStatus.ACCEPTED
    """)
    List<Friendship> findAcceptedAllByMemberId(Long memberId);
}
