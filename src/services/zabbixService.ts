import { supabase } from '@/integrations/supabase/client';

/**
 * Interfaces para dados do Zabbix
 */
export interface ZabbixHost {
  id: string;
  name: string;
  host: string;
  status: 'enabled' | 'disabled';
  available: 'online' | 'offline' | 'unknown';
  ip: string;
  dns: string;
  groups: string[];
}

export interface ZabbixAlert {
  id: string;
  title: string;
  host: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  description: string;
  acknowledged: boolean;
}

export interface ZabbixMetric {
  hostId: string;
  hostName: string;
  hostHost?: string;
  hostStatus?: 'enabled' | 'disabled';
  hostAvailable?: 'online' | 'offline' | 'unknown';
  hostIp?: string;
  itemId: string;
  name: string;
  key: string;
  value: string;
  units: string;
  type: string;
  lastUpdate?: string;
}

export interface ZabbixHistoryData {
  timestamp: number;
  value: number;
}

export interface CriticalMetrics {
  ping: ZabbixHistoryData[];
  latency: ZabbixHistoryData[];
  cpu: ZabbixHistoryData[];
  memory: ZabbixHistoryData[];
  timestamps: number[];
}

export interface CriticalHistoryResponse {
  hostId: string;
  timeRange: string;
  metrics: CriticalMetrics;
  generatedAt: string;
}

/**
 * Serviço para integração com Zabbix via Supabase Edge Functions
 * Todas as operações são READ-ONLY para garantir segurança
 */
export class ZabbixService {
  /**
   * Busca lista de hosts do Zabbix
   * @returns Promise<ZabbixHost[]> Lista de hosts
   */
  async getHosts(): Promise<ZabbixHost[]> {
    try {
      const { data: result, error } = await supabase.functions.invoke('zabbix-proxy', {
        body: { action: 'get-hosts' }
      });

      if (error) {
        throw new Error(`Supabase function error: ${error.message}`);
      }

      if (!result.success) {
        throw new Error(result.error || 'Unknown error from Zabbix proxy');
      }

      return result.data;
    } catch (error) {
      console.error('Erro ao buscar hosts:', error);
      throw error;
    }
  }

  /**
   * Busca alertas ativos do Zabbix
   * @returns Promise<ZabbixAlert[]> Lista de alertas
   */
  async getAlerts(): Promise<ZabbixAlert[]> {
    try {
      const { data: result, error } = await supabase.functions.invoke('zabbix-proxy', {
        body: { action: 'get-alerts' }
      });

      if (error) {
        throw new Error(`Supabase function error: ${error.message}`);
      }

      if (!result.success) {
        throw new Error(result.error || 'Unknown error from Zabbix proxy');
      }

      return result.data;
    } catch (error) {
      console.error('Erro ao buscar alertas:', error);
      throw error;
    }
  }

  /**
   * Busca métricas específicas do Zabbix
   * @param hostIds IDs dos hosts (opcional)
   * @returns Promise<ZabbixMetric[]> Lista de métricas
   */
  async getMetrics(hostIds?: string[]): Promise<ZabbixMetric[]> {
    try {
      const { data: result, error } = await supabase.functions.invoke('zabbix-proxy', {
        body: { 
          action: 'get-metrics',
          hostIds 
        }
      });

      if (error) {
        throw new Error(`Supabase function error: ${error.message}`);
      }

      if (!result.success) {
        throw new Error(result.error || 'Unknown error from Zabbix proxy');
      }

      return result.data;
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
      throw error;
    }
  }

  /**
   * Busca dados históricos para gráficos
   * @param itemId ID do item
   * @param timeFrom Timestamp inicial
   * @param timeTill Timestamp final
   * @returns Promise<ZabbixHistoryData[]> Dados históricos
   */
  async getHistoryData(itemId: string, timeFrom: number, timeTill: number): Promise<ZabbixHistoryData[]> {
    try {
      const { data: result, error } = await supabase.functions.invoke('zabbix-proxy', {
        body: { 
          action: 'get-history',
          itemId, 
          timeFrom, 
          timeTill 
        }
      });

      if (error) {
        throw new Error(`Supabase function error: ${error.message}`);
      }

      if (!result.success) {
        throw new Error(result.error || 'Unknown error from Zabbix proxy');
      }

      return result.data;
    } catch (error) {
      console.error('Erro ao buscar dados históricos:', error);
      throw error;
    }
  }

  /**
   * Busca histórico de métricas críticas para análise de instabilidade
   * @param hostId ID do host
   * @param timeRange Período de tempo ('1h', '6h', '24h')
   * @returns Promise<CriticalHistoryResponse> Histórico de métricas críticas
   */
  async getCriticalHistory(hostId: string, timeRange: string = '1h'): Promise<CriticalHistoryResponse> {
    try {
      const { data: result, error } = await supabase.functions.invoke('zabbix-proxy', {
        body: { 
          action: 'get-critical-history',
          hostId,
          timeRange
        }
      });

      if (error) {
        throw new Error(`Supabase function error: ${error.message}`);
      }

      if (!result.success) {
        throw new Error(result.error || 'Unknown error from Zabbix proxy');
      }

      return result.data;
    } catch (error) {
      console.error('Erro ao buscar histórico crítico:', error);
      throw error;
    }
  }

  /**
   * Busca detalhes completos de um host específico
   * @param hostId ID do host
   * @returns Promise<any> Detalhes do host
   */
  async getHostDetails(hostId: string): Promise<any> {
    try {
      console.log(`🔹 ZabbixService: Buscando detalhes do host ${hostId}`);
      
      // Validar hostId antes de enviar
      if (!hostId || hostId === 'undefined' || hostId === 'null') {
        throw new Error(`Host ID inválido: ${hostId}`);
      }

      const { data: result, error } = await supabase.functions.invoke('zabbix-proxy', {
        body: { 
          action: 'get-host-details',
          hostId 
        }
      });

      if (error) {
        console.error('❌ Erro do Supabase:', error);
        throw new Error(`Erro de conexão: ${error.message}`);
      }

      if (!result) {
        throw new Error('Resposta vazia do servidor');
      }

      if (!result.success) {
        console.error('❌ Erro do Zabbix:', result.error);
        throw new Error(result.error || 'Erro desconhecido do Zabbix');
      }

      console.log(`✅ ZabbixService: Dados do host carregados com sucesso`);
      return result.data || {};
    } catch (error) {
      console.error('❌ ZabbixService: Erro ao buscar detalhes do host:', error);
      
      // Retornar estrutura mínima para evitar quebra do frontend
      return {
        host: { name: 'Host indisponível', status: 'unknown' },
        items: [],
        alerts: [],
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Busca últimos valores de todos os itens de um host
   * @param hostId ID do host
   * @returns Promise<any> Últimos valores dos itens
   */
  async getLatestValues(hostId: string): Promise<any> {
    try {
      const { data: result, error } = await supabase.functions.invoke('zabbix-proxy', {
        body: { 
          action: 'get-latest-values',
          hostId
        }
      });

      if (error) {
        throw new Error(`Supabase function error: ${error.message}`);
      }

      if (!result.success) {
        throw new Error(result.error || 'Unknown error from Zabbix proxy');
      }

      return result.data;
    } catch (error) {
      console.error('Erro ao buscar últimos valores:', error);
      throw error;
    }
  }
}

export const zabbixService = new ZabbixService();