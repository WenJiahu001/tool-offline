<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Copy, Check, RotateCcw, ShieldCheck, ShieldAlert, Key, Sparkles } from 'lucide-vue-next'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'
import { parseJwt, type JwtParsedResult } from '../utils/jwt-tools'
import { stringToBase64 } from '../utils/base64-tools'

const {
  errorMessage,
  successMessage,
  clearMessages,
  showError,
  showSuccess,
} = useToolFeedback()

const jwtToken = ref('')
const signatureSecret = ref('')
const tokenCopied = ref(false)
const headerCopied = ref(false)
const payloadCopied = ref(false)

// 解析状态
const parsedJwt = ref<JwtParsedResult | null>(null)
const signatureStatus = ref<'unchecked' | 'verified' | 'mismatched'>('unchecked')

// 格式化日期
const formatDate = (timestamp: number) => {
  try {
    return new Date(timestamp * 1000).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  } catch {
    return '无效日期'
  }
}

// 格式化持续时间
const formatDuration = (seconds: number) => {
  if (seconds < 60) return `${seconds} 秒`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} 分钟`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时 ${minutes % 60} 分钟`
  const days = Math.floor(hours / 24)
  return `${days} 天 ${hours % 24} 小时`
}

// 过期计算
const expirationInfo = computed(() => {
  if (!parsedJwt.value || !parsedJwt.value.success || !parsedJwt.value.payload?.exp) {
    return null
  }
  const exp = parsedJwt.value.payload.exp
  const now = Math.floor(Date.now() / 1000)
  const diff = exp - now
  const dateStr = formatDate(exp)

  if (diff < 0) {
    return {
      expired: true,
      text: `已过期`,
      timeStr: dateStr,
      detail: `已过期 ${formatDuration(Math.abs(diff))}`
    }
  } else {
    return {
      expired: false,
      text: `未过期`,
      timeStr: dateStr,
      detail: `剩余 ${formatDuration(diff)}`
    }
  }
})

// 签名验证
const verifySignature = async () => {
  if (!jwtToken.value || !parsedJwt.value || !parsedJwt.value.success || !signatureSecret.value) {
    signatureStatus.value = 'unchecked'
    return
  }

  const parts = jwtToken.value.trim().split('.')
  if (parts.length !== 3) {
    signatureStatus.value = 'unchecked'
    return
  }

  try {
    const alg = parsedJwt.value.header?.alg || 'HS256'
    if (alg !== 'HS256') {
      showError(`签名校验当前仅支持 HS256 对称算法，当前 Token 算法为 ${alg}`)
      signatureStatus.value = 'unchecked'
      return
    }

    const dataText = `${parts[0]}.${parts[1]}`
    const secretText = signatureSecret.value

    // 原生 Web Crypto API HMAC-SHA256 校验
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secretText)
    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const signatureBuffer = await window.crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      encoder.encode(dataText)
    )
    const binString = Array.from(new Uint8Array(signatureBuffer), byte => String.fromCharCode(byte)).join('')
    const calculatedSignature = btoa(binString)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')

    if (calculatedSignature === parts[2]) {
      signatureStatus.value = 'verified'
      showSuccess('签名验证成功')
    } else {
      signatureStatus.value = 'mismatched'
      showError('签名校验失败：密钥错误或 Token 已被篡改')
    }
  } catch (error) {
    showError(`签名验证计算失败: ${(error as Error).message}`)
    signatureStatus.value = 'unchecked'
  }
}

// 监听 Token 输入解析
const handleTokenInput = () => {
  clearMessages()
  signatureStatus.value = 'unchecked'

  const token = jwtToken.value.trim()
  if (!token) {
    parsedJwt.value = null
    return
  }

  const result = parseJwt(token)
  parsedJwt.value = result

  if (!result.success) {
    showError(result.error || 'JWT 格式非法')
  } else {
    // 若输入了密钥则顺便校验签名
    if (signatureSecret.value) {
      verifySignature()
    }
  }
}

// 监听密钥改变自动重新校验
watch(signatureSecret, () => {
  if (signatureSecret.value) {
    verifySignature()
  } else {
    signatureStatus.value = 'unchecked'
  }
})

// 复制代码
const copyContent = async (content: string, type: 'token' | 'header' | 'payload') => {
  if (!content) return
  try {
    await navigator.clipboard.writeText(content)
    if (type === 'token') {
      tokenCopied.value = true
      setTimeout(() => { tokenCopied.value = false }, 2000)
    } else if (type === 'header') {
      headerCopied.value = true
      setTimeout(() => { headerCopied.value = false }, 2000)
    } else if (type === 'payload') {
      payloadCopied.value = true
      setTimeout(() => { payloadCopied.value = false }, 2000)
    }
    showSuccess('复制成功')
  } catch {
    showError('复制失败')
  }
}

// JSON 高亮展示
const highlightedHeader = computed(() => {
  if (!parsedJwt.value || !parsedJwt.value.header) return ''
  const jsonStr = JSON.stringify(parsedJwt.value.header, null, 2)
  return hljs.highlight(jsonStr, { language: 'json' }).value
})

