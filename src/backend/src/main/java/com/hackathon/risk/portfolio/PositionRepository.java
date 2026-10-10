package com.hackathon.risk.portfolio;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PositionRepository extends JpaRepository<Position, String> {
    List<Position> findByAssetClass(String assetClass);
    List<Position> findBySector(String sector);
    List<Position> findByRegion(String region);
}
