import { router, publicProcedure } from '../lib/trpc';
import { z } from 'zod';
import { db } from '../lib/db';
import { sql } from 'drizzle-orm';
import { recurrences } from '../models/schema';
import { 
  createSantanderRecurrence, 
  createLocation, 
  createRecurringCharge,
  getQrCodePayload 
} from '../lib/santander';

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
  // Campos para Jornada 3 e 4 (cobrança)
  dataVencimento: z.string().optional(), // Data de vencimento (para Jornada 4)
  cep: z.string().optional(),
  cidade: z.string().optional(),
  email: z.string().optional(),
  logradouro: z.string().optional(),
  uf: z.string().optional(),
});

export const recurrencesRouter = router({
  create: publicProcedure
    .input(createRecurrenceSchema)
    .mutation(async ({ input }) => {
      try {
        let locationId: number | null = null;
        let qrCodePayload: string | null = null;

        // PASSO 1: Criar location para Jornadas 2, 3 e 4
        if (input.jornada === 'jornada2' || input.jornada === 'jornada3' || input.jornada === 'jornada4') {
          console.log(`📍 Criando location para ${input.jornada}...`);
          const locationResponse = await createLocation();
          locationId = locationResponse.id;
          console.log(`✅ Location criada: ${locationId}`);
        }

        // PASSO 2: Preparar payload para criar recorrência
        const santanderPayload: any = {
          vinculo: {
            contrato: input.contract,
            devedor: {
              cpfCnpj: input.cpfCnpj,
              nome: input.name,
            },
            objeto: input.description || 'Recorrência PIX Automático',
          },
          calendario: {
            dataInicial: input.dataInicial,
            dataFinal: input.endDate,
            periodicidade: input.periodicidade,
          },
          valor: {
            valorRec: input.valorRec?.toString(),
            valorMinimoRecebedor: input.valorMinimoRecebedor?.toString(),
          },
          politicaRetentativa: input.politicaRetentativa,
          convenio: input.convenio,
        };

        // Adicionar location se foi criada
        if (locationId) {
          santanderPayload.loc = locationId;
        }

        // PASSO 3: Criar recorrência no Santander
        console.log('🚀 Criando recorrência no Santander...');
        const santanderResponse = await createSantanderRecurrence(santanderPayload);
        const santanderRecurrenceId = santanderResponse.idRec;
        console.log(`✅ Recorrência criada: ${santanderRecurrenceId}`);

        // PASSO 4: Para Jornadas 3 e 4, criar cobrança recorrente
        if ((input.jornada === 'jornada3' || input.jornada === 'jornada4') && locationId) {
          console.log(`💰 Criando cobrança para ${input.jornada}...`);
          
          const txid = input.txid || `TXN${Date.now()}`;
          
          const chargePayload: any = {
            idRec: santanderRecurrenceId,
            infoAdicional: input.description || 'Cobrança recorrente PIX',
            calendario: {},
            valor: {
              original: input.amount.toString(),
            },
            devedor: {
              cpfCnpj: input.cpfCnpj,
              nome: input.name,
            },
          };

          // Jornada 3: Pagamento imediato (sem vencimento)
          if (input.jornada === 'jornada3') {
            chargePayload.calendario.dataDeVencimento = input.dataInicial;
          }

          // Jornada 4: Pagamento com vencimento futuro
          if (input.jornada === 'jornada4' && input.dataVencimento) {
            chargePayload.calendario.dataDeVencimento = input.dataVencimento;
          }

          // Adicionar dados opcionais do devedor
          if (input.cep) chargePayload.devedor.cep = input.cep;
          if (input.cidade) chargePayload.devedor.cidade = input.cidade;
          if (input.email) chargePayload.devedor.email = input.email;
          if (input.logradouro) chargePayload.devedor.logradouro = input.logradouro;
          if (input.uf) chargePayload.devedor.uf = input.uf;

          await createRecurringCharge(txid, chargePayload);
          console.log(`✅ Cobrança criada com txid: ${txid}`);
        }

        // PASSO 5: Obter payload do QR Code
        if (locationId) {
          console.log('🖼️ Gerando payload do QR Code...');
          qrCodePayload = await getQrCodePayload(locationId);
          console.log('✅ QR Code payload gerado');
        }

        // PASSO 6: Salvar no banco de dados
        const [newRecurrence] = await db.insert(recurrences).values({
          clientId: input.clientId,
          amount: input.amount.toString(),
          frequency: input.frequency,
          startDate: new Date(input.startDate),
          endDate: input.endDate ? new Date(input.endDate) : null,
          status: 'PENDING_APPROVAL', // Status inicial
          santanderRecurrenceId: santanderRecurrenceId,
          locationUrl: locationId ? `${locationId}` : null,
        }).returning();

        console.log('✅ Recorrência salva no banco de dados');

        return {
          success: true,
          recurrence: newRecurrence,
          qrCodePayload: qrCodePayload,
          locationId: locationId,
          santanderRecurrenceId: santanderRecurrenceId,
          jornada: input.jornada,
        };

      } catch (error: any) {
        console.error('❌ Erro ao criar recorrência:', error);
        throw new Error(error.message || 'Falha ao criar recorrência.');
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
