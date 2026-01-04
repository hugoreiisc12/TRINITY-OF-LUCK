
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ydsxnagsxvubszwkozxq.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlkc3huYWdzeHZ1YnN6d2tvenhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczMTM5NjIsImV4cCI6MjA4Mjg4OTk2Mn0.vX9YTpweS6Jdx5gAsmzdoEVMKe9r2N7RmxCmFhT-rFw";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkUser() {
  const email = "hugoreiis12@gmail.com";
  const password = "123456"; 

  console.log(`Verificando credenciais para: ${email}`);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error("❌ Falha na autenticação:", error.message);
    
    // Tentar com a senha original solicitada caso a de 6 caracteres falhe
    console.log("Tentando com a senha '12345'...");
    const { data: data2, error: error2 } = await supabase.auth.signInWithPassword({
        email,
        password: "12345"
    });
    
    if (error2) {
        console.error("❌ Falha na autenticação com senha curta:", error2.message);
    } else {
        console.log("✅ Usuário encontrado e logado com sucesso (senha: 12345)!");
        console.log("User ID:", data2.user?.id);
    }

  } else {
    console.log("✅ Usuário encontrado e logado com sucesso (senha: 123456)!");
    console.log("User ID:", data.user?.id);
    console.log("Metadata:", data.user?.user_metadata);
  }
}

checkUser();
