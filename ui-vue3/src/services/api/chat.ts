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
import { XStreamBody } from '@/utils/stream'

export interface ChatStreamRequest {
  query: string
  session_id: string
  enable_deepresearch?: boolean
  [key: string]: any
}

export interface ChatResumeRequest {
  feedback_content: string
  feedback: boolean
  session_id: string
  thread_id?: string
}

export interface ChatStopRequest {
  session_id: string
  thread_id?: string
}

export interface FileUploadRequest {
  files: File
  session_id: string
}

export interface ChatResponse {
  content: string
  thread_id?: string
}

class ChatService {
  private baseURL = import.meta.env.VITE_BASE_URL || ''

  /**
   * 发送聊天流式请求
   */
  async sendChatStream(
    data: ChatStreamRequest,
    onUpdate: (content: any) => void,
    onError: (error: any) => void
  ): Promise<string> {
    const xStreamBody = new XStreamBody('/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: data,
    })

    try {
      await xStreamBody.readStream((chunk: any) => {
        if (chunk) {
          onUpdate(chunk)
        }
      })
    } catch (e: any) {
      console.error('sendChatStream error:', e)
      onError(e.statusText)
    }

    return xStreamBody.content()
  }

  /**
   * 处理人类反馈的流式请求
   */
  async sendResumeStream(
    data: ChatResumeRequest,
    onUpdate: (content: any) => void,
    onError: (error: any) => void
  ): Promise<string> {
    const xStreamBody = new XStreamBody('/chat/resume', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: data,
    })

    try {
      await xStreamBody.readStream((chunk: any) => {
        if (chunk) {
          onUpdate(chunk)
        }
      })
    } catch (e: any) {
      console.error('sendResumeStream error:', e)
      onError(e.statusText)
    }

    return xStreamBody.content()
  }

  /**
   * 停止聊天请求
   */
  async stopChat(data: ChatStopRequest): Promise<string> {
    const response = await service.post('/chat/stop', data)
    return response.data
  }

  /**
   * 上传文件
   */
  async uploadFile(file: File, sessionId: string): Promise<any> {
    const formData = new FormData()
    formData.append('files', file, file.name)
    formData.append('session_id', sessionId)

    return service.post('/api/rag/user/batch-upload', formData, {
      timeout: 30000
    })
  }

  /**
   * 获取SSE测试流
   */
  async getTestStream(): Promise<ReadableStream> {
    const response = await fetch('/stream', {
      method: 'GET',
    })
    return response.body as ReadableStream
  }
}

export default new ChatService()