import { NavLink, Service, Neighborhood, Testimonial, Stat, Property, NeighborhoodDetail } from './types';

export const COMPANY_NAME = "Casas En El Paso TX";
export const REALTOR_NAME = "Lorena Ontiveros-Ortega";
export const PHONE_NUMBER = "915-487-5581";
export const EMAIL_ADDRESS = "lorena@casasenelpasotx.com";
export const ADDRESS = "10420 Montwood Dr., Ste N-163, El Paso, TX 79935";
export const BROKERAGE = "Realty ONE Group";

export const NAV_LINKS: NavLink[] = [
  { label: 'Home', href: '/' },
  { label: 'Properties', href: '#/properties' },
  { label: 'About', href: '#about' },
  { label: 'Services', href: '#services' },
  { label: 'Neighborhoods', href: '#neighborhoods' },
];

export const SERVICES: Service[] = [
  {
    title: "Compradores",
    subtitle: "Buyers",
    description: "From mortgage readiness to closing day, I guide you through every step with the financial expertise most realtors don't have.",
    iconName: "Home"
  },
  {
    title: "Vendedores",
    subtitle: "Sellers",
    description: "Strategic pricing, professional marketing, and skilled negotiation to maximize your home's value in any market.",
    iconName: "TrendingUp"
  },
  {
    title: "Inversiones",
    subtitle: "Investments",
    description: "Leverage the El Paso-Juárez bilateral market for smart investment opportunities on both sides of the border.",
    iconName: "Building"
  }
];

export const NEIGHBORHOODS: Neighborhood[] = [
  {
    name: "Westside",
    description: "Luxury living with mountain views and top-rated schools.",
    // PLACEHOLDER: Replace with actual photo of Westside neighborhood with mountain views
    image: "https://placehold.co/600x400/1A1A1A/C9A84C?text=Westside+El+Paso"
  },
  {
    name: "Upper Valley",
    description: "Lush green landscapes, river proximity, and spacious estates.",
    // PLACEHOLDER: Replace with actual photo of Upper Valley area near the Rio Grande
    image: "https://placehold.co/600x400/1A1A1A/C9A84C?text=Upper+Valley"
  },
  {
    name: "Horizon City",
    description: "Rapidly growing community perfect for new families.",
    // PLACEHOLDER: Replace with actual photo of Horizon City developments
    image: "https://placehold.co/600x400/1A1A1A/C9A84C?text=Horizon+City"
  },
  {
    name: "Cimarron",
    description: "Modern master-planned community with exclusive amenities.",
    // PLACEHOLDER: Replace with actual photo of Cimarron community amenities
    image: "https://placehold.co/600x400/1A1A1A/C9A84C?text=Cimarron"
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Familia Rodriguez",
    role: "First-time Buyers",
    text: "Lorena helped us navigate the complex mortgage process. Her banking background was a lifesaver! ¡Gracias Lorena!",
    rating: 5
  },
  {
    name: "Michael & Sarah",
    role: "Relocation Clients",
    text: "Moving to El Paso was daunting, but Lorena made us feel at home instantly. She knows every corner of this city.",
    rating: 5
  },
  {
    name: "Elena M.",
    role: "Seller",
    text: "Professional, luxury service. She sold my home in the Upper Valley for above asking price in just days.",
    rating: 5
  }
];

export const STATS: Stat[] = [
  { label: "Financial Experience", value: "10+ Years" },
  { label: "Language", value: "Bilingual" },
  { label: "Families Served", value: "100+" },
  { label: "Roots", value: "El Paso Native" },
];

