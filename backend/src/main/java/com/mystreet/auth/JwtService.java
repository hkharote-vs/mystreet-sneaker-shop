package com.mystreet.auth;

import com.mystreet.user.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class JwtService {

    private final JwtEncoder encoder;
    private final long expiryHours;

    public JwtService(JwtEncoder encoder,
                      @Value("${app.jwt.expiry-hours:24}") long expiryHours) {
        this.encoder = encoder;
        this.expiryHours = expiryHours;
    }

    public String generateToken(User user) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
            .issuer("mystreet-api")
            .issuedAt(now)
            .expiresAt(now.plus(expiryHours, ChronoUnit.HOURS))
            .subject(user.getId().toString())
            .claim("email", user.getEmail())
            .claim("isAdmin", user.isAdmin())
            .build();
        return encoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
    }
}
