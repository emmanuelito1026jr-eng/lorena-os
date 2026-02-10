export interface NavLink {
  readonly label: string;
  readonly href: string;
}

export interface Service {
  readonly title: string;
  readonly subtitle: string;
  readonly description: string;
  readonly iconName: 'Home' | 'TrendingUp' | 'Building';
}

export interface Neighborhood {
  readonly name: string;
  readonly description: string;
  readonly image: string;
}

export interface Testimonial {
  readonly name: string;
  readonly text: string;
  readonly role: string;
  readonly rating: 1 | 2 | 3 | 4 | 5;
}

export interface Stat {
  readonly label: string;
  readonly value: string;
}

export interface ContactFormData {
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly type: 'Buying' | 'Selling' | 'Investing' | 'Information';
}

export interface Property {
  readonly id: string;
  readonly title: string;
  readonly address: string;
  readonly neighborhood: string;
  readonly price: number;
  readonly beds: number;
  readonly baths: number;
  readonly sqft: number;
  readonly lotSize?: number;
  readonly yearBuilt: number;
  readonly propertyType: 'Single Family' | 'Condo' | 'Townhouse' | 'Multi-Family' | 'Land';
  readonly status: 'For Sale' | 'Pending' | 'Sold' | 'Off Market';
  readonly images: readonly string[];
  readonly description: string;
  readonly features: readonly string[];
  readonly virtualTour?: string;
  readonly daysOnMarket: number;
  readonly mlsNumber?: string;
}

export interface NeighborhoodDetail extends Neighborhood {
  readonly id: string;
  readonly medianPrice: number;
  readonly priceRange: readonly [number, number];
  readonly schools: readonly School[];
  readonly amenities: readonly string[];
  readonly demographics: Demographics;
  readonly coordinates: readonly [number, number];
}

export interface School {
  readonly name: string;
  readonly type: 'Elementary' | 'Middle' | 'High School';
  readonly rating: number;
  readonly distance: number;
}

export interface Demographics {
  readonly population: number;
  readonly medianAge: number;
  readonly medianIncome: number;
  readonly homeownership: number;
}
