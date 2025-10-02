/*
 * Copyright 2024-2026 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import service from '@/utils/request'
import { get } from '@/utils/request'
export interface McpTool {
  id: string
  name: string
  description?: string
  parameters?: any
  service_id: string
}

class McpService {
  /**
   * 获取MCP服务列表
   */
  async getServices(): Promise<McpService[]> {
    return get('/api/mcp/services')
  }

  /**
   * 获取MCP服务详情
   */
  async getService(id: string): Promise<McpService> {
    return get(`/api/mcp/services/${id}`)
  }

  /**
   * 启用MCP服务
   */
  async enableService(id: string): Promise<void> {
    await service.post(`/api/mcp/services/${id}/enable`)
  }

  /**
   * 禁用MCP服务
   */
  async disableService(id: string): Promise<void> {
    await service.post(`/api/mcp/services/${id}/disable`)
  }

  /**
   * 获取服务的工具列表
   */
  async getServiceTools(serviceId: string): Promise<McpTool[]> {
    return get(`/api/mcp/services/${serviceId}/tools`)
  }

  /**
   * 执行MCP工具
   */
  async executeTool(serviceId: string, toolId: string, parameters: any): Promise<any> {
    return service.post(`/api/mcp/services/${serviceId}/tools/${toolId}/execute`, { parameters })
  }

  /**
   * 配置MCP服务
   */
  async configureService(id: string, config: any): Promise<McpService> {
    return service.put(`/api/mcp/services/${id}/config`, config)
  }
}

export default new McpService()