"""
Artwork-Wohnraumvorschau: ein HueForge-Relief (STL + _describe.txt) als echtes Relief, lehnend auf einem
Sideboard, mit Tischleuchte, Vase mit Eukalyptuszweigen, Büchern und Sonnenlicht durchs Fenster.
Farben entstehen wie beim Druck aus Wechselhöhen und Transmission Distance (TD) der Filamente.
Der gedruckte Rahmen des Artworks wird nicht noch einmal gerahmt.

Aufruf:
  blender -b -P artwork_wand.py -- <relief.stl> <ausgabeordner> [--name e46] [--mit-video] [--samples 160]

Ausgabe (alle quadratisch):
  <name>_wand.webp    Wohnraum-Ansicht
  <name>_detail.webp  Nahaufnahme im Streiflicht (ganzes Artwork, Tiefenunschärfe)
  <name>_frontal.webp Nahaufnahme frontal mit Fensterlicht
  <name>_licht.mp4    (nur mit --mit-video) Sonnenlicht wandert über das Relief
"""

import bpy
import bmesh
import math
import os
import random
import re
import sys
from mathutils import Matrix, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.append(HERE)
import studio as st  # noqa: E402

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
STL = argv[0]
OUT = st.out_dir(argv[1])
NAME = argv[argv.index("--name") + 1] if "--name" in argv else "artwork"
NO_VIDEO = "--mit-video" not in argv  # Video nur auf Wunsch; Standard sind drei Standbilder
SAMPLES = int(argv[argv.index("--samples") + 1]) if "--samples" in argv else 160
rnd = random.Random(7)


# ---------------------------------------------------------------- Relief-Farben aus der HueForge-Beschreibung
def read_describe(stl):
    base = re.sub(r"_Front_.*\.stl$", "", stl, flags=re.I)
    txt = open(base + "_describe.txt", encoding="utf-8", errors="ignore").read()
    fil = [("#" + c, d.strip(), float(t)) for c, d, t in re.findall(r"#([0-9a-fA-F]{6})\s+(.*?)\s+Transmission Distance:\s*([\d.]+)", txt)]

    def lookup(name):
        for col, desc, td in fil:
            if desc.lower().endswith(name.lower()):
                return col, td
        return fil[0][0], fil[0][2]

    start = re.search(r"Start with\s+(.+)", txt).group(1).strip()
    swaps = [(float(h), lookup(n.strip())) for h, n in re.findall(r"\(([\d.]+)mm\) swap to\s+([^\n]+?)(?: for the rest\.)?\s*$", txt, flags=re.M)]
    return lookup(start), swaps


def relief_material(start, swaps):
    m, nt, p = st.new_mat("Relief")
    p.inputs["Roughness"].default_value = 0.58
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tc.outputs["Object"], sep.inputs["Vector"])
    col = nt.nodes.new("ShaderNodeRGB")
    col.outputs[0].default_value = st.hexcol(start[0])
    cur = col.outputs[0]
    for h, (c, td) in swaps:
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
    # Druckschichten (0,08 mm) als feine Stufen: Wellenbänder entlang der Reliefhöhe.
    # Bump-Distanz in Weltmaß: Szene ist 1:1000 skaliert → 0,03 mm = 0.00003
    wave = nt.nodes.new("ShaderNodeTexWave")
    wave.wave_type = "BANDS"
    wave.bands_direction = "Z"
    wave.wave_profile = "SAW"
    wave.inputs["Scale"].default_value = (2 * math.pi / 20) / 0.08
    nt.links.new(tc.outputs["Object"], wave.inputs["Vector"])
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 1.0
    bump.inputs["Distance"].default_value = 0.00003
    nt.links.new(wave.outputs["Fac"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], p.inputs["Normal"])
    return m


# ---------------------------------------------------------------- Bausteine (mm)
def box(name, size, loc, mat, bevel=0.0, seg=3, rot=None):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=size, verts=bm.verts)
    if bevel:
        bmesh.ops.bevel(bm, geom=list(bm.edges), offset=bevel, offset_type="OFFSET", segments=seg, profile=0.5, affect="EDGES", clamp_overlap=True)
    o = st.mesh_obj(name, bm, mat, 30)
    o.location = loc
    if rot:
        o.rotation_euler = rot
    return o


