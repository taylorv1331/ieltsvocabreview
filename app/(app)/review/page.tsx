import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { todayVN } from "@/lib/date";
import { getDueWords } from "@/lib/review";
import ReviewSession from "./ReviewSession";

export default async function ReviewSessionPage() {
  const supabase = await createClient();
  // Cùng danh sách và thứ tự với màn hình Ôn tập (AC-03.1)
  const cards = await getDueWords(supabase, todayVN());

  // Không còn từ đến hạn → về trang Ôn tập để thấy "Xong bài hôm nay"
  if (cards.length === 0) redirect("/");

  return <ReviewSession initialCards={cards} />;
}
