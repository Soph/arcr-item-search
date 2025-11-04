# Arc Raiders Item Search

A web application for searching Arc Raiders items and viewing their usage across hideout modules and projects. It's based on JSON files provided in this repository: https://github.com/RaidTheory/arcraiders-data

## Features

- 🔍 Real-time search by item name
- 📊 Reference count showing how many times each item is used
- 🎨 Clean, responsive dark theme UI
- 📱 Mobile-friendly design
- ⚡ Fast, built with Svelte + TypeScript

## Data Source

This application fetches data directly from the [arcraiders-data](https://github.com/RaidTheory/arcraiders-data) repository, ensuring the information is always up-to-date.

## Development

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

This project is configured to automatically deploy to GitHub Pages via GitHub Actions.

### Setup GitHub Pages

1. Push this repository to GitHub
2. Go to repository Settings → Pages
3. Under "Build and deployment", select:
   - Source: GitHub Actions
4. Push to the `main` branch to trigger automatic deployment

The app will be available at: `https://[username].github.io/arcraiders-item-search/`

## Tech Stack

- **Svelte** - Reactive UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool
- **GitHub Pages** - Free hosting
- **GitHub Actions** - Automated CI/CD

## License

MIT
