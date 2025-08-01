import { useMemo } from 'react';
import { CriticalMetrics } from '@/services/zabbixService';

export interface PredictionResult {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number; // 0-100
  etaMinutes: number | null; // estimated time to issue
  factors: string[];
  recommendation: string;
  lastUpdate: string;
}

export const useInstabilityPrediction = (data: any): PredictionResult => {
  return useMemo(() => {
    if (!data || !data.metrics) {
      return {
        riskLevel: 'low' as const,
        riskScore: 0,
        etaMinutes: null,
        factors: [],
        recommendation: 'Sem dados suficientes para análise',
        lastUpdate: new Date().toISOString()
      };
    }

    const { ping, latency, cpu, memory } = data.metrics;
    
    // Se não há dados suficientes, retorna risco baixo
    if (ping.length === 0 && latency.length === 0 && cpu.length === 0 && memory.length === 0) {
      return {
        riskLevel: 'low' as const,
        riskScore: 5,
        etaMinutes: null,
        factors: ['Métricas insuficientes para análise'],
        recommendation: 'Monitoramento insuficiente detectado',
        lastUpdate: new Date().toISOString()
      };
    }

    let riskScore = 0;
    const factors: string[] = [];
    let etaMinutes: number | null = null;

    // 1️⃣ Análise de Ping / Disponibilidade (peso: 40 pontos)
    // Busca por perda de pacotes nos últimos 5-10 minutos
    if (ping.length > 0) {
      const recentPing = ping.slice(-20); // Últimos 20 registros para análise de tendência
      const last5Minutes = recentPing.slice(-5); // Últimos 5 minutos críticos
      
      // Calcular % de perda de pacotes
      const pingFailures = last5Minutes.filter((p: any) => p.value === 0).length;
      const pingLossPercentage = (pingFailures / last5Minutes.length) * 100;
      
      // Detectar quedas recentes
      const consecutiveFailures = last5Minutes.reverse().findIndex((p: any) => p.value === 1);
      const isDownNow = last5Minutes[0]?.value === 0;
      
      if (isDownNow && consecutiveFailures >= 3) {
        riskScore += 40;
        factors.push(`Host offline há ${consecutiveFailures} intervalos consecutivos`);
        etaMinutes = 0; // Já está em problema
      } else if (pingLossPercentage >= 60) {
        riskScore += 35;
        factors.push(`Perda crítica de conectividade (${pingLossPercentage.toFixed(0)}%)`);
        etaMinutes = 2;
      } else if (pingLossPercentage >= 40) {
        riskScore += 25;
        factors.push(`Perda alta de conectividade (${pingLossPercentage.toFixed(0)}%)`);
        etaMinutes = 5;
      } else if (pingLossPercentage >= 20) {
        riskScore += 15;
        factors.push(`Perda moderada de conectividade (${pingLossPercentage.toFixed(0)}%)`);
        etaMinutes = 15;
      } else if (pingLossPercentage > 0) {
        riskScore += 5;
        factors.push(`Perda esporádica detectada (${pingLossPercentage.toFixed(0)}%)`);
      }
    }

    // 2️⃣ Análise de Latência (peso: 30 pontos)
    // Detecta picos súbitos de latência que indicam instabilidade
    if (latency.length > 0) {
      const recentLatency = latency.slice(-10);
      const avgLatency = recentLatency.reduce((sum: number, l: any) => sum + l.value, 0) / recentLatency.length;
      const maxLatency = Math.max(...recentLatency.map((l: any) => l.value));
      const minLatency = Math.min(...recentLatency.map((l: any) => l.value));
      
      // Calcular variação % nos últimos minutos
      const latencyVariation = avgLatency > 0 ? ((maxLatency - minLatency) / avgLatency) * 100 : 0;
      
      // Detectar picos de latência (valores > 2x a média)
      const latencySpikes = recentLatency.filter((l: any) => l.value > avgLatency * 2).length;
      
      if (maxLatency > 2000) { // > 2 segundos = crítico
        riskScore += 30;
        factors.push(`Latência crítica detectada (${maxLatency.toFixed(0)}ms)`);
        etaMinutes = Math.min(etaMinutes || 300, 5);
      } else if (maxLatency > 1000) { // > 1 segundo = alto
        riskScore += 20;
        factors.push(`Latência muito alta (${maxLatency.toFixed(0)}ms)`);
        etaMinutes = Math.min(etaMinutes || 300, 10);
      } else if (latencySpikes >= 5) { // Muitos picos = instabilidade
        riskScore += 15;
        factors.push(`Instabilidade de latência (${latencySpikes} picos detectados)`);
        etaMinutes = Math.min(etaMinutes || 300, 30);
      } else if (latencyVariation > 200) { // Variação muito alta
        riskScore += 10;
        factors.push(`Latência instável (variação de ${latencyVariation.toFixed(0)}%)`);
        etaMinutes = Math.min(etaMinutes || 300, 60);
      } else if (avgLatency > 500) { // Latência base alta
        riskScore += 5;
        factors.push(`Latência elevada (média: ${avgLatency.toFixed(0)}ms)`);
      }
    }

    // 3️⃣ Análise de CPU (peso: 15 pontos)
    // Uso de CPU acima de thresholds críticos
    if (cpu.length > 0) {
      const recentCpu = cpu.slice(-5); // Últimos 5 minutos
      const avgCpu = recentCpu.reduce((sum: number, c: any) => sum + c.value, 0) / recentCpu.length;
      const maxCpu = Math.max(...recentCpu.map((c: any) => c.value));
      
      // Detectar CPU sustentada vs picos
      const highCpuCount = recentCpu.filter((c: any) => c.value > 80).length;
      
      if (avgCpu > 95) {
        riskScore += 15;
        factors.push(`CPU crítica sustentada (${avgCpu.toFixed(1)}%)`);
        etaMinutes = Math.min(etaMinutes || 300, 10);
      } else if (avgCpu > 90) {
        riskScore += 12;
        factors.push(`CPU muito alta (${avgCpu.toFixed(1)}%)`);
        etaMinutes = Math.min(etaMinutes || 300, 20);
      } else if (highCpuCount >= 3) {
        riskScore += 8;
        factors.push(`CPU frequentemente alta (${highCpuCount}/5 intervalos > 80%)`);
        etaMinutes = Math.min(etaMinutes || 300, 60);
      } else if (maxCpu > 85) {
        riskScore += 5;
        factors.push(`Picos de CPU detectados (máx: ${maxCpu.toFixed(1)}%)`);
      }
    }

    // 4️⃣ Análise de Memória (peso: 15 pontos)
    // Uso de memória acima de thresholds críticos
    if (memory.length > 0) {
      const recentMemory = memory.slice(-5);
      const avgMemory = recentMemory.reduce((sum: number, m: any) => sum + m.value, 0) / recentMemory.length;
      const maxMemory = Math.max(...recentMemory.map((m: any) => m.value));
      
      // Detectar memória sustentada vs picos
      const highMemoryCount = recentMemory.filter((m: any) => m.value > 85).length;
      
      if (avgMemory > 98) {
        riskScore += 15;
        factors.push(`Memória crítica (${avgMemory.toFixed(1)}%)`);
        etaMinutes = Math.min(etaMinutes || 300, 15);
      } else if (avgMemory > 95) {
        riskScore += 12;
        factors.push(`Memória muito alta (${avgMemory.toFixed(1)}%)`);
        etaMinutes = Math.min(etaMinutes || 300, 30);
      } else if (highMemoryCount >= 3) {
        riskScore += 8;
        factors.push(`Memória frequentemente alta (${highMemoryCount}/5 intervalos > 85%)`);
        etaMinutes = Math.min(etaMinutes || 300, 90);
      } else if (maxMemory > 90) {
        riskScore += 5;
        factors.push(`Picos de memória detectados (máx: ${maxMemory.toFixed(1)}%)`);
      }
    }

    // Classificação de risco (verde, amarelo, laranja, vermelho)
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    let recommendation: string;

    if (riskScore >= 80) {
      riskLevel = 'critical';
      recommendation = 'CRÍTICO: Intervenção imediata necessária - sistema instável';
    } else if (riskScore >= 50) {
      riskLevel = 'high';
      recommendation = 'ALTO: Monitoramento intensivo e ação preventiva recomendada';
    } else if (riskScore >= 25) {
      riskLevel = 'medium';
      recommendation = 'MÉDIO: Atenção requerida - monitorar tendências';
    } else {
      riskLevel = 'low';
      recommendation = 'BAIXO: Sistema operando dentro dos parâmetros normais';
    }

    return {
      riskLevel,
      riskScore: Math.min(100, riskScore), // Cap at 100
      etaMinutes,
      factors,
      recommendation,
      lastUpdate: new Date().toISOString()
    };
  }, [data]);
};