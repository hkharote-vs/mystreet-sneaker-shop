# Stage 1: Build
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY gradlew gradlew
COPY gradle gradle/
COPY build.gradle.kts settings.gradle.kts ./
RUN chmod +x gradlew && ./gradlew dependencies --no-daemon --quiet
COPY src src/
RUN ./gradlew bootJar --no-daemon -x test

# Stage 2: Minimal runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -g 1001 appgroup && adduser -u 1001 -G appgroup -s /bin/sh -D appuser
USER appuser
COPY --from=build --chown=appuser:appgroup /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-XX:+UseZGC", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
