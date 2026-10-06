package com.hackathon.risk.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Risk Stress Testing Platform API")
                        .version("1.0.0")
                        .description("S&P Global & CRISIL Hackathon 2026 - Module B (Stress Testing) Engine")
                        .license(new License().name("MIT").url("https://opensource.org/licenses/MIT"))
                        .contact(new Contact().name("Risk Engineering Team").email("solo.dev@hackathon.local")));
    }
}
