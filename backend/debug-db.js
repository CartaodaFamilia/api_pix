// backend/debug-db.js
const { Pool } = require('pg');

console.log('🐛 Debug detalhado da conexão...\n');

// Mostrar a connection string (sem senha)
const dbUrl = process.env.DATABASE_URL;
const maskedUrl = dbUrl ? dbUrl.replace(/:[^:@]+@/, ':****@') : 'Não configurada';
console.log('1. DATABASE_URL:', maskedUrl);

if (!dbUrl) {
  console.log('❌ DATABASE_URL não está definida');
  console.log('💡 Verifique o arquivo .env no backend');
  process.exit(1);
}

const pool = new Pool({
  connectionString: dbUrl,
  connectionTimeoutMillis: 5000,
});

async function debugDatabase() {
  try {
    console.log('\n2. 🔌 Testando conexão...');
    const client = await pool.connect();
    console.log('✅ Conexão estabelecida');

    console.log('\n3. 📋 Informações do servidor:');
    const version = await client.query('SELECT version()');
    console.log('   PostgreSQL:', version.rows[0].version.split(',')[0]);

    const dbInfo = await client.query('SELECT current_database(), current_user');
    console.log('   Banco:', dbInfo.rows[0].current_database);
    console.log('   Usuário:', dbInfo.rows[0].current_user);

    console.log('\n4. 🗃️ Verificando tabelas...');
    try {
      const tables = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      
      if (tables.rows.length > 0) {
        console.log('   Tabelas encontradas:');
        tables.rows.forEach(t => console.log('   -', t.table_name));
      } else {
        console.log('   ℹ️ Nenhuma tabela encontrada');
      }
    } catch (tableError) {
      console.log('   ❌ Erro ao listar tabelas:', tableError.message);
    }

    console.log('\n5. 👥 Verificando tabela clientes...');
    try {
      const clientes = await client.query('SELECT * FROM clientes');
      console.log(`   ✅ Tabela clientes existe`);
      console.log(`   📈 Total de registros: ${clientes.rows.length}`);
      
      if (clientes.rows.length > 0) {
        console.log('   Dados:');
        clientes.rows.forEach((c, i) => {
          console.log(`   ${i + 1}. ${c.name} (${c.email || 'sem email'})`);
        });
      }
    } catch (clientError) {
      console.log('   ❌ Tabela clientes não existe ou erro:', clientError.message);
    }

    client.release();
    console.log('\n🎉 Debug completo!');

  } catch (error) {
    console.error('\n💥 ERRO CRÍTICO:', error.message);
    
    if (error.code) {
      console.log('   Código do erro:', error.code);
    }
    
    if (error.code === '28P01') {
      console.log('   💡 Senha incorreta para o usuário postgres');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('   💡 PostgreSQL não está rodando na porta 5432');
    } else if (error.code === '3D000') {
      console.log('   💡 Banco de dados "pix_automatico" não existe');
    } else if (error.code === 'ENOTFOUND') {
      console.log('   💡 Não conseguiu encontrar localhost');
    }
  } finally {
    await pool.end();
  }
}

debugDatabase();