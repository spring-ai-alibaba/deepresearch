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

import type { MessageStatus } from 'ant-design-x-vue'
import type { NormalNode } from '@/types/node'
import { parseJsonTextStrict } from '@/utils/jsonParser'

interface MessageParserOptions {
  messageStore: any
  current: any
}

export function useMessageParser(options: MessageParserOptions) {
  const { messageStore, current } = options

  /**
   * 查找指定名称的节点
   */
  const findNode = (jsonArray: NormalNode[], nodeName: string): NormalNode | undefined => {
    return jsonArray.filter((item) => item.nodeName === nodeName)[0]
  }

  /**
   * 解析 status = loading 的消息
   */
  const parseLoadingMessage = (msg: string): any => {
    // 准备开始研究
    const jsonArray = parseJsonTextStrict(msg)
    if (!jsonArray || jsonArray.length === 0) {
      return { type: 'pending', data: jsonArray }
    }

    // 深度研究模式，需要设置 threadId 并且打开 report 面板
    const coordinatorNode = jsonArray.filter((item) => item.nodeName === 'coordinator')[0]
    if (coordinatorNode && coordinatorNode.content) {
      current.threadId = coordinatorNode.graphId.thread_id
      current.deepResearchDetail = true
    }

    const report = messageStore.report[jsonArray[0].graphId.thread_id]
    if (!report) {
      return { type: 'pending', data: jsonArray }
    }

    // 如果已经有数据，则渲染思维链 
    // TODO 性能问题
    const backgroundInvestigatorNode = report.filter((item: any) => item.nodeName === 'background_investigator')[0]
    if (backgroundInvestigatorNode) {
      return { type: 'onDS', data: [backgroundInvestigatorNode] }
    }

    return { type: 'pending', data: jsonArray }
  }

  /**
   * 解析 status = success 的消息
   */
  const parseSuccessMessage = (msg: string) => {
    // 解析完整数据
    const jsonArray: NormalNode[] = parseJsonTextStrict(msg)

    // 闲聊模式
    const coordinatorNode = findNode(jsonArray, 'coordinator')
    if (coordinatorNode && !coordinatorNode.content) {
      const endNode = findNode(jsonArray, '__END__')
      return { type: 'chat', content: endNode?.content.output }
    }

    // 用户终止
    const endNode = findNode(jsonArray, '__END__')
    if (endNode && endNode.content.reason === '用户终止') {
      current.deepResearchDetail = false
      return { type: 'termination', content: endNode.content.reason }
    }

    // 需要用户反馈
    if (!endNode) {
      return { type: 'startDS', data: jsonArray }
    }

    // 人类恢复模式或者直接 end 模式
    const humanFeedbackNode = findNode(jsonArray, 'human_feedback')
    if (humanFeedbackNode || endNode) {
      return { type: 'endDS', data: jsonArray }
    }
  }

  /**
   * 解析消息记录
   * status === local 表示人类 loading表示stream流正在返回  success表示stream完成返回
   * msg  当status === loading的时候，返回stream流的chunk  当status === success的时候，返回所有chunk的拼接字符串
   */
  const parseMessage = (status: MessageStatus, msg: string): any => {
    switch (status) {
      // 人类信息
      case 'local':
        return msg
      case 'loading':
        return parseLoadingMessage(msg)
      case 'success':
        return parseSuccessMessage(msg)
      case 'error':
        return msg
      default:
        return ''
    }
  }

  /**
   * 解析消息底部操作区域
   */
  const parseFooter = (status: MessageStatus): any => {
    switch (status) {
      case 'success':
        return ''
      default:
        return ''
    }
  }

  return {
    findNode,
    parseLoadingMessage,
    parseSuccessMessage,
    parseMessage,
    parseFooter,
  }
}