def lathe(name, prof, loc, mat, steps=64, smooth=60):
    """Drehkörper aus Profil [(r, z), …] (Leuchtenfuß, Vase, Schale)."""
    bm = bmesh.new()
    vs = [bm.verts.new((r, 0, z)) for r, z in prof]
    es = [bm.edges.new((vs[i], vs[i + 1])) for i in range(len(vs) - 1)]
    bmesh.ops.spin(bm, geom=vs + es, cent=(0, 0, 0), axis=(0, 0, 1), angle=2 * math.pi, steps=steps, use_merge=True)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.01)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = st.mesh_obj(name, bm, mat, smooth)
    o.location = loc
    return o


def cyl(name, r, h, loc, mat, seg=32, r2=None):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r if r2 is None else r2, depth=h)
    o = st.mesh_obj(name, bm, mat, 40)
    o.location = loc
    return o


def noise_color(m, c1, c2, scale, detail=8, bump=0.0):
    nt = m.node_tree
    p = nt.nodes["Principled BSDF"]
    tc = nt.nodes.new("ShaderNodeTexCoord")
    nz = nt.nodes.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = scale
    nz.inputs["Detail"].default_value = detail
    nt.links.new(tc.outputs["Object"], nz.inputs["Vector"])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = st.hexcol(c1)
    ramp.color_ramp.elements[1].color = st.hexcol(c2)
    nt.links.new(nz.outputs["Fac"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], p.inputs["Base Color"])
    if bump:
        b = nt.nodes.new("ShaderNodeBump")
        b.inputs["Strength"].default_value = bump
        nt.links.new(nz.outputs["Fac"], b.inputs["Height"])
        nt.links.new(b.outputs["Normal"], p.inputs["Normal"])
    return m


def wood(name, c_dark, c_light, rough=0.5, scale=0.006, along="X"):
    """Holz: gestreckte Wellen als Maserung + leichte Struktur."""
    m = st.simple_mat(name, c_light, 0.0, rough)
    nt = m.node_tree
    p = nt.nodes["Principled BSDF"]
    tc = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = {"X": (0.15, 1.0, 1.0), "Z": (1.0, 1.0, 0.15)}[along]
    nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])
    wave = nt.nodes.new("ShaderNodeTexWave")
    wave.wave_type = "BANDS"
    wave.bands_direction = "Y" if along == "X" else "X"
    wave.inputs["Scale"].default_value = scale
    wave.inputs["Distortion"].default_value = 5.5
    wave.inputs["Detail"].default_value = 6
    wave.inputs["Detail Scale"].default_value = 1.5
    nt.links.new(mp.outputs["Vector"], wave.inputs["Vector"])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = st.hexcol(c_dark)
    ramp.color_ramp.elements[1].color = st.hexcol(c_light)
    nt.links.new(wave.outputs["Fac"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], p.inputs["Base Color"])
    b = nt.nodes.new("ShaderNodeBump")
    b.inputs["Strength"].default_value = 0.08
    nt.links.new(wave.outputs["Fac"], b.inputs["Height"])
    nt.links.new(b.outputs["Normal"], p.inputs["Normal"])
    return m


# ---------------------------------------------------------------- Szene
scene = st.reset()
st.world(scene, "#c9bfb2", 0.10)
start, swaps = read_describe(STL)
print("Filamente:", start, swaps)

# Wand (Kalkputz) und Boden
wall = noise_color(st.simple_mat("Kalkputz", "#d8cec0", 0.0, 0.9), "#cdbfae", "#e0d7cb", 0.0018, 10)
nt = wall.node_tree
fine = nt.nodes.new("ShaderNodeTexNoise")
fine.inputs["Scale"].default_value = 0.08
fine.inputs["Detail"].default_value = 12
tcw = nt.nodes.new("ShaderNodeTexCoord")
nt.links.new(tcw.outputs["Object"], fine.inputs["Vector"])
bw = nt.nodes.new("ShaderNodeBump")
bw.inputs["Strength"].default_value = 0.18
nt.links.new(fine.outputs["Fac"], bw.inputs["Height"])
nt.links.new(bw.outputs["Normal"], nt.nodes["Principled BSDF"].inputs["Normal"])
box("Wand", (5000, 40, 3200), (0, 20, 1600), wall)
box("Sockelleiste", (5000, 14, 80), (0, -7, 40), st.simple_mat("Sockel", "#e4ddd2", 0, 0.5), bevel=2)
box("Boden", (5000, 3000, 20), (0, -1500, -10), wood("Eichenboden", "#8a6a4c", "#b08a63", 0.45, 0.004))

