// backend/verify-table.js
require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');

async function verifyTable() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log('🔍 Verificando tabela clientes...');
    
    // Verificar se a tabela existe
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'clientes'
      );
    `);
    
    console.log('   Tabela clientes existe:', tableExists.rows[0].exists);
    
    if (tableExists.rows[0].exists) {
      // Verificar estrutura
      const structure = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'clientes'
        ORDER BY ordinal_position;
      `);
      
      console.log('\n🏗️  Estrutura da tabela:');
      structure.rows.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type}, ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
      });
      
      // Verificar dados
      const data = await pool.query('SELECT * FROM clientes;');
      console.log(`\n📊 Dados na tabela: ${data.rows.length} clientes`);
      data.rows.forEach((client, i) => {
        console.log(`   ${i + 1}. ${client.name} - ${client.email} - ${client.cpf}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

verifyTable();