import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hydjpzwcubhieavqmifs.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5ZGpwendjdWJoaWVhdnFtaWZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2ODk1NTQsImV4cCI6MjA2NzI2NTU1NH0.2VhMb9AB6hfRPbz_mU_QthvouKGSfVGA5ao8yfsWAVQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
