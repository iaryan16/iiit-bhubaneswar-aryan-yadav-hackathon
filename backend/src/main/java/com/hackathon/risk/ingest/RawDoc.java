package com.hackathon.risk.ingest;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RawDoc {
    private String id;
    private String source;
    private String title;
    private String snippet;
    private String url;
    private Instant publishedAt;
}
