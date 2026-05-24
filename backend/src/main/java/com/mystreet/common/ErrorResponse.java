package com.mystreet.common;

import java.time.Instant;
import java.util.List;

public record ErrorResponse(
    Instant timestamp,
    String path,
    String error,
    String message,
    List<String> details
) {
    public static ErrorResponse of(String path, String error, String message) {
        return new ErrorResponse(Instant.now(), path, error, message, List.of());
    }

    public static ErrorResponse of(String path, String error, String message, List<String> details) {
        return new ErrorResponse(Instant.now(), path, error, message, details);
    }
}
