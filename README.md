# Mesh Graffiti Studio

一个基于 **React + TypeScript + React Three Fiber** 的 3D 模型表面贴花创作 Web Demo。

项目目标不是做一个复杂的专业建模软件，而是在有限时间内跑通一个完整、可解释、可演示、可部署的 3D 创作闭环：加载模型，选择或上传图片素材，将图片贴到模型表面，调整贴花效果，编辑基础材质，并导出 GLB 文件用于外部 3D 软件检查。

- GitHub: https://github.com/ltltalon/mesh-graffiti-demo
- Vercel Demo: 部署完成后补充

## 快速开始

安装依赖：

```bash
npm install
```

本地启动：

```bash
npm run dev
```

打开页面：

```text
http://localhost:5173/
```

构建：

```bash
npm run build
```

## 当前功能

- 默认模型：`Suitcase.glb`
- 预设模型：`Suitcase`、`Mug`、`Refrigirator`
- 支持导入模型格式：`GLB`、`GLTF`、`OBJ`、`STL`
- 预设贴图素材：Meshy logo 贴纸和 12 张专辑封面 JPG
- 支持上传本地图片：`PNG`、`JPG`、`WebP`
- 支持贴花放置：选择贴图后，鼠标移动到模型表面预览，单击放置
- 支持贴花预览：放置前显示贴图效果和方向标识
- 支持贴花控制：大小、方向、透明度
- 快捷键：贴花工作时按住 `Alt` 并滚动鼠标滚轮，可以快速调整贴花预览大小
- 相机视角：`perspective`、`two-point perspective`、`orthogonal`
- 撤销：`reset` 按钮可以撤销上一步贴花或材质修改
- 材质编辑：可以选择模型 mesh/material 区域并调整颜色、粗糙度、金属度、透明度
- 材质配置导出：可以导出材质配置 JSON
- GLB 导出：导出模型和已放置的贴花 mesh
- 新手教程：首次打开页面时出现 5 步引导

## 产品调研：MakerWorld Mesh Graffiti

MakerWorld Mesh Graffiti 的核心优势是把一个对普通用户来说比较复杂的 3D 表面贴图任务，压缩成了一个很短的创作流程：导入模型，添加图片，预览贴到模型表面的效果，调整，然后导出。

这个产品给我的最大启发是：用户不应该先理解 UV、材质、法线、Blender 工作流，才能看到结果。贴图类工具最重要的是即时反馈。用户选择一张图片后，应该马上能在模型表面看到它，而不是只看到一堆参数。

它的不足也比较明显：产品内部的实现方式对用户并不透明。用户能看到图案贴上去了，但不一定知道它是材质贴图、decal 投射、贴近表面的 plane，还是平台后端处理后的结果。对于真实产品这不一定是问题，但对于本作业来说，必须说明技术路线，解释导出后为什么能在其他 3D 软件里看到效果。

因此，我的产品判断是：**借鉴 MakerWorld Mesh Graffiti 的短流程和直接反馈，但把技术路线设计得更可解释。** 本项目选择以 Decal 贴花作为主要交互方式，同时加入材质编辑模块，让 Demo 更像一个轻量的 3D 表面创作工具，而不是单纯的模型查看器。

## 技术方案对比

| 方案 | 实现方式 | 优点 | 缺点 | 导出可行性 |
| --- | --- | --- | --- | --- |
| A. Decal 投射贴花 | 通过 raycaster 获取模型表面点击点和法线，再用 `DecalGeometry` 生成贴花 mesh | 交互最自然，适合“点击模型表面放置图片”；预览直观；开发成本可控 | 贴花不是烘焙进原材质；导出后是独立 mesh；需要处理 z-fighting | 适合 Demo。导出模型和贴花 mesh，可以在外部软件中看到效果 |
| B. Canvas texture / material map | 将图片绘制进 canvas texture，再作为材质 map 应用到模型 | 更容易解释为“图片进入模型材质”；导出验证更直接 | 强依赖模型 UV；任意点击曲面放置比较难；复杂模型容易出现 UV 接缝问题 | 如果模型 UV 良好，导出说服力强 |
| C. Plane / Sprite 伪贴图 | 在模型表面附近放置一张透明图片平面 | 最快实现视觉效果 | 曲面贴合差；导出后不像真正贴在模型表面；说服力弱 | 较弱，适合作为临时演示 |

最终选择：**以 Decal 投射贴花作为主路线，材质编辑作为补充功能。**

选择原因：

- 本作业重视完整交互闭环，Decal 最符合“点击模型表面放置素材”的直觉。
- Decal 不依赖模型必须有优秀 UV，比 canvas texture 路线更稳。
- 导出时将模型和贴花 mesh 一起导出为 GLB，可以在 Blender 等软件中检查结果。
- 为了减少导出后闪烁，贴花顶点会沿法线方向做极小偏移，降低 z-fighting 风险。

## UI Wireframe

