/**
 * Spark API Client for GEPAR MLS
 * ================================
 * Server-side only — used by n8n Code nodes and Supabase Edge Functions.
 * NEVER import this in frontend code (API credentials must not be exposed).
 *
 * Credentials:
 *   Feed ID:  bs1gx50w59ms8w6qyza2tpmjl
 *   Token:    <SPARK_API_TOKEN> (set via process.env.SPARK_API_TOKEN)
 *   Account:  Lorena Ontiveros-Ortega (gep.8809)
 *   MLS:      Greater El Paso MLS (GEPAR)
 *   Role:     IDX
 *   Rate:     1,500 requests / 5-min window
 */

// ─── Types ───────────────────────────────────────────────────

export interface SparkApiConfig {
  baseUrl: string;
  accessToken: string;
  userAgent: string;
  /** ms delay between paginated requests (default 200) */
  pageDelay: number;
}

export interface SparkPagination {
  TotalRows: number;
  PageSize: number;
  CurrentPage: number;
  TotalPages: number;
}

export interface SparkResponse<T = SparkListing> {
  D: {
    Success: boolean;
    Results: T[];
    Pagination: SparkPagination;
  };
}

export interface SparkPhoto {
  UriThumb: string;
  Uri300: string;
  Uri640: string;
  Uri800: string;
  Uri1024: string;
  Uri1600: string;
  Caption?: string;
  Primary?: boolean;
}

export interface SparkStandardFields {
  ListingId: string;
  MlsStatus: string;
  ListPrice: number;
  OriginalListPrice?: number;
  ClosePrice?: number;
  BedsTotal?: number;
  BathsTotal?: number;
  BathsHalf?: number;
  BuildingAreaTotal?: number;
  LotSizeArea?: number;
  LotSizeAcres?: number;
  YearBuilt?: number;
  Stories?: number;
  GarageSpaces?: number;
  PoolFeatures?: string | string[] | null;
  UnparsedAddress: string;
  UnitNumber?: string;
  City?: string;
  StateOrProvince?: string;
  PostalCode?: string;
  CountyOrParish?: string;
  SubdivisionName?: string;
  Latitude?: number;
  Longitude?: number;
  PropertyType?: string;
  PropertySubType?: string;
  PublicRemarks?: string;
  ListingContractDate?: string;
  PendingTimestamp?: string;
  WithdrawnDate?: string;
  ExpirationDate?: string;
  CloseDate?: string;
  DaysOnMarket?: number;
  CumulativeDaysOnMarket?: number;
  InteriorFeatures?: string | string[];
  ExteriorFeatures?: string | string[];
  Appliances?: string | string[];
  Heating?: string;
  Cooling?: string;
  ConstructionMaterials?: string | string[];
  Roof?: string;
  FoundationDetails?: string;
  ParkingFeatures?: string;
  AssociationFee?: number;
  AssociationFeeFrequency?: string;
  TaxAnnualAmount?: number;
  TaxYear?: number;
  ElementarySchool?: string;
  MiddleOrJuniorSchool?: string;
  HighSchool?: string;
  SchoolDistrict?: string;
  VirtualTourURLUnbranded?: string;
  ListAgentFullName?: string;
  ListAgentPreferredPhone?: string;
  ListAgentEmail?: string;
  ListOfficeName?: string;
  ListAgentId?: string;
  ListOfficeId?: string;
  CoListAgentFullName?: string;
  BuyerAgentFullName?: string;
  BuyerOfficeName?: string;
  ModificationTimestamp?: string;
  PhotosCount?: number;
  PhotosChangeTimestamp?: string;
  Photos?: SparkPhoto[];
}

export interface SparkListing {
  Id: string;
  ResourceUri: string;
  StandardFields: SparkStandardFields;
  DisplayCompliance?: Record<string, unknown>;
}

