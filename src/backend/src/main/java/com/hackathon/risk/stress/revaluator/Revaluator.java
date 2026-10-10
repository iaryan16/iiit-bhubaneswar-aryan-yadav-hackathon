package com.hackathon.risk.stress.revaluator;

import com.hackathon.risk.portfolio.Position;
import com.hackathon.risk.stress.model.AppliedShocks;
import com.hackathon.risk.stress.model.RevaluationResult;

public interface Revaluator {
    boolean supports(String assetClass);
    RevaluationResult revalue(Position position, AppliedShocks shocks);
}
