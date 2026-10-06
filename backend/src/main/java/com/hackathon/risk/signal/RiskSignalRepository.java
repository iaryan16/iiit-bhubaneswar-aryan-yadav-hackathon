package com.hackathon.risk.signal;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface RiskSignalRepository extends JpaRepository<RiskSignal, String> {

    @Query("SELECT s FROM RiskSignal s WHERE s.impactScore >= :minImpact AND s.timestamp >= :since ORDER BY s.timestamp DESC")
    List<RiskSignal> findFiltered(
            @Param("minImpact") int minImpact,
            @Param("since") Instant since
    );

    List<RiskSignal> findAllByOrderByTimestampDesc();

    long countByEventTypeAndTimestampAfter(EventType eventType, Instant timestamp);
}
