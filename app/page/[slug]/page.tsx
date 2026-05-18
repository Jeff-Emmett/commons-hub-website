import ClientSideRout from "@/components/ClientSideRout";
import HeroCategory from "@/components/HeroCategory";
import WhiteOverlay from "@/components/WhiteOverlay";
import { Carousel } from "@/components/Carousel";
import { TeamClient } from "@/components/TeamClient";
import { getTeam } from "@/lib/actions/getTeam";
import { EventGrid } from "@/components/EventGrid";
import Accordion_ch from "@/components/Accordion_ch";
import { Database } from "@/lib/database.types";
import { getPageBySlug } from "@/lib/actions/getPage";
import { getPosts } from "@/lib/actions/getPost";
import { getCarousels } from "@/lib/actions/getCarousels";
import { getAccordions } from "@/lib/actions/getAccordions";
import { getCategories } from "@/lib/actions/getCategory";
import TrainDirections from "@/components/TrainDirections";
import { Metadata } from "next";
import { generatePageMetadata } from "@/lib/utils/generatePageMetadata";

// Generate dynamic metadata for each page
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  // Get the page data
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  
  if (!page) {
    return {
      title: 'Page Not Found',
    };
  }

  // Use our reusable metadata utility
  return generatePageMetadata({
    title: page.seo_title_tag ? page.seo_title_tag : page.title,
    description: page.seo_description ? page.seo_description : page.summary,
    image: page.main_image,
    icon: page.main_icon,
    url: `https://www.commons-hub.at/page/${slug}`,
    type: 'website'
  });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPageBySlug(slug);

  // Fetch team members if this is a team page
  let teamMembers: Database['public']['Tables']['team_members']['Row'][] = [];
  if (page?.is_team) {
    teamMembers = await getTeam() || [];
  }

  // If we found a page, fetch related data
  let posts: Database['public']['Tables']['posts']['Row'][] = [];
  if (page && page.page_post && Array.isArray(page.page_post)) {
    // Extract all post IDs
    const postIds = page.page_post
      .map(relation => relation.post_id)
      .filter(Boolean);

    // Fetch all posts in a single query
    if (postIds.length > 0) {
      posts = await getPosts(postIds);
      console.log(`Found ${posts.length} posts`);
    }
  }

  let carousels: Database['public']['Tables']['carousels']['Row'][] = [];
  if (page && page.page_carousel && Array.isArray(page.page_carousel)) {
    // Extract all carousel IDs
    const carouselIds = page.page_carousel
      .map(relation => relation.carousel_id)
      .filter(Boolean);

    console.log("Found carousel IDs:", carouselIds);

    // Fetch all carousels in a single query
    if (carouselIds.length > 0) {
      carousels = await getCarousels(carouselIds);
      console.log(`Found ${carousels.length} carousels`);
    }
  }

  let accordions: Database['public']['Tables']['accordions']['Row'][] = [];
  if (page && page.page_accordion && Array.isArray(page.page_accordion)) {
      // Extract all accordion IDs
    const accordionIds = page.page_accordion
        .map(relation => relation.accordion_id)
        .filter(Boolean);
      
      // Fetch all accordions in a single query
      if (accordionIds.length > 0) {
        accordions = await getAccordions(accordionIds);
      console.log(`Found ${accordions.length} accordions`);
    }
  }

  let categories: Database['public']['Tables']['categories']['Row'][] = [];
  if (page && page.page_category && Array.isArray(page.page_category)) {
    // Extract all category IDs
    const categoryIds = page.page_category
      .map(relation => relation.category_id)
      .filter(Boolean);

    // Fetch all categories in a single query
    if (categoryIds.length > 0) {
      categories = await getCategories(categoryIds);
      console.log(`Found ${categories.length} categories`);
    }
  }

  return (
    <div className="section">
      <div className="content">
        <div className="full-block max-w-5xl mx-auto px-6 py-10">
          <div className="scroll-block">

            {(page?.title || page?.summary) && (
              <header className="mb-10 border-b border-gray-100 pb-6">
                {page?.title && (
                  <h1 className="h2 md:h1 mb-3 font-light">{page.title}</h1>
                )}
                {page?.summary && (
                  <div
                    className="summary"
                    dangerouslySetInnerHTML={{ __html: page.summary }}
                  ></div>
                )}
              </header>
            )}

            {/* Upcoming Events Section */}
            {page?.is_eventpage && (
              <EventGrid title="UPCOMING EVENTS" filter="upcoming" />
            )}

            {/* Past Events Section */}
            {page?.is_eventpage && (
              <EventGrid title="PAST EVENTS" filter="past" />
            )}

            {carousels.length > 0 &&
              carousels.map((carousel) => (
                <Carousel key={carousel.id} carousel={carousel} />
              ))}

            {page?.is_team && teamMembers.length > 0 && (
              <>
                <TeamClient teamMembers={teamMembers} />
              </>
            )}

            {page?.body && (
              <div
                className="scroll-block-element"
                dangerouslySetInnerHTML={{
                  __html: page?.body,
                }}
              ></div>
            )}

            {accordions.length > 0 &&
              accordions.map((accordion) => (
                <Accordion_ch key={accordion.id} accordion={accordion} />
              ))}

            {page?.is_map && (
              <>
                <div className="hero-content border-t">
                  <h2 className="heading h2">location</h2>
                  <div className="p mb-0">Austria</div>
                  <div className="p mb-0">2651 Reichenau an der Rax</div>
                  <div className="p">Richard von Schoeller-Straße 9</div>
                  <div
                    data-w-id="3c54adb5-0907-7961-a85c-afade22f192a"
                    className="hero-wrapper"
                  >
                    <WhiteOverlay />
                    <div className="location-map mt-4">
                      <iframe
                        title="Commons Hub Location"
                        className="w-full mt-2"
                        width="600"
                        height="600"
                        style={{ border: "0" }}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src="https://www.google.com/maps/embed/v1/place?q=commons%20hub%20hirschwang&key=AIzaSyByUGav-hWsEfsBhAYrb_sFVZNlB67AooA&maptype=satellite&zoom=14"
                      ></iframe>
                    </div>
                  </div>
                </div>
                <TrainDirections />

              </>
            )}

            {categories.length > 0 && 
              [...categories]
                .sort((a, b) => {
                  // Sort by the sort field if available, otherwise by id
                  if (a.sort !== null && b.sort !== null) {
                    return (a.sort || 0) - (b.sort || 0);
                  }
                  return a.id - b.id;
                })
                .map((category) => (
                  <ClientSideRout
                    route={`/category/${category.slug}`}
                    key={category.id}
                  >
                    <HeroCategory category={category} />
                  </ClientSideRout>
                ))
            }

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
        </div>
      </div>
    </div>
  );
}
