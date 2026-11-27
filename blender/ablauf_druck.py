"""
Ablauf-Video, Schritt 5 „Schicht für Schicht“: das echte Bulldoggen-Relief (bild_zu_3mf) wird auf der
Druckplatte Schicht für Schicht aufgebaut. Die Farbwechsel sind auf das bestehende Video abgestimmt
(Spulenleiste/Fortschrittsbalken bleiben original, nur die Druckplatten-Karte wird ersetzt).

Aufruf:
  blender -b -P ablauf_druck.py -- <relief.3mf> <ausgabeordner>

Ausgabe: <ausgabeordner>/druck_0001.png … (RGBA, 1000×1000, Karte mit runden Ecken)
Zusammenschnitt danach mit ablauf_schnitt.py.
"""

import bpy
import bmesh
import math
import os
import re
import sys
import zipfile
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.append(HERE)
import studio as st  # noqa: E402

argv = sys.argv[sys.argv.index("--") + 1 :]
SRC, OUT = argv[0], st.out_dir(argv[1])

FPS = 30
T0, T1 = 40.0, 49.5  # Abschnitt im Originalvideo (s)
FRAMES = round((T1 - T0) * FPS)
# Fortschritt im Original: linear von 40,3 s bis 47,6 s; Farbwechsel bei 29 %, 57 %, 86 %
P0, P1 = 40.3, 47.6
STOPS = [(0.0, 0.0), (0.29, 0.8), (0.57, 1.6), (0.86, 2.16), (1.0, 4.0)]  # Fortschritt → Druckhöhe (mm)
FILAMENTS = [(0.0, "#141416", 0.6), (0.8, "#e7ceb5", 8.0), (1.6, "#f4f4f2", 5.0), (2.16, "#141416", 0.6)]


def height_at(t):
    p = min(1.0, max(0.0, (t - P0) / (P1 - P0)))
    for (pa, ha), (pb, hb) in zip(STOPS, STOPS[1:]):
        if p <= pb:
            return ha + (hb - ha) * (p - pa) / (pb - pa)
    return STOPS[-1][1]


def load_3mf_fast(path):
    """Großes Ein-Objekt-3MF (80 MB) schnell per Regex statt XML-Baum lesen."""
    data = zipfile.ZipFile(path).read("3D/3dmodel.model")
    v = np.array(re.findall(rb'<vertex x="([-\d.e]+)" y="([-\d.e]+)" z="([-\d.e]+)"', data), dtype=np.float32)
    f = np.array(re.findall(rb'<triangle v1="(\d+)" v2="(\d+)" v3="(\d+)"', data), dtype=np.int32)
    me = bpy.data.meshes.new("Relief")
    me.vertices.add(len(v))
    me.vertices.foreach_set("co", v.ravel())
    me.loops.add(len(f) * 3)
    me.loops.foreach_set("vertex_index", f.ravel())
    me.polygons.add(len(f))
    me.polygons.foreach_set("loop_start", np.arange(0, len(f) * 3, 3, dtype=np.int32))
    me.polygons.foreach_set("loop_total", np.full(len(f), 3, dtype=np.int32))
    me.update()
    me.validate()
    return st.link(bpy.data.objects.new("Relief", me))


