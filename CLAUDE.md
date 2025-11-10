# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
arcr-item-search is a Svelte 5 web application that provides a searchable interface for Arc Raiders game items. It fetches data from the RaidTheory/arcraiders-data GitHub repository and displays items with their usage references across hideout modules, projects, and quests.

## Commands

### Development
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production (configured for GitHub Pages deployment)
- `npm run preview` - Preview production build locally
- `npm run check` - Run Svelte type checking and TypeScript compilation checks

### Deployment
The project is configured for GitHub Pages deployment with base URL `/arcr-item-search/`. Build output goes to `dist/` directory.

## Architecture

### Data Flow
1. **Data Loading**: `src/lib/dataLoader.ts` fetches JSON data from https://github.com/RaidTheory/arcraiders-data
2. **Search Processing**: `src/lib/searchUtils.ts` handles search logic and reference counting
3. **UI Rendering**: `src/App.svelte` renders the search interface with real-time filtering

### Key Components
- **App.svelte**: Main component managing state, search, and rendering
- **dataLoader.ts**: Fetches and caches data from external repository
- **searchUtils.ts**: Contains `searchItems()` function that filters items and calculates reference counts

### Data Models
The application works with four main data types (defined in `src/types.ts`):
- **Item**: Game items with localized names, descriptions, rarity, value
- **HideoutModule**: Building modules with upgrade levels requiring items
- **Project**: Multi-phase projects requiring items
- **Quest**: Quests that may require items (tracked in `requiredItemIds`)

### Reference Counting
Items display usage counts across:
- Hideout module upgrades (checks all upgrade levels)
- Project phases (checks all phases)
- Quest requirements (checks `requiredItemIds` field)

## Important Technical Notes

1. **Svelte 5 Runes**: This project uses Svelte 5's new runes syntax (`$state`, `$derived`, `$effect`)
2. **Data Source**: All game data comes from https://raw.githubusercontent.com/RaidTheory/arcraiders-data/main/
3. **Search Implementation**: Case-insensitive search across item names and descriptions
4. **Defensive Programming**: Always check for existence of `requiredItemIds` in quests as older data may not have this field
5. **GitHub Pages Base**: Vite config sets base to `/arcr-item-search/` for proper asset loading

## Common Development Tasks

When modifying search functionality, the key files are:
- `src/lib/searchUtils.ts` for search logic
- `src/App.svelte` for UI updates

When updating data models:
- Update types in `src/types.ts`
- Ensure backward compatibility with existing data structure