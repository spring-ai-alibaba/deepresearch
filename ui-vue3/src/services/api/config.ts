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
import { get, put } from '@/utils/request'

export interface ChatConfig {
  model?: string
  temperature?: number
  max_tokens?: number
  auto_accepted_plan?: boolean
  enable_deepresearch?: boolean
  [key: string]: any
}

export interface SystemConfig {
  api_keys: {
    dashscope?: string
    tavily?: string
    jina?: string
    aliyun_ai_search?: string
  }
  search_engines: {
    tavily?: boolean
    jina?: boolean
    baidu?: boolean
    serpapi?: boolean
    aliyun_ai_search?: boolean
  }
  export_path?: string
  redis_password?: string
}

class ConfigService {
  /**
   * 获取聊天配置
   */
  async getChatConfig(): Promise<ChatConfig> {
    return get('/api/config/chat')
  }

  /**
   * 更新聊天配置
   */
  async updateChatConfig(config: ChatConfig): Promise<ChatConfig> {
    return put('/api/config/chat', config)
  }

  /**
   * 获取系统配置
   */
  async getSystemConfig(): Promise<SystemConfig> {
    return get('/api/config/system')
  }

  /**
   * 更新系统配置
   */
  async updateSystemConfig(config: SystemConfig): Promise<SystemConfig> {
    return put('/api/config/system', config)
  }

  /**
   * 获取API密钥状态
   */
  async getApiKeyStatus(): Promise<{ [key: string]: boolean }> {
    return get('/api/config/keys/status')
  }

  /**
   * 测试API连接
   */
  async testApiConnection(keyType: string, apiKey: string): Promise<{ success: boolean; message: string }> {
    return service.post('/api/config/keys/test', { key_type: keyType, api_key: apiKey })
  }
}

export default new ConfigService()