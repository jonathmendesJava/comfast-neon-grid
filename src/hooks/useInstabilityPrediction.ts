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

export const useInstabilityPrediction = (metrics: CriticalMetrics | null): PredictionResult => {
  return useMemo(() => {
    if (!metrics || !metrics.ping.length) {
      return {
        riskLevel: 'low',
        riskScore: 0,
        etaMinutes: null,
        factors: [],
        recommendation: 'Aguardando dados...',
        lastUpdate: new Date().toISOString()
      };
    }

    const { ping, latency, cpu, memory } = metrics;
    
    // Get recent data (last 15 minutes)
    const now = Date.now();
    const recent15min = now - (15 * 60 * 1000);
    const recent5min = now - (5 * 60 * 1000);
    
    const recentPing = ping.filter(p => p.timestamp >= recent15min);
    const recentLatency = latency.filter(l => l.timestamp >= recent15min);
    const recentCpu = cpu.filter(c => c.timestamp >= recent15min);
    
    const veryRecentPing = ping.filter(p => p.timestamp >= recent5min);
    
    let riskScore = 0;
    const factors: string[] = [];
    let etaMinutes: number | null = null;
    
    // Ping analysis - most critical factor
    if (recentPing.length > 0) {
      const pingFailures = recentPing.filter(p => p.value === 0).length;
      const pingFailureRate = pingFailures / recentPing.length;
      
      if (pingFailureRate >= 0.5) {
        riskScore += 60;
        factors.push('Alto índice de falhas de ping');
        etaMinutes = 2; // Critical - likely to fail soon
      } else if (pingFailureRate >= 0.3) {
        riskScore += 40;
        factors.push('Falhas intermitentes de ping');
        etaMinutes = 5;
      } else if (pingFailureRate > 0) {
        riskScore += 20;
        factors.push('Falhas ocasionais de ping');
      }
      
      // Check for consecutive failures in very recent data
      if (veryRecentPing.length >= 3) {
        const lastThreePings = veryRecentPing.slice(-3);
        const consecutiveFailures = lastThreePings.every(p => p.value === 0);
        
        if (consecutiveFailures) {
          riskScore += 30;
          factors.push('3+ falhas consecutivas de ping');
          etaMinutes = Math.min(etaMinutes || 1, 1);
        }
      }
    }
    
    // Latency analysis
    if (recentLatency.length > 0) {
      const avgLatency = recentLatency.reduce((sum, l) => sum + l.value, 0) / recentLatency.length;
      const maxLatency = Math.max(...recentLatency.map(l => l.value));
      
      if (avgLatency > 200) {
        riskScore += 25;
        factors.push(`Latência média alta (${avgLatency.toFixed(1)}ms)`);
        etaMinutes = etaMinutes ? Math.min(etaMinutes, 10) : 10;
      } else if (avgLatency > 100) {
        riskScore += 15;
        factors.push(`Latência elevada (${avgLatency.toFixed(1)}ms)`);
      }
      
      if (maxLatency > 500) {
        riskScore += 20;
        factors.push(`Picos de latência extrema (${maxLatency.toFixed(1)}ms)`);
      }
      
      // Check for increasing latency trend
      if (recentLatency.length >= 5) {
        const firstHalf = recentLatency.slice(0, Math.floor(recentLatency.length / 2));
        const secondHalf = recentLatency.slice(Math.floor(recentLatency.length / 2));
        
        const firstAvg = firstHalf.reduce((sum, l) => sum + l.value, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, l) => sum + l.value, 0) / secondHalf.length;
        
        if (secondAvg > firstAvg * 1.3) {
          riskScore += 15;
          factors.push('Tendência de aumento na latência');
          etaMinutes = etaMinutes ? Math.min(etaMinutes, 15) : 15;
        }
      }
    }
    
    // CPU analysis
    if (recentCpu.length > 0) {
      const avgCpu = recentCpu.reduce((sum, c) => sum + c.value, 0) / recentCpu.length;
      const maxCpu = Math.max(...recentCpu.map(c => c.value));
      
      if (avgCpu > 90) {
        riskScore += 20;
        factors.push(`CPU crítica (${avgCpu.toFixed(1)}%)`);
        etaMinutes = etaMinutes ? Math.min(etaMinutes, 20) : 20;
      } else if (avgCpu > 80) {
        riskScore += 10;
        factors.push(`CPU alta (${avgCpu.toFixed(1)}%)`);
      }
      
      if (maxCpu > 95) {
        riskScore += 15;
        factors.push(`Picos de CPU extrema (${maxCpu.toFixed(1)}%)`);
      }
    }
    
    // Memory analysis (if available)
    if (recentCpu.length > 0 && memory.length > 0) {
      const recentMemory = memory.filter(m => m.timestamp >= recent15min);
      if (recentMemory.length > 0) {
        const avgMemory = recentMemory.reduce((sum, m) => sum + m.value, 0) / recentMemory.length;
        
        if (avgMemory > 90) {
          riskScore += 15;
          factors.push(`Memória crítica (${avgMemory.toFixed(1)}%)`);
        } else if (avgMemory > 85) {
          riskScore += 8;
          factors.push(`Memória alta (${avgMemory.toFixed(1)}%)`);
        }
      }
    }
    
    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (riskScore >= 80) {
      riskLevel = 'critical';
    } else if (riskScore >= 50) {
      riskLevel = 'high';
    } else if (riskScore >= 25) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'low';
    }
    
    // Generate recommendation
    let recommendation: string;
    if (riskLevel === 'critical') {
      recommendation = 'AÇÃO IMEDIATA: Verificar conectividade e recursos do host';
    } else if (riskLevel === 'high') {
      recommendation = 'Monitorar de perto e considerar manutenção preventiva';
    } else if (riskLevel === 'medium') {
      recommendation = 'Acompanhar evolução das métricas';
    } else {
      recommendation = 'Sistema operando normalmente';
    }
    
    return {
      riskLevel,
      riskScore: Math.min(riskScore, 100),
      etaMinutes,
      factors,
      recommendation,
      lastUpdate: new Date().toISOString()
    };
    
  }, [metrics]);
};