package com.mystreet.common;

import com.mystreet.auth.exception.EmailAlreadyExistsException;
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

    @ExceptionHandler(EmailAlreadyExistsException.class)
    ResponseEntity<ErrorResponse> handleEmailExists(
            EmailAlreadyExistsException ex, HttpServletRequest req) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(ErrorResponse.of(req.getRequestURI(), "EMAIL_CONFLICT", ex.getMessage()));
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
