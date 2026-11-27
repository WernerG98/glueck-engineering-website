"""
Artwork-Wandvorschau: ein HueForge-Relief (STL + _describe.txt) als echtes Relief an einer Wand.
Farben entstehen wie beim Druck aus den Wechselhöhen und der Transmission Distance (TD) der Filamente.

Aufruf:
  blender -b -P artwork_wand.py -- <relief.stl> <ausgabeordner> [--name e46] [--kein-video] [--samples 128]

Ausgabe in <ausgabeordner>:
  <name>_wand.webp    Wohnraum-Ansicht (Sideboard, Bilderleuchte)
  <name>_detail.webp  Streiflicht-Nahaufnahme, zeigt die Höhenstufen
  <name>_licht.mp4    Licht wandert über das Relief (nahtlose Schleife)

Für die Auftragsmaschine (bild_zu_3mf) lässt sich das genauso mit jedem HueForge-Export aufrufen.
"""

import bpy
import bmesh
import math
import os
import re
import sys
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.append(HERE)
import studio as st  # noqa: E402

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
STL = argv[0]
OUT = st.out_dir(argv[1])
NAME = argv[argv.index("--name") + 1] if "--name" in argv else "artwork"
NO_VIDEO = "--kein-video" in argv
SAMPLES = int(argv[argv.index("--samples") + 1]) if "--samples" in argv else 128


def read_describe(stl):
    """Filamente (Farbe, TD) und Wechselhöhen aus der HueForge-Beschreibung lesen."""
    base = re.sub(r"_Front_.*\.stl$", "", stl, flags=re.I)
    path = base + "_describe.txt"
    txt = open(path, encoding="utf-8", errors="ignore").read()
    fil = []
    for col, desc, td in re.findall(r"#([0-9a-fA-F]{6})\s+(.*?)\s+Transmission Distance:\s*([\d.]+)", txt):
        fil.append(("#" + col, desc.strip(), float(td)))

    def lookup(name):
        for col, desc, td in fil:
            if desc.lower().endswith(name.lower()):
                return col, td
        return fil[0][0], fil[0][1]

    start = re.search(r"Start with\s+(.+)", txt).group(1).strip()
    swaps = [(float(h), lookup(n.strip())) for h, n in re.findall(r"\(([\d.]+)mm\) swap to\s+([^\n]+?)(?: for the rest\.)?\s*$", txt, flags=re.M)]
    border = re.search(r"Border Only Colors from here", txt) is not None
    return lookup(start), swaps, border


def relief_material(start, swaps):
    m, nt, p = st.new_mat("Relief")
    p.inputs["Roughness"].default_value = 0.55
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tc.outputs["Object"], sep.inputs["Vector"])
    col = nt.nodes.new("ShaderNodeRGB")
    col.outputs[0].default_value = st.hexcol(start[0])
    cur = col.outputs[0]
    for h, (c, td) in swaps:
        # Deckkraft wächst mit der Dicke über der Wechselhöhe, voll deckend nach ~TD/10 mm
        sub = nt.nodes.new("ShaderNodeMath")
        sub.operation = "SUBTRACT"
        sub.inputs[1].default_value = h - 0.04
        nt.links.new(sep.outputs["Z"], sub.inputs[0])
        div = nt.nodes.new("ShaderNodeMath")
        div.operation = "DIVIDE"
        div.use_clamp = True
        div.inputs[1].default_value = max(0.05, td * 0.1)
        nt.links.new(sub.outputs["Value"], div.inputs[0])
        mix = nt.nodes.new("ShaderNodeMix")
        mix.data_type = "RGBA"
        nt.links.new(div.outputs["Value"], mix.inputs["Factor"])
        nt.links.new(cur, mix.inputs["A"])
        mix.inputs["B"].default_value = st.hexcol(c)
        cur = mix.outputs["Result"]
    nt.links.new(cur, p.inputs["Base Color"])
    # Schichtstufen (0,08 mm) als feine Bump-Struktur
    wave = nt.nodes.new("ShaderNodeTexWave")
    wave.wave_type = "BANDS"
    wave.bands_direction = "Z"
    wave.inputs["Scale"].default_value = (2 * math.pi / 20) / 0.08
    nt.links.new(tc.outputs["Object"], wave.inputs["Vector"])
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.15
    bump.inputs["Distance"].default_value = 0.01
    nt.links.new(wave.outputs["Fac"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], p.inputs["Normal"])
    return m


