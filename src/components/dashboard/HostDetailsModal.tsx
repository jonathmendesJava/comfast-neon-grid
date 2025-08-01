import React, { useState } from "react";
import { Server, Wifi, WifiOff, Clock, Activity, HardDrive, Cpu, MemoryStick, Network } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  host: string;
  ip: string;
  dns: string;
  status: 'enabled' | 'disabled';
  available: 'online' | 'offline';
  uptime: number;
  lastCheck: string;
  groups: string[];
  templates: string[];
  currentMetrics: Array<{
    itemId: string;
    name: string;
    key: string;
    value: string;
    units: string;
    type: string;
    lastUpdate: string;
  }>;
  activeAlerts: Array<{
    id: string;
    description: string;
    severity: string;
    status: string;
    lastChange: string;
  }>;
}

const fetchHostDetails = async (hostId: string): Promise<HostDetails> => {
  const { data, error } = await supabase.functions.invoke('zabbix-proxy', {
    body: { 
      action: 'get-host-details',
      hostId: hostId
    }
  });

  if (error) throw error;
  if (!data.success) throw new Error(data.error || 'Failed to fetch host details');
  
  return data.data;
};

export const HostDetailsModal = ({ host, isOpen, onClose }: HostDetailsModalProps) => {
  const { data: hostDetails, isLoading, error } = useQuery({
    queryKey: ['host-details', host?.id],
    queryFn: () => fetchHostDetails(host!.id),
    enabled: isOpen && !!host?.id,
    refetchInterval: 30000, // Refresh every 30 seconds when modal is open
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
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Agora";
    if (diffMins < 60) return `${diffMins}min atrás`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;
    return date.toLocaleDateString();
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
      case 'critical': return 'bg-destructive/10 text-destructive';
      case 'high': return 'bg-orange-500/10 text-orange-500';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500';
      case 'low': return 'bg-blue-500/10 text-blue-500';
      default: return 'bg-muted/10 text-muted-foreground';
    }
  };

  if (!host) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64 text-destructive">
              Erro ao carregar detalhes do host
            </div>
          ) : hostDetails ? (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="metrics">Métricas</TabsTrigger>
                <TabsTrigger value="alerts">Alertas</TabsTrigger>
                <TabsTrigger value="checks">Checagens</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="dashboard-card">
                    <h4 className="font-medium mb-3">Informações Básicas</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nome:</span>
                        <span>{hostDetails.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Host:</span>
                        <span>{hostDetails.host}</span>
                      </div>
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
                    <h4 className="font-medium mb-3">Status do Sistema</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Disponível:</span>
                        <Badge className={hostDetails.available === 'online' ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}>
                          {hostDetails.available}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Uptime:</span>
                        <span>{formatUptime(hostDetails.uptime)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Última Checagem:</span>
                        <span>{formatLastUpdate(hostDetails.lastCheck)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Grupos:</span>
                        <span>{hostDetails.groups.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Templates:</span>
                        <span>{hostDetails.templates.length}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="dashboard-card">
                  <h4 className="font-medium mb-3">Grupos do Host</h4>
                  <div className="flex flex-wrap gap-2">
                    {hostDetails.groups.map((group, index) => (
                      <Badge key={index} variant="outline">{group}</Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="metrics" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {hostDetails.currentMetrics.map((metric) => (
                    <div key={metric.itemId} className="dashboard-card">
                      <div className="flex items-center space-x-3 mb-2">
                        {getMetricIcon(metric.type)}
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-sm truncate">{metric.name}</h5>
                          <p className="text-xs text-muted-foreground truncate">{metric.key}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold">
                          {metric.value} <span className="text-sm font-normal text-muted-foreground">{metric.units}</span>
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatLastUpdate(metric.lastUpdate)}
                      </p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="alerts" className="space-y-4">
                {hostDetails.activeAlerts.length > 0 ? (
                  <div className="space-y-3">
                    {hostDetails.activeAlerts.map((alert) => (
                      <div key={alert.id} className="dashboard-card">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="font-medium text-sm">{alert.description}</h5>
                            <p className="text-xs text-muted-foreground mt-1">
                              Última mudança: {formatLastUpdate(alert.lastChange)}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getSeverityColor(alert.severity)}>
                              {alert.severity}
                            </Badge>
                            <Badge variant="outline">
                              {alert.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum alerta ativo para este host
                  </div>
                )}
              </TabsContent>

              <TabsContent value="checks" className="space-y-4">
                <div className="dashboard-card">
                  <h4 className="font-medium mb-4">Todas as Checagens ({hostDetails.currentMetrics.length})</h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {hostDetails.currentMetrics.map((metric) => (
                      <div key={metric.itemId} className="flex items-center justify-between p-3 border border-border/50 rounded-lg hover:bg-muted/5">
                        <div className="flex items-center space-x-3">
                          {getMetricIcon(metric.type)}
                          <div>
                            <p className="font-medium text-sm">{metric.name}</p>
                            <p className="text-xs text-muted-foreground">{metric.key}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{metric.value} {metric.units}</p>
                          <p className="text-xs text-muted-foreground">{formatLastUpdate(metric.lastUpdate)}</p>
                        </div>
                      </div>
                    ))}
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