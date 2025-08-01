import { useMemo } from 'react';
import { useZabbixHosts, useZabbixAlerts, useZabbixMetrics } from './useZabbixData';

/**
 * Hook para calcular métricas do dashboard baseado em dados reais do Zabbix
 */
export const useDashboardMetrics = () => {
  const { data: hosts = [], isLoading: hostsLoading, error: hostsError } = useZabbixHosts();
  const { data: alerts = [], isLoading: alertsLoading, error: alertsError } = useZabbixAlerts();
  const { data: metrics = [], isLoading: metricsLoading, error: metricsError } = useZabbixMetrics();

  // Calcular métricas de hosts
  const hostMetrics = useMemo(() => {
    const online = hosts.filter(h => h.available === 'online').length;
    const offline = hosts.filter(h => h.available === 'offline').length;
    const total = hosts.length;
    
    return {
      online,
      offline,
      total,
      onlinePercentage: total > 0 ? Math.round((online / total) * 100) : 0
    };
  }, [hosts]);

  // Calcular métricas de alertas
  const alertMetrics = useMemo(() => {
    const critical = alerts.filter(a => a.severity === 'critical').length;
    const high = alerts.filter(a => a.severity === 'high').length;
    const medium = alerts.filter(a => a.severity === 'medium').length;
    const low = alerts.filter(a => a.severity === 'low').length;
    const total = alerts.length;
    
    return {
      critical,
      high,
      medium,
      low,
      total
    };
  }, [alerts]);

  // Calcular métricas de performance baseadas nos dados do Zabbix
  const performanceMetrics = useMemo(() => {
    // Buscar métricas específicas
    const pingMetrics = metrics.filter(m => m.key?.includes('icmpping') || m.key?.includes('ping'));
    const cpuMetrics = metrics.filter(m => m.key?.includes('cpu.util') || m.key?.includes('cpu'));
    const memoryMetrics = metrics.filter(m => m.key?.includes('memory') && m.key?.includes('pused'));
    const networkMetrics = metrics.filter(m => m.key?.includes('net.if') && m.key?.includes('bytes'));
    
    // Calcular médias e totais
    const avgPingResponseTime = pingMetrics.length > 0 
      ? pingMetrics.reduce((acc, m) => acc + (parseFloat(m.value) || 0), 0) / pingMetrics.length
      : 0;
    
    const avgCpuUsage = cpuMetrics.length > 0 
      ? cpuMetrics.reduce((acc, m) => acc + (parseFloat(m.value) || 0), 0) / cpuMetrics.length
      : 0;
    
    const avgMemoryUsage = memoryMetrics.length > 0 
      ? memoryMetrics.reduce((acc, m) => acc + (parseFloat(m.value) || 0), 0) / memoryMetrics.length
      : 0;
    
    // Calcular throughput total (soma de todas as interfaces de rede)
    const totalThroughput = networkMetrics.reduce((acc, m) => {
      const value = parseFloat(m.value) || 0;
      // Converter bytes para bits e para Gbps
      return acc + (value * 8 / 1000000000);
    }, 0);
    
    // Calcular "packet loss" baseado em pings falhados
    const failedPings = pingMetrics.filter(m => m.value !== '1').length;
    const packetLoss = pingMetrics.length > 0 
      ? (failedPings / pingMetrics.length) * 100
      : 0;
    
    return {
      avgPingResponseTime: Math.round(avgPingResponseTime * 100) / 100,
      avgCpuUsage: Math.round(avgCpuUsage * 100) / 100,
      avgMemoryUsage: Math.round(avgMemoryUsage * 100) / 100,
      totalThroughput: Math.round(totalThroughput * 100) / 100,
      packetLoss: Math.round(packetLoss * 10000) / 10000,
      activeHosts: pingMetrics.filter(m => m.value === '1').length,
      totalMetrics: metrics.length
    };
  }, [metrics]);

  // Status geral do sistema
  const systemStatus = useMemo(() => {
    const criticalIssues = alertMetrics.critical > 0;
    const warningIssues = alertMetrics.high > 0 || alertMetrics.medium > 0;
    const hostsDown = hostMetrics.offline > 0;
    const highCpuUsage = performanceMetrics.avgCpuUsage > 80;
    const highMemoryUsage = performanceMetrics.avgMemoryUsage > 90;
    
    if (criticalIssues || hostsDown) {
      return 'critical';
    } else if (warningIssues || highCpuUsage || highMemoryUsage) {
      return 'warning';
    } else {
      return 'normal';
    }
  }, [alertMetrics, hostMetrics, performanceMetrics]);

  // Métricas específicas para os cards do dashboard
  const dashboardCards = useMemo(() => {
    return {
      hostsOnline: {
        value: hostMetrics.online,
        status: (hostMetrics.offline > 0 ? 'warning' : 'normal') as 'critical' | 'warning' | 'normal',
        subtitle: `${hostMetrics.total} hosts totais`,
        trend: (hostMetrics.onlinePercentage > 95 ? 'up' : hostMetrics.onlinePercentage < 80 ? 'down' : 'stable') as 'up' | 'down' | 'stable'
      },
      hostsOffline: {
        value: hostMetrics.offline,
        status: (hostMetrics.offline > 0 ? 'critical' : 'normal') as 'critical' | 'warning' | 'normal',
        subtitle: `${hostMetrics.onlinePercentage}% online`,
        trend: (hostMetrics.offline === 0 ? 'stable' : 'up') as 'up' | 'down' | 'stable'
      },
      activeAlerts: {
        value: alertMetrics.total,
        status: (alertMetrics.critical > 0 ? 'critical' : alertMetrics.high > 0 ? 'warning' : 'normal') as 'critical' | 'warning' | 'normal',
        subtitle: `${alertMetrics.critical} críticos`,
        trend: (alertMetrics.total === 0 ? 'stable' : 'up') as 'up' | 'down' | 'stable'
      },
      avgResponseTime: {
        value: performanceMetrics.avgPingResponseTime,
        unit: 'ms' as const,
        status: (performanceMetrics.avgPingResponseTime > 200 ? 'warning' : 'normal') as 'critical' | 'warning' | 'normal',
        trend: 'stable' as 'up' | 'down' | 'stable'
      },
      throughput: {
        value: performanceMetrics.totalThroughput,
        unit: 'Gbps' as const,
        status: 'normal' as 'critical' | 'warning' | 'normal',
        trend: 'stable' as 'up' | 'down' | 'stable'
      },
      packetLoss: {
        value: performanceMetrics.packetLoss,
        unit: '%' as const,
        status: (performanceMetrics.packetLoss > 1 ? 'warning' : 'normal') as 'critical' | 'warning' | 'normal',
        trend: (performanceMetrics.packetLoss === 0 ? 'down' : 'stable') as 'up' | 'down' | 'stable'
      }
    };
  }, [hostMetrics, alertMetrics, performanceMetrics]);

  return {
    hostMetrics,
    alertMetrics,
    performanceMetrics,
    systemStatus,
    dashboardCards,
    isLoading: hostsLoading || alertsLoading || metricsLoading,
    error: hostsError || alertsError || metricsError,
    hasData: hosts.length > 0 || alerts.length > 0 || metrics.length > 0
  };
};