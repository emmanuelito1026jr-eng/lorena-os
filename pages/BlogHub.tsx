import { useState } from 'react';
import { usePageMeta } from '../hooks/usePageMeta';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CTABanner from '../components/CTABanner';
import BlogCard from '../components/BlogCard';
import { BLOG_POSTS } from '../lib/blog/posts';
import { BookOpen } from 'lucide-react';

const CATEGORIES = [
  { key: 'all', label: 'All Posts' },
  { key: 'buying', label: 'Buying' },
  { key: 'selling', label: 'Selling' },
  { key: 'military', label: 'Military' },
  { key: 'market', label: 'Market' },
  { key: 'neighborhoods', label: 'Neighborhoods' },
  { key: 'investing', label: 'Investing' },
];

export default function BlogHub() {
  usePageMeta({
    title: 'El Paso Real Estate Blog',
    description: 'Tips for buying, selling & investing in El Paso real estate. VA loan guides, neighborhood spotlights, market updates & more from Lorena Ontiveros-Ortega.',
    canonicalUrl: 'https://casasenelpasotx.com/blog',
  });
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredPosts = activeCategory === 'all'
    ? BLOG_POSTS
    : BLOG_POSTS.filter((p) => p.category === activeCategory);

  return (
    <div className="bg-white min-h-screen">
      <Navbar />
      <main>
        {/* Hero */}
        <section className="bg-dark pt-32 pb-16 md:pt-40 md:pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <BookOpen className="text-gold" size={24} />
              <span className="text-gold font-lato text-sm uppercase tracking-widest font-bold">Real Estate Blog</span>
            </div>
            <h1 className="font-playfair text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4">
              El Paso Real Estate<br className="hidden md:block" /> Insights & Guides
            </h1>
            <p className="font-lato text-lg text-white/60 max-w-2xl mx-auto">
              Expert tips, market updates, and neighborhood guides from Lorena Ontiveros-Ortega — your El Paso real estate specialist.
            </p>
          </div>
        </section>

        {/* Category Filters */}
        <section className="border-b border-gray-200 sticky top-0 bg-white z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
            <div className="flex gap-1 overflow-x-auto py-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`px-4 py-2 rounded-full font-lato text-sm font-semibold uppercase tracking-wider whitespace-nowrap transition-all ${
                    activeCategory === cat.key
                      ? 'bg-gold text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Posts Grid */}
        <section className="py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
            {filteredPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPosts.map((post) => (
                  <BlogCard key={post.slug} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <BookOpen className="text-gold/40 mx-auto mb-4" size={48} />
                <p className="font-playfair text-xl text-dark mb-2">No posts in this category yet</p>
                <p className="font-lato text-gray-500 text-sm">Check back soon for new content.</p>
              </div>
            )}
          </div>
        </section>

        <CTABanner />
      </main>
      <Footer />
    </div>
  );
}
