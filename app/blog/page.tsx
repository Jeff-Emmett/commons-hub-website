import { getAllPublishedPosts } from "@/lib/actions/getPost";
import PostGrid from "@/components/PostGrid";
import { InstagramFeed } from "@/components/InstagramFeed";
import { SectionNav } from "@/components/SectionNav";
import SiteFooter from "@/components/SiteFooter";
import { getPageContent, getSiteSettings, pageMetadata, sectionEdit } from "@/lib/cms/content";

// Content: Directus → Pages → "BLOG" → Sections (writing, instagram); the posts
// are Blog & Events → Posts; the Instagram account is Settings → Site settings.
export function generateMetadata() {
  return pageMetadata("blog", {
    title: "Blog",
    description:
      "Field notes from the Commons Hub — gatherings, residencies, and reflections from the Austrian Alps.",
  });
}

export default async function BlogIndex() {
  const [posts, page, site] = await Promise.all([
    getAllPublishedPosts(),
    getPageContent("blog"),
    getSiteSettings(),
  ]);
  const { writing, instagram } = page?.sections ?? {};
  const showInstagram = instagram && site.instagram_handle;

  return (
    <>
      <div className="max-w-6xl mx-auto px-6 py-12 flex gap-12">
        <SectionNav
          sections={[
            ...(writing ? [{ id: "writing", label: writing.nav_label || writing.heading }] : []),
            ...(showInstagram ? [{ id: "instagram", label: instagram.nav_label || instagram.heading }] : []),
          ]}
        />

        <div className="flex-1 min-w-0 space-y-20">
          {writing && (
            <section id="writing" className="scroll-mt-28" {...sectionEdit(writing)}>
              <h1 className="h1 mb-8">{writing.heading}</h1>
              {posts.length > 0 ? (
                <PostGrid posts={posts} />
              ) : (
                <p className="text-slate-600" dangerouslySetInnerHTML={{ __html: writing.text }} />
              )}
            </section>
          )}

          {showInstagram && (
            <section id="instagram" className="scroll-mt-28" {...sectionEdit(instagram)}>
              <InstagramFeed
                handle={site.instagram_handle}
                pinnedUrl={process.env.NEXT_PUBLIC_INSTAGRAM_PINNED_URL}
              />
            </section>
          )}
        </div>
      </div>

      <SiteFooter />
    </>
  );
}