/** Supabase listings row shape for upsert */
export interface ListingUpsert {
  spark_id: string;
  mls_id: string;
  status: string;
  address: string;
  unit_number: string | null;
  city: string;
  state: string;
  zip_code: string;
  county: string;
  subdivision: string | null;
  latitude: number | null;
  longitude: number | null;
  property_type: string;
  property_subtype: string | null;
  beds: number;
  baths: number;
  half_baths: number;
  sqft: number | null;
  lot_sqft: number | null;
  lot_acres: number | null;
  year_built: number | null;
  stories: number | null;
  garage_spaces: number | null;
  pool: boolean;
  list_price: number;
  original_list_price: number;
  close_price: number | null;
  close_date: string | null;
  list_date: string | null;
  pending_date: string | null;
  withdrawn_date: string | null;
  expiration_date: string | null;
  days_on_market: number | null;
  cumulative_dom: number | null;
  description: string | null;
  public_remarks: string | null;
  interior_features: string[] | null;
  exterior_features: string[] | null;
  appliances: string[] | null;
  heating: string | null;
  cooling: string | null;
  construction: string[] | null;
  roof: string | null;
  foundation: string | null;
  parking_description: string | null;
  hoa_fee: number | null;
  hoa_frequency: string | null;
  tax_amount: number | null;
  tax_year: number | null;
  school_district: string | null;
  elementary_school: string | null;
  middle_school: string | null;
  high_school: string | null;
  photos: PhotoEntry[];
  photo_count: number;
  primary_photo_url: string | null;
  virtual_tour_url: string | null;
  listing_agent_id: string | null;
  listing_agent_name: string | null;
  listing_agent_phone: string | null;
  listing_agent_email: string | null;
  listing_office_name: string | null;
  listing_office_id: string | null;
  co_listing_agent_name: string | null;
  buyer_agent_name: string | null;
  buyer_office_name: string | null;
  is_lorenas_listing: boolean;
  display_compliance: Record<string, unknown> | null;
  raw_spark_data: SparkListing;
  spark_modification_timestamp: string;
  last_synced_at: string;
}

interface PhotoEntry {
  url: string;
  thumb: string;
  large: string;
  caption: string;
  primary: boolean;
  order: number;
}

// ─── Default Config ──────────────────────────────────────────

const DEFAULT_CONFIG: SparkApiConfig = {
  baseUrl: 'https://sparkapi.com/v1',
  accessToken: process.env.SPARK_API_TOKEN || '',
  userAgent: 'LorenaRealtorOS/1.0',
  pageDelay: 200,
};

// ─── Standard fields to request ──────────────────────────────

const LISTING_SELECT_FIELDS = [
  'ListingId', 'MlsStatus', 'ListPrice', 'OriginalListPrice', 'ClosePrice',
  'BedsTotal', 'BathsTotal', 'BathsHalf', 'BuildingAreaTotal', 'LotSizeArea',
  'LotSizeAcres', 'YearBuilt', 'Stories', 'GarageSpaces', 'PoolFeatures',
  'UnparsedAddress', 'UnitNumber', 'City', 'StateOrProvince', 'PostalCode',
  'CountyOrParish', 'SubdivisionName', 'Latitude', 'Longitude',
  'PropertyType', 'PropertySubType', 'PublicRemarks', 'ListingContractDate',
  'PendingTimestamp', 'WithdrawnDate', 'ExpirationDate', 'CloseDate',
  'DaysOnMarket', 'CumulativeDaysOnMarket', 'InteriorFeatures',
  'ExteriorFeatures', 'Appliances', 'Heating', 'Cooling',
  'ConstructionMaterials', 'Roof', 'FoundationDetails', 'ParkingFeatures',
  'AssociationFee', 'AssociationFeeFrequency', 'TaxAnnualAmount', 'TaxYear',
  'ElementarySchool', 'MiddleOrJuniorSchool', 'HighSchool', 'SchoolDistrict',
  'VirtualTourURLUnbranded', 'ListAgentFullName', 'ListAgentPreferredPhone',
  'ListAgentEmail', 'ListOfficeName', 'ListAgentId', 'ListOfficeId',
  'CoListAgentFullName', 'BuyerAgentFullName', 'BuyerOfficeName',
  'ModificationTimestamp', 'PhotosCount', 'PhotosChangeTimestamp',
].join(',');

// ─── Helper Functions ────────────────────────────────────────

export function mapStatus(sparkStatus: string): string {
  const map: Record<string, string> = {
    'Active': 'active',
    'Active Under Contract': 'pending',
    'Pending': 'pending',
    'Closed': 'sold',
    'Withdrawn': 'withdrawn',
    'Expired': 'expired',
    'Canceled': 'canceled',
    'Coming Soon': 'coming_soon',
  };
  return map[sparkStatus] || sparkStatus?.toLowerCase() || 'unknown';
}

