export interface Destination {
  id: string;
  name: string;
  location: string;
  description: string;
  type: 'beach' | 'mountain' | 'city' | 'cultural' | 'island';
  rating: number;
  imageUrl: string;
  imageCredit: string;
  bestTimeToVisit: string;
  activities: string[];
  tags: string[];
  longDescription?: string;
  howToGetThere?: string;
  whereToStay?: string[];
  nearbyAttractions?: string[];
  localCuisine?: string[];
  travelTips?: string[];
  gallery?: DestinationImage[];
}

export interface DestinationImage {
  url: string;
  caption: string;
  credit: string;
}

export interface DestinationSummary {
  id: string;
  name: string;
  location: string;
  shortDescription: string;
  type: string;
  rating: number;
  featuredImageUrl: string;
  imageCredit: string;
  tags: string[];
}

export interface DestinationsIndex {
  destinations: DestinationSummary[];
}