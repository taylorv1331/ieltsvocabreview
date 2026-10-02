import type { MetadataRoute } from "next";

// Thông tin app khi "Thêm vào màn hình chính" (Android dùng file này; iPhone dùng app/apple-icon.png)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ôn từ IELTS",
    short_name: "Ôn từ IELTS",
    description: "Ôn từ vựng IELTS theo phương pháp lặp lại ngắt quãng",
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
