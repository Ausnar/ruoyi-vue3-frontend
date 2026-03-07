<template>
  <div class="login enhanced-login" ref="containerRef">
    <!-- 背景装饰（蓝白渐变 + 光斑） -->
    <div class="bg-blob blob-1"></div>
    <div class="bg-blob blob-2"></div>

    <!-- 玻璃卡片 -->
    <div
      class="glass-card"
      ref="cardRef"
      :class="{ expanded: expanded }"
      :style="cardTransformStyle"
      @mousemove="onMouseMove"
      @mouseenter="onMouseEnter"
      @mouseleave="onMouseLeave"
    >
      <div class="card-inner">
        <el-form
          ref="loginRef"
          :model="loginForm"
          :rules="loginRules"
          class="login-form"
          @submit.native.prevent
        >
          <h3 class="title">{{ title }}</h3>

          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              type="text"
              size="large"
              auto-complete="off"
              placeholder="账号"
              @focus="onFocus"
              @blur="onBlur"
            >
              <template #prefix>
                <svg-icon icon-class="user" class="el-input__icon input-icon" />
              </template>
            </el-input>
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              size="large"
              auto-complete="off"
              placeholder="密码"
              @keyup.enter="handleLogin"
              @focus="onFocus"
              @blur="onBlur"
            >
              <template #prefix>
                <svg-icon icon-class="password" class="el-input__icon input-icon" />
              </template>
            </el-input>
          </el-form-item>

          <el-form-item prop="code" v-if="captchaEnabled">
            <div class="code-row">
              <el-input
                v-model="loginForm.code"
                size="large"
                auto-complete="off"
                placeholder="验证码"
                @keyup.enter="handleLogin"
                @focus="onFocus"
                @blur="onBlur"
                style="flex:1;"
              >
                <template #prefix>
                  <svg-icon icon-class="validCode" class="el-input__icon input-icon" />
                </template>
              </el-input>
              <div class="login-code" @click="getCode" title="换一张">
                <img :src="codeUrl" class="login-code-img" alt="验证码" />
              </div>
            </div>
          </el-form-item>

          <div class="actions-row">
            <el-checkbox v-model="loginForm.rememberMe">记住密码</el-checkbox>
            <div class="register-link" v-if="register">
              <router-link class="link-type" :to="'/register'">立即注册</router-link>
            </div>
          </div>

          <el-form-item style="width:100%; margin-top:10px;">
            <el-button
              :loading="loading"
              size="large"
              type="primary"
              style="width:100%;"
              @click.prevent="handleLogin"
              class="login-btn"
            >
              <span v-if="!loading">登 录</span>
              <span v-else>登 录 中...</span>
            </el-button>
          </el-form-item>

          <div class="login-tip">欢迎回来 — 输入账号开始</div>
        </el-form>
      </div>
    </div>

    <!-- 页面底部文字 -->
    <div class="el-login-footer">{{ footerContent }}</div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, watch, computed } from "vue"
import { getCodeImg } from "@/api/login"
import Cookies from "js-cookie"
import { encrypt, decrypt } from "@/utils/jsencrypt"
import useUserStore from "@/store/modules/user"
import defaultSettings from "@/settings"
import { useRoute, useRouter } from "vue-router"

const title = import.meta.env.VITE_APP_TITLE || "系统登录"
const footerContent = defaultSettings.footerContent
const userStore = useUserStore()
const route = useRoute()
const router = useRouter()

/* --- 表单与规则（保留业务逻辑）--- */
const loginRef = ref(null)
const loginForm = reactive({
  username: "",
  password: "",
  rememberMe: false,
  code: "",
  uuid: ""
})
const loginRules = {
  username: [{ required: true, trigger: "blur", message: "请输入您的账号" }],
  password: [{ required: true, trigger: "blur", message: "请输入您的密码" }],
  code: [{ required: true, trigger: "change", message: "请输入验证码" }]
}
const codeUrl = ref("")
const loading = ref(false)
const captchaEnabled = ref(true)
const register = ref(false)
const redirect = ref(undefined)

watch(route, (newRoute) => {
  redirect.value = newRoute.query && newRoute.query.redirect
}, { immediate: true })

/* --- 登录逻辑 --- */
function handleLogin() {
  if (!loginRef.value) return
  loginRef.value.validate(valid => {
    if (valid) {
      loading.value = true
      if (loginForm.rememberMe) {
        Cookies.set("username", loginForm.username, { expires: 30 })
        Cookies.set("password", encrypt(loginForm.password), { expires: 30 })
        Cookies.set("rememberMe", loginForm.rememberMe, { expires: 30 })
      } else {
        Cookies.remove("username")
        Cookies.remove("password")
        Cookies.remove("rememberMe")
      }
      userStore.login(loginForm).then(() => {
        const query = route.query
        const otherQueryParams = Object.keys(query).reduce((acc, cur) => {
          if (cur !== "redirect") {
            acc[cur] = query[cur]
          }
          return acc
        }, {})
        router.push({ path: redirect.value || "/", query: otherQueryParams })
      }).catch(() => {
        loading.value = false
        if (captchaEnabled.value) getCode()
      })
    }
  })
}

