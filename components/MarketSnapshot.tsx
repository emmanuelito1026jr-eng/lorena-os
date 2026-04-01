import { Link } from 'react-router-dom';
import { TrendingUp, Home, Clock, DollarSign } from 'lucide-react';
import { useMarketSnapshot } from '../hooks/useMarketSnapshots';

const MarketSnapshot = () => {
  const { data: snapshot, isLoading } = useMarketSnapshot('El Paso', 'city');

  // Derive stats: use real data if available, fall back to mock
  const stats = getStats(snapshot?.current);

  return (
    <section className="py-20 md:py-28 bg-dark text-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <span className="text-gold text-xs uppercase tracking-[0.25em] font-lato font-semibold">Market Intelligence</span>
          <h2 className="mt-2 font-playfair text-3xl md:text-4xl font-bold">El Paso Market Right Now</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="text-center p-6 bg-white/5 rounded-xl border border-white/10 animate-pulse">
                <div className="w-7 h-7 bg-white/10 rounded mx-auto mb-3" />
                <div className="h-8 bg-white/10 rounded w-20 mx-auto mb-2" />
                <div className="h-3 bg-white/10 rounded w-24 mx-auto" />
              </div>
            ))
          ) : (
            stats.map((stat) => (
              <div key={stat.label} className="text-center p-6 bg-white/5 rounded-xl border border-white/10">
                <stat.icon className={`mx-auto mb-3 ${stat.color}`} size={28} />
                <p className="font-playfair text-2xl md:text-3xl font-bold text-white mb-1">{stat.value}</p>
                <p className="font-lato text-xs text-white/60 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))
          )}
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/properties"
            className="inline-flex items-center gap-2 border-2 border-gold text-gold rounded-full px-8 py-3 font-lato font-semibold text-sm uppercase tracking-widest hover:bg-gold hover:text-white transition-all"
          >
            See Full Market Report
          </Link>
        </div>
      </div>
    </section>
  );
};

function getStats(snapshot: { active_count: number; median_price: number | null; avg_dom: number | null; avg_price_per_sqft: number | null } | null | undefined) {
  if (snapshot && snapshot.median_price) {
    return [
      { icon: DollarSign, label: 'Median Price', value: `$${Number(snapshot.median_price).toLocaleString()}`, color: 'text-green-600' },
      { icon: Home, label: 'Active Listings', value: snapshot.active_count.toString(), color: 'text-gold' },
      { icon: Clock, label: 'Avg Days on Market', value: `${snapshot.avg_dom ?? 0} days`, color: 'text-blue-600' },
      { icon: TrendingUp, label: 'Avg Price/SqFt', value: `$${snapshot.avg_price_per_sqft ?? 0}`, color: 'text-gold' },
    ];
  }

  // El Paso market defaults while real data loads
  return [
    { icon: DollarSign, label: 'Median Price', value: '$230,000', color: 'text-green-600' },
    { icon: Home, label: 'Active Listings', value: '—', color: 'text-gold' },
    { icon: Clock, label: 'Avg Days on Market', value: '45 days', color: 'text-blue-600' },
    { icon: TrendingUp, label: 'Avg Price/SqFt', value: '$120', color: 'text-gold' },
  ];
}

export default MarketSnapshot;
