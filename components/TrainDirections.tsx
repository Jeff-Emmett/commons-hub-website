"use client";

import * as Accordion from "@radix-ui/react-accordion";
import WhiteOverlay from "./WhiteOverlay";
import { useEffect, useState } from "react";

export default function TrainDirections() {
  const [openItems, setOpenItems] = useState<string[]>([]);
  const accordionId = "train";
  
  // Handle URL hash on component mount and browser navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === `#${accordionId}`) {
        setOpenItems([accordionId]);
        // Scroll to the element after a short delay to ensure it's rendered
        setTimeout(() => {
          document.getElementById(accordionId)?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    };
    
    // Check hash on initial load
    handleHashChange();
    
    // Listen for hash changes
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return (
    <Accordion.Root 
      type="multiple" 
      value={openItems} 
      onValueChange={setOpenItems}
    >
      <Accordion.Item
        id={accordionId}
        value={accordionId}
        className="hero-wrapper w-inline-block py-2 border-y border-gray-100"
      >
        <WhiteOverlay />
        <Accordion.Header asChild>
          <div className="hero-content">
            <Accordion.Trigger className="AccordionTrigger pb-0 flex justify-between items-center w-full text-left">
              <h2 className="h2">Travel by Train</h2>
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
        <Accordion.Content className="accordion-content hero-content pt-0">
          <div className="train-directions-content">
            <iframe
              title="ÖBB Route Planner"
              className="w-full"
              width="100%"
              height="100%"
              style={{ border: "0", minHeight: "550px" }}
              loading="lazy"
              src="https://fahrplan.oebb.at/webapp/?context=TP&SID=A%3D1%40O%3DWIEN%20Hauptbahnhof%40X%3D16375909%40Y%3D48185095%40U%3D81%40L%3D008103000%40B%3D1%40p%3D1248698221%40&ZID=A%3D1%40O%3DHirschwang%20an%20der%20Rax%20Kirche%40X%3D15775694%40Y%3D47721992%40U%3D81%40L%3D001190100%40B%3D1%40p%3D1248698221%40&date=01.07.2025&time=14:49&timeSel=1&journeyProducts=7167&start=1"
            ></iframe>
          </div>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  );
}
