"use client";

import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { CarouselWithItems } from '@/lib/actions/getCarousels';

interface CarouselProps {
  carousel: CarouselWithItems;
}

export function Carousel({ carousel, editAttr }: CarouselProps & { editAttr?: Record<string, string> }) {

  const [emblaRef, emblaApi] = useEmblaCarousel();
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Update the selected index whenever the active slide changes
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  // Initialize the emblaApi listener
  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect(); // Set the initial state
  }, [emblaApi, onSelect]);

  // Handle dot navigation click
  const scrollTo = (index: number) => emblaApi && emblaApi.scrollTo(index);

  return (
    <div className="hero-wrapper w-inline-block py-2 border-y border-gray-100" {...editAttr}>
      <div className="hero-content">
        <h2>{carousel?.title}</h2>
        <div className="carousel">
          <div className="embla" ref={emblaRef}>
            <div className="embla__container">
              {carousel.carousel_items && carousel.carousel_items.map((item) => (
                <div key={item.id} className="embla__slide flex-col justify-items-center">
                  <a
                    className="w-full"
                    href={item.button_link || '#'}
                  >
                    {item.image && (
                      <Image
                        src={item.image_url || `/placeholder.jpg`}
                        alt={item.quote || 'Carousel image'}
                        width={1000}
                        height={600}
                        className="rounded-xl shadow-lg object-cover object-top w-full aspect-[16/9]"
                      />
                    )}
                    {/* Content
                    {item.header && (
                      <h3 className="text-xl font-bold mt-4">{item.header}</h3>
                    )} */}
                    {item.quote && (
                      <div
                        className="text-center mt-4"
                        dangerouslySetInnerHTML={{
                          __html: item.quote,
                        }}
                      ></div>
                    )}
                  </a>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-center mt-4 px-8">
            <div className="dots flex space-x-4">
              {carousel.carousel_items && carousel.carousel_items.map((_, index) => (
                <button
                  key={index}
                  className={`dot w-3 h-3 rounded-full ${
                    index === selectedIndex ? "bg-gray-900" : "bg-gray-400"
                  }`}
                  onClick={() => scrollTo(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
