import { supabase } from '@/integrations/supabase/client';

/**
 * Interfaces para dados do Zabbix
 */
export interface ZabbixHost {
  id: string;
  name: string;
  host: string;
  status: 'enabled' | 'disabled';
  available: 'online' | 'offline';
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
  hostAvailable?: 'online' | 'offline';
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
}

export const zabbixService = new ZabbixService();