export const PROPERTIES: Property[] = [
  {
    id: '1',
    title: 'Stunning Modern Estate with Mountain Views',
    address: '5432 Vista Del Sol Drive',
    neighborhood: 'Westside',
    price: 675000,
    beds: 4,
    baths: 3.5,
    sqft: 3200,
    lotSize: 0.35,
    yearBuilt: 2020,
    propertyType: 'Single Family',
    status: 'For Sale',
    images: [
      'https://placehold.co/1200x800/1A1A1A/C9A84C?text=Modern+Estate+Front',
      'https://placehold.co/1200x800/1A1A1A/C9A84C?text=Living+Room',
      'https://placehold.co/1200x800/1A1A1A/C9A84C?text=Kitchen',
      'https://placehold.co/1200x800/1A1A1A/C9A84C?text=Master+Bedroom',
      'https://placehold.co/1200x800/1A1A1A/C9A84C?text=Backyard'
    ],
    description: 'Breathtaking contemporary home with panoramic Franklin Mountain views. Features open floor plan, gourmet kitchen with quartz countertops, smart home technology, and resort-style backyard with pool.',
    features: ['Pool', 'Smart Home', 'Mountain Views', 'Gourmet Kitchen', 'Walk-in Closets', 'Energy Efficient', 'Hardwood Floors', '2-Car Garage'],
    daysOnMarket: 12,
    mlsNumber: 'EP9876543'
  },
  {
    id: '2',
    title: 'Charming Riverside Home in Upper Valley',
    address: '8765 Rio Grande Boulevard',
    neighborhood: 'Upper Valley',
    price: 425000,
    beds: 3,
    baths: 2,
    sqft: 2100,
    lotSize: 0.5,
    yearBuilt: 2015,
    propertyType: 'Single Family',
    status: 'For Sale',
    images: [
      'https://placehold.co/1200x800/1A1A1A/C9A84C?text=Riverside+Home',
      'https://placehold.co/1200x800/1A1A1A/C9A84C?text=Living+Area',
      'https://placehold.co/1200x800/1A1A1A/C9A84C?text=Dining+Room',
    ],
    description: 'Peaceful retreat near the Rio Grande. Lush landscaping, spacious lot, updated throughout. Perfect for families seeking tranquility.',
    features: ['Large Lot', 'Updated Kitchen', 'Covered Patio', 'Mature Trees', 'Quiet Street'],
    daysOnMarket: 8,
    mlsNumber: 'EP9876544'
  },
  {
    id: '3',
    title: 'New Construction in Horizon City',
    address: '1234 Desert Bloom Way',
    neighborhood: 'Horizon City',
    price: 315000,
    beds: 4,
    baths: 2.5,
    sqft: 2400,
    lotSize: 0.25,
    yearBuilt: 2024,
    propertyType: 'Single Family',
    status: 'For Sale',
    images: [
      'https://placehold.co/1200x800/1A1A1A/C9A84C?text=New+Construction',
      'https://placehold.co/1200x800/1A1A1A/C9A84C?text=Modern+Interior',
    ],
    description: 'Brand new home in fast-growing Horizon City. Energy-efficient, modern design, community amenities. Perfect for first-time buyers.',
    features: ['New Construction', 'Energy Star', 'HOA Amenities', 'Granite Counters', 'Stainless Appliances'],
    daysOnMarket: 3,
    mlsNumber: 'EP9876545'
  },
  {
    id: '4',
    title: 'Luxury Cimarron Estate',
    address: '9876 Championship Drive',
    neighborhood: 'Cimarron',
    price: 850000,
    beds: 5,
    baths: 4.5,
    sqft: 4500,
    lotSize: 0.45,
    yearBuilt: 2019,
    propertyType: 'Single Family',
    status: 'For Sale',
    images: [
      'https://placehold.co/1200x800/1A1A1A/C9A84C?text=Luxury+Estate',
      'https://placehold.co/1200x800/1A1A1A/C9A84C?text=Grand+Entry',
      'https://placehold.co/1200x800/1A1A1A/C9A84C?text=Pool+View',
    ],
    description: 'Exceptional luxury estate in prestigious Cimarron. Custom finishes, chef\'s kitchen, theater room, stunning pool. Golf course access.',
    features: ['Pool & Spa', 'Golf Course', 'Theater Room', 'Wine Cellar', 'Outdoor Kitchen', '3-Car Garage', 'Study'],
    daysOnMarket: 21,
    mlsNumber: 'EP9876546'
  },
  {
    id: '5',
    title: 'Cozy Westside Starter Home',
    address: '3456 Sunset Ridge Lane',
    neighborhood: 'Westside',
    price: 285000,
    beds: 3,
    baths: 2,
    sqft: 1650,
    lotSize: 0.18,
    yearBuilt: 2010,
    propertyType: 'Single Family',
    status: 'Pending',
    images: [
      'https://placehold.co/1200x800/1A1A1A/C9A84C?text=Starter+Home',
    ],
    description: 'Perfect starter home in desirable Westside location. Move-in ready, great schools, low maintenance.',
    features: ['Low Maintenance', 'Updated Bathrooms', 'New HVAC', 'Covered Parking'],
    daysOnMarket: 5,
    mlsNumber: 'EP9876547'
  },
  {
    id: '6',
    title: 'Modern Townhouse Downtown',
    address: '567 Downtown Plaza #203',
    neighborhood: 'Downtown',
    price: 395000,
    beds: 2,
    baths: 2.5,
    sqft: 1850,
    yearBuilt: 2021,
    propertyType: 'Townhouse',
    status: 'For Sale',
    images: [
      'https://placehold.co/1200x800/1A1A1A/C9A84C?text=Modern+Townhouse',
    ],
    description: 'Contemporary townhouse in vibrant downtown. Rooftop terrace, walkable to restaurants and entertainment.',
    features: ['Rooftop Terrace', 'Urban Living', 'Attached Garage', 'Walkable', 'HOA Included'],
    daysOnMarket: 15,
    mlsNumber: 'EP9876548'
  }
];

