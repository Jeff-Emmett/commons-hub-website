import ClientSideRout from "./ClientSideRout";
import { Database } from "@/lib/database.types";
import IconClientImage from "./IconImageClient";

type Post = Database['public']['Tables']['posts']['Row'];

type Props = {
  posts: Post[];
};

export default function PostGrid({ posts }: Props) {
  // Filter out posts that are not "published"
  const publishedPosts = posts.filter(post => post.status === 'published');

  if (publishedPosts.length === 0) {
    return null;
  }

  return (
    <div className="hero-wrapper w-inline-block py-2 border-y border-gray-100">
      <div className="hero-content">
        <h2>News</h2>
        {publishedPosts.map((post) => (
          <ClientSideRout
            route={`/post/${post.slug}`}
            key={post.id}
          >
            <article className="relative isolate flex flex-col gap-8 lg:flex-row pb-10 group">
              <div className="relative aspect-square lg:w-64 lg:shrink-0 overflow-hidden rounded-2xl">
                <IconClientImage 
                  mainIcon={post.main_icon} 
                  mainImage={post.main_image}
                  title={post.title}
                />
                <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-gray-900/10" />
              </div>
              <div>
                <div className="group relative max-w-xl">
                  <h3 className="mt-3 text-lg font-semibold leading-6">
                    <span className="absolute inset-0" />
                    {post.title}
                  </h3>
                  <div className="mt-3 leading-6 post-detail">
                    {post.summary && (
                      <span
                        dangerouslySetInnerHTML={{
                          __html: post.summary,
                        }}
                      ></span>
                    )}
                  </div>
                </div>
              </div>
            </article>
          </ClientSideRout>
        ))}
      </div>
    </div>
  );
}

