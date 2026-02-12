// RESO Web API / Spark API standard types for GEPAR MLS IDX compliance

export interface MLSListing {
  // Core Identifiers
  ListingId: string;
  ListingKey: string;
  ModificationTimestamp: string;

  // MLS Attribution (REQUIRED by GEPAR Section 18)
  ListOfficeName: string;
  ListOfficeKey: string;
  ListAgentFullName: string;
  ListAgentKey: string;
  ListAgentMLSID: string;

  // Status & Pricing
  StandardStatus: 'Active' | 'Pending' | 'Closed' | 'Expired' | 'Canceled' | 'Withdrawn';
  ListPrice: number;
  OriginalListPrice?: number;

  // Address
  UnparsedAddress: string;
  StreetNumber?: string;
  StreetName?: string;
  StreetSuffix?: string;
  City: string;
  StateOrProvince: string;
  PostalCode: string;

  // Property Characteristics
  PropertyType: 'Residential' | 'Condo' | 'Townhouse' | 'Multi-Family' | 'Land';
  PropertySubType?: string;
  BedroomsTotal: number;
  BathroomsTotalInteger: number;
  BathroomsFull?: number;
  BathroomsHalf?: number;
  LivingArea: number;
  LotSizeAcres?: number;
  YearBuilt: number;

  // Media
  Media: MLSMedia[];

  // Location
  Latitude?: number;
  Longitude?: number;

  // Marketing (PublicRemarks only — PrivateRemarks NEVER displayed)
  PublicRemarks?: string;

  // Days on Market
  DaysOnMarket?: number;
  CumulativeDaysOnMarket?: number;

  // Virtual Tour
  VirtualTourURLUnbranded?: string;

  // Compliance / Opt-out Flags
  InternetEntireListingDisplay: boolean;
  InternetAddressDisplay: boolean;
  VOWAddressDisplay: boolean;

  // Features
  Appliances?: string[];
  ArchitecturalStyle?: string;
  Cooling?: string;
  Heating?: string;
  ParkingFeatures?: string[];
  PoolFeatures?: string[];

  // Neighborhood
  SubdivisionName?: string;
  MLSAreaMajor?: string;
}

export interface MLSMedia {
  MediaURL: string;
  Order: number;
  MediaCategory?: string;
}

// Consumer-safe display type (filtered from MLSListing)
export interface PropertyDisplayData {
  id: string;
  mlsNumber: string;

  // Attribution (REQUIRED)
  listOfficeName: string;
  listAgentName: string;

  // Status
  status: 'For Sale' | 'Pending' | 'Sold';

  // Pricing
  price: number;

  // Address
  address: string;
  city: string;
  state: string;
  zip: string;
  neighborhood: string;

  // Details
  beds: number;
  baths: number;
  sqft: number;
  lotSize?: number;
  yearBuilt: number;
  propertyType: string;

  // Media
  images: string[];
  virtualTour?: string;

  // Marketing
  description: string;
  features: string[];

  // Metadata
  daysOnMarket: number;
  lastUpdated: string;

  // Location
  latitude?: number;
  longitude?: number;
}

// Filter options for property search
export interface PropertyFilters {
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
  maxBeds?: number;
  minBaths?: number;
  propertyTypes?: string[];
  neighborhoods?: string[];
  status?: string[];
  searchTerm?: string;
}

// Audit trail entry for GEPAR compliance
export interface AuditLogEntry {
  timestamp: string;
  action: 'view' | 'search' | 'save' | 'contact';
  listingId?: string;
  searchCriteria?: PropertyFilters;
  userAgent: string;
}
