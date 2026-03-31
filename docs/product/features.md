# 小书虫 - 学习管理系统 产品需求文档

## 产品概述

小书虫是一款面向小学生家庭的学习任务管理系统。家长在后台配置学习任务，孩子在手机上查看每日任务并打卡。系统支持智能任务分配、多用户数据隔离、学习报告推送等功能。

## 核心功能

### 1. 用户系统
- 家庭注册：创建家庭，设置家庭码
- 用户登录：家庭码 + 用户名 + 密码
- 角色权限：家长（配置管理） / 孩子（查看打卡）
- 一个家庭多个孩子，家长可切换查看
- Demo模式：未登录展示示例数据

### 2. 家长后台
- **任务配置**：添加/编辑/删除任务，设置分类、类型、频率、时长
- **发布下周计划**：一键生成下周任务，分配到每个孩子
- **图书管理**：新增/编辑/删除图书
- **成就配置**：设置成就解锁条件
- **孩子管理**：添加/管理孩子账号
- **系统设置**：钉钉Webhook、每日时间上限

### 3. 孩子前台
- **今日任务打卡**：固定任务（3状态）、灵活任务（含校内巩固4状态）、待补任务、提前完成
- **本周进度**：整体进度展示
- **图书馆**：浏览图书 + 阅读打卡
- **成就墙**：已获成就展示 + 学习统计

### 4. 报告系统
- 每日学习报告（完成率、时长、任务明细）
- 每周学习报告
- 钉钉推送

## 智能分配规则

| 任务类型 | 分配规则 |
|---------|---------|
| 校内作业 | 仅周一、二、四、五，周三排除 |
| 校内巩固（一课一练） | 推到灵活任务区，4状态选项 |
| 校内拔高（培优/高思/全新英语） | 仅周末 |
| 其他固定任务 | 每天正常分配 |
| OD课程 | 紧迫度检测，剩余≥天数时强制分配 |
| 每日上限 | 210分钟 |

### 校内巩固4状态
| 状态 | 含义 | 按钮 |
|------|------|------|
| 今日无新课 | 学校没上新课 | 灰色 |
| 完成 | 有新课且完成 | 绿色 |
| 部分完成 | 有新课但只做了一部分 | 黄色 |
| 未完成 | 有新课但没做 | 红色 |

## 页面结构

### 前台（孩子）
- `/child` - 首页（今日任务 + 进度）
- `/child/library` - 图书馆
- `/child/achievements` - 成就墙
- `/child/reports` - 报告

### 后台（家长）
- `/parent` - 后台首页（概览）
- `/parent/tasks` - 任务配置
- `/parent/plans` - 计划管理
- `/parent/library` - 图书管理
- `/parent/achievements` - 成就配置
- `/parent/children` - 孩子管理
- `/parent/settings` - 系统设置

### 公共页面
- `/` - 未登录首页（Demo模式）
- `/login` - 登录
- `/register` - 注册

## 数据模型

- **families**: id, name, family_code, settings
- **users**: id, name, role, avatar, family_id, password_hash
- **tasks**: id, family_id, name, category, type, time_per_unit, weekly_rule
- **weekly_plans**: id, family_id, child_id, task_id, target, progress, week_no
- **daily_checkins**: id, family_id, child_id, task_id, plan_id, status, value, check_date
- **books**: id, family_id, name, author, type, cover_url, target
- **reading_logs**: id, family_id, child_id, book_id, pages, minutes, read_date
- **achievements**: id, family_id, icon, name, description, condition
- **achievement_logs**: id, family_id, child_id, achievement_id, unlocked_at

## 设计风格
- 面向小学生，马卡龙配色，圆润可爱
- 主色粉色（#FFB5BA），蓝色（#7DD3FC）、绿色（#7EDACA）、紫色（#C4B5FD）
- 字体 Nunito
