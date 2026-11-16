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
- 节点库支持拖拽到画布或点击添加，新增节点后自动打开对应配置面板
- 浅色节点式工作流工作台支持贝塞尔曲线连线、非法连接原因提示和拖线呼吸引导
- 按节点类型配置知识库文件、检索参数、模型、推理等级、用量倍率和报告导出选项
- 支持单节点测试与完整工作流运行，推理等级按 1x / 2x / 3x 倍率计入会员用量
- 工作流运行状态可视化，运行完成后可导出带品牌抬头、分析图表和改进建议的 PDF 评审报告
- 会员中心支持游客浏览套餐，登录后查看用户 ID、会员类型、到期时间和 4 小时 / 24 小时 / 周期总用量
- Free、Pro、Team 三级会员限额，达到任一滚动窗口上限后由服务端阻止继续运行
- 独立 `/admin` 管理后台：用户、角色、状态、订阅和用量重置
- 支持 OpenAI 兼容 API，未配置密钥时自动进入演示模式

## 技术栈

- Web：Vue 3、Vite、XYFlow、Lucide Icons
- API：Node.js、Express、JWT、bcryptjs
- 数据：SQLite（`backend/data/database.db`）
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

复制 `backend/.env.example` 为 `backend/.env`，至少修改 `JWT_SECRET`：

```env
JWT_SECRET=replace-with-a-long-random-string
WEB_ORIGINS=http://localhost:5173,http://localhost:5174
ADMIN_EMAILS=admin@example.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_EMAIL=admin@projectlens.local
```

模型API地址、密钥与默认模型在管理后台的“模型API配置”中设置，支持DeepSeek Auto、ChatGPT Auto和Qwen Auto。配置保存在已被Git忽略的`backend/data/database.db`，管理接口只返回密钥脱敏预览。请勿将数据库文件提交到公开仓库。

`ADMIN_EMAILS` 支持配置多个逗号分隔的管理员邮箱。管理员登录后可直接访问 `http://localhost:5173/admin`。

首次启动会创建 Demo 管理员 `admin / admin123`。公开部署前必须通过环境变量修改默认管理员密码。

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

## 当前部署边界

当前支持文本与Markdown材料。SQLite适用于单实例部署；多实例或高并发部署建议升级为PostgreSQL，并配套对象存储、向量数据库和异步评审任务。

## License

MIT
