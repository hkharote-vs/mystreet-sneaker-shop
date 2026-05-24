package com.mystreet.auth;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.UUID;

public final class AuthUtils {

    private AuthUtils() {}

    public static UUID currentUserId() {
        Jwt jwt = (Jwt) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return UUID.fromString(jwt.getSubject());
    }

    public static boolean isCurrentUserAdmin() {
        Jwt jwt = (Jwt) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return Boolean.TRUE.equals(jwt.getClaimAsBoolean("isAdmin"));
    }
}
