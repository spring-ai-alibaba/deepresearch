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

import { ref, type Ref } from 'vue'
import { useXAgent, useXChat } from 'ant-design-x-vue'
import { chatService } from '@/services'
import { useConfigStore } from '@/store/ConfigStore'

interface ChatOptions {
  convId: string
  current: any
  messageStore: any
}

interface ChatReturn {
  senderLoading: Ref<boolean>
  agent: any
  onRequest: (message: string) => void
  messages: Ref<any[]>
  sendChatStream: (message: string | undefined, onUpdate: (content: any) => void, onError: (error: any) => void) => Promise<string>
  sendResumeStream: (message: string | undefined, onUpdate: (content: any) => void, onError: (error: any) => void) => Promise<string>
}

export function useChat(options: ChatOptions): ChatReturn {
  const { convId, current, messageStore } = options
  const configStore = useConfigStore()
  const senderLoading = ref(false)

  /**
   * 处理发送消息的请求
   */
  const sendChatStream = async (
    message: string | undefined,
    onUpdate: (content: any) => void,
    onError: (error: any) => void
  ): Promise<string> => {
    try {
      return await chatService.sendChatStream({
        ...configStore.chatConfig,
        enable_deepresearch: current.deepResearch,
        query: message!,
        session_id: convId
      }, (chunk: any) => {
        if (chunk) {
          messageStore.addReport(chunk)
        }
        onUpdate(chunk)
      }, onError)
    } catch (e: any) {
      console.error('sendChatStream', e)
      onError(e.statusText)
      return ''
    }
  }

  /**
   * 处理人类反馈的请求
   */
  const sendResumeStream = async (
    message: string | undefined,
    onUpdate: (content: any) => void,
    onError: (error: any) => void
  ): Promise<string> => {
    try {
      return await chatService.sendResumeStream({
        feedback_content: message!,
        feedback: true,
        session_id: convId,
        thread_id: current.threadId,
      }, (chunk: any) => {
        if (chunk) {
          messageStore.addReport(chunk)
        }
        onUpdate(chunk)
      }, onError)
    } catch (e: any) {
      console.error('sendResumeStreamError', e)
      onError(e.statusText)
      return ''
    }
  }

  /**
   * 定义 agent
   */
  const [agent] = useXAgent({
    request: async ({ message }, { onSuccess, onUpdate, onError }) => {
      senderLoading.value = true
      let content = ''

      try {
        switch (current.aiType) {
          case 'normal':
          case 'startDS': {
            content = await sendChatStream(message, onUpdate, onError)
            break
          }

          case 'onDS': {
            content = await (
              configStore.chatConfig.auto_accepted_plan
                ? sendChatStream(message, onUpdate, onError)
                : sendResumeStream(message, onUpdate, onError)
            )
            break
          }

          default: {
            onError(new Error(`未知的 aiType: ${current.aiType}`))
            return
          }
        }

        // 最后会返回本次stream的所有内容
        // 将字符串内容转换为符合期望类型的格式
        // const result = [{ content }] as any
        onSuccess(content as any)
      } catch (error) {
        onError(error instanceof Error ? error : new Error(String(error)))
      } finally {
        senderLoading.value = false
      }
    },
  })

  const { onRequest, messages } = useXChat({
    agent: agent.value,
    requestPlaceholder: 'Waiting...',
    requestFallback: 'Failed return. Please try again later.',
  })

  return {
    senderLoading,
    agent,
    onRequest,
    messages,
    sendChatStream,
    sendResumeStream,
  }
}