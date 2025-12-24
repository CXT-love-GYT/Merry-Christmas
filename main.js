import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class ParticleChristmasTree {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.particles = null;
        this.particleSystem = null;
        this.groundParticles = null;
        this.snowParticles = null;
        this.starParticles = null;
        this.imageRing = null;
        this.imageMeshes = []; // 存储所有图片mesh
        this.enlargedImage = null; // 当前放大的图片
        this.raycaster = null; // 用于点击检测
        this.mouse = null; // 鼠标位置
        this.controls = null;
        this.animationId = null;
        
        // 参数
        this.params = {
            particleCount: 5000,
            rotationSpeed: 1.0,
            particleSize: 2.0,
            treeHeight: 15,
            treeWidth: 8,
            layers: 8,
            groundParticleCount: 16000, // 翻倍：从8000增加到16000
            snowParticleCount: 4000, // 增加：从2000增加到4000，保持一定数量
            starParticleCount: 500,
            groundParticleSize: 0.8,
            snowParticleSize: 1.2,
            starParticleSize: 1.5
        };
        
        this.init();
        this.setupControls();
        this.animate();
    }
    
    init() {
        // 创建场景
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0a);
        this.scene.fog = new THREE.Fog(0x0a0a0a, 10, 50);
        
        // 创建相机
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 8, 25);
        
        // 创建渲染器
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace; // 使用sRGB颜色空间
        
        const container = document.getElementById('canvas-container');
        container.appendChild(this.renderer.domElement);
        
        // 创建射线检测器和鼠标位置
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // 添加鼠标点击事件
        this.renderer.domElement.addEventListener('click', (event) => this.onImageClick(event));
        
        // 创建轨道控制器
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 10;
        this.controls.maxDistance = 50;
        this.controls.maxPolarAngle = Math.PI / 2.2;
        
        // 添加环境光
        const ambientLight = new THREE.AmbientLight(0x4a9eff, 0.3);
        this.scene.add(ambientLight);
        
        // 添加点光源
        const pointLight1 = new THREE.PointLight(0x4a9eff, 1, 100);
        pointLight1.position.set(10, 10, 10);
        pointLight1.castShadow = true;
        this.scene.add(pointLight1);
        
        const pointLight2 = new THREE.PointLight(0x00d4ff, 0.8, 100);
        pointLight2.position.set(-10, 10, -10);
        this.scene.add(pointLight2);
        
        // 添加顶部光源（模拟星星）
        const topLight = new THREE.PointLight(0xffffff, 1.5, 50);
        topLight.position.set(0, this.params.treeHeight + 2, 0);
        this.scene.add(topLight);
        
        // 创建粒子系统
        this.createParticleTree();
        
        // 创建白色粒子地平面
        this.createGroundParticles();
        
        // 创建飘散的白色粒子（雪花）
        this.createSnowParticles();
        
        // 创建树顶五角星
        this.createStar();
        
        // 创建图片展示环
        this.createImageRing();
        
        // 添加地面
        this.createGround();
        
        // 添加重新加载图片的方法（用于调试）
        window.reloadImages = () => {
            if (this.imageRing) {
                // 移除旧的图片环
                this.scene.remove(this.imageRing);
                // 清理旧的图片数据
                this.imageMeshes.forEach(data => {
                    if (data.group) {
                        data.group.traverse(child => {
                            if (child.geometry) child.geometry.dispose();
                            if (child.material) {
                                if (child.material.map) child.material.map.dispose();
                                child.material.dispose();
                            }
                        });
                    }
                });
                this.imageMeshes = [];
                this.enlargedImage = null;
            }
            // 重新创建图片环
            this.createImageRing();
            console.log('图片已重新加载');
        };
        
        // 窗口大小调整
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    createParticleTree() {
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        const sizes = [];
        const velocities = [];
        
        const color1 = new THREE.Color(0x4a9eff); // 亮蓝色
        const color2 = new THREE.Color(0x0066ff); // 深蓝色
        const color3 = new THREE.Color(0x00d4ff); // 青色
        
        // 生成圣诞树形状的粒子 - 改进分层结构，让树更明显
        for (let i = 0; i < this.params.particleCount; i++) {
            // 分层生成，从下到上，使用更明显的分层
            const layer = Math.random();
            const layerIndex = Math.floor(layer * this.params.layers);
            const layerProgress = (layer * this.params.layers) % 1;
            const layerHeight = (layerIndex / this.params.layers) * this.params.treeHeight;
            
            // 计算该层的宽度（越往上越窄，分层更明显）
            const baseWidth = this.params.treeWidth;
            const topWidth = this.params.treeWidth * 0.2;
            const layerWidth = baseWidth - (baseWidth - topWidth) * (layerIndex / this.params.layers);
            
            // 生成分层圆锥形分布，每层更密集
            const angle = Math.random() * Math.PI * 2;
            // 使用更均匀的半径分布，让每层更明显
            const radius = Math.sqrt(Math.random()) * layerWidth;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const y = layerHeight + layerProgress * (this.params.treeHeight / this.params.layers);
            
            // 减少随机偏移，让树形更清晰
            const noise = (Math.random() - 0.5) * 0.3;
            positions.push(x + noise, y, z + noise);
            
            // 颜色渐变：底部深蓝，顶部亮蓝/青色
            const colorMix = new THREE.Color().lerpColors(color2, color1, layer);
            if (layer > 0.7) {
                colorMix.lerp(color3, (layer - 0.7) / 0.3);
            }
            colors.push(colorMix.r, colorMix.g, colorMix.b);
            
            // 粒子大小：顶部更小
            const size = this.params.particleSize * (0.5 + Math.random() * 0.5) * (1 - layer * 0.3);
            sizes.push(size);
            
            // 速度（用于动画）
            velocities.push(
                (Math.random() - 0.5) * 0.02,
                (Math.random() - 0.5) * 0.01,
                (Math.random() - 0.5) * 0.02
            );
        }
        
        // 添加树干
        const trunkHeight = this.params.treeHeight * 0.15;
        const trunkWidth = this.params.treeWidth * 0.1;
        const trunkParticles = Math.floor(this.params.particleCount * 0.05);
        
        for (let i = 0; i < trunkParticles; i++) {
            const y = (Math.random() - 0.5) * trunkHeight;
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * trunkWidth;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            positions.push(x, y, z);
            colors.push(0.2, 0.1, 0.05); // 棕色树干
            sizes.push(this.params.particleSize * 1.5);
            velocities.push(0, 0, 0);
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('particleColor', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
        geometry.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 3));
        
        // 创建着色器材质
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pointSize: { value: this.params.particleSize }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 particleColor;
                attribute vec3 velocity;
                uniform float time;
                uniform float pointSize;
                
                varying vec3 vColor;
                varying float vAlpha;
                
                void main() {
                    vColor = particleColor;
                    
                    // 添加轻微的浮动动画
                    vec3 pos = position;
                    pos.x += sin(time * 0.5 + position.y * 0.1) * 0.1;
                    pos.z += cos(time * 0.5 + position.y * 0.1) * 0.1;
                    pos.y += sin(time * 0.3 + position.x * 0.1) * 0.05;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    
                    // 根据距离调整大小和透明度
                    float distance = length(mvPosition.xyz);
                    float alpha = 1.0 - smoothstep(0.0, 50.0, distance);
                    vAlpha = alpha;
                    
                    gl_PointSize = size * pointSize * (300.0 / distance);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vAlpha;
                
                void main() {
                    // 创建圆形粒子
                    float distance = length(gl_PointCoord - vec2(0.5));
                    if (distance > 0.5) discard;
                    
                    // 添加光晕效果
                    float alpha = (1.0 - distance * 2.0) * vAlpha;
                    alpha = pow(alpha, 0.5);
                    
                    // 添加发光效果
                    vec3 glow = vColor * (1.0 + (1.0 - distance * 2.0) * 2.0);
                    
                    gl_FragColor = vec4(glow, alpha);
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        this.particleSystem = new THREE.Points(geometry, material);
        this.scene.add(this.particleSystem);
    }
    
    createGround() {
        const groundGeometry = new THREE.PlaneGeometry(30, 30);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x0a0a1a,
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.5;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // 添加地面光晕
        const glowGeometry = new THREE.PlaneGeometry(5, 5);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x4a9eff,
            transparent: true,
            opacity: 0.1
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.rotation.x = -Math.PI / 2;
        glow.position.y = -0.49;
        this.scene.add(glow);
    }
    
    createGroundParticles() {
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        const sizes = [];
        const rotations = [];
        
        // 创建密集的白色粒子地平面
        const groundSize = 50; // 扩大范围
        const groundY = 0;
        const spiralRatio = 0.9; // 90%的粒子使用螺旋分布，10%随机分布
        
        // 螺旋线参数
        const maxRadius = groundSize * 0.5; // 最大半径
        const spiralTurns = 8; // 螺旋圈数
        const maxAngle = spiralTurns * Math.PI * 2; // 最大角度
        
        for (let i = 0; i < this.params.groundParticleCount; i++) {
            let x, z;
            
            if (i < this.params.groundParticleCount * spiralRatio) {
                // 螺旋分布：从树底中心开始，向外螺旋
                const progress = i / (this.params.groundParticleCount * spiralRatio);
                
                // 角度：从0到maxAngle，增加密度
                const angle = progress * maxAngle;
                
                // 半径：从0到maxRadius，使用线性分布使螺旋更密集
                const radius = progress * maxRadius;
                
                // 添加较小的随机偏移，保持螺旋形状的同时增加自然感
                const radiusNoise = (Math.random() - 0.5) * 1.0; // 减小噪声范围
                const angleNoise = (Math.random() - 0.5) * 0.2; // 减小角度噪声
                
                const finalRadius = Math.max(0, radius + radiusNoise);
                const finalAngle = angle + angleNoise;
                
                x = Math.cos(finalAngle) * finalRadius;
                z = Math.sin(finalAngle) * finalRadius;
            } else {
                // 随机分布：在螺旋基础上添加随机粒子
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * maxRadius;
                const randomOffset = (Math.random() - 0.5) * 10; // 随机偏移
                
                x = Math.cos(angle) * radius + randomOffset;
                z = Math.sin(angle) * radius + randomOffset;
            }
            
            const y = groundY + (Math.random() - 0.5) * 0.3; // 轻微高度变化
            
            positions.push(x, y, z);
            
            // 白色粒子，带一点蓝色调
            const white = 0.9 + Math.random() * 0.1;
            colors.push(white, white, white);
            
            // 粒子大小（使用参数控制）
            const size = this.params.groundParticleSize * (0.8 + Math.random() * 0.4);
            sizes.push(size);
            
            // 旋转角度
            rotations.push(Math.random() * Math.PI * 2);
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('particleColor', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
        geometry.setAttribute('rotation', new THREE.Float32BufferAttribute(rotations, 1));
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pointSize: { value: this.params.groundParticleSize }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 particleColor;
                attribute float rotation;
                uniform float time;
                uniform float pointSize;
                
                varying vec3 vColor;
                varying float vAlpha;
                varying float vRotation;
                
                void main() {
                    vColor = particleColor;
                    vRotation = rotation + time * 0.5;
                    
                    vec3 pos = position;
                    // 轻微的浮动
                    pos.y += sin(time * 0.3 + position.x * 0.1 + position.z * 0.1) * 0.1;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    float distance = length(mvPosition.xyz);
                    float alpha = 1.0 - smoothstep(0.0, 50.0, distance);
                    vAlpha = alpha;
                    
                    gl_PointSize = size * pointSize * (300.0 / distance);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vAlpha;
                varying float vRotation;
                
                void main() {
                    vec2 coord = gl_PointCoord - vec2(0.5);
                    // 旋转
                    float c = cos(vRotation);
                    float s = sin(vRotation);
                    coord = vec2(coord.x * c - coord.y * s, coord.x * s + coord.y * c);
                    coord += vec2(0.5);
                    
                    float distance = length(coord - vec2(0.5));
                    if (distance > 0.5) discard;
                    
                    float alpha = (1.0 - distance * 2.0) * vAlpha;
                    alpha = pow(alpha, 0.7);
                    
                    vec3 glow = vColor * (1.0 + (1.0 - distance * 2.0) * 1.5);
                    gl_FragColor = vec4(glow, alpha);
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        this.groundParticles = new THREE.Points(geometry, material);
        this.scene.add(this.groundParticles);
    }
    
    createSnowParticles() {
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        const sizes = [];
        const velocities = [];
        const rotations = [];
        
        // 创建飘散的白色粒子（雪花）
        const areaSize = 40;
        const heightRange = 30;
        
        for (let i = 0; i < this.params.snowParticleCount; i++) {
            // 在空间中随机分布
            const x = (Math.random() - 0.5) * areaSize;
            const y = Math.random() * heightRange;
            const z = (Math.random() - 0.5) * areaSize;
            
            positions.push(x, y, z);
            
            // 纯白色
            const white = 0.8 + Math.random() * 0.2;
            colors.push(white, white, white);
            
            // 粒子大小（使用参数控制）
            const size = this.params.snowParticleSize * (0.7 + Math.random() * 0.6);
            sizes.push(size);
            
            // 飘散速度
            velocities.push(
                (Math.random() - 0.5) * 0.05,
                -Math.random() * 0.1 - 0.05, // 向下飘落
                (Math.random() - 0.5) * 0.05
            );
            
            // 旋转速度
            rotations.push(Math.random() * Math.PI * 2);
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('particleColor', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
        geometry.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 3));
        geometry.setAttribute('rotation', new THREE.Float32BufferAttribute(rotations, 1));
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pointSize: { value: this.params.snowParticleSize }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 particleColor;
                attribute vec3 velocity;
                attribute float rotation;
                uniform float time;
                uniform float pointSize;
                
                varying vec3 vColor;
                varying float vAlpha;
                varying float vRotation;
                
                void main() {
                    vColor = particleColor;
                    vRotation = rotation + time * 2.0;
                    
                    // 飘散动画
                    vec3 pos = position;
                    float moveTime = mod(time * 10.0, 100.0);
                    pos.x += velocity.x * moveTime;
                    pos.y += velocity.y * moveTime;
                    pos.z += velocity.z * moveTime;
                    
                    // 循环：使用 mod 实现循环
                    pos.y = mod(pos.y + 35.0, 35.0);
                    pos.x = mod(pos.x + 20.0, 40.0) - 20.0;
                    pos.z = mod(pos.z + 20.0, 40.0) - 20.0;
                    
                    // 旋转效果（围绕中心）
                    float rot = time * 0.3;
                    float c = cos(rot);
                    float s = sin(rot);
                    float newX = pos.x * c - pos.z * s;
                    float newZ = pos.x * s + pos.z * c;
                    pos.x = newX;
                    pos.z = newZ;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    float distance = length(mvPosition.xyz);
                    float alpha = 1.0 - smoothstep(0.0, 50.0, distance);
                    vAlpha = alpha * 0.8; // 稍微透明
                    
                    gl_PointSize = size * pointSize * (300.0 / distance);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vAlpha;
                varying float vRotation;
                
                void main() {
                    vec2 coord = gl_PointCoord - vec2(0.5);
                    // 旋转
                    float c = cos(vRotation);
                    float s = sin(vRotation);
                    coord = vec2(coord.x * c - coord.y * s, coord.x * s + coord.y * c);
                    coord += vec2(0.5);
                    
                    float distance = length(coord - vec2(0.5));
                    if (distance > 0.5) discard;
                    
                    float alpha = (1.0 - distance * 2.0) * vAlpha;
                    alpha = pow(alpha, 0.6);
                    
                    vec3 glow = vColor * (1.0 + (1.0 - distance * 2.0) * 1.2);
                    gl_FragColor = vec4(glow, alpha);
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        this.snowParticles = new THREE.Points(geometry, material);
        this.scene.add(this.snowParticles);
    }
    
    createStar() {
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        const sizes = [];
        const rotations = [];
        
        // 创建3D五角星（垂直立着）
        const starHeight = this.params.treeHeight + 2.0; // 树顶上方，悬浮
        const starRadius = 1.5; // 五角星半径
        const starThickness = 0.3; // 五角星厚度
        
        // 五角星的5个外顶点和5个内顶点（在YZ平面，垂直立着）
        const outerPoints = [];
        const innerPoints = [];
        const angleStep = (Math.PI * 2) / 5;
        
        for (let i = 0; i < 5; i++) {
            const angle = i * angleStep - Math.PI / 2; // 从顶部开始
            // 外顶点（在YZ平面，X为0）
            outerPoints.push({
                x: 0, // 垂直立着，X坐标为0
                y: Math.cos(angle) * starRadius,
                z: Math.sin(angle) * starRadius
            });
            // 内顶点（向内缩进）
            const innerAngle = angle + angleStep / 2;
            innerPoints.push({
                x: 0, // 垂直立着，X坐标为0
                y: Math.cos(innerAngle) * starRadius * 0.38,
                z: Math.sin(innerAngle) * starRadius * 0.38
            });
        }
        
        // 生成五角星形状的粒子
        for (let i = 0; i < this.params.starParticleCount; i++) {
            let x, y, z;
            const rand = Math.random();
            
            // 在五角星形状内生成粒子
            if (rand < 0.6) {
                // 在五角星的10个顶点之间生成（5个外顶点 + 5个内顶点）
                const segment = Math.floor(Math.random() * 10);
                let p1, p2, p3;
                
                if (segment < 5) {
                    // 外顶点到内顶点
                    p1 = outerPoints[segment];
                    p2 = innerPoints[segment];
                    p3 = outerPoints[(segment + 1) % 5];
                } else {
                    // 内顶点到下一个外顶点
                    const idx = segment - 5;
                    p1 = innerPoints[idx];
                    p2 = outerPoints[(idx + 1) % 5];
                    p3 = innerPoints[(idx + 1) % 5];
                }
                
                // 三角形内插值
                const u = Math.random();
                const v = Math.random();
                const w = u + v > 1 ? 1 - u : v;
                const t1 = 1 - u - w;
                const t2 = u;
                const t3 = w;
                
                // 垂直立着的五角星，X坐标在厚度范围内变化
                x = (Math.random() - 0.5) * starThickness;
                y = p1.y * t1 + p2.y * t2 + p3.y * t3;
                z = p1.z * t1 + p2.z * t2 + p3.z * t3;
            } else {
                // 在五角星的中心区域（垂直立着）
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * starRadius * 0.35;
                x = (Math.random() - 0.5) * starThickness; // X在厚度范围内
                y = Math.cos(angle) * radius;
                z = Math.sin(angle) * radius;
            }
            
            // 垂直立着的五角星，Y坐标加上高度，X和Z保持原样
            positions.push(x, starHeight + y, z);
            
            // 蓝色粒子，从深蓝到亮蓝
            const colorMix = new THREE.Color().lerpColors(
                new THREE.Color(0x0066ff),
                new THREE.Color(0x4a9eff),
                Math.random()
            );
            colors.push(colorMix.r, colorMix.g, colorMix.b);
            
            // 粒子大小
            const size = this.params.starParticleSize * (0.7 + Math.random() * 0.6);
            sizes.push(size);
            
            // 旋转角度
            rotations.push(Math.random() * Math.PI * 2);
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('particleColor', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
        geometry.setAttribute('rotation', new THREE.Float32BufferAttribute(rotations, 1));
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pointSize: { value: this.params.starParticleSize }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 particleColor;
                attribute float rotation;
                uniform float time;
                uniform float pointSize;
                
                varying vec3 vColor;
                varying float vAlpha;
                varying float vRotation;
                
                void main() {
                    vColor = particleColor;
                    vRotation = rotation + time * 1.5;
                    
                    vec3 pos = position;
                    // 轻微的闪烁效果
                    float pulse = sin(time * 2.0 + position.x * 0.5) * 0.1;
                    pos.y += pulse;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    float distance = length(mvPosition.xyz);
                    float alpha = 1.0 - smoothstep(0.0, 50.0, distance);
                    vAlpha = alpha;
                    
                    gl_PointSize = size * pointSize * (300.0 / distance);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vAlpha;
                varying float vRotation;
                
                void main() {
                    vec2 coord = gl_PointCoord - vec2(0.5);
                    // 旋转
                    float c = cos(vRotation);
                    float s = sin(vRotation);
                    coord = vec2(coord.x * c - coord.y * s, coord.x * s + coord.y * c);
                    coord += vec2(0.5);
                    
                    float distance = length(coord - vec2(0.5));
                    if (distance > 0.5) discard;
                    
                    float alpha = (1.0 - distance * 2.0) * vAlpha;
                    alpha = pow(alpha, 0.5);
                    
                    vec3 glow = vColor * (1.0 + (1.0 - distance * 2.0) * 2.0);
                    gl_FragColor = vec4(glow, alpha);
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        this.starParticles = new THREE.Points(geometry, material);
        this.scene.add(this.starParticles);
    }
    
    createImageRing() {
        // 图片文件列表 - 使用新的文件名，支持最多20张
        const imageFiles = [
            'image/微信图片_20251224211232_59_185.jpg',
            'image/微信图片_20251224211233_60_185.jpg',
            'image/微信图片_20251224211234_61_185.jpg',
            'image/微信图片_20251224211235_62_185.jpg',
            'image/微信图片_20251224211236_63_185.jpg',
            'image/微信图片_20251224211236_64_185.jpg',
            'image/微信图片_20251224211237_65_185.jpg',
            'image/微信图片_20251224211238_66_185.jpg',
            'image/微信图片_20251224211239_67_185.jpg',
            'image/微信图片_20251224211240_68_185.jpg',
            'image/微信图片_20251224211240_69_185.jpg',
            'image/微信图片_20251224211241_70_185.jpg',
            'image/微信图片_20251224211242_71_185.jpg',
            'image/微信图片_20251224211243_72_185.jpg',
            'image/微信图片_20251224211244_73_185.jpg',
            'image/微信图片_20251224211244_74_185.jpg',
            'image/微信图片_20251224211245_75_185.jpg',
            'image/微信图片_20251224211246_76_185.jpg',
            'image/微信图片_20251224211247_77_185.jpg',
            'image/微信图片_20251224211248_78_185.jpg'
        ];
        
        // 限制最多20张
        const finalImageFiles = imageFiles.slice(0, 20);
        
        // 创建图片展示环的容器
        this.imageRing = new THREE.Group();
        this.imageMeshes = [];
        
        // 圣诞树中间高度
        const ringHeight = this.params.treeHeight * 0.5;
        const ringRadius = this.params.treeWidth * 1.2;
        const imageCount = finalImageFiles.length;
        // 360度均匀分布，计算每张图片的角度间隔
        const angleStepDegrees = 360 / imageCount; // 每张图片的角度间隔
        const angleStep = (angleStepDegrees * Math.PI) / 180; // 转换为弧度
        
        // 图片尺寸
        const imageWidth = 3;
        const imageHeight = 4;
        
        // 加载并创建图片
        const textureLoader = new THREE.TextureLoader();
        
        finalImageFiles.forEach((imagePath, index) => {
            // 创建图片组
            const imageGroup = new THREE.Group();
            
            // 加载纹理
            const texture = textureLoader.load(
                imagePath,
                // 加载成功回调
                (loadedTexture) => {
                    console.log('图片加载成功:', imagePath);
                    // 纹理设置
                    loadedTexture.minFilter = THREE.LinearFilter;
                    loadedTexture.magFilter = THREE.LinearFilter;
                    loadedTexture.flipY = false;
                    if (loadedTexture.colorSpace !== undefined) {
                        loadedTexture.colorSpace = THREE.SRGBColorSpace;
                    }
                },
                undefined,
                (error) => {
                    console.error('图片加载失败:', imagePath, error);
                }
            );
            
            // 创建图片材质
            const material = new THREE.MeshBasicMaterial({
                map: texture,
                side: THREE.DoubleSide,
                transparent: false
            });
            
            // 创建图片平面
            const geometry = new THREE.PlaneGeometry(imageWidth, imageHeight);
            const imageMesh = new THREE.Mesh(geometry, material);
            
            // 翻转mesh绕X轴180度，修复上下镜像问题
            imageMesh.rotation.x = Math.PI;
            
            // 计算位置（圆形排列，每隔20度一张）
            const angle = index * angleStep;
            const x = Math.cos(angle) * ringRadius;
            const z = Math.sin(angle) * ringRadius;
            
            // 设置位置
            imageMesh.position.set(0, 0, 0);
            imageGroup.position.set(x, ringHeight, z);
            
            // 让图片朝外显示，并往内倾斜15度
            // 计算朝向：图片应该面向外部（远离中心，不朝向圣诞树）
            // 图片在图片环中的位置是 (x, z)，要朝外，需要面向从中心指向图片的方向
            // 由于mesh已经翻转了180度（rotation.x = Math.PI），图片正面现在朝向-Z方向
            // 所以要朝外，需要让图片面向从中心指向图片的方向
            // 计算Y轴旋转角度：让图片正面朝外
            const targetY = Math.atan2(x, z) + Math.PI; // 加PI让图片正面朝外（因为mesh已翻转）
            
            // 设置旋转：Y轴旋转让图片朝外
            imageGroup.rotation.y = targetY; // 朝外
            imageGroup.rotation.x = 0; // 不上下倾斜
            
            // 往内倾斜15度（绕Z轴旋转，相对于图片环）
            // 注意：向内倾斜意味着朝向中心方向倾斜
            const tiltAngleDegrees = 15; // 15度
            const tiltAngle = (tiltAngleDegrees * Math.PI) / 180; // 转换为弧度
            imageGroup.rotation.z = tiltAngle; // 往内倾斜（朝向中心）
            
            // 添加边框
            const borderGeometry = new THREE.PlaneGeometry(imageWidth + 0.2, imageHeight + 0.2);
            const borderMaterial = new THREE.MeshBasicMaterial({
                color: 0x4a9eff,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide
            });
            const border = new THREE.Mesh(borderGeometry, borderMaterial);
            border.position.z = -0.01;
            
            imageGroup.add(border);
            imageGroup.add(imageMesh);
            
            // 存储图片信息
            const imageData = {
                group: imageGroup,
                mesh: imageMesh,
                border: border,
                originalLocalPosition: new THREE.Vector3(0, 0, 0), // 在group内的本地位置
                originalWorldPosition: new THREE.Vector3(x, ringHeight, z), // 世界位置
                originalScale: new THREE.Vector3(1, 1, 1),
                originalLocalRotation: imageGroup.rotation.clone(),
                isEnlarged: false,
                texture: texture,
                initialAngle: angle,
                initialRotationY: targetY,
                initialRotationZ: tiltAngle
            };
            
            this.imageMeshes.push(imageData);
            this.imageRing.add(imageGroup);
        });
        
        // 将图片环添加到场景
        this.scene.add(this.imageRing);
        console.log('图片环创建完成，共', this.imageMeshes.length, '张图片');
    }
    
    onImageClick(event) {
        if (!this.imageMeshes || this.imageMeshes.length === 0) {
            return;
        }
        
        // 计算鼠标在归一化设备坐标中的位置
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        // 更新射线
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // 收集所有可点击的对象（包括mesh和group）
        const clickableObjects = [];
        this.imageMeshes.forEach(data => {
            clickableObjects.push(data.mesh);
            clickableObjects.push(data.group);
        });
        
        // 检查是否点击了图片
        const intersects = this.raycaster.intersectObjects(clickableObjects, true);
        
        if (intersects.length > 0) {
            const clickedObject = intersects[0].object;
            
            // 找到对应的图片数据
            let imageData = null;
            for (const data of this.imageMeshes) {
                if (clickedObject === data.mesh || 
                    clickedObject === data.border || 
                    clickedObject.parent === data.group ||
                    data.group.children.includes(clickedObject)) {
                    imageData = data;
                    break;
                }
            }
            
            if (imageData) {
                console.log('点击了图片:', imageData.isEnlarged ? '恢复' : '放大');
                if (imageData.isEnlarged) {
                    // 恢复原始大小
                    this.restoreImage(imageData);
                } else {
                    // 放大图片
                    this.enlargeImage(imageData);
                }
            }
        }
    }
    
    enlargeImage(imageData) {
        console.log('放大图片');
        
        // 如果已经有放大的图片，先恢复它
        if (this.enlargedImage && this.enlargedImage !== imageData) {
            this.restoreImage(this.enlargedImage, false);
        }
        
        // 保存原始状态（如果还没保存）
        if (!imageData.isEnlarged) {
            // 获取世界坐标位置和旋转
            imageData.group.updateMatrixWorld();
            const worldPosition = new THREE.Vector3();
            const worldQuaternion = new THREE.Quaternion();
            imageData.group.getWorldPosition(worldPosition);
            imageData.group.getWorldQuaternion(worldQuaternion);
            
            imageData.originalWorldPosition = worldPosition.clone();
            imageData.originalWorldQuaternion = worldQuaternion.clone();
            imageData.originalScale.copy(imageData.group.scale);
            imageData.originalLocalPosition = imageData.group.position.clone();
            imageData.originalLocalRotation = imageData.group.rotation.clone();
        }
        
        // 从图片环中移除，添加到场景（避免受图片环旋转影响）
        this.imageRing.remove(imageData.group);
        this.scene.add(imageData.group);
        
        // 计算放大后的位置（相机前方）
        const cameraDirection = new THREE.Vector3();
        this.camera.getWorldDirection(cameraDirection);
        const enlargedPosition = new THREE.Vector3()
            .copy(this.camera.position)
            .add(cameraDirection.multiplyScalar(8)); // 距离相机8个单位
        
        // 计算固定朝向：面向相机，但保持水平（不倾斜）
        const cameraWorldDirection = new THREE.Vector3();
        this.camera.getWorldDirection(cameraWorldDirection);
        // 计算Y轴旋转，让图片面向相机，但保持水平
        const targetY = Math.atan2(cameraWorldDirection.x, cameraWorldDirection.z) + Math.PI; // 加PI让图片正面朝外
        const fixedRotation = new THREE.Euler(0, targetY, 0); // 只旋转Y轴，保持水平
        
        // 动画放大
        const targetScale = 4; // 放大4倍
        const startScale = imageData.group.scale.x;
        const startPos = imageData.originalWorldPosition.clone();
        const startRot = new THREE.Euler().setFromQuaternion(imageData.originalWorldQuaternion);
        const duration = 600;
        const startTime = performance.now();
        
        const animate = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            // 缩放
            const currentScale = startScale + (targetScale - startScale) * easeProgress;
            imageData.group.scale.set(currentScale, currentScale, currentScale);
            
            // 位置（世界坐标）
            imageData.group.position.lerpVectors(startPos, enlargedPosition, easeProgress);
            
            // 固定朝向：只旋转Y轴，保持水平，不倾斜
            imageData.group.rotation.x = THREE.MathUtils.lerp(startRot.x, fixedRotation.x, easeProgress);
            imageData.group.rotation.y = THREE.MathUtils.lerp(startRot.y, fixedRotation.y, easeProgress);
            imageData.group.rotation.z = THREE.MathUtils.lerp(startRot.z, fixedRotation.z, easeProgress);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                imageData.isEnlarged = true;
                this.enlargedImage = imageData;
                imageData.fixedRotation = fixedRotation.clone();
                console.log('图片放大完成');
            }
        };
        
        animate();
    }
    
    restoreImage(imageData, animate = true) {
        console.log('恢复图片');
        
        // 确保有原始数据
        if (!imageData.originalLocalPosition || !imageData.originalLocalRotation) {
            console.error('缺少原始数据，无法恢复');
            return;
        }
        
        if (!animate) {
            // 直接恢复，不动画
            // 先添加回图片环
            if (imageData.group.parent === this.scene) {
                this.scene.remove(imageData.group);
            }
            if (!this.imageRing.children.includes(imageData.group)) {
                this.imageRing.add(imageData.group);
            }
            
            imageData.group.scale.copy(imageData.originalScale);
            imageData.group.position.copy(imageData.originalLocalPosition);
            imageData.group.rotation.copy(imageData.originalLocalRotation);
            imageData.isEnlarged = false;
            if (this.enlargedImage === imageData) {
                this.enlargedImage = null;
            }
            return;
        }
        
        const startScale = imageData.group.scale.x;
        const startPos = imageData.group.position.clone();
        const startRot = imageData.group.rotation.clone();
        const duration = 600;
        const startTime = performance.now();
        
        const animateFunc = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            // 恢复缩放
            const currentScale = startScale + (imageData.originalScale.x - startScale) * easeProgress;
            imageData.group.scale.set(currentScale, currentScale, currentScale);
            
            // 恢复位置：直接使用原始本地位置
            imageData.group.position.lerpVectors(startPos, imageData.originalLocalPosition, easeProgress);
            
            // 恢复旋转：直接使用原始本地旋转
            imageData.group.rotation.x = THREE.MathUtils.lerp(startRot.x, imageData.originalLocalRotation.x, easeProgress);
            imageData.group.rotation.y = THREE.MathUtils.lerp(startRot.y, imageData.originalLocalRotation.y, easeProgress);
            imageData.group.rotation.z = THREE.MathUtils.lerp(startRot.z, imageData.originalLocalRotation.z, easeProgress);
            
            if (progress < 1) {
                requestAnimationFrame(animateFunc);
            } else {
                // 动画完成后，添加回图片环
                if (imageData.group.parent === this.scene) {
                    this.scene.remove(imageData.group);
                }
                if (!this.imageRing.children.includes(imageData.group)) {
                    this.imageRing.add(imageData.group);
                }
                
                // 重置为原始本地位置和旋转
                imageData.group.position.copy(imageData.originalLocalPosition);
                imageData.group.rotation.copy(imageData.originalLocalRotation);
                
                imageData.isEnlarged = false;
                if (this.enlargedImage === imageData) {
                    this.enlargedImage = null;
                }
                console.log('图片恢复完成');
            }
        };
        
        animateFunc();
    }
    
    setupControls() {
        // 粒子数量滑块
        const particleSlider = document.getElementById('particle-slider');
        const particleCount = document.getElementById('particle-count');
        
        if (particleSlider && particleCount) {
            particleSlider.addEventListener('input', (e) => {
                this.params.particleCount = parseInt(e.target.value);
                particleCount.textContent = this.params.particleCount;
                this.recreateParticles();
            });
        }
        
        // 旋转速度滑块
        const rotationSlider = document.getElementById('rotation-slider');
        const rotationSpeed = document.getElementById('rotation-speed');
        
        if (rotationSlider && rotationSpeed) {
            rotationSlider.addEventListener('input', (e) => {
                this.params.rotationSpeed = parseFloat(e.target.value);
                rotationSpeed.textContent = this.params.rotationSpeed.toFixed(1);
            });
        }
        
        // 树粒子大小滑块
        const sizeSlider = document.getElementById('size-slider');
        const particleSize = document.getElementById('particle-size');
        
        if (sizeSlider && particleSize) {
            sizeSlider.addEventListener('input', (e) => {
                this.params.particleSize = parseFloat(e.target.value);
                particleSize.textContent = this.params.particleSize.toFixed(1);
                if (this.particleSystem) {
                    this.particleSystem.material.uniforms.pointSize.value = this.params.particleSize;
                }
            });
        }
        
        // 地平面粒子大小滑块
        const groundSizeSlider = document.getElementById('ground-size-slider');
        const groundSize = document.getElementById('ground-size');
        
        if (groundSizeSlider && groundSize) {
            groundSizeSlider.addEventListener('input', (e) => {
                this.params.groundParticleSize = parseFloat(e.target.value);
                groundSize.textContent = this.params.groundParticleSize.toFixed(1);
                if (this.groundParticles) {
                    this.groundParticles.material.uniforms.pointSize.value = this.params.groundParticleSize;
                }
            });
        }
        
        // 雪花粒子大小滑块
        const snowSizeSlider = document.getElementById('snow-size-slider');
        const snowSize = document.getElementById('snow-size');
        
        if (snowSizeSlider && snowSize) {
            snowSizeSlider.addEventListener('input', (e) => {
                this.params.snowParticleSize = parseFloat(e.target.value);
                snowSize.textContent = this.params.snowParticleSize.toFixed(1);
                if (this.snowParticles) {
                    this.snowParticles.material.uniforms.pointSize.value = this.params.snowParticleSize;
                }
            });
        }
        
        // 五角星粒子大小滑块
        const starSizeSlider = document.getElementById('star-size-slider');
        const starSize = document.getElementById('star-size');
        
        if (starSizeSlider && starSize) {
            starSizeSlider.addEventListener('input', (e) => {
                this.params.starParticleSize = parseFloat(e.target.value);
                starSize.textContent = this.params.starParticleSize.toFixed(1);
                if (this.starParticles) {
                    this.starParticles.material.uniforms.pointSize.value = this.params.starParticleSize;
                }
            });
        }
        
        // 重置按钮
        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.params.particleCount = 5000;
                this.params.rotationSpeed = 1.0;
                this.params.particleSize = 2.0;
                this.params.groundParticleSize = 0.8;
                this.params.snowParticleSize = 1.2;
                this.params.starParticleSize = 1.5;
                
                if (particleSlider) particleSlider.value = 5000;
                if (rotationSlider) rotationSlider.value = 1.0;
                if (sizeSlider) sizeSlider.value = 2.0;
                if (groundSizeSlider) groundSizeSlider.value = 0.8;
                if (snowSizeSlider) snowSizeSlider.value = 1.2;
                if (starSizeSlider) starSizeSlider.value = 1.5;
                
                if (particleCount) particleCount.textContent = '5000';
                if (rotationSpeed) rotationSpeed.textContent = '1.0';
                if (particleSize) particleSize.textContent = '2.0';
                if (groundSize) groundSize.textContent = '0.8';
                if (snowSize) snowSize.textContent = '1.2';
                if (starSize) starSize.textContent = '1.5';
                
                this.recreateParticles();
                if (this.particleSystem) {
                    this.particleSystem.material.uniforms.pointSize.value = 2.0;
                }
                if (this.groundParticles) {
                    this.groundParticles.material.uniforms.pointSize.value = 0.8;
                }
                if (this.snowParticles) {
                    this.snowParticles.material.uniforms.pointSize.value = 1.2;
                }
                if (this.starParticles) {
                    this.starParticles.material.uniforms.pointSize.value = 1.5;
                }
            });
        }
    }
    
    recreateParticles() {
        if (this.particleSystem) {
            this.scene.remove(this.particleSystem);
            this.particleSystem.geometry.dispose();
            this.particleSystem.material.dispose();
        }
        this.createParticleTree();
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        const time = performance.now() * 0.001;
        
        // 更新蓝色粒子树系统
        if (this.particleSystem) {
            this.particleSystem.material.uniforms.time.value = time;
            this.particleSystem.rotation.y += 0.001 * this.params.rotationSpeed;
        }
        
        // 更新白色粒子地平面
        if (this.groundParticles) {
            this.groundParticles.material.uniforms.time.value = time;
        }
        
        // 更新飘散的白色粒子（雪花）
        if (this.snowParticles) {
            this.snowParticles.material.uniforms.time.value = time;
            // 雪花整体旋转
            this.snowParticles.rotation.y += 0.0002;
        }
        
        // 更新五角星粒子
        if (this.starParticles) {
            this.starParticles.material.uniforms.time.value = time;
            // 五角星缓慢旋转
            this.starParticles.rotation.y += 0.0005;
        }
        
        // 更新图片展示环（匀速公转，不自转）
        if (this.imageRing) {
            // 整个图片环匀速旋转（公转）
            this.imageRing.rotation.y += 0.001; // 匀速旋转速度
            
            // 确保所有图片保持正确的朝向（朝外，不朝向中心）
            // 图片的旋转是相对于图片环的本地坐标系，所以不需要更新
            // 但如果发现图片朝向不对，可以在这里修复
        }
        
        // 更新控制器
        this.controls.update();
        
        // 渲染
        this.renderer.render(this.scene, this.camera);
    }
    
    dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        window.removeEventListener('resize', this.onWindowResize);
    }
}

// 初始化
let tree;
window.addEventListener('DOMContentLoaded', () => {
    try {
        // 隐藏加载提示
        const loading = document.getElementById('loading');
        if (loading) {
            setTimeout(() => {
                loading.style.display = 'none';
            }, 500);
        }
        
        tree = new ParticleChristmasTree();
        console.log('3D 粒子圣诞树初始化成功！');
    } catch (error) {
        console.error('初始化错误:', error);
        console.error('错误堆栈:', error.stack);
        const loading = document.getElementById('loading');
        const errorDiv = document.getElementById('error');
        const errorMsg = document.getElementById('error-message');
        
        if (loading) loading.style.display = 'none';
        if (errorDiv) {
            errorDiv.style.display = 'block';
            if (errorMsg) {
                errorMsg.innerHTML = '初始化失败：' + (error.message || '未知错误') + '<br><br>' +
                    '错误详情：' + (error.stack || '无堆栈信息') + '<br><br>' +
                    '请按 F12 打开浏览器控制台查看详细错误信息<br>' +
                    '常见问题：<br>' +
                    '1. 确保使用现代浏览器（Chrome、Firefox、Edge、Safari）<br>' +
                    '2. 确保网络连接正常（需要加载 Three.js）<br>' +
                    '3. 确保使用服务器运行（不能直接打开文件）<br>' +
                    '4. 检查浏览器控制台的错误信息';
            }
        }
    }
});

// 全局错误处理
window.addEventListener('error', (event) => {
    console.error('全局错误:', event.error);
    if (event.error && event.error.message) {
        const errorDiv = document.getElementById('error');
        const errorMsg = document.getElementById('error-message');
        if (errorDiv && errorMsg) {
            errorDiv.style.display = 'block';
            errorMsg.innerHTML = '发生错误：' + event.error.message + '<br><br>' +
                '请按 F12 打开浏览器控制台查看详细错误信息';
        }
    }
});

