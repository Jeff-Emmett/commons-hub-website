import ClientSideRout from "@/components/ClientSideRout";
import WhiteOverlay from "@/components/WhiteOverlay";
import ScrollIndicator from "@/components/ScrollIndicator";
import { getEventPageBySlug } from "@/lib/actions/getEventPage";
import ImageIcon from "@/components/ImageIcon";
import { Metadata } from "next";
import { generatePageMetadata } from "@/lib/utils/generatePageMetadata";

// Generate dynamic metadata for each event page
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  // Get the event page data
  const { slug } = await params;
  const event = await getEventPageBySlug(slug);
  
  if (!event) {
    return {
      title: 'Event Not Found',
    };
  }

  // Use our reusable metadata utility
  return generatePageMetadata({
    title: event.seo_title_tag ? event.seo_title_tag : event.title,
    description: event.seo_description ? event.seo_description : event.summary,
    image: event.main_image,
    icon: event.main_icon,
    url: `https://www.commons-hub.at/events/${slug}`,
    type: 'website'
  });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getEventPageBySlug(slug);

  // let carousels: Database['public']['Tables']['carousels']['Row'][] = [];
  // if (page && page.page_carousel && Array.isArray(page.page_carousel)) {
  //   // Extract all carousel IDs
  //   const carouselIds = page.page_carousel
  //     .map(relation => relation.carousel_id)
  //     .filter(Boolean);

  //   console.log("Found carousel IDs:", carouselIds);

  //   // Fetch all carousels in a single query
  //   if (carouselIds.length > 0) {
  //     carousels = await getCarousels(carouselIds);
  //     console.log(`Found ${carousels.length} carousels`);
  //   }
  // }

  // let accordions: Database['public']['Tables']['accordions']['Row'][] = [];
  // if (page && page.page_accordion && Array.isArray(page.page_accordion)) {
  //     // Extract all accordion IDs
  //   const accordionIds = page.page_accordion
  //       .map(relation => relation.accordion_id)
  //       .filter(Boolean);
      
  //     // Fetch all accordions in a single query
  //     if (accordionIds.length > 0) {
  //       accordions = await getAccordions(accordionIds);
  //     console.log(`Found ${accordions.length} accordions`);
  //   }
  // }

  return (
    <div className="section">
      <div className="content">
        <div className="grid-block">
          <div className="scroll-block">
            {/* {carousels.length > 0 &&
              carousels.map((carousel) => (
                <Carousel key={carousel.id} carousel={carousel} />
              ))} */}

            {page?.body && (
              <div
                className="scroll-block-element"
                dangerouslySetInnerHTML={{
                  __html: page?.body,
                }}
              ></div>
            )}

            {/* {accordions.length > 0 &&
              accordions.map((accordion) => (
                <Accordion_ch key={accordion.id} accordion={accordion} />
              ))} */}

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
                  mainImage={page?.main_image}
                  mainIcon={page?.main_icon}
                  title={page?.title}
                />
              </div>
              <div
                className="description-block relative overflow-hidden bg-slate-50 items-center"
              >
                <WhiteOverlay />
                {page?.title && (
                  <h1
                    className="h1 mb-0 font-light"
                  >
                    {page.title}
                  </h1>
                )}
                {page?.summary && (
                  <span
                    className="summary"
                    dangerouslySetInnerHTML={{
                      __html: page.summary,
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
