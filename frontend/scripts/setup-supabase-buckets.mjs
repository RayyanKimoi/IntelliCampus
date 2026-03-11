#!/usr/bin/env node

/**
 * Setup Supabase Storage Buckets
 * 
 * This script creates the necessary storage buckets and sets up proper policies
 * for file uploads in the IntelliCampus application.
 * 
 * Run: node scripts/setup-supabase-buckets.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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

async function setupBuckets() {
  console.log('🚀 Setting up Supabase Storage buckets...\n');

  const buckets = [
    {
      name: 'course-materials',
      public: true,
      description: 'Course PDFs, documents, and learning materials',
    },
    {
      name: 'assignments',
      public: false,
      description: 'Student assignment submissions',
    },
    {
      name: 'profile-pictures',
      public: true,
      description: 'User profile pictures',
    },
  ];

  for (const bucket of buckets) {
    console.log(`📦 Checking bucket: ${bucket.name}...`);

    // Check if bucket exists
    const { data: existingBuckets } = await supabase.storage.listBuckets();
    const exists = existingBuckets?.some((b) => b.name === bucket.name);

    if (!exists) {
      console.log(`   Creating bucket: ${bucket.name}...`);
      const { data, error } = await supabase.storage.createBucket(bucket.name, {
        public: bucket.public,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
        ],
      });

      if (error) {
        console.error(`   ❌ Failed to create bucket ${bucket.name}:`, error.message);
      } else {
        console.log(`   ✅ Created bucket: ${bucket.name}`);
      }
    } else {
      console.log(`   ✅ Bucket ${bucket.name} already exists`);
    }
  }

  console.log('\n✅ Bucket setup complete!');
  console.log('\n📝 Note: Make sure to configure bucket policies in Supabase Dashboard:');
  console.log('   1. Go to Storage > Policies');
  console.log('   2. Add policies for authenticated users to upload/read files');
}

setupBuckets().catch((error) => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});
