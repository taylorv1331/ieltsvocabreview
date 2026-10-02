import type { MetadataRoute } from "next";
import { APP_DESCRIPTION, APP_NAME, APP_SHORT_NAME } from "@/lib/app";

// Thông tin app khi "Thêm vào màn hình chính" (Android dùng file này; iPhone dùng app/apple-icon.png)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    // Tên dưới icon trên màn hình chính Android
    short_name: APP_SHORT_NAME,
    description: APP_DESCRIPTION,
    start_url: "/",
    // "browser": mở bằng trình duyệt thường để dùng chung phiên đăng nhập với link trong email
    display: "browser",
    background_color: "#fdf2f8",
    theme_color: "#be185d",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
