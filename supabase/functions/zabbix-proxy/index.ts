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
        available: host.available === '1' ? 'online' : 'offline',
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

      // Get all hosts if no specific IDs provided
      const hosts = hostIds ? 
        await this.makeRequest('host.get', {
          output: ['hostid', 'name'],
          hostids: hostIds
        }) :
        await this.makeRequest('host.get', {
          output: ['hostid', 'name'],
          limit: 10
        })

      const metrics = []

      for (const host of hosts) {
        // Get CPU, Memory and Ping items for this host
        const items = await this.makeRequest('item.get', {
          output: ['itemid', 'name', 'key_', 'lastvalue', 'units'],
          hostids: host.hostid,
          search: {
            key_: 'system.cpu.util,vm.memory.util,icmpping'
          },
          searchWildcardsEnabled: true,
          limit: 10
        })

        for (const item of items) {
          metrics.push({
            hostId: host.hostid,
            hostName: host.name,
            itemId: item.itemid,
            name: item.name,
            key: item.key_,
            value: item.lastvalue || '0',
            units: item.units || '',
            type: this.getMetricType(item.key_)
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
    if (key.includes('cpu')) return 'cpu'
    if (key.includes('memory') || key.includes('vm.memory')) return 'memory'
    if (key.includes('ping')) return 'ping'
    if (key.includes('net.if')) return 'network'
    if (key.includes('vfs.fs')) return 'disk'
    return 'other'
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