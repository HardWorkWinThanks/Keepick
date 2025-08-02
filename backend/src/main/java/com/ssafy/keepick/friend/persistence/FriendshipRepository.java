package com.ssafy.keepick.friend.persistence;

import com.ssafy.keepick.friend.domain.Friendship;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FriendshipRepository  extends JpaRepository<Friendship, Long> {
}
