import type { PropertyDisplayData } from './types';
import type { ListingRow } from '../supabase/database.types';

// Safe columns to SELECT — never include raw_spark_data or display_compliance
export const LISTING_PUBLIC_FIELDS = `
  id, spark_id, mls_id, address, unit_number, city, state, zip_code, county, subdivision,
  list_price, original_list_price, sold_price, close_price, close_date, price_per_sqft,
  beds, baths, half_baths, sqft, lot_sqft, lot_acres, year_built, stories, garage_spaces, pool,
  days_on_market, cumulative_dom, list_date, pending_date,
  primary_photo_url, photos, photo_count, property_type, property_subtype, status,
  hoa_fee, hoa_frequency, tax_amount, tax_year, association_fee,
  school_district, elementary_school, middle_school, high_school,
  public_remarks, description, interior_features, exterior_features,
  appliances, heating, cooling, construction, roof, foundation, parking_description,
  virtual_tour_url, video_url,
  listing_agent_name, listing_agent_email, listing_agent_phone, listing_office_name,
  co_listing_agent_name, buyer_agent_name, buyer_office_name,
  is_lorenas_listing, mls_name, latitude, longitude, last_synced_at, created_at
`.replace(/\s+/g, ' ').trim();

const STATUS_MAP: Record<string, PropertyDisplayData['status']> = {
  active: 'For Sale',
  pending: 'Pending',
  sold: 'Sold',
};

// Regex to strip phone numbers and emails from remarks (GEPAR compliance)
const PHONE_REGEX = /(\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/g;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

function sanitizeRemarks(text: string | null): string {
  if (!text) return '';
  return text.replace(PHONE_REGEX, '[phone removed]').replace(EMAIL_REGEX, '[email removed]');
}

/**
 * Strip sensitive fields from a listing row before frontend use.
 * GEPAR compliance: never expose raw_spark_data or display_compliance to users.
 */
export function sanitizeForPublicDisplay(row: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...row };
  delete sanitized.raw_spark_data;
  delete sanitized.display_compliance;

  if (typeof sanitized.public_remarks === 'string') {
    sanitized.public_remarks = sanitizeRemarks(sanitized.public_remarks);
  }
  if (typeof sanitized.description === 'string') {
    sanitized.description = sanitizeRemarks(sanitized.description);
  }

  return sanitized;
}

/**
 * Transform a Supabase `listings` row into the consumer-safe PropertyDisplayData
 * that all components consume.
 */
export function transformListingToDisplay(row: ListingRow): PropertyDisplayData {
  // Extract image URLs and thumbnails from JSONB photos array
  // Handle: parsed array, JSON string, null entries, plain string URLs
  let images: string[] = [];
  let thumbnails: string[] = [];
  let photosArr: unknown[] = [];
  if (typeof row.photos === 'string') {
    try { photosArr = JSON.parse(row.photos); } catch { photosArr = []; }
  } else if (Array.isArray(row.photos)) {
    photosArr = row.photos;
  }
  if (Array.isArray(photosArr) && photosArr.length > 0) {
    images = photosArr
      .filter((p): p is Record<string, unknown> | string => p != null)
      .map((p) => (typeof p === 'string' ? p : String((p as Record<string, string>)?.large || (p as Record<string, string>)?.url || '')))
      .filter(Boolean);
    thumbnails = photosArr
      .filter((p): p is Record<string, unknown> | string => p != null)
      .map((p) => (typeof p === 'string' ? p : String((p as Record<string, string>)?.thumb || (p as Record<string, string>)?.url || '')))
      .filter(Boolean);
  }
  if (images.length === 0 && row.primary_photo_url) {
    images = [row.primary_photo_url];
    thumbnails = [row.primary_photo_url];
  }

  return {
    id: row.id,
    sparkId: row.spark_id || undefined,
    mlsNumber: row.mls_id || '',
    listOfficeName: row.listing_office_name || 'The Right Move Real Estate Group',
    listAgentName: row.listing_agent_name || 'Lorena Ontiveros-Ortega',
    listAgentEmail: row.listing_agent_email || undefined,
    listAgentPhone: row.listing_agent_phone || undefined,
    coListAgentName: row.co_listing_agent_name || undefined,
    status: STATUS_MAP[row.status] || 'For Sale',
    price: Number(row.list_price) || 0,
    originalPrice: row.original_list_price ? Number(row.original_list_price) : undefined,
    soldPrice: row.sold_price ? Number(row.sold_price) : undefined,
    pricePerSqft: row.price_per_sqft ? Number(row.price_per_sqft) : undefined,
    address: row.address,
    unitNumber: row.unit_number || undefined,
    city: row.city,
    state: row.state || 'TX',
    zip: row.zip_code,
    county: row.county || undefined,
    neighborhood: row.subdivision || row.city || 'El Paso',
    beds: row.beds || 0,
    baths: row.baths || 0,
    halfBaths: row.half_baths || undefined,
    sqft: row.sqft || 0,
    lotSize: row.lot_acres ? Number(row.lot_acres) : undefined,
    lotSqft: row.lot_sqft || undefined,
    yearBuilt: row.year_built || 0,
    stories: row.stories || undefined,
    garageSpaces: row.garage_spaces || undefined,
    pool: row.pool || undefined,
    propertyType: row.property_subtype || row.property_type || 'Residential',
    construction: row.construction || undefined,
    roof: row.roof || undefined,
    foundation: row.foundation || undefined,
    hoaFee: row.hoa_fee ? Number(row.hoa_fee) : undefined,
    hoaFrequency: row.hoa_frequency || undefined,
    taxAmount: row.tax_amount ? Number(row.tax_amount) : undefined,
    taxYear: row.tax_year || undefined,
    schoolDistrict: row.school_district || undefined,
    elementarySchool: row.elementary_school || undefined,
    middleSchool: row.middle_school || undefined,
    highSchool: row.high_school || undefined,
    images,
    thumbnails: thumbnails.length > 0 ? thumbnails : undefined,
    virtualTour: row.virtual_tour_url || undefined,
    videoUrl: row.video_url || undefined,
    description: sanitizeRemarks(row.public_remarks || row.description || ''),
    features: [
      ...(Array.isArray(row.interior_features) ? row.interior_features : []),
      ...(Array.isArray(row.exterior_features) ? row.exterior_features : []),
      ...(Array.isArray(row.appliances) ? row.appliances : []),
      ...(row.heating ? [`Heating: ${row.heating}`] : []),
      ...(row.cooling ? [`Cooling: ${row.cooling}`] : []),
    ],
    daysOnMarket: row.days_on_market || 0,
    cumulativeDom: row.cumulative_dom || undefined,
    listDate: row.list_date || undefined,
    closeDate: row.close_date || undefined,
    lastUpdated: row.last_synced_at || new Date().toISOString(),
    isLorenasListing: row.is_lorenas_listing || undefined,
    latitude: row.latitude ? Number(row.latitude) : undefined,
    longitude: row.longitude ? Number(row.longitude) : undefined,
  };
}

/**
 * Batch transform + sanitize listings rows to display data.
 */
export function transformListings(rows: ListingRow[]): PropertyDisplayData[] {
  return rows.map((r) => transformListingToDisplay(sanitizeForPublicDisplay(r) as ListingRow));
}
