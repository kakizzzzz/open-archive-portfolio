# An Open Archive

A monochrome portfolio template for small ideas, selected work, and stories worth keeping.

**[Live demo](https://kakizzzzz.github.io/open-archive-portfolio/) · [Repository](https://github.com/kakizzzzz/open-archive-portfolio) · Created by [KAKI](https://github.com/kakizzzzz)**

一个黑白、由滚动控制的作品集模板：从电脑开场进入纸条展板，再展开作品长廊。替换示例内容，就可以成为你自己的档案。

## Inside the archive

- A single scroll progress value, `t`, controls the scene. Scroll backward to reverse the sequence.
- A flat computer opening, a paper-note board, and clickable detail dialogs.
- One gallery DOM moves between the board and the full-screen view through a portal.
- A horizontal gallery with equal-height images on mobile; image count and spacing follow your content.
- An editable profile dialog and English placeholder content.

保留电脑、便利贴与长廊的连续滚动体验；支持手机布局、点击查看详情，以及替换图片后的自动页数更新。

## Get started

Choose **Use this template** on GitHub, or fork the repository. Clone your copy, then run:

```sh
npm ci
npm run dev
```

```sh
npm run typecheck
npm run build
npm run preview
```

`dev` starts local development; `build` creates the static site; `preview` serves that build locally.

先创建自己的副本，再安装依赖并启动。发布前可运行类型检查和构建，在本地预览构建结果。

## Make it yours

| File | What to edit / 修改内容 |
| --- | --- |
| `components/archive/content.ts` | Profile, contact placeholders, text, and `portfolioWorks` / 个人信息、联系方式、文案与作品列表 |
| `components/archive/archive.css` | Colors, typography, and paper styling / 配色、字体与纸张样式 |
| `public/assets/template/` | Replace the sample graphics with your own images / 替换示例图 |
| `main.tsx` | Application entry and font imports / 页面入口与字体导入 |

Start with `templateProfile`, `contactEmail`, `contactPhone`, and `templateResume`. All contact details are examples. For each gallery item, provide its image path and actual `width` and `height`; the gallery uses these dimensions to keep a consistent image height.

建议先修改资料与联系方式。替换作品时，同时填写图片的真实宽高，长廊会按同一展示高度计算图片宽度。作品数量可增减，无需手动修改页码。

### Computer-screen video

Configure `introMedia.src` and `introMedia.poster` in `components/archive/content.ts`. Replace `public/assets/template/intro-pingpong.mp4` and `public/assets/template/intro-poster.jpg` with your own clip and still image. Both fields accept `null`; set both to `null` for a text-only screen.

The video sits behind the title, cropped to the screen in black and white. The demo plays forward, then backward, without repeating either turning frame. It loops silently, pauses when the opening is hidden or the browser tab is in the background, and shows the static poster when reduced motion is enabled.

在 `introMedia` 中配置视频与海报路径，替换上述文件即可。两个字段都可设为 `null`；全部置空后保留纯文字屏幕。示例以正放、倒放往返衔接，转向点不重复停帧。视频在标题后方黑白裁剪、静音循环；离开开场或切到后台时暂停，减少动态效果模式下显示静态海报。

The bundled screen clip and its poster are demo media outside the MIT grant. Replace them with your own licensed media when redistributing your copy. The template's MIT license does not automatically cover media you add. 示例屏幕视频及海报不包含在 MIT 授权中；分发自己的副本时，请替换为自己有权使用与发布的媒体。

## Publish with GitHub Pages

1. Open your repository's **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Push your changes to `main` and wait for the Pages workflow to finish.

The workflow uses `actions/configure-pages` and its `base_path` output so asset paths adapt to your repository name. Your site is usually available at `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`.

在 Pages 设置中选择 GitHub Actions，推送到 `main` 后由工作流构建发布。仓库改名或从模板创建新仓库时，资源路径会使用 Pages 返回的部署路径。

## Credits and license

Created by **KAKI**. Original template code and artwork are released under the [MIT License](LICENSE). When redistributing copies or substantial portions, retain the copyright notice and the complete license text. Keeping the visible website credit is appreciated, but is not an additional requirement of MIT.

模板原创代码与图形采用 MIT 许可。再次分发时，请保留版权声明与许可原文；欢迎保留网页中的 KAKI 署名，但 MIT 不额外强制网页署名。

Third-party fonts are licensed under the **SIL Open Font License**. Their licenses, and other third-party notices, remain independent of MIT; see [`licenses/`](licenses/) and [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

Short poetry excerpts are credited to their authors, with source links:

- [Walt Whitman — A Clear Midnight](https://poets.org/poem/clear-midnight)
- [Emily Dickinson — “Hope” is the thing with feathers](https://poets.org/poem/hope-thing-feathers-254)
- [William Blake — Auguries of Innocence](https://poets.org/poem/auguries-innocence)

These nineteenth-century poems are public domain in the United States. Check their status in your jurisdiction when reusing them. 字体与第三方依赖保留各自许可；短诗来自上述公版来源，使用时请核对所在地的版权状态。
