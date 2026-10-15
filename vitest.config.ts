import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Cho Vitest hiểu cách viết tắt "@/..." (= thư mục gốc dự án) giống Next.js (tsconfig.json)
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
});
