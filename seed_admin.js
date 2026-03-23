import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  "https://txdwqbzqronkxbcjfena.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4ZHdxYnpxcm9ua3hiY2pmZW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MTA5ODYsImV4cCI6MjA4ODQ4Njk4Nn0.UKbNEWgU1SjCeDg3k8mXo64BSCOYPZwCR3Knm-Lnehs"
);

async function createAdmin() {
  const { data, error } = await supabase.auth.signUp({
    email: 'arun@gmail.com',
    password: 'arun123',
  });
  console.log("Signup:", data.user ? data.user.id : "No user", error ? error.message : "Success");
}
createAdmin();
