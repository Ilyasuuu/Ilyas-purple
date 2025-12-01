
import { createClient } from '@supabase/supabase-js';

// Safe access to environment variables to handle different runtimes
const getEnvVar = (key: string) => {
  try {
    // Check Vite/ESM environment
    if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
      return (import.meta as any).env[key];
    }
    // Check Node/Webpack environment
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {
    console.warn('Error reading env var:', key);
  }
  return undefined;
};

// Use Env Vars if available, otherwise fall back to the provided keys
const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || 'https://suaexesejamcmdhhpuwo.supabase.co';
const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1YWV4ZXNlamFtY21kaGhwdXdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNDExNzYsImV4cCI6MjA3OTkxNzE3Nn0.-_2JctRs9-yLhTfpq9PuUL9O8X4EmxnAQVYDvnLfks0';

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase credentials missing. App may not function correctly.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
