import { getAllPublishedPosts } from "@/lib/actions/getPost";
import PostGrid from "@/components/PostGrid";
import { InstagramFeed } from "@/components/InstagramFeed";
import { SectionNav } from "@/components/SectionNav";
import SiteFooter from "@/components/SiteFooter";

export const metadata = {
  title: "Blog | Commons Hub",
  description:
    "Field notes from the Commons Hub — gatherings, residencies, and reflections from the Austrian Alps.",
};

const INSTAGRAM_HANDLE = "commonshub";

export default async function BlogIndex() {
  const posts = await getAllPublishedPosts();

  return (
    <>
      <div className="max-w-6xl mx-auto px-6 py-12 flex gap-12">
        <SectionNav
          sections={[
            { id: "writing", label: "Latest writing" },
            { id: "instagram", label: "Instagram" },
          ]}
        />

        <div className="flex-1 min-w-0 space-y-20">
          <section id="writing" className="scroll-mt-28">
            <h1 className="h1 mb-8">Blog</h1>
            {posts.length > 0 ? (
              <PostGrid posts={posts} />
            ) : (
              <p className="text-slate-600">No posts yet — check back soon.</p>
            )}
          </section>

          <section id="instagram" className="scroll-mt-28">
            <InstagramFeed
              handle={INSTAGRAM_HANDLE}
              pinnedUrl={process.env.NEXT_PUBLIC_INSTAGRAM_PINNED_URL}
            />
          </section>
        </div>
      </div>

      <SiteFooter />
    </>
  );
}