def growth_material(h_node_holder):
    """Farbe aus Höhe (mit TD-Mischung wie beim Druck), alles oberhalb der aktuellen Druckhöhe ausgeblendet,
    Rückseiten als „Schnittfläche“ in der aktuellen Schichtfarbe (wirkt wie ein massiver Körper)."""
    m, nt, p = st.new_mat("Relief")
    p.inputs["Roughness"].default_value = 0.55
    out = nt.nodes["Material Output"]
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tc.outputs["Object"], sep.inputs["Vector"])
    hval = nt.nodes.new("ShaderNodeValue")
    hval.name = "Hoehe"
    h_node_holder.append(hval)

    def color_chain(zsock):
        cur = None
        for i, (z0, c, td) in enumerate(FILAMENTS):
            if i == 0:
                rgb = nt.nodes.new("ShaderNodeRGB")
                rgb.outputs[0].default_value = st.hexcol(c)
                cur = rgb.outputs[0]
                continue
            sub = nt.nodes.new("ShaderNodeMath")
            sub.operation = "SUBTRACT"
            sub.inputs[1].default_value = z0 - 0.04
            nt.links.new(zsock, sub.inputs[0])
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
        return cur

    nt.links.new(color_chain(sep.outputs["Z"]), p.inputs["Base Color"])
    # Glühende Oberkante (frisch extrudiert)
    d = nt.nodes.new("ShaderNodeMath")
    d.operation = "SUBTRACT"
    nt.links.new(hval.outputs[0], d.inputs[0])
    nt.links.new(sep.outputs["Z"], d.inputs[1])
    glow = nt.nodes.new("ShaderNodeMapRange")
    glow.inputs["From Min"].default_value = 0.12
    glow.inputs["From Max"].default_value = 0.0
    nt.links.new(d.outputs["Value"], glow.inputs["Value"])
    em = nt.nodes.new("ShaderNodeMath")
    em.operation = "MULTIPLY"
    em.inputs[1].default_value = 1.2
    em.name = "Glutstaerke"
    nt.links.new(glow.outputs["Result"], em.inputs[0])
    p.inputs["Emission Color"].default_value = st.hexcol("#ff9a3c")
    nt.links.new(em.outputs["Value"], p.inputs["Emission Strength"])
    # Schnittfläche für Rückseiten: flach in der Farbe der aktuellen Höhe
    cap = nt.nodes.new("ShaderNodeBsdfPrincipled")
    cap.inputs["Roughness"].default_value = 0.6
    nt.links.new(color_chain(hval.outputs[0]), cap.inputs["Base Color"])
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    mix_bf = nt.nodes.new("ShaderNodeMixShader")
    nt.links.new(geo.outputs["Backfacing"], mix_bf.inputs["Fac"])
    nt.links.new(p.outputs["BSDF"], mix_bf.inputs[1])
    nt.links.new(cap.outputs["BSDF"], mix_bf.inputs[2])
    # Alles über der Druckhöhe: durchsichtig
    gt = nt.nodes.new("ShaderNodeMath")
    gt.operation = "GREATER_THAN"
    nt.links.new(sep.outputs["Z"], gt.inputs[0])
    nt.links.new(hval.outputs[0], gt.inputs[1])
    tr = nt.nodes.new("ShaderNodeBsdfTransparent")
    mix_cut = nt.nodes.new("ShaderNodeMixShader")
    nt.links.new(gt.outputs["Value"], mix_cut.inputs["Fac"])
    nt.links.new(mix_bf.outputs["Shader"], mix_cut.inputs[1])
    nt.links.new(tr.outputs["BSDF"], mix_cut.inputs[2])
    nt.links.new(mix_cut.outputs["Shader"], out.inputs["Surface"])
    m.use_backface_culling = False
    try:
        m.surface_render_method = "DITHERED"
    except Exception:
        pass
    return m


# ---------------------------------------------------------------- Szene (mm, Maßstab 1:1000 über Empty)
scene = st.reset()
st.world(scene, "#25272a", 1.0)  # = Kartenfarbe im Video
root = st.link(bpy.data.objects.new("Massstab_mm", None))

relief = load_3mf_fast(SRC)
holder = []
relief.data.materials.append(growth_material(holder))
hnode = holder[0]
relief.parent = root

