import axios from 'axios';
import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';

// Variáveis de ambiente (devem ser configuradas no .env ou similar )
const SANTANDER_API_URL = process.env.SANTANDER_BASE_URL || 'https://api.santander.com.br/pix-automatico/v1';
// Novos campos para o caminho dos certificados, lendo do .env
const SANTANDER_CERT_PATH = process.env.SANTANDER_CERT_PATH || path.join(__dirname, '..', '..', 'certificates', 'certificate.pem' );
const SANTANDER_KEY_PATH = process.env.SANTANDER_KEY_PATH || path.join(__dirname, '..', '..', 'certificates', 'private.key');

const CLIENT_ID = process.env.SANTANDER_CLIENT_ID || 'SEU_CLIENT_ID';
const CLIENT_SECRET = process.env.SANTANDER_CLIENT_SECRET || 'SEU_CLIENT_SECRET';

// Variável para armazenar o token e sua expiração
let accessToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Obtém o token de acesso OAuth 2.0 do Santander.
 * @returns O token de acesso.
 */
async function getAccessToken(): Promise<string> {
  // Verifica se o token ainda é válido (com margem de 60 segundos)
  if (accessToken && tokenExpiry > Date.now() + 60000) {
    return accessToken;
  }

  console.log('🔑 Obtendo novo token de acesso do Santander...');
  
  const authString = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  
  try {
    // Configuração do agente HTTPS com mTLS
    const httpsAgent = new https.Agent({
      cert: fs.readFileSync(SANTANDER_CERT_PATH ),
      key: fs.readFileSync(SANTANDER_KEY_PATH),
      rejectUnauthorized: false, // Pode ser necessário para sandbox/testes
    });

    const response = await axios.post(
      `${SANTANDER_API_URL}/oauth/token`, // Endpoint de token (pode variar, verificar documentação)
      'grant_type=client_credentials',
      {
        httpsAgent,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${authString}`,
        },
      }
     );

    accessToken = response.data.access_token;
    // A API retorna expiresIn em segundos, convertemos para milissegundos e adicionamos ao tempo atual
    tokenExpiry = Date.now() + (response.data.expires_in * 1000); 
    
    console.log('✅ Token obtido com sucesso.');
    return accessToken as string;

  } catch (error) {
    console.error('❌ Erro ao obter token do Santander:', (error as any).response?.data || error);
    throw new Error('Falha ao autenticar com a API do Santander.');
  }
}

/**
 * Cria uma nova recorrência na API do Santander.
 * @param recurrenceData Os dados da recorrência conforme a documentação do Santander.
 * @returns A resposta da API do Santander.
 */
export async function createSantanderRecurrence(recurrenceData: any): Promise<any> {
  const token = await getAccessToken();
  
  try {
    console.log('🚀 Enviando solicitação de criação de recorrência para o Santander...');
    
    // Configuração do agente HTTPS com mTLS
    const httpsAgent = new https.Agent({
      cert: fs.readFileSync(SANTANDER_CERT_PATH ),
      key: fs.readFileSync(SANTANDER_KEY_PATH),
      rejectUnauthorized: false, // Pode ser necessário para sandbox/testes
    });

    const response = await axios.post(
      `${SANTANDER_API_URL}/rec`, // Endpoint de criação de recorrência
      recurrenceData,
      {
        httpsAgent,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
     );

    console.log('✅ Recorrência criada no Santander:', response.data);
    return response.data;

  } catch (error) {
    console.error('❌ Erro ao criar recorrência no Santander:', (error as any).response?.data || error);
    throw new Error('Falha ao criar recorrência no Santander.');
  }
}

/**
 * Gera o QR Code para uma recorrência.
 * A documentação sugere que o QR Code é retornado na criação da recorrência (location).
 * No entanto, se for necessário um endpoint separado, ele seria implementado aqui.
 * Por enquanto, vamos focar no retorno da criação da recorrência.
 */
export async function getQrCode(locationUrl: string): Promise<string> {
  const token = await getAccessToken();
  
  try {
    console.log('🖼️ Buscando QR Code...');
    
    // A documentação sugere que a URL de location contém o QR Code ou a informação para gerá-lo.
    // Vamos assumir que a URL de location é o endpoint para obter o payload do QR Code.
    // Configuração do agente HTTPS com mTLS
    const httpsAgent = new https.Agent({
      cert: fs.readFileSync(SANTANDER_CERT_PATH ),
      key: fs.readFileSync(SANTANDER_KEY_PATH),
      rejectUnauthorized: false, // Pode ser necessário para sandbox/testes
    });

    const response = await axios.get(
      locationUrl,
      {
        httpsAgent,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
     );

    // O payload do QR Code (copia e cola) é o campo 'location' ou 'qrcode' na resposta.
    // O QR Code em si (imagem) pode ser gerado a partir do payload.
    // Vamos retornar o payload para ser usado no frontend.
    return response.data.qrcode_payload || response.data.location; 

  } catch (error) {
    console.error('❌ Erro ao buscar QR Code:', (error as any).response?.data || error);
    throw new Error('Falha ao buscar QR Code.');
  }
}