```text
+--------------------------------------------------------------------------------+
| Mesh Graffiti Studio                                      Preview | Export GLB  |
+----------------------+------------------------------------+--------------------+
| Workflow             | 3D viewport                         | Surface Editor     |
| 01 Import Model      | - scene mode switch                 | Materials          |
| 02 Upload Image      | - export shortcut                   | Editable Regions   |
| 03 Place on Surface  | - decal preview                     | Material Params    |
| 04 Adjust            | - lighting drawer                   | Texture Slots      |
| 05 Export GLB        | - camera toolbar + reset            | Decal Controls     |
|                      |                                    |                    |
| Model Source         |                                    |                    |
| Preset models        |                                    |                    |
| Choose Model         |                                    |                    |
|                      |                                    |                    |
| Sticker Assets       |                                    |                    |
| Upload + presets     |                                    |                    |
+----------------------+------------------------------------+--------------------+
```

## 项目结构

```text
src/
  App.tsx
    管理主要产品状态，包括上传、贴花、材质、撤销、相机模式、新手教程和导出触发。

  components/
    Scene.tsx
      R3F Canvas、灯光、网格、相机模式、OrbitControls、GLTFExporter。

    ModelViewer.tsx
      模型加载、mesh/material 解析、raycast 贴花放置、贴花预览、材质区域选择。

    AssetPanel.tsx
      图片上传、预设贴图展示、缩略图选择。

    Toolbar.tsx
      相机视角命令和 reset 撤销命令。

  lib/
    textureUtils.ts
      上传图片资源创建、图片宽高比读取、预设贴图数据。

  state/
    editorStore.ts
      Decal、MaterialRegion、MaterialSettings、ModelFormat 等共享类型。
```

## 数据流

```text
用户选择模型
  -> App 记录 modelUrl 和 modelFormat
  -> Scene 将模型信息传给 ModelViewer
  -> ModelViewer 使用 GLTFLoader / OBJLoader / STLLoader 加载模型
  -> ModelViewer 遍历 mesh 和 material，将可编辑材质区域回传给 App

用户选择贴图
  -> AssetPanel 回传 selectedAssetId
  -> App 记录 texture URL 和图片宽高比
  -> ModelViewer 根据鼠标 raycast 命中点和法线生成贴花预览
  -> 用户单击后创建 DecalGeometry，并将 decal 存入 App state

用户编辑材质
  -> 鼠标悬停或点击模型区域
  -> App 记录 selectedMaterialRegionId
  -> 右侧 Surface Editor 修改 MaterialSettings
  -> ModelViewer 将 MeshStandardMaterial 应用到对应 mesh/material slot

用户导出
  -> App 更新 exportRequestId
  -> SceneExporter 查找 `mesh-graffiti-export-root`
  -> GLTFExporter 导出模型和贴花 mesh 为 GLB
```

## Must-have 完成情况

| 要求 | 状态 | 说明 |
| --- | --- | --- |
| 加载 3D 模型 | 已完成 | 支持预设 GLB 和自定义 GLB/GLTF/OBJ/STL |
| 上传图片素材 | 已完成 | 支持 PNG/JPG/WebP |
| 上传后显示缩略图 | 已完成 | 左侧素材面板显示缩略图 |
| 图片出现在模型表面 | 已完成 | 使用 raycast + DecalGeometry |
| 调整贴图位置/参数 | 部分完成 | 支持大小、方向、透明度；支持 Alt + 鼠标滚轮快速缩放 |
| 3D 预览 | 已完成 | R3F 实时预览，贴花放置前有方向标识 |
| 导出 GLB/GLTF | 已完成 | 导出 GLB，包含模型和贴花 mesh |
| Vercel 部署 | 待完成 | 部署后补充链接 |
| README/REPORT | 已完成 | 本文件包含调研、技术选择、AI 协作、踩坑、时间线 |

## 已知限制

- 当前 Decal 是独立贴花 mesh，并没有真正烘焙进原模型材质贴图。
- 右侧 Texture Slots 已预留 `map`、`normalMap`、`roughnessMap`、`metalnessMap` 的结构，但还没有完成完整贴图上传流程。
- STL 文件通常没有材质和 UV 信息，因此材质编辑能力比 GLB 弱。
- 不同外部 3D 软件对贴近表面的 decal mesh 渲染可能不同。当前通过法线方向极小偏移减少闪烁。
- `reset` 撤销目前覆盖贴花放置和材质修改，不覆盖所有 UI 状态。

## AI 协作记录

本项目使用 AI 作为结对开发助手。AI 主要帮助我快速进入 R3F、Three.js、DecalGeometry、GLTFExporter 等陌生技术点，并协助整理 README/REPORT。产品判断、功能优先级和最终取舍由我决定。

### 1. 技术路线调研

Prompt:

```text
请基于 React Three Fiber，实现用户上传图片并贴到 GLB 模型表面，
且最终可导出 GLB，在 Blender 里看到贴图效果。
列出 3 种技术路线，比较性能、视觉质量、实作难度、导出可行性，
并推荐 4-6 小时内最稳方案。
```

AI 输出：

- Decal 投射贴图
- Canvas texture / material map
- Plane / sprite 伪贴图

我的采纳和调整：

最开始我认为 canvas texture 更容易解释“贴图进入材质”，但后续根据交互需求改为 Decal 主路线，因为它更适合点击模型表面放置图片。

