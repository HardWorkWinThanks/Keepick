package com.ssafy.keepick.member.persistence;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.ssafy.keepick.member.domain.Member;

@Repository
public interface MemberRepository extends JpaRepository<Member, Long> {

    Optional<Member> findByEmail(String email);
    
    Optional<Member> findByNickname(String nickname);
    
    /**
     * 특정 닉네임으로 시작하는 회원들을 찾습니다.
     * @param nicknamePrefix 검색할 닉네임 접두사
     * @return 해당 접두사로 시작하는 회원 목록
     */
    @Query("SELECT m FROM Member m WHERE m.nickname LIKE :nicknamePrefix%")
    List<Member> findByNicknameStartingWith(@Param("nicknamePrefix") String nicknamePrefix);

}
