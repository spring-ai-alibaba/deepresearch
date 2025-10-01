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

import { ref } from 'vue'
import { message } from 'ant-design-vue'
import type { MessageInstance } from 'ant-design-vue/es/message/interface'
import { chatService } from '@/services'

interface FileUploadHandlerOptions {
  convId: string
  messageStore: any
  messageApi?: MessageInstance
}

export function useFileUploadHandler(options: FileUploadHandlerOptions) {
  const { convId, messageStore, messageApi = message } = options

  const headerOpen = ref(false)

  /**
   * 处理文件状态变化
   */
  const handleFileChange = ({ file, fileList }: any) => {
    console.log('handleFileChange', file)

    if (file.status === 'removed') {
      messageStore.removeUploadedFile(convId, file.uid)
      messageApi.success('文件已删除')
      return
    }

    if (file.status === 'done') {
      const uploadedFile = {
        uid: file.uid,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadTime: new Date().toISOString(),
        status: 'success' as const
      }
      messageStore.addUploadedFile(convId, uploadedFile)
      messageApi.success(`${file.name} 上传成功`)
    }
  }

  /**
   * 文件上传前的验证
   */
  const beforeUpload = (file: File): boolean => {
    // 检查文件类型
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/markdown'
    ]

    if (!allowedTypes.includes(file.type)) {
      messageApi.error('只支持 PDF、TXT、DOC、DOCX、MD 格式的文件')
      return false
    }

    // 检查文件大小（限制为 10MB）
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      messageApi.error('文件大小不能超过 10MB')
      return false
    }

    return true
  }

  /**
   * 处理文件上传
   */
  const handleFileUpload = async (options: any) => {
    const file = options.file as File

    try {
      const res = await chatService.uploadFile(file, convId)
      options.onSuccess?.(res)
    } catch (error: any) {
      console.error('文件上传失败:', error)

      // 根据错误类型显示不同的错误信息
      let errorMessage = `${file.name} 上传失败`

      if (error.code === 'ECONNABORTED') {
        errorMessage += '：请求超时'
      } else if (error.response?.status === 413) {
        errorMessage += '：文件过大'
      } else if (error.response?.status === 415) {
        errorMessage += '：不支持的文件格式'
      } else if (error.response?.data?.message) {
        errorMessage += `：${error.response.data.message}`
      }

      messageApi.error(errorMessage)
      options.onError?.(errorMessage)
    }
  }

  return {
    headerOpen,
    handleFileChange,
    beforeUpload,
    handleFileUpload,
  }
}