import { CarouselOrGallery } from "@/components/CarouselOrGallery";
import PostGrid from "@/components/PostGrid";
import { getPostBySlug } from "@/lib/actions/getPost";
import { getPosts } from "@/lib/actions/getPost";
import { getCarousels } from "@/lib/actions/getCarousels";
import { getAccordions } from "@/lib/actions/getAccordions";
import { Database } from "@/lib/database.types";
import Accordion_ch from "@/components/Accordion_ch";
import SiteFooter from "@/components/SiteFooter";
import { AutoSectionNav } from "@/components/AutoSectionNav";
import { Metadata } from "next";
import { generatePageMetadata } from "@/lib/utils/generatePageMetadata";
import Progress from "@/components/Progress";

// Generate dynamic metadata for each post
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  // Get the post data
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  
  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  // Use our reusable metadata utility
  return generatePageMetadata({
    title: post.seo_title_tag ? post.seo_title_tag : post.title,
    description: post.seo_description ? post.seo_description : post.summary,
    image: post.main_image,
    icon: post.main_icon,
    url: `https://www.commons-hub.at/post/${slug}`,
    type: 'article'
  });
}
export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Pass the slug to getCategoryBySlug
  const Data = await getPostBySlug(slug);
  console.log("fetched Data: ",JSON.stringify(Data))
  
  // If we found a post, fetch related data
  let posts: Database['public']['Tables']['posts']['Row'][] = [];
  if (Data && Data.category_post && Array.isArray(Data.category_post)) {
    // Extract all post IDs
    const postIds = Data.category_post
      .map((relation: { category_id: number }) => relation.category_id)
      .filter(Boolean);
    
    // Fetch all posts in a single query
    if (postIds.length > 0) {
      posts = await getPosts(postIds);
    }
  }

  let carousels: Database['public']['Tables']['carousels']['Row'][] = [];
  if (Data && Data.category_carousel && Array.isArray(Data.category_carousel)) {
    // Extract all carousel IDs
    const carouselIds = Data.category_carousel
      .map((relation: { carousel_id: number }) => relation.carousel_id)
      .filter(Boolean);

    // Fetch all carousels in a single query
    if (carouselIds.length > 0) {
      carousels = await getCarousels(carouselIds);
      console.log("fetched Carousels: ",JSON.stringify(carousels))
    }
  }

  let accordions: Database['public']['Tables']['accordions']['Row'][] = [];
  if (Data && Data.category_accordion && Array.isArray(Data.category_accordion)) {
    // Extract all accordion IDs
    const accordionIds = Data.category_accordion
      .map((relation: { accordion_id: number }) => relation.accordion_id)
      .filter(Boolean);
    
    // Fetch all accordions in a single query
    if (accordionIds.length > 0) {
      accordions = await getAccordions(accordionIds);
      console.log("fetched Accordions: ",JSON.stringify(accordions))
    }
  }

  if (Data) {
    return (
      <>
        <div className="max-w-6xl mx-auto px-6 py-12 flex gap-12">
          <AutoSectionNav containerId="cms-content" />
          <div id="cms-content" className="flex-1 min-w-0">
            {(Data?.title || Data?.summary) && (
              <header className="mb-10 border-b border-gray-100 pb-6">
                {Data?.title && (
                  <h1 className="h2 md:h1 mb-3 font-light">{Data.title}</h1>
                )}
                {Data?.summary && (
                  <div
                    className="summary"
                    dangerouslySetInnerHTML={{ __html: Data.summary }}
                  ></div>
                )}
              </header>
            )}

            {Data.title && Data.slug === "community-lending" && (
              <Progress
                currentValue={161400}
                targetValue={250000}
                threshold1={100000}
                threshold2={200000}
                label1=""
                label2=""
                label3=""
                title="AMOUNT PLEDGED"
              />
            )}

            {carousels.length > 0 &&
              carousels.map((carousel) => (
                <CarouselOrGallery key={carousel.id} carousel={carousel} />
              ))}

            {Data?.body && (
              <div
                className="scroll-block-element"
                dangerouslySetInnerHTML={{ __html: Data?.body }}
              ></div>
            )}

            {accordions.length > 0 &&
              accordions.map((accordion) => (
                <Accordion_ch key={accordion.id} accordion={accordion} />
              ))}

            {posts.length > 0 && <PostGrid posts={posts} />}
          </div>
        </div>
        <SiteFooter />
      </>
    );
  }
}
