import ClientSideRout from "@/components/ClientSideRout";
import WhiteOverlay from "@/components/WhiteOverlay";
import ScrollIndicator from "@/components/ScrollIndicator";
import { Carousel } from "@/components/Carousel";
import Image from "next/image";
import { Metadata } from "next";
import PostGrid from "@/components/PostGrid";
import { getCategoryBySlug } from "@/lib/actions/getCategory";  
import { getPosts } from "@/lib/actions/getPost";
import { getCarousels } from "@/lib/actions/getCarousels";
import { getAccordions } from "@/lib/actions/getAccordions";
import { Database } from "@/lib/database.types";
import { getImageUrl } from "@/lib/utils/getImageUrl";
import Accordion_ch from "@/components/Accordion_ch";
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
      <div className="section">
        <div className="content">
          <div className="grid-block">
            <div className="scroll-block">
              <div className="rich-text-wrapper border-b-0"> 

              {carousels.length > 0 &&
                carousels.map((carousel) => (
                  <Carousel key={carousel.id} carousel={carousel} />
                ))}

              {Data?.body && (
                <div
                  className="scroll-block-element"
                  dangerouslySetInnerHTML={{
                    __html: Data?.body,
                  }}
                >
                </div>
              )}

              {accordions.length > 0 &&
                accordions.map((accordion) => (
                  <Accordion_ch key={accordion.id} accordion={accordion} />
                ))}

              {posts.length > 0 && (
                <PostGrid posts={posts} />
              )}

              </div>
              <div className="footer">
                <div className="footer-wrapper">
                  <div
                    // data-w-id="cf718504-e160-62a0-2401-3ebec51b24b9"
                    className="footer-bottom"
                  >
                    <div className="bottom-details">
                      <p className="bottom-link inline"> Commonshub</p>
                    </div>
                    <div className="bottom-details">
                      <ClientSideRout
                        route={`/page/impressum`}
                        ariaLabel="Impressum"
                      >
                        <p className="bottom-link">Impressum</p>
                      </ClientSideRout>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="sticky-block"
            >
              <div
                className="hero-block-content"
              >
                <div className="heading-block">
                  <div className="hero-image w-embed relative overflow-hidden">
                    <WhiteOverlay />
                    {/* If main_image exists, use it */}
                    {Data?.main_image ? (
                      <Image
                        src={await getImageUrl(Data.main_image, 'website-images')}
                        alt={Data?.title || 'Category image'}
                        width={700}
                        height={700}
                        className="rounded-lg shadow-md"
                      />
                    ) : 
                    /* If no main_image but main_icon exists, use icon */
                    Data?.main_icon ? (
                      <Image
                        src={await getImageUrl(Data.main_icon, 'website-images')}
                        alt={Data?.title || 'Category icon'}
                        width={400}
                        height={400}
                      />
                    ) : null}
                  </div>
                </div>
                <div
                  id="w-node-ebbdefe2-e329-0455-5c4a-042b182fa946-39b7cd48"
                  className="description-block relative overflow-hidden bg-slate-50 items-center"
                >
                  <WhiteOverlay />
                  {Data?.title && (
                    <h1
                      className="heading h1 no-margin-bottom font-light"
                      >
                        {Data.title}
                      </h1>
                  )}
                {Data?.summary && (
                  <span
                    className="summary"
                    dangerouslySetInnerHTML={{
                      __html: Data.summary,
                    }}
                  ></span>
                )}
                </div>
              </div>
            </div>
            <ScrollIndicator />
          </div>
        </div>
      </div>
    );
  }
}
