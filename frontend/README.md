# REFUSE Protocol Website

A modern, accessible static website for the REFUSE (REcyclable & Solid waste Unified Standard Exchange) protocol.

## Overview

This website showcases the REFUSE protocol, providing information about standardized data exchange for waste management and recycling operations. Built with modern web technologies and accessibility in mind.

## Features

- 🚀 **Fast Performance**: Optimized for Core Web Vitals
- ♿ **Accessibility First**: WCAG 2.1 AA compliant
- 📱 **Responsive Design**: Mobile-first approach
- 🎨 **Modern UI**: Built with Tailwind CSS Plus templates
- 🔒 **Security**: Comprehensive security headers
- 🌍 **SEO Optimized**: Semantic HTML and meta tags

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS 3
- **Build Tool**: Vite
- **Testing**: Vitest + Testing Library
- **Accessibility**: axe-core
- **Performance**: Lighthouse CI
- **Deployment**: Cloudflare Pages

## Development

### Prerequisites

- Node.js 20+
- npm or yarn

### Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Open browser**: Navigate to `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier

## Testing

### Unit Tests
```bash
npm test
```

### Accessibility Testing
```bash
npm run test -- --grep "accessibility"
```

### Performance Testing
```bash
npm run lighthouse
```

## Project Structure

```
frontend/
├── public/                 # Static assets
│   ├── _headers           # Security headers
│   ├── sitemap.xml        # SEO sitemap
│   └── robots.txt         # Search engine directives
├── src/
│   ├── components/        # React components
│   │   ├── About.jsx      # About page
│   │   ├── Contact.jsx    # Contact page
│   │   ├── Documentation.jsx # Docs page
│   │   ├── ErrorPage.jsx  # Error page
│   │   ├── Footer.jsx     # Site footer
│   │   ├── Homepage.jsx   # Landing page
│   │   ├── Layout.jsx     # Main layout
│   │   └── Navigation.jsx # Site navigation
│   ├── styles/            # CSS files
│   │   └── main.css       # Tailwind styles
│   ├── test/              # Test utilities
│   │   └── setup.js       # Test setup
│   ├── App.jsx            # Root component
│   └── main.jsx           # Entry point
└── tests/                 # Test files
    ├── contract/          # Contract tests
    ├── integration/       # Integration tests
    ├── accessibility/     # Accessibility tests
    ├── performance/       # Performance tests
    └── unit/              # Unit tests
```

## Accessibility

This website is designed to be accessible to all users:

- **WCAG 2.1 AA Compliant**: Meets international accessibility standards
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Color Contrast**: Sufficient contrast ratios for readability
- **Focus Management**: Clear focus indicators

## Performance

Optimized for excellent performance:

- **Core Web Vitals**: LCP < 2.5s, FID < 100ms, CLS < 0.1
- **Bundle Optimization**: Efficient code splitting
- **Image Optimization**: Responsive images with lazy loading
- **Caching Strategy**: Aggressive caching for static assets

## Deployment

### Cloudflare Pages

The site is automatically deployed to Cloudflare Pages:

- **Automatic Deployments**: Triggered on pushes to main branch
- **Global CDN**: Fast delivery worldwide
- **Security Headers**: Built-in security protections
- **SSL/TLS**: Automatic HTTPS

### GitHub Actions

Automated CI/CD pipeline includes:

- **Testing**: All tests run before deployment
- **Accessibility Audit**: axe-core accessibility testing
- **Performance Audit**: Lighthouse CI performance testing
- **Quality Gates**: Deployment only succeeds if quality checks pass

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

- **Documentation**: [REFUSE Protocol Docs](https://refuse-protocol.org/docs)
- **GitHub Issues**: [Report bugs](https://github.com/refuse-protocol/website/issues)
- **Discussions**: [Community discussions](https://github.com/refuse-protocol/website/discussions)

---

Built with ❤️ for the waste management community
