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

export interface Report {
  id: string
  title: string
  content: string
  threadId: string
  sessionId: string
  createdAt: string
  updatedAt: string
}

export interface ReportNode {
  nodeName: string
  content: any
  graphId: {
    thread_id: string
  }
  siteInformation?: Array<{
    title: string
    url: string
  }>
}

class ReportService {
  /**
   * 获取研究报告
   */
  async getReport(threadId: string): Promise<Report> {
    return get(`/api/reports/${threadId}`)
  }

  /**
   * 获取报告节点数据
   */
  async getReportNodes(threadId: string): Promise<ReportNode[]> {
    return get(`/api/reports/${threadId}/nodes`)
  }

  /**
   * 导出报告为PDF
   */
  async exportPDF(threadId: string): Promise<Blob> {
    const response = await service.get(`/api/reports/${threadId}/export/pdf`, {
      responseType: 'blob'
    })
    return response.data
  }

  /**
   * 导出报告为Markdown
   */
  async exportMarkdown(threadId: string): Promise<string> {
    return get(`/api/reports/${threadId}/export/markdown`)
  }

  /**
   * 保存报告
   */
  async saveReport(threadId: string, data: Partial<Report>): Promise<Report> {
    return service.put(`/api/reports/${threadId}`, data)
  }

  /**
   * 删除报告
   */
  async deleteReport(threadId: string): Promise<void> {
    await service.delete(`/api/reports/${threadId}`)
  }

  /**
   * 获取报告列表
   */
  async getReportList(sessionId?: string): Promise<Report[]> {
    const params = sessionId ? { session_id: sessionId } : {}
    return get('/api/reports', { params })
  }
}

export default new ReportService()