const highlightedPayload = computed(() => {
  if (!parsedJwt.value || !parsedJwt.value.payload) return ''
  const jsonStr = JSON.stringify(parsedJwt.value.payload, null, 2)
  return hljs.highlight(jsonStr, { language: 'json' }).value
})

// 动态生成合法的本地校验示例 JWT
const loadExample = async () => {
  clearMessages()
  const header = { alg: 'HS256', typ: 'JWT' }
  const payload = {
    sub: 'localtools_user_123',
    name: '张三 (LocalTools)',
    admin: true,
    iat: Math.floor(Date.now() / 1000) - 1800, // 30 分钟前签发
    exp: Math.floor(Date.now() / 1000) + 86400 * 3, // 3 天后过期
  }
  const secret = 'localtools_secret_key'

  try {
    const headerB64 = stringToBase64(JSON.stringify(header))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    const payloadB64 = stringToBase64(JSON.stringify(payload))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    const data = `${headerB64}.${payloadB64}`

    const encoder = new TextEncoder()
    const keyData = encoder.encode(secret)
    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const signatureBuffer = await window.crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      encoder.encode(data)
    )
    const binString = Array.from(new Uint8Array(signatureBuffer), byte => String.fromCharCode(byte)).join('')
    const signatureB64 = btoa(binString)
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

    jwtToken.value = `${data}.${signatureB64}`
    signatureSecret.value = secret
    handleTokenInput()
    showSuccess('示例 JWT 加载并成功在本地验证签名！')
  } catch (error) {
    showError(`加载示例失败: ${(error as Error).message}`)
  }
}

// 清空
const clearAll = () => {
  jwtToken.value = ''
  signatureSecret.value = ''
  parsedJwt.value = null
  signatureStatus.value = 'unchecked'
  clearMessages()
}

useSeoMeta({
  title: 'JWT 解析工具 - JSON Web Token 本地解码器 - LocalTools',
  description: '纯本地 JSON Web Token (JWT) 解析与解码工具。实时美化并高亮 Header 和 Payload，计算过期状态，支持本地 HMAC-SHA256 签名校验。',
  keywords: 'JWT解析, JWT解码, JSON Web Token, JWT校验, HS256, 密码学, 本地工具'
})
</script>

