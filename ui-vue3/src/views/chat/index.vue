<!--
  ~ Licensed to the Apache Software Foundation (ASF) under one or more
  ~ contributor license agreements.  See the NOTICE file distributed with
  ~ this work for additional information regarding copyright ownership.
  ~ The ASF licenses this file to You under the Apache License, Version 2.0
  ~ (the "License"); you may not use this file except in compliance with
  ~ the License.  You may obtain a copy of the License at
  ~
  ~     http://www.apache.org/licenses/LICENSE-2.0
  ~
  ~ Unless required by applicable law or agreed to in writing, software
  ~ distributed under the License is distributed on an "AS IS" BASIS,
  ~ WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  ~ See the License for the specific language governing permissions and
  ~ limitations under the License.
-->
<template>
  <div class="__container_chat_index">
    <Flex class="body" gap="middle">
      <Flex class="chat" vertical gap="middle" :style="{ width: current.deepResearchDetail ? '40%' : '100%' }" align="center">
        <div
          ref="scrollContainer"
          align="center"
          class="bubble-list"
          v-show="bubbleList.length > 0"
        >
          <Bubble.List style="min-height: 85%" :roles="roles" :items="bubbleList"> </Bubble.List>
          <Gap height="100px" />
        </div>
        <Flex v-show="bubbleList.length === 0" class="bubble-list" justify="center" align="center">
          <div class="welcome">
            <span class="gradient-text">{{ $t('welcome') }}, {{ username }}</span>
          </div>
        </Flex>
        <div class="sender-wrapper">
          <sender
            class-name="sender"
            :header="headerNode"
            :autoSize="{ minRows: 2, maxRows: 3 }"
            :loading="senderLoading"
            v-model:value="content"
            @submit="submitHandle"
            :actions="false"
            placeholder="type an issue"
          >
            <template
              #footer="{
                info: {
                  components: { SendButton, LoadingButton, ClearButton },
                },
              }"
            >
              <Flex justify="space-between" align="center">
                <Flex align="center">
                  <a-button size="small" style="border-radius: 15px" type="text" @click="headerOpen = !headerOpen">
                      <LinkOutlined />
                  </a-button>

                  <a-switch
                    un-checked-children="极速模式"
                    checked-children="深度模式"
                    v-model:checked="current.deepResearch"
                  ></a-switch>
                </Flex>
                <Flex>
                  <component :is="ClearButton" />
                  <component
                    :is="LoadingButton"
                    v-if="senderLoading"
                    type="default"
                    style="display: block"
                    @click="stopHandle"
                  >
                    <template #icon>
                      <Spin size="small" />
                    </template>
                  </component>
                  <component
                    :is="SendButton"
                    v-else
                    :icon="h(SendOutlined)"
                    shape="default"
                    type="text"
                    :style="{ color: token.colorPrimary }"
                    :disabled="false"
                  />
                </Flex>
              </Flex>
            </template>
          </sender>
        </div>
      </Flex>
      <Report :visible="current.deepResearchDetail" :threadId="current.threadId" :convId="convId" @close="current.deepResearchDetail = false" />
    </Flex>
  </div>
</template>

<script setup lang="tsx">
import { Button, Card, Flex, Spin, theme, Typography, message } from 'ant-design-vue'
import {
  CheckCircleOutlined,
  GlobalOutlined,
  LinkOutlined,
  SendOutlined,
  IeOutlined,
  BgColorsOutlined,
  DotChartOutlined,
  LoadingOutlined,
  UserOutlined,
  CloudUploadOutlined,
} from '@ant-design/icons-vue'
import {
  Attachments,
  Bubble,
  type BubbleListProps,
  type MessageStatus,
  Sender,
  ThoughtChain,
  type ThoughtChainItem,
  useXAgent,
  useXChat,
} from 'ant-design-x-vue'
import { computed, h, onMounted, reactive, ref, watch } from 'vue'
import type { JSX } from 'vue/jsx-runtime'
import MD from '@/components/md/index.vue'
import Gap from '@/components/toolkit/Gap.vue'
import Report from '@/components/report/index.vue'
import { ScrollController } from '@/utils/scroll'
import { useAuthStore } from '@/store/AuthStore'
import { useMessageStore } from '@/store/MessageStore'
import { useConversationStore } from '@/store/ConversationStore'
import { useRoute, useRouter } from 'vue-router'
import { useConfigStore } from '@/store/ConfigStore'
import { parseJsonTextStrict } from '@/utils/jsonParser';
import type { NormalNode, SiteInformation } from '@/types/node';
import type { MessageState } from '@/types/message';
import { chatService } from '@/services'
import { useThoughtChainBuilder } from '@/composables/useThoughtChainBuilder'
import { useMessageParser } from '@/composables/useMessageParser'
import { useFileUploadHandler } from '@/composables/useFileUploadHandler'
import { useChat } from '@/composables/useChat'

