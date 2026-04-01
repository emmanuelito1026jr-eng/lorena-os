import { NavLink, Service, Neighborhood, Testimonial, Stat, NeighborhoodDetail } from './types';

export const COMPANY_NAME = "Casas En El Paso TX";
export const REALTOR_NAME = "Lorena Ontiveros-Ortega";
export const PHONE_NUMBER = "915-487-5581";
export const OFFICE_NUMBER = "915-615-2653";
export const EMAIL_ADDRESS = "lorena.realtor@icloud.com";
export const BUSINESS_EMAIL = "lorena@casasenelpasotx.com";
export const WEBSITE = "www.lorenaontiveros.com";
export const ADDRESS = "10420 Montwood Dr., Ste N-163, El Paso, TX 79935";
export const BROKERAGE = "The Right Move Real Estate Group";

// Mortgage Partner Information
export const PARTNER_NAME = "Emmanuel Ortega";
export const PARTNER_TITLE = "Loan Officer";
export const PARTNER_COMPANY = "American Pacific Mortgage";
export const PARTNER_PHONE = "915-329-1316";
export const PARTNER_EMAIL = "manny.ortega@apmortgage.com";
export const PARTNER_WEBSITE = "www.MannyHomeLoans.com";
export const PARTNER_NMLS = "NMLS #833420";
export const PARTNER_ADDRESS = "221 N Kansas St., Ste. 726, El Paso, TX 79901";

export const NAV_LINKS: NavLink[] = [
  { label: 'Search Homes', to: '/properties' },
  { label: 'Neighborhoods', to: '/neighborhoods' },
  { label: 'About', to: '/about' },
  { label: 'Home Estimate', to: '/estimate' },
  { label: 'Contact', to: '/contact' },
];

export const SERVICES: Service[] = [
  {
    title: "Compradores",
    subtitle: "Buyers",
    description: "From mortgage readiness to closing day, I guide you through every step with the financial expertise most realtors don't have.",
    iconName: "Home",
    image: "/images/services/buying.jpg"
  },
  {
    title: "Vendedores",
    subtitle: "Sellers",
    description: "Strategic pricing, professional marketing, and skilled negotiation to maximize your home's value in any market.",
    iconName: "TrendingUp",
    image: "/images/services/selling.jpg"
  },
  {
    title: "Inversiones",
    subtitle: "Investments",
    description: "Leverage the El Paso-Juárez bilateral market for smart investment opportunities on both sides of the border.",
    iconName: "Building",
    image: "/images/services/valuation.jpg"
  }
];

export const NEIGHBORHOODS: Neighborhood[] = [
  {
    name: "Westside",
    description: "Luxury living with mountain views and top-rated schools.",
    image: "/images/neighborhoods/westside.jpg"
  },
  {
    name: "Upper Valley",
    description: "Lush green landscapes, river proximity, and spacious estates.",
    image: "/images/neighborhoods/upper-valley.jpg"
  },
  {
    name: "Northeast",
    description: "Established neighborhoods near Fort Bliss with great value.",
    image: "/images/neighborhoods/northeast.jpg"
  },
  {
    name: "Horizon City",
    description: "Rapidly growing community perfect for new families.",
    image: "/images/neighborhoods/horizon-city.jpg"
  },
  {
    name: "Central",
    description: "Historic charm meets urban living in the heart of El Paso.",
    image: "/images/neighborhoods/central.jpg"
  },
  {
    name: "Eastlake",
    description: "Family-friendly master-planned community with modern amenities.",
    image: "/images/neighborhoods/eastlake.jpg"
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

export const NEIGHBORHOODS_DETAIL: NeighborhoodDetail[] = [
  {
    id: 'westside',
    name: 'Westside',
    description: 'Luxury living with mountain views and top-rated schools.',
    image: '/images/neighborhoods/westside.jpg',
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
    image: '/images/neighborhoods/upper-valley.jpg',
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
    id: 'northeast',
    name: 'Northeast',
    description: 'Established neighborhoods near Fort Bliss with great value.',
    image: '/images/neighborhoods/northeast.jpg',
    medianPrice: 245000,
    priceRange: [150000, 400000],
    coordinates: [31.8541, -106.3890],
    schools: [
      { name: 'Montwood High School', type: 'High School', rating: 7, distance: 2.5 },
      { name: 'Pebble Hills Elementary', type: 'Elementary', rating: 8, distance: 1.2 },
    ],
    amenities: ['Fort Bliss Access', 'Parks', 'Shopping Centers', 'Family Restaurants', 'Movie Theaters'],
    demographics: {
      population: 120000,
      medianAge: 30,
      medianIncome: 52000,
      homeownership: 55
    }
  },
  {
    id: 'horizon-city',
    name: 'Horizon City',
    description: 'Rapidly growing community perfect for new families.',
    image: '/images/neighborhoods/horizon-city.jpg',
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
    id: 'central',
    name: 'Central',
    description: 'Historic charm meets urban living in the heart of El Paso.',
    image: '/images/neighborhoods/central.jpg',
    medianPrice: 185000,
    priceRange: [120000, 350000],
    coordinates: [31.7587, -106.4870],
    schools: [
      { name: 'El Paso High School', type: 'High School', rating: 6, distance: 1.8 },
      { name: 'Mesita Elementary', type: 'Elementary', rating: 7, distance: 0.9 },
    ],
    amenities: ['Downtown Dining', 'Museums', 'Art Galleries', 'UTEP Campus', 'Historic Architecture', 'Public Transit'],
    demographics: {
      population: 65000,
      medianAge: 34,
      medianIncome: 38000,
      homeownership: 45
    }
  },
  {
    id: 'eastlake',
    name: 'Eastlake',
    description: 'Family-friendly master-planned community with modern amenities.',
    image: '/images/neighborhoods/eastlake.jpg',
    medianPrice: 310000,
    priceRange: [220000, 480000],
    coordinates: [31.6800, -106.2700],
    schools: [
      { name: 'Eastlake High School', type: 'High School', rating: 8, distance: 1.5 },
      { name: 'Lujan-Chavez Elementary', type: 'Elementary', rating: 8, distance: 1.0 },
    ],
    amenities: ['Community Pools', 'Splash Pads', 'Walking Trails', 'Sports Fields', 'New Construction', 'Shopping'],
    demographics: {
      population: 35000,
      medianAge: 29,
      medianIncome: 62000,
      homeownership: 70
    }
  }
];
