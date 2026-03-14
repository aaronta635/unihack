# Game textures (optional)

For a **realistic look**, use image textures here or load them **from the internet** via URLs. The game tries local files first, then env URLs; if none load, it falls back to procedural textures.

## Option A: Local files (drop into this folder)

| File          | Use    | Suggested source |
|---------------|--------|------------------|
| `ground.jpg`  | Ground | [AmbientCG: Ground037](https://ambientcg.com/view?id=Ground037) → 1K-JPG, Color. Rename to `ground.jpg`. |
| `bark.jpg`    | Trees  | [AmbientCG: Bark006](https://ambientcg.com/view?id=Bark006) → 1K-JPG, Color. Rename to `bark.jpg`. |

All AmbientCG assets are CC0 (free). You can also use **grass** or **forest ground** from [Poly Haven](https://polyhaven.com/textures) — download the 1K diffuse/color map and save as `ground.jpg` or `grass.jpg`.

## Option B: Textures from the internet (URLs)

You can load textures from any **direct image URL** (must be CORS-enabled if the game runs on a different domain). Create `.env.local` in the project root and set:

```bash
# Paste direct image URLs (right‑click image → Copy image address, or use a CDN link)
NEXT_PUBLIC_GROUND_TEXTURE_URL=https://example.com/path/to/grass.jpg
NEXT_PUBLIC_BARK_TEXTURE_URL=https://example.com/path/to/bark.jpg
```

**Where to get free tileable textures:**

- **AmbientCG** — [ambientcg.com](https://ambientcg.com): download the 1K JPG Color map, host it somewhere (e.g. your repo, imgur, or a CDN), then paste that URL into `.env.local`.
- **Poly Haven** — [polyhaven.com/textures](https://polyhaven.com/textures): download 1K diffuse, host the image, and use its URL.
- **OpenGameArt, itch.io** — many CC0 tileable grass/ground textures; use the final image URL in the env vars.

The app tries **local paths first** (`/textures/ground.jpg`, `/textures/bark.jpg`), then these env URLs. Restart the dev server after changing `.env.local`.
