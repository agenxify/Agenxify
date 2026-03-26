import * as dotenv from 'dotenv';
dotenv.config();
console.log("SUPABASE_ACCESS_TOKEN:", process.env.SUPABASE_ACCESS_TOKEN ? "Exists" : "Missing");
