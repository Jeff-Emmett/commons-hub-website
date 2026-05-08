import ClientSideRout from "./ClientSideRout";
import { getEventPage } from "@/lib/actions/getEventPage";
// import { Database } from "@/lib/database.types";
import IconImage from "./IconImage";

type Props = {
  filter?: 'upcoming' | 'past';
  title?: string;
};

// type Event = Database['public']['Tables']['eventpages']['Row'];

export async function EventGrid({ filter = 'upcoming', title = "Events" }: Props) {
  const sortedEvents = await getEventPage(filter);
  
  // Use a fixed date formatting approach to avoid hydration errors
  const formatDateRange = (startDate: string | null, endDate: string | null) => {
    if (!startDate || !endDate) return 'Dates TBA';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Format dates manually to ensure consistency
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const startYear = start.getFullYear();
    const startMonth = months[start.getMonth()];
    const startDay = start.getDate();
    const endYear = end.getFullYear();
    const endMonth = months[end.getMonth()];
    const endDay = end.getDate();
    
    // Format times
    const formatTime = (date: Date) => {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;
      const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
      return `${formattedHours}:${formattedMinutes} ${ampm}`;
    };
    
    // If same day event
    if (startYear === endYear && startMonth === endMonth && startDay === endDay) {
      return `${startMonth} ${startDay}, ${startYear}, ${formatTime(start)} - ${formatTime(end)}`;
    }
    
    // Multi-day event
    return `${startMonth} ${startDay}, ${startYear} - ${endMonth} ${endDay}, ${endYear}`;
  };

  return (
    <div className="hero-wrapper w-inline-block py-2 border-y border-gray-100">
      <div className="hero-content">
        <h2>{title}</h2>
        {sortedEvents.length > 0 ? (
          sortedEvents.map((event) => (
            <ClientSideRout
              route={`/events/${event.slug}`}
              key={event.id}
            >
              <article className="relative isolate flex flex-col gap-8 lg:flex-row pb-10 group">
                <div className="relative aspect-square lg:w-64 lg:shrink-0 overflow-hidden rounded-2xl">
                <IconImage
                  mainIcon={event.main_icon}
                  mainImage={event.main_image}
                  title={event.title}
                />
                <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-gray-900/10" />
              </div>
              <div>
                <div className="group relative max-w-xl">
                  <h3 className="mt-3 text-lg font-semibold leading-6 text-gray-900 group-hover:text-gray-600">
                    <span className="absolute inset-0" />
                    {event.title || 'Untitled Event'}
                  </h3>
                  <p className="mt-5 text-sm leading-6 text-gray-600">
                    {formatDateRange(event.startdatetime, event.enddatetime)}
                  </p>
                  <p className="mt-5 text-sm leading-6 text-gray-600">Commons Hub, Austria</p>
                </div>
                <div className="mt-6 flex border-t border-gray-900/5 pt-6">
                  <div className="relative flex items-center gap-x-4">
                    <div className="text-sm leading-6">
                      <div className="relative">
                        <span className="absolute inset-0" />
                        {event?.summary && (
                          <span
                          className="summary"
                          dangerouslySetInnerHTML={{
                            __html: event.summary,
                          }}
                        ></span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </ClientSideRout>
        ))
        ) : (
          <p className="text-gray-500 py-4">No {filter} events found</p>
        )}
      </div>
    </div>
  );
}
