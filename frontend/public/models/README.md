# 3D models for the game

Place your **OBJ** or **GLB/GLTF** file here.

**Trees (replaces default procedural sakura):**
- **Included:** `tree.obj` + `tree.mtl` — “Tree” by konta johanna, [CC-BY](https://creativecommons.org/licenses/by/4.0/) via Poly Pizza. Keep both files in this folder.
- Or use **`tree.glb`** (single file) or another **`*.obj`** with its `.mtl`; the game loads `/models/tree.obj` by default.
- Optional: set in `.env.local`: `NEXT_PUBLIC_TREE_MODEL_URL=/models/yourfile.glb` (not used for OBJ yet).

**Flowers (scattered on ground):**
- **Included:** `Flowers.fbx` — “Flowers” by Quaternius. The game places many instances across the play area.

**Torii gates:** `torii/model.obj` + `torii/materials.mtl` — “Torii Gate” by Hattie Stroud [CC-BY] via Poly Pizza.

**Spawn:** `fox/model.obj` + `fox/materials.mtl` — “Japanese White Fox” by Aimi Sekiguchi [CC-BY] via Poly Pizza (placed at character spawn).

**Battle Demo (GameFight):** `charmander/model.obj` + `charmander/materials.mtl` — “Low Poly Charmander” by Tipatat Chennavasin [CC-BY] via Poly Pizza (second character, static at spawn). `megakit/Grass_Common_Short.fbx` — Stylized Nature MegaKit by Quaternius (optional grass prop). `arena/Mineways2Skfb.obj` + `Mineways2Skfb.mtl` + texture — practice Pokémon arena in the Battle Demo.

**Checkpoints (optional):**  
Set `NEXT_PUBLIC_CHECKPOINT_MODEL_URL=/models/checkpoint.glb` in `.env.local`.

Supported: **.glb**, **.gltf**, **.obj**, **.fbx**. Models are auto-scaled to fit the scene.