export const NEIGHBORHOODS_DETAIL: NeighborhoodDetail[] = [
  {
    id: 'westside',
    name: 'Westside',
    description: 'Luxury living with mountain views and top-rated schools.',
    image: 'https://placehold.co/600x400/1A1A1A/C9A84C?text=Westside+El+Paso',
    medianPrice: 450000,
    priceRange: [250000, 1200000],
    coordinates: [31.8456, -106.6055],
    schools: [
      { name: 'Coronado High School', type: 'High School', rating: 9, distance: 2.3 },
      { name: 'Desert Hills Elementary', type: 'Elementary', rating: 8, distance: 1.5 },
    ],
    amenities: ['Parks', 'Shopping', 'Restaurants', 'Golf Courses', 'Hiking Trails', 'Libraries'],
    demographics: {
      population: 85000,
      medianAge: 38,
      medianIncome: 75000,
      homeownership: 68
    }
  },
  {
    id: 'upper-valley',
    name: 'Upper Valley',
    description: 'Lush green landscapes, river proximity, and spacious estates.',
    image: 'https://placehold.co/600x400/1A1A1A/C9A84C?text=Upper+Valley',
    medianPrice: 380000,
    priceRange: [200000, 850000],
    coordinates: [31.8762, -106.5821],
    schools: [
      { name: 'Canutillo High School', type: 'High School', rating: 7, distance: 3.1 },
    ],
    amenities: ['Rio Grande Access', 'Farms & Vineyards', 'Equestrian Facilities', 'Rural Living'],
    demographics: {
      population: 42000,
      medianAge: 35,
      medianIncome: 62000,
      homeownership: 72
    }
  },
  {
    id: 'horizon-city',
    name: 'Horizon City',
    description: 'Rapidly growing community perfect for new families.',
    image: 'https://placehold.co/600x400/1A1A1A/C9A84C?text=Horizon+City',
    medianPrice: 295000,
    priceRange: [180000, 500000],
    coordinates: [31.6943, -106.2050],
    schools: [
      { name: 'Horizon High School', type: 'High School', rating: 8, distance: 2.0 },
    ],
    amenities: ['New Development', 'Parks', 'Community Centers', 'Shopping'],
    demographics: {
      population: 19000,
      medianAge: 32,
      medianIncome: 58000,
      homeownership: 75
    }
  },
  {
    id: 'cimarron',
    name: 'Cimarron',
    description: 'Modern master-planned community with exclusive amenities.',
    image: 'https://placehold.co/600x400/1A1A1A/C9A84C?text=Cimarron',
    medianPrice: 520000,
    priceRange: [350000, 1500000],
    coordinates: [31.9123, -106.6234],
    schools: [
      { name: 'Franklin High School', type: 'High School', rating: 9, distance: 1.8 },
    ],
    amenities: ['Golf Course', 'Country Club', 'Tennis Courts', 'Swimming Pools', 'Fitness Center'],
    demographics: {
      population: 12000,
      medianAge: 42,
      medianIncome: 95000,
      homeownership: 82
    }
  }
];