export function mapPropertyType(sparkType: string): string {
  const map: Record<string, string> = {
    'A': 'single_family',
    'B': 'commercial',
    'C': 'land',
    'D': 'multi_family',
    'E': 'condo',
  };
  return map[sparkType] || 'other';
}

export function mapPhotos(photosArray: SparkPhoto[] | undefined | null): PhotoEntry[] {
  if (!photosArray || !Array.isArray(photosArray)) return [];
  return photosArray.map((p, index) => ({
    url: p.Uri1024 || p.Uri800 || p.Uri640 || p.Uri300 || p.UriThumb,
    thumb: p.UriThumb || p.Uri300,
    large: p.Uri1600 || p.Uri1024 || p.Uri800,
    caption: p.Caption || '',
    primary: index === 0,
    order: index,
  }));
}

export function getPrimaryPhoto(photosArray: SparkPhoto[] | undefined | null): string | null {
  if (!photosArray || !photosArray.length) return null;
  return photosArray[0].Uri800 || photosArray[0].Uri640 || photosArray[0].Uri300 || photosArray[0].UriThumb;
}

export function parseFeatureArray(val: string | string[] | null | undefined): string[] | null {
  if (!val) return null;
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
  return null;
}

export function isLorenas(agentName: string | null | undefined): boolean {
  if (!agentName) return false;
  const name = agentName.toLowerCase();
  return name.includes('ontiveros') || name.includes('lorena');
}

// ─── Transform Spark Listing → Supabase Row ─────────────────

export function transformSparkToSupabase(item: SparkListing): ListingUpsert {
  const sf = item.StandardFields;
  return {
    spark_id: item.Id,
    mls_id: sf.ListingId,
    status: mapStatus(sf.MlsStatus),
    address: sf.UnparsedAddress,
    unit_number: sf.UnitNumber || null,
    city: sf.City || 'El Paso',
    state: sf.StateOrProvince || 'TX',
    zip_code: sf.PostalCode || '',
    county: sf.CountyOrParish || 'El Paso',
    subdivision: sf.SubdivisionName || null,
    latitude: sf.Latitude || null,
    longitude: sf.Longitude || null,
    property_type: mapPropertyType(sf.PropertyType || ''),
    property_subtype: sf.PropertySubType || null,
    beds: sf.BedsTotal || 0,
    baths: sf.BathsTotal || 0,
    half_baths: sf.BathsHalf || 0,
    sqft: sf.BuildingAreaTotal || null,
    lot_sqft: sf.LotSizeArea || null,
    lot_acres: sf.LotSizeAcres || null,
    year_built: sf.YearBuilt || null,
    stories: sf.Stories || null,
    garage_spaces: sf.GarageSpaces || null,
    pool: !!(sf.PoolFeatures),
    list_price: sf.ListPrice,
    original_list_price: sf.OriginalListPrice || sf.ListPrice,
    close_price: sf.ClosePrice || null,
    close_date: sf.CloseDate || null,
    list_date: sf.ListingContractDate || null,
    pending_date: sf.PendingTimestamp || null,
    withdrawn_date: sf.WithdrawnDate || null,
    expiration_date: sf.ExpirationDate || null,
    days_on_market: sf.DaysOnMarket || null,
    cumulative_dom: sf.CumulativeDaysOnMarket || null,
    description: sf.PublicRemarks || null,
    public_remarks: sf.PublicRemarks || null,
    interior_features: parseFeatureArray(sf.InteriorFeatures),
    exterior_features: parseFeatureArray(sf.ExteriorFeatures),
    appliances: parseFeatureArray(sf.Appliances),
    heating: sf.Heating || null,
    cooling: sf.Cooling || null,
    construction: parseFeatureArray(sf.ConstructionMaterials),
    roof: sf.Roof || null,
    foundation: sf.FoundationDetails || null,
    parking_description: sf.ParkingFeatures || null,
    hoa_fee: sf.AssociationFee || null,
    hoa_frequency: sf.AssociationFeeFrequency || null,
    tax_amount: sf.TaxAnnualAmount || null,
    tax_year: sf.TaxYear || null,
    school_district: sf.SchoolDistrict || null,
    elementary_school: sf.ElementarySchool || null,
    middle_school: sf.MiddleOrJuniorSchool || null,
    high_school: sf.HighSchool || null,
    photos: mapPhotos(sf.Photos),
    photo_count: sf.PhotosCount || 0,
    primary_photo_url: getPrimaryPhoto(sf.Photos),
    virtual_tour_url: sf.VirtualTourURLUnbranded || null,
    listing_agent_id: sf.ListAgentId || null,
    listing_agent_name: sf.ListAgentFullName || null,
    listing_agent_phone: sf.ListAgentPreferredPhone || null,
    listing_agent_email: sf.ListAgentEmail || null,
    listing_office_name: sf.ListOfficeName || null,
    listing_office_id: sf.ListOfficeId || null,
    co_listing_agent_name: sf.CoListAgentFullName || null,
    buyer_agent_name: sf.BuyerAgentFullName || null,
    buyer_office_name: sf.BuyerOfficeName || null,
    is_lorenas_listing: isLorenas(sf.ListAgentFullName),
    display_compliance: item.DisplayCompliance || null,
    raw_spark_data: item,
    spark_modification_timestamp: sf.ModificationTimestamp || new Date().toISOString(),
    last_synced_at: new Date().toISOString(),
  };
}

