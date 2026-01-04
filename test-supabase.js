
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url';

// Configurar __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar .env manualmente para garantir que estamos lendo o arquivo correto
dotenv.config({ path: path.resolve(__dirname, '.env') })

// Função para limpar aspas se existirem (mesma lógica que tentei aplicar no front)
const cleanEnv = (val) => val ? val.replace(/"/g, '').trim() : '';

const supabaseUrl = cleanEnv(process.env.VITE_SUPABASE_URL);
const supabaseKey = cleanEnv(process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

console.log('Testing Supabase Connection...');
console.log('URL:', supabaseUrl);
console.log('Key (first 10 chars):', supabaseKey ? supabaseKey.substring(0, 10) + '...' : 'undefined');

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing URL or Key in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Tentar uma operação simples que não requer auth, ou apenas verificar se o cliente inicializa
    // Normalmente, apenas inicializar não lança erro, precisamos fazer uma chamada.
    // Vamos tentar pegar a sessão, que deve retornar null mas não erro de API Key inválida se a chave for válida (anon key).
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Connection Failed:', error.message);
      // Se a mensagem for sobre API Key inválida, saberemos.
    } else {
      console.log('Connection Successful! Session data retrieved (even if null).');
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testConnection();
