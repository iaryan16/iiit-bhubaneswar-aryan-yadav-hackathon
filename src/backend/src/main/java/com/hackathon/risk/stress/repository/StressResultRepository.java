package com.hackathon.risk.stress.repository;

import com.hackathon.risk.stress.model.StressResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StressResultRepository extends JpaRepository<StressResult, String> {
    List<StressResult> findAllByOrderByTimestampDesc();
}