const router = useRouter()
const route = useRoute()
const conversationStore = useConversationStore()
const configStore = useConfigStore()
const messageStore = useMessageStore()

// TODO 是否有更好的方式，发送消息之后才启动一个新的会话
let convId = route.params.convId as string
if (!convId) {
  const { key } = conversationStore.newOne()
  router.push(`/chat/${key}`)
}

const { useToken } = theme
const { token } = useToken()
const username = useAuthStore().token

// 定义消息列表角色配置
const roles: BubbleListProps['roles'] = {
  ai: {
    placement: 'start',
    avatar: {
        icon: <GlobalOutlined />,
        shape: 'square',
        style: { background: 'linear-gradient(to right, #f67ac4, #6b4dee)' },
      },
    style: {
      maxWidth: '100%',
    },
    rootClassName: 'ai',
  },
  local: {
    placement: 'end',
    shape: 'corner',
    avatar: {
        icon: <UserOutlined />,
        style: {},
      },
    rootClassName: 'local',
  }
}

// 设置当前会话信息
messageStore.convId = convId
let current = messageStore.current
if (!current) {
  current = reactive({} as MessageState)
  if (convId) {
    messageStore.currentState[convId] = current
  }
}

// 使用思考链构建器 composable
const thoughtChainBuilder = useThoughtChainBuilder({
  messageStore,
  current,
  onDeepResearch: startDeepResearch,
  onOpenDeepResearch: openDeepResearch
})

const {
  collapsible,
  onExpand,
  buildPendingNodeThoughtChain,
  buildStartDSThoughtChain,
  buildOnDSThoughtChain,
  buildEndDSThoughtChain
} = thoughtChainBuilder

// 使用消息解析器 composable
const messageParser = useMessageParser({
  messageStore,
  current
})

const {
  parseLoadingMessage,
  parseSuccessMessage,
  parseMessage,
  parseFooter,
  findNode
} = messageParser

// 使用Chat composable
const { senderLoading, onRequest, messages } = useChat({
  convId,
  current,
  messageStore
})

// 使用文件上传处理器 composable
const fileUploadHandler = useFileUploadHandler({
  convId,
  messageStore
})

const {
  headerOpen,
  handleFileChange,
  beforeUpload,
  handleFileUpload
} = fileUploadHandler

// 定义发送消息的内容
const content = ref('')

const submitHandle = (nextContent: any) => {
  current.aiType = 'normal'
  messageStore.nextAIType()

  // 自动接受，需要再转为下一个状态
  if(configStore.chatConfig.auto_accepted_plan){
    messageStore.nextAIType()
  }
  onRequest(nextContent)
  content.value = ''
  conversationStore.updateTitle(convId, nextContent)
}

const stopHandle = async () => {
  try {
    await chatService.stopChat({
      session_id: convId,
      thread_id: current.threadId,
    })
    message.success('停止成功')
  } catch (error: any) {
    console.error('停止失败:', error)
    message.error('停止失败')
  }
}

// 开始研究
function startDeepResearch() {
  messageStore.nextAIType()
  onRequest('开始研究')
}

function openDeepResearch(threadId: string) {
  current.threadId = threadId
  current.deepResearchDetail = !current.deepResearchDetail
}

// 重写parseSuccessMessage以避免循环依赖
const parseSuccessMessageRef = (msg: string) => {
  const result = parseSuccessMessage(msg)
  switch (result?.type) {
    case 'chat':
      return result.content
    case 'termination':
      current.deepResearchDetail = false
      return result.content
    case 'startDS':
      return buildStartDSThoughtChain(result.data || [])
    case 'endDS':
      return buildEndDSThoughtChain(result.data || [])
    default:
      return ''
  }
}

