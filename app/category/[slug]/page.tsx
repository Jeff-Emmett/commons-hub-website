import { Carousel } from "@/components/Carousel";
import { Metadata } from "next";
import PostGrid from "@/components/PostGrid";
import { getCategoryBySlug } from "@/lib/actions/getCategory";
import { getPosts } from "@/lib/actions/getPost";
import { getCarousels } from "@/lib/actions/getCarousels";
import { getAccordions } from "@/lib/actions/getAccordions";
import { Database } from "@/lib/database.types";
import Accordion_ch from "@/components/Accordion_ch";
import SiteFooter from "@/components/SiteFooter";
import { AutoSectionNav } from "@/components/AutoSectionNav";
import { generatePageMetadata } from "@/lib/utils/generatePageMetadata";

// Generate dynamic metadata for each category
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  // Get the category data
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  
  if (!category) {
    return {
      title: 'Category Not Found',
    };
  }

  // Use our reusable metadata utility
  return generatePageMetadata({
    title: category.seo_title_tag ? category.seo_title_tag : category.title,
    description: category.seo_description ? category.seo_description : category.summary,
    image: category.main_image,
    icon: category.main_icon,
    url: `https://www.commons-hub.at/category/${slug}`,
    type: 'website'
  });
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const Data = await getCategoryBySlug(slug);
  console.log("fetched Data: ",JSON.stringify(Data))
  
  // If we found a category, fetch related data
  let posts: Database['public']['Tables']['posts']['Row'][] = [];
  if (Data && Data.category_post && Array.isArray(Data.category_post)) {
    // Extract all post IDs
    const postIds = Data.category_post
      .map((relation: { post_id: number }) => relation.post_id)
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

            {carousels.length > 0 &&
              carousels.map((carousel) => (
                <Carousel key={carousel.id} carousel={carousel} />
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
