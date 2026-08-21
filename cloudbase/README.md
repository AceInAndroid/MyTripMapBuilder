# “我们的旅行绘本”CloudBase 资源说明

小程序生产环境：`mytripmap-d3gvmwvxd5dba118e`

原 PostgreSQL 环境 `mytripmap-d3gxxk1psd0b28d72` 保留为迁移备份，不再由小程序调用。当前小程序原生环境使用 CloudBase 文档数据库。

## 集合

- `families`：家庭成员、管理员与 AI 月度配额
- `profiles`：父母身份和女儿档案
- `trips`：旅行、每日路线、地点、日记和照片元数据（首版嵌套存储）
- `share_snapshots`：7 天有效的精选只读分享快照
- `photos`、`trip_days`、`places`、`diary_entries`、`ai_sessions`：为数据量增长预留的拆分集合；首版为保证跨集合一致性，数据仍嵌套在 `trips` 文档中

## 权限边界

业务集合默认禁止小程序客户端直接读写，所有家庭数据通过 `travelBook` 事件函数访问。函数使用微信注入的 `OPENID` 校验 `memberOpenids` 和 `adminOpenids`，客户端传入的 `familyId` 不作为授权依据。

`share_snapshots` 也不直接公开读取，`getShare` 只返回未撤销且未过期的快照，并移除 `familyId`。照片分享仅包含已勾选的展示图，不包含住宿、原图或实时位置。

## AI 上线门禁

`tripAI` 默认不会工作。上线前必须完成：

1. 检查 Token Credits 或小程序成长计划资格；
2. 使用 `DescribeAIModels` 确认目标 GroupName 和模型已启用；
3. 为函数设置 `AI_GROUP`、`AI_MODEL`、`TCB_ENV`，其中 GroupName 只能来自平台实际返回值；
4. 将 `miniprogram/config.js` 中 `ai.enabled` 改为 `true`；
5. 使用 60–120 秒超时部署函数。

未满足上述条件时，小程序使用本地引导式结构化草案，仍可手动创建和调整旅行。

## 当前小程序实现

- `miniprogram/pages/index`：完成旅行只显示成长地图足迹，计划/草稿显示在时间列表。
- `miniprogram/pages/trip/detail`：路线、每日驾驶与儿童安全提醒、按天精选照片、日记和手动完成旅行。
- `miniprogram/pages/planner`：表单生成结构化逐日草案，聊天调整直接更新可编辑草案；AI 未通过门禁时使用本地引导模式。
- `miniprogram/pages/share/select`：逐日勾选照片和日记后生成 7 天只读快照，分享内容过滤住宿。
- `miniprogram/pages/profile`：共享女儿档案、父母邀请码加入、AI 配额和存储状态。
- `miniprogram/pages/recycle`：删除后 30 天内恢复；云端删除/恢复由 `travelBook` 校验家庭管理员权限。
- 照片上传队列同时保留原图文件 ID 和压缩展示图文件 ID，断网时留在本地队列，恢复网络后续传。

部署前仍需由项目管理员在 CloudBase 创建集合、设置“客户端禁止直接读写”的权限、部署云函数并完成 AI 资格检查；代码编译验证不等于云端资源已经部署。
