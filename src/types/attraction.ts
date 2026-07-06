export type Attraction = {
  content_id: string;
  title: string;
  latitude: number;
  longitude: number;
  address: string | null;
  image_url: string | null;
  category: string | null;
};

export type AttractionDetail = {
  content_id: string;
  overview: string | null;
  tel: string | null;
  homepage: string | null;
  images: string[];
  usetime: string | null;
  restdate: string | null;
  infocenter: string | null;
  parking: string | null;
};
