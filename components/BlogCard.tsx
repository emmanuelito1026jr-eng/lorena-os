import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Calendar } from 'lucide-react';
import type { BlogPost } from '../types';

interface BlogCardProps {
  readonly post: BlogPost;
}

const CATEGORY_LABELS: Record<BlogPost['category'], string> = {
  buying: 'Buying',
  selling: 'Selling',
  military: 'Military',
  market: 'Market',
  neighborhoods: 'Neighborhoods',
  investing: 'Investing',
};

const BlogCard = ({ post }: BlogCardProps) => {
  const [imageError, setImageError] = useState(false);

  const formattedDate = new Date(post.publishedAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group block rounded-xl overflow-hidden border border-gray-100 bg-white hover:shadow-premium hover:-translate-y-1 hover:border-b-gold transition-all duration-300"
    >
      {/* Image */}
      <div className="aspect-[16/9] overflow-hidden relative">
        {!imageError && post.image ? (
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
            width={800}
            height={600}
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gold/30 via-gold/10 to-dark/5 flex items-center justify-center">
            <span className="font-playfair text-gold/40 text-4xl font-bold select-none">
              Blog
            </span>
          </div>
        )}

        {/* Category Badge */}
        <span className="absolute top-4 left-4 bg-gold/10 text-gold text-xs font-lato font-bold uppercase tracking-wider px-3 py-1 rounded-full backdrop-blur-sm">
          {CATEGORY_LABELS[post.category]}
        </span>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="font-playfair text-lg sm:text-xl font-bold text-dark leading-snug mb-3 group-hover:text-gold transition-colors duration-300 line-clamp-2">
          {post.title}
        </h3>

        <p className="font-lato text-sm text-dark/60 leading-relaxed mb-4 line-clamp-2">
          {post.excerpt}
        </p>

        {/* Meta Row */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <span className="font-lato text-xs font-semibold text-dark/80">
            {post.author}
          </span>

          <div className="flex items-center gap-3 font-lato text-xs text-dark/50">
            <span className="flex items-center gap-1">
              <Calendar size={12} className="text-gold" />
              {formattedDate}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} className="text-gold" />
              {post.readTime} min
            </span>
          </div>
        </div>
      </div>

      {/* Gold bottom border on hover */}
      <div className="h-0.5 bg-gold scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
    </Link>
  );
};

export default BlogCard;
