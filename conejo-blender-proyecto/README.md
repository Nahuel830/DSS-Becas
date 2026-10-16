# Conejo Blender Proyecto

Sistemas Multimedia (SIS-0370): cortometraje 3D de un conejo (Blender) + página informativa interactiva.

```
conejo-blender-proyecto/
├── AGENTS.md          reglas para opencode
├── opencode.json      conecta opencode con Blender MCP (puerto 9876)
├── opencode/prompts/  prompts 00–07 para ir modelando por etapas
├── blender/           conejo_referencia.jpg + aquí se guardan los .blend
├── audio/             tus pistas de audio
└── web/               página informativa (HTML + CSS + JavaScript)
```

## 1. Preparar la conexión (una sola vez)

1. Instala **uv** (da el comando `uvx`): en PowerShell `powershell -c "irm https://astral.sh/uv/install.ps1 | iex"`, y reinicia Antigravity.
2. Blender: instala el addon de *blender-mcp* (ya lo tienes), abre el panel lateral (N) → **MCP for Blender** → deja **Connected on port 9876**.
3. Copia el contenido de esta carpeta dentro de `D:\Nahuel Martinez\Conejo Blender Proyecto` (la que abriste en Antigravity). `opencode.json` y `AGENTS.md` deben quedar en la raíz.
4. En la terminal de Antigravity ejecuta `opencode`. Comprueba con `/mcp` que `blender` aparece conectado.

> Si ves el error de PowerShell `fatal: not a git repository`, es inofensivo: la carpeta no es un repositorio git. Puedes ignorarlo o ejecutar `git init`.

## 2. Modelar por prompts

Pega en opencode, **en orden**, el contenido de cada archivo de `opencode/prompts/`:
`00_conexion` → `01_bloqueo` → `02_refinamiento` → `03_topologia` → `04_detalles` → `05_materiales_pelo` → `06_escena_render` → `07_animacion`.
Revisa la captura del viewport tras cada etapa; si no se parece a la referencia, pide un ajuste concreto
("orejas 20 % más largas", "ojos más separados") antes de pasar a la siguiente.

Recomendación: el modelo gratuito *Muse Spark* puede quedarse corto en tareas largas de `bpy`; si falla, usa un modelo más potente y pide trozos más pequeños.

## 3. Página informativa

Abre `web/index.html` con doble clic (o *Live Server*). 14 páginas, botones Anterior/Siguiente, puntos, menú, teclado (← →) y deslizar en móvil.
Cubre los 4 bloques del programa (introducción, hardware/software, herramientas, programación), el proyecto, flujo 3D, audio/video, evaluación y conclusiones.
Pon tus archivos en `web/assets/audio.mp3` y `web/assets/corto.mp4`, y completa integrantes/docente en la última página.

Lenguaje: el programa menciona ActionScript (Flash, descontinuado); se usa **JavaScript** como equivalente actual. Si tu docente exige otro (Python, PHP…), avísame.
