package com.mystreet.auth.dto;

import java.util.UUID;

public record AuthResponse(
    String token,
    UserInfo user
) {
    public record UserInfo(UUID id, String email, String fullName, boolean isAdmin) {}
}
