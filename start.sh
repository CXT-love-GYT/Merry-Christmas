#!/bin/bash

PORT=8000

# 检查端口是否被占用
check_port() {
    if lsof -ti:$PORT &> /dev/null; then
        return 0  # 端口被占用
    else
        return 1  # 端口可用
    fi
}

# 尝试释放端口
free_port() {
    echo "检测到端口 $PORT 已被占用，正在尝试释放..."
    PID=$(lsof -ti:$PORT)
    if [ ! -z "$PID" ]; then
        echo "找到进程 $PID，正在停止..."
        kill $PID 2>/dev/null
        sleep 1
        if check_port; then
            echo "警告：无法停止占用端口的进程"
            return 1
        else
            echo "端口已释放"
            return 0
        fi
    fi
}

# 查找可用端口
find_free_port() {
    local port=$PORT
    while check_port; do
        port=$((port + 1))
        if [ $port -gt 8999 ]; then
            echo "错误：无法找到可用端口"
            exit 1
        fi
    done
    PORT=$port
}

echo "正在启动 3D 粒子圣诞树..."
echo ""

# 检查并处理端口占用
if check_port; then
    if ! free_port; then
        echo "尝试使用其他端口..."
        find_free_port
        echo "将使用端口: $PORT"
    fi
fi

echo "服务器将在端口 $PORT 启动"
echo "请稍候，服务器启动后会在浏览器中自动打开"
echo "如果没有自动打开，请访问: http://localhost:$PORT"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

# 检查是否有 serve 命令
if command -v npx &> /dev/null; then
    npx serve . -p $PORT -o
else
    echo "未找到 npx，尝试使用 Python..."
    if command -v python3 &> /dev/null; then
        python3 -m http.server $PORT
    elif command -v python &> /dev/null; then
        python -m http.server $PORT
    else
        echo "错误：未找到可用的服务器工具"
        echo "请安装 Node.js 或 Python"
        exit 1
    fi
fi

