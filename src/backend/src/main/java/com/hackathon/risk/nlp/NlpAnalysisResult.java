package com.hackathon.risk.nlp;

import com.hackathon.risk.signal.EventType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NlpAnalysisResult {
    private String text;
    private Double sentiment;
    private EventType eventType;
    private Double eventConfidence;
    @Builder.Default
    private List<String> entities = new ArrayList<>();
    private String engineUsed;
}