def box(name, size, loc, mat, bevel=0.0):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=size, verts=bm.verts)
    if bevel:
        bmesh.ops.bevel(bm, geom=list(bm.edges), offset=bevel, offset_type="OFFSET", segments=3, profile=0.5, affect="EDGES", clamp_overlap=True)
    bmesh.ops.translate(bm, vec=loc, verts=bm.verts)
    return st.mesh_obj(name, bm, mat, 30)


# ---------------------------------------------------------------- Szene (Einheit: mm, Wand = Ebene y=0, Front = -Y)
scene = st.reset()
st.world(scene, "#1a1714", 0.6)
start, swaps, border = read_describe(STL)
print("Filamente:", start, swaps)

art = st.import_stl(STL)
art.name = "Relief"
me = art.data
xs = [v.co.x for v in me.vertices]
ys = [v.co.y for v in me.vertices]
zs = [v.co.z for v in me.vertices]
W, H, T = max(xs) - min(xs), max(ys) - min(ys), max(zs) - min(zs)
me.transform(__import__("mathutils").Matrix.Translation(Vector((-(min(xs) + max(xs)) / 2, -(min(ys) + max(ys)) / 2, -min(zs)))))
me.shade_flat()
art.data.materials.append(relief_material(start, swaps))
# Relief steht vor der Wand (Rückseite 18 mm vor der Wand, im Schattenfugenrahmen)
art.rotation_euler = (math.radians(90), 0, 0)
WALL_Y = 0.0
DEPTH = 18.0
CZ = 1060.0  # Bildmitte über Boden (kleines Format → knapp über dem Sideboard)
art.location = (0, WALL_Y - DEPTH, CZ)

# Schattenfugenrahmen in Schwarz
frame_m = st.simple_mat("Rahmen", "#121214", 0.1, 0.35)
fw, fd = 10.0, DEPTH + 6
gap = 4.0
ow, oh = W + 2 * (gap + fw), H + 2 * (gap + fw)
for nm, size, loc in (
    ("Rahmen_o", (ow, fd, fw), (0, -fd / 2, CZ + oh / 2 - fw / 2)),
    ("Rahmen_u", (ow, fd, fw), (0, -fd / 2, CZ - oh / 2 + fw / 2)),
    ("Rahmen_l", (fw, fd, oh - 2 * fw), (-ow / 2 + fw / 2, -fd / 2, CZ)),
    ("Rahmen_r", (fw, fd, oh - 2 * fw), (ow / 2 - fw / 2, -fd / 2, CZ)),
):
    box(nm, size, loc, frame_m, bevel=0.8)
box("Rahmen_Rueckwand", (ow - 2 * fw + 1, 3, oh - 2 * fw + 1), (0, -1.5, CZ), st.simple_mat("Rueckwand", "#0c0c0d", 0, 0.8))

