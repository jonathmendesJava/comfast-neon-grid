import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ZabbixRequest {
  jsonrpc: string
  method: string
  params: any
  auth?: string
  id: number
}

interface ZabbixResponse {
  jsonrpc: string
  result?: any
  error?: {
    code: number
    message: string
    data: string
  }
  id: number
}

class ZabbixAPI {
  private baseUrl: string
  private token: string
  private authToken: string | null = null

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
    this.token = token
  }

  private async makeRequest(method: string, params: any = {}): Promise<any> {
    const requestData: ZabbixRequest = {
      jsonrpc: '2.0',
      method,
      params,
      id: Date.now(),
    }

    // Add auth token if available and not for user.login
    if (this.authToken && method !== 'user.login') {
      requestData.auth = this.authToken
    }

    console.log(`Making Zabbix request: ${method}`)
    
    const response = await fetch(`${this.baseUrl}api_jsonrpc.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: ZabbixResponse = await response.json()
    
    if (data.error) {
      console.error('Zabbix API error:', data.error)
      throw new Error(`Zabbix API error: ${data.error.message}`)
    }

    return data.result
  }

  async authenticate(): Promise<boolean> {
    try {
      console.log('Authenticating with Zabbix using API token...')
      
      // Try to authenticate using the API token directly
      // For API tokens, we can test with a simple method call
      this.authToken = this.token
      
      // Test the token by making a simple API call
      await this.makeRequest('user.get', { output: ['userid'] })
      
      console.log('Authentication successful with API token')
      return true
    } catch (error) {
      console.error('Authentication failed:', error)
      this.authToken = null
      return false
    }
  }

  async getHosts(): Promise<any[]> {
    try {
      if (!this.authToken) {
        await this.authenticate()
      }

      const hosts = await this.makeRequest('host.get', {
        output: ['hostid', 'host', 'name', 'status', 'available'],
        selectInterfaces: ['ip', 'dns', 'port'],
        selectGroups: ['name'],
        sortfield: 'name'
      })

      return hosts.map((host: any) => ({
        id: host.hostid,
        name: host.name || host.host,
        host: host.host,
        status: host.status === '0' ? 'enabled' : 'disabled',
        // Fix: Zabbix available field - '0' = online, '1' = offline, '2' = unknown
        available: host.available === '0' ? 'online' : 'offline',
        ip: host.interfaces?.[0]?.ip || 'N/A',
        dns: host.interfaces?.[0]?.dns || 'N/A',
        groups: host.groups?.map((g: any) => g.name) || []
      }))
    } catch (error) {
      console.error('Error fetching hosts:', error)
      throw error
    }
  }

  async getAlerts(): Promise<any[]> {
    try {
      if (!this.authToken) {
        await this.authenticate()
      }

      const triggers = await this.makeRequest('trigger.get', {
        output: ['triggerid', 'description', 'priority', 'lastchange', 'value'],
        selectHosts: ['name'],
        filter: {
          value: 1, // Only active triggers
          status: 0  // Only enabled triggers
        },
        sortfield: 'priority',
        sortorder: 'DESC',
        limit: 50
      })

      return triggers.map((trigger: any) => ({
        id: trigger.triggerid,
        title: trigger.description,
        host: trigger.hosts?.[0]?.name || 'Unknown',
        severity: this.mapPriority(trigger.priority),
        timestamp: new Date(parseInt(trigger.lastchange) * 1000).toISOString(),
        description: trigger.description,
        acknowledged: false // Default for now
      }))
    } catch (error) {
      console.error('Error fetching alerts:', error)
      throw error
    }
  }

  async getMetrics(hostIds?: string[]): Promise<any[]> {
    try {
      if (!this.authToken) {
        await this.authenticate()
      }

      // Get all hosts with status info if no specific IDs provided
      const hosts = hostIds ? 
        await this.makeRequest('host.get', {
          output: ['hostid', 'name', 'host', 'status', 'available'],
          selectInterfaces: ['ip'],
          hostids: hostIds
        }) :
        await this.makeRequest('host.get', {
          output: ['hostid', 'name', 'host', 'status', 'available'],
          selectInterfaces: ['ip'],
          limit: 10
        })

      const metrics = []

      for (const host of hosts) {
        // Get comprehensive system metrics for this host
        const items = await this.makeRequest('item.get', {
          output: ['itemid', 'name', 'key_', 'lastvalue', 'units', 'lastclock', 'value_type'],
          hostids: host.hostid,
          monitored: true,
          filter: {
            value_type: [0, 3] // Numeric values only
          },
          limit: 100
        })

        // Filter for relevant metrics
        const relevantItems = items.filter((item: any) => {
          const key = item.key_.toLowerCase()
          return key.includes('cpu') || 
                 key.includes('memory') || 
                 key.includes('vm.memory') ||
                 key.includes('ping') ||
                 key.includes('uptime') ||
                 key.includes('vfs.fs') ||
                 key.includes('net.if') ||
                 key.includes('load') ||
                 key.includes('proc.num') ||
                 key.includes('swap')
        })

        for (const item of relevantItems) {
          const rawValue = parseFloat(item.lastvalue || '0')
          const normalizedValue = this.normalizeMetricValue(rawValue, item.key_, item.units)
          
          metrics.push({
            hostId: host.hostid,
            hostName: host.name,
            hostHost: host.host,
            hostStatus: host.status === '0' ? 'enabled' : 'disabled',
            // Fix: Zabbix available field - '0' = online, '1' = offline, '2' = unknown
            hostAvailable: host.available === '0' ? 'online' : 'offline',
            hostIp: host.interfaces?.[0]?.ip || 'N/A',
            itemId: item.itemid,
            name: item.name,
            key: item.key_,
            value: normalizedValue.value.toString(),
            units: normalizedValue.unit,
            type: this.getMetricType(item.key_),
            lastUpdate: item.lastclock ? new Date(parseInt(item.lastclock) * 1000).toISOString() : new Date().toISOString()
          })
        }
      }

      return metrics
    } catch (error) {
      console.error('Error fetching metrics:', error)
      throw error
    }
  }

  async getHistory(itemId: string, timeFrom: number, timeTill: number): Promise<any[]> {
    try {
      if (!this.authToken) {
        await this.authenticate()
      }

      const history = await this.makeRequest('history.get', {
        output: 'extend',
        itemids: itemId,
        time_from: timeFrom,
        time_till: timeTill,
        sortfield: 'clock',
        sortorder: 'ASC',
        limit: 1000
      })

      return history.map((entry: any) => ({
        timestamp: parseInt(entry.clock) * 1000,
        value: parseFloat(entry.value) || 0
      }))
    } catch (error) {
      console.error('Error fetching history:', error)
      throw error
    }
  }

  private mapPriority(priority: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (priority) {
      case '5': return 'critical'
      case '4': return 'high'
      case '3': return 'medium'
      case '2': return 'medium'
      case '1': return 'low'
      default: return 'low'
    }
  }

  private getMetricType(key: string): string {
    const lowerKey = key.toLowerCase()
    if (lowerKey.includes('cpu')) return 'cpu'
    if (lowerKey.includes('memory') || lowerKey.includes('vm.memory')) return 'memory'
    if (lowerKey.includes('ping') || lowerKey.includes('icmp')) return 'ping'
    if (lowerKey.includes('net.if')) return 'network'
    if (lowerKey.includes('vfs.fs') || lowerKey.includes('disk')) return 'disk'
    if (lowerKey.includes('uptime')) return 'uptime'
    if (lowerKey.includes('load')) return 'load'
    if (lowerKey.includes('proc.num')) return 'processes'
    if (lowerKey.includes('swap')) return 'swap'
    return 'other'
  }

  private normalizeMetricValue(value: number, key: string, units: string): { value: number; unit: string } {
    const lowerKey = key.toLowerCase()
    
    // CPU metrics - convert to percentage
    if (lowerKey.includes('cpu') && lowerKey.includes('util')) {
      return { value: Math.min(100, Math.max(0, value)), unit: '%' }
    }
    
    // Memory metrics
    if (lowerKey.includes('memory') || lowerKey.includes('vm.memory')) {
      if (units === 'B' && value > 1000000) {
        // Convert bytes to MB
        return { value: Math.round(value / 1024 / 1024 * 100) / 100, unit: 'MB' }
      }
      if (lowerKey.includes('pused') || lowerKey.includes('util')) {
        // Already in percentage
        return { value: Math.min(100, Math.max(0, value)), unit: '%' }
      }
    }
    
    // Network metrics - convert bytes to more readable units
    if (lowerKey.includes('net.if')) {
      if (units === 'bps' || units === 'B') {
        if (value > 1000000) {
          return { value: Math.round(value / 1000000 * 100) / 100, unit: 'Mbps' }
        } else if (value > 1000) {
          return { value: Math.round(value / 1000 * 100) / 100, unit: 'Kbps' }
        }
      }
    }
    
    // Disk metrics
    if (lowerKey.includes('vfs.fs')) {
      if (units === 'B' && value > 1000000000) {
        // Convert bytes to GB
        return { value: Math.round(value / 1024 / 1024 / 1024 * 100) / 100, unit: 'GB' }
      }
      if (lowerKey.includes('pused')) {
        // Already in percentage
        return { value: Math.min(100, Math.max(0, value)), unit: '%' }
      }
    }
    
    // Uptime - convert seconds to hours/days
    if (lowerKey.includes('uptime') && units === 's') {
      const hours = Math.floor(value / 3600)
      if (hours > 24) {
        const days = Math.floor(hours / 24)
        return { value: days, unit: 'days' }
      }
      return { value: hours, unit: 'hours' }
    }
    
    // Default: return as-is with original or simplified unit
    const cleanUnit = units || ''
    return { value: Math.round(value * 100) / 100, unit: cleanUnit }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get environment variables
    const ZABBIX_URL = Deno.env.get('ZABBIX_URL')
    const ZABBIX_TOKEN = Deno.env.get('ZABBIX_TOKEN')

    if (!ZABBIX_URL || !ZABBIX_TOKEN) {
      console.error('Missing environment variables:', { 
        hasUrl: !!ZABBIX_URL, 
        hasToken: !!ZABBIX_TOKEN 
      })
      return new Response(
        JSON.stringify({ 
          error: 'Missing Zabbix configuration. Please configure ZABBIX_URL and ZABBIX_TOKEN.' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body for action and parameters
    let action: string | null = null;
    let requestData: any = {};

    try {
      if (req.method === 'POST') {
        const body = await req.json();
        action = body.action;
        requestData = body;
      } else {
        // Fallback to URL parameters for GET requests
        const url = new URL(req.url);
        action = url.searchParams.get('action');
      }
    } catch (error) {
      // If body parsing fails, try URL parameters
      const url = new URL(req.url);
      action = url.searchParams.get('action');
    }

    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Missing action parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing action: ${action}`, requestData)

    const zabbix = new ZabbixAPI(ZABBIX_URL, ZABBIX_TOKEN)

    let result
    
    switch (action) {
      case 'get-hosts':
        result = await zabbix.getHosts()
        break
        
      case 'get-alerts':
        result = await zabbix.getAlerts()
        break
        
      case 'get-metrics':
        result = await zabbix.getMetrics(requestData.hostIds)
        break
        
      case 'get-history':
        if (!requestData.itemId || !requestData.timeFrom || !requestData.timeTill) {
          return new Response(
            JSON.stringify({ error: 'Missing required parameters: itemId, timeFrom, timeTill' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        result = await zabbix.getHistory(requestData.itemId, requestData.timeFrom, requestData.timeTill)
        break
        
      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in zabbix-proxy:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})