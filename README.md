# Cyber Demolition: AI Architect (赛博拆迁队：AI 钉子户)

## 📖 项目简介
**Cyber Demolition: AI Architect** 是一款基于 Web 的 3D 物理破坏解压游戏。

在游戏中，玩家扮演一只巨大的怪兽（以隐形铁球的形式存在），任务是在规定时间内摧毁由傲慢的 AI 建筑师设计的“完美防御城市”。游戏利用 **Rapier** 物理引擎模拟真实的建筑坍塌、碰撞和爆炸效果，结合 **Google Gemini API** 实时生成关卡布局和毒舌解说。

## 🎮 核心玩法
*   **物理发泄**：鼠标控制巨大的物理刚体，撞击、挥舞、粉碎一切。享受建筑因重力坍塌的多米诺骨牌效应。
*   **程序化城市**：包含 7 种独特的建筑风格（如双子塔、大金字塔、DNA 螺旋塔、悬索桥等）。
*   **AI 对抗**：
    *   **关卡设计**：Gemini AI 根据你的游玩进度生成独特的城市蓝图。
    *   **实时解说**：AI 扮演突发新闻主播，根据你的破坏分数实时生成嘲讽或惊恐的弹幕。
*   **离线/熔断机制**：即使没有 API Key 或网络中断，内置的程序化生成算法也能保证游戏无限进行。

## 🛠️ 技术栈
*   **Core**: React 19, TypeScript, Vite
*   **3D Engine**: Three.js, @react-three/fiber
*   **Physics**: @react-three/rapier (基于 WebAssembly 的高性能物理引擎)
*   **AI**: Google Gemini API (@google/genai)
*   **Styling**: Tailwind CSS
*   **Audio**: Web Audio API (程序化合成音效，无外部资源依赖)

## 🚀 本地部署指南

### 前置要求
*   Node.js (v16+)
*   npm 或 yarn

### 安装步骤

1.  **克隆仓库**
    ```bash
    git clone <repository-url>
    cd cyber-demolition
    ```

2.  **安装依赖**
    ```bash
    npm install
    ```

3.  **配置 API Key (可选)**
    如果您想体验完整的 AI 关卡生成和解说功能，需要获取 Google Gemini API Key。
    
    在根目录创建 `.env` 文件：
    ```bash
    VITE_GEMINI_API_KEY=your_actual_api_key_here
    ```
    
    > **注意**：如果不配置 API Key，或者 API 配额超限，游戏将自动切换到**离线模式**，使用本地算法生成城市，依然可以完整游玩。

4.  **启动开发服务器**
    ```bash
    npm run dev
    ```

5.  **运行**
    打开浏览器访问终端显示的地址（通常是 `http://localhost:5173`）。

## 🕹️ 操作说明
*   **鼠标移动**: 控制怪兽之手（光球）的位置。
*   **鼠标左键 / 右键**: 激活“重击模式”（变红），此时碰撞体积变大且高度降低，可粉碎建筑物。
*   **鼠标滚轮**: 缩放视角。
*   **目标**: 摧毁建筑获得混乱分数 (Chaos Score)，填满顶部的进度条即可进入下一关。

## License
MIT
