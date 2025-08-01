import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from './LoadingSpinner';
import { EnhancedMetricCard } from './EnhancedMetricCard';
import { zabbixService } from '@/services/zabbixService';
import { useZabbixMetrics } from '@/hooks/useZabbixData';
import { Server, Activity, AlertTriangle, CheckCircle, Clock, Globe, Shield, Wifi, WifiOff, Cpu, MemoryStick, HardDrive, Network, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Host {
  id: string;
  name: string;
  ip: string;
  status: "online" | "offline";
  uptime?: string;
  lastSeen?: string;
}

interface HostDetailsModalProps {
  host: Host | null;
  isOpen: boolean;
  onClose: () => void;
}

interface HostDetails {
  id: string;
  name: string;
  host?: string;
  status: 'enabled' | 'disabled';
  available: 'online' | 'offline';
  ip: string;
  dns: string;
  uptime: number;
  lastCheck: string;
  groups: string[];
  templates: string[];
  interfaces: Array<{
    interfaceid: string;
    ip: string;
    dns: string;
    port: string;
    type: string;
    main: string;
  }>;
  items: Array<{
    itemid: string;
    name: string;
    key: string;
    lastvalue: string;
    rawValue: string;
    lastclock: string | null;
    lastCheckFormatted: string;
    units: string;
    status: 'active' | 'disabled';
    applications: string[];
    type: string;
  }>;
  alerts: Array<{
    id: string;
    name: string;
    severity: 'high' | 'average' | 'warning' | 'information' | 'not classified';
    status: 'active' | 'resolved';
    lastChange: string | null;
  }>;
  operationalStatus: {
    adminStatus: string;
    operStatus: string;
    lastStatusChange: string | null;
  };
  checks: {
    total: number;
    active: number;
    alerts: number;
  };
  error?: string; // Propriedade para indicar erros nos dados carregados
  _isPartialData?: boolean; // Flag para indicar dados parciais
}

const fetchHostDetails = async (hostId: string): Promise<HostDetails> => {
  console.log('Fetching host details for:', hostId);
  return zabbixService.getHostDetails(hostId);
};

export const HostDetailsModal = ({ host, isOpen, onClose }: HostDetailsModalProps) => {
  const { data: hostDetails, isLoading, error, refetch } = useQuery({
    queryKey: ['host-details', host?.id],
    queryFn: () => fetchHostDetails(host!.id),
    enabled: isOpen && !!host?.id,
    refetchInterval: 30000,
    retry: 3,
    retryDelay: 1000,
  });

  // Buscar métricas específicas do host
  const { data: hostMetrics, isLoading: metricsLoading } = useZabbixMetrics([host?.id]);

  // Agrupar métricas por tipo para este host específico
  const groupHostMetricsByType = () => {
    if (!hostMetrics) return {};
    
    return hostMetrics
      .filter(metric => metric.hostId === host?.id)
      .reduce((acc: any, metric: any) => {
        if (!acc[metric.type]) acc[metric.type] = [];
        acc[metric.type].push(metric);
        return acc;
      }, {});
  };

  const hostMetricGroups = groupHostMetricsByType();

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatLastUpdate = (timestamp: string) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Agora";
    if (diffMins < 60) return `${diffMins}min atrás`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  const getMetricIcon = (type: string) => {
    switch (type) {
      case 'cpu': return <Cpu className="w-4 h-4" />;
      case 'memory': return <MemoryStick className="w-4 h-4" />;
      case 'disk': return <HardDrive className="w-4 h-4" />;
      case 'network': return <Network className="w-4 h-4" />;
      case 'system': return <Activity className="w-4 h-4" />;
      default: return <Server className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': 
      case 'critical': return 'bg-destructive/10 text-destructive';
      case 'average': return 'bg-orange-500/10 text-orange-500';
      case 'warning': return 'bg-yellow-500/10 text-yellow-500';
      case 'information': return 'bg-blue-500/10 text-blue-500';
      default: return 'bg-muted/10 text-muted-foreground';
    }
  };

  const getStatusColor = (value: string) => {
    if (value.includes('up')) return 'bg-green-500/10 text-green-500';
    if (value.includes('down')) return 'bg-destructive/10 text-destructive';
    return 'bg-muted/10 text-muted-foreground';
  };

  if (!host) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              host.status === "online" 
                ? "bg-primary/10 text-primary" 
                : "bg-destructive/10 text-destructive"
            }`}>
              {host.status === "online" ? (
                <Wifi className="w-5 h-5" />
              ) : (
                <WifiOff className="w-5 h-5" />
              )}
            </div>
            <div>
              <span className="text-lg font-semibold">{host.name}</span>
              <p className="text-sm text-muted-foreground font-normal">{host.ip}</p>
            </div>
            <Badge className={host.status === "online" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}>
              {host.status.toUpperCase()}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-destructive">
              <AlertTriangle className="w-8 h-8 mb-2" />
              <div className="text-center space-y-2">
                <p className="font-medium">Erro ao carregar detalhes do host</p>
                <p className="text-sm text-muted-foreground">
                  {error instanceof Error ? error.message : 'Erro desconhecido'}
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => refetch()}
                  className="mt-3"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tentar Novamente
                </Button>
              </div>
            </div>
          ) : hostDetails ? (
            // Mostrar dados se disponíveis, mesmo com avisos
            <>
              {/* Aviso de dados parciais se aplicável */}
              {hostDetails.error && (
                <div className="mb-4 p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-yellow-800">
                        {hostDetails._isPartialData ? 'Dados parciais carregados' : 'Erro ao carregar dados'}
                      </h4>
                      <p className="text-sm text-yellow-700 mt-1">{hostDetails.error}</p>
                      <Button 
                        onClick={() => refetch()}
                        variant="outline"
                        size="sm"
                        className="mt-2"
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Tentar novamente
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Conteúdo principal dos dados */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="metrics">Métricas Detalhadas</TabsTrigger>
                <TabsTrigger value="items">Items ({hostDetails.items?.length || 0})</TabsTrigger>
                <TabsTrigger value="alerts">Alertas ({hostDetails.alerts?.length || 0})</TabsTrigger>
                <TabsTrigger value="graphs">Gráficos</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Status Geral e Métricas Principais */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="dashboard-card border-l-4 border-l-primary">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-primary flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Status Geral
                      </h4>
                      <div className={`w-3 h-3 rounded-full ${hostDetails.available === 'online' ? 'bg-primary animate-pulse' : 'bg-destructive'}`} />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Disponibilidade</span>
                        <Badge className={hostDetails.available === 'online' ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}>
                          {hostDetails.available === 'online' ? 'ONLINE' : 'OFFLINE'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Uptime</span>
                        <span className="font-medium text-primary">{formatUptime(hostDetails.uptime)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Última Verificação</span>
                        <span className="text-xs text-muted-foreground">{formatLastUpdate(hostDetails.lastCheck)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="dashboard-card border-l-4 border-l-blue-500">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <Activity className="w-4 h-4 text-blue-500" />
                      </div>
                      <h4 className="font-semibold text-blue-500">Monitoramento</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Items Ativos</span>
                        <span className="font-bold text-lg text-blue-500">{hostDetails.checks?.active || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total Items</span>
                        <span className="font-medium">{hostDetails.checks?.total || 0}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${((hostDetails.checks?.active || 0) / (hostDetails.checks?.total || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="dashboard-card border-l-4 border-l-orange-500">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 rounded-lg bg-orange-500/10">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                      </div>
                      <h4 className="font-semibold text-orange-500">Alertas</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Alertas Ativos</span>
                        <span className={`font-bold text-lg ${hostDetails.checks?.alerts && hostDetails.checks.alerts > 0 ? 'text-destructive' : 'text-primary'}`}>
                          {hostDetails.checks?.alerts || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Severidade Alta</span>
                        <span className="font-medium text-destructive">
                          {hostDetails.alerts?.filter(a => a.severity === 'high').length || 0}
                        </span>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs text-center font-medium ${
                        hostDetails.checks?.alerts && hostDetails.checks.alerts > 0 
                          ? 'bg-destructive/10 text-destructive' 
                          : 'bg-primary/10 text-primary'
                      }`}>
                        {hostDetails.checks?.alerts && hostDetails.checks.alerts > 0 ? 'Atenção Requerida' : 'Sistema Estável'}
                      </div>
                    </div>
                  </div>

                  <div className="dashboard-card border-l-4 border-l-green-500">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <Shield className="w-4 h-4 text-green-500" />
                      </div>
                      <h4 className="font-semibold text-green-500">Configuração</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Grupos</span>
                        <span className="font-bold text-lg text-green-500">{hostDetails.groups?.length || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Templates</span>
                        <span className="font-medium">{hostDetails.templates?.length || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <Badge className={hostDetails.status === 'enabled' ? "bg-green-500/10 text-green-500" : "bg-muted/10 text-muted-foreground"}>
                          {hostDetails.status === 'enabled' ? 'HABILITADO' : 'DESABILITADO'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Informações Detalhadas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="dashboard-card">
                    <h4 className="font-semibold mb-4 flex items-center gap-2 text-lg">
                      <Server className="w-5 h-5 text-primary" />
                      Informações de Rede
                    </h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nome do Host</span>
                          <p className="font-medium text-foreground">{hostDetails.name}</p>
                        </div>
                        <div className="space-y-2">
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Endereço IP</span>
                          <p className="font-mono text-sm bg-muted/30 px-2 py-1 rounded">{hostDetails.ip}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">DNS</span>
                          <p className="font-mono text-sm bg-muted/30 px-2 py-1 rounded">{hostDetails.dns || 'N/A'}</p>
                        </div>
                        {hostDetails.host && (
                          <div className="space-y-2">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Host Visível</span>
                            <p className="font-medium text-foreground">{hostDetails.host}</p>
                          </div>
                        )}
                      </div>
                      {hostDetails.interfaces && hostDetails.interfaces.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Interfaces</span>
                          <div className="space-y-2">
                            {hostDetails.interfaces.slice(0, 3).map((iface, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2 bg-muted/20 rounded">
                                <span className="font-mono text-xs">{iface.ip}:{iface.port}</span>
                                <Badge variant="outline" className="text-xs">
                                  {iface.type} {iface.main === '1' && '(Principal)'}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="dashboard-card">
                    <h4 className="font-semibold mb-4 flex items-center gap-2 text-lg">
                      <Activity className="w-5 h-5 text-primary" />
                      Status Operacional
                    </h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status Admin</span>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(hostDetails.operationalStatus?.adminStatus || '').includes('green') ? 'bg-primary' : 'bg-destructive'}`} />
                            <span className="font-medium">{hostDetails.operationalStatus?.adminStatus || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status Operacional</span>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(hostDetails.operationalStatus?.operStatus || '').includes('green') ? 'bg-primary' : 'bg-destructive'}`} />
                            <span className="font-medium">{hostDetails.operationalStatus?.operStatus || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Última Mudança de Status</span>
                        <p className="text-sm">{hostDetails.operationalStatus?.lastStatusChange ? formatLastUpdate(hostDetails.operationalStatus.lastStatusChange) : 'N/A'}</p>
                      </div>
                      <div className="p-3 bg-gradient-to-r from-primary/5 to-primary/10 border-l-4 border-l-primary rounded">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-primary">Tempo de Atividade</span>
                          <span className="text-lg font-bold text-primary">{formatUptime(hostDetails.uptime)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {hostDetails.groups && hostDetails.groups.length > 0 && (
                  <div className="dashboard-card">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Grupos do Host
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {hostDetails.groups.map((group, index) => (
                        <Badge key={index} variant="outline">{group}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="metrics" className="space-y-6">
                <div className="dashboard-card">
                  <h4 className="font-semibold mb-4 flex items-center gap-2 text-lg">
                    <Activity className="w-5 h-5 text-primary" />
                    Métricas Detalhadas do Host
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Visualização detalhada das métricas coletadas especificamente para este host.
                  </p>
                </div>

                {metricsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <LoadingSpinner />
                  </div>
                ) : hostMetrics && Object.keys(hostMetricGroups).length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(hostMetricGroups).map(([type, typeMetrics]: [string, any]) => (
                      <div key={type} className="dashboard-card">
                        <h5 className="font-semibold capitalize mb-4 flex items-center gap-2">
                          {getMetricIcon(type)}
                          {type === 'cpu' ? 'CPU & Processamento' :
                           type === 'memory' ? 'Memória' :
                           type === 'disk' ? 'Armazenamento' :
                           type === 'network' ? 'Rede' :
                           type === 'system' ? 'Sistema' : type}
                          <Badge variant="outline" className="text-xs">
                            {typeMetrics.length} métricas
                          </Badge>
                        </h5>
                        <div className="space-y-3">
                          {typeMetrics.slice(0, 6).map((metric: any) => (
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
                              status={
                                type === 'cpu' && parseFloat(metric.value || '0') > 80 ? 'critical' :
                                type === 'memory' && parseFloat(metric.value || '0') > 85 ? 'critical' :
                                type === 'cpu' && parseFloat(metric.value || '0') > 60 ? 'warning' :
                                type === 'memory' && parseFloat(metric.value || '0') > 70 ? 'warning' :
                                'normal'
                              }
                              trend="stable"
                              subtitle={`${metric.hostName} - ${metric.hostIp}`}
                            />
                          ))}
                          {typeMetrics.length > 6 && (
                            <div className="text-center py-2">
                              <Badge variant="outline" className="text-xs">
                                +{typeMetrics.length - 6} métricas adicionais
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="dashboard-card">
                    <div className="text-center py-12 text-muted-foreground">
                      <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <h5 className="font-medium mb-2">Nenhuma métrica encontrada</h5>
                      <p className="text-sm">Este host não possui métricas específicas configuradas ou disponíveis no momento.</p>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="items" className="space-y-6">
                {/* Filtros e Busca */}
                <div className="dashboard-card">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-lg flex items-center gap-2">
                      <Activity className="w-5 h-5 text-primary" />
                      Métricas e Items ({hostDetails.items?.length || 0})
                    </h4>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-primary/5 text-primary">
                        {hostDetails.items?.filter(item => item.status === 'active').length || 0} Ativos
                      </Badge>
                      <Badge variant="outline" className="bg-muted/10">
                        {hostDetails.items?.filter(item => item.status === 'disabled').length || 0} Desabilitados
                      </Badge>
                    </div>
                  </div>
                </div>

                {hostDetails.items && hostDetails.items.length > 0 ? (
                  <div className="space-y-4">
                    {/* Métricas por Categoria */}
                    {['system', 'cpu', 'memory', 'network', 'disk'].map(category => {
                      const categoryItems = hostDetails.items.filter(item => {
                        const key = item.key.toLowerCase();
                        const name = item.name.toLowerCase();
                        switch(category) {
                          case 'cpu': return key.includes('cpu') || name.includes('cpu') || key.includes('processor');
                          case 'memory': return key.includes('memory') || key.includes('mem') || name.includes('memory') || name.includes('memória');
                          case 'network': return key.includes('net') || key.includes('if') || name.includes('network') || name.includes('interface');
                          case 'disk': return key.includes('disk') || key.includes('fs') || name.includes('disk') || name.includes('filesystem');
                          case 'system': return key.includes('system') || key.includes('uptime') || key.includes('agent') || name.includes('system');
                          default: return false;
                        }
                      });

                      if (categoryItems.length === 0) return null;

                      const getCategoryInfo = (cat: string) => {
                        switch(cat) {
                          case 'cpu': return { name: 'CPU & Processamento', icon: <Cpu className="w-4 h-4" />, color: 'text-blue-500', bg: 'bg-blue-500/10' };
                          case 'memory': return { name: 'Memória', icon: <MemoryStick className="w-4 h-4" />, color: 'text-green-500', bg: 'bg-green-500/10' };
                          case 'network': return { name: 'Rede & Conectividade', icon: <Network className="w-4 h-4" />, color: 'text-purple-500', bg: 'bg-purple-500/10' };
                          case 'disk': return { name: 'Armazenamento', icon: <HardDrive className="w-4 h-4" />, color: 'text-orange-500', bg: 'bg-orange-500/10' };
                          case 'system': return { name: 'Sistema & Geral', icon: <Server className="w-4 h-4" />, color: 'text-primary', bg: 'bg-primary/10' };
                          default: return { name: 'Outros', icon: <Activity className="w-4 h-4" />, color: 'text-muted-foreground', bg: 'bg-muted/10' };
                        }
                      };

                      const catInfo = getCategoryInfo(category);

                      return (
                        <div key={category} className="dashboard-card">
                          <div className="flex items-center gap-3 mb-4">
                            <div className={`p-2 rounded-lg ${catInfo.bg}`}>
                              <span className={catInfo.color}>{catInfo.icon}</span>
                            </div>
                            <div>
                              <h5 className={`font-semibold ${catInfo.color}`}>{catInfo.name}</h5>
                              <p className="text-xs text-muted-foreground">{categoryItems.length} items disponíveis</p>
                            </div>
                          </div>
                          
                          <div className="grid gap-3">
                            {categoryItems.slice(0, 10).map((item) => (
                              <div key={item.itemid} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-sm truncate">{item.name}</span>
                                    <Badge variant={item.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                                      {item.status === 'active' ? 'Ativo' : 'Inativo'}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground font-mono truncate">{item.key}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Última verificação: {item.lastCheckFormatted}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <div className="font-medium text-sm">
                                    {item.lastvalue} {item.units && <span className="text-muted-foreground">{item.units}</span>}
                                  </div>
                                  {item.applications && item.applications.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1 justify-end">
                                      {item.applications.slice(0, 2).map((app, idx) => (
                                        <Badge key={idx} variant="outline" className="text-xs">
                                          {app}
                                        </Badge>
                                      ))}
                                      {item.applications.length > 2 && (
                                        <Badge variant="outline" className="text-xs">
                                          +{item.applications.length - 2}
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                            {categoryItems.length > 10 && (
                              <div className="text-center py-2">
                                <Badge variant="outline" className="text-xs">
                                  +{categoryItems.length - 10} items adicionais
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Items Não Categorizados */}
                    {(() => {
                      const uncategorizedItems = hostDetails.items.filter(item => {
                        const key = item.key.toLowerCase();
                        const name = item.name.toLowerCase();
                        return !(['cpu', 'memory', 'mem', 'processor', 'net', 'if', 'network', 'interface', 'disk', 'fs', 'filesystem', 'system', 'uptime', 'agent'].some(keyword => 
                          key.includes(keyword) || name.includes(keyword)
                        ));
                      });

                      if (uncategorizedItems.length === 0) return null;

                      return (
                        <div className="dashboard-card">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-muted/10">
                              <Activity className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div>
                              <h5 className="font-semibold text-muted-foreground">Outras Métricas</h5>
                              <p className="text-xs text-muted-foreground">{uncategorizedItems.length} items diversos</p>
                            </div>
                          </div>
                          
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-border">
                                  <th className="text-left py-2 font-medium">Nome</th>
                                  <th className="text-left py-2 font-medium">Último Valor</th>
                                  <th className="text-left py-2 font-medium">Última Verificação</th>
                                  <th className="text-left py-2 font-medium">Key</th>
                                </tr>
                              </thead>
                              <tbody>
                                {uncategorizedItems.slice(0, 15).map((item) => (
                                  <tr key={item.itemid} className="border-b border-border/50 hover:bg-muted/5">
                                    <td className="py-3">
                                      <span className="font-medium">{item.name}</span>
                                    </td>
                                    <td className="py-3 font-medium">
                                      {item.lastvalue} {item.units && <span className="text-muted-foreground text-xs">{item.units}</span>}
                                    </td>
                                    <td className="py-3 text-muted-foreground text-xs">
                                      {item.lastCheckFormatted}
                                    </td>
                                    <td className="py-3 text-muted-foreground font-mono text-xs">
                                      {item.key}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {uncategorizedItems.length > 15 && (
                              <div className="text-center py-3">
                                <Badge variant="outline" className="text-xs">
                                  +{uncategorizedItems.length - 15} items adicionais
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="dashboard-card">
                    <div className="text-center py-12 text-muted-foreground">
                      <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <h5 className="font-medium mb-2">Nenhum item encontrado</h5>
                      <p className="text-sm">Este host não possui items configurados ou dados disponíveis.</p>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="alerts" className="space-y-4">
                <div className="dashboard-card">
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Alertas Ativos ({hostDetails.alerts?.length || 0})
                  </h4>
                  {hostDetails.alerts && hostDetails.alerts.length > 0 ? (
                    <div className="space-y-3">
                      {hostDetails.alerts.map((alert) => (
                        <div key={alert.id} className="p-4 border border-border rounded-lg hover:bg-muted/5">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="font-medium text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                {alert.name}
                              </h5>
                              <p className="text-xs text-muted-foreground mt-1">
                                Última mudança: {alert.lastChange ? formatLastUpdate(alert.lastChange) : 'N/A'}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={getSeverityColor(alert.severity)}>
                                {alert.severity}
                              </Badge>
                              <Badge variant={alert.status === 'active' ? 'destructive' : 'outline'}>
                                {alert.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                      Nenhum alerta ativo para este host
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="graphs" className="space-y-4">
                <div className="dashboard-card">
                  <h4 className="font-medium mb-4">Gráficos</h4>
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="w-8 h-8 mx-auto mb-2" />
                    Gráficos em desenvolvimento
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};