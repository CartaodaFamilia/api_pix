// backend/src/routes/clients.ts - VERSÃO COMPLETA
import { router, publicProcedure } from '../lib/trpc';
import { z } from 'zod';
import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

const createClientSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido").optional().or(z.literal('')),
  cpf: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
});

export const clientsRouter = router({
  create: publicProcedure
    .input(createClientSchema)
    .mutation(async ({ input }) => {
      try {
        console.log('📝 Criando cliente:', input);
        
        const result = await db.execute(sql`
          INSERT INTO clientes (name, email, cpf, phone) 
          VALUES (${input.name}, ${input.email?.trim() || null}, ${input.cpf?.trim() || null}, ${input.phone?.trim() || null}) 
          RETURNING *
        `);

        console.log('✅ Cliente criado:', result.rows[0]);
        return result.rows[0];
      } catch (error: any) {
        console.error('❌ Erro ao criar cliente:', error);
        throw new Error(`Falha ao criar cliente: ${error.message}`);
      }
    }),
    
  list: publicProcedure.query(async () => {
    try {
      console.log('📋 Buscando clientes...');
      const result = await db.execute(sql`SELECT * FROM clientes ORDER BY id`);
      console.log(`✅ ${result.rows.length} clientes encontrados`);
      return result.rows;
    } catch (error: any) {
      console.error('❌ Erro ao buscar clientes:', error);
      throw new Error(`Falha ao carregar clientes: ${error.message}`);
    }
  }),

  // 🔍 ADICIONAR ESTE PROCEDIMENTO - getById
 // 🔍 PROCEDIMENTO getById CORRIGIDO
getById: publicProcedure
  .input(z.object({ 
    id: z.number()
  }))
  .query(async ({ input }) => {
    try {
      console.log(`🔍 Buscando cliente com ID: ${input.id}`);
      
      const result = await db.execute(sql`
        SELECT * FROM clientes WHERE id = ${input.id}
      `);

      console.log('🔍 Resultado da busca:', result.rows);

      if (result.rows.length === 0) {
        console.log(`❌ Cliente com ID ${input.id} não encontrado`);
        throw new Error('Cliente não encontrado');
      }

      const client = result.rows[0];
      console.log(`✅ Cliente encontrado:`, client);
      return client;
    } catch (error: any) {
      console.error('❌ Erro ao buscar cliente:', error);
      throw new Error(`Falha ao buscar cliente: ${error.message}`);
    }
  }),
});