# DuTeam ProjectLens

面向大学生竞赛与课程项目的证据驱动型 AI 评审与改进 Agent。

ProjectLens 通过 Agent 工作流分析项目材料，按照 AI Web 竞赛评分维度生成可解释评分、证据引用、问题诊断和改进路线。没有配置模型密钥时，系统会使用内置演示评审，便于本地开发和比赛展示。

## 功能

- 本地账号注册与登录，密码使用 bcrypt 哈希存储
- 创建和管理评审项目
- 粘贴项目材料或导入 TXT / Markdown 文件
- 六维加权评分、优先问题和改进建议
- Agent 执行路径与评分证据链展示
- 商业化产品门户与登录、注册入口
- AI 工具中心与最近使用记录
- 可拖拽、连线、配置和运行的节点式工作流工作台
- 支持 OpenAI 兼容 API，未配置密钥时自动进入演示模式

## 技术栈

- Web：Vue 3、Vite、XYFlow、Lucide Icons
- API：Node.js、Express、JWT、bcryptjs
- 数据：本地 JSON 存储（首版 Demo）
- AI：OpenAI-compatible Chat Completions API

## 本地运行

要求 Node.js 20 或更高版本。

```bash
npm install
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
npm run dev
```

打开 `http://localhost:5173`。API 默认运行在 `http://localhost:3001`。

## 环境变量

复制 `backend/.env.example` 为 `backend/.env`，至少修改 `JWT_SECRET`。模型配置是可选的：

```env
JWT_SECRET=replace-with-a-long-random-string
WEB_ORIGINS=http://localhost:5173,http://localhost:5174
AI_API_KEY=
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
```

`.env` 已加入 `.gitignore`，请勿将真实 API 密钥提交到仓库。`frontend/.env` 只能存放公开配置，任何模型密钥必须保留在 `backend/.env` 中。

## 项目结构

```text
frontend/    Vue 前端，可独立安装与启动
backend/     Express API、认证和评审服务，可独立安装与启动
```

也可以分别启动：

```bash
cd backend
npm install
npm run dev
```

```bash
cd frontend
npm install
npm run dev
```

## 当前 Demo 边界

首版仅支持文本与 Markdown 材料；本地 JSON 存储用于快速演示，不适合多实例生产部署。后续可升级为 PostgreSQL、对象存储、向量数据库和异步评审任务。

## License

MIT
