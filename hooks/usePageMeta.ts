import { useEffect } from 'react';

interface PageMeta {
  title: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
  jsonLd?: Record<string, unknown>;
}

function setMetaTag(property: string, content: string, isOg = false) {
  const attr = isOg ? 'property' : 'name';
  let tag = document.querySelector(`meta[${attr}="${property}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, property);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function removeMetaTag(property: string, isOg = false) {
  const attr = isOg ? 'property' : 'name';
  const tag = document.querySelector(`meta[${attr}="${property}"]`);
  if (tag) tag.remove();
}

export function usePageMeta({ title, description, ogTitle, ogDescription, ogImage, canonicalUrl, jsonLd }: PageMeta) {
  useEffect(() => {
    // Title
    const prevTitle = document.title;
    document.title = `${title} | Casas En El Paso TX`;

    // Meta description
    if (description) setMetaTag('description', description);

    // Open Graph
    if (ogTitle || title) setMetaTag('og:title', ogTitle || title, true);
    if (ogDescription || description) setMetaTag('og:description', (ogDescription || description)!, true);
    if (ogImage) setMetaTag('og:image', ogImage, true);

    // Twitter Card
    if (ogTitle || title) setMetaTag('twitter:title', ogTitle || title);
    if (ogDescription || description) setMetaTag('twitter:description', (ogDescription || description)!);
    if (ogImage) setMetaTag('twitter:image', ogImage);

    // Canonical URL
    let canonicalTag: HTMLLinkElement | null = null;
    if (canonicalUrl) {
      canonicalTag = document.querySelector('link[rel="canonical"]');
      if (!canonicalTag) {
        canonicalTag = document.createElement('link');
        canonicalTag.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalTag);
      }
      canonicalTag.setAttribute('href', canonicalUrl);
    }

    // JSON-LD
    let jsonLdScript: HTMLScriptElement | null = null;
    if (jsonLd) {
      jsonLdScript = document.createElement('script');
      jsonLdScript.type = 'application/ld+json';
      jsonLdScript.id = 'page-jsonld';
      jsonLdScript.textContent = JSON.stringify({ '@context': 'https://schema.org', ...jsonLd });
      // Remove existing page-level JSON-LD
      const existing = document.getElementById('page-jsonld');
      if (existing) existing.remove();
      document.head.appendChild(jsonLdScript);
    }

    return () => {
      document.title = prevTitle;
      if (description) removeMetaTag('description');
      if (jsonLdScript) jsonLdScript.remove();
      if (canonicalTag && canonicalUrl) canonicalTag.remove();
    };
  }, [title, description, ogTitle, ogDescription, ogImage, canonicalUrl, jsonLd]);
}
