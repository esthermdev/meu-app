#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const migrationsDir = path.join(root, 'supabase', 'migrations');

function formatTimestamp(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

function slugify(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

const args = process.argv.slice(2);
const nameArg = args.join(' ').trim();

if (!nameArg) {
  console.error('Usage: npm run migration:new -- <migration_name>');
  console.error('Example: npm run migration:new -- add_roles_table');
  process.exit(1);
}

const safeName = slugify(nameArg);

if (!safeName) {
  console.error('Migration name must contain at least one letter or number.');
  process.exit(1);
}

const timestamp = formatTimestamp(new Date());
const filename = `${timestamp}_${safeName}.sql`;
const filePath = path.join(migrationsDir, filename);

fs.mkdirSync(migrationsDir, { recursive: true });

if (fs.existsSync(filePath)) {
  console.error(`Migration already exists: ${filePath}`);
  process.exit(1);
}

const template = `-- Migration: ${safeName}\n-- Created at: ${new Date().toISOString()}\n\n`;
fs.writeFileSync(filePath, template, 'utf8');

console.log(`Created migration: ${path.relative(root, filePath)}`);
