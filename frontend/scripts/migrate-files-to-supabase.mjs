#!/usr/bin/env node

/**
 * Migrate Local Files to Supabase Storage
 * 
 * This script migrates existing files from the local /public/uploads directory
 * to Supabase Storage and updates the database records with new URLs.
 * 
 * Run: node scripts/migrate-files-to-supabase.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file manually
const envPath = join(__dirname, '..', '.env');
const envFile = readFileSync(envPath, 'utf-8');
const envVars = {};

envFile.split('\n').forEach(line => {
  const match = line.match(/^([A-Z_]+)=["']?(.+?)["']?$/);
  if (match) {
    envVars[match[1]] = match[2];
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const prisma = new PrismaClient();

const uploadsDir = join(__dirname, '..', 'public', 'uploads');

async function migrateFiles() {
  console.log('🚀 Starting file migration to Supabase Storage...\n');

  try {
    // Check if uploads directory exists
    try {
      statSync(uploadsDir);
    } catch {
      console.log('ℹ️  No local uploads directory found. Nothing to migrate.');
      return;
    }

    // Get all files in uploads directory
    const files = readdirSync(uploadsDir).filter(f => {
      const stat = statSync(join(uploadsDir, f));
      return stat.isFile();
    });

    if (files.length === 0) {
      console.log('ℹ️  No files to migrate.');
      return;
    }

    console.log(`📦 Found ${files.length} files to migrate\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const fileName of files) {
      const filePath = join(uploadsDir, fileName);
      const localUrl = `/uploads/${fileName}`;

      console.log(`📄 Migrating: ${fileName}...`);

      try {
        // Read file
        const fileBuffer = readFileSync(filePath);
        const mimeType = getMimeType(fileName);

        // Upload to Supabase
        const supabasePath = `migrated/${fileName}`;
        const { data, error } = await supabase.storage
          .from('course-materials')
          .upload(supabasePath, fileBuffer, {
            contentType: mimeType,
            upsert: true,
          });

        if (error) {
          throw error;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('course-materials')
          .getPublicUrl(supabasePath);

        const newUrl = urlData.publicUrl;

        // Update database records
        const updateResult = await prisma.chapterContent.updateMany({
          where: { fileUrl: localUrl },
          data: { fileUrl: newUrl },
        });

        console.log(`   ✅ Migrated successfully (${updateResult.count} DB records updated)`);
        successCount++;
      } catch (error) {
        console.error(`   ❌ Failed:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log(`   📁 Total: ${files.length}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

function getMimeType(fileName) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const mimeTypes = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

migrateFiles().catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
