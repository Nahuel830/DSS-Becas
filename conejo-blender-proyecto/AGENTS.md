# AGENTS.md — Conejo Blender Proyecto

Proyecto de la materia **Sistemas Multimedia (SIS-0370)**: cortometraje 3D de un conejo
con ropa vieja (estilo "Ralph el conejo") + página web informativa.

## Cómo trabajar (opencode)

- Blender está abierto con el addon **MCP for Blender**, conectado en `localhost:9876`.
  Usa SIEMPRE las herramientas del MCP `blender` (`get_scene_info`, `get_object_info`,
  `get_viewport_screenshot`, `execute_blender_code`). No inventes otro puerto.
- Referencia visual: `blender/conejo_referencia.jpg` (hoja de modelo: vistas frontal, lateral,
  trasera y 3/4, cabeza, ojo, boca, cola, pies).
- Archivo de trabajo: `blender/conejo.blend`. Guarda con `bpy.ops.wm.save_as_mainfile(filepath=...)`
  usando ruta ABSOLUTA de esta carpeta, y guarda al terminar cada etapa
  (`conejo_v01_bloqueo.blend`, `conejo_v02_...`) para poder volver atrás.
- Cada etapa: ejecuta código en trozos pequeños, toma `get_viewport_screenshot` y compara con
  la referencia antes de seguir. Si algo falla, corrige y reintenta; no rehagas toda la escena.
- Unidades: metros, escala real. Conejo de pie ≈ 1.20 m de alto (sin orejas ≈ 0.95 m).
- Nombres claros en inglés: `Rabbit_Body`, `Rabbit_Head`, `Rabbit_Ear_L`, `Shirt`, `Vest`, `Pants`...
  Colecciones: `Rabbit`, `Clothes`, `Lights`, `Cameras`.
- Modificadores no destructivos (Subdivision, Mirror) mientras sea posible.
- Pelo: sistema de partículas de pelo o Geometry Nodes; en vista previa usar pocos hijos.
- Render: Cycles (o EEVEE si el equipo es lento), 1920×1080, 24 fps.
- Cambios en la web: carpeta `web/`, solo HTML/CSS/JavaScript (sin dependencias).
