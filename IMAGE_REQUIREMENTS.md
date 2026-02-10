# Image Requirements for Casas En El Paso TX

This document outlines all images needed to replace the current placeholders in the website.

## Priority 1: Critical Images

### 1. Lorena's Professional Headshot
- **Location:** `AboutPreview.tsx` (About section)
- **Dimensions:** 800x1000 pixels (4:5 aspect ratio)
- **Format:** JPG (optimized for web, max 200KB)
- **Subject:** Professional portrait of Lorena Ontiveros-Ortega
- **Style:** Business professional attire, warm smile, neutral background
- **Notes:** Should convert well to grayscale (currently has hover effect)

### 2. Hero Background Image
- **Location:** `Hero.tsx` (Homepage hero section)
- **Dimensions:** 1920x1080 pixels (16:9 aspect ratio)
- **Format:** JPG (optimized for web, max 300KB)
- **Subject:** El Paso cityscape or Franklin Mountains
- **Style:** Golden hour or sunset lighting preferred, wide landscape shot
- **Notes:** Dark overlay will be applied, so ensure good contrast

## Priority 2: SEO & Social Media

### 3. Open Graph Image
- **Location:** `public/og-image.jpg`
- **Dimensions:** 1200x630 pixels
- **Format:** JPG (max 1MB)
- **Subject:** Branded promotional image
- **Required elements:**
  - "Casas En El Paso TX" branding
  - Lorena's photo or El Paso landmark
  - Tagline: "Your Bilingual Real Estate Expert"
- **Purpose:** Facebook, LinkedIn, WhatsApp previews

### 4. Twitter Card Image
- **Location:** `public/twitter-image.jpg`
- **Dimensions:** 1200x675 pixels
- **Format:** JPG (max 1MB)
- **Subject:** Same as OG image or alternative branded design
- **Purpose:** Twitter post previews

### 5. Favicons
See `public/FAVICON_PLACEHOLDER.md` for detailed favicon requirements.

## Priority 3: Neighborhood Images

Replace the following placeholder images in `constants.ts`:

### 6. Westside Neighborhood
- **Dimensions:** 600x400 pixels
- **Subject:** Luxury homes with Franklin Mountain views
- **Neighborhoods:** Coronado, West El Paso area
- **Style:** Showcase upscale properties and mountain backdrop

### 7. Upper Valley
- **Dimensions:** 600x400 pixels
- **Subject:** Lush landscapes near the Rio Grande
- **Neighborhoods:** Vinton, Canutillo area
- **Style:** Green spaces, river proximity, spacious estates

### 8. Horizon City
- **Dimensions:** 600x400 pixels
- **Subject:** Modern new construction homes
- **Neighborhoods:** Horizon City developments
- **Style:** Family-friendly community, new builds

### 9. Cimarron
- **Dimensions:** 600x400 pixels
- **Subject:** Upscale master-planned community
- **Neighborhoods:** Cimarron area
- **Style:** Modern architecture, community amenities

## Priority 4: Landing Page Images

### 10. Landing Hero Background
- **Location:** `Landing.tsx` (Landing page hero)
- **Dimensions:** 1920x1080 pixels
- **Format:** JPG (max 300KB)
- **Subject:** Luxury home interior or exterior
- **Style:** High-end property that represents aspirational living
- **Notes:** Will be shown at 30% opacity with dark overlay

### 11. Client Testimonial Photos (3 images)
- **Location:** `Landing.tsx` (Social proof section)
- **Dimensions:** 50x50 pixels each (circular crop)
- **Format:** JPG (max 20KB each)
- **Subject:** Happy clients or stock photos representing diversity
- **Style:** Professional headshots, smiling, diverse demographics
- **Notes:** Must look authentic and trustworthy

## Image Optimization Guidelines

### File Size Targets
- Hero images (1920x1080): 200-300KB
- Medium images (800x1000): 150-200KB
- Small images (600x400): 80-120KB
- Thumbnails (50x50): 10-20KB

### Optimization Tools
- TinyPNG (https://tinypng.com/)
- Squoosh (https://squoosh.app/)
- ImageOptim (Mac)

### Technical Requirements
- **Format:** JPG for photos, PNG for logos/icons
- **Color space:** sRGB
- **Resolution:** 72 DPI (web standard)
- **Compression:** Progressive JPEG preferred

## Brand Guidelines

### Color Palette
- **Gold:** #C9A84C (primary accent)
- **Dark:** #1A1A1A (background)
- **Ivory:** #FAFAF5 (text)

### Photography Style
- **Mood:** Professional, luxurious, warm
- **Lighting:** Natural light, golden hour preferred
- **Subjects:** El Paso landscapes, modern homes, happy families
- **Avoid:** Stock photos that look overly staged

## Image Placement Reference

| Image | File Path | Component | Priority |
|-------|-----------|-----------|----------|
| Lorena Headshot | AboutPreview.tsx line 16 | About section | High |
| Hero Background | Hero.tsx line 11 | Homepage hero | High |
| OG Image | public/og-image.jpg | Meta tags | High |
| Twitter Image | public/twitter-image.jpg | Meta tags | Medium |
| Westside | constants.ts line 42 | Neighborhoods | Medium |
| Upper Valley | constants.ts line 47 | Neighborhoods | Medium |
| Horizon City | constants.ts line 52 | Neighborhoods | Medium |
| Cimarron | constants.ts line 57 | Neighborhoods | Medium |
| Landing Hero | Landing.tsx line 24 | Landing page | Medium |
| Client Avatars | Landing.tsx lines 60-62 | Social proof | Low |

## Next Steps

1. **Gather photos** from Lorena (professional headshot, property photos)
2. **Photograph neighborhoods** or source from MLS listings (with permission)
3. **Create branded graphics** for OG/Twitter cards
4. **Optimize all images** using tools listed above
5. **Replace placeholders** by updating the file paths in the code
6. **Test performance** with Lighthouse after implementing real images

## Questions?

Contact the development team if you need:
- Specific image dimensions adjusted
- Additional image placements
- Custom image processing requirements
