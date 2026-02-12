import { NavLink, Service, Neighborhood, Testimonial, Stat, NeighborhoodDetail } from './types';

export const COMPANY_NAME = "Casas En El Paso TX";
export const REALTOR_NAME = "Lorena Ontiveros-Ortega";
export const PHONE_NUMBER = "915-487-5581";
export const OFFICE_NUMBER = "915-615-2653";
export const EMAIL_ADDRESS = "lorena.realtor@icloud.com";
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
  { label: 'Search Homes', href: '#/properties' },
  { label: 'Neighborhoods', href: '#neighborhoods' },
  { label: 'About', href: '#/about' },
  { label: 'Home Estimate', href: '#/estimate' },
  { label: 'Mortgage', href: '#/mortgage' },
];

export const SERVICES: Service[] = [
  {
    title: "Compradores",
    subtitle: "Buyers",
    description: "From mortgage readiness to closing day, I guide you through every step with the financial expertise most realtors don't have.",
    iconName: "Home",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=500&fit=crop&q=80"
  },
  {
    title: "Vendedores",
    subtitle: "Sellers",
    description: "Strategic pricing, professional marketing, and skilled negotiation to maximize your home's value in any market.",
    iconName: "TrendingUp",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=500&fit=crop&q=80"
  },
  {
    title: "Inversiones",
    subtitle: "Investments",
    description: "Leverage the El Paso-Juárez bilateral market for smart investment opportunities on both sides of the border.",
    iconName: "Building",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=500&fit=crop&q=80"
  }
];

export const NEIGHBORHOODS: Neighborhood[] = [
  {
    name: "Westside",
    description: "Luxury living with mountain views and top-rated schools.",
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop&q=80"
  },
  {
    name: "Upper Valley",
    description: "Lush green landscapes, river proximity, and spacious estates.",
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop&q=80"
  },
  {
    name: "Horizon City",
    description: "Rapidly growing community perfect for new families.",
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop&q=80"
  },
  {
    name: "Cimarron",
    description: "Modern master-planned community with exclusive amenities.",
    image: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&h=600&fit=crop&q=80"
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
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&h=400&fit=crop&q=80',
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
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&h=400&fit=crop&q=80',
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
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&h=400&fit=crop&q=80',
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
    image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=600&h=400&fit=crop&q=80',
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
