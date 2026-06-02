#!/bin/bash

# TextbookDownloader 自动启动与环境自检脚本

set -e

echo "----------------------------------------"
echo "📚 开始 TextbookDownloader 环境自检..."
echo "----------------------------------------"

# 1. 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装 Node.js 18+。"
    exit 1
fi
echo "✅ Node.js $(node -v) 已就绪"

# 2. 检查并安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 首次运行，正在安装依赖..."
    npm install --registry=https://registry.npmmirror.com || npm install
    echo "✅ 依赖安装完成"
else
    echo "✅ 依赖项已存在"
fi

# 3. 启动服务（优先使用环境变量 $PORT，否则默认 9007）
APP_PORT=${PORT:-9007}

echo "----------------------------------------"
echo "🚀 TextbookDownloader 准备就绪!"
echo "📍 本地访问地址: http://localhost:$APP_PORT"
echo "----------------------------------------"

PORT=$APP_PORT node server.js
