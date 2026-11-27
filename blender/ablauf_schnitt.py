"""
Setzt die gerenderte Druckszene (ablauf_druck.py) in das bestehende Ablauf-Video ein.
Nur die Druckplatten-Karte in Schritt 5 wird überdeckt; Texte, Spulenleiste und Balken bleiben original.

Aufruf:
  blender -b -P ablauf_schnitt.py -- <original.mp4> <druck_ordner> <ausgabe.mp4>
"""

import bpy
import os
import sys

argv = sys.argv[sys.argv.index("--") + 1 :]
SRC, FRAMES_DIR, OUT = argv[0], argv[1], argv[2]

FPS = 30
T0 = 40.0  # Beginn der Druckszene im Original (s)
# Karte im Original: 1060..1560 × 362..862 px (1920×1080, Ursprung oben links)
CARD_CX, CARD_CY, CARD_W = 1310, 612, 500
FADE = 9  # Bilder Ein-/Ausblendung (0,3 s)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.resolution_x, scene.render.resolution_y = 1920, 1080
scene.render.fps = FPS
seq = scene.sequence_editor_create()
strips = seq.strips if hasattr(seq, "strips") else seq.sequences

movie = strips.new_movie("Original", SRC, channel=1, frame_start=1)
scene.frame_start, scene.frame_end = 1, movie.frame_final_duration

files = sorted(f for f in os.listdir(FRAMES_DIR) if f.startswith("druck_") and f.endswith(".png"))
start = round(T0 * FPS) + 1
img = strips.new_image("Druck", os.path.join(FRAMES_DIR, files[0]), channel=2, frame_start=start)
for f in files[1:]:
    img.elements.append(f)
img.frame_final_duration = len(files)
img.blend_type = "ALPHA_OVER"
# Position/Größe: Bild ist 1000 px und wird mittig eingesetzt → halbieren und verschieben
img.transform.scale_x = img.transform.scale_y = CARD_W / 1000
img.transform.offset_x = CARD_CX - 960
img.transform.offset_y = 540 - CARD_CY
end = start + len(files) - 1
for fr, a in ((start, 0.0), (start + FADE, 1.0), (end - FADE, 1.0), (end, 0.0)):
    img.blend_alpha = a
    img.keyframe_insert("blend_alpha", frame=fr)

r = scene.render
try:
    r.image_settings.media_type = "VIDEO"
except Exception:
    pass
r.image_settings.file_format = "FFMPEG"
r.ffmpeg.format = "MPEG4"
r.ffmpeg.codec = "H264"
r.ffmpeg.constant_rate_factor = "HIGH"
r.ffmpeg.ffmpeg_preset = "GOOD"
r.ffmpeg.gopsize = 30
r.ffmpeg.audio_codec = "NONE"
r.filepath = OUT
scene.view_settings.view_transform = "Standard"
bpy.ops.render.render(animation=True)
print("Video:", OUT)
