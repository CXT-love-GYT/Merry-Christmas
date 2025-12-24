#!/bin/bash

echo "=== 部署前检查 ==="
echo ""

# 检查必要文件
echo "1. 检查必要文件..."
files=("index.html" "main.js" "style.css")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file 存在"
    else
        echo "  ✗ $file 不存在！"
    fi
done

echo ""
echo "2. 检查图片文件夹..."
if [ -d "image" ]; then
    image_count=$(find image -type f -name "*.jpg" | wc -l)
    echo "  ✓ image/ 文件夹存在，包含 $image_count 张图片"
    
    # 检查图片大小
    total_size=$(du -sh image/ | cut -f1)
    echo "  ✓ 图片总大小: $total_size"
    
    # 检查是否有超大文件
    large_files=$(find image -type f -size +10M)
    if [ -n "$large_files" ]; then
        echo "  ⚠️  发现大于10MB的图片，可能需要压缩："
        find image -type f -size +10M -exec ls -lh {} \;
    fi
else
    echo "  ✗ image/ 文件夹不存在！"
fi

echo ""
echo "3. 检查Git状态..."
if [ -d ".git" ]; then
    echo "  Git 仓库状态："
    git status --short
    
    echo ""
    echo "  未跟踪的文件："
    git ls-files --others --exclude-standard
    
    echo ""
    echo "  已提交的图片："
    git ls-files image/ | head -5
    if [ $(git ls-files image/ | wc -l) -eq 0 ]; then
        echo "  ⚠️  警告：没有图片文件被提交到Git！"
        echo "  运行: git add image/ && git commit -m '添加图片' && git push"
    fi
else
    echo "  ⚠️  不是Git仓库"
fi

echo ""
echo "4. 检查路径..."
echo "  检查 main.js 中的图片路径..."
if grep -q "image/" main.js; then
    echo "  ✓ 使用相对路径 'image/'"
else
    echo "  ✗ 未找到相对路径"
fi

echo ""
echo "=== 检查完成 ==="
echo ""
echo "如果发现问题，请参考 部署问题排查.md"