# Druckplatte (PEI mit dezentem Goldraster) + Bett
plate_img = bpy.data.images.new("PEI", 1024, 1024, alpha=False)
a = np.ones((1024, 1024, 4), np.float32)
a[..., :3] = np.array([0x17, 0x18, 0x1b], np.float32) / 255 + np.random.default_rng(1).normal(0, 0.01, (1024, 1024, 1))
yy, xx = np.mgrid[0:1024, 0:1024]
grid = ((xx % 64) < 2) | ((yy % 64) < 2)
a[grid, :3] = a[grid, :3] * 0.75 + np.array([0xd4, 0xaf, 0x37]) / 255 * 0.25
a[..., :3] = np.clip(a[..., :3], 0, 1) ** 2.2
plate_img.pixels.foreach_set(a.ravel())
pm, nt, p = st.new_mat("PEI")
tex = nt.nodes.new("ShaderNodeTexImage")
tex.image = plate_img
nt.links.new(tex.outputs["Color"], p.inputs["Base Color"])
p.inputs["Roughness"].default_value = 0.5
p.inputs["Metallic"].default_value = 0.3
bm = bmesh.new()
bm.loops.layers.uv.new("UVMap")
bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=0.5, calc_uvs=True)
bmesh.ops.scale(bm, vec=(256, 256, 1), verts=bm.verts)
plate = st.mesh_obj("Platte", bm, pm)
plate.location = (0, 0, -0.02)
plate.parent = root

# Werkzeugkopf (vereinfacht): helle Blende, dunkler Korpus, Messingdüse
head = st.link(bpy.data.objects.new("Kopf", None))
head.parent = root


def hbox(name, size, loc, mat, bevel):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=size, verts=bm.verts)
    bmesh.ops.bevel(bm, geom=list(bm.edges), offset=bevel, offset_type="OFFSET", segments=4, profile=0.5, affect="EDGES", clamp_overlap=True)
    bmesh.ops.translate(bm, vec=loc, verts=bm.verts)
    o = st.mesh_obj(name, bm, mat, 30)
    o.parent = head
    return o


hbox("Korpus", (46, 44, 50), (0, 4, 37), st.simple_mat("Korpus", "#1d1e22", 0.3, 0.4), 6)
hbox("Blende", (44, 4, 44), (0, -19, 37), st.simple_mat("Blende", "#ececed", 0.0, 0.3), 3)
hbox("Heizblock", (16, 14, 7), (0, 0, 8.5), st.simple_mat("Heizblock", "#b9bcc2", 1.0, 0.35), 1)
bm = bmesh.new()
bmesh.ops.create_cone(bm, cap_ends=True, segments=24, radius1=0.6, radius2=3.2, depth=5)
bmesh.ops.translate(bm, vec=(0, 0, 2.5), verts=bm.verts)
noz = st.mesh_obj("Duese", bm, st.simple_mat("Messing", "#c89b4a", 1.0, 0.2), 40)
noz.parent = head
glow = bpy.data.lights.new("Glut", "POINT")
glow.energy = 0.08
glow.color = (1.0, 0.55, 0.2)
glow.shadow_soft_size = 0.002
go = st.link(bpy.data.objects.new("Glut", glow))
go.parent = head
go.location = (0, 0, -1)

# Licht
st.area("Haupt", (-160, -220, 320), (0, 0, 0), 260, 200, 6, (1, 0.98, 0.95))
st.area("Gold", (230, 200, 120), (0, 0, 0), 120, 200, 4, st.GOLD)
st.area("Kante", (-260, 140, 90), (0, 0, 0), 100, 200, 2, (1, 0.85, 0.6))
for o in list(bpy.data.objects):
    if o.type == "LIGHT" and o.parent is None:
        o.parent = root
root.scale = (0.001, 0.001, 0.001)

cam = st.camera((0, -265, 255), (0, -6, 0), lens=50)
cam.parent = root
cam.data.clip_start = 0.005

