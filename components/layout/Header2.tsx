"use client";

import { useState } from "react";
import { LazyMotion, domAnimation, AnimatePresence, m } from "framer-motion";
import { MenuButton } from "@/components/ui/MenuButton";
import ClientSideRout from "./ClientSideRouting";
import { DynamicAuthButton } from "@/components/dynamic-auth-button";
import { AdminButton } from "@/components/admin-button";
import { Database } from "@/lib/database.types";

type Menu = Database['public']['Tables']['menu']['Row'] & {
  pages: {
    id: number
    title: string | null
    slug: string | null
  } | null;
};

type Props = {
  menus: Menu[];
};

// Header-only label overrides, keyed by page slug. Keeps the live Directus
// page title (and its SEO/heading) intact while showing a shorter nav label.
const HEADER_LABEL_OVERRIDES: Record<string, string> = {
  venue: "VENUE",
};

function headerLabel(menuItem: Menu): string {
  const slug = menuItem.pages?.slug ?? "";
  return HEADER_LABEL_OVERRIDES[slug] ?? menuItem.pages?.title ?? "";
}

function Header2({ menus }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Get all menu items with position 'header' and sort by menu_order
  const headerMenuItems = menus
    .filter(item => item.position === 'header')
    .sort((a, b) => (a.menu_order || 0) - (b.menu_order || 0));

  return (
    <header className="w-full h-20 bg-white">
      <div className="flex w-full h-full">
        {/* Home button */}
        <div className="flex-shrink-0">
          <ClientSideRout route={`/`} ariaLabel="Home">
            <div className="flex w-20 h-20 justify-center items-center border-b border-r md:border-r-0 border-gray-200">
              <svg
                width="51"
                height="60"
                viewBox="0 0 51 60"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M48.9274 16.2292C48.1765 16.2292 47.5657 16.8404 47.5657 17.5913C47.5657 17.6112 47.5679 17.6301 47.5688 17.65L43.6985 19.3843V12.1715H39.311L41.2362 7.73942C41.2507 7.73986 41.2649 7.74162 41.279 7.74162C42.0299 7.74162 42.6411 7.13089 42.6411 6.37994C42.6411 5.62898 42.0299 5.01781 41.279 5.01781C40.528 5.01781 39.9173 5.62898 39.9173 6.37994C39.9173 6.75431 40.069 7.09385 40.3146 7.33991L38.2156 12.1715H30.7991V14.1805H37.3425L33.9749 21.9326C33.8034 21.896 33.6257 21.8757 33.4431 21.8757C33.2773 21.8757 33.1159 21.8929 32.9589 21.9233L26.6567 6.62114C26.9125 6.37332 27.0726 6.02717 27.0726 5.64354C27.0726 4.89258 26.4614 4.28141 25.7104 4.28141C24.9595 4.28141 24.3488 4.89258 24.3488 5.64354C24.3488 6.39449 24.9595 7.00522 25.7104 7.00522C25.7162 7.00522 25.7219 7.00434 25.7276 7.00434L32.0298 22.3056C31.3494 22.7625 30.901 23.5381 30.901 24.4174C30.901 24.6463 30.934 24.8667 30.9909 25.078L25.844 27.3846C25.381 26.7377 24.6252 26.3135 23.7707 26.3135C23.619 26.3135 23.4708 26.3294 23.3262 26.355L18.551 14.1805H26.9218V12.1715H17.763L14.2384 3.18518C14.5039 2.93648 14.6714 2.58371 14.6714 2.19214C14.6714 1.44119 14.0603 0.830017 13.3093 0.830017C12.5584 0.830017 11.9476 1.44119 11.9476 2.19214C11.9476 2.94133 12.5557 3.55074 13.304 3.55383L16.684 12.1715H14.0263V25.97L3.01114 22.0671C2.9838 21.3399 2.38542 20.7566 1.65166 20.7566C0.900707 20.7566 0.289978 21.3677 0.289978 22.1187C0.289978 22.8696 0.900707 23.4804 1.65166 23.4804C2.05955 23.4804 2.42555 23.2991 2.67513 23.0138L14.0263 27.0358V42.5827H17.6334L15.0008 49.6562C14.2636 49.6721 13.6687 50.2757 13.6687 51.0165C13.6687 51.7675 14.2794 52.3782 15.0304 52.3782C15.7813 52.3782 16.3925 51.7675 16.3925 51.0165C16.3925 50.6162 16.2179 50.2568 15.9418 50.0076L18.7049 42.5827H26.9248V40.5737H19.4528L22.9165 31.2651C23.1842 31.3608 23.4708 31.4154 23.7707 31.4154C23.9228 31.4154 24.0705 31.3996 24.2151 31.374L35.3935 59.8741L36.3287 59.5072L25.1504 31.0067C25.8537 30.552 26.3212 29.7627 26.3212 28.8649C26.3212 28.6709 26.2974 28.4831 26.2563 28.3014L31.4411 25.978C31.9068 26.5741 32.6304 26.9595 33.4435 26.9595C33.6094 26.9595 33.7707 26.9423 33.9277 26.9119L39.5548 40.5733H30.8026V42.5823H40.3825L41.4571 45.191C41.2009 45.4388 41.0413 45.785 41.0413 46.1686C41.0413 46.9196 41.652 47.5303 42.403 47.5303C43.1539 47.5303 43.7651 46.9196 43.7651 46.1686C43.7651 45.4177 43.1539 44.8065 42.403 44.8065C42.3972 44.8065 42.3915 44.8074 42.3858 44.8074L41.469 42.5819H43.6985V20.4849L47.9793 18.5667C48.225 18.8053 48.5592 18.953 48.9279 18.953C49.6788 18.953 50.29 18.3423 50.29 17.5913C50.2891 16.8404 49.6784 16.2292 48.9274 16.2292ZM18.3808 40.5733H16.0353V27.7475L21.3361 29.6256C21.471 30.056 21.7189 30.4352 22.0421 30.7342L18.3808 40.5733ZM21.2448 28.5276L16.0353 26.6817V14.1805H17.472L22.3909 26.7223C21.7771 27.1187 21.3454 27.7709 21.2448 28.5276ZM41.6891 40.5733H40.6413L34.8564 26.5292C35.5363 26.0723 35.9852 25.2967 35.9852 24.4178C35.9852 24.2617 35.9689 24.1096 35.942 23.961L41.6891 21.3858V40.5733ZM41.6891 20.2843L35.569 23.0271C35.3908 22.7554 35.162 22.5204 34.8961 22.3347L38.4383 14.181H41.6891V20.2843Z"
                  fill="black"
                ></path>
              </svg>
            </div>
          </ClientSideRout>
        </div>
        
        {/* Main content area with flex layout */}
        <div className="flex-grow flex items-stretch border-b border-swatch-53f18248">
          {/* Mobile menu button - only visible on small screens */}
          <div
            className="flex px-6 text-sm md:hidden w-full items-center justify-end cursor-pointer border-l border-gray-200"
            onClick={toggleMenu}
          >
            {/* Flex-grow spacer in mobile navbar */}
            <div className="flex-grow"></div>
            <MenuButton
              strokeWidth="2"
              isOpen={isOpen}
              width={24}
              height={24}
            />
          </div>
          
          {/* Desktop navigation - flex layout with menu left, spacer, auth/admin right */}
          <div className="hidden md:flex w-full">
            {/* Left-aligned menu items */}
            <nav className="flex">
              {headerMenuItems.map((menuItem) => (
                <LazyMotion features={domAnimation} key={menuItem.id}>
                  <ClientSideRout
                    route={`/page/${menuItem.pages?.slug}`}
                    ariaLabel={headerLabel(menuItem) || ''}
                  >
                    <m.div
                      whileHover={{
                        backgroundPosition: "left",
                        color: "#fff",
                        transition: { duration: 0.4 },
                      }}
                      className="bg-animate relative text-sm flex md:w-24 lg:w-32 xl:w-40 h-full justify-center items-center font-semibold tracking-wider uppercase cursor-pointer border-l border-gray-200 no-underline"
                    >
                      <div className="absolute inset-0 z-0"> </div>
                      <div className="relative">{headerLabel(menuItem)}</div>
                    </m.div>
                  </ClientSideRout>
                </LazyMotion>
              ))}
            </nav>
            
            {/* Flexible spacer */}
            <div className="flex-grow"></div>
            
            {/* Right-aligned auth and admin buttons */}
            <div className="flex items-center border-l border-gray-200 px-6 h-full">
              <div className="flex items-center gap-2">
                <DynamicAuthButton />
                <AdminButton />
              </div>
            </div>
          </div>
          
          {/* Mobile menu - slide in from left */}
          <AnimatePresence>
            {isOpen && (
              <LazyMotion features={domAnimation}>
                <m.div
                  initial={{
                    x: -500,
                    opacity: 0,
                  }}
                  animate={{
                    x: 0,
                    opacity: 1,
                  }}
                  exit={{
                    x: -500,
                    opacity: 0,
                  }}
                  transition={{
                    duration: 0.3,
                    ease: "easeInOut",
                  }}
                  className="fixed top-20 left-0 w-full h-[calc(100vh-80px)] bg-white z-40 overflow-auto border-t border-swatch-53f18248"
                >
                  <div className="flex flex-col p-8 h-full">
                    <div className="flex justify-end items-center mb-8">
                      <div
                        className="cursor-pointer"
                        onClick={toggleMenu}
                      >
                        <MenuButton
                          strokeWidth="2"
                          isOpen={true}
                          width={28}
                          height={28}
                        />
                      </div>
                    </div>
                    
                    {/* Auth and Admin buttons at the top of mobile menu */}
                    <div className="flex flex-col gap-6 mb-10">
                      <div onClick={toggleMenu}>
                        <DynamicAuthButton />
                      </div>
                      <div onClick={toggleMenu}>
                        <AdminButton />
                      </div>
                    </div>
                    
                    {/* Menu items */}
                    <div className="flex flex-col gap-8">
                      <div onClick={toggleMenu}>
                        <ClientSideRout route="/" ariaLabel="Home">
                          <div className="text-xl font-semibold cursor-pointer hover:text-gray-600 transition-colors">
                            Home
                          </div>
                        </ClientSideRout>
                      </div>
                      
                      {headerMenuItems.map((menuItem) => (
                        <div key={menuItem.id} onClick={toggleMenu}>
                          <ClientSideRout
                            route={`/page/${menuItem.pages?.slug}`}
                            ariaLabel={headerLabel(menuItem) || ''}
                          >
                            <div className="text-xl font-semibold cursor-pointer hover:text-gray-600 transition-colors">
                              {headerLabel(menuItem)}
                            </div>
                          </ClientSideRout>
                        </div>
                      ))}
                    </div>
                    
                    {/* Social Media Icons */}
                    <div className="mt-auto pt-10">
                      <div className="flex flex-row gap-4 justify-between px-6">
                        <a
                          href="https://x.com/CommonsHubAT"
                          target="_blank"
                          className="sidebar-icon w-inline-block"
                          aria-label="X (formerly Twitter)"
                        >
                          <svg
                            className="social-image"
                            width="42"
                            height="36"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path 
                              d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                              className="social-image"
                            />
                          </svg>
                        </a>
                        <a
                          href="https://www.instagram.com/commonshub/"
                          target="_blank"
                          className="sidebar-icon w-inline-block"
                          aria-label="Instagram"
                        >
                          <svg
                            className="social-image"
                            width="42"
                            height="36"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path 
                              d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"
                              className="social-image"
                            />
                          </svg>
                        </a>
                        <a
                          href="http://www.youtube.com/@CommonsHub"
                          target="_blank"
                          className="sidebar-icon w-inline-block"
                          aria-label="YouTube"
                        >
                          <svg
                            className="social-image"
                            width="42"
                            height="36"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path 
                              d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"
                              className="social-image"
                            />
                          </svg>
                        </a>
                        <a
            href="mailto:office@commons-hub.at"
            className="sidebar-icon w-inline-block"
            aria-label="Email Adress: office@commons-hub.at"
          >
            <div className="social-image w-embed">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                role="img"
                className="iconify iconify--iconoir"
                width="100%"
                height="100%"
                viewBox="0 0 24 24"
              >
                <g className="social-image-2">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m7 9l5 3.5L17 9"
                  ></path>
                  <path d="M2 17V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z"></path>
                </g>
              </svg>
            </div>
          </a>
                      </div>
                    </div>
                  </div>
                </m.div>
              </LazyMotion>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

export default Header2;
