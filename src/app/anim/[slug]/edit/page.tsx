import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AnimationForm from "@/components/AnimationForm";

export default async function EditAnimationPage({ params }: PageProps<"/anim/[slug]/edit">) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/anim/${slug}/edit`);
  }

  const { data: animation } = await supabase
    .from("animations")
    .select("author_id, title, description, category, use_case, tags, css_content, js_source")
    .eq("slug", slug)
    .maybeSingle();

  if (!animation) notFound();
  if (animation.author_id !== user.id) {
    redirect(`/anim/${slug}`);
  }

  return (
    <AnimationForm
      mode="edit"
      slug={slug}
      initialData={{
        title: animation.title,
        description: animation.description ?? "",
        category: animation.category,
        useCase: animation.use_case ?? "",
        tags: animation.tags ?? [],
        cssContent: animation.css_content,
        jsSource: animation.js_source ?? "",
      }}
    />
  );
}
