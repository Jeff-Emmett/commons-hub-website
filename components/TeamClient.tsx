"use client";

import React, { useCallback, useState, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import { Database } from "@/lib/database.types";
import { getImageUrlClient } from "@/lib/utils/getImageUrlClient";

type TeamMember = Database['public']['Tables']['team_members']['Row'];

type Props = {
  teamMembers: TeamMember[]; 
};

export function TeamClient({ teamMembers }: Props) {
  const [memberImages, setMemberImages] = useState<Record<number, string>>({});
  console.log("starting TeamClient <TeamClient/>");
  console.log("teamMembers: ",JSON.stringify(teamMembers, null, 2))

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

  // Load image URLs
  useEffect(() => {
    const loadImages = async () => {
      const imageUrls: Record<number, string> = {};
      
      for (const member of teamMembers) {
        if (member.profile_image) {
          try {
            const url = await getImageUrlClient(member.profile_image);
            if (url) {
              imageUrls[member.id] = url;
            }
          } catch (error) {
            console.error(`Error loading image for member ${member.id}:`, error);
          }
        }
      }
      
      setMemberImages(imageUrls);
    };
    
    loadImages();
  }, [teamMembers]);

  // Handle dot navigation click
  const scrollTo = (index: number) => emblaApi && emblaApi.scrollTo(index);

  console.log("starting to return <Team/>");


  return (
    <div className="hero-wrapper w-inline-block py-2 border-y border-gray-100">
      <div className="hero-content">
        <h2>TEAM</h2>
        <div className="carousel">
          <div className="embla" ref={emblaRef}>
            <div className="embla__container">
              {teamMembers.map((member) => (
                <div key={member.id} className="embla__slide justify-items-center">                  
                  <Image
                    src={memberImages[member.id] || "/placeholder.jpg"}
                    alt={member.role || 'Team member'}
                    width={500}
                    height={500}
                    className="w-64 rounded-full shadow-lg object-cover object-top aspect-[1/1]"
                  />
                  <h5 className="mt-4 text-center">
                    {member.name || ''}
                  </h5>
                  <p className="mt-4 text-center">
                    {member.role || ''}
                  </p>
                  {member.bio && (
                    <span
                      className="mt-4 text-center block"
                      dangerouslySetInnerHTML={{
                        __html: member.bio,
                      }}
                    ></span>
                  )}
                </div>
              ))}
            </div>
          </div>  
          <div className="flex justify-center mt-4 px-8">  
            <div className="dots flex space-x-4">
              {teamMembers.map((_, index) => (
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