// 重写parseMessage以使用本地函数
const parseMessageRef = (status: MessageStatus, msg: string): any => {
  switch (status) {
    // 人类信息
    case 'local':
      return msg
    case 'loading': {
      const result = parseLoadingMessage(msg)
      switch (result?.type) {
        case 'pending':
          return buildPendingNodeThoughtChain(result.data)
        case 'onDS':
          return buildOnDSThoughtChain(result.data)
        default:
          return buildPendingNodeThoughtChain([])
      }
    }
    case 'success':
      return parseSuccessMessageRef(msg)
    case 'error':
      return msg
    default:
      return ''
  }
}

// 初始化消息
if (convId) {
  const his_messages = messageStore.history[convId]
  if (his_messages) {
    messages.value = his_messages as any
  }
}

// 消息列表
const bubbleList = computed(() => {
  let isError = false
  for(const item of messages.value) {
    if(item.status === 'error') {
      isError = true
    }
  }
  // 避免异常，导致整个消息列表被覆盖
  if(isError) {
    return []
  }
  messageStore.history[convId] = messages.value
  return messages.value.map(({id, status, message}, idx) => {
      return {
        key: idx,
        role: status === 'local' ? 'local' : 'ai',
        content: parseMessageRef(status, message),
        footer: parseFooter(status),
      }
  })
})

const headerNode = computed(() => {
  const filesList = messageStore.uploadedFiles?.[convId] || []
  return (
    <Sender.Header title="上传文件" open={headerOpen.value} onOpenChange={v => headerOpen.value = v}>
      <Attachments items={filesList} overflow="scrollX" onChange={handleFileChange} beforeUpload={beforeUpload} customRequest={handleFileUpload} placeholder={(type) => type === 'drop'
              ? {
                title: '点击或拖拽文件到这里上传',
              }
              : {
                icon: <CloudUploadOutlined />,
                title: '点击上传文件',
                description: '支持上传PDF、TXT、DOC、DOCX、MD等文件',
              }}/>
    </Sender.Header>
  )
})

const scrollContainer = ref<Element | any>(null)
const sc = new ScrollController()

onMounted(() => {
  sc.init(scrollContainer)
})

watch(
  () => messages.value,
  (o, n) => {
    sc.init(scrollContainer)
    sc.fresh()
  },
  { deep: true }
)
</script>

<style lang="less" scoped>
.__container_chat_index {
  width: 100%;
  height: 100%;
  box-sizing: border-box;

  .body {
    height: 100%;
    box-sizing: border-box;
  }

  .chat {
    padding-top: 20px;
    padding-bottom: 120px;
    height: 100%;
    box-sizing: border-box;
    position: relative;
    transition: width 0.3s ease, margin 0.3s ease, padding 0.3s ease;

    .bubble-list {
      width: 100%;
      overflow-y: auto;
      min-height: calc(100vh - 280px);
      max-height: calc(100vh - 280px);
    }

    :deep(.ant-card) {
      border-radius: 20px;
    }

    :deep(.ant-bubble-content-wrapper) {
      .bubble-footer {
        font-size: 18px;
        font-weight: bolder;
        padding-left: 16px;

        .toggle-bubble-footer {
          display: none !important;
        }
      }
    }

    :deep(.ant-bubble-content-wrapper:hover .bubble-footer .toggle-bubble-footer) {
      display: flex !important;
    }

    :deep(.ant-bubble) {
      &.ai .ant-bubble-content {
        padding-right: 40px;
        text-align: left;
        background: none !important;
        margin-top: -10px;
      }

      .ant-avatar {
        border-radius: 5px;
        border: none;
      }
    }

    :deep(.ant-sender-actions-btn) {
      box-shadow: none;
    }

    :deep(.ant-bubble-list) {
      max-width: 750px;
      width: 100%;
      overflow: hidden !important;
    }

    .sender-wrapper {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      box-sizing: border-box;
      max-width: 750px;
      width: 100%;
      z-index: 10;

      .tag-deep-research {
        cursor: pointer;

        &unchecked {
          background: #fff;
        }
      }
    }

    .sender {
      border-radius: 18px;

      &:focus-within:after {
        border-width: 1px;
        border-color: white;
      }
    }

    .welcome {
      font-size: 32px;
      font-weight: 500;

      .gradient-text {
        background: linear-gradient(to right, #f67ac4, #6b4dee); /* 渐变背景 */
        -webkit-background-clip: text; /* 裁剪背景到文本 */
        -webkit-text-fill-color: transparent; /* 文本填充透明 */
        background-clip: text; /* 标准属性 */
      }
    }
  }
}
</style>