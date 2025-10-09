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

import { h, ref } from 'vue'
import { Button, Card, Flex, Typography } from 'ant-design-vue'
import {
  CheckCircleOutlined,
  IeOutlined,
  BgColorsOutlined,
  DotChartOutlined,
  LoadingOutlined,
} from '@ant-design/icons-vue'
import { ThoughtChain, type ThoughtChainProps, type ThoughtChainItem } from 'ant-design-x-vue'
import type { VNode } from 'vue'
import type { NormalNode, SiteInformation } from '@/types/node'
import MD from '@/components/md/index.vue'

interface ThoughtChainBuilderOptions {
  messageStore: {
    isEnd: (threadId: string) => boolean
    [key: string]: any
  }
  current: {
    deepResearchDetail: boolean
    threadId?: string
    [key: string]: any
  }
  onDeepResearch?: () => void
  onOpenDeepResearch?: (threadId: string) => void
}

export function useThoughtChainBuilder(options: ThoughtChainBuilderOptions) {
  const { messageStore, current, onDeepResearch, onOpenDeepResearch } = options

  const collapsible = ref(['backgroundInvestigator'])

  const onExpand = (keys: string[]) => {
    collapsible.value = keys
  }

  /**
   * 构建待处理节点的思考链
   */
  const buildPendingNodeThoughtChain = (jsonArray: any[]): VNode => {
    const items: ThoughtChainProps['items'] = [
      {
        title: '请稍后...',
        icon: h(LoadingOutlined),
        status: 'pending'
      }
    ]
    return h(
      Card,
      { style: { width: '500px', backgroundColor: '#EEF2F8' } },
      {
        default: () => h(ThoughtChain, { items })
      }
    )
  }

  /**
   * 构建开始研究的思考链
   */
  const buildStartDSThoughtChain = (jsonArray: any[]): VNode => {
    // 获取背景调查节点
    const backgroundInvestigatorNodeArray = jsonArray.filter((item) => item.nodeName === 'background_investigator')
    if (backgroundInvestigatorNodeArray.length === 0) {
      return buildPendingNodeThoughtChain(jsonArray)
    }

    const backgroundInvestigatorNode = backgroundInvestigatorNodeArray[0]
    const results = backgroundInvestigatorNode.siteInformation
    const markdownContent = results.map((result: any, index: number) => {
      return `${index + 1}. [${result.title}](${result.url})\n\n`
    }).join('\n')

    const items: ThoughtChainProps['items'] = [
      {
        status: 'error',
        title: '研究网站',
        icon: h(IeOutlined),
        key: 'backgroundInvestigator',
        extra: '',
        content: h(MD, { content: markdownContent }),
      },
      {
        status: 'success',
        title: '分析结果',
        icon: h(DotChartOutlined),
        extra: '',
      },
      {
        status: 'success',
        title: '生成报告',
        icon: h(BgColorsOutlined),
        description: h('i', {}, '只需要几分钟就可以准备好'),
        footer: h(
          Flex,
          { style: { marginLeft: 'auto' }, gap: 'middle' },
          {
            default: () => [
              messageStore.isEnd(backgroundInvestigatorNode.graphId.thread_id)
                ? h(Button, { type: 'link' }, () => '已完成')
                : h(Button, { type: 'primary', onClick: onDeepResearch }, () => '开始研究')
            ]
          }
        ),
        extra: '',
      },
    ]

    return h('div', {}, [
      h('p', {}, '这是该主题的研究方案。如果你需要进行更新，请告诉我。'),
      h(
        Card,
        { style: { width: '500px', backgroundColor: '#EEF2F8' } },
        {
          default: () => h(ThoughtChain, {
            items,
            collapsible: { expandedKeys: collapsible.value, onExpand }
          })
        }
      )
    ])
  }

  /**
   * 构建正在分析结果的思考链
   */
  const buildOnDSThoughtChain = (jsonArray: any[]): VNode => {
    // 获取背景调查节点
    const backgroundInvestigatorNodeArray = jsonArray.filter((item) => item.nodeName === 'background_investigator')
    if (backgroundInvestigatorNodeArray.length === 0 || !backgroundInvestigatorNodeArray[0].siteInformation) {
      return buildPendingNodeThoughtChain(jsonArray)
    }

    const backgroundInvestigatorNode = backgroundInvestigatorNodeArray[0]
    const results: SiteInformation[] = backgroundInvestigatorNode.siteInformation[0]
    const markdownContent = results.map((result: SiteInformation, index: number) => {
      return `${index + 1}. [${result.title}](${result.url})\n\n`
    }).join('\n')

    const items: ThoughtChainProps['items'] = [
      {
        status: 'error',
        title: '研究网站',
        icon: h(IeOutlined),
        key: 'backgroundInvestigator',
        extra: '',
        content: h(MD, { content: markdownContent }),
      },
      {
        status: 'pending',
        title: '正在分析结果',
        icon: h(LoadingOutlined),
        extra: '',
      }
    ]

    return h('div', {}, [
      h('p', {}, '这是该主题的研究方案。正在分析结果中...'),
      h(
        Card,
        { style: { width: '500px', backgroundColor: '#EEF2F8' } },
        {
          default: () => h(ThoughtChain, {
            items,
            collapsible: { expandedKeys: collapsible.value, onExpand }
          })
        }
      )
    ])
  }

  /**
   * 构建分析完成的思考链
   */
  const buildEndDSThoughtChain = (jsonArray: NormalNode[]): VNode | undefined => {
    const items: ThoughtChainProps['items'] = []

    // 获取背景调查节点
    const backgroundInvestigatorNode = jsonArray.filter((item) => item.nodeName === 'background_investigator')[0]
    if (backgroundInvestigatorNode && backgroundInvestigatorNode.siteInformation) {
      const results = backgroundInvestigatorNode.siteInformation
      const markdownContent = results.map((result: any, index: number) => {
        return `${index + 1}. [${result.title}](${result.url})\n\n`
      }).join('\n')

      const item: ThoughtChainItem = {
        status: 'error',
        title: '研究网站',
        icon: h(IeOutlined),
        key: 'backgroundInvestigator',
        extra: '',
        content: h(MD, { content: markdownContent }),
      }
      items.push(item)
    }

    // 分析结果节点
    const startNode = jsonArray.filter((item) => item.nodeName === '__START__')[0]
    const humanFeedbackNode = jsonArray.filter((item) => item.nodeName === 'human_feedback')[0]
    if (startNode || humanFeedbackNode) {
      const threadId = startNode ? startNode.graphId.thread_id : humanFeedbackNode.graphId.thread_id
      const completeItem: ThoughtChainItem = {
        status: 'success',
        title: '分析结果',
        icon: h(CheckCircleOutlined),
        footer: h(
          Flex,
          { style: { marginLeft: 'auto' }, gap: 'middle' },
          {
            default: () => [
              h(Button, {
                type: 'primary',
                onClick: () => onOpenDeepResearch?.(threadId)
              }, () => current.deepResearchDetail && current.threadId === threadId ? '关闭' : '打开')
            ]
          }
        ),
      }
      items.push(completeItem)
    }

    // 完成节点
    const endItem: ThoughtChainItem = {
      title: '完成',
      icon: h(CheckCircleOutlined),
      status: 'success'
    }

    items.push(endItem)
    return h('div', {}, [
      h('p', {}, '这是该主题的研究方案已完成，可以点击下载报告'),
      h(
        Card,
        { style: { width: '500px', backgroundColor: '#EEF2F8' } },
        {
          default: () => h(ThoughtChain, {
            items,
            collapsible: { expandedKeys: collapsible.value, onExpand }
          })
        }
      )
    ])
  }

  return {
    collapsible,
    onExpand,
    buildPendingNodeThoughtChain,
    buildStartDSThoughtChain,
    buildOnDSThoughtChain,
    buildEndDSThoughtChain,
  }
}