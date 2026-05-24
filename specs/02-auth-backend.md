# SPEC-02: Authentication — Backend

**Status:** `[x] Complete`  
**Depends on:** SPEC-01 (database schema)  
**Blocks:** SPEC-03 (product backend admin endpoints), SPEC-04 (order backend), SPEC-06 (auth frontend)  

---

## Overview

Implement stateless JWT-based authentication using Spring Security 7 and the OAuth2 Resource Server. Provide `POST /api/auth/register` and `POST /api/auth/login` endpoints. JWT uses RS256 (RSA key pair). The `isAdmin` flag is embedded in the token as a custom claim.

---

## Package Structure

```
com.mystreet.auth/
  ├── AuthController.java
  ├── AuthService.java
  ├── JwtService.java
  ├── SecurityConfig.java
  ├── dto/
  │   ├── RegisterRequest.java     (Record)
  │   ├── LoginRequest.java        (Record)
  │   └── AuthResponse.java        (Record)
  └── exception/
      └── EmailAlreadyExistsException.java

com.mystreet.user/
  ├── User.java                    (JPA Entity — defined in SPEC-01)
  ├── UserRepository.java
  └── UserService.java

com.mystreet.common/
  ├── GlobalExceptionHandler.java
  └── ErrorResponse.java           (Record)
```

---

## RSA Key Pair Setup

Generate the key pair and place in `backend/src/main/resources/certs/`:

```bash
# From backend/ directory
mkdir -p src/main/resources/certs

# Generate private key (PKCS8 format — required by Spring Security)
openssl genrsa -out src/main/resources/certs/private.pem 2048

# Extract public key
openssl rsa -in src/main/resources/certs/private.pem \
    -pubout -out src/main/resources/certs/public.pem
```

Add to `.gitignore`:
```
backend/src/main/resources/certs/private.pem
```

Commit only `public.pem`. In production (Render), the private key is set as an environment variable.

Add to `application.yml`:
```yaml
app:
  jwt:
    private-key: ${JWT_PRIVATE_KEY:classpath:certs/private.pem}
    public-key: ${JWT_PUBLIC_KEY:classpath:certs/public.pem}
    expiry-hours: ${JWT_EXPIRY_HOURS:24}
  cors:
    allowed-origins: ${CORS_ALLOWED_ORIGINS:http://localhost:5173}
```

---

## Implementation

### 1. `ErrorResponse.java` (Record)

```java
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
```

### 2. `GlobalExceptionHandler.java`

```java
package com.mystreet.common;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ErrorResponse> handleValidation(
            MethodArgumentNotValidException ex, HttpServletRequest req) {
        List<String> details = ex.getBindingResult().getFieldErrors().stream()
            .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
            .toList();
        return ResponseEntity.badRequest()
            .body(ErrorResponse.of(req.getRequestURI(), "VALIDATION_ERROR",
                "Request validation failed", details));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    ResponseEntity<ErrorResponse> handleConstraintViolation(
            ConstraintViolationException ex, HttpServletRequest req) {
        List<String> details = ex.getConstraintViolations().stream()
            .map(cv -> cv.getPropertyPath() + ": " + cv.getMessage())
            .toList();
        return ResponseEntity.badRequest()
            .body(ErrorResponse.of(req.getRequestURI(), "VALIDATION_ERROR",
                "Constraint violation", details));
    }

    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<ErrorResponse> handleAccessDenied(
            AccessDeniedException ex, HttpServletRequest req) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(ErrorResponse.of(req.getRequestURI(), "FORBIDDEN",
                "You do not have permission to access this resource"));
    }

    @ExceptionHandler(AuthenticationException.class)
    ResponseEntity<ErrorResponse> handleAuth(
            AuthenticationException ex, HttpServletRequest req) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(ErrorResponse.of(req.getRequestURI(), "UNAUTHORIZED", ex.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ErrorResponse> handleGeneric(Exception ex, HttpServletRequest req) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ErrorResponse.of(req.getRequestURI(), "INTERNAL_ERROR",
                "An unexpected error occurred"));
    }
}
```

### 3. `UserRepository.java`

```java
package com.mystreet.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
}
```

### 4. DTOs (Records)

```java
// RegisterRequest.java
package com.mystreet.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank @Email String email,
    @NotBlank @Size(min = 8, message = "Password must be at least 8 characters") String password,
    String fullName
) {}

// LoginRequest.java
package com.mystreet.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
    @NotBlank @Email String email,
    @NotBlank String password
) {}

// AuthResponse.java
package com.mystreet.auth.dto;

import java.util.UUID;

public record AuthResponse(
    String token,
    UserInfo user
) {
    public record UserInfo(UUID id, String email, String fullName, boolean isAdmin) {}
}
```

### 5. `JwtService.java`

```java
package com.mystreet.auth;

import com.mystreet.user.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jwt.*;
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
```

### 6. `AuthService.java`

```java
package com.mystreet.auth;

import com.mystreet.auth.dto.AuthResponse;
import com.mystreet.auth.dto.LoginRequest;
import com.mystreet.auth.dto.RegisterRequest;
import com.mystreet.user.User;
import com.mystreet.user.UserRepository;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new EmailAlreadyExistsException(request.email());
        }
        var user = new User();
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setFullName(request.fullName());
        user.setAdmin(false);
        var saved = userRepository.save(user);
        return toAuthResponse(saved);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        var user = userRepository.findByEmail(request.email())
            .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid credentials");
        }
        return toAuthResponse(user);
    }

    private AuthResponse toAuthResponse(User user) {
        String token = jwtService.generateToken(user);
        var userInfo = new AuthResponse.UserInfo(
            user.getId(), user.getEmail(), user.getFullName(), user.isAdmin());
        return new AuthResponse(token, userInfo);
    }
}
```

