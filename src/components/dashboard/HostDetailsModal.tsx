import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from './LoadingSpinner';
import { zabbixService } from '@/services/zabbixService';
import { Server, Activity, AlertTriangle, CheckCircle, Clock, Globe, Shield, Wifi, WifiOff, Cpu, MemoryStick, HardDrive, Network } from 'lucide-react';

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
}

const fetchHostDetails = async (hostId: string): Promise<HostDetails> => {
  console.log('Fetching host details for:', hostId);
  return zabbixService.getHostDetails(hostId);
};

export const HostDetailsModal = ({ host, isOpen, onClose }: HostDetailsModalProps) => {
  const { data: hostDetails, isLoading, error } = useQuery({
    queryKey: ['host-details', host?.id],
    queryFn: () => fetchHostDetails(host!.id),
    enabled: isOpen && !!host?.id,
    refetchInterval: 30000,
    retry: 3,
    retryDelay: 1000,
  });

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
              <p className="text-center">
                Erro ao carregar detalhes do host
                <br />
                <span className="text-sm text-muted-foreground">
                  {error instanceof Error ? error.message : 'Erro desconhecido'}
                </span>
              </p>
            </div>
          ) : hostDetails ? (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="items">Items ({hostDetails.items?.length || 0})</TabsTrigger>
                <TabsTrigger value="alerts">Alertas ({hostDetails.alerts?.length || 0})</TabsTrigger>
                <TabsTrigger value="graphs">Gráficos</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="dashboard-card">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Server className="w-4 h-4" />
                      Informações Básicas
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nome:</span>
                        <span>{hostDetails.name}</span>
                      </div>
                      {hostDetails.host && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Host:</span>
                          <span>{hostDetails.host}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">IP:</span>
                        <span>{hostDetails.ip}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">DNS:</span>
                        <span>{hostDetails.dns}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge className={hostDetails.status === 'enabled' ? "bg-primary/10 text-primary" : "bg-muted/10 text-muted-foreground"}>
                          {hostDetails.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="dashboard-card">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Status Operacional
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Disponível:</span>
                        <Badge className={hostDetails.available === 'online' ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}>
                          {hostDetails.available}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Admin Status:</span>
                        <Badge className={getStatusColor(hostDetails.operationalStatus?.adminStatus || '')}>
                          {hostDetails.operationalStatus?.adminStatus || 'N/A'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Oper Status:</span>
                        <Badge className={getStatusColor(hostDetails.operationalStatus?.operStatus || '')}>
                          {hostDetails.operationalStatus?.operStatus || 'N/A'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Uptime:</span>
                        <span>{formatUptime(hostDetails.uptime)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="dashboard-card">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Estatísticas
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Items:</span>
                        <span>{hostDetails.checks?.total || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Items Ativos:</span>
                        <span>{hostDetails.checks?.active || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Alertas:</span>
                        <span>{hostDetails.checks?.alerts || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Grupos:</span>
                        <span>{hostDetails.groups?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Templates:</span>
                        <span>{hostDetails.templates?.length || 0}</span>
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

              <TabsContent value="items" className="space-y-4">
                <div className="dashboard-card">
                  <h4 className="font-medium mb-4">Dados Recentes - Items ({hostDetails.items?.length || 0})</h4>
                  {hostDetails.items && hostDetails.items.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 font-medium">Nome</th>
                            <th className="text-left py-2 font-medium">Última Checagem</th>
                            <th className="text-left py-2 font-medium">Último Valor</th>
                            <th className="text-left py-2 font-medium">Key</th>
                            <th className="text-left py-2 font-medium">Etiquetas</th>
                          </tr>
                        </thead>
                        <tbody>
                          {hostDetails.items.map((item) => (
                            <tr key={item.itemid} className="border-b border-border/50 hover:bg-muted/5">
                              <td className="py-3">
                                <div className="flex items-center gap-2">
                                  {getMetricIcon(item.type)}
                                  <span className="font-medium">{item.name}</span>
                                </div>
                              </td>
                              <td className="py-3 text-muted-foreground">
                                {item.lastCheckFormatted}
                              </td>
                              <td className="py-3">
                                <span className={`font-medium ${getStatusColor(item.lastvalue).replace('bg-', 'text-').replace('/10', '')}`}>
                                  {item.lastvalue}
                                </span>
                              </td>
                              <td className="py-3 text-muted-foreground font-mono text-xs">
                                {item.key}
                              </td>
                              <td className="py-3">
                                {item.applications && item.applications.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
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
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum item encontrado para este host
                    </div>
                  )}
                </div>
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
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};