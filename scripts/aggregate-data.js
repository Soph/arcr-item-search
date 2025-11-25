#!/usr/bin/env node

/**
 * Aggregates data from RaidTheory/arcraiders-data repository
 * into single JSON files for the app to consume.
 *
 * Run: node scripts/aggregate-data.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_URL = 'https://github.com/RaidTheory/arcraiders-data.git';
const TEMP_DIR = path.join(__dirname, '..', '.tmp-arcraiders-data');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'data');

function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created output directory: ${OUTPUT_DIR}`);
  }
}

function cloneRepo() {
  // Clean up any existing temp directory
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true });
  }

  console.log('Cloning arcraiders-data repository...');
  execSync(`git clone --depth 1 ${REPO_URL} "${TEMP_DIR}"`, { stdio: 'inherit' });
  console.log('Clone complete.\n');
}

function cleanupRepo() {
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true });
    console.log('Cleaned up temporary directory.');
  }
}

function readJsonFilesFromDir(dirPath, label) {
  console.log(`Reading ${label}...`);
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));

  const items = files.map(file => {
    const content = fs.readFileSync(path.join(dirPath, file), 'utf-8');
    return JSON.parse(content);
  });

  console.log(`  Found ${items.length} ${label}`);
  return items;
}

function readJsonFile(filePath, label) {
  console.log(`Reading ${label}...`);
  const content = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(content);

  // Handle both array and single object
  const items = Array.isArray(data) ? data : [data];
  console.log(`  Found ${items.length} ${label}`);
  return items;
}

function writeJsonFile(filename, data) {
  const filePath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Wrote ${filename} (${data.length} entries)`);
}

function main() {
  console.log('Starting data aggregation...\n');

  ensureOutputDir();

  try {
    cloneRepo();

    // Read all data from cloned repo
    const items = readJsonFilesFromDir(path.join(TEMP_DIR, 'items'), 'items');
    const hideoutModules = readJsonFilesFromDir(path.join(TEMP_DIR, 'hideout'), 'hideout modules');
    const quests = readJsonFilesFromDir(path.join(TEMP_DIR, 'quests'), 'quests');
    const projects = readJsonFile(path.join(TEMP_DIR, 'projects.json'), 'projects');

    console.log('\nWriting aggregated files...');

    writeJsonFile('items.json', items);
    writeJsonFile('hideoutModules.json', hideoutModules);
    writeJsonFile('quests.json', quests);
    writeJsonFile('projects.json', projects);

    // Write metadata file with timestamp
    const metadata = {
      lastUpdated: new Date().toISOString(),
      counts: {
        items: items.length,
        hideoutModules: hideoutModules.length,
        quests: quests.length,
        projects: projects.length
      }
    };
    writeJsonFile('metadata.json', [metadata]);

    console.log('\nData aggregation complete!');
    console.log(`Total: ${items.length} items, ${hideoutModules.length} hideout modules, ${quests.length} quests, ${projects.length} projects`);

  } catch (error) {
    console.error('Error during aggregation:', error);
    process.exit(1);
  } finally {
    cleanupRepo();
  }
}

main();
