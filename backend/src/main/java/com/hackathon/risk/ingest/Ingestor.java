package com.hackathon.risk.ingest;

import java.util.List;

public interface Ingestor {
    String getSourceType();
    List<RawDoc> fetch();
}
