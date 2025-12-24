#!/bin/bash

echo "正在下载 Three.js 到本地..."
echo ""

# 创建目录
mkdir -p lib/three
mkdir -p lib/three/examples/jsm/controls

# 下载 Three.js 主文件
echo "下载 Three.js 核心库..."
curl -L -o lib/three/three.module.js https://unpkg.com/three@0.160.0/build/three.module.js

if [ $? -eq 0 ]; then
    echo "✓ Three.js 核心库下载成功"
else
    echo "✗ Three.js 核心库下载失败，尝试备用源..."
    curl -L -o lib/three/three.module.js https://cdn.skypack.dev/three@0.160.0
fi

# 下载 OrbitControls
echo "下载 OrbitControls..."
curl -L -o lib/three/examples/jsm/controls/OrbitControls.js https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js

if [ $? -eq 0 ]; then
    echo "✓ OrbitControls 下载成功"
else
    echo "✗ OrbitControls 下载失败，尝试备用源..."
    curl -L -o lib/three/examples/jsm/controls/OrbitControls.js https://cdn.skypack.dev/three@0.160.0/examples/jsm/controls/OrbitControls.js
fi

echo ""
echo "下载完成！"
echo ""
echo "现在可以编辑 index.html，将 CDN 路径改为本地路径："
echo "  three: './lib/three/three.module.js'"
echo "  three/addons/: './lib/three/examples/jsm/'"

