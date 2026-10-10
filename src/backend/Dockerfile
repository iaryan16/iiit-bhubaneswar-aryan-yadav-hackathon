FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=5s --retries=3 CMD wget -q -O - http://localhost:8080/health || exit 1
ENTRYPOINT ["java", "-jar", "app.jar"]
