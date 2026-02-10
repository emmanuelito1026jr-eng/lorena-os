# Casas En El Paso TX

A modern, bilingual real estate website for Lorena Ontiveros-Ortega, serving the El Paso, TX community with professional real estate services.

## 🌟 Features

- **Bilingual Interface** - Full English/Spanish support
- **Modern Design** - Luxurious dark theme with gold accents
- **Mobile Responsive** - Optimized for all devices
- **SEO Optimized** - Comprehensive meta tags and Schema.org structured data
- **Accessible** - WCAG AA compliant with ARIA labels and keyboard navigation
- **Form Integration** - n8n webhook integration for lead capture
- **Performance** - Optimized images and code splitting
- **Type Safe** - Full TypeScript implementation

## 🛠️ Tech Stack

- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite 6
- **Styling:** Tailwind CSS 3
- **Routing:** React Router DOM 7 (HashRouter)
- **Icons:** Lucide React
- **Testing:** Vitest + React Testing Library
- **Linting:** TypeScript ESLint

## 📋 Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd casas-en-el-paso-tx
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env.local` file in the root directory:
   ```bash
   # n8n Webhook URL for form submissions
   VITE_WEBHOOK_URL=https://your-n8n-instance.com/webhook/your-id
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   Visit [http://localhost:3000](http://localhost:3000)

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm test` | Run tests in watch mode |
| `npm run test:ui` | Open Vitest UI |
| `npm run test:coverage` | Generate test coverage report |

## 🗂️ Project Structure

```
casas-en-el-paso-tx/
├── components/          # React components
│   ├── AboutPreview.tsx
│   ├── ContactForm.tsx
│   ├── CTABanner.tsx
│   ├── ErrorBoundary.tsx
│   ├── Footer.tsx
│   ├── Hero.tsx
│   ├── Navbar.tsx
│   ├── NeighborhoodGuide.tsx
│   ├── Services.tsx
│   └── Testimonials.tsx
├── pages/              # Page components
│   ├── Home.tsx
│   └── Landing.tsx
├── tests/              # Test files
│   ├── components/
│   └── setup.ts
├── public/             # Static assets
│   └── site.webmanifest
├── App.tsx             # App entry point
├── constants.ts        # App constants
├── types.ts            # TypeScript types
├── index.css           # Global styles
├── tailwind.config.js  # Tailwind configuration
├── vitest.config.ts    # Testing configuration
└── vite.config.ts      # Vite configuration
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_WEBHOOK_URL` | n8n webhook endpoint for form submissions | Yes |

### n8n Webhook Setup

1. Create a webhook workflow in your n8n instance
2. Configure CORS to accept requests from your domain
3. Set up the workflow to handle the following payload:
   ```json
   {
     "name": "string",
     "email": "string",
     "phone": "string",
     "type": "Buying" | "Selling" | "Investing" | "Information",
     "timestamp": "ISO 8601 string",
     "source": "landing-page" | "home-page"
   }
   ```
4. Copy the webhook URL to your `.env.local` file

## 🖼️ Image Requirements

The site currently uses placeholder images. Replace them with actual photos:

1. **Review** `IMAGE_REQUIREMENTS.md` for detailed specifications
2. **Add images** to the `/public` directory
3. **Update references** in:
   - `constants.ts` (neighborhood images)
   - `Hero.tsx` (hero background)
   - `AboutPreview.tsx` (Lorena's headshot)
   - `Landing.tsx` (landing page images)

### Required Images

- Lorena's professional headshot (800x1000px)
- Hero background (1920x1080px)
- 4 neighborhood photos (600x400px each)
- Social media images (OG: 1200x630px, Twitter: 1200x675px)
- Favicons (16x16, 32x32, 180x180px)

## 🧪 Testing

Run the test suite:

```bash
# Watch mode
npm test

# UI mode
npm run test:ui

# Coverage report
npm run test:coverage
```

### Test Coverage

- **ContactForm**: Validation, formatting, submission
- **Navbar**: Navigation, mobile menu, accessibility
- **ErrorBoundary**: Error handling and display

## 🚀 Deployment

### Netlify

1. **Build settings**
   - Build command: `npm run build`
   - Publish directory: `dist`

2. **Environment variables**
   - Add `VITE_WEBHOOK_URL` in Netlify UI

3. **Redirects** (create `netlify.toml`)
   ```toml
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

### Vercel

1. **Build settings**
   - Framework Preset: Vite
   - Build command: `npm run build`
   - Output directory: `dist`

2. **Environment variables**
   - Add `VITE_WEBHOOK_URL` in Vercel dashboard

3. **Redirects** (create `vercel.json`)
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```

### Build Optimization

The production build includes:
- Minified JavaScript and CSS
- Tree-shaking for unused code
- Optimized images and assets
- Gzip compression

## 🌐 Browser Support

- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)
- Mobile browsers (iOS Safari, Chrome Android)

## ♿ Accessibility

This site implements WCAG 2.1 Level AA standards:

- Semantic HTML structure
- ARIA labels for interactive elements
- Keyboard navigation support
- Focus trap in mobile menu
- Skip-to-main-content link
- Sufficient color contrast
- Screen reader friendly

## 📊 SEO Features

- Comprehensive meta tags (title, description, keywords)
- Open Graph tags for social sharing
- Twitter Card metadata
- Schema.org structured data (RealEstateAgent, LocalBusiness, WebSite)
- Sitemap ready
- Robots.txt compatible

## 🔒 Security

- Environment variables for sensitive data
- HTTPS recommended for production
- CORS configuration for webhook
- Input validation on forms
- XSS protection via React

## 🤝 Contributing

1. Follow the existing code style
2. Write tests for new features
3. Update documentation as needed
4. Test accessibility with screen readers
5. Ensure mobile responsiveness

## 📝 License

Private - All rights reserved by Casas En El Paso TX

## 📧 Contact

**Lorena Ontiveros-Ortega**
- Phone: (915) 487-5581
- Email: lorena@casasenelpasotx.com
- Brokerage: Realty ONE Group

## 🐛 Issues & Support

For technical issues or feature requests, contact the development team.

---

Built with ❤️ for the El Paso community
