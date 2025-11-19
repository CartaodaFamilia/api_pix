import { router, publicProcedure } from '../lib/trpc';
import { z } from 'zod';
import { db } from '../lib/db';
import { sql } from 'drizzle-orm';
import { recurrences } from '../models/schema';
import { createSantanderRecurrence } from '../lib/santander';

// Esquema de validação para a criação de recorrência
const createRecurrenceSchema = z.object({
  clientId: z.number(),
  amount: z.number(),
  frequency: z.string(), // MONTHLY, WEEKLY, etc.
  startDate: z.string(), // Data de início
  endDate: z.string().optional(), // Data de fim (opcional)
  description: z.string().optional(), // Objeto/Descrição da recorrência
  // Campos específicos para a API do Santander
  contract: z.string(), // Número do contrato
  cpfCnpj: z.string(), // CPF/CNPJ do devedor
  name: z.string(), // Nome do devedor
  dataInicial: z.string(), // Data inicial do ciclo de recorrência (AAAA-MM-DD)
  periodicidade: z.string(), // Periodicidade (SEMANAL, MENSAL, TRIMESTRAL, SEMESTRAL, ANUAL)
  valorRec: z.number().optional(), // Valor da recorrência (opcional, se for valor fixo)
  valorMinimoRecebedor: z.number().optional(), // Valor mínimo (opcional, se for valor variável)
  politicaRetentativa: z.string(), // Política de retentativa (NAO_PERMITE, PERMITE_3R_7D)
  locId: z.string().optional(), // ID da Location (obrigatório para Jornada 2, 3 e 4)
  ativacao: z.boolean(), // Ativação imediata
  dadosJornada: z.string().optional(), // Dados da jornada (opcional)
  txid: z.string().optional(), // Txid (opcional)
  convenio: z.string().optional(), // Número do convênio (opcional)
  // Campos adicionais para o frontend
  jornada: z.string(), // Jornada de Pagamento (jornada2, jornada3, jornada4)
});

