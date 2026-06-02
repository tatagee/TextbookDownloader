const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DOWNLOAD_BASE = 'https://c1.ykt.cbern.com.cn';

// 从页面 URL 中解析 contentId
function extractContentId(url) {
  const match = url.match(/[?&]contentId=([a-zA-Z0-9-]+)/);
  return match ? match[1] : null;
}

// 尝试从智慧教育平台 CDN 接口获取 PDF 文件地址
async function fetchPdfUrl(contentId) {
  const endpoints = [
    // 主接口：NDR 资源详情 JSON
    `https://s-file-1.ykt.cbern.com.cn/zxx/ndrv2/resources/tch_material/details/${contentId}.json`,
    `https://s-file-2.ykt.cbern.com.cn/zxx/ndrv2/resources/tch_material/details/${contentId}.json`,
  ];

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0 Safari/537.36',
    'Referer': 'https://basic.smartedu.cn/',
    'Origin': 'https://basic.smartedu.cn',
  };

  for (const endpoint of endpoints) {
    try {
      const res = await axios.get(endpoint, { headers, timeout: 12000 });
      const data = res.data;

      // 在返回的 JSON 中查找 .pdf 链接
      const jsonStr = JSON.stringify(data);
      const pdfMatch = jsonStr.match(/https?:\\?\/\\?\/[^"\\]*\.pdf/);
      if (pdfMatch) {
        // 还原转义的斜杠
        return pdfMatch[0].replace(/\\\//g, '/');
      }
    } catch {
      continue;
    }
  }

  return null;
}

// 将原始 PDF URL 的域名替换为可下载域名
function buildDownloadUrl(originalUrl) {
  const parsed = new URL(originalUrl);
  return DOWNLOAD_BASE + parsed.pathname + parsed.search;
}

// POST /api/extract  { url: "https://basic.smartedu.cn/..." }
app.post('/api/extract', async (req, res) => {
  const { url } = req.body || {};

  if (!url || !url.includes('basic.smartedu.cn')) {
    return res.status(400).json({ error: '请输入有效的智慧教育平台课本页面链接' });
  }

  const contentId = extractContentId(url);
  if (!contentId) {
    return res.status(400).json({ error: '链接中未找到 contentId 参数，请确认链接完整' });
  }

  const pdfUrl = await fetchPdfUrl(contentId);
  if (!pdfUrl) {
    return res.status(404).json({
      error: '未能获取到 PDF 地址，可能该教材暂不支持或接口限流，请稍后再试',
    });
  }

  const downloadUrl = buildDownloadUrl(pdfUrl);

  res.json({
    contentId,
    originalUrl: pdfUrl,
    downloadUrl,
    // 从 URL 解码出文件名，方便前端显示
    filename: decodeURIComponent(path.basename(pdfUrl)),
  });
});

// GET /api/download?url=... — 代理下载，携带正确 Referer 向 CDN 取文件
app.get('/api/download', async (req, res) => {
  const { url } = req.query;

  if (!url || !url.startsWith('https://c1.ykt.cbern.com.cn/')) {
    return res.status(400).send('无效的下载地址');
  }

  try {
    const upstream = await axios.get(url, {
      responseType: 'stream',
      timeout: 60000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0 Safari/537.36',
        'Referer': 'https://basic.smartedu.cn/',
        'Origin': 'https://basic.smartedu.cn',
      },
    });

    const filename = path.basename(new URL(url).pathname);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${filename}`);

    if (upstream.headers['content-length']) {
      res.setHeader('Content-Length', upstream.headers['content-length']);
    }

    upstream.data.pipe(res);
  } catch (err) {
    const status = err.response?.status || 500;
    res.status(status).send('下载失败：' + (err.message || '未知错误'));
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ 教材下载工具已启动：http://localhost:${PORT}`);
});
