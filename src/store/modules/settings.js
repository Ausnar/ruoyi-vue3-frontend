import defaultSettings from '@/settings'
import { useDark, useToggle } from '@vueuse/core'
import { useDynamicTitle } from '@/utils/dynamicTitle'

const isDark = useDark()
const toggleDark = useToggle(isDark)

const { sideTheme, showSettings, navType, tagsView, tagsIcon, fixedHeader, sidebarLogo, dynamicTitle, footerVisible, footerContent, layoutVersion } = defaultSettings

// 获取本地存储的布局配置
function getStorageSetting() {
  try {
    const stored = localStorage.getItem('layout-setting')
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.warn('读取布局配置失败:', e)
  }
  return null
}

// 布局配置迁移：如果本地版本低于当前版本，自动迁移到新默认主题
function migrateLayoutSetting(storage, defaults) {
  // 确保 storage 是对象
  const currentVersion = defaults.layoutVersion || 2
  const savedVersion = (storage && typeof storage === 'object') ? (storage.layoutVersion || 1) : 1

  // 如果版本低于当前版本或无版本记录，执行迁移
  if (savedVersion < currentVersion) {
    // 确保 storage 是对象
    const migrated = (storage && typeof storage === 'object') ? { ...storage } : {}

    // V2 迁移：将 sideTheme 从深色改为浅色（第一阶段去 RuoYi 化改造）
    if (savedVersion < 2) {
      migrated.sideTheme = defaults.sideTheme
    }
    // 更新版本号
    migrated.layoutVersion = currentVersion
    // 保存回 localStorage
    localStorage.setItem('layout-setting', JSON.stringify(migrated))
    return migrated
  }

  return storage || {}
}

// 应用迁移逻辑
const storageSetting = getStorageSetting()
const migratedSetting = migrateLayoutSetting(storageSetting, defaultSettings)

const useSettingsStore = defineStore(
  'settings',
  {
    state: () => ({
      title: '',
      theme: migratedSetting.theme || '#409EFF',
      sideTheme: migratedSetting.sideTheme || sideTheme,
      showSettings: showSettings,
      navType: migratedSetting.navType === undefined ? navType : migratedSetting.navType,
      tagsView: migratedSetting.tagsView === undefined ? tagsView : migratedSetting.tagsView,
      tagsIcon: migratedSetting.tagsIcon === undefined ? tagsIcon : migratedSetting.tagsIcon,
      fixedHeader: migratedSetting.fixedHeader === undefined ? fixedHeader : migratedSetting.fixedHeader,
      sidebarLogo: migratedSetting.sidebarLogo === undefined ? sidebarLogo : migratedSetting.sidebarLogo,
      dynamicTitle: migratedSetting.dynamicTitle === undefined ? dynamicTitle : migratedSetting.dynamicTitle,
      footerVisible: migratedSetting.footerVisible === undefined ? footerVisible : migratedSetting.footerVisible,
      footerContent: footerContent,
      layoutVersion: migratedSetting.layoutVersion || layoutVersion,
      isDark: isDark.value
    }),
    actions: {
      // 修改布局设置
      changeSetting(data) {
        const { key, value } = data
        if (this.hasOwnProperty(key)) {
          this[key] = value
        }
      },
      // 设置网页标题
      setTitle(title) {
        this.title = title
        useDynamicTitle()
      },
      // 切换暗黑模式
      toggleTheme() {
        this.isDark = !this.isDark
        toggleDark()
      }
    }
  })

export default useSettingsStore