# ---------------------------------------------------------------- Animation
scene.frame_start, scene.frame_end = 1, FRAMES
scene.render.fps = FPS
for f in range(1, FRAMES + 1):
    t = T0 + (f - 1) / FPS
    h = height_at(t)
    hnode.outputs[0].default_value = h
    hnode.outputs[0].keyframe_insert("default_value", frame=f)
    printing = P0 <= t <= P1
    # Düse fährt Bahnen über das Motiv; vor/nach dem Druck parkt sie hinten rechts
    if printing:
        u = (t - P0) * 1.6
        x = 70 * math.sin(u * 2 * math.pi * 0.9)
        y = 15 + 55 * math.sin(u * 2 * math.pi * 0.23 + 0.7)
        head.location = (x, y, h + 0.4)
    else:
        k = min(1.0, abs(t - (P0 if t < P0 else P1)) / 0.6)
        park = (95, 80, 30)
        head.location = (park[0] * k, park[1] * k, h + 0.4 + park[2] * k)
    head.keyframe_insert("location", frame=f)
    glow.energy = 0.08 if printing else 0.0
    gl = relief.data.materials[0].node_tree.nodes["Glutstaerke"].inputs[1]
    fade = 1.0 if printing else max(0.0, 1.0 - abs(t - (P0 if t < P0 else P1)) / 0.4)
    gl.default_value = 1.2 * fade
    gl.keyframe_insert("default_value", frame=f)
    glow.keyframe_insert("energy", frame=f)

# ---------------------------------------------------------------- Render: EEVEE, Karte mit runden Ecken (Compositor)
try:
    scene.render.engine = "BLENDER_EEVEE"
except TypeError:
    scene.render.engine = "BLENDER_EEVEE_NEXT"
scene.eevee.taa_render_samples = 32
scene.render.resolution_x = scene.render.resolution_y = 1000
scene.view_settings.view_transform = "Standard"  # Hintergrund exakt in Kartenfarbe
scene.render.film_transparent = False
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"

# Runde-Ecken-Maske (Radius wie die Karten im Video: ~28 px bei 500 px → 56 px bei 1000 px)
N, R = 1000, 56
yy, xx = np.mgrid[0:N, 0:N].astype(np.float32)
dx = np.maximum(np.maximum(R - xx, xx - (N - 1 - R)), 0)
dy = np.maximum(np.maximum(R - yy, yy - (N - 1 - R)), 0)
alpha = np.clip(R + 0.5 - np.sqrt(dx * dx + dy * dy), 0, 1)
mask = bpy.data.images.new("Maske", N, N, alpha=True)
mk = np.ones((N, N, 4), np.float32)
mk[..., 3] = alpha
mask.pixels.foreach_set(mk.ravel())

try:
    scene.use_nodes = True
    tree = scene.node_tree
except AttributeError:
    tree = bpy.data.node_groups.new("Comp", "CompositorNodeTree")
    scene.compositing_node_group = tree
for n in list(tree.nodes):
    tree.nodes.remove(n)
rl = tree.nodes.new("CompositorNodeRLayers")
im = tree.nodes.new("CompositorNodeImage")
im.image = mask
sa = tree.nodes.new("CompositorNodeSetAlpha")
try:
    comp = tree.nodes.new("CompositorNodeComposite")
    tree.links.new(sa.outputs[0], comp.inputs[0])
except Exception:
    comp = tree.nodes.new("NodeGroupOutput")
    tree.interface.new_socket("Image", in_out="OUTPUT", socket_type="NodeSocketColor")
    tree.links.new(sa.outputs[0], comp.inputs[0])
tree.links.new(rl.outputs["Image"], sa.inputs["Image"])
tree.links.new(im.outputs["Alpha"], sa.inputs["Alpha"])

scene.render.filepath = os.path.join(OUT, "druck_")
if "--bilder" in argv:
    for fr in [int(x) for x in argv[argv.index("--bilder") + 1].split(",")]:
        scene.frame_set(fr)
        scene.render.filepath = os.path.join(OUT, f"test_{fr:04d}.png")
        bpy.ops.render.render(write_still=True)
    sys.exit(0)
bpy.ops.render.render(animation=True)
print("Fertig:", FRAMES, "Bilder in", OUT)
