import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: '智慧深澜',
  description: 'OpenWrt 智慧深澜：一键配置、校园认证、账号管理与开发文档。',
  cleanUrls: true,
  lastUpdated: true,
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }]],
  sitemap: { hostname: 'https://smartsrun-doc.pages.dev' },
  themeConfig: {
    logo: '/logo.svg',
    nav: [
      { text: '使用指南', link: '/guide/getting-started', activeMatch: '/guide/' },
      { text: '配置参考', link: '/reference/configuration', activeMatch: '/reference/' },
      { text: '开发维护', link: '/development/architecture', activeMatch: '/development/' },
      { text: '贡献预设', link: '/contribute/presets', activeMatch: '/contribute/' }
    ],
    sidebar: [
      { text: '使用指南', items: [
        { text: '快速开始', link: '/guide/getting-started' },
        { text: '安装与兼容性', link: '/guide/install' },
        { text: '一键配置', link: '/guide/setup-wizard' },
        { text: '认证策略与后缀', link: '/guide/authentication' },
        { text: '账号、无线与多 WAN', link: '/guide/accounts' },
        { text: '状态、定时与日志', link: '/guide/status' },
        { text: '故障排查', link: '/guide/troubleshooting' }
      ] },
      { text: '配置参考', items: [
        { text: '配置、备份与更新', link: '/reference/configuration' },
        { text: '命令行', link: '/reference/cli' }
      ] },
      { text: '贡献与开发', items: [
        { text: '贡献学校预设', link: '/contribute/presets' },
        { text: '架构与认证策略扩展', link: '/development/architecture' },
        { text: '测试、热更新与发布', link: '/development/validation' },
        { text: '文档站维护', link: '/development/documentation' },
        { text: '贡献说明与致谢', link: '/contribute/' }
      ] }
    ],
    search: { provider: 'local', options: { locales: { root: { translations: {
      button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
      modal: { noResultsText: '未找到相关内容', resetButtonTitle: '清除搜索',
        footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' } }
    } } } } },
    socialLinks: [{ icon: 'github', link: 'https://github.com/matthewlu070111/smart-srun' }],
    editLink: { pattern: 'https://github.com/guiguisocute/smartsrun-doc/edit/main/docs/:path', text: '编辑此页' },
    outline: { label: '本页内容', level: [2, 3] },
    docFooter: { prev: '上一篇', next: '下一篇' },
    lastUpdated: { text: '最后更新' },
    darkModeSwitchLabel: '外观', lightModeSwitchTitle: '切换到浅色模式', darkModeSwitchTitle: '切换到深色模式',
    sidebarMenuLabel: '目录', returnToTopLabel: '返回顶部',
    footer: { message: '文档对应当前开发代码，已发布功能以版本说明为准。', copyright: '智慧深澜 · 社区维护 · WTFPL' }
  }
})
