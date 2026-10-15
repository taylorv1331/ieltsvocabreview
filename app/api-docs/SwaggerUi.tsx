"use client";

import Script from "next/script";

// Swagger UI tải từ cdnjs (ghim phiên bản), không cài vào package.json — Taylor duyệt 2026-10-15
const SWAGGER_VERSION = "5.29.1";
const CDN = `https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/${SWAGGER_VERSION}`;

type SwaggerWindow = Window & {
  SwaggerUIBundle?: (options: Record<string, unknown>) => unknown;
};

export default function SwaggerUi() {
  return (
    <>
      <link rel="stylesheet" href={`${CDN}/swagger-ui.min.css`} precedence="default" />
      <div id="swagger-ui" />
      <Script
        src={`${CDN}/swagger-ui-bundle.min.js`}
        strategy="afterInteractive"
        onReady={() => {
          (window as SwaggerWindow).SwaggerUIBundle?.({
            url: "/openapi.json",
            dom_id: "#swagger-ui",
            deepLinking: true,
            docExpansion: "list",
            defaultModelsExpandDepth: 0,
          });
        }}
      />
    </>
  );
}
