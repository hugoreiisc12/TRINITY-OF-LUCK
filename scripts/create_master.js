
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ydsxnagsxvubszwkozxq.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlkc3huYWdzeHZ1YnN6d2tvenhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczMTM5NjIsImV4cCI6MjA4Mjg4OTk2Mn0.vX9YTpweS6Jdx5gAsmzdoEVMKe9r2N7RmxCmFhT-rFw";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function createMasterUser() {
  const email = "hugoreiis12@gmail.com";
  const password = "12345"; // Supabase might require 6 chars, let's try.

  console.log(`Tentando criar usuário: ${email}`);

  // Primeiro tentamos fazer login para ver se já existe
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (loginData.session) {
    console.log("Usuário já existe e login funcionou.");
    return;
  }

  // Se login falhar, tentamos criar
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: "Hugo",
        last_name: "Reis",
        is_master: true // Adicionando flag de master
      }
    }
  });

  if (error) {
    console.error("Erro ao criar usuário:", error.message);
    if (error.message.includes("Password should be at least 6 characters")) {
        console.log("Tentando novamente com senha ajustada (123456)...");
        const { data: retryData, error: retryError } = await supabase.auth.signUp({
            email,
            password: "123456",
            options: {
              data: {
                first_name: "Hugo",
                last_name: "Reis",
                is_master: true
              }
            }
        });
        if (retryError) {
            console.error("Erro na segunda tentativa:", retryError.message);
        } else {
            console.log("Usuário criado com sucesso na segunda tentativa (senha 123456)!");
        }
    }
  } else {
    console.log("Usuário criado com sucesso!");
    console.log("ID:", data.user?.id);
  }
}

createMasterUser();
