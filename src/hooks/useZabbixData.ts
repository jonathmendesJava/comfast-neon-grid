import { useQuery } from '@tanstack/react-query';
import { zabbixService } from '@/services/zabbixService';

/**
 * Hook para buscar hosts do Zabbix
 * Quando integrado, substitui os dados mock por dados reais
 */
export const useZabbixHosts = () => {
  return useQuery({
    queryKey: ['zabbix-hosts'],
    queryFn: () => zabbixService.getHosts(),
    enabled: true, // Agora habilitado para usar dados reais
    refetchInterval: 30000, // Atualiza a cada 30 segundos
    staleTime: 15000, // Considera dados válidos por 15 segundos
    retry: 3,
    retryDelay: 1000,
  });
};

/**
 * Hook para buscar alertas do Zabbix
 */
export const useZabbixAlerts = () => {
  return useQuery({
    queryKey: ['zabbix-alerts'],
    queryFn: () => zabbixService.getAlerts(),
    enabled: true, // Agora habilitado para usar dados reais
    refetchInterval: 10000, // Atualiza a cada 10 segundos
    staleTime: 5000, // Considera dados válidos por 5 segundos
    retry: 3,
    retryDelay: 1000,
  });
};

/**
 * Hook para buscar métricas específicas
 */
export const useZabbixMetrics = (hostIds?: string[]) => {
  return useQuery({
    queryKey: ['zabbix-metrics', hostIds],
    queryFn: () => zabbixService.getMetrics(hostIds),
    enabled: true, // Agora habilitado para usar dados reais
    refetchInterval: 5000, // Atualiza a cada 5 segundos
    staleTime: 2000, // Considera dados válidos por 2 segundos
    retry: 3,
    retryDelay: 1000,
  });
};

/**
 * Hook para dados históricos de gráficos
 */
export const useZabbixHistory = (itemId: string, timeRange: { from: number; to: number }) => {
  return useQuery({
    queryKey: ['zabbix-history', itemId, timeRange.from, timeRange.to],
    queryFn: () => zabbixService.getHistoryData(itemId, timeRange.from, timeRange.to),
    enabled: !!itemId && !!timeRange.from && !!timeRange.to, // Agora habilitado quando tiver dados
    staleTime: 60000, // Dados históricos são válidos por 1 minuto
    retry: 2,
    retryDelay: 1000,
  });
};