function getCode() {
  getCodeImg().then(res => {
    captchaEnabled.value = res.captchaEnabled === undefined ? true : res.captchaEnabled
    if (captchaEnabled.value) {
      codeUrl.value = "data:image/gif;base64," + res.img
      loginForm.uuid = res.uuid
    }
  })
}

function getCookie() {
  const username = Cookies.get("username")
  const password = Cookies.get("password")
  const rememberMe = Cookies.get("rememberMe")
  loginForm.username = username === undefined ? loginForm.username : username
  loginForm.password = password === undefined ? loginForm.password : (password ? decrypt(password) : "")
  loginForm.rememberMe = rememberMe === undefined ? false : (rememberMe === "true" || rememberMe === true)
}

/* --- 视觉交互: 轻微动效实现 --- */
const containerRef = ref(null)
const cardRef = ref(null)
const expanded = ref(false)

// 若系统偏好“减少动效”则禁用，默认开启轻微动效
const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
const motionDisabled = ref(!!prefersReducedMotion) // true 如果用户偏好减少动效

// spring / follow params（轻微、平滑、不晃眼）
const params = {
  stiffness: 0.035, // 跟随弹性（较低，动作更柔和）
  damping: 0.28,    // 阻尼（较高，减少反弹）
  maxTilt: 3,       // 最大倾斜角度（度）
  targetScale: 0.008 // 最大缩放幅度（非常小）
}

const state = reactive({
  rx: 0, // 当前 rotateX
  ry: 0, // 当前 rotateY
  tx: 0, // 目标 rotateX
  ty: 0, // 目标 rotateY
  sx: 0  // 当前 scale offset
})

let vx = 0, vy = 0, vs = 0
let rafId = null

function animateSpring() {
  // 只在未禁用动效时运行动画循环
  if (motionDisabled.value) {
    rafId = requestAnimationFrame(animateSpring)
    return
  }

  // spring force toward target
  vx += (state.tx - state.rx) * params.stiffness
  vy += (state.ty - state.ry) * params.stiffness
  vs += ((expanded.value ? params.targetScale : 0) - state.sx) * (params.stiffness * 0.5)

  // damping
  vx *= (1 - params.damping)
  vy *= (1 - params.damping)
  vs *= (1 - params.damping * 0.85)

  // integrate
  state.rx += vx
  state.ry += vy
  state.sx += vs

  rafId = requestAnimationFrame(animateSpring)
}

onMounted(() => {
  getCode()
  getCookie()
  rafId = requestAnimationFrame(animateSpring)
})

onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId)
})

function onMouseMove(e) {
  if (motionDisabled.value) return
  const card = cardRef.value
  if (!card) return
  const rect = card.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  // 归一化到 [-1, 1]
  const rawDx = (e.clientX - cx) / (rect.width / 2)
  const rawDy = (e.clientY - cy) / (rect.height / 2)
  const dx = Math.max(-1, Math.min(1, rawDx))
  const dy = Math.max(-1, Math.min(1, rawDy))

  // 目标角度（非常小）
  state.tx = dy * params.maxTilt
  state.ty = -dx * params.maxTilt
}

function onMouseEnter() { if (!motionDisabled.value) expanded.value = true }
function onMouseLeave() {
  if (motionDisabled.value) return
  expanded.value = false
  state.tx = 0
  state.ty = 0
}
function onFocus() { if (!motionDisabled.value) expanded.value = true }
function onBlur() {
  if (motionDisabled.value) return
  setTimeout(() => { if (!containerRef.value.matches(":hover")) expanded.value = false }, 120)
}

const cardTransformStyle = computed(() => {
  if (motionDisabled.value) {
    return { transform: "none" }
  }
  // clamp 输出角度，避免极端值
  const clamp = (v) => Math.max(-params.maxTilt, Math.min(params.maxTilt, v))
  const rx = clamp(state.rx).toFixed(3)
  const ry = clamp(state.ry).toFixed(3)
  const scale = (1 + state.sx).toFixed(4)
  const translateY = (Math.abs(state.rx) / 40).toFixed(3) // 平移非常小
  return {
    transform: `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(${-translateY}px) scale(${scale})`
  }
})
</script>

<style lang="scss" scoped>
/* ===== 蓝白渐变主题样式（更偏蓝、更柔和） ===== */

