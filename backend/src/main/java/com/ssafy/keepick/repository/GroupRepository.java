package com.ssafy.keepick.repository;

import com.ssafy.keepick.entity.Group;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;


public interface GroupRepository extends JpaRepository<Group, Long> {

    @EntityGraph(attributePaths = {"creator"})
    @Override
    Optional<Group> findById(Long aLong);
}
