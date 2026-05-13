# Mesh Graffiti Studio

一个基于 **React + TypeScript + React Three Fiber** 的 3D 模型表面贴花创作 Web Demo。

- Vercel Demo:https://mesh-graffiti-demo.netlify.app/

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
- 支持贴花放置：选择贴图后，鼠标移动到模型表面预览，单击放置(存在瑕疵：贴图重叠后显示bug)
- 支持贴花预览：放置前显示贴图效果和方向标识
- 支持贴花控制：大小、方向、透明度
- 快捷键：贴花工作时按住 `Alt` 并滚动鼠标滚轮，可以快速调整贴花预览大小
- 相机视角：`perspective`、`two-point perspective`、`orthogonal`
- 撤销：`reset` 按钮可以撤销上一步贴花或材质修改
- 材质编辑：可以选择模型 mesh/material 区域并调整颜色、粗糙度、金属度、透明度
- 材质配置导出：可以导出材质配置 JSON
- GLB 导出：导出模型和已放置的贴花 mesh
- 新手教程：首次打开页面时出现 5 步引导(存在瑕疵未修改)


## 产品调研：MakerWorld Mesh Graffiti

MakerWorld Mesh Graffiti给我的启发：贴图类工具即时反馈很重要，在用户选择一张图片后，可以马上在模型表面看到它，以及“导入模型，添加图片，预览贴到模型表面的效果，调整，然后导出”整个工作流程是ok的。

不足
- 1.界面UI过于简陋
- 2.场景在3D打印机打印板上，我觉得用户的需求不一定只是3D打印。所以在我的项目中我觉得用户可能有类似于“给自己的行李箱/冰箱/汽车”做贴图设计的测试，因此预设模型也包含了行李箱和冰箱。汽车在测试中出现未解决问题：模型尺度没有自适应，大尺度模型放进来时会导致相机视角出现问题，待修复。
- 3.手动画笔涂鸦的效果并不理想，在我的项目中直接删除此部分功能。
- 4.仅支持STL/3MF格式文件导入，我的项目可以支持GLB/GLTF/OBJ/STL的导入。
- 5.以3D为导向，材质库都是耗材的材质，对于模型本体只能调整颜色，我新增了模型材质和属性的调整控制台。


## 技术方案对比

| 方案 | 实现方式 | 优点 | 缺点 | 导出可行性 |
| --- | --- | --- | --- | --- |
| A. Decal 投射贴花 | 通过 raycaster 获取模型表面点击点和法线，再用 `DecalGeometry` 生成贴花 mesh | 交互最自然，适合“点击模型表面放置图片”；预览直观；开发成本可控 | 贴花不是烘焙进原材质；导出后是独立 mesh；需要处理 z-fighting | 适合 Demo。导出模型和贴花 mesh，可以在外部软件中看到效果 |
| B. Canvas texture / material map | 将图片绘制进 canvas texture，再作为材质 map 应用到模型 | 更容易解释为“图片进入模型材质”；导出验证更直接 | 强依赖模型 UV；任意点击曲面放置比较难；复杂模型容易出现 UV 接缝问题 | 如果模型 UV 良好，导出说服力强 |
| C. Plane / Sprite 伪贴图 | 在模型表面附近放置一张透明图片平面 | 最快实现视觉效果 | 曲面贴合差；导出后不像真正贴在模型表面；说服力弱 | 较弱，适合作为临时演示 |

最终选择：**以 Decal 投射贴花作为主路线，材质编辑作为补充功能。**

选择原因：

- Decal 最符合“点击模型表面放置素材”的直觉。
- Decal 不依赖模型必须有优秀 UV，比 canvas texture 路线更稳。
- 导出时将模型和贴花 mesh 一起导出为 GLB，可以在 Blender 等软件中检查结果。
- 为了减少导出后闪烁，贴花顶点会沿法线方向做极小偏移。


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

## UI Wireframe

UI设计草图（by GPT Image 2.0）上一轮对话讨论完整个网页的架构与基本功能后 考虑到这个产品会用在Creative Lab中，因此：

