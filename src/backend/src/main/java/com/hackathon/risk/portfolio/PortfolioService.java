package com.hackathon.risk.portfolio;

import com.hackathon.risk.api.dto.PortfolioSummaryDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PortfolioService {

    private final PositionRepository positionRepository;
    private final PortfolioDataLoader portfolioDataLoader;

    public List<Position> getAllPositions() {
        return positionRepository.findAll();
    }

    public PortfolioSummaryDto resetToDefault() {
        portfolioDataLoader.reloadDefaultPortfolio();
        return getSummary();
    }


    public PortfolioSummaryDto getSummary() {
        List<Position> positions = positionRepository.findAll();

        double totalMarketValue = 0.0;
        double totalNotional = 0.0;
        double totalExpectedLoss = 0.0;

        Map<String, Double> byAssetClass = new TreeMap<>();
        Map<String, Double> bySector = new TreeMap<>();
        Map<String, Double> byRegion = new TreeMap<>();

        for (Position pos : positions) {
            double mv = pos.getMarketValue() != null ? pos.getMarketValue() : 0.0;
            double notional = pos.getNotional() != null ? pos.getNotional() : 0.0;

            totalMarketValue += mv;
            totalNotional += notional;

            // Compute baseline Expected Loss = PD * LGD * EAD (for loans / bonds with PD)
            if (pos.getPd() != null && pos.getLgd() != null) {
                totalExpectedLoss += pos.getPd() * pos.getLgd() * notional;
            }

            byAssetClass.merge(pos.getAssetClass(), mv, Double::sum);
            bySector.merge(pos.getSector(), mv, Double::sum);
            byRegion.merge(pos.getRegion(), mv, Double::sum);
        }

        return PortfolioSummaryDto.builder()
                .totalPositions(positions.size())
                .totalMarketValue(round(totalMarketValue))
                .totalNotional(round(totalNotional))
                .totalExpectedLoss(round(totalExpectedLoss))
                .byAssetClass(roundMap(byAssetClass))
                .bySector(roundMap(bySector))
                .byRegion(roundMap(byRegion))
                .build();
    }

    private double round(double val) {
        return Math.round(val * 100.0) / 100.0;
    }

    private Map<String, Double> roundMap(Map<String, Double> map) {
        return map.entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        e -> round(e.getValue()),
                        (a, b) -> a,
                        TreeMap::new
                ));
    }
}
