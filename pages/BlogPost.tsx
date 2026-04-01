import { useParams, Link } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BlogCard from '../components/BlogCard';
import { getBlogPost, BLOG_POSTS } from '../lib/blog/posts';
import { PHONE_NUMBER, REALTOR_NAME } from '../constants';
import { ArrowLeft, Calendar, Clock, User, Phone, ChevronRight } from 'lucide-react';

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getBlogPost(slug) : undefined;

  usePageMeta({
    title: post ? post.title : 'Blog Post Not Found',
    description: post ? post.excerpt : 'The requested blog post could not be found.',
    canonicalUrl: post ? `https://casasenelpasotx.com/blog/${post.slug}` : undefined,
    jsonLd: post ? {
      '@type': 'Article',
      headline: post.title,
      description: post.excerpt,
      author: { '@type': 'Person', name: post.author },
      datePublished: post.publishedAt,
      image: post.image,
      publisher: { '@type': 'Organization', name: 'Casas En El Paso TX' },
    } : undefined,
  });

  if (!post) {
    return (
      <div className="bg-white min-h-screen">
        <Navbar />
        <main className="pt-32 pb-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-12 text-center">
            <h1 className="font-playfair text-4xl font-bold text-dark mb-4">Post Not Found</h1>
            <p className="font-lato text-gray-600 mb-8">
              The blog post you're looking for doesn't exist or has been moved.
            </p>
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 bg-gold text-white px-6 py-3 font-lato font-bold text-sm uppercase tracking-wider hover:bg-gold-dark transition-all rounded-lg"
            >
              <ArrowLeft size={16} />
              Back to Blog
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Get related posts (same category, excluding current, max 3)
  const relatedPosts = BLOG_POSTS
    .filter((p) => p.category === post.category && p.slug !== post.slug)
    .slice(0, 2);

  // If not enough related posts from same category, fill with others
  const additionalPosts = relatedPosts.length < 2
    ? BLOG_POSTS.filter((p) => p.slug !== post.slug && !relatedPosts.includes(p)).slice(0, 2 - relatedPosts.length)
    : [];

  const allRelated = [...relatedPosts, ...additionalPosts];

  const formattedDate = new Date(post.publishedAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const categoryLabel = post.category.charAt(0).toUpperCase() + post.category.slice(1);

  return (
    <div className="bg-white min-h-screen">
      <Navbar />
      <main>
        {/* Hero / Header */}
        <section className="bg-dark pt-32 pb-16 md:pt-40 md:pb-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-12">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm font-lato text-white/40 mb-6" aria-label="Breadcrumb">
              <Link to="/" className="hover:text-white/60 transition-colors">Home</Link>
              <ChevronRight size={14} />
              <Link to="/blog" className="hover:text-white/60 transition-colors">Blog</Link>
              <ChevronRight size={14} />
              <span className="text-white/60 truncate">{post.title}</span>
            </nav>

            <span className="inline-block bg-gold/20 text-gold font-lato text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
              {categoryLabel}
            </span>

            <h1 className="font-playfair text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm font-lato text-white/50">
              <span className="flex items-center gap-1.5">
                <User size={14} className="text-gold" />
                {post.author}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={14} className="text-gold" />
                {formattedDate}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={14} className="text-gold" />
                {post.readTime} min read
              </span>
            </div>
          </div>
        </section>

        {/* Article Content */}
        <section className="py-12 md:py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-12">
              {/* Main Content */}
              <article className="prose prose-lg max-w-none font-lato text-gray-700 leading-relaxed prose-headings:font-playfair prose-headings:text-dark prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-strong:text-dark prose-a:text-gold prose-a:no-underline hover:prose-a:underline prose-ul:space-y-1 prose-li:text-gray-600">
                <div dangerouslySetInnerHTML={{ __html: markdownToHtml(post.content) }} />
              </article>

              {/* Sidebar */}
              <aside className="hidden lg:block">
                <div className="sticky top-24 space-y-8">
                  {/* Author Card */}
                  <div className="bg-warm-ivory rounded-xl p-6">
                    <p className="font-lato text-xs uppercase tracking-widest text-gray-500 mb-3">About the Author</p>
                    <h3 className="font-playfair text-lg font-bold text-dark mb-2">{REALTOR_NAME}</h3>
                    <p className="font-lato text-sm text-gray-600 leading-relaxed mb-4">
                      El Paso real estate specialist with 10+ years of experience. Bilingual (EN/ES) and passionate about helping families find their dream home.
                    </p>
                    <a
                      href={`tel:${PHONE_NUMBER}`}
                      className="flex items-center justify-center gap-2 bg-gold text-white w-full py-3 font-lato font-bold text-xs uppercase tracking-wider hover:bg-gold-dark transition-all rounded-lg"
                    >
                      <Phone size={14} />
                      {PHONE_NUMBER}
                    </a>
                  </div>

                  {/* CTA Card */}
                  <div className="bg-dark rounded-xl p-6 text-center">
                    <p className="font-playfair text-lg font-bold text-white mb-2">Looking to Buy or Sell?</p>
                    <p className="font-lato text-sm text-white/60 mb-4">
                      Get a free consultation with Lorena today.
                    </p>
                    <Link
                      to="/contact"
                      className="inline-flex items-center justify-center gap-2 bg-gold text-white w-full py-3 font-lato font-bold text-xs uppercase tracking-wider hover:bg-gold-dark transition-all rounded-lg"
                    >
                      Contact Lorena
                    </Link>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* Mobile CTA */}
        <section className="lg:hidden py-8 px-4">
          <div className="max-w-lg mx-auto bg-dark rounded-xl p-6 text-center">
            <p className="font-playfair text-lg font-bold text-white mb-2">Have Questions?</p>
            <p className="font-lato text-sm text-white/60 mb-4">Lorena is here to help with your real estate needs.</p>
            <a
              href={`tel:${PHONE_NUMBER}`}
              className="inline-flex items-center justify-center gap-2 bg-gold text-white w-full py-3 font-lato font-bold text-xs uppercase tracking-wider hover:bg-gold-dark transition-all rounded-lg"
            >
              <Phone size={14} />
              Call {PHONE_NUMBER}
            </a>
          </div>
        </section>

        {/* Related Posts */}
        {allRelated.length > 0 && (
          <section className="py-16 md:py-20 bg-warm-ivory">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
              <div className="text-center mb-12">
                <p className="text-gold font-lato text-sm uppercase tracking-widest font-bold mb-3">Keep Reading</p>
                <h2 className="font-playfair text-3xl font-bold text-dark">Related Articles</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {allRelated.map((related) => (
                  <BlogCard key={related.slug} post={related} />
                ))}
              </div>

              <div className="text-center mt-10">
                <Link
                  to="/blog"
                  className="inline-flex items-center gap-2 text-gold font-lato font-bold text-sm uppercase tracking-wider hover:text-gold-dark transition-all"
                >
                  <ArrowLeft size={16} />
                  Back to All Posts
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}

/**
 * Simple markdown-to-HTML converter for blog content.
 * Handles: ## headings, ### headings, **bold**, *italic*, - lists, paragraphs, links
 */
function markdownToHtml(markdown: string): string {
  return markdown
    .split('\n\n')
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return '';

      // H2
      if (trimmed.startsWith('## ')) {
        return `<h2>${processInline(trimmed.slice(3))}</h2>`;
      }

      // H3
      if (trimmed.startsWith('### ')) {
        return `<h3>${processInline(trimmed.slice(4))}</h3>`;
      }

      // Unordered list
      if (trimmed.startsWith('- ')) {
        const items = trimmed
          .split('\n')
          .filter((line) => line.trim().startsWith('- '))
          .map((line) => `<li>${processInline(line.trim().slice(2))}</li>`)
          .join('');
        return `<ul>${items}</ul>`;
      }

      // Paragraph
      return `<p>${processInline(trimmed.replace(/\n/g, ' '))}</p>`;
    })
    .join('\n');
}

function processInline(text: string): string {
  return text
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
}
