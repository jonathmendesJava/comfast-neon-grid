import React from 'react';
import { useZabbixMetrics } from '@/hooks/useZabbixData';
import { EnhancedMetricCard } from './EnhancedMetricCard';
import { RealTimeChart } from './RealTimeChart';
import { Cpu, MemoryStick, HardDrive, Network, Activity, Clock, Users, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const MetricsOverview: React.FC = () => {
  const { data: metrics, isLoading, error } = useZabbixMetrics();

  // Agrupar métricas por tipo
  const groupMetricsByType = () => {
    if (!metrics) return {};
    
    return metrics.reduce((acc: any, metric: any) => {
      if (!acc[metric.type]) acc[metric.type] = [];
      acc[metric.type].push(metric);
      return acc;
    }, {});
  };

  const metricGroups = groupMetricsByType();

  // Calcular estatísticas gerais
  const getOverallStats = () => {
    if (!metrics) return { totalHosts: 0, onlineHosts: 0, avgCpu: 0, avgMemory: 0 };
    
    const hosts = new Set(metrics.map(m => m.hostId));
    const onlineHosts = new Set(
      metrics.filter(m => m.hostAvailable === 'online').map(m => m.hostId)
    );
    
    const cpuMetrics = metrics.filter(m => m.type === 'cpu');
    const memoryMetrics = metrics.filter(m => m.type === 'memory');
    
    const avgCpu = cpuMetrics.length > 0 
      ? cpuMetrics.reduce((sum, m) => sum + parseFloat(m.value || '0'), 0) / cpuMetrics.length
      : 0;
      
    const avgMemory = memoryMetrics.length > 0
      ? memoryMetrics.reduce((sum, m) => sum + parseFloat(m.value || '0'), 0) / memoryMetrics.length  
      : 0;
    
    return {
      totalHosts: hosts.size,
      onlineHosts: onlineHosts.size,
      avgCpu: Math.round(avgCpu * 100) / 100,
      avgMemory: Math.round(avgMemory * 100) / 100
    };
  };

  const stats = getOverallStats();

  // Encontrar item ID para gráficos (primeiro CPU encontrado)
  const getCpuItemForChart = () => {
    const cpuMetrics = metricGroups.cpu || [];
    return cpuMetrics[0]?.itemId || '';
  };

  const getMemoryItemForChart = () => {
    const memoryMetrics = metricGroups.memory || [];
    return memoryMetrics[0]?.itemId || '';
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Erro ao carregar métricas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas Gerais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <EnhancedMetricCard
          title="Total de Hosts"
          value={stats.totalHosts.toString()}
          icon={Users}
          isLoading={isLoading}
          subtitle={`${stats.onlineHosts} online`}
          status={stats.onlineHosts < stats.totalHosts ? 'warning' : 'normal'}
        />
        
        <EnhancedMetricCard
          title="CPU Média"
          value={stats.avgCpu.toString()}
          unit="%"
          icon={Cpu}
          isLoading={isLoading}
          status={stats.avgCpu > 80 ? 'critical' : stats.avgCpu > 60 ? 'warning' : 'normal'}
          trend={stats.avgCpu > 70 ? 'up' : stats.avgCpu < 30 ? 'down' : 'stable'}
        />
        
        <EnhancedMetricCard
          title="Memória Média"
          value={stats.avgMemory.toString()}
          unit="%"
          icon={MemoryStick}
          isLoading={isLoading}
          status={stats.avgMemory > 85 ? 'critical' : stats.avgMemory > 70 ? 'warning' : 'normal'}
          trend={stats.avgMemory > 75 ? 'up' : stats.avgMemory < 50 ? 'down' : 'stable'}
        />
        
        <EnhancedMetricCard
          title="Alertas Ativos"
          value="0" // TODO: Implementar contagem de alertas
          icon={AlertTriangle}
          isLoading={isLoading}
          status="normal"
        />
      </div>

      {/* Gráficos em Tempo Real */}
      <Tabs defaultValue="24h" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="24h">24 Horas</TabsTrigger>
          <TabsTrigger value="7d">7 Dias</TabsTrigger>
          <TabsTrigger value="30d">30 Dias</TabsTrigger>
        </TabsList>
        
        <TabsContent value="24h" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <RealTimeChart
              itemId={getCpuItemForChart()}
              title="CPU Usage - 24h"
              timeRange="24h"
              type="area"
              unit="%"
              color="hsl(var(--destructive))"
            />
            <RealTimeChart
              itemId={getMemoryItemForChart()}
              title="Memory Usage - 24h"
              timeRange="24h"
              type="line"
              unit="%"
              color="hsl(var(--primary))"
            />
          </div>
        </TabsContent>
        
        <TabsContent value="7d" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <RealTimeChart
              itemId={getCpuItemForChart()}
              title="CPU Usage - 7 Dias"
              timeRange="7d"
              type="area"
              unit="%"
              color="hsl(var(--destructive))"
            />
            <RealTimeChart
              itemId={getMemoryItemForChart()}
              title="Memory Usage - 7 Dias"
              timeRange="7d"
              type="line"
              unit="%"
              color="hsl(var(--primary))"
            />
          </div>
        </TabsContent>
        
        <TabsContent value="30d" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <RealTimeChart
              itemId={getCpuItemForChart()}
              title="CPU Usage - 30 Dias"
              timeRange="30d"
              type="area"
              unit="%"
              color="hsl(var(--destructive))"
            />
            <RealTimeChart
              itemId={getMemoryItemForChart()}
              title="Memory Usage - 30 Dias"
              timeRange="30d"
              type="line"
              unit="%"
              color="hsl(var(--primary))"
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Métricas Detalhadas por Host */}
      <Card>
        <CardHeader>
          <CardTitle>Métricas Detalhadas por Host</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(metricGroups).map(([type, typeMetrics]: [string, any]) => (
              <div key={type} className="space-y-2">
                <h4 className="font-semibold capitalize">{type}</h4>
                {typeMetrics.slice(0, 5).map((metric: any) => (
                  <EnhancedMetricCard
                    key={metric.itemId}
                    title={metric.name}
                    value={parseFloat(metric.value || '0').toFixed(1)}
                    unit={metric.units}
                    icon={
                      type === 'cpu' ? Cpu :
                      type === 'memory' ? MemoryStick :
                      type === 'disk' ? HardDrive :
                      type === 'network' ? Network :
                      Activity
                    }
                    lastUpdate={metric.lastUpdate}
                    hostInfo={{
                      name: metric.hostName,
                      status: metric.hostAvailable === 'online' ? 'online' : 'offline',
                      ip: metric.hostIp
                    }}
                    status={
                      type === 'cpu' && parseFloat(metric.value || '0') > 80 ? 'critical' :
                      type === 'memory' && parseFloat(metric.value || '0') > 85 ? 'critical' :
                      type === 'cpu' && parseFloat(metric.value || '0') > 60 ? 'warning' :
                      type === 'memory' && parseFloat(metric.value || '0') > 70 ? 'warning' :
                      'normal'
                    }
                  />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};