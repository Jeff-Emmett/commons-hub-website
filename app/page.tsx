import ClientSideRout from "@/components/ClientSideRout";
import HeroCategory from "@/components/HeroCategory";
import WhiteOverlay from "@/components/WhiteOverlay";
import ScrollIndicator from "@/components/ScrollIndicator";
import { Carousel } from "@/components/Carousel";
import PostGrid from "@/components/PostGrid";
import NewsletterSignup from "@/components/NewsletterSignup";
import { getHomePage } from "@/lib/actions/getPage";  
import { getAllPublishedPosts } from "@/lib/actions/getPost";
import { getCarousels } from "@/lib/actions/getCarousels";
import { getAccordions } from "@/lib/actions/getAccordions";
import { getCategories } from "@/lib/actions/getCategory";
import { Database } from "@/lib/database.types";
import ImageIcon from "@/components/ImageIcon";
import Accordion_ch from "@/components/Accordion_ch";
export default async function Home() {

  
  const Data=await getHomePage();
  
  // Fetch all published posts
  const posts = await getAllPublishedPosts();

  let carousels: Database['public']['Tables']['carousels']['Row'][] = [];
  if (Data && Data.page_carousel && Array.isArray(Data.page_carousel)) {
    // Extract all carousel IDs
    const carouselIds = Data.page_carousel
      .map((relation: { carousel_id: number }) => relation.carousel_id)
      .filter(Boolean);

    // Fetch all carousels in a single query
    if (carouselIds.length > 0) {
      carousels = await getCarousels(carouselIds);
    }
  }

  let accordions: Database['public']['Tables']['accordions']['Row'][] = [];
  if (Data && Data.page_accordion && Array.isArray(Data.page_accordion)) {
    // Extract all accordion IDs
    const accordionIds = Data.page_accordion
      .map((relation: { accordion_id: number }) => relation.accordion_id)
      .filter(Boolean);
    
    // Fetch all accordions in a single query
    if (accordionIds.length > 0) {
      accordions = await getAccordions(accordionIds);
    }
  }

  let categories: Database['public']['Tables']['categories']['Row'][] = [];
  if (Data && Data.page_category && Array.isArray(Data.page_category)) {
    // Extract all category IDs
    const categoryIds = Data.page_category
      .map((relation: { category_id: number }) => relation.category_id)
      .filter(Boolean);
    
    // Fetch all categories in a single query
    if (categoryIds.length > 0) {
      categories = await getCategories(categoryIds);
    }
  }

  if (Data) {
    return (
      <div className="section">
        <div className="content">
          <div className="grid-block">
            <div className="scroll-block">
              {/* Only render PostGrid if there are published posts */}
              
              {posts.length > 0 && (
                <PostGrid posts={posts} />
              )}

              {Data?.body && (
                <div
                  className="scroll-block-element prose-lg"
                  dangerouslySetInnerHTML={{
                    __html: Data?.body,
                  }}
                ></div>
              )}

              {carousels.length > 0 &&
                carousels.map((carousel) => (
                  <Carousel key={carousel.id} carousel={carousel} />
                ))}

              {accordions.length > 0 &&
                accordions.map((accordion) => (
                  <Accordion_ch key={accordion.id} accordion={accordion} />
                ))}

            
              <ClientSideRout route="page/services" key={1}>
                <div className="hero-wrapper w-inline-block py-2 border-y border-gray-100">
                  <WhiteOverlay />
                  <div className="hero-content">
                    <div className="text-box">
                      <h2 className="heading h2">SERVICES</h2>
                      <p>
                        The Commons Hub serves as a versatile event space that
                        offers lodging, support with event
                        organization as well as its own event series. If you
                        can’t find what you’re looking for, just contact us!
                      </p>
                    </div>
                  </div>
                </div>
              </ClientSideRout>

              {categories.length > 0 && categories.map((category) => (
                <ClientSideRout
                  route={`/category/${category.slug}`}
                  key={category.id}
                >
                  <HeroCategory category={category} />
                </ClientSideRout>
              ))}

              {<div id="newsletter">
                <NewsletterSignup />
              </div> }

              <div className="footer">
                <div className="footer-wrapper">
                  <div
                    data-w-id="cf718504-e160-62a0-2401-3ebec51b24b9"
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
                  <ImageIcon 
                    mainImage={Data?.main_image} 
                    mainIcon={Data?.main_icon} 
                    title={Data?.title} 
                  />
                </div>
                <div
                  className="description-block relative overflow-hidden bg-slate-50 items-center"
                >
                  <WhiteOverlay />
                  {Data?.summary && (
                    <span className="font-extralight max-w-xl mt-4 text-3xl md:text-4xl text-center">
                      {Data?.summary.replace(/<\/?p>/g, "")}
                    </span>
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
