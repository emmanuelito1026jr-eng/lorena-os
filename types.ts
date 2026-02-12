export interface NavLink {
  readonly label: string;
  readonly href: string;
}

export interface Service {
  readonly title: string;
  readonly subtitle: string;
  readonly description: string;
  readonly iconName: 'Home' | 'TrendingUp' | 'Building';
  readonly image: string;
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