// ─── Spark API Client ────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch a single page of listings from Spark API.
 */
export async function fetchListingsPage(
  filter: string,
  page: number = 1,
  config: SparkApiConfig = DEFAULT_CONFIG,
  _retryCount: number = 0,
): Promise<SparkResponse> {
  const params = new URLSearchParams({
    _filter: filter,
    _limit: '200',
    _page: String(page),
    _orderby: 'ModificationTimestamp asc',
    _expand: 'Photos',
    _select: LISTING_SELECT_FIELDS,
  });

  const url = `${config.baseUrl}/listings?${params.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `OAuth ${config.accessToken}`,
      'Accept': 'application/json',
      'User-Agent': config.userAgent,
      'X-SparkApi-User-Agent': config.userAgent,
    },
  });

  if (response.status === 429) {
    if (_retryCount >= 3) {
      throw new Error('Spark API rate limit exceeded after 3 retries');
    }
    await sleep(60_000);
    return fetchListingsPage(filter, page, config, _retryCount + 1);
  }

  if (!response.ok) {
    throw new Error(`Spark API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<SparkResponse>;
}

/**
 * Fetch ALL listings matching a filter, handling pagination automatically.
 * Respects rate limits with configurable delay between pages.
 */
export async function fetchAllListings(
  filter: string,
  config: SparkApiConfig = DEFAULT_CONFIG,
): Promise<SparkListing[]> {
  const allResults: SparkListing[] = [];
  let currentPage = 1;
  let totalPages = 1;

  do {
    const response = await fetchListingsPage(filter, currentPage, config);

    if (!response.D.Success) {
      throw new Error(`Spark API returned Success: false on page ${currentPage}`);
    }

    allResults.push(...response.D.Results);
    totalPages = response.D.Pagination.TotalPages;
    currentPage++;

    // Respect rate limits
    if (currentPage <= totalPages) {
      await sleep(config.pageDelay);
    }
  } while (currentPage <= totalPages);

  return allResults;
}

/**
 * Fetch listings modified after a given timestamp.
 * Used for incremental syncs (every 15 minutes).
 */
export async function fetchModifiedListings(
  sinceTimestamp: string,
  config: SparkApiConfig = DEFAULT_CONFIG,
): Promise<SparkListing[]> {
  const filter = `ModificationTimestamp Gt ${sinceTimestamp}`;
  return fetchAllListings(filter, config);
}

/**
 * Fetch a single listing by its Spark ID, including photos.
 */
export async function fetchListingById(
  sparkId: string,
  config: SparkApiConfig = DEFAULT_CONFIG,
): Promise<SparkListing | null> {
  const url = `${config.baseUrl}/listings/${sparkId}?_expand=Photos`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `OAuth ${config.accessToken}`,
      'Accept': 'application/json',
      'User-Agent': config.userAgent,
      'X-SparkApi-User-Agent': config.userAgent,
    },
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Spark API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as SparkResponse;
  return data.D.Results[0] || null;
}

/**
 * Fetch market statistics from Spark API.
 */
export async function fetchMarketStatistics(
  config: SparkApiConfig = DEFAULT_CONFIG,
): Promise<unknown> {
  const url = `${config.baseUrl}/marketstatistics`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `OAuth ${config.accessToken}`,
      'Accept': 'application/json',
      'User-Agent': config.userAgent,
      'X-SparkApi-User-Agent': config.userAgent,
    },
  });

  if (!response.ok) {
    throw new Error(`Spark API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