### 7. `EmailAlreadyExistsException.java`

```java
package com.mystreet.auth.exception;

public class EmailAlreadyExistsException extends RuntimeException {
    public EmailAlreadyExistsException(String email) {
        super("Email already registered: " + email);
    }
}
```

Add handler in `GlobalExceptionHandler`:
```java
@ExceptionHandler(EmailAlreadyExistsException.class)
ResponseEntity<ErrorResponse> handleEmailExists(
        EmailAlreadyExistsException ex, HttpServletRequest req) {
    return ResponseEntity.status(HttpStatus.CONFLICT)
        .body(ErrorResponse.of(req.getRequestURI(), "EMAIL_CONFLICT", ex.getMessage()));
}
```

### 8. `AuthController.java`

```java
package com.mystreet.auth;

import com.mystreet.auth.dto.AuthResponse;
import com.mystreet.auth.dto.LoginRequest;
import com.mystreet.auth.dto.RegisterRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Authentication")
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @Operation(summary = "Register a new user")
    @PostMapping("/register")
    ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @Operation(summary = "Login with email and password")
    @PostMapping("/login")
    ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
}
```

### 9. `SecurityConfig.java`

```java
package com.mystreet.auth;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${app.jwt.public-key}")
    private Resource publicKeyResource;

    @Value("${app.jwt.private-key}")
    private Resource privateKeyResource;

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                .requestMatchers("/actuator/**").permitAll()
                .requestMatchers("/swagger-ui/**", "/api-docs/**").permitAll()
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.decoder(jwtDecoder())))
            .build();
    }

    @Bean
    JwtDecoder jwtDecoder() throws Exception {
        RSAPublicKey publicKey = (RSAPublicKey) PemUtils.readPublicKey(publicKeyResource);
        return NimbusJwtDecoder.withPublicKey(publicKey).build();
    }

    @Bean
    JwtEncoder jwtEncoder() throws Exception {
        RSAPublicKey publicKey = (RSAPublicKey) PemUtils.readPublicKey(publicKeyResource);
        RSAPrivateKey privateKey = (RSAPrivateKey) PemUtils.readPrivateKey(privateKeyResource);
        var jwk = new RSAKey.Builder(publicKey).privateKey(privateKey).build();
        return new NimbusJwtEncoder(new ImmutableJWKSet<>(new JWKSet(jwk)));
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        var config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(allowedOrigins.split(",")));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
```

**Note:** `PemUtils` is a small utility class that reads PEM-encoded RSA keys from Spring `Resource` objects. Implement using `java.security.KeyFactory` with PKCS8 encoding for private keys and X509 for public keys.

---

## Admin Authorization Helper

Add a utility to extract the `isAdmin` claim from the JWT principal in controllers:

```java
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
```

---

## API Contracts

### `POST /api/auth/register`

**Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass@1",
  "fullName": "John Doe"
}
```

**Response `201 Created`:**
```json
{
  "token": "eyJhbGciOiJSUzI1NiJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "fullName": "John Doe",
    "isAdmin": false
  }
}
```

**Error `400`:** Email blank / invalid format  
**Error `400`:** Password < 8 characters  
**Error `409`:** Email already registered

---

### `POST /api/auth/login`

**Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass@1"
}
```

**Response `200 OK`:**  
Same shape as register response.

**Error `400`:** Blank fields  
**Error `401`:** Invalid credentials (same message for wrong email or wrong password — no enumeration)

---

## Tests

### `AuthServiceTest.java`

```java
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UserRepository userRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtService jwtService;
    @InjectMocks AuthService authService;

    @Test
    void register_newEmail_returnsTokenAndUser() { ... }

    @Test
    void register_duplicateEmail_throwsEmailAlreadyExistsException() { ... }

    @Test
    void login_correctCredentials_returnsToken() { ... }

    @Test
    void login_wrongPassword_throwsBadCredentialsException() { ... }

    @Test
    void login_unknownEmail_throwsBadCredentialsException() { ... }
}
```

### `AuthControllerTest.java` (MockMvc)

```java
@WebMvcTest(AuthController.class)
class AuthControllerTest {

    @Test
    void register_validRequest_returns201() { ... }

    @Test
    void register_blankEmail_returns400() { ... }

    @Test
    void register_shortPassword_returns400() { ... }

    @Test
    void login_validCredentials_returns200WithToken() { ... }

    @Test
    void login_invalidCredentials_returns401() { ... }
}
```

---

## Manual Verification (Postman / curl)

```bash
# Register
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@1234","fullName":"Test User"}'
# Expected: 201 with token

# Register duplicate email
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@1234"}'
# Expected: 409 CONFLICT

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mystreet.com","password":"Admin@1234"}'
# Expected: 200 with token where isAdmin=true

# Wrong password
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mystreet.com","password":"wrongpassword"}'
# Expected: 401 UNAUTHORIZED

# Access protected endpoint without token
curl http://localhost:8080/api/orders/mine
# Expected: 401
```

---

## Acceptance Criteria

- [ ] `POST /api/auth/register` with valid body returns `201` with JWT and user info
- [ ] `POST /api/auth/register` with duplicate email returns `409`
- [ ] `POST /api/auth/register` with password < 8 chars returns `400`
- [ ] `POST /api/auth/login` with correct credentials returns `200` with JWT
- [ ] `POST /api/auth/login` with wrong password returns `401`
- [ ] JWT payload contains `sub` (user UUID), `email`, `isAdmin`, `exp`
- [ ] Admin login returns JWT with `isAdmin: true`
- [ ] `GET /api/products` accessible without token (public)
- [ ] `GET /api/orders/mine` without token returns `401`
- [ ] All auth tests pass (`./gradlew test`)