# Wand (Putz, warm) + Boden + Sideboard aus Eiche mit Vase
wall = st.simple_mat("Wand", "#e6dfd3", 0.0, 0.85)
nt = wall.node_tree
nz = nt.nodes.new("ShaderNodeTexNoise")
nz.inputs["Scale"].default_value = 0.4
nz.inputs["Detail"].default_value = 12
tc = nt.nodes.new("ShaderNodeTexCoord")
nt.links.new(tc.outputs["Object"], nz.inputs["Vector"])
bmp = nt.nodes.new("ShaderNodeBump")
bmp.inputs["Strength"].default_value = 0.12
nt.links.new(nz.outputs["Fac"], bmp.inputs["Height"])
nt.links.new(bmp.outputs["Normal"], nt.nodes["Principled BSDF"].inputs["Normal"])
box("Wand", (4000, 20, 3000), (0, 10, 1500), wall)
box("Boden", (4000, 3000, 20), (0, -1500, -10), st.simple_mat("Boden", "#6b4f37", 0.0, 0.5))
oak = st.simple_mat("Eiche", "#a77b4f", 0.0, 0.55)
w = oak.node_tree
wave = w.nodes.new("ShaderNodeTexWave")
wave.wave_type = "BANDS"
wave.bands_direction = "X"
wave.inputs["Scale"].default_value = 0.004
wave.inputs["Distortion"].default_value = 4
wave.inputs["Detail"].default_value = 4
tc2 = w.nodes.new("ShaderNodeTexCoord")
w.links.new(tc2.outputs["Object"], wave.inputs["Vector"])
ramp = w.nodes.new("ShaderNodeValToRGB")
ramp.color_ramp.elements[0].color = st.hexcol("#97704a")
ramp.color_ramp.elements[1].color = st.hexcol("#b98c5c")
w.links.new(wave.outputs["Fac"], ramp.inputs["Fac"])
w.links.new(ramp.outputs["Color"], w.nodes["Principled BSDF"].inputs["Base Color"])
SB_H = 780.0
box("Sideboard", (1400, 420, SB_H), (120, -230, SB_H / 2), oak, bevel=4)
box("Sideboard_Fuge", (2, 2, SB_H - 120), (120, -441, SB_H / 2), st.simple_mat("Fuge", "#2a1f16", 0, 0.8))
# Vase (gedreht) + kleiner Stapel Bücher
bm = bmesh.new()
prof = [(0, 0), (55, 0), (70, 60), (62, 150), (40, 230), (34, 260), (42, 275)]
pts = []
for i, (r, z) in enumerate(prof):
    pts.append(bm.verts.new((r, 0, z)))
edges = [bm.edges.new((pts[i], pts[i + 1])) for i in range(len(pts) - 1)]
bmesh.ops.spin(bm, geom=pts + edges, cent=(0, 0, 0), axis=(0, 0, 1), angle=2 * math.pi, steps=48, use_merge=True)
vase = st.mesh_obj("Vase", bm, st.simple_mat("Keramik", "#1d1d1f", 0, 0.35, Coat_Weight=0.6), 60)
vase.location = (480, -230, SB_H)
for i, (c, hgt) in enumerate((("#5d6b63", 32), ("#c9b48a", 26), ("#2c2f36", 30))):
    box(f"Buch_{i}", (230 - i * 14, 160, hgt), (-380, -240, SB_H + sum(x[1] for x in (("", 32), ("", 26), ("", 30))[:i]) + hgt / 2), st.simple_mat(f"Buch{i}", c, 0, 0.7), bevel=2)

# Licht: weiches Fensterlicht von links + warme Bilderleuchte oben (Streiflicht)
st.area("Fenster", (-2600, -1500, 1900), (0, 0, 1000), 1400, 1800, 160, (1.0, 0.97, 0.92))
st.area("Raum", (800, -3200, 1600), (0, 0, 1000), 2500, 1500, 45, (1.0, 0.93, 0.85))
lamp_m = st.simple_mat("Messing", "#b8913f", 1.0, 0.25)
lamp_y = -150.0
box("Bilderleuchte", (360, 26, 26), (0, lamp_y, CZ + oh / 2 + 120), lamp_m, bevel=5)
box("Leuchtenarm", (14, 150, 14), (0, lamp_y / 2, CZ + oh / 2 + 135), lamp_m, bevel=3)
picture = st.area("Bilderlicht", (0, lamp_y + 10, CZ + oh / 2 + 100), (0, -DEPTH, CZ), 320, 12, 2.6, (1.0, 0.84, 0.62), spread=70)


