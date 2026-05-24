package com.mystreet.auth;

import com.mystreet.auth.dto.AuthResponse;
import com.mystreet.auth.dto.LoginRequest;
import com.mystreet.auth.dto.RegisterRequest;
import com.mystreet.auth.exception.EmailAlreadyExistsException;
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
