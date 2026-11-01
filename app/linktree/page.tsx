import Image from "next/image";
import Link from "next/link";
import { getPageContent, getSiteSettings, pageMetadata, sectionEdit } from "@/lib/cms/content";

interface LinkItem {
  title: string;
  url: string;
  icon?: string | React.ReactNode;
  isDownload?: boolean;
}

interface SocialLinkItem {
  title: string;
  url: string;
  icon: React.ReactNode;
}

// One icon per kind. A Linktree item in Directus picks one by name (its
// "Icon" field); social icons follow Settings → Site settings.
const LINK_ICONS: Record<string, React.ReactNode> = {
  group: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 100 100" fill="currentColor">
          <path d="M356.72,276.15l-35.387-32.6a2.334,2.334,0,0,0-3.164,0l-35.387,32.6a2.337,2.337,0,0,0-.753,1.718v15.079a.8.8,0,0,0,1.344.589L306.2,272.484a.8.8,0,0,1,1.088,0l6.674,6.174a.8.8,0,0,1,0,1.177l-31.676,29.227a.8.8,0,0,0-.258.589v12.592a.8.8,0,0,0,1.344.589l54.6-50.349a.8.8,0,0,1,1.088,0l6.674,6.174a.8.8,0,0,1,0,1.177l-63.444,58.538a.8.8,0,0,0-.258.589v11.792a1.513,1.513,0,0,0,1.236,1.474l73.95-68.2a.8.8,0,0,0,.258-.589v-5.575A2.337,2.337,0,0,0,356.72,276.15Z" transform="translate(-282.029 -242.934)"></path>
          <path d= "M356.128,299.553,300.48,350.9a.8.8,0,0,0,.544,1.391h13.631a.8.8,0,0,0,.543-.213l42.017-38.748a.8.8,0,0,0,.258-.589v-12.6A.8.8,0,0,0,356.128,299.553Z" transform="translate(-282.029 -242.934)"/>
          <path d= "M356.128,328.864,332.248,350.9a.8.8,0,0,0,.543,1.391h22.347a2.335,2.335,0,0,0,2.335-2.336v-20.5A.8.8,0,0,0,356.128,328.864Z" transform="translate(-282.029 -242.934)"/>
        </svg>
  ),
  globe: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
  ),
  mail: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2"></rect>
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
        </svg>
  ),
  document: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <path d="M14 2v6h6"></path>
          <path d="M16 13H8"></path>
          <path d="M16 17H8"></path>
          <path d="M10 9H8"></path>
        </svg>
  ),
  calendar: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <path d="M14 2v6h6"></path>
          <path d="M16 13H8"></path>
          <path d="M16 17H8"></path>
          <path d="M10 9H8"></path>
        </svg>
  ),
  link: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
  ),
};

export async function generateMetadata() {
  return pageMetadata("linktree", { title: "" });
}

// Content: Directus → Pages → "Linktree" → Sections (profile, links, footer).
export default async function Linktree() {
  const [page, site] = await Promise.all([getPageContent("linktree"), getSiteSettings()]);
  const sections = page?.sections ?? {};
  const { profile, footer } = sections;

  // Social media links as icons
  const socialLinks: SocialLinkItem[] = [
    {
      title: "Telegram",
      url: site.telegram_url ?? "",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.6 13.07l-4.1-1.27c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
        </svg>
      ),
    },
    {
      title: "X",
      url: site.x_url ?? "",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      title: "Instagram",
      url: site.instagram_url ?? "",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      ),
    },
    {
      title: "Youtube",
      url: site.youtube_url ?? "",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
        </svg>
      ),
    },
  ].filter((l) => l.url);

  // Main button links
  const links: LinkItem[] = (sections.links?.items ?? [])
    .filter((i) => i.title && i.link)
    .map((i) => ({
      title: i.title,
      url: i.link as string,
      icon: i.icon ? LINK_ICONS[i.icon] : undefined,
      isDownload: i.is_download,
    }));

  return (
    <div className="section min-h-screen bg-slate-50 py-10 pt-20 md:pt-24">
      <div className="content max-w-xl mx-auto px-4">
        <div className="flex flex-col items-center justify-center gap-8">
          {/* Profile Section */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-64 h-64 mb-2">
              <Image
                src="/logos/VERTICAL_commons_hub_LOGO_black.svg"
                alt="Commons Hub"
                width={256}
                height={256}
                className="object-contain"
                priority
              />
            </div>
            {profile && (
              <p className="text-gray-600 max-w-md mb-2 text-center" {...sectionEdit(profile)} dangerouslySetInnerHTML={{ __html: profile.text }} />
            )}
            
            {/* Social Media Icons */}
            <div className="flex justify-center gap-6 mt-4 mb-2">
              {socialLinks.map((social, index) => (
                <a 
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.title}
                  className="text-gray-700 hover:text-gray-900 transition-colors p-2 rounded-full hover:bg-gray-100"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Button Links */}
          <div className="w-full space-y-4" {...sectionEdit(sections.links)}>
            {links.map((link, index) => 
              link.isDownload ? (
                <a
                  href={link.url}
                  key={index}
                  download
                  className="bg-animate flex items-center justify-between p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 w-full bg-white group"
                >
                  <div className="flex items-center gap-3">
                    {link.icon && (
                      <div className="w-6 h-6 flex items-center justify-center">
                        {typeof link.icon === 'string' ? (
                          <Image 
                            src={link.icon} 
                            alt={link.title} 
                            width={24} 
                            height={24} 
                            className="group-hover:text-white transition-colors" 
                          />
                        ) : (
                          <div className="group-hover:text-white transition-colors">
                            {link.icon}
                          </div>
                        )}
                      </div>
                    )}
                    <span className="font-medium text-lg group-hover:text-white transition-colors">{link.title}</span>
                  </div>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="group-hover:text-white transition-colors"
                  >
                    <path d="M5 12h14"></path>
                    <path d="m12 5 7 7-7 7"></path>
                  </svg>
                </a>
              ) : (
                <Link
                  href={link.url}
                  key={index}
                  target={link.url.startsWith('http') ? "_blank" : "_self"}
                  rel={link.url.startsWith('http') ? "noopener noreferrer" : ""}
                  className="bg-animate flex items-center justify-between p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 w-full bg-white group"
                >
                  <div className="flex items-center gap-3">
                    {link.icon && (
                      <div className="w-6 h-6 flex items-center justify-center">
                        {typeof link.icon === 'string' ? (
                          <Image 
                            src={link.icon} 
                            alt={link.title} 
                            width={24} 
                            height={24} 
                            className="group-hover:text-white transition-colors" 
                          />
                        ) : (
                          <div className="group-hover:text-white transition-colors">
                            {link.icon}
                          </div>
                        )}
                      </div>
                    )}
                    <span className="font-medium text-lg group-hover:text-white transition-colors">{link.title}</span>
                  </div>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="group-hover:text-white transition-colors"
                  >
                    <path d="M5 12h14"></path>
                    <path d="m12 5 7 7-7 7"></path>
                  </svg>
                </Link>
              )
            )}
          </div>

          {/* Footer */}
          {footer && (
            <div className="mt-8 text-center text-gray-500 text-sm" {...sectionEdit(footer)}>
              <p>© {new Date().getFullYear()} {footer.text}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
