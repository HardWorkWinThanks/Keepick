package com.ssafy.keepick.group.persistence;

import com.ssafy.keepick.group.domain.Group;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;


public interface GroupRepository extends JpaRepository<Group, Long> {

    @EntityGraph(attributePaths = {"creator"})
    @Override
    Optional<Group> findById(Long aLong);
}
