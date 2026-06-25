# 世界杯每日看球 Skill

`world-cup-daily` 是一个 Codex Skill，用来生成个性化的中文世界杯每日看球日报。

它会根据你的球队、球星、时区和推送偏好，生成一份可独立打开的 HTML 日报，包含：

- 昨日战况
- 今日趣闻
- 今日可看的比赛推荐
- 明日比赛预告
- 一键加入日历的 ICS 文件
- Google Calendar 添加链接
- 可修改偏好的 HTML 入口

这个 Skill 的原则是：不使用假数据。赛程、比分和新闻必须来自真实来源；取不到实时数据时会明确标注缓存或缺失，不会编造比分、阵容、伤病或新闻。

## 安装方式

在 Codex 里对它说：

```text
请安装这个 Skill：
https://github.com/Spongewarrior/world-cup-daily
```

安装完成后，重启 Codex，让新 Skill 生效。

然后可以这样开始：

```text
使用 $world-cup-daily，帮我初始化世界杯每日看球日报。
```

## 首次使用

Skill 会先询问你的偏好：

- 喜欢的球队，可以多个，也可以跳过
- 关注的球星，可以多个，也可以跳过
- 所在时区，例如 `Asia/Shanghai`
- 每日推送时间，默认 `08:00`
- 比赛提醒提前量，默认 30 分钟
- 内容密度：精简、均衡、深度

配置会保存在你选择的工作目录里：

```text
.world-cup-daily/
├── profile.json
├── cache/
└── digests/
```

## 配置比赛数据 Token

比赛数据主要来自 [football-data.org](https://www.football-data.org/)。

你需要自己申请免费 API Token。推荐把它放在本地环境文件里，便于 Codex 自动任务和本地脚本复用：

```bash
mkdir -p ~/.config/world-cup-daily
echo 'FOOTBALL_DATA_API_TOKEN="你的 token"' > ~/.config/world-cup-daily/env
```

如果你只是临时在当前终端里运行，也可以直接导出环境变量：

```bash
export FOOTBALL_DATA_API_TOKEN="你的 token"
```

注意：

- 不要把 Token 写进 `profile.json`
- 不要把 Token 写进 HTML
- 没有 Token 时，Skill 不会假装拿到了实时赛程
- 如果有缓存，会使用缓存并明确标注“缓存数据”
- 本地辅助脚本默认会读取 `~/.config/world-cup-daily/env`

## 生成日报

初始化完成后，可以说：

```text
使用 $world-cup-daily，生成今天的世界杯日报。
```

生成结果会保存为 HTML 文件，通常在：

```text
.world-cup-daily/digests/YYYY-MM-DD.html
```

HTML 是单文件，可在桌面或手机浏览器打开。

如果你 clone 了这个仓库，也可以使用本地辅助脚本：

```bash
bash scripts/run-local-digest.sh
```

这个脚本会先检查 football-data.org 访问状态，拉取最新比赛数据，再基于缓存生成并验证 HTML。

如果你只想预抓取比赛数据：

```bash
bash scripts/prefetch-live-matches.sh
```

如果你已经有比赛缓存和新闻缓存，只想重新构建 HTML：

```bash
bash scripts/build-digest-from-cache.sh
```

## 每日自动推送

你可以让 Codex 创建每日自动任务：

```text
使用 $world-cup-daily，每天早上 8 点生成世界杯日报。
```

Skill 会根据你的 `profile.json` 里的时区和推送时间来安排任务。

如果你后来修改了时区或每日推送时间，需要让 Codex 同步更新自动任务。

## 修改偏好

有两种方式：

### 方式一：直接告诉 Codex

```text
使用 $world-cup-daily，把我关注的球队改成阿根廷、巴西，球星改成梅西。
```

### 方式二：在 HTML 日报里修改

日报右上角有“修改偏好”按钮。

你可以在页面里修改：

- 球队
- 球星
- 时区
- 推送时间
- 提醒提前量
- 内容密度

页面会生成新的 `profile.json`，或者复制一段可发给 Codex 的修改指令。

## 日历预约

今日和明日比赛卡片提供：

- 加入日历：下载 ICS 文件
- Google 日历：打开 Google Calendar 添加链接

日历事件是日报生成时的赛程快照。若比赛时间之后发生变化，请以后续日报和赛事官方信息为准。

## 数据来源策略

比赛数据：

- 主来源：football-data.org
- 辅助核验：FIFA 官方赛程与赛果页

新闻来源优先级：

1. FIFA 官方、球队官方、足协官方
2. Reuters、AP、BBC、ESPN 等有编辑审核的媒体
3. 传闻类信息必须标注“尚未确认”

新闻只展示标题、原创摘要、来源和链接，不复制新闻全文。

## 常见问题

### 没有 API Token 能用吗？

可以初始化和预览结构，但不能声称拿到了实时赛程。若本地已有缓存，会标注缓存时间；没有缓存则会明确失败。

### 为什么新闻少于 3 条？

这是设计如此。找不到足够可靠新闻时，Skill 会减少条数，不会用低质量内容凑数。

### 为什么已经加入日历的比赛不会自动更新？

第一版只生成静态 ICS / Google Calendar 链接，不维护服务端账号，也不会自动修改你已经导入的日历事件。赛程变化会在后续日报中提示。

### HTML 里会暴露我的 Token 吗？

不会。Token 只从环境变量读取，不会写入 `profile.json` 或 HTML。

## 本地测试

如果你 clone 了这个仓库，可以运行：

```bash
node tests/run.mjs
```

如果想检查当前机器能否访问 football-data.org：

```bash
node scripts/check-live-access.mjs
```

这个测试会覆盖：

- 缓存回退
- 时区边界
- 中文球队名展示
- 中文偏好匹配
- HTML 渲染
- 日历入口
- Token 防泄漏
- 无效新闻过滤

## 适用范围

第一版默认：

- 中文界面
- Codex 每日任务作为推送渠道
- HTML 单文件日报
- 日历预约通过 ICS / Google Calendar 完成

暂不支持：

- 实时文字直播
- 赔率
- 竞猜
- 票务
- 视频播放链接
- 服务端账号系统
