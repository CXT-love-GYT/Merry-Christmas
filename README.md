# 3D 蓝色粒子圣诞树

一个使用 Three.js 构建的高级 3D 粒子圣诞树项目，采用蓝色粒子系统，具有精美的视觉效果和交互功能。

## 特性

- ✨ **3D 粒子系统**：使用数千个蓝色粒子构成圣诞树形状
- 🎨 **动态颜色渐变**：从深蓝色到亮蓝色的渐变效果
- 🌟 **高级着色器**：自定义 GLSL 着色器实现光晕和发光效果
- 🎭 **流畅动画**：粒子浮动动画和自动旋转
- 🎮 **交互控制**：
  - 鼠标拖动旋转视角
  - 滚轮缩放
  - 实时调整粒子数量、旋转速度和粒子大小
- 💫 **视觉效果**：
  - 粒子光晕效果
  - 距离衰减透明度
  - 环境光和点光源照明
  - 地面反射光晕

## 技术栈

- **Three.js** - 3D 图形库
- **WebGL** - 硬件加速渲染
- **GLSL 着色器** - 自定义粒子渲染
- **ES6 模块** - 现代 JavaScript

## 使用方法

⚠️ **重要提示**：这个项目使用了 ES6 模块，**不能直接双击打开 HTML 文件**！必须使用本地服务器运行。

### 方法一：使用启动脚本（最简单）

```bash
# 在项目目录运行
./start.sh

# 或
bash start.sh
```

### 方法二：使用 npx serve（推荐）

```bash
# 在项目目录运行
npx serve

# 然后在浏览器访问显示的地址（通常是 http://localhost:3000）
```

### 方法三：使用 Python

```bash
# Python 3
python3 -m http.server 8000

# Python 2
python -m http.server 8000

# 然后在浏览器访问 http://localhost:8000
```

### 方法四：使用 VS Code Live Server

1. 在 VS Code 中安装 "Live Server" 扩展
2. 右键点击 `index.html`
3. 选择 "Open with Live Server"

### 如果页面显示空白或 CDN 加载失败

如果遇到 `ERR_CONNECTION_RESET` 或 `Failed to load resource` 错误：

#### 方案一：使用本地 Three.js（推荐，无需网络）

1. 运行下载脚本：
```bash
./download-three.sh
```

2. 使用本地版本：
```bash
# 打开 index-local.html 而不是 index.html
# 或者在浏览器访问 http://localhost:8000/index-local.html
```

#### 方案二：检查网络和 CDN

1. 按 `F12` 打开浏览器开发者工具
2. 查看 Console 标签页的错误信息
3. 确保网络连接正常
4. 如果使用 VPN，确保 VPN 正常工作
5. 尝试刷新页面（会自动尝试备用 CDN）

#### 方案三：使用其他浏览器

某些浏览器或网络环境可能阻止 CDN，尝试：
- Chrome
- Firefox  
- Edge
- Safari

#### 其他检查

1. 确保使用现代浏览器（支持 ES6 模块）
2. **确保使用服务器运行，而不是直接打开文件**
3. 检查防火墙设置

## 控制说明

### 鼠标控制
- **左键拖动**：旋转视角
- **滚轮**：缩放场景

### 控制面板
- **粒子数量**：调整构成树的粒子数量（1000-10000）
- **旋转速度**：调整树的自动旋转速度（0-3）
- **粒子大小**：调整每个粒子的大小（0.5-5）
- **重置按钮**：恢复默认设置

## 项目结构

```
love/
├── index.html      # 主 HTML 文件
├── style.css       # 样式文件
├── main.js         # 核心 JavaScript 代码
└── README.md       # 项目说明
```

## 性能优化

- 使用 `BufferGeometry` 提高性能
- 距离衰减减少远距离粒子渲染
- 响应式设计，适配不同屏幕尺寸
- 像素比限制，避免过度渲染

## 浏览器兼容性

- Chrome/Edge（推荐）
- Firefox
- Safari
- 需要支持 WebGL 的现代浏览器

## 自定义

### 修改颜色

在 `main.js` 中修改以下颜色值：

```javascript
const color1 = new THREE.Color(0x4a9eff); // 亮蓝色
const color2 = new THREE.Color(0x0066ff); // 深蓝色
const color3 = new THREE.Color(0x00d4ff); // 青色
```

### 调整树形参数

修改 `params` 对象中的值：

```javascript
this.params = {
    particleCount: 5000,  // 粒子数量
    treeHeight: 15,       // 树高度
    treeWidth: 8,         // 树宽度
    layers: 8             // 层数
};
```

## 许可证

MIT License

## 作者

Created with ❤️ using Three.js

