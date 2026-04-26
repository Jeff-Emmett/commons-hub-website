"use client";

import * as Accordion from "@radix-ui/react-accordion";
import WhiteOverlay from "./WhiteOverlay";
import Image from "next/image";
import { AccordionWithItems } from "@/lib/actions/getAccordions";
import { Database } from "@/lib/database.types";

type AccordionItem = Database['public']['Tables']['accordion_items']['Row'];

type Props = {
  accordion: AccordionWithItems;
};

export default function Accordion_ch({ accordion }: Props) {
  // Ensure we have accordion items to render
  if (!accordion || !accordion.accordion_items || accordion.accordion_items.length === 0) {
    return null;
  }
  
  // Sort accordion items by sort field (if available)
  const sortedItems = [...accordion.accordion_items].sort((a, b) => {
    // If sort is undefined/null for either item, treat it as a large number
    const sortA = (a as AccordionItem).sort ?? Number.MAX_SAFE_INTEGER;
    const sortB = (b as AccordionItem).sort ?? Number.MAX_SAFE_INTEGER;
    return sortA - sortB;
  });

  return (
    <Accordion.Root type="multiple">
      {sortedItems.map((item) => (
        <Accordion.Item
          value={`item-${item.id}`}
          key={item.id}
          className="hero-wrapper w-inline-block py-2 border-y border-gray-100"
        >
            <WhiteOverlay />
            <Accordion.Header asChild>


              <div className="hero-content">
                <Accordion.Trigger className="AccordionTrigger pb-0 flex justify-between items-center w-full text-left">
                  <h2 className="h2">{item.title}</h2>
                  <svg
                    className="AccordionChevron"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </Accordion.Trigger>
              </div>


            </Accordion.Header>
            {/* <div className="hero-content"> */}
            <Accordion.Content className="accordion-content hero-content pt-0 ">
              <div className="hero-image w-embed relative overflow-hidden">
                <WhiteOverlay />
                {item.image && item.image_url && (
                  <Image
                    src={item.image_url || "/placeholder.jpg"}
                    alt={item.title || "Accordion image"}
                    width={800}
                    height={800}
                    className="rounded-lg shadow-md mb-4"
                  />
                )}
              </div>
              <p
                dangerouslySetInnerHTML={{
                  __html: item.content || "",
                }}
              >
              </p>
            </Accordion.Content>
            {/* </div> */}
        </Accordion.Item>
      ))
    }
    </Accordion.Root >

  );
}


{/* <div className="hero-wrapper w-inline-block py-2 border-y border-gray-100">
      <WhiteOverlay />
      <div className="video-box no-bottom-stroke">
        <div className="w-background-video w-background-video-atom w-full">
        </div>
      </div>
      <div className="hero-content">
        <div className="text-box">
          <h2 className="heading h2">{category.categories_ch_id.title}</h2>
          <div
            className="paragraph no-margin-bottom"
            dangerouslySetInnerHTML={{
              __html: category.categories_ch_id.description,
            }}
          ></div>
        </div>
      </div>
    </div> */}