prompt：现在根据我的要求生成一个首页的ui设计稿，我要求界面的首页是以黑色和绿色为主，主要参考meshy网页的配色设计，左侧为模型导入以及添加的每一个步骤，内嵌一个可自行上传的本地图像的窗口，右侧是材质材质，纹理和颜色的编辑器，内嵌一些主流的颜色库，以及自定义色盘，材质和纹理做成一个库，方便后续的更新其他的基本的元素。参考 MakerWorld Mesh Graffiti，现在给我生成一个首页的ui稿，我来检查并调整。


<img width="1672" height="941" alt="image" src="https://github.com/user-attachments/assets/023a15bc-796b-42d0-b2c9-a6670792ad5a" />


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

## 开发时间线 总共7h（略微超时 完成大部分Nice-to-have）

| 阶段 | 内容 |
| --- | --- |
| 1. 调研+讨论架构 | （0.5h）5.12 16：30-17：00 |
| 2. 调整主界面UI，搭建基本骨架，完成最小闭环 | （2h）5.12 17：00-19：00 |
| 3. 确定Decal贴花方式，修复bug与优化贴画的效果 | （1h）5.12 23：30-00：30 |
| 4. 完善demo，优化使用体验 | （2.5h）5.13 15：00-17：30 |
| 5. 部署+报告撰写 | （1h）17：30-18：30 |
 

## Must-have 完成情况

| 要求 | 状态 | 说明 |
| --- | --- | --- |
| 加载 3D 模型 | 已完成 | 支持预设 GLB 和自定义 GLB/GLTF/OBJ/STL |
| 上传图片素材 | 已完成 | 支持 PNG/JPG/WebP |
| 上传后显示缩略图 | 已完成 | 左侧素材面板显示缩略图 |
| 图片出现在模型表面 | 已完成 | 使用 raycast + DecalGeometry |
| 调整贴图位置/参数 | 已完成 | 支持大小、方向、透明度；支持 Alt + 鼠标滚轮快速缩放（未修复贴图重叠的显示bug） |
| 3D 预览 | 已完成 | R3F 实时预览，贴花放置前有方向标识 |
| 导出 GLB/GLTF | 已完成 | 导出 GLB，包含模型和贴花 mesh |
| Vercel 部署 | 已完成 | https://mesh-graffiti-demo.netlify.app/ |


## AI 协作记录

本项目主要使用 Codex 开发（由于plus限制，本项目在2天内分三次开发完成）。辅助以 gpt 帮助我快速了解 R3F、Three.js、DecalGeometry、GLTFExporter 等陌生技术点。产品判断、功能优先级和最终取舍由我决定。

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


## 踩坑与修复

- 问题：贴图出现拉伸。
  - 解决：读取图片原始宽高比，并用独立的 decal width/height 生成贴花。

- 问题：控制器修改的是上一张已贴上模型的贴花，而不是下一张即将放置的贴花。
  - 解决：新增 `previewSettings`，控制器只影响预览和下一次创建的 decal。

- 问题：导出 GLB 后外部软件中贴花闪烁。
  - 解决：导出 decal mesh 时沿法线方向做极小偏移，降低 z-fighting。

- 问题：`Alt + 鼠标滚轮` 一开始会影响页面滚动或相机缩放。
  - 解决：将滚轮事件处理放到 3D 舞台 capture 阶段，同时将页面设置为固定高度。

- 问题：材质编辑没有明确对象。
  - 解决：模型加载后遍历 mesh/material/group，生成可编辑区域列表，并支持悬停高亮和点击选择。

- 问题：初次使用者不知道从哪里开始。
  - 解决：加入 5 步新手教程，用白色虚线框依次高亮主要功能区域。（存在瑕疵）

## 如果再给一天时间

- 完善上述提到的瑕疵部分
- 完成 `map`、`normalMap`、`roughnessMap`、`metalnessMap` 的纹理上传。
- 增加贴花图层列表，支持选中已放置贴花后删除、重新调整、排序。
- 增加项目保存/读取，将模型、贴花、材质配置保存为 JSON。
- 实现自定义灯光
- 实现模型上传后根据模型尺寸自动匹配相机视角

## 参考技术
- https://github.com/spite/THREE.DecalGeometry.git 借鉴贴图时的垂直射线辅助
- https://gltf-viewer.donmccurdy.com/ 灯光效果

