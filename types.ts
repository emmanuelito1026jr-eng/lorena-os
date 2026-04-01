export interface NavLink {
  readonly label: string;
  readonly to: string;
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

// Blog types
export interface BlogPost {
  readonly slug: string;
  readonly title: string;
  readonly titleEs: string;
  readonly excerpt: string;
  readonly excerptEs: string;
  readonly content: string;
  readonly contentEs: string;
  readonly author: string;
  readonly publishedAt: string;
  readonly category: 'buying' | 'selling' | 'military' | 'market' | 'neighborhoods' | 'investing';
  readonly image: string;
  readonly readTime: number;
}

// Automation / Dashboard types (Phase 0)
export interface DealSummary {
  readonly id: string;
  readonly dealType: 'buyer' | 'seller' | 'dual';
  readonly stage: string;
  readonly propertyAddress: string | null;
  readonly listPrice: number | null;
  readonly salePrice: number | null;
  readonly estimatedCloseDate: string | null;
}

export interface PipelineTransition {
  readonly id: string;
  readonly leadId: string;
  readonly fromStatus: string;
  readonly toStatus: string;
  readonly changedBy: string;
  readonly createdAt: string;
}

export interface BehavioralEventSummary {
  readonly id: string;
  readonly leadId: string;
  readonly eventType: string;
  readonly pageUrl: string | null;
  readonly createdAt: string;
}
