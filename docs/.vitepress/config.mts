import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: '智慧深澜',
  description: 'OpenWrt 智慧深澜：一键配置、校园认证、账号管理与开发文档。',
  cleanUrls: true,
  lastUpdated: true,
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }]],
  sitemap: { hostname: 'https://srun-doc.guiguisocute.com' },
  themeConfig: {
    logo: '/logo.svg',
    nav: [
      { text: '使用指南', link: '/guide/getting-started', activeMatch: '/guide/' },
      { text: '配置参考', link: '/reference/configuration', activeMatch: '/reference/' },
      { text: '开发维护', link: '/development/', activeMatch: '/development/' },
      { text: '贡献预设', link: '/contribute/presets', activeMatch: '/contribute/' }
    ],
    sidebar: {
      '/guide/': [
        { text: '开始连接', items: [
          { text: '快速开始', link: '/guide/getting-started' },
          { text: '下载与版本选择', link: '/guide/download' },
          { text: '安装与兼容性', link: '/guide/install' },
          { text: '备份与升级到 Go', link: '/guide/backup-migration' },
          { text: '一键配置', link: '/guide/setup-wizard' },
          { text: '学校预设', link: '/guide/schools' }
        ] },
        { text: '日常使用与排查', items: [
          { text: '认证策略与后缀', link: '/guide/authentication' },
          { text: '账号、无线与多 WAN', link: '/guide/accounts' },
          { text: '状态、定时与日志', link: '/guide/status' },
          { text: '故障排查', link: '/guide/troubleshooting' }
        ] },
        { text: '继续查阅', items: [
          { text: '配置与命令参考', link: '/reference/configuration' },
          { text: 'Python 1.x 历史资料', link: '/legacy/1.x/' }
        ] }
      ],
      '/reference/': [
        { text: 'Go 2.0 参考', items: [
          { text: '配置、备份与更新', link: '/reference/configuration' },
          { text: '命令行', link: '/reference/cli' }
        ] },
        { text: '按任务继续', items: [
          { text: '备份与版本转换', link: '/guide/backup-migration' },
          { text: '故障排查', link: '/guide/troubleshooting' },
          { text: '开发与维护入口', link: '/development/' },
          { text: 'Python 1.x 历史资料', link: '/legacy/1.x/' }
        ] }
      ],
      '/development/': [
        { text: '开发与维护', items: [
          { text: '任务入口', link: '/development/' },
          { text: '上下文地图', link: '/development/context' },
          { text: '架构与扩展', link: '/development/architecture' },
          { text: '验证、部署与发布', link: '/development/validation' },
          { text: 'Go 性能基准', link: '/development/benchmarks' },
          { text: '文档站维护', link: '/development/documentation' }
        ] },
        { text: '相关入口', items: [
          { text: '贡献学校预设', link: '/contribute/presets' },
          { text: '贡献说明与致谢', link: '/contribute/' },
          { text: 'Python 1.x 历史资料', link: '/legacy/1.x/' }
        ] }
      ],
      '/contribute/': [
        { text: '参与贡献', items: [
          { text: '贡献学校预设', link: '/contribute/presets' },
          { text: '贡献说明与致谢', link: '/contribute/' }
        ] },
        { text: '按任务继续', items: [
          { text: '查询学校预设', link: '/guide/schools' },
          { text: '参数收集与反馈', link: '/guide/troubleshooting#参数收集与问题反馈' },
          { text: '开发与维护入口', link: '/development/' }
        ] }
      ],
      '/legacy/': [
        { text: 'Python 1.x 历史资料', items: [
          { text: '历史入口与版本边界', link: '/legacy/1.x/' },
          { text: '安装与兼容性', link: '/legacy/1.x/install' },
          { text: '配置、备份与更新', link: '/legacy/1.x/configuration' },
          { text: '命令行', link: '/legacy/1.x/cli' },
          { text: '架构与认证策略', link: '/legacy/1.x/architecture' },
          { text: '测试、热更新与发布', link: '/legacy/1.x/validation' }
        ] },
        { text: '当前版本', items: [
          { text: '下载与版本选择', link: '/guide/download' },
          { text: '备份与升级到 Go', link: '/guide/backup-migration' },
          { text: 'Go 开发入口', link: '/development/' }
        ] }
      ]
    },
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
    footer: { message: 'Go 2.x 已正式发布；最新版本与验证范围见下载页，Python 1.x 资料独立归档。', copyright: '智慧深澜 · 社区维护 · WTFPL' }
  }
})