export const recurrencesRouter = router({
  create: publicProcedure
    .input(createRecurrenceSchema)
    .mutation(async ({ input }) => {
      try {
        // 1. Preparar payload para a API do Santander
        const santanderPayload = {
          vinculo: {
            contrato: input.contract,
            devedor: {
              cpfCnpj: input.cpfCnpj,
              nome: input.name,
            },
            objeto: input.description,
          },
          calendario: {
            dataInicial: input.dataInicial,
            dataFinal: input.endDate, // Opcional
            periodicidade: input.periodicidade,
          },
          valor: {
            valorRec: input.valorRec, // Opcional
            valorMinimoRecebedor: input.valorMinimoRecebedor, // Opcional
          },
          politicaRetentativa: input.politicaRetentativa,
          loc: {
            id: input.locId, // Opcional
            ativacao: input.ativacao,
          },
          dadosJornada: input.dadosJornada, // Opcional
          txid: input.txid, // Opcional
          convenio: input.convenio, // Opcional
        };

        // 2. Chamar a API do Santander para criar a recorrência
        const santanderResponse = await createSantanderRecurrence(santanderPayload);
        const santanderRecurrenceId = santanderResponse.idRec;
        const locationUrl = santanderResponse.location;
        
        // 3. Salvar no banco de dados
        const [newRecurrence] = await db.insert(recurrences).values({
          clientId: input.clientId,
          amount: input.amount.toString(),
          frequency: input.frequency,
          startDate: new Date(input.startDate),
          endDate: input.endDate ? new Date(input.endDate) : null,
          status: 'PENDING_APPROVAL', // Status inicial
          santanderRecurrenceId: santanderRecurrenceId,
          locationUrl: locationUrl,
        }).returning();

        // 4. Lógica de geração de QR Code (Jornada 2, 3 ou 4)
        let qrCodeUrl = null;
        if (input.jornada === 'jornada2' || input.jornada === 'jornada3' || input.jornada === 'jornada4') {
          qrCodeUrl = locationUrl;
        }

        return {
          recurrence: newRecurrence,
          qrCodeUrl: qrCodeUrl,
        };
      } catch (error) {
        console.error('❌ Erro ao criar recorrência:', error);
        throw new Error('Falha ao criar recorrência.');
      }
    }),

  list: publicProcedure
    .query(async () => {
      try {
        const result = await db.execute(sql`
          SELECT 
            recurrences.id, 
            recurrences.status, 
            recurrences.created_at, 
            clientes.name as client_name,
            recurrences.amount,
            recurrences.frequency,
            recurrences.start_date,
            recurrences.end_date,
            recurrences.santander_recurrence_id,
            recurrences.location_url
          FROM recurrences
          JOIN clientes ON recurrences.client_id = clientes.id
          ORDER BY recurrences.created_at DESC
        `);
        return result.rows;
      } catch (error) {
        console.error('❌ Erro ao listar recorrências:', error);
        throw new Error('Falha ao carregar recorrências.');
      }
    }),

  listLatest: publicProcedure
    .query(async () => {
      try {
        const result = await db.execute(sql`
          SELECT 
            recurrences.id, 
            recurrences.status, 
            recurrences.created_at, 
            clientes.name as client_name,
            recurrences.amount
          FROM recurrences
          JOIN clientes ON recurrences.client_id = clientes.id
          ORDER BY recurrences.created_at DESC
          LIMIT 5
        `);
        return result.rows;
      } catch (error) {
        console.error('❌ Erro ao listar últimas recorrências:', error);
        throw new Error('Falha ao carregar últimas recorrências.');
      }
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      try {
        const result = await db.execute(sql`
          SELECT 
            recurrences.*,
            clientes.name as client_name,
            clientes.email as client_email,
            clientes.phone as client_phone
          FROM recurrences
          JOIN clientes ON recurrences.client_id = clientes.id
          WHERE recurrences.id = ${input.id}
        `);
        
        if (result.rows.length === 0) {
          throw new Error('Recorrência não encontrada.');
        }

        return result.rows[0];
      } catch (error) {
        console.error('❌ Erro ao buscar recorrência:', error);
        throw new Error('Falha ao carregar recorrência.');
      }
    }),

  updateStatus: publicProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(['PENDING_APPROVAL', 'ACTIVE', 'PAUSED', 'CANCELLED', 'EXPIRED'])
    }))
    .mutation(async ({ input }) => {
      try {
        const [updatedRecurrence] = await db.update(recurrences)
          .set({ 
            status: input.status
          })
          .where(sql`id = ${input.id}`)
          .returning();

        // atualiza o timestamp em uma query separada para usar a coluna real do banco
        await db.execute(sql`UPDATE recurrences SET updated_at = ${new Date()} WHERE id = ${input.id}`);

        if (!updatedRecurrence) {
          throw new Error('Recorrência não encontrada.');
        }

        return updatedRecurrence;
      } catch (error) {
        console.error('❌ Erro ao atualizar status da recorrência:', error);
        throw new Error('Falha ao atualizar recorrência.');
      }
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const [deletedRecurrence] = await db.delete(recurrences)
          .where(sql`id = ${input.id}`)
          .returning();

        if (!deletedRecurrence) {
          throw new Error('Recorrência não encontrada.');
        }

        return { success: true, message: 'Recorrência deletada com sucesso.' };
      } catch (error) {
        console.error('❌ Erro ao deletar recorrência:', error);
        throw new Error('Falha ao deletar recorrência.');
      }
    }),

  getByClientId: publicProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ input }) => {
      try {
        const result = await db.execute(sql`
          SELECT 
            recurrences.id,
            recurrences.amount,
            recurrences.frequency,
            recurrences.status,
            recurrences.start_date,
            recurrences.end_date,
            recurrences.created_at
          FROM recurrences
          WHERE recurrences.client_id = ${input.clientId}
          ORDER BY recurrences.created_at DESC
        `);
        
        return result.rows;
      } catch (error) {
        console.error('❌ Erro ao buscar recorrências do cliente:', error);
        throw new Error('Falha ao carregar recorrências do cliente.');
      }
    }),

 getStatistics: publicProcedure
  .query(async () => {
    try {
      const totalResult = await db.execute(sql`
        SELECT COUNT(*) as total FROM recurrences
      `);
      
      const activeResult = await db.execute(sql`
        SELECT COUNT(*) as active FROM recurrences WHERE status = 'ACTIVE'
      `);
      
      const revenueResult = await db.execute(sql`
        SELECT SUM(CAST(amount AS DECIMAL)) as total_revenue 
        FROM recurrences 
        WHERE status = 'ACTIVE'
      `);

      // Converter os resultados com type safety
      const total = parseInt(String(totalResult.rows[0]?.total || '0'));
      const active = parseInt(String(activeResult.rows[0]?.active || '0'));
      const totalRevenue = parseFloat(String(revenueResult.rows[0]?.total_revenue || '0'));

      return {
        total: total,
        active: active,
        totalRevenue: totalRevenue
      };
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas:', error);
      throw new Error('Falha ao carregar estatísticas.');
    }
  })
});