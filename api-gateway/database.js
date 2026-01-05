/**
 * Database Schema Configuration for Trinity of Luck MVP
 * Este arquivo gerencia a inicialização e verificação das tabelas do Supabase
 */

import { supabaseAdmin } from './server.js';

/**
 * Definição das tabelas do MVP
 */
const TABLES_SCHEMA = {
  // Tabela de Usuários
  usuarios: {
    name: 'usuarios',
    columns: [
      { name: 'id', type: 'uuid', primaryKey: true, default: 'uuid_generate_v4()' },
      { name: 'email', type: 'text', unique: true, notNull: true },
      { name: 'perfil', type: 'jsonb', default: '{}' },
      { name: 'created_at', type: 'timestamp', notNull: true, default: 'now()' },
      { name: 'updated_at', type: 'timestamp', notNull: true, default: 'now()' },
    ],
    indexes: [
      { columns: ['email'], name: 'idx_usuarios_email' },
      { columns: ['created_at'], name: 'idx_usuarios_created_at' },
    ],
  },

  // Tabela de Contextos
  contextos: {
    name: 'contextos',
    columns: [
      { name: 'id', type: 'uuid', primaryKey: true, default: 'uuid_generate_v4()' },
      { name: 'user_id', type: 'uuid', notNull: true, foreignKey: 'usuarios(id)' },
      { name: 'url', type: 'text', notNull: true },
      { name: 'eventos', type: 'jsonb', default: '[]' },
      { name: 'variaveis', type: 'jsonb', default: '{}' },
      { name: 'created_at', type: 'timestamp', notNull: true, default: 'now()' },
      { name: 'updated_at', type: 'timestamp', notNull: true, default: 'now()' },
    ],
    indexes: [
      { columns: ['user_id'], name: 'idx_contextos_user_id' },
      { columns: ['created_at'], name: 'idx_contextos_created_at' },
      { columns: ['user_id', 'created_at'], name: 'idx_contextos_user_created' },
    ],
  },

  // Tabela de Plataformas
  plataformas: {
    name: 'plataformas',
    columns: [
      { name: 'id', type: 'uuid', primaryKey: true, default: 'uuid_generate_v4()' },
      { name: 'nome', type: 'text', notNull: true, unique: true },
      { name: 'descricao', type: 'text' },
      { name: 'api_endpoint', type: 'text' },
      { name: 'suportado', type: 'boolean', default: true },
      { name: 'created_at', type: 'timestamp', notNull: true, default: 'now()' },
      { name: 'updated_at', type: 'timestamp', notNull: true, default: 'now()' },
    ],
    indexes: [
      { columns: ['nome'], name: 'idx_plataformas_nome' },
      { columns: ['suportado'], name: 'idx_plataformas_suportado' },
    ],
  },

  // Tabela de Planos
  planos: {
    name: 'planos',
    columns: [
      { name: 'id', type: 'uuid', primaryKey: true, default: 'uuid_generate_v4()' },
      { name: 'nome', type: 'text', notNull: true, unique: true },
      { name: 'preco', type: 'numeric', notNull: true },
      { name: 'recursos', type: 'jsonb', default: '{}' },
      { name: 'ativo', type: 'boolean', default: true },
      { name: 'created_at', type: 'timestamp', notNull: true, default: 'now()' },
      { name: 'updated_at', type: 'timestamp', notNull: true, default: 'now()' },
    ],
    indexes: [
      { columns: ['ativo'], name: 'idx_planos_ativo' },
    ],
  },

  // Tabela de Assinaturas
  assinaturas: {
    name: 'assinaturas',
    columns: [
      { name: 'id', type: 'uuid', primaryKey: true, default: 'uuid_generate_v4()' },
      { name: 'user_id', type: 'uuid', notNull: true, foreignKey: 'usuarios(id)' },
      { name: 'plan_id', type: 'uuid', notNull: true, foreignKey: 'planos(id)' },
      { name: 'status', type: 'text', notNull: true, default: "'ativa'" },
      { name: 'data_inicio', type: 'timestamp', notNull: true, default: 'now()' },
      { name: 'data_fim', type: 'timestamp' },
      { name: 'created_at', type: 'timestamp', notNull: true, default: 'now()' },
      { name: 'updated_at', type: 'timestamp', notNull: true, default: 'now()' },
    ],
    indexes: [
      { columns: ['user_id'], name: 'idx_assinaturas_user_id' },
      { columns: ['plan_id'], name: 'idx_assinaturas_plan_id' },
      { columns: ['status'], name: 'idx_assinaturas_status' },
      { columns: ['created_at'], name: 'idx_assinaturas_created_at' },
      { columns: ['user_id', 'created_at'], name: 'idx_assinaturas_user_created' },
    ],
  },

  // Tabela de Análises
  analises: {
    name: 'analises',
    columns: [
      { name: 'id', type: 'uuid', primaryKey: true, default: 'uuid_generate_v4()' },
      { name: 'user_id', type: 'uuid', notNull: true, foreignKey: 'usuarios(id)' },
      { name: 'context_id', type: 'uuid', notNull: true, foreignKey: 'contextos(id)' },
      { name: 'resultados', type: 'jsonb', default: '{}' },
      { name: 'status', type: 'text', default: "'concluida'" },
      { name: 'created_at', type: 'timestamp', notNull: true, default: 'now()' },
      { name: 'updated_at', type: 'timestamp', notNull: true, default: 'now()' },
    ],
    indexes: [
      { columns: ['user_id'], name: 'idx_analises_user_id' },
      { columns: ['context_id'], name: 'idx_analises_context_id' },
      { columns: ['status'], name: 'idx_analises_status' },
      { columns: ['created_at'], name: 'idx_analises_created_at' },
      { columns: ['user_id', 'created_at'], name: 'idx_analises_user_created' },
    ],
  },

  // Tabela de Feedbacks
  feedbacks: {
    name: 'feedbacks',
    columns: [
      { name: 'id', type: 'uuid', primaryKey: true, default: 'uuid_generate_v4()' },
      { name: 'analysis_id', type: 'uuid', notNull: true, foreignKey: 'analises(id)' },
      { name: 'resultado', type: 'text', notNull: true },
      { name: 'comentario', type: 'text' },
      { name: 'created_at', type: 'timestamp', notNull: true, default: 'now()' },
      { name: 'updated_at', type: 'timestamp', notNull: true, default: 'now()' },
    ],
    indexes: [
      { columns: ['analysis_id'], name: 'idx_feedbacks_analysis_id' },
      { columns: ['created_at'], name: 'idx_feedbacks_created_at' },
    ],
  },
};