/* 容器与背景：更明显的蓝到白渐变（顶部更蓝） */
.enhanced-login {
  position: relative;
  height: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  /* 顶部更偏蓝 -> 中间柔和 -> 底部白 */
  background: linear-gradient(180deg, #a6d8ff 0%, #cfe9ff 35%, #ffffff 100%);
  overflow: hidden;
  padding: 40px;
}

/* 光斑：降低模糊与不透明度，颜色更偏蓝但不刺眼 */
.bg-blob {
  position: absolute;
  filter: blur(60px) saturate(110%);
  opacity: 0.65;
  pointer-events: none;
  transform: translateZ(0);
}
.blob-1 {
  width: 420px;
  height: 420px;
  background: radial-gradient(circle at 30% 30%, rgba(38,132,255,0.30), rgba(90,170,255,0.06) 45%, transparent 70%);
  top: -100px;
  left: -140px;
}
.blob-2 {
  width: 360px;
  height: 360px;
  background: radial-gradient(circle at 70% 70%, rgba(60,140,255,0.22), rgba(140,200,255,0.04) 40%, transparent 70%);
  bottom: -80px;
  right: -120px;
}

/* 玻璃卡片：边框蓝色高光更显色，但阴影更柔和 */
.glass-card {
  width: 420px;
  max-width: calc(100% - 40px);
  border-radius: 16px;
  padding: 22px;
  box-sizing: border-box;
  position: relative;
  z-index: 10;
  transition: box-shadow 300ms cubic-bezier(.2,.9,.3,1), transform 350ms cubic-bezier(.2,.9,.3,1);
  will-change: transform;
  background: linear-gradient(180deg, rgba(255,255,255,0.86), rgba(245,250,255,0.72));
  border: 1px solid rgba(40,110,255,0.18);
  backdrop-filter: blur(8px) saturate(120%);
  -webkit-backdrop-filter: blur(8px) saturate(120%);
  box-shadow: 0 10px 30px rgba(36,110,255,0.12);
  overflow: visible;
}

/* 展开状态视觉强化（但不夸张） */
.glass-card.expanded {
  box-shadow: 0 22px 60px rgba(46,110,210,0.12);
}

/* 内部容器 */
.card-inner {
  border-radius: 12px;
  padding: 10px 18px 22px;
  position: relative;
  overflow: visible;
}

/* 标题：更深的海蓝色 */
.title {
  margin: 6px auto 18px;
  text-align: center;
  color: #063155;
  font-weight: 700;
  font-size: 20px;
  letter-spacing: 0.6px;
}

/* 表单：输入项为白底，边框淡蓝，聚焦时给柔和的蓝色光 */
.login-form {
  background: transparent;
  .el-input {
    height: 44px;
    input {
      height: 44px;
      color: #0b2b4a;
      background: #ffffff !important;
      border-radius: 8px;
      padding-left: 12px;
      box-shadow: inset 0 1px 0 rgba(10,30,60,0.03);
      border: 1px solid rgba(10,60,120,0.06);
      transition: box-shadow 180ms ease, border-color 180ms ease;
    }
    input:focus {
      box-shadow: 0 8px 28px rgba(34,110,255,0.06);
      border-color: rgba(30,100,240,0.14);
      outline: none;
    }
  }
  .el-input__icon {
    color: rgba(20,60,100,0.45);
  }
  /* el-form-item 验证的红色保留默认 */
}

/* 验证码行 */
.code-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.login-code {
  width: 120px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid rgba(10,60,120,0.08);
  background: linear-gradient(180deg, rgba(250,250,255,0.9), rgba(240,248,255,0.85));
  cursor: pointer;
  img {
    height: 36px;
    max-width: 100%;
    object-fit: contain;
  }
}

/* actions */
.actions-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  .register-link .link-type {
    color: #0b67c6;
    text-decoration: underline;
    opacity: 0.95;
  }
}

/* 登录按钮：更浓郁但柔和的蓝色渐变 */
.login-btn {
  border-radius: 8px;
  background: linear-gradient(90deg, #2c86ff 0%, #156be0 100%) !important;
  border: none !important;
  color: #ffffff !important;
  box-shadow: 0 8px 26px rgba(28,100,255,0.14);
}
.login-btn:hover { transform: translateY(-1px); box-shadow: 0 12px 34px rgba(28,100,255,0.18); }

/* 登录提示 */
.login-tip {
  margin-top: 10px;
  font-size: 12px;
  color: rgba(10,40,80,0.6);
  text-align: center;
}

/* 页脚：深蓝文字 */
.el-login-footer {
  position: fixed;
  bottom: 12px;
  width: 100%;
  text-align: center;
  color: rgba(10,40,80,0.6);
  font-size: 12px;
  z-index: 5;
}

/* 响应式 */
@media (max-width: 480px) {
  .glass-card { width: 92%; padding: 16px; border-radius: 12px; }
  .blob-1, .blob-2 { display: none; }
}

/* 尊重 prefers-reduced-motion 的用户设置：弱化动画 */
@media (prefers-reduced-motion: reduce) {
  .glass-card, .login-btn, .el-input input {
    transition: none !important;
  }
}
</style>