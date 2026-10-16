ETAPA 3 — Topología (malla limpia en Blender).
Genera una topología limpia y mayormente de cuadriláteros para animar:
- Quad Remesher no está disponible: usa Quadriflow (bpy.ops.object.quadriflow_remesh) o retopología
  con Shrinkwrap + Mirror.
- Loops de borde alrededor de ojos, boca, nariz, base de orejas, codos, rodillas y dedos.
- Objetivo ~8k–15k caras para el cuerpo, antes de subdivisión.
- Guarda la versión de alta como backup y deja la versión baja con modificador Multires/Subdivision.
Muestra el wireframe en una captura (shading Wire) y guarda conejo_v03_topologia.blend.
