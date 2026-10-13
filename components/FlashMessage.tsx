"use client";

import { useEffect } from "react";

// Thông báo một lần sau khi lưu / xoá (đọc từ query trên URL).
// Hiện xong thì xoá query khỏi thanh địa chỉ, để tải lại trang không hiện lại.
export default function FlashMessage({ message, cleanPath }: { message: string; cleanPath: string }) {
  useEffect(() => {
    window.history.replaceState(null, "", cleanPath);
  }, [cleanPath]);

  return (
    <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
      {message}
    </p>
  );
}