# Sideboard: Nussbaum dunkel, Rillenfront, schwarze Metallfüße
walnut = wood("Nussbaum", "#33221a", "#46301f", 0.4, 0.005)
walnut_v = wood("Nussbaum_Rillen", "#2b1b12", "#4a3020", 0.45, 0.005, along="Z")
SB_W, SB_D, SB_Z0, SB_Z1 = 1500.0, 440.0, 150.0, 760.0
SB_Y = -12 - SB_D / 2
box("Sideboard_Korpus", (SB_W, SB_D - 20, SB_Z1 - SB_Z0), (0, SB_Y + 10, (SB_Z0 + SB_Z1) / 2), walnut, bevel=3)
TOP = SB_Z1 + 24
box("Sideboard_Platte", (SB_W + 30, SB_D + 10, 24), (0, SB_Y - 5, SB_Z1 + 12), walnut, bevel=4)
fl_r, fl_step = 8.0, 16.5
n_fl = int((SB_W - 40) / fl_step)
bm = bmesh.new()
for i in range(n_fl):
    x = -SB_W / 2 + 20 + fl_step / 2 + i * fl_step
    r = bmesh.ops.create_cone(bm, cap_ends=True, segments=12, radius1=fl_r, radius2=fl_r, depth=SB_Z1 - SB_Z0 - 50)
    bmesh.ops.translate(bm, vec=(x, SB_Y - SB_D / 2 + 6, (SB_Z0 + SB_Z1) / 2), verts=r["verts"])
st.mesh_obj("Rillenfront", bm, walnut_v, 50)
for i in (1, 2):
    box("Tuerfuge", (3, 4, SB_Z1 - SB_Z0 - 50), (-SB_W / 2 + i * SB_W / 3, SB_Y - SB_D / 2 - 1, (SB_Z0 + SB_Z1) / 2), st.simple_mat("Fuge", "#120c08", 0, 0.8))
metal = st.simple_mat("Metall_schwarz", "#1a1a1b", 0.85, 0.35)
for sx in (-1, 1):
    for sy in (-1, 1):
        cyl("Fuss", 14, SB_Z0, (sx * (SB_W / 2 - 80), SB_Y + sy * (SB_D / 2 - 70), SB_Z0 / 2), metal, r2=9)

# Artwork: lehnt mit eigenem gedrucktem Rahmen an der Wand
art = st.import_stl(STL)
art.name = "Relief"
me = art.data
xs = [v.co.x for v in me.vertices]
ys = [v.co.y for v in me.vertices]
zs = [v.co.z for v in me.vertices]
W, H = max(xs) - min(xs), max(ys) - min(ys)
me.transform(Matrix.Translation(Vector((-(min(xs) + max(xs)) / 2, -min(ys), -min(zs)))))
me.shade_flat()
art.data.materials.append(relief_material(start, swaps))
TILT = math.degrees(math.atan2(26, H))
ART_X = 40.0
art.rotation_euler = (math.radians(90 - TILT), 0, 0)
art.location = (ART_X, -32.0, TOP)
ART_C = Vector((ART_X, -20, TOP + H / 2))

# Tischleuchte links: Keramikfuß, Messinghals, Leinenschirm (durchscheinend) mit warmem Licht
stone = noise_color(st.simple_mat("Steinzeug", "#e7ddcf", 0.0, 0.7), "#d9cdbd", "#efe7dc", 0.05, 6, bump=0.15)
brass = st.simple_mat("Messing", "#b8913f", 1.0, 0.28)
LX, LY = -390.0, SB_Y + 40
lathe("Leuchte_Fuss", [(0, 0), (55, 0), (62, 6), (92, 60), (110, 130), (104, 200), (70, 250), (30, 275), (22, 290), (0, 290)], (LX, LY, TOP), stone)
cyl("Leuchte_Hals", 9, 90, (LX, LY, TOP + 335), brass)
shade = st.new_mat("Leinen")[0]
nt = shade.node_tree
out = nt.nodes["Material Output"]
for n in list(nt.nodes):
    if n.type == "BSDF_PRINCIPLED":
        nt.nodes.remove(n)
