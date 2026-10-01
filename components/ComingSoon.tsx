// Khung tạm cho các trang chưa làm; sẽ thay bằng nội dung thật theo từng user story.
export default function ComingSoon({ title, story }: { title: string; story: string }) {
  return (
    <section>
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-slate-500">Sắp có ({story}).</p>
    </section>
  );
}
