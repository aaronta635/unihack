# Replacing 3D models & changing movement speed

## 1. How to replace models

The game supports **OBJ** and **GLB/GLTF** for:

| What        | Where to put the file      | Env variable (optional)              |
|------------|-----------------------------|--------------------------------------|
| **Trees**  | `public/model.obj` or `public/models/tree.glb` | `NEXT_PUBLIC_TREE_MODEL_URL=/models/tree.glb` |
| **Checkpoints** (orange spools) | `public/models/checkpoint.glb` | `NEXT_PUBLIC_CHECKPOINT_MODEL_URL=/models/checkpoint.glb` |

- **Trees:** Default path is `/model.obj`. To use another file (e.g. `tree.glb` in `public/models/`), set in `.env.local`:
  ```env
  NEXT_PUBLIC_TREE_MODEL_URL=/models/tree.glb
  ```
- **Checkpoints:** Put your file in `public/models/` (e.g. `checkpoint.glb`), then in `.env.local`:
  ```env
  NEXT_PUBLIC_CHECKPOINT_MODEL_URL=/models/checkpoint.glb
  ```
- Models are **auto-scaled** to fit (trees ~7 units, checkpoints ~2.5 units). Restart the dev server after changing env.

---

## 2. How to change movement speed

- **In code:** Edit `PLAYER_MOVE_SPEED` in `frontend/components/game/GameCanvas3D.jsx` (near the top). Current value is `0.28` (faster than the original `0.15`). Increase for faster movement (e.g. `0.35` or `0.4`).
- Movement uses **WASD** or **arrow keys**; speed is applied each frame.

---

## 3. Steps to use a model you found online

1. **Download** a **GLB** or **OBJ** (and MTL if OBJ uses one; put the MTL next to the OBJ or in the same folder).
2. **Put the file** in `public/` or `public/models/` (e.g. `public/models/tree.glb`).
3. **Use it:**
   - **Trees:** Name it `tree.glb` in `public/models/` and set `NEXT_PUBLIC_TREE_MODEL_URL=/models/tree.glb`, **or** keep the current default by naming it `model.obj` and putting it in `public/`.
   - **Checkpoints:** Put it in `public/models/` (e.g. `checkpoint.glb`) and set `NEXT_PUBLIC_CHECKPOINT_MODEL_URL=/models/checkpoint.glb`.
4. **Restart** the dev server (`npm run dev`).

---

## 4. Where to find free models (GLB / OBJ)

- **Sketchfab** (sketchfab.com) — filter “Downloadable” + “Free”, format GLB.
- **Poly Pizza** (poly.pizza) — free, low-poly, often CC0.
- **Quaternius** (quaternius.com) — free packs (trees, nature, etc.).
- **Kenney** (kenney.nl) — free game assets, CC0.
- **OpenGameArt.org** — filter 3D, check license.

Prefer **GLB** when possible (single file, good for the web). For **OBJ**, ensure any **MTL** (and textures) are in the same folder or path the OBJ references.
