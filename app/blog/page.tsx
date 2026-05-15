import Image from "next/image";
import { getAllPublishedPosts } from "@/lib/actions/getPost";
import WhiteOverlay from "@/components/WhiteOverlay";
import ClientSideRout from "@/components/ClientSideRout";
import ScrollIndicator from "@/components/ScrollIndicator";
import PostGrid from "@/components/PostGrid";
import { InstagramFeed } from "@/components/InstagramFeed";

export const metadata = {
  title: "Blog | Commons Hub",
  description:
    "Field notes from the Commons Hub — gatherings, residencies, and reflections from the Austrian Alps.",
};

const INSTAGRAM_HANDLE = "commonshub";

export default async function BlogIndex() {
  const posts = await getAllPublishedPosts();

  return (
    <div className="section">
      <div className="content">
        <div className="grid-block">
          <div className="scroll-block">
            <section className="scroll-block-element mb-10">
              <h2 className="h2 mb-4">Latest writing</h2>
              {posts.length > 0 ? (
                <PostGrid posts={posts} />
              ) : (
                <p className="text-slate-600">No posts yet — check back soon.</p>
              )}
            </section>

            <section className="scroll-block-element">
              <InstagramFeed
                handle={INSTAGRAM_HANDLE}
                pinnedUrl={process.env.NEXT_PUBLIC_INSTAGRAM_PINNED_URL}
              />
            </section>

            <div className="footer">
              <div className="footer-wrapper">
                <div className="footer-bottom">
                  <div className="bottom-details">
                    <p className="bottom-link inline"> Commons Hub</p>
                  </div>
                  <div className="bottom-details">
                    <ClientSideRout route={`/page/impressum`} ariaLabel="Impressum">
                      <p className="bottom-link">Impressum</p>
                    </ClientSideRout>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="sticky-block">
            <div className="hero-block-content">
              <div className="heading-block">
                <div className="icon-wrapper">
                  <div className="icon-block">
                    <div className="icon-image">
                      <Image
                        src="/logos/VERTICAL_commons_hub_LOGO_black.svg"
                        alt="Commons Hub Logo"
                        width={400}
                        height={400}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="description-block relative overflow-hidden bg-slate-50 items-center">
                <WhiteOverlay />
                <h1 className="h1 mb-0 font-light">BLOG</h1>
              </div>
            </div>
          </div>
          <ScrollIndicator />
        </div>
      </div>
    </div>
  );
}
