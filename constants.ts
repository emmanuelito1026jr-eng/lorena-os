import { NavLink, Service, Neighborhood, Testimonial, Stat } from './types';

export const COMPANY_NAME = "Casas En El Paso TX";
export const REALTOR_NAME = "Lorena Ontiveros-Ortega";
export const PHONE_NUMBER = "915-487-5581";
export const EMAIL_ADDRESS = "lorena@casasenelpasotx.com";
export const ADDRESS = "10420 Montwood Dr., Ste N-163, El Paso, TX 79935";
export const BROKERAGE = "Realty ONE Group";

export const NAV_LINKS: NavLink[] = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '#about' },
  { label: 'Services', href: '#services' },
  { label: 'Neighborhoods', href: '#neighborhoods' },
  { label: 'Landing Promo', href: '#/landing' }, // Demo link to landing page
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
