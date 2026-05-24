package com.mystreet.auth;

import com.mystreet.auth.dto.LoginRequest;
import com.mystreet.auth.dto.RegisterRequest;
import com.mystreet.auth.exception.EmailAlreadyExistsException;
import com.mystreet.user.User;
import com.mystreet.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    UserRepository userRepository;
    @Mock
    PasswordEncoder passwordEncoder;
    @Mock
    JwtService jwtService;
    @InjectMocks
    AuthService authService;

    private User buildUser(String email, boolean admin) {
        var u = new User();
        u.setId(UUID.randomUUID());
        u.setEmail(email);
        u.setPasswordHash("hashed");
        u.setFullName("Test User");
        u.setAdmin(admin);
        return u;
    }

    @Test
    void register_newEmail_returnsTokenAndUser() {
        var req = new RegisterRequest("new@example.com", "Password1", "New User");
        when(userRepository.existsByEmail(req.email())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");
        var saved = buildUser(req.email(), false);
        when(userRepository.save(any())).thenReturn(saved);
        when(jwtService.generateToken(any())).thenReturn("jwt-token");

        var response = authService.register(req);

        assertThat(response.token()).isEqualTo("jwt-token");
        assertThat(response.user().email()).isEqualTo("new@example.com");
        assertThat(response.user().isAdmin()).isFalse();
    }

    @Test
    void register_duplicateEmail_throwsEmailAlreadyExistsException() {
        var req = new RegisterRequest("dup@example.com", "Password1", null);
        when(userRepository.existsByEmail(req.email())).thenReturn(true);

        assertThatThrownBy(() -> authService.register(req))
            .isInstanceOf(EmailAlreadyExistsException.class)
            .hasMessageContaining("dup@example.com");
    }

    @Test
    void login_correctCredentials_returnsToken() {
        var user = buildUser("user@example.com", false);
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Password1", "hashed")).thenReturn(true);
        when(jwtService.generateToken(user)).thenReturn("jwt-token");

        var req = new LoginRequest("user@example.com", "Password1");
        var response = authService.login(req);

        assertThat(response.token()).isEqualTo("jwt-token");
    }

    @Test
    void login_wrongPassword_throwsBadCredentialsException() {
        var user = buildUser("user@example.com", false);
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(new LoginRequest("user@example.com", "wrong")))
            .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    void login_unknownEmail_throwsBadCredentialsException() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(new LoginRequest("ghost@example.com", "pass")))
            .isInstanceOf(BadCredentialsException.class);
    }
}
