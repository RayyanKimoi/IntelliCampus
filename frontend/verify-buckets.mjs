/**
 * Supabase Storage Bucket Verification Script
 * 
 * This script checks if the required Supabase Storage buckets exist
 * and are properly configured.
 * 
 * Run with: node verify-buckets.mjs
 */

import { createClient } from '@supabase/supabase-js';

// Load environment variables
const SUPABASE_URL = 'https://kzjjyrqicmhyohgmsxhg.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6amp5cnFpY21oeW9oZ21zeGhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzk5MjcyNCwiZXhwIjoyMDQ5NTY4NzI0fQ.HXWiUDUxbLFvfVe_Fv0VFjlEfmWqM-YGZ4qONfSMfxg';

const requiredBuckets = [
  { name: 'guidelines', maxSize: 10 * 1024 * 1024, description: 'Teacher assignment documents' },
  { name: 'submissions', maxSize: 50 * 1024 * 1024, description: 'Student submission files' }
];

async function verifyBuckets() {
  console.log('🔍 Verifying Supabase Storage Buckets...\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  try {
    // List all buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError.message);
      return;
    }

    console.log(`✅ Connected to Supabase Storage\n`);
    console.log(`📦 Total buckets found: ${buckets.length}\n`);

    // Check each required bucket
    for (const required of requiredBuckets) {
      const bucket = buckets.find(b => b.name === required.name);
      
      if (bucket) {
        console.log(`✅ Bucket "${required.name}" exists`);
        console.log(`   - Public: ${bucket.public ? 'Yes' : 'No'}`);
        console.log(`   - Description: ${required.description}`);
        console.log(`   - Max Size: ${(required.maxSize / 1024 / 1024).toFixed(0)}MB`);
        console.log(`   - Created: ${new Date(bucket.created_at).toLocaleDateString()}\n`);
      } else {
        console.log(`❌ Bucket "${required.name}" does NOT exist`);
        console.log(`   - Description: ${required.description}`);
        console.log(`   - Expected Max Size: ${(required.maxSize / 1024 / 1024).toFixed(0)}MB\n`);
        console.log(`   📋 To create this bucket, run this SQL in Supabase SQL Editor:`);
        console.log(`   
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('${required.name}', '${required.name}', true, ${required.maxSize});
        `);
      }
    }

    // Test upload to guidelines bucket (if exists)
    const guidelinesBucket = buckets.find(b => b.name === 'guidelines');
    if (guidelinesBucket) {
      console.log('🧪 Testing upload to "guidelines" bucket...');
      const testContent = 'Test file content';
      const testFileName = `test-${Date.now()}.txt`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('guidelines')
        .upload(testFileName, testContent, {
          contentType: 'text/plain'
        });
      
      if (uploadError) {
        console.log(`   ❌ Upload test failed: ${uploadError.message}`);
      } else {
        console.log(`   ✅ Upload test successful!`);
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('guidelines')
          .getPublicUrl(testFileName);
        
        console.log(`   📎 Public URL: ${urlData.publicUrl}`);
        
        // Clean up test file
        await supabase.storage.from('guidelines').remove([testFileName]);
        console.log(`   🧹 Test file cleaned up\n`);
      }
    }

    // Summary
    const missingBuckets = requiredBuckets.filter(
      req => !buckets.find(b => b.name === req.name)
    );
    
    if (missingBuckets.length === 0) {
      console.log('🎉 All required buckets are configured correctly!');
      console.log('\n✅ You can now test file uploads using:');
      console.log('   - Open: http://localhost:3003/test-uploads.html');
      console.log('   - Or use the Assessment Studio in the app');
    } else {
      console.log(`⚠️  Missing ${missingBuckets.length} bucket(s): ${missingBuckets.map(b => b.name).join(', ')}`);
      console.log('\n📖 See SUPABASE_STORAGE_SETUP.md for detailed setup instructions');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

verifyBuckets();
