import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, RefreshCw, Activity, AlertTriangle, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PredictionCard } from "@/components/dashboard/PredictionCard";
import { PredictionLoadingCard } from "@/components/dashboard/PredictionLoadingCard";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner";
import { useZabbixHosts } from "@/hooks/useZabbixData";
import { useInstabilityPrediction } from "@/hooks/useInstabilityPrediction";
import { zabbixService, CriticalHistoryResponse } from "@/services/zabbixService";

export default function Prediction() {
  const navigate = useNavigate();
  const [selectedHost, setSelectedHost] = useState<string>('');
  const [timeRange, setTimeRange] = useState<string>('1h');
  
  const { data: hosts, isLoading: hostsLoading } = useZabbixHosts();
  
  // Query for critical history data
  const { data: criticalData, isLoading: criticalLoading, refetch } = useQuery({
    queryKey: ['critical-history', selectedHost, timeRange],
    queryFn: () => zabbixService.getCriticalHistory(selectedHost, timeRange),
    enabled: !!selectedHost,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 15000, // Consider data stale after 15 seconds
  });

  const prediction = useInstabilityPrediction(criticalData?.metrics || null);
  
  // Auto-select first host when hosts are loaded
  useEffect(() => {
    if (hosts && hosts.length > 0 && !selectedHost) {
      setSelectedHost(hosts[0].id);
    }
  }, [hosts, selectedHost]);

  const selectedHostData = hosts?.find(h => h.id === selectedHost);

  const handleRefresh = () => {
    refetch();
  };

  if (hostsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/')}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Activity className="w-6 h-6 text-primary" />
                  Previsão de Instabilidade
                </h1>
                <p className="text-sm text-muted-foreground">
                  Análise preditiva de problemas de conectividade
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">1 hora</SelectItem>
                  <SelectItem value="6h">6 horas</SelectItem>
                  <SelectItem value="24h">24 horas</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={criticalLoading}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${criticalLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Host Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Seleção de Host
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Select value={selectedHost} onValueChange={setSelectedHost}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um host para análise" />
                  </SelectTrigger>
                  <SelectContent>
                    {hosts?.map((host) => (
                      <SelectItem key={host.id} value={host.id}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            host.available === 'online' ? 'bg-status-online' : 
                            host.available === 'offline' ? 'bg-status-offline' : 'bg-status-unknown'
                          }`} />
                          {host.name} ({host.host})
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedHostData && (
                <Badge variant={
                  selectedHostData.available === 'online' ? 'outline' : 
                  selectedHostData.available === 'offline' ? 'destructive' : 'secondary'
                }>
                  {selectedHostData.available === 'online' ? 'Online' : 
                   selectedHostData.available === 'offline' ? 'Offline' : 'Desconhecido'}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedHost && (
          <>
            {/* Prediction Summary */}
            <div className="grid gap-6 mb-6">
              {criticalLoading ? (
                <PredictionLoadingCard />
              ) : (
                <PredictionCard 
                  prediction={prediction} 
                  hostName={selectedHostData?.name}
                />
              )}
            </div>

            <Separator className="my-6" />

            {/* Charts Section */}
            {criticalLoading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : criticalData ? (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">Métricas Críticas - Últimas {timeRange}</h2>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Ping Status Chart */}
                  {criticalData.metrics.ping.length > 0 && (
                    <TrendChart
                      title="Status de Ping"
                      data={criticalData.metrics.ping}
                      unit="status"
                      color="#22c55e"
                      height={250}
                    />
                  )}

                  {/* Latency Chart */}
                  {criticalData.metrics.latency.length > 0 && (
                    <TrendChart
                      title="Latência de Ping"
                      data={criticalData.metrics.latency}
                      unit="ms"
                      color="#3b82f6"
                      warningThreshold={100}
                      criticalThreshold={200}
                      height={250}
                    />
                  )}

                  {/* CPU Chart */}
                  {criticalData.metrics.cpu.length > 0 && (
                    <TrendChart
                      title="Uso de CPU"
                      data={criticalData.metrics.cpu}
                      unit="%"
                      color="#f59e0b"
                      warningThreshold={80}
                      criticalThreshold={90}
                      height={250}
                    />
                  )}

                  {/* Memory Chart */}
                  {criticalData.metrics.memory.length > 0 && (
                    <TrendChart
                      title="Uso de Memória"
                      data={criticalData.metrics.memory}
                      unit="%"
                      color="#8b5cf6"
                      warningThreshold={85}
                      criticalThreshold={95}
                      height={250}
                    />
                  )}
                </div>

                {/* Summary Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Resumo da Análise</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-foreground">
                          {criticalData.metrics.ping.length}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Pontos de Ping
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-foreground">
                          {criticalData.metrics.latency.length}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Pontos de Latência
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-foreground">
                          {prediction.riskScore}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Score de Risco
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-foreground">
                          {prediction.factors.length}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Fatores de Risco
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum dado disponível</h3>
                  <p className="text-muted-foreground">
                    Não foi possível carregar os dados críticos para este host.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}