package com.ssafy.keepick.friend.persistence;

import com.ssafy.keepick.friend.domain.Friendship;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FriendshipRepository  extends JpaRepository<Friendship, Long> {

    @EntityGraph(attributePaths = {"sender"})
    Optional<Friendship> findByIdWithSender(Long id);

}
