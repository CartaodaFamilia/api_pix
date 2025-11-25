import axios from 'axios';
import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';

// Variáveis de ambiente (devem ser configuradas no .env)
const SANTANDER_API_URL = process.env.SANTANDER_BASE_URL || 'https://trust-pix-h.santander.com.br';
const X_APPLICATION_KEY = process.env.X_APPLICATION_KEY || '';
// Caminhos dos certificados
const SANTANDER_CERT_PATH = process.env.SANTANDER_CERT_PATH || path.join(__dirname, '..', '..', 'certificados', 'certificate.pem');
const SANTANDER_KEY_PATH = process.env.SANTANDER_KEY_PATH || path.join(__dirname, '..', '..', 'certificados', 'private.key');

const CLIENT_ID = process.env.SANTANDER_CLIENT_ID || '';
const CLIENT_SECRET = process.env.SANTANDER_CLIENT_SECRET || '';

// Variável para armazenar o token e sua expiração
let accessToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Cria agente HTTPS com mTLS
 */
function createHttpsAgent(): https.Agent {
  try {
    return new https.Agent({
      cert: fs.readFileSync(SANTANDER_CERT_PATH),
      key: fs.readFileSync(SANTANDER_KEY_PATH),
      rejectUnauthorized: false, // Para ambiente de homologação/sandbox
    });
  } catch (error) {
    console.warn('⚠️ Certificados não encontrados, usando conexão sem mTLS');
    return new https.Agent({ rejectUnauthorized: false });
  }
}

/**
 * Obtém o token de acesso OAuth 2.0 do Santander.
 */
async function getAccessToken(): Promise<string> {
  // Verifica se o token ainda é válido (com margem de 60 segundos)
  if (accessToken && tokenExpiry > Date.now() + 60000) {
    return accessToken;
  }

  console.log('🔑 Obtendo novo token de acesso do Santander...');

  try {
    const httpsAgent = createHttpsAgent();

    const response = await axios.post(
      `${SANTANDER_API_URL}/auth/oauth/v2/token`,
      new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'client_credentials',
      }),
      {
        httpsAgent,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    accessToken = response.data.access_token;
    tokenExpiry = Date.now() + (response.data.expires_in * 1000);

    console.log('✅ Token obtido com sucesso.');
    return accessToken as string;

  } catch (error: any) {
    console.error('❌ Erro ao obter token do Santander:', error.response?.data || error.message);
    throw new Error('Falha ao autenticar com a API do Santander.');
  }
}

/**
 * Cria uma location para QR Code (necessário para Jornadas 2, 3 e 4)
 */
export async function createLocation(): Promise<any> {
  const token = await getAccessToken();

  try {
    console.log('📍 Criando location no Santander...');

    const httpsAgent = createHttpsAgent();

    const response = await axios.post(
      `${SANTANDER_API_URL}/api/v1/locrec`,
      {}, // Body vazio conforme documentação
      {
        httpsAgent,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-application-key': X_APPLICATION_KEY,
        },
      }
    );

    console.log('✅ Location criada:', response.data);
    return response.data;

  } catch (error: any) {
    console.error('❌ Erro ao criar location:', error.response?.data || error.message);
    throw new Error('Falha ao criar location no Santander.');
  }
}

/**
 * Cria uma nova recorrência na API do Santander.
 */
export async function createSantanderRecurrence(recurrenceData: any): Promise<any> {
  const token = await getAccessToken();

  try {
    console.log('🚀 Enviando solicitação de criação de recorrência para o Santander...');

    const httpsAgent = createHttpsAgent();

    const response = await axios.post(
      `${SANTANDER_API_URL}/api/v1/rec`,
      recurrenceData,
      {
        httpsAgent,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-application-key': X_APPLICATION_KEY,
        },
      }
    );

    console.log('✅ Recorrência criada no Santander:', response.data);
    return response.data;

  } catch (error: any) {
    console.error('❌ Erro ao criar recorrência no Santander:', error.response?.data || error.message);
    throw new Error('Falha ao criar recorrência no Santander.');
  }
}

/**
 * Cria uma cobrança recorrente (para Jornadas 3 e 4)
 */
export async function createRecurringCharge(txid: string, chargeData: any): Promise<any> {
  const token = await getAccessToken();

  try {
    console.log('💰 Criando cobrança recorrente no Santander...');

    const httpsAgent = createHttpsAgent();

    const response = await axios.put(
      `${SANTANDER_API_URL}/api/v1/cobr/${txid}`,
      chargeData,
      {
        httpsAgent,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-application-key': X_APPLICATION_KEY,
        },
      }
    );

    console.log('✅ Cobrança recorrente criada:', response.data);
    return response.data;

  } catch (error: any) {
    console.error('❌ Erro ao criar cobrança recorrente:', error.response?.data || error.message);
    throw new Error('Falha ao criar cobrança recorrente no Santander.');
  }
}

/**
 * Recupera informações de uma location (inclui dados do QR Code)
 */
export async function getLocationById(locationId: number): Promise<any> {
  const token = await getAccessToken();

  try {
    console.log('🔍 Recuperando location do Santander...');

    const httpsAgent = createHttpsAgent();

    const response = await axios.get(
      `${SANTANDER_API_URL}/api/v1/locrec/${locationId}`,
      {
        httpsAgent,
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-application-key': X_APPLICATION_KEY,
        },
      }
    );

    console.log('✅ Location recuperada:', response.data);
    return response.data;

  } catch (error: any) {
    console.error('❌ Erro ao recuperar location:', error.response?.data || error.message);
    throw new Error('Falha ao recuperar location do Santander.');
  }
}

/**
 * Gera o payload do QR Code a partir da location
 */
export async function getQrCodePayload(locationId: number): Promise<string> {
  try {
    const locationData = await getLocationById(locationId);
    
    // O payload do QR Code PIX está no campo 'location' ou 'pixCopiaECola'
    const qrCodePayload = locationData.pixCopiaECola || locationData.location || '';
    
    if (!qrCodePayload) {
      throw new Error('QR Code payload não encontrado na location.');
    }

    return qrCodePayload;

  } catch (error: any) {
    console.error('❌ Erro ao gerar payload do QR Code:', error.message);
    throw new Error('Falha ao gerar payload do QR Code.');
  }
}
