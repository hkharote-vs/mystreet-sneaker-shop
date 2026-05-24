package com.mystreet.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mystreet.auth.dto.AuthResponse;
import com.mystreet.auth.dto.LoginRequest;
import com.mystreet.auth.dto.RegisterRequest;
import com.mystreet.auth.exception.EmailAlreadyExistsException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@Import(TestSecurityConfig.class)
class AuthControllerTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @MockitoBean
    AuthService authService;

    private AuthResponse fakeResponse(String email, boolean admin) {
        var userInfo = new AuthResponse.UserInfo(UUID.randomUUID(), email, "Test User", admin);
        return new AuthResponse("fake-jwt-token", userInfo);
    }

    @Test
    void register_validRequest_returns201() throws Exception {
        when(authService.register(any())).thenReturn(fakeResponse("new@example.com", false));

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    new RegisterRequest("new@example.com", "Password1!", "Test"))))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.token").value("fake-jwt-token"))
            .andExpect(jsonPath("$.user.email").value("new@example.com"));
    }

    @Test
    void register_blankEmail_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    new RegisterRequest("", "Password1!", "Test"))))
            .andExpect(status().isBadRequest());
    }

    @Test
    void register_shortPassword_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    new RegisterRequest("test@example.com", "short", "Test"))))
            .andExpect(status().isBadRequest());
    }

    @Test
    void register_duplicateEmail_returns409() throws Exception {
        when(authService.register(any()))
            .thenThrow(new EmailAlreadyExistsException("dup@example.com"));

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    new RegisterRequest("dup@example.com", "Password1!", "Test"))))
            .andExpect(status().isConflict());
    }

    @Test
    void login_validCredentials_returns200WithToken() throws Exception {
        when(authService.login(any())).thenReturn(fakeResponse("admin@mystreet.com", true));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    new LoginRequest("admin@mystreet.com", "Admin@1234"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").value("fake-jwt-token"))
            .andExpect(jsonPath("$.user.isAdmin").value(true));
    }

    @Test
    void login_invalidCredentials_returns401() throws Exception {
        when(authService.login(any())).thenThrow(new BadCredentialsException("Invalid credentials"));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    new LoginRequest("admin@mystreet.com", "wrong"))))
            .andExpect(status().isUnauthorized());
    }
}