### 2. 项目骨架搭建

Prompt:

```text
请创建一个 Vite React TypeScript + R3F 项目结构，
目标是 3D 模型贴图编辑器。
先只实现模型加载、OrbitControls、基础灯光、文件上传 UI，
不要做复杂功能。代码要组件拆分清晰。
```

结果：

项目拆分为 `Scene`、`ModelViewer`、`AssetPanel`、`Toolbar`、`textureUtils`、`editorStore`，后续功能基本都沿这个结构扩展。

### 3. Decal 贴花实现

Prompt:

```text
使用 Decal 贴花路径实现贴图效果。
模型加载支持 STL/OBJ/GLB。
用户上传图片生成 Texture。
点击模型表面用 Raycaster 获取位置和法线。
创建贴花并导出 GLB。
```

结果：

AI 协助实现 raycast 命中点、法线方向、`DecalGeometry`、贴花预览、贴花方向标识和 GLB 导出。

### 4. 交互问题修正

Prompt:

```text
贴图使用的时候会拉伸变形。
控制器控制的应该是即将贴放的贴画，而不是上一个已经贴过的贴图。
添加一个垂直标识。
左键短点击放置贴画，长按鼠标左键控制模型旋转而不贴图。
```

结果：

实现了图片宽高比读取、预览贴花控制、短点击和拖拽区分、方向标识、右键不贴图等交互优化。

### 5. 产品体验完善

Prompt:

```text
完善所有未完成的交互 UI。
添加新手教程。
修复 Alt + 鼠标滚轮快捷键。
```

结果：

最终加入了新手引导、视角切换、灯光预设、材质区域选择、撤销、预设模型、预设贴图资源，以及固定高度布局。

## 开发时间线与 commit 证据

| 阶段 | 内容 | Commit |
| --- | --- | --- |
| 1. 项目骨架 | Vite + React + TS + R3F 基础结构 | `93bd52f chore: scaffold texture editor app` |
| 2. 最小闭环 | 模型加载、图片上传、缩略图、基础贴图 | `12f9a95 feat: add model and texture upload loop` |
| 3. 模型格式 | 支持 STL 导入 | `e70b206 feat: support stl model imports` |
| 4. Decal 路线 | 贴花放置、预设贴纸、GLB 导出 | `8a122f1 feat: implement decal sticker placement` |
| 5. 默认模型 | 使用 Suitcase 作为默认模型 | `615431e feat: use suitcase as default model` |
| 6. Decal 体验 | 预览控制、比例保持、方向标识 | `04080fb`、`21530e5`、`dbf1c21` |
| 7. 产品完善 | 材质编辑、预设模型、相机模式、撤销 | `3c8507c 产品基本完成` |
| 8. Demo polish | 新手教程、快捷键修复 | `8da24d1 成果demo，添加新手教程，修复快捷键bug` |

## 踩坑与修复

- 问题：贴图出现拉伸。
  - 解决：读取图片原始宽高比，并用独立的 decal width/height 生成贴花。

- 问题：控制器修改的是上一张贴花，而不是下一张即将放置的贴花。
  - 解决：新增 `previewSettings`，控制器只影响预览和下一次创建的 decal。

- 问题：导出 GLB 后外部软件中贴花闪烁。
  - 解决：导出 decal mesh 时沿法线方向做极小偏移，降低 z-fighting。

- 问题：`Alt + 鼠标滚轮` 一开始会影响页面滚动或相机缩放。
  - 解决：将滚轮事件处理放到 3D 舞台 capture 阶段，同时将页面设置为固定高度。

- 问题：材质编辑没有明确对象。
  - 解决：模型加载后遍历 mesh/material/group，生成可编辑区域列表，并支持悬停高亮和点击选择。

- 问题：初次使用者不知道从哪里开始。
  - 解决：加入 5 步新手教程，用白色虚线框依次高亮主要功能区域。

## 如果再给一天时间

- 实现 decal 烘焙，把贴花真正合并进模型材质贴图。
- 完成 `map`、`normalMap`、`roughnessMap`、`metalnessMap` 的纹理上传。
- 增加贴花图层列表，支持选中已放置贴花后删除、重新调整、排序。
- 增加项目保存/读取，将模型、贴花、材质配置保存为 JSON。
- 增加 Blender 或 glTF validator 的导出验证流程。
- 部署到 Vercel，并把公开 Demo 链接补充到 README。

## 项目资源

预设模型：

- `public/models/Suitcase.glb`
- `public/models/Mug.glb`
- `public/models/Refrigirator.glb`

预设贴图：

- `public/stickers/meshy-logo-128px-white.png`
- `public/stickers/meshy-logo-128px-accent.png`
- `public/stickers/meshy-logo-128px-black.png`
- `public/stickers/meshy-logo-128px-mix.png`
- `public/stickers/001.jpg` 到 `public/stickers/012.jpg`

## 说明

这是一个课程/作业性质的 Web Demo。它的重点是证明我可以使用 AI 快速进入陌生技术栈，完成一个可解释、可演示、可导出的 3D 创作原型，而不是一次性实现完整的专业级材质编辑器。