<template>
  <div class="px-6 py-8 max-w-6xl mx-auto">
    <ToolPageHeader
      title="JWT 解析工具"
      description="本地解码 JSON Web Token，提取 Header、Payload 并支持签名比对。所有解析都在本地进行，绝不上传服务器。"
    />

    <!-- 顶栏操作 -->
    <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
      <div class="flex items-center gap-2">
        <button
          @click="loadExample"
          class="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 rounded-lg transition-colors border border-indigo-100"
        >
          <Sparkles class="w-4 h-4" />
          加载校验示例
        </button>
      </div>
      <button
        @click="clearAll"
        class="px-3.5 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 bg-white"
      >
        <RotateCcw class="w-4 h-4" />
        清空
      </button>
    </div>

    <!-- 消息提示 -->
    <ToolFeedback
      :error="errorMessage"
      :success="successMessage"
      @close-error="errorMessage = ''"
      @close-success="successMessage = ''"
    />

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- 左侧：输入框 + 签名校验 -->
      <div class="lg:col-span-5 space-y-6">
        <!-- JWT 粘贴区 -->
        <div class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div class="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <span class="text-sm font-semibold text-gray-700">粘贴 JWT Token</span>
            <button
              v-if="jwtToken"
              @click="copyContent(jwtToken, 'token')"
              class="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
            >
              <Check v-if="tokenCopied" class="w-3 h-3" />
              <Copy v-else class="w-3 h-3" />
              复制
            </button>
          </div>
          <textarea
            v-model="jwtToken"
            @input="handleTokenInput"
            placeholder="在此粘贴您的 JWT Token (格式：Header.Payload.Signature)..."
            class="w-full h-80 p-4 font-mono text-sm resize-none focus:outline-none leading-relaxed text-gray-800"
            spellcheck="false"
          ></textarea>
        </div>

        <!-- 签名校验卡片 -->
        <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
          <div>
            <h3 class="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Key class="w-4 h-4 text-indigo-600" />
              HS256 签名校验 (本地计算)
            </h3>
            <p class="text-xs text-gray-400 mt-1">
              如果在下方输入 Secret 密钥，系统将在浏览器本地使用 HMAC-SHA256 重新计算签名以比对真伪。
            </p>
          </div>

          <div>
            <input
              v-model="signatureSecret"
              type="password"
              placeholder="输入 Signature 校验密钥 (Secret)..."
              class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
            />
          </div>

          <!-- 验证结果展示 -->
          <div v-if="signatureSecret && parsedJwt?.success" class="pt-1">
            <div
              v-if="signatureStatus === 'verified'"
              class="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-green-50 border border-green-200 text-green-800 text-xs font-semibold"
            >
              <ShieldCheck class="w-4 h-4 text-green-600 shrink-0" />
              签名校验成功！数据安全且未被篡改。
            </div>
            <div
              v-else-if="signatureStatus === 'mismatched'"
              class="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs font-semibold"
            >
              <ShieldAlert class="w-4 h-4 text-red-600 shrink-0" />
              签名校验失败！密钥错误或内容已被更改。
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：解析结果展示 -->
      <div class="lg:col-span-7 space-y-6">
        <!-- 暂无数据提示 -->
        <div
          v-if="!parsedJwt || !parsedJwt.success"
          class="bg-white border border-gray-200 rounded-xl p-16 text-center text-gray-400 shadow-sm"
        >
          <Key class="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p class="text-sm">等待输入合法的 JWT Token 进行本地解码</p>
          <p class="text-xs text-gray-300 mt-1">您可以点击左上方“加载校验示例”直接预览解析样式</p>
        </div>

        <div v-else class="space-y-6">
          <!-- 状态与关键声明面板 -->
          <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- 基本信息 -->
            <div class="space-y-2 text-xs">
              <h4 class="font-bold text-gray-500 uppercase tracking-wider">Token 信息</h4>
              <div class="flex items-center gap-2">
                <span class="text-gray-400">加密算法 (alg):</span>
                <span class="font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-semibold">
                  {{ parsedJwt.header?.alg || '未知' }}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-gray-400">Token 类型 (typ):</span>
                <span class="font-mono text-gray-700 font-medium">
                  {{ parsedJwt.header?.typ || '未知' }}
                </span>
              </div>
            </div>

            <!-- 过期状态 -->
            <div v-if="expirationInfo" class="space-y-2 border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-4 text-xs">
              <h4 class="font-bold text-gray-500 uppercase tracking-wider">过期状态</h4>
              <div class="flex items-center gap-2">
                <span class="text-gray-400">状态：</span>
                <span
                  :class="[
                    'font-bold px-2 py-0.5 rounded',
                    expirationInfo.expired ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                  ]"
                >
                  {{ expirationInfo.text }}
                </span>
              </div>
              <div class="text-gray-500 mt-1">
                {{ expirationInfo.detail }}
              </div>
            </div>
          </div>

          <!-- Header JSON -->
          <div class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div class="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">Header (头部)</span>
              <button
                @click="copyContent(JSON.stringify(parsedJwt.header, null, 2), 'header')"
                class="text-xs text-indigo-600 hover:text-indigo-700 font-semibold transition-colors flex items-center gap-1"
              >
                <Check v-if="headerCopied" class="w-3 h-3" />
                <Copy v-else class="w-3 h-3" />
                复制 Header
              </button>
            </div>
            <pre class="p-4 overflow-x-auto text-xs font-mono bg-gray-50/20"><code v-html="highlightedHeader" class="hljs json"></code></pre>
          </div>

          <!-- Payload JSON -->
          <div class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div class="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">Payload (载荷)</span>
              <button
                @click="copyContent(JSON.stringify(parsedJwt.payload, null, 2), 'payload')"
                class="text-xs text-indigo-600 hover:text-indigo-700 font-semibold transition-colors flex items-center gap-1"
              >
                <Check v-if="payloadCopied" class="w-3 h-3" />
                <Copy v-else class="w-3 h-3" />
                复制 Payload
              </button>
            </div>
            <pre class="p-4 overflow-x-auto text-xs font-mono bg-gray-50/20"><code v-html="highlightedPayload" class="hljs json"></code></pre>
          </div>

          <!-- Signature -->
          <div class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col text-xs">
            <div class="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
              <span class="font-bold text-gray-500 uppercase tracking-wider">Signature (签名密文)</span>
            </div>
            <div class="p-4 font-mono break-all text-gray-500 leading-relaxed bg-gray-50/20">
              {{ parsedJwt.signature || '无签名' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 💡 功能说明 -->
    <div class="mt-8 bg-indigo-50 rounded-xl p-4 border border-indigo-100">
      <h4 class="text-sm font-bold text-indigo-800 mb-2">💡 功能说明</h4>
      <ul class="text-xs text-indigo-700 space-y-1.5 leading-relaxed">
        <li>• <strong>Header 头部</strong>：定义了 Token 类型及签名算法名称。</li>
        <li>• <strong>Payload 载荷</strong>：承载的核心数据声明（如用户 ID、权限以及重要的过期时间 `exp`）。</li>
        <li>• <strong>过期校验</strong>：系统实时计算 `exp` 声明时间，帮您精准把握 Token 还有多久到期。</li>
        <li>• <strong>签名比对</strong>：允许在浏览器本地输入密钥（Secret）进行 HS256 对称签名的动态校验，数据安全不外泄。</li>
        <li>• <strong>代码高亮</strong>：借助 `highlight.js` 将 JSON 进行语义美化着色，提升可读性。</li>
      </ul>
    </div>
  </div>
</template>

<style>
/* 确保高亮代码背景与面板协调 */
.hljs {
  background: transparent !important;
  padding: 0 !important;
}
</style>
