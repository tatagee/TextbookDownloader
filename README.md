# 📚 国家智慧教育平台教材下载工具

一个本地运行的网页工具，帮助你从[国家中小学智慧教育平台](https://basic.smartedu.cn/tchMaterial)获取教材 PDF 的可下载链接。

## 功能

- 粘贴课本在线阅读页面的 URL，自动提取 PDF 下载地址
- 后端代理下载，解决直接访问 CDN 403 问题
- 界面简洁，开箱即用

## 使用方法

### 1. 安装依赖

```bash
npm install
```

### 2. 启动服务

```bash
npm start
```

### 3. 打开浏览器

访问 [http://localhost:3000](http://localhost:3000)

### 4. 获取下载链接

1. 前往 [智慧教育平台教材中心](https://basic.smartedu.cn/tchMaterial) 找到需要的课本，打开在线阅读页面
2. 复制浏览器地址栏中的完整 URL
3. 粘贴到工具输入框，点击「获取下载链接」
4. 点击绿色「点击下载 PDF」按钮即可下载

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Node.js + Express |
| 前端 | HTML + Tailwind CSS（CDN） |
| HTTP | axios |

## 工作原理

```
用户输入课本 URL
       ↓
提取 URL 中的 contentId 参数
       ↓
请求平台 CDN 资源详情接口获取原始 PDF 地址
https://s-file-1.ykt.cbern.com.cn/zxx/ndrv2/resources/tch_material/details/{contentId}.json
       ↓
将域名替换为公开可访问的下载域名
https://c1.ykt.cbern.com.cn/...
       ↓
后端代理请求（携带正确 Referer），流式返回 PDF 给浏览器
```

## 免责声明

本工具仅供个人学习研究使用，请遵守[国家中小学智慧教育平台](https://basic.smartedu.cn)的使用条款。请勿用于任何商业用途或大规模批量下载。

## License

[MIT](./LICENSE)