def render_still(cam_loc, target, lens, w, h, fname):
    cam = st.camera(cam_loc, target, lens=lens, name=fname)
    st.render_settings(scene, w, h, SAMPLES)
    scene.render.image_settings.file_format = "WEBP"
    scene.render.image_settings.quality = 88
    scene.render.filepath = os.path.join(OUT, fname)
    bpy.ops.render.render(write_still=True)
    print("Bild:", scene.render.filepath)
    return cam


# Alles ist in mm gebaut; Cycles rechnet Licht in Metern → gesamte Szene an ein Empty mit Maßstab 1:1000 hängen
ROOT = st.link(bpy.data.objects.new("Massstab_mm", None))
for o in list(bpy.data.objects):
    if o is not ROOT and o.parent is None:
        o.parent = ROOT
ROOT.scale = (0.001, 0.001, 0.001)
_camera = st.camera


def _camera_mm(*a, **k):
    cam = _camera(*a, **k)
    cam.parent = ROOT
    cam.data.clip_start = 0.005
    return cam


st.camera = _camera_mm
_spot = st.spot


def _spot_mm(*a, **k):
    s = _spot(*a, **k)
    s.parent = ROOT
    return s


st.spot = _spot_mm

# 1) Wohnraum-Ansicht
render_still((-330, -1450, 1000), (90, 0, 1015), 52, 1600, 1200, f"{NAME}_wand.webp")
# 2) Streiflicht-Detail: flacher Winkel von unten links, Licht seitlich
picture.data.energy = 1
st.spot("Streiflicht", (-W * 1.6, -DEPTH - 40, CZ + H * 0.1), (0, -DEPTH, CZ), 4, (1.0, 0.86, 0.66), angle=35, blend=0.6, radius=0.006)
render_still((-W * 1.15, -W * 0.95, CZ - H * 0.18), (W * 0.12, -DEPTH, CZ), 45, 1200, 900, f"{NAME}_detail.webp")

if not NO_VIDEO:
    # 3) Licht wandert über das Relief (Kamera frontal, Spot auf einem Kreisbogen → nahtlose Schleife)
    for o in list(bpy.data.objects):
        if o.name == "Streiflicht":
            bpy.data.objects.remove(o, do_unlink=True)
    picture.data.energy = 0.4
    sw = st.spot("Wanderlicht", (0, 0, 0), (0, -DEPTH, CZ), 4, (1.0, 0.86, 0.66), angle=40, blend=0.7, radius=0.008)
    track = sw.constraints.new("TRACK_TO")
    target = st.link(bpy.data.objects.new("Ziel", None))
    target.parent = ROOT
    target.location = (0, -DEPTH, CZ)
    track.target = target
    track.track_axis = "TRACK_NEGATIVE_Z"
    track.up_axis = "UP_Y"
    FR = 96
    for f in range(0, FR + 1, 4):
        a = 2 * math.pi * f / FR
        sw.location = (math.cos(a) * W * 1.3, -DEPTH - 70, CZ + math.sin(a) * H * 1.0)
        sw.keyframe_insert("location", frame=f + 1)
    cam = st.camera((0, -W * 2.35, CZ), (0, -DEPTH, CZ), lens=60, name="Video")
    scene.frame_start, scene.frame_end = 1, FR
    scene.render.fps = 24
    st.render_settings(scene, 720, 720, max(24, SAMPLES // 4))
    try:
        scene.render.image_settings.media_type = "VIDEO"
    except Exception:
        pass
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format = "MPEG4"
    scene.render.ffmpeg.codec = "H264"
    scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
    scene.render.ffmpeg.audio_codec = "NONE"
    scene.render.filepath = os.path.join(OUT, f"{NAME}_licht.mp4")
    bpy.ops.render.render(animation=True)
    print("Video:", scene.render.filepath)