/**
 * Inicializar o banco de dados
 */
export const initializeDatabase = async () => {
  if (!supabaseAdmin) {
    console.warn('⚠️  Supabase Admin client not available. Database initialization skipped.');
    return false;
  }

  try {
    console.log('🔍 Verificando esquema do banco de dados...');

    for (const [tableKey, tableConfig] of Object.entries(TABLES_SCHEMA)) {
      await ensureTableExists(tableConfig);
      await ensureIndexesExist(tableConfig);
    }

    console.log('✅ Esquema do banco de dados verificado com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error.message);
    return false;
  }
};

/**
 * Verificar e criar tabela se não existir
 */
async function ensureTableExists(tableConfig) {
  const { name: tableName, columns } = tableConfig;

  try {
    // Tentar fazer uma query simples para verificar se a tabela existe
    const { data, error } = await supabaseAdmin
      .from(tableName)
      .select('count')
      .limit(1);

    if (!error) {
      console.log(`  ✅ Tabela '${tableName}' já existe`);
      return true;
    }

    // Se a tabela não existe, criar
    if (error?.code === 'PGRST116') {
      console.log(`  📝 Criando tabela '${tableName}'...`);

      // Construir SQL CREATE TABLE
      const createTableSQL = buildCreateTableSQL(tableConfig);

      // Executar SQL através do admin client
      const { error: createError } = await supabaseAdmin.rpc('exec', {
        sql: createTableSQL,
      });

      if (createError) {
        // Alternativa: usar SQL direto (pode exigir permissão especial)
        console.warn(
          `  ⚠️  Não foi possível criar tabela automaticamente: ${createError.message}`
        );
        console.log(
          `  📋 SQL para criar manualmente:\n${createTableSQL}`
        );
        return false;
      }

      console.log(`  ✅ Tabela '${tableName}' criada com sucesso`);
      return true;
    }

    throw error;
  } catch (error) {
    console.error(`  ❌ Erro ao verificar tabela '${tableName}':`, error.message);
    return false;
  }
}

/**
 * Construir SQL CREATE TABLE
 */
function buildCreateTableSQL(tableConfig) {
  const { name, columns } = tableConfig;

  const columnDefinitions = columns.map(col => {
    let def = `${col.name} ${col.type}`;

    if (col.primaryKey) def += ' PRIMARY KEY';
    if (col.unique) def += ' UNIQUE';
    if (col.notNull) def += ' NOT NULL';
    if (col.default) def += ` DEFAULT ${col.default}`;

    return def;
  });

  // Adicionar foreign keys
  const foreignKeys = columns
    .filter(col => col.foreignKey)
    .map(col => {
      const [refTable, refColumn] = col.foreignKey.split('(');
      return `FOREIGN KEY (${col.name}) REFERENCES ${refTable}(${refColumn}`;
    });

  const allConstraints = [...columnDefinitions, ...foreignKeys];

  return `
    CREATE TABLE IF NOT EXISTS ${name} (
      ${allConstraints.join(',\n      ')}
    );
  `;
}

/**
 * Verificar e criar índices
 */
async function ensureIndexesExist(tableConfig) {
  const { name: tableName, indexes } = tableConfig;

  if (!indexes || indexes.length === 0) {
    return;
  }

  try {
    for (const index of indexes) {
      const { columns, name: indexName } = index;
      const columnList = columns.join(', ');

      const createIndexSQL = `
        CREATE INDEX IF NOT EXISTS ${indexName}
        ON ${tableName} (${columnList});
      `;

      console.log(
        `  📊 Criando índice '${indexName}' em ${tableName}(${columnList})`
      );

      // Executar SQL através do admin client
      const { error } = await supabaseAdmin.rpc('exec', {
        sql: createIndexSQL,
      });

      if (!error) {
        console.log(`  ✅ Índice '${indexName}' verificado/criado`);
      } else {
        // Índice pode já existir, não é crítico
        console.log(`  ℹ️  Índice '${indexName}' já existe ou não pôde ser criado`);
      }
    }
  } catch (error) {
    console.warn(
      `  ⚠️  Erro ao criar índices para '${tableName}':`,
      error.message
    );
  }
}

/**
 * Verificar estrutura das tabelas
 */
export const verifyDatabaseSchema = async () => {
  if (!supabaseAdmin) {
    return null;
  }

  try {
    const schema = {};

    for (const [tableKey, tableConfig] of Object.entries(TABLES_SCHEMA)) {
      const { data, error } = await supabaseAdmin
        .from(tableConfig.name)
        .select('*')
        .limit(0);

      schema[tableConfig.name] = {
        exists: !error,
        error: error?.message || null,
      };
    }

    return schema;
  } catch (error) {
    console.error('Erro ao verificar schema:', error);
    return null;
  }
};

/**
 * Seed de dados iniciais
 */
export const seedInitialData = async () => {
  if (!supabaseAdmin) {
    return false;
  }

  try {
    console.log('🌱 Seedando dados iniciais...');

    // Seed de plataformas
    const { count: platformCount, error: platformError } = await supabaseAdmin
      .from('plataformas')
      .select('count', { count: 'exact', head: true });

    if (platformCount === 0) {
      const platforms = [
        {
          nome: 'Instagram',
          descricao: 'Plataforma de rede social visual',
          api_endpoint: 'https://api.instagram.com',
          suportado: true,
        },
        {
          nome: 'TikTok',
          descricao: 'Plataforma de vídeos curtos',
          api_endpoint: 'https://api.tiktok.com',
          suportado: true,
        },
        {
          nome: 'Twitter',
          descricao: 'Plataforma de microblog',
          api_endpoint: 'https://api.twitter.com',
          suportado: true,
        },
        {
          nome: 'YouTube',
          descricao: 'Plataforma de vídeos',
          api_endpoint: 'https://api.youtube.com',
          suportado: true,
        },
      ];

      await supabaseAdmin.from('plataformas').insert(platforms);
      console.log('  ✅ Plataformas inseridas');
    }

    // Seed de planos
    const { count: planCount, error: planError } = await supabaseAdmin
      .from('planos')
      .select('count', { count: 'exact', head: true });

    if (planCount === 0) {
      const plans = [
        {
          nome: 'Básico',
          preco: 9.99,
          recursos: {
            analises_por_mes: 10,
            contextos: 3,
            suporte: 'email',
          },
          ativo: true,
        },
        {
          nome: 'Profissional',
          preco: 29.99,
          recursos: {
            analises_por_mes: 100,
            contextos: 20,
            suporte: 'prioritario',
            relatorios: true,
          },
          ativo: true,
        },
        {
          nome: 'Enterprise',
          preco: 99.99,
          recursos: {
            analises_por_mes: -1,
            contextos: -1,
            suporte: '24/7',
            relatorios: true,
            api_acesso: true,
          },
          ativo: true,
        },
      ];

      await supabaseAdmin.from('planos').insert(plans);
      console.log('  ✅ Planos inseridos');
    }

    console.log('✅ Dados iniciais seedados com sucesso');
    return true;
  } catch (error) {
    console.warn('⚠️  Erro ao seedar dados iniciais:', error.message);
    return false;
  }
};

export default {
  initializeDatabase,
  verifyDatabaseSchema,
  seedInitialData,
  TABLES_SCHEMA,
};
