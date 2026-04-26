import WhiteOverlay from "./WhiteOverlay";
// import Image from "next/image";
import { Database } from "@/lib/database.types";
// import { getImageUrl } from "@/lib/utils/getImageUrl";

type Props = {
  category: Database['public']['Tables']['categories']['Row'];
};

export default async function HeroCategory({ category }: Props) {
  return (
    <div className="hero-wrapper w-inline-block py-2 border-y border-gray-100">
      <WhiteOverlay />
      <div className="hero-content">
        {/* <div className="mb-2">
          <Image
            src={await getImageUrl(category.main_image, 'website-images')}
            alt={category.title || 'Category image'}
            width={1000}
            height={600}
            className="rounded-xl shadow-lg object-cover object-top h-[20rem] w-full"
          />
        </div> */}
        <div className="text-box">
          <h2 className="h2">{category.title}</h2>
          <div
            className="p"
            dangerouslySetInnerHTML={{
              __html: category.summary || '',
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}