tr = nt.nodes.new("ShaderNodeBsdfTranslucent")
tr.inputs["Color"].default_value = st.hexcol("#f4d7a6")
df = nt.nodes.new("ShaderNodeBsdfDiffuse")
df.inputs["Color"].default_value = st.hexcol("#efe6d6")
mx = nt.nodes.new("ShaderNodeMixShader")
mx.inputs["Fac"].default_value = 0.4
nt.links.new(df.outputs["BSDF"], mx.inputs[1])
nt.links.new(tr.outputs["BSDF"], mx.inputs[2])
nt.links.new(mx.outputs["Shader"], out.inputs["Surface"])
bm = bmesh.new()
bmesh.ops.create_cone(bm, cap_ends=False, segments=72, radius1=175, radius2=150, depth=230)
st.mesh_obj("Leuchte_Schirm", bm, shade, 60).location = (LX, LY, TOP + 470)
bulb = bpy.data.lights.new("Gluehbirne", "POINT")
bulb.energy = 7
bulb.color = (1.0, 0.72, 0.42)
bulb.shadow_soft_size = 0.03
st.link(bpy.data.objects.new("Gluehbirne", bulb)).location = (LX, LY, TOP + 450)

# Vase rechts mit Eukalyptuszweigen
glaze = noise_color(st.simple_mat("Glasur_dunkel", "#2b2c2c", 0.0, 0.5), "#232425", "#3a3a38", 0.03, 6, bump=0.1)
VX, VY = 330.0, SB_Y + 40
lathe("Vase", [(0, 0), (48, 0), (62, 30), (70, 95), (64, 160), (40, 215), (20, 245), (18, 268), (23, 276), (0, 276)], (VX, VY, TOP), glaze)
leaf_m = noise_color(st.simple_mat("Eukalyptus", "#6f8172", 0.0, 0.6), "#5d6f61", "#8a9b8b", 0.06, 4)
stem_m = st.simple_mat("Stiel", "#6b5a4a", 0.0, 0.7)
bm_leaves = bmesh.new()
for b in range(6):
    ang = -0.9 + b * 0.36 + rnd.uniform(-0.1, 0.1)
    length = rnd.uniform(380, 560)
    pts = []
    for k in range(9):
        t = k / 8
        bend = math.sin(t * 1.4) * length * 0.35
        pts.append(Vector((VX + math.sin(ang) * (bend + 20 * t), VY + math.cos(ang) * 30 * t + rnd.uniform(-5, 5), TOP + 266 + t * length * 0.9)))
    cu = bpy.data.curves.new(f"Zweig{b}", "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = 2.2
    cu.bevel_resolution = 2
    sp = cu.splines.new("BEZIER")
    sp.bezier_points.add(len(pts) - 1)
    for bp, p in zip(sp.bezier_points, pts):
        bp.co = p
        bp.handle_left_type = bp.handle_right_type = "AUTO"
    ob = st.link(bpy.data.objects.new(f"Zweig{b}", cu))
    ob.data.materials.append(stem_m)
    for k in range(2, 9):
        t = k / 8
        p0 = pts[k]
        for side in (-1, 1):
            r_leaf = rnd.uniform(9, 19) * (1.2 - 0.55 * t)
            res = bmesh.ops.create_circle(bm_leaves, cap_ends=True, segments=16, radius=r_leaf)
            vs = res["verts"]
            bmesh.ops.scale(bm_leaves, vec=(1.0, 0.85, 1.0), verts=vs)
            rot = Matrix.Rotation(rnd.uniform(0, 6.28), 4, "Z") @ Matrix.Rotation(math.radians(70 + rnd.uniform(-25, 25)), 4, "X") @ Matrix.Rotation(side * 1.2 + rnd.uniform(-0.3, 0.3), 4, "Y")
            bmesh.ops.transform(bm_leaves, matrix=rot, verts=vs)
            bmesh.ops.translate(bm_leaves, vec=p0 + Vector((side * r_leaf * 0.9, rnd.uniform(-8, 8), rnd.uniform(-6, 6))), verts=vs)
leaves = st.mesh_obj("Blaetter", bm_leaves, leaf_m, 60)
leaves.modifiers.new("Dicke", "SOLIDIFY").thickness = 0.8

# Bücherstapel mit Messingschale
z = TOP
for i, (c, w, d, h, rz) in enumerate((("#4c5a52", 250, 185, 34, 4), ("#c9b48a", 232, 172, 26, -3), ("#2f3238", 218, 160, 30, 7))):
    zc = z + h / 2
    box(f"Buch_{i}", (w, d, h), (-175, SB_Y + 30, zc), noise_color(st.simple_mat(f"Leinen{i}", c, 0, 0.8), c, c, 1, 2), bevel=2.5, rot=(0, 0, math.radians(rz)))
    box(f"Buch_{i}_Seiten", (w - 10, d - 6, h - 6), (-172, SB_Y + 30, zc), st.simple_mat("Papier", "#efe8da", 0, 0.9), rot=(0, 0, math.radians(rz)))
    z += h
lathe("Schale", [(0, 0), (40, 0), (70, 18), (85, 38), (82, 40), (66, 22), (0, 8)], (-175, SB_Y + 30, z), brass, smooth=70)

# Licht: Sonne durchs Fenster links vorn (Fensterkreuz-Schatten) + weiches Raumlicht von rechts
sun = bpy.data.lights.new("Sonne", "SUN")
sun.energy = 4.5
sun.angle = math.radians(1.2)
sun.color = (1.0, 0.9, 0.78)
sun_o = st.link(bpy.data.objects.new("Sonne", sun))
SUN_DIR = Vector((0.62, 0.55, -0.56)).normalized()
GOBO_T = Vector((ART_X - 200, -40, TOP + 400))


def aim_sun(d):
    sun_o.rotation_euler = (-d).to_track_quat("Z", "Y").to_euler()


aim_sun(SUN_DIR)
gobo = st.link(bpy.data.objects.new("Fenster", None))
frame_m = st.simple_mat("Fensterrahmen", "#ffffff", 0, 0.5)
for nm, size, loc in (
    ("Rahmen_l", (60, 60, 1700), (-650, 0, 0)), ("Rahmen_r", (60, 60, 1700), (650, 0, 0)),
    ("Rahmen_o", (1360, 60, 60), (0, 0, 850)), ("Rahmen_u", (1360, 60, 60), (0, 0, -850)),
    ("Sprosse_v", (40, 60, 1700), (0, 0, 0)), ("Sprosse_h", (1360, 60, 40), (0, 0, 150)),
    ("Laibung_l", (3000, 60, 6000), (-2180, 0, 0)), ("Laibung_r", (3000, 60, 6000), (2180, 0, 0)),
    ("Laibung_o", (1400, 60, 3000), (0, 0, 2380)), ("Laibung_u", (1400, 60, 3000), (0, 0, -2380)),
):
    b = box(nm, size, loc, frame_m)
    b.parent = gobo
    b.visible_camera = False
    b.visible_glossy = False
    b.visible_diffuse = False


def place_gobo(d):
    gobo.location = GOBO_T - d * 1300
    gobo.rotation_euler = d.to_track_quat("Y", "Z").to_euler()


place_gobo(SUN_DIR)
st.area("Raumlicht", (900, -2200, 1500), (0, 0, 900), 1600, 1600, 70, (1.0, 0.95, 0.9))

# Maßstab: Szene in mm → Cycles rechnet in Metern
ROOT = st.link(bpy.data.objects.new("Massstab_mm", None))
for o in list(bpy.data.objects):
    if o is not ROOT and o.parent is None:
        o.parent = ROOT
ROOT.scale = (0.001, 0.001, 0.001)


def camera(loc, target, lens, focus=None, fstop=None, name="Kamera"):
    cam = st.camera(loc, target, lens=lens, name=name)
    cam.parent = ROOT
    cam.data.clip_start = 0.005
    if focus is not None:
        cam.data.dof.use_dof = True
        cam.data.dof.focus_distance = focus * 0.001
        cam.data.dof.aperture_fstop = fstop
    return cam


def render_still(cam, size, fname, samples=SAMPLES):
    scene.camera = cam
    st.render_settings(scene, size, size, samples)
    scene.render.image_settings.file_format = "WEBP"
    scene.render.image_settings.quality = 88
    scene.render.filepath = os.path.join(OUT, fname)
    bpy.ops.render.render(write_still=True)
    print("Bild:", scene.render.filepath)


ONLY_DETAIL = "--nur-detail" in argv
# 1) Wohnraum: ganzes Sideboard-Arrangement, leicht von links
c1 = Vector((-110, -1180, TOP + 210))
if not ONLY_DETAIL:
    render_still(camera(c1, Vector((40, -110, TOP + 140)), 60, focus=(ART_C - c1).length, fstop=4.0, name="Wohnraum"), 1400, f"{NAME}_wand.webp")

# 2) Nahaufnahme: dicht an Auto und Halle, flaches Streiflicht von links → jede 0,08-mm-Stufe wirft einen Schatten
art.data.update()
bpy.context.view_layer.update()
Mloc = Matrix.Translation(art.location) @ art.rotation_euler.to_matrix().to_4x4()  # Artwork-Lage in mm (vor Maßstab)
P = Mloc @ Vector((8, 0.33 * H, 2.0))          # Bildpunkt: Front des Autos
ux = (Mloc.to_3x3() @ Vector((1, 0, 0))).normalized()   # Bild-Waagerechte
nrm = (Mloc.to_3x3() @ Vector((0, 0, 1))).normalized()  # Flächennormale (zeigt in den Raum)
up = (Mloc.to_3x3() @ Vector((0, 1, 0))).normalized()
rake = bpy.data.lights.new("Streiflicht", "SPOT")
rake.energy = 14
rake.color = (1.0, 0.86, 0.68)
rake.spot_size = math.radians(55)
rake.spot_blend = 0.5
rake.shadow_soft_size = 0.002
rk = st.link(bpy.data.objects.new("Streiflicht", rake))
rk.parent = ROOT
rk_loc = P - ux * 240 + nrm * 9 + up * 60      # fast in der Bildebene → sehr flacher Einfall
rk.location = rk_loc
rk.rotation_euler = (P - rk_loc).to_track_quat("-Z", "Y").to_euler()
sun_energy = sun.energy
sun.energy = sun_energy * 0.2
c2 = P + nrm * 95 + ux * 140 - up * 20
render_still(camera(c2, P + ux * 6, 60, focus=(P - c2).length, fstop=8.0, name="Detail"), 1200, f"{NAME}_detail.webp")
sun.energy = sun_energy
bpy.data.objects.remove(rk)

# 3) Frontal: Artwork mit Fensterlicht, Sideboard und Wand angeschnitten
c3 = Vector((ART_X - 90, -560, TOP + 120))
if not ONLY_DETAIL:
    render_still(camera(c3, ART_C, 58, focus=(ART_C - c3).length, fstop=4.0, name="Frontal"), 1200, f"{NAME}_frontal.webp")

if not NO_VIDEO:
    # 3) Sonnenlicht wandert über das Relief (nahtlose Hin-und-her-Schleife)
    cam = camera(Vector((ART_X - 90, -560, TOP + 120)), ART_C, 58, focus=560, fstop=4.0, name="Video")
    scene.camera = cam
    FR = 120
    for f in range(1, FR + 1, 3):
        a = math.sin(2 * math.pi * (f - 1) / FR)
        d = Matrix.Rotation(math.radians(9) * a, 3, "Z") @ SUN_DIR
        aim_sun(d)
        sun_o.keyframe_insert("rotation_euler", frame=f)
        place_gobo(d)
        gobo.keyframe_insert("location", frame=f)
        gobo.keyframe_insert("rotation_euler", frame=f)
    scene.frame_start, scene.frame_end = 1, FR
    scene.render.fps = 24
    st.render_settings(scene, 720, 720, max(32, SAMPLES // 4))
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
