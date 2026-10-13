import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { toWordInput } from "@/lib/words";
import WordForm from "@/components/WordForm";

export default async function EditWordPage({ params }: PageProps<"/words/[id]/sua">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: word } = await supabase
    .from("words")
    .select("id, term, part_of_speech, meaning_vi, definition_en, example, collocations, notes")
    .eq("id", id)
    .maybeSingle();
  if (!word) notFound();

  return (
    <section className="mx-auto max-w-xl">
      <h1 className="text-2xl font-bold">Sửa từ</h1>
      <WordForm wordId={word.id} initial={toWordInput(word)} />
    </section>
  );
}
