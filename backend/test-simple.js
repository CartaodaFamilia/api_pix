// backend/test-simple.js
require('dotenv').config({ path: '.env' });

console.log('🔧 Verificando .env...');
console.log('DATABASE_URL:', process.env.DATABASE_URL);

const { Pool } = require('pg');

// Testar diferentes senhas
const passwords = ['1234', 'postgres', 'password', ''];

async function testWithPassword(password) {
  const maskedUrl = process.env.DATABASE_URL.replace(/:[^:@]+@/, `:${password ? '****' : ''}@`);
  console.log(`\n🔑 Testando com senha: ${password ? '****' : '(vazia)'}`);
  console.log(`   URL: ${maskedUrl}`);
  
  const testUrl = process.env.DATABASE_URL.replace(/:[^:@]+@/, `:${password}@`);
  const pool = new Pool({ connectionString: testUrl });

  try {
    await pool.query('SELECT 1');
    console.log('   ✅ CONECTADO! Senha correta encontrada!');
    await pool.end();
    return true;
  } catch (error) {
    console.log('   ❌ Falhou:', error.message);
    await pool.end();
    return false;
  }
}

async function findPassword() {
  for (const pwd of passwords) {
    if (await testWithPassword(pwd)) {
      console.log(`\n🎉 Use esta senha no .env: "${pwd}"`);
      return pwd;
    }
  }
  console.log('\n❌ Nenhuma senha funcionou.');
}

findPassword();