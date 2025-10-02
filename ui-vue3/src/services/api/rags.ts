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

export interface RagFileUpload {
  files: File
  session_id: string
}

export interface RagFile {
  uid: string
  name: string
  size: number
  type: string
  uploadTime: string
  status: 'success' | 'error' | 'uploading'
}

class RagService {
  /**
   * 批量上传文件到RAG系统
   */
  async batchUploadFiles(data: RagFileUpload): Promise<any> {
    const formData = new FormData()
    formData.append('files', data.files, data.files.name)
    formData.append('session_id', data.session_id)

    return service.post('/api/rag/user/batch-upload', formData, {
      timeout: 30000
    })
  }

  /**
   * 获取用户RAG文件列表
   */
  async getUserFiles(sessionId?: string): Promise<RagFile[]> {
    const params = sessionId ? { session_id: sessionId } : {}
    return service.get('/api/rag/user/files', { params })
  }

  /**
   * 删除RAG文件
   */
  async deleteFile(fileId: string, sessionId?: string): Promise<void> {
    const params = sessionId ? { session_id: sessionId } : {}
    await service.delete(`/api/rag/user/files/${fileId}`, { params })
  }

  /**
   * 获取RAG配置
   */
  async getRagConfig(): Promise<any> {
    return service.get('/api/rag/config')
  }

  /**
   * 更新RAG配置
   */
  async updateRagConfig(config: any): Promise<any> {
    return service.put('/api/rag/config', config)
  }
}

export default new RagService()