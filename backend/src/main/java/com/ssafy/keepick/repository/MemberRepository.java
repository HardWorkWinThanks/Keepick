package com.ssafy.keepick.repository;

import com.ssafy.keepick.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MemberRepository extends JpaRepository<Member, Long> {
}
