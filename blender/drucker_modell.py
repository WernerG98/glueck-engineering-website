"""
Detailliertes Modell des Hintergrund-Druckers (Startseite) für Blender 5.x.

Aufruf (headless, rendert die Vorschaubilder und speichert die .blend):
  blender -b -P drucker_modell.py -- [--samples 160] [--nur szene1,szene2] [--keine-renders]

Die Maße stammen 1:1 aus src/components/PrinterScrollBackground.jsx (Three.js, Y oben).
Damit sich das später direkt als GLB in die Webseite übernehmen lässt, wird hier in
Three-Koordinaten gedacht und mit T() nach Blender (Z oben, Front = -Y) umgerechnet.
Bewegliche Baugruppen hängen an Empties: Gantry (fährt in Z), Kopf (in X), Bett (in Y).
"""

import bpy
import bmesh
import math
import os
import sys
import numpy as np
from mathutils import Vector, Matrix

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
OUT = os.path.join(HERE, "renders")
os.makedirs(OUT, exist_ok=True)

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
SAMPLES = int(argv[argv.index("--samples") + 1]) if "--samples" in argv else 160
ONLY = argv[argv.index("--nur") + 1].split(",") if "--nur" in argv else None
NO_RENDER = "--keine-renders" in argv

# ---------------------------------------------------------------- Grundlagen
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
COL = scene.collection

# Maße (Three-Einheiten)
W, D = 38.0, 38.0
Y0, Y1 = 1.2, 49.0
HW, HD = W / 2, D / 2
Y_NOZZLE = 31.0
RAIL_Y = 37.5
HEAD_Z = 1.0
PART_HEIGHT = 9.0
S = 1.35
PART_Z = -1.0
PART_LIFT = 0.12

# Druckzustand für die Vorschau
F_PRINT = 0.64  # Anteil gedruckt
H_LOCAL = F_PRINT * PART_HEIGHT
BED_TOP = Y_NOZZLE - H_LOCAL * S
# Düse steht auf der Außenkontur des Zahnrads (Winkel in der Draufsicht)
NOZ_A = math.radians(62)
NOZ_PX = math.cos(NOZ_A) * (7.2 * S - 0.1)
NOZ_PZ = math.sin(NOZ_A) * (7.2 * S - 0.1)


def T(x, y, z):
    """Three (x, y oben, z nach vorn) → Blender (x, y nach hinten, z oben)."""
    return Vector((x, -z, y))


def lin(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hexcol(h, a=1.0):
    h = h.lstrip("#")
    return (lin(int(h[0:2], 16) / 255), lin(int(h[2:4], 16) / 255), lin(int(h[4:6], 16) / 255), a)


# ---------------------------------------------------------------- Materialien
def new_mat(name):
    m = bpy.data.materials.new(name)
    try:
        m.use_nodes = True
    except Exception:
        pass
    return m, m.node_tree, m.node_tree.nodes["Principled BSDF"]


def mat(name, color, metal=0.0, rough=0.5, **inputs):
    m, nt, p = new_mat(name)
    p.inputs["Base Color"].default_value = hexcol(color)
    p.inputs["Metallic"].default_value = metal
    p.inputs["Roughness"].default_value = rough
    for k, v in inputs.items():
        p.inputs[k.replace("_", " ")].default_value = v
    return m


def add_bump(m, kind="noise", scale=40.0, strength=0.1, detail=4.0, coord="Object", wave_dir="Z", distortion=0.0):
    nt = m.node_tree
    p = nt.nodes["Principled BSDF"]
    tc = nt.nodes.new("ShaderNodeTexCoord")
    if kind == "noise":
        tex = nt.nodes.new("ShaderNodeTexNoise")
        tex.inputs["Scale"].default_value = scale
        tex.inputs["Detail"].default_value = detail
        out = tex.outputs["Fac"]
    else:
        tex = nt.nodes.new("ShaderNodeTexWave")
        tex.wave_type = "BANDS"
        tex.bands_direction = wave_dir
        tex.inputs["Scale"].default_value = scale
        tex.inputs["Distortion"].default_value = distortion
        out = tex.outputs["Fac"]
    nt.links.new(tc.outputs[coord], tex.inputs["Vector"])
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = strength
    nt.links.new(out, bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], p.inputs["Normal"])
    return m


def rough_variation(m, scale=8.0, lo=0.3, hi=0.55):
    """Leichte Unruhe in der Rauheit (Fingerabdrücke, Pulverlack)."""
    nt = m.node_tree
    p = nt.nodes["Principled BSDF"]
    tc = nt.nodes.new("ShaderNodeTexCoord")
    nz = nt.nodes.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = scale
    nz.inputs["Detail"].default_value = 6
    mr = nt.nodes.new("ShaderNodeMapRange")
    mr.inputs["To Min"].default_value = lo
    mr.inputs["To Max"].default_value = hi
    nt.links.new(tc.outputs["Object"], nz.inputs["Vector"])
    nt.links.new(nz.outputs["Fac"], mr.inputs["Value"])
    nt.links.new(mr.outputs["Result"], p.inputs["Roughness"])
    return m


def glass_mat(name, tint="#c9ccd2", rough=0.015):
    """Glas mit Schatten-Durchlass (sonst bleibt der Bauraum im Dunkeln)."""
    m, nt, p = new_mat(name)
    p.inputs["Base Color"].default_value = hexcol(tint)
    p.inputs["Roughness"].default_value = rough
    p.inputs["Transmission Weight"].default_value = 1.0
    p.inputs["IOR"].default_value = 1.5
    out = nt.nodes["Material Output"]
    lp = nt.nodes.new("ShaderNodeLightPath")
    tr = nt.nodes.new("ShaderNodeBsdfTransparent")
    tr.inputs["Color"].default_value = hexcol("#d8dade")
    mix = nt.nodes.new("ShaderNodeMixShader")
    nt.links.new(lp.outputs["Is Shadow Ray"], mix.inputs["Fac"])
    nt.links.new(p.outputs["BSDF"], mix.inputs[1])
    nt.links.new(tr.outputs["BSDF"], mix.inputs[2])
    nt.links.new(mix.outputs["Shader"], out.inputs["Surface"])
    return m


def emit_mat(name, color, strength):
    m, nt, p = new_mat(name)
    p.inputs["Base Color"].default_value = hexcol("#000000")
    p.inputs["Emission Color"].default_value = hexcol(color)
    p.inputs["Emission Strength"].default_value = strength
    return m


M = {}
M["shell"] = rough_variation(mat("Gehaeuse", "#34373d", 0.55, 0.38), 3, 0.3, 0.45)
M["shell_dark"] = rough_variation(mat("Gehaeuse_dunkel", "#16171a", 0.35, 0.5), 5, 0.42, 0.6)
M["inner"] = add_bump(mat("Innenwand", "#191a1d", 0.15, 0.75), "noise", 60, 0.05)
M["alu"] = rough_variation(mat("Alu_eloxiert", "#24262b", 0.8, 0.32), 20, 0.28, 0.4)
M["slot"] = mat("Nut", "#060607", 0.2, 0.7)
M["rail"] = add_bump(mat("Stahl_geschliffen", "#c9cdd4", 1.0, 0.22), "wave", 4, 0.02, wave_dir="X", distortion=4)
M["chrome"] = mat("Chrom", "#e6e8ec", 1.0, 0.08)
M["gold"] = mat("Gold", "#d4af37", 1.0, 0.24)
M["brass"] = mat("Messing", "#c89b4a", 1.0, 0.2)
M["head"] = mat("Kopf_dunkel", "#1d1e22", 0.3, 0.42)
M["head_cover"] = rough_variation(mat("Kopf_Blende", "#ececed", 0.0, 0.3, Coat_Weight=0.4), 12, 0.25, 0.35)
M["rubber"] = mat("Gummi", "#0b0b0d", 0.0, 0.85)
M["belt"] = add_bump(mat("Zahnriemen", "#0d0d0f", 0.0, 0.7), "wave", 30, 0.35, wave_dir="X")
M["screw"] = mat("Schraube", "#5a5d64", 1.0, 0.3)
M["heater"] = mat("Heizblock", "#b9bcc2", 1.0, 0.35)
M["sock"] = mat("Silikonsocke", "#1a1a1c", 0.0, 0.6)
M["carbon"] = add_bump(mat("Carbon", "#141416", 0.1, 0.25, Coat_Weight=1.0), "wave", 12, 0.15, wave_dir="DIAGONAL", distortion=1)
M["leadscrew"] = add_bump(mat("Spindel", "#cfd2d8", 1.0, 0.25), "wave", 9, 0.6, wave_dir="Z")
M["led"] = emit_mat("LED_Leiste", "#fff3e0", 25)
M["gold_emit"] = emit_mat("Statusband", "#d4af37", 8)
M["screen_glass"] = mat("Display", "#050607", 0.0, 0.05, Coat_Weight=1.0)
M["white_emit"] = emit_mat("Display_weiss", "#ffffff", 3)
M["gold_text_emit"] = emit_mat("Display_gold", "#d4af37", 3)
M["bar_bg"] = emit_mat("Display_balken", "#2a2b2f", 1.5)
M["ptfe"] = mat("PTFE", "#f1f1f1", 0.0, 0.35, Transmission_Weight=0.25)
M["glass"] = glass_mat("Glas")
M["glass_ams"] = glass_mat("Glas_AMS", "#8d9096", 0.03)
M["frit"] = mat("Glasrand_schwarz", "#050506", 0.0, 0.18, Coat_Weight=1.0)
M["fan"] = mat("Luefter", "#121214", 0.1, 0.55)
M["green"] = emit_mat("LED_gruen", "#4caf50", 30)
M["gold_brand"] = mat("Gold_Schriftzug", "#d4af37", 1.0, 0.3, Emission_Color=hexcol("#d4af37"), Emission_Strength=0.8)


# ---------------------------------------------------------------- Geometrie-Helfer
def finish(name, bm, material, loc, parent=None, smooth=30, rot=None):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    if smooth:
        me.shade_smooth()
        me.set_sharp_from_angle(angle=math.radians(smooth))
    me.materials.append(material)
    ob = bpy.data.objects.new(name, me)
    COL.objects.link(ob)
    if rot is not None:
        ob.rotation_euler = rot
    ob.location = loc
    if parent is not None:
        ob.parent = parent
    return ob


def bevel_all(bm, width, seg=3):
    if width <= 0:
        return
    bmesh.ops.bevel(
        bm,
        geom=list(bm.edges) + list(bm.verts),
        offset=width,
        offset_type="OFFSET",
        segments=seg,
        profile=0.5,
        affect="EDGES",
        clamp_overlap=True,
    )


def box(name, w, h, d, material, x=0, y=0, z=0, bevel=0.12, seg=3, parent=None, smooth=30):
    """Quader in Three-Maßen (Breite x Höhe x Tiefe) mit runden Kanten."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=(w, d, h), verts=bm.verts)
    bevel_all(bm, min(bevel, 0.45 * min(w, h, d)), seg)
    return finish(name, bm, material, T(x, y, z), parent, smooth if bevel > 0 else None)


def cyl(name, r, length, material, x=0, y=0, z=0, axis="y", seg=32, bevel=0.0, r2=None, parent=None):
    """Zylinder entlang der Three-Achse axis."""
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r, radius2=r if r2 is None else r2, depth=length)
    if bevel > 0:
        edges = [e for e in bm.edges if len(e.link_faces) == 2 and e.calc_face_angle(0) > math.radians(50)]
        bmesh.ops.bevel(bm, geom=edges, offset=min(bevel, r * 0.45, length * 0.45), offset_type="OFFSET", segments=2, profile=0.5, affect="EDGES", clamp_overlap=True)
    rot = {"y": None, "z": (math.pi / 2, 0, 0), "x": (0, math.pi / 2, 0)}[axis]
    return finish(name, bm, material, T(x, y, z), parent, 40, rot)


def torus(name, R, r, material, x, y, z, axis="y", parent=None, seg=40, rseg=12):
    bm = bmesh.new()
    for i in range(seg):
        a = 2 * math.pi * i / seg
        for j in range(rseg):
            b = 2 * math.pi * j / rseg
            bm.verts.new(((R + r * math.cos(b)) * math.cos(a), (R + r * math.cos(b)) * math.sin(a), r * math.sin(b)))
    bm.verts.ensure_lookup_table()
    for i in range(seg):
        for j in range(rseg):
            a = i * rseg + j
            b = ((i + 1) % seg) * rseg + j
            c = ((i + 1) % seg) * rseg + (j + 1) % rseg
            d = i * rseg + (j + 1) % rseg
            bm.faces.new((bm.verts[a], bm.verts[b], bm.verts[c], bm.verts[d]))
    rot = {"y": None, "z": (math.pi / 2, 0, 0), "x": (0, math.pi / 2, 0)}[axis]
    return finish(name, bm, material, T(x, y, z), parent, 60, rot)


def ring(name, r_out, r_in, thick, material, x, y, z, axis="y", seg=64, parent=None):
    """Flache Scheibe mit Loch."""
    bm = bmesh.new()
    outer = bmesh.ops.create_circle(bm, cap_ends=False, segments=seg, radius=r_out)["verts"]
    inner = bmesh.ops.create_circle(bm, cap_ends=False, segments=seg, radius=r_in)["verts"]
    edges = [e for e in bm.edges]
    bmesh.ops.bridge_loops(bm, edges=edges)
    ret = bmesh.ops.extrude_face_region(bm, geom=list(bm.faces))
    verts = [v for v in ret["geom"] if isinstance(v, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, vec=(0, 0, thick), verts=verts)
    bmesh.ops.translate(bm, vec=(0, 0, -thick / 2), verts=bm.verts)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    rot = {"y": None, "z": (math.pi / 2, 0, 0), "x": (0, math.pi / 2, 0)}[axis]
    return finish(name, bm, material, T(x, y, z), parent, 40, rot)


def empty(name, parent=None):
    e = bpy.data.objects.new(name, None)
    e.empty_display_size = 3
    COL.objects.link(e)
    if parent:
        e.parent = parent
    return e


def text(name, body, size, material, loc, font=None, extrude=0.02, spacing=1.0, align="CENTER", parent=None, rot=(math.pi / 2, 0, 0)):
    cu = bpy.data.curves.new(name, "FONT")
    cu.body = body
    cu.size = size
    cu.extrude = extrude
    cu.align_x = align
    cu.align_y = "CENTER"
    cu.space_character = spacing
    if font:
        cu.font = font
    ob = bpy.data.objects.new(name, cu)
    ob.data.materials.append(material)
    COL.objects.link(ob)
    ob.location = loc
    ob.rotation_euler = rot
    if parent:
        ob.parent = parent
    return ob


try:
    FONT = bpy.data.fonts.load("C:/Windows/Fonts/bahnschrift.ttf")
except Exception:
    FONT = None


# ---------------------------------------------------------------- Boden & Welt
def build_floor():
    bm = bmesh.new()
    bmesh.ops.create_circle(bm, cap_ends=True, segments=128, radius=1500)
    m = mat("Boden", "#141316", 0.35, 0.5)
    nt = m.node_tree
    p = nt.nodes["Principled BSDF"]
    tc = nt.nodes.new("ShaderNodeTexCoord")
    nz = nt.nodes.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = 0.08
    nz.inputs["Detail"].default_value = 10
    nt.links.new(tc.outputs["Object"], nz.inputs["Vector"])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = hexcol("#0c0c0e")
    ramp.color_ramp.elements[1].color = hexcol("#1d1c1a")
    nt.links.new(nz.outputs["Fac"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], p.inputs["Base Color"])
    mr = nt.nodes.new("ShaderNodeMapRange")
    mr.inputs["To Min"].default_value = 0.32
    mr.inputs["To Max"].default_value = 0.62
    nt.links.new(nz.outputs["Fac"], mr.inputs["Value"])
    nt.links.new(mr.outputs["Result"], p.inputs["Roughness"])
    finish("Boden", bm, m, Vector((0, 0, -0.3)), smooth=None)

    w = bpy.data.worlds.new("Welt")
    scene.world = w
    try:
        w.use_nodes = True
    except Exception:
        pass
    bg = w.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = hexcol("#09090a")
    bg.inputs["Strength"].default_value = 1.0


# ---------------------------------------------------------------- Gehäuse (Bauform wie Bambu Lab H2C)
def cut(target, cutter):
    """Boolean-Differenz sofort anwenden (Fenster/Aussparungen), Kanten danach neu glätten."""
    cutter.data.materials.clear()
    for m in target.data.materials:
        cutter.data.materials.append(m)
    mod = target.modifiers.new("Schnitt", "BOOLEAN")
    mod.object = cutter
    mod.operation = "DIFFERENCE"
    mod.solver = "EXACT"
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(target.evaluated_get(dg))
    target.modifiers.clear()
    old = target.data
    target.data = me
    bpy.data.meshes.remove(old)
    bpy.data.objects.remove(cutter, do_unlink=True)
    me.shade_smooth()
    me.set_sharp_from_angle(angle=math.radians(30))


def profile_x(name, pts_zy, length, material, x, y, z, parent=None, smooth=35):
    """2D-Profil in der Three-Ebene (z, y) entlang Three-X extrudiert (Hauben, Bögen)."""
    bm = bmesh.new()
    vs = [bm.verts.new((-length / 2, -pz, py)) for pz, py in pts_zy]
    f = bm.faces.new(vs)
    ret = bmesh.ops.extrude_face_region(bm, geom=[f])
    nv = [g for g in ret["geom"] if isinstance(g, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, vec=(length, 0, 0), verts=nv)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return finish(name, bm, material, T(x, y, z), parent, smooth)


def arc(r, a0, a1, n):
    return [(math.cos(a0 + (a1 - a0) * i / n) * r, math.sin(a0 + (a1 - a0) * i / n) * r) for i in range(n + 1)]


def dome(name, R, length, thick, material, x, y, z, parent=None):
    """Halbrunde Haube (Achse Three-X) aus dünner Schale + zwei Stirnscheiben."""
    outer = arc(R, 0, math.pi, 48)
    inner = arc(R - thick, math.pi, 0, 48)
    profile_x(name, outer + inner, length - 2 * thick, material, x, y, z, parent)
    for sx in (-1, 1):
        profile_x(name + "_Stirn", arc(R, 0, math.pi, 48), thick, material, x + sx * (length / 2 - thick / 2), y, z, parent)


TS = 1.6  # Wandstärke Seitenteile (vorn als Pfosten sichtbar)
BAND = 6.0  # schwarzes Kopfband vorn mit Display und Schriftzug


def build_enclosure():
    body_h = Y1 - Y0
    mid = (Y0 + Y1) / 2
    # Füße
    for x, z in [(-HW + 2.2, -HD + 2.2), (HW - 2.2, -HD + 2.2), (-HW + 2.2, HD - 2.2), (HW - 2.2, HD - 2.2)]:
        cyl("Fuss", 1.3, Y0 + 0.3, M["rubber"], x, (Y0 + 0.3) / 2 - 0.3, z, seg=28, bevel=0.15)

    # Seitenteile: dicke, rundum verrundete Schalen (H2C-typische weiche Kanten)
    walls = {}
    for sx, nm in ((-1, "Wand_links"), (1, "Wand_rechts")):
        walls[nm] = box(nm, TS, body_h, D, M["shell"], sx * (HW - TS / 2), mid, 0, bevel=0.75, seg=5)
        # Griffmulde unten mittig
        c = box("Mulde", TS + 2, 1.1, 7.0, M["shell"], sx * (HW - TS / 2), Y0 + 0.2, 0, bevel=0.4)
        cut(walls[nm], c)
    # Seitenfenster rechts (großes Fenster mit runden Ecken in der oberen Hälfte)
    win_h, win_d, win_y = 19.0, 27.0, Y1 - 4.5 - 19.0 / 2
    c = box("Fensterschnitt", TS + 2, win_h, win_d, M["shell"], HW - TS / 2, win_y, -0.5, bevel=1.6, seg=6)
    cut(walls["Wand_rechts"], c)
    box("Seitenfenster", 0.2, win_h + 0.6, win_d + 0.6, M["glass"], HW - TS + 0.35, win_y, -0.5, bevel=0.1, seg=2)
    box("Seitenfenster_Rand", 0.05, win_h + 1.4, win_d + 1.4, M["frit"], HW - TS + 0.22, win_y, -0.5, bevel=0.6)
    text("Seitenfenster_Schrift", "GLÜCK ENGINEERING", 0.45, M["gold_brand"], T(HW + 0.01, win_y + win_h / 2 + 1.1, -0.5), FONT, 0.01, 1.3, rot=(math.pi / 2, 0, math.pi / 2))

    box("Rueckwand", W - 2 * TS + 0.4, body_h, 1.0, M["shell"], 0, mid, -HD + 0.5, bevel=0.3)
    box("Deckel", W - 0.2, 1.0, D - 0.2, M["shell"], 0, Y1 - 0.2, 0, bevel=0.45, seg=4)
    # Kamera-Höcker oben vorn
    box("Kamera_Hoecker", 4.2, 0.9, 2.2, M["shell_dark"], -1.5, Y1 + 0.55, HD - 2.0, bevel=0.35)
    cyl("Kamera_Linse", 0.3, 0.1, M["screen_glass"], -1.5, Y1 + 0.55, HD - 0.88, axis="z", seg=20)
    # Sockel vorn (schmal, schwarz, mit Statuslicht)
    box("Sockel", W - 2 * TS + 0.2, 1.8, 1.4, M["shell_dark"], 0, Y0 + 0.9, HD - 0.7, bevel=0.25)
    box("Unterbau", W - 2 * TS, 3.6, D - 2, M["inner"], 0, Y0 + 1.8, -0.5, bevel=0.1)
    # Innenwände
    box("Innen_links", 0.1, body_h - 2, D - 3, M["inner"], -HW + TS + 0.06, mid, -0.5, bevel=0)
    box("Innen_hinten", W - 3, body_h - 2, 0.1, M["inner"], 0, mid, -HD + 1.06, bevel=0)
    box("Innen_rechts_unten", 0.1, win_y - win_h / 2 - Y0, D - 3, M["inner"], HW - TS - 0.06, (Y0 + win_y - win_h / 2) / 2, -0.5, bevel=0)
    box("Bauraum_Boden", W - 2 * TS, 0.3, D - 2, M["inner"], 0, Y0 + 3.7, -0.5, bevel=0.05)
    # Lüftung hinten unten links
    for i in range(10):
        box("Abluft", 0.25, 5.5, 0.12, M["slot"], -HW + 5 + i * 0.7, Y0 + 7, -HD - 0.02, bevel=0)

    # Front: Kopfband (Hochglanz schwarz) über die ganze Breite
    band_y = Y1 - BAND / 2
    box("Kopfband", W - 2 * TS + 0.4, BAND, 1.0, M["frit"], 0, band_y, HD - 0.5, bevel=0.2)
    # Display oben links (Inhalt zeichnet die Webseite live)
    box("Display", 7.4, 3.9, 0.06, M["screen_glass"], -HW + TS + 4.6, band_y + 0.1, HD + 0.02, bevel=0.03)
    pct = round(F_PRINT * 100)
    text("Display_Status", "Druckt", 0.5, M["gold_text_emit"], T(-HW + TS + 1.4, band_y + 1.2, HD + 0.06), FONT, 0.0, 1.0, "LEFT")
    text("Display_Prozent", f"{pct}%", 1.15, M["white_emit"], T(-HW + TS + 1.4, band_y + 0.1, HD + 0.06), FONT, 0.0, 1.0, "LEFT")
    box("Display_Balken", 6.2, 0.18, 0.02, M["bar_bg"], -HW + TS + 4.6, band_y - 1.1, HD + 0.06, bevel=0)
    box("Display_Fortschritt", 6.2 * F_PRINT, 0.18, 0.02, M["gold_text_emit"], -HW + TS + 1.5 + 6.2 * F_PRINT / 2, band_y - 1.1, HD + 0.07, bevel=0)
    # Schriftzug oben rechts
    text("Schriftzug", "GLÜCK ENGINEERING", 0.85, M["gold_brand"], T(HW - TS - 7.6, band_y + 0.1, HD + 0.02), FONT, 0.03, 1.3)

    # Glastür: fast die ganze Front, schwarzer Siebdruckrand
    door_y0 = Y0 + 1.9
    door_h = Y1 - BAND - door_y0 - 0.15
    door_mid = door_y0 + door_h / 2
    gw, gh = W - 2 * TS - 0.3, door_h
    box("Tuer_Glas", gw, gh, 0.3, M["glass"], 0, door_mid, HD - 0.25, bevel=0.1, seg=2)
    fr = 0.7
    box("Tuer_Rand_o", gw - 0.1, fr, 0.04, M["frit"], 0, door_mid + gh / 2 - fr / 2 - 0.05, HD - 0.42, bevel=0)
    box("Tuer_Rand_u", gw - 0.1, fr * 2, 0.04, M["frit"], 0, door_mid - gh / 2 + fr - 0.05 + 0.05, HD - 0.42, bevel=0)
    box("Tuer_Rand_l", fr, gh - 0.1, 0.04, M["frit"], -gw / 2 + fr / 2 + 0.05, door_mid, HD - 0.42, bevel=0)
    box("Tuer_Rand_r", fr, gh - 0.1, 0.04, M["frit"], gw / 2 - fr / 2 - 0.05, door_mid, HD - 0.42, bevel=0)
    # schmale Gold-Griffleiste an der Öffnungskante
    box("Griff", 0.35, 10.0, 0.35, M["gold"], gw / 2 - 1.0, door_mid + 2, HD + 0.18, bevel=0.15)
    # Statuslicht im Sockel + Ein-Taste
    box("Statusband", W - 16, 0.14, 0.08, M["gold_emit"], 0, Y0 + 0.9, HD + 0.02, bevel=0.03)
    torus("Taste_Ring", 0.38, 0.05, M["gold_emit"], HW - TS - 2.0, Y0 + 0.9, HD + 0.03, axis="z", seg=32, rseg=8)

    # Innenlicht: LED-Leiste hinter dem Kopfband + Flächenlicht
    box("LED", W - 6, 0.2, 0.45, M["led"], 0, Y1 - BAND - 0.5, HD - 1.4, bevel=0.05)
    l = bpy.data.lights.new("Bauraumlicht", "AREA")
    l.shape = "RECTANGLE"
    l.size = W - 6
    l.size_y = 0.8
    l.energy = 1800
    l.color = (1.0, 0.95, 0.9)
    lo = bpy.data.objects.new("Bauraumlicht", l)
    lo.location = T(0, Y1 - BAND - 0.8, HD - 2.0)
    lo.rotation_euler = (math.radians(22), 0, 0)
    COL.objects.link(lo)
    l2 = bpy.data.lights.new("Bauraum_hinten", "AREA")
    l2.shape = "RECTANGLE"
    l2.size = W - 8
    l2.size_y = 6
    l2.energy = 600
    l2.color = (1.0, 0.85, 0.6)
    lo2 = bpy.data.objects.new("Bauraum_hinten", l2)
    lo2.location = T(0, Y1 - BAND - 1.5, HD - 3.0)
    lo2.rotation_euler = (math.radians(62), 0, 0)
    COL.objects.link(lo2)


# ---------------------------------------------------------------- Spule (Bambu-Format: Ø 200 mm, 67 mm breit)
SP_R, SP_W = 7.75, 5.2


def spool(idx, color, x, y, z, metal=0.05):
    fil = add_bump(mat(f"Filament_{idx}", color, metal, 0.35, Coat_Weight=0.5), "wave", 70, 0.25, wave_dir="X")
    if "flange" not in M:
        M["flange"] = mat("Spule_Flansch", "#1c1d20", 0.1, 0.4)
    flange = M["flange"]
    e = empty(f"Spule_{idx}")
    e.location = T(x, y, z)
    cyl(f"Spule_{idx}_Filament", SP_R - 0.75, SP_W - 0.4, fil, 0, 0, 0, axis="x", seg=72, bevel=0.15, parent=e)
    ring(f"Spule_{idx}_Kern", 2.9, 2.6, SP_W, flange, 0, 0, 0, axis="x", seg=48, parent=e)
    for sx in (-1, 1):
        fx = sx * (SP_W / 2 - 0.1)
        ring(f"Spule_{idx}_Flansch", SP_R, 2.6, 0.2, flange, fx, 0, 0, axis="x", seg=72, parent=e)
        # Fenster im Flansch: helle Speichen + Nabe, damit die Drehung sichtbar ist
        for k in range(8):
            a = k / 8 * math.pi * 2
            sp = box(f"Spule_{idx}_Rippe", 0.08, 4.4, 0.3, M["shell"], fx + sx * 0.12, math.cos(a) * 5.0, math.sin(a) * 5.0, bevel=0.03, parent=e)
            sp.rotation_euler = (a, 0, 0)
        ring(f"Spule_{idx}_Nabe", 2.6, 1.9, 0.3, M["shell"], fx + sx * 0.15, 0, 0, axis="x", seg=48, parent=e)
    return e


# ---------------------------------------------------------------- AMS 2 Pro (oben auf dem Drucker)
def build_ams():
    aw, ad, ah = 30.0, 23.0, 7.0
    y0 = Y1 + 0.3
    zc = -1.5
    box("AMS_Gehaeuse", aw, ah, ad, M["shell"], 0, y0 + ah / 2, zc, bevel=0.9, seg=4)
    # Front: Rauchglasfenster mit den vier Zuführmodulen dahinter
    box("AMS_Frontfenster", aw - 3, ah - 2.2, 0.15, M["frit"], 0, y0 + ah / 2 - 0.3, zc + ad / 2 + 0.02, bevel=0.3)
    for i in range(4):
        x = -10.35 + i * 6.9
        box("AMS_Modul", 4.2, 3.4, 0.3, M["head"], x, y0 + ah / 2 - 0.3, zc + ad / 2 + 0.1, bevel=0.35)
        box("AMS_Modul_Hebel", 1.0, 1.2, 0.35, M["heater"], x + 1.2, y0 + ah / 2 + 0.4, zc + ad / 2 + 0.2, bevel=0.2)
        box("AMS_LED", 1.4, 0.12, 0.05, M["gold_emit"] if i == 0 else M["bar_bg"], x - 0.6, y0 + ah / 2 + 1.0, zc + ad / 2 + 0.27, bevel=0)
    text("AMS_Schrift", "AMS 2 PRO", 0.5, M["white_emit"], T(aw / 2 - 3.2, y0 + ah - 0.9, zc + ad / 2 + 0.05), FONT, 0.0, 1.4)
    # Oberkante mit dunklem Rand, darauf die Rauchglas-Haube
    box("AMS_Rand", aw - 0.4, 0.5, ad - 0.4, M["shell_dark"], 0, y0 + ah + 0.1, zc, bevel=0.2)
    dome("AMS_Haube", 10.8, aw - 0.8, 0.2, M["glass_ams"], 0, y0 + ah + 0.3, zc)
    for i, c in enumerate(["#d4af37", "#ededed", "#1b1b1d", "#7d8088"]):
        spool(i, c, -10.35 + i * 6.9, y0 + ah + 1.3, zc, 0.25 if i == 0 else 0.05)


# ---------------------------------------------------------------- AMS HT (Einzeltrockner neben dem Drucker)
HT_X, HT_Z = -HW - 9.5, -5.0


def build_ams_ht():
    bw, bd, bh = 10.5, 19.0, 9.5
    box("AMS_HT_Gehaeuse", bw, bh, bd, M["shell"], HT_X, bh / 2, HT_Z, bevel=0.8, seg=4)
    box("AMS_HT_Front", bw - 1.2, bh - 1.4, 0.12, M["frit"], HT_X, bh / 2 + 0.1, HT_Z + bd / 2 + 0.02, bevel=0.3)
    for i, (lbl, val) in enumerate((("Feuchte", "07%"), ("Temp", "85°"), ("Zeit", "01:15"))):
        x = HT_X - 3.1 + i * 3.1
        text("AMS_HT_Wert", val, 0.62, M["white_emit"], T(x, bh - 2.6, HT_Z + bd / 2 + 0.1), FONT, 0.0, 1.0)
        text("AMS_HT_Label", lbl, 0.3, M["gold_text_emit"], T(x, bh - 1.7, HT_Z + bd / 2 + 0.1), FONT, 0.0, 1.0)
    text("AMS_HT_Name", "AMS HT", 0.55, M["gold_brand"], T(HT_X, 2.4, HT_Z + bd / 2 + 0.1), FONT, 0.0, 1.5)
    box("AMS_HT_Rand", bw - 0.3, 0.4, bd - 0.3, M["shell_dark"], HT_X, bh + 0.1, HT_Z, bevel=0.15)
    dome("AMS_HT_Haube", 8.7, bw - 0.6, 0.2, M["glass_ams"], HT_X, bh + 0.25, HT_Z)
    spool(4, "#e9e9ea", HT_X, bh + 0.95, HT_Z)
    # Schlauch vom HT hinten hoch zur Rückwand des Druckers
    cu = bpy.data.curves.new("HT_Schlauch", "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = 0.18
    cu.bevel_resolution = 4
    sp = cu.splines.new("BEZIER")
    pts = [T(HT_X + 2, bh + 0.5, HT_Z - bd / 2 + 1.0), T(HT_X + 3.5, bh + 3.5, -HD - 3.0), T(-HW + 5, 24, -HD - 0.4)]
    sp.bezier_points.add(len(pts) - 1)
    for bp, p in zip(sp.bezier_points, pts):
        bp.co = p
        bp.handle_left_type = bp.handle_right_type = "AUTO"
    ob = bpy.data.objects.new("HT_Schlauch", cu)
    ob.data.materials.append(M["ptfe"])
    COL.objects.link(ob)


# ---------------------------------------------------------------- Bewegungssystem
def build_motion():
    # Y-Achsen: Aluprofil + Linearschiene links/rechts
    for sx in (-1, 1):
        x_prof = sx * (HW - 2.2)
        box("Profil_Y", 1.8, 1.8, D - 4.5, M["alu"], x_prof, RAIL_Y + 1.1, 0, bevel=0.12)
        box("Profil_Y_Nut", 0.35, 0.02, D - 4.6, M["slot"], x_prof, RAIL_Y + 2.01, 0, bevel=0)
        box("Profil_Y_Nut", 0.02, 0.35, D - 4.6, M["slot"], x_prof - sx * 0.91, RAIL_Y + 1.1, 0, bevel=0)
        box("Schiene_Y", 0.9, 0.55, D - 6, M["rail"], sx * (HW - 3), RAIL_Y + 0.0, 0, bevel=0.06)
        # Riemen (zwei Lagen, CoreXY)
        box("Riemen_Y_o", 0.12, 0.45, D - 8, M["belt"], sx * (HW - 4.1), RAIL_Y + 1.2, 0, bevel=0.02)
        box("Riemen_Y_u", 0.12, 0.45, D - 8, M["belt"], sx * (HW - 4.4), RAIL_Y + 0.5, 0, bevel=0.02)
        # Umlenkrollen vorn
        for dy in (0.5, 1.2):
            cyl("Umlenkrolle", 0.55, 0.5, M["chrome"], sx * (HW - 4.3), RAIL_Y + dy, HD - 4.5, seg=28, bevel=0.06)
        # Motoren hinten oben (NEMA 17)
        mx, mz = sx * (HW - 4.2), -HD + 4.0
        box("Motor", 3.6, 3.4, 3.6, M["head"], mx, RAIL_Y + 3.6, mz, bevel=0.35)
        box("Motor_Deckel", 3.7, 0.4, 3.7, M["heater"], mx, RAIL_Y + 5.4, mz, bevel=0.15)
        box("Motor_Flansch", 3.7, 0.4, 3.7, M["heater"], mx, RAIL_Y + 1.8, mz, bevel=0.15)
        cyl("Motor_Ritzel", 0.4, 1.4, M["chrome"], mx, RAIL_Y + 0.9, mz, seg=24, bevel=0.05)

    gantry = empty("Gantry")
    # X-Achse: Carbon-Rohr-Paar + Riemen + Endblöcke
    gw = W - 5.6
    box("X_Traeger", gw, 1.2, 1.4, M["alu"], 0, RAIL_Y + 0.15, -1.6, bevel=0.15, parent=gantry)
    cyl("X_Carbon_o", 0.32, W - 6, M["carbon"], 0, RAIL_Y + 1.1, -0.6, axis="x", seg=32, parent=gantry)
    box("X_Schiene", W - 7, 0.4, 0.8, M["rail"], 0, RAIL_Y - 0.55, -0.85, bevel=0.05, parent=gantry)
    box("X_Riemen_o", W - 7, 0.4, 0.12, M["belt"], 0, RAIL_Y + 0.5, -2.35, bevel=0.02, parent=gantry)
    box("X_Riemen_u", W - 7, 0.4, 0.12, M["belt"], 0, RAIL_Y - 0.1, -2.35, bevel=0.02, parent=gantry)
    for sx in (-1, 1):
        box("X_Endblock", 2.4, 2.6, 3.4, M["head"], sx * (HW - 3), RAIL_Y + 0.3, -1.2, bevel=0.35, parent=gantry)
        box("X_Wagen", 1.4, 0.7, 2.4, M["rail"], sx * (HW - 3), RAIL_Y + 0.5, -1.2, bevel=0.1, parent=gantry)
        for dz in (-0.6, 0.6):
            cyl("X_Rolle", 0.45, 0.45, M["chrome"], sx * (HW - 4.6), RAIL_Y + 1.0, -1.6 + dz, seg=24, bevel=0.05, parent=gantry)

    head = empty("Druckkopf", gantry)
    hy = RAIL_Y - 2.2
    # Korpus: dunkles Gehäuse + helle Frontblende mit Logo
    box("Kopf_Korpus", 4.8, 5.4, 4.4, M["head"], 0, hy, HEAD_Z - 0.1, bevel=0.6, seg=4, parent=head)
    box("Kopf_Blende", 4.5, 4.6, 0.45, M["head_cover"], 0, hy - 0.2, HEAD_Z + 2.2, bevel=0.22, seg=4, parent=head)
    box("Kopf_Fuge", 4.3, 0.06, 0.05, M["slot"], 0, hy + 2.1, HEAD_Z + 2.44, bevel=0, parent=head)
    # Logo (Bild der Webseite) auf der Blende
    logo_path = os.path.join(REPO, "public", "logo.webp")
    if os.path.exists(logo_path):
        img = bpy.data.images.load(logo_path)
        lm, nt, p = new_mat("Logo")
        tex = nt.nodes.new("ShaderNodeTexImage")
        tex.image = img
        nt.links.new(tex.outputs["Color"], p.inputs["Base Color"])
        nt.links.new(tex.outputs["Alpha"], p.inputs["Alpha"])
        p.inputs["Metallic"].default_value = 0.2
        p.inputs["Roughness"].default_value = 0.35
        aspect = img.size[1] / max(1, img.size[0])
        bm = bmesh.new()
        bm.loops.layers.uv.new("UVMap")
        bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=0.5, calc_uvs=True)
        bmesh.ops.scale(bm, vec=(3.4, 3.4 * aspect, 1), verts=bm.verts)
        finish("Kopf_Logo", bm, lm, T(0, hy - 0.2, HEAD_Z + 2.45), head, None, (math.pi / 2, 0, 0))
    # Statusleuchte + Lüftergitter seitlich
    box("Kopf_LED", 0.6, 0.12, 0.05, M["green"], 1.4, hy + 1.6, HEAD_Z + 2.45, bevel=0, parent=head)
    torus("Luefter_Ring", 1.25, 0.16, M["head"], 2.45, hy - 0.3, HEAD_Z - 0.1, axis="x", parent=head)
    cyl("Luefter_Grund", 1.2, 0.08, M["fan"], 2.38, hy - 0.3, HEAD_Z - 0.1, axis="x", seg=40, parent=head)
    for k in range(5):
        torus("Luefter_Gitter", 0.25 + k * 0.22, 0.035, M["head"], 2.47, hy - 0.3, HEAD_Z - 0.1, axis="x", seg=40, rseg=6, parent=head)
    cyl("Luefter_Nabe", 0.3, 0.12, M["screw"], 2.5, hy - 0.3, HEAD_Z - 0.1, axis="x", seg=24, bevel=0.03, parent=head)
    # Oben: Schlauchanschluss
    cyl("Kopf_Kupplung", 0.45, 0.6, M["heater"], 0.8, hy + 2.9, HEAD_Z - 1.0, seg=24, bevel=0.08, parent=head)
    # Unten: Bauteilkühlung (zwei Düsen) + Hotend
    yb = hy - 2.7
    for sx in (-1, 1):
        d = box("Kuehlduese", 1.0, 0.7, 2.2, M["head"], sx * 1.5, yb - 0.25, HEAD_Z, bevel=0.25, parent=head)
        d.rotation_euler = (0, sx * math.radians(25), 0)
    for i in range(5):
        box("Kuehlrippe", 2.0, 0.08, 2.0, M["heater"], 0, yb - 0.1 + i * 0.18, HEAD_Z, bevel=0.02, parent=head)
    box("Heizblock", 1.5, 0.65, 1.4, M["heater"], 0, Y_NOZZLE + 1.42, HEAD_Z, bevel=0.08, parent=head)
    box("Silikonsocke", 1.7, 0.75, 1.6, M["sock"], 0, Y_NOZZLE + 1.42, HEAD_Z, bevel=0.22, parent=head)
    cyl("Duese_Sechskant", 0.42, 0.35, M["brass"], 0, Y_NOZZLE + 0.85, HEAD_Z, seg=6, parent=head)
    cyl("Duese_Spitze", 0.3, 0.68, M["brass"], 0, Y_NOZZLE + 0.34, HEAD_Z, seg=24, r2=0.06, parent=head)
    pl = bpy.data.lights.new("Duesenglut", "POINT")
    pl.energy = 6
    pl.color = (1.0, 0.55, 0.18)
    pl.shadow_soft_size = 0.15
    plo = bpy.data.objects.new("Duesenglut", pl)
    plo.location = T(0, Y_NOZZLE - 0.2, HEAD_Z)
    plo.parent = head
    COL.objects.link(plo)
    # Kabelbündel nach hinten
    cu = bpy.data.curves.new("Kabel", "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = 0.16
    cu.bevel_resolution = 4
    sp = cu.splines.new("BEZIER")
    pts = [T(-0.9, hy + 2.6, HEAD_Z - 1.6), T(-1.4, hy + 4.4, HEAD_Z - 3.4), T(-0.6, RAIL_Y + 1.6, -2.4)]
    sp.bezier_points.add(len(pts) - 1)
    for bp, p in zip(sp.bezier_points, pts):
        bp.co = p
        bp.handle_left_type = bp.handle_right_type = "AUTO"
    co = bpy.data.objects.new("Kabel", cu)
    co.data.materials.append(M["rubber"])
    co.parent = head
    COL.objects.link(co)

    # Vortek-Hotendregal an der rechten Innenwand (6 Wechsel-Hotends, sichtbar durchs Seitenfenster)
    rx = HW - TS - 1.4
    top = RAIL_Y - 2.0
    box("Vortek_Traeger", 1.6, 0.7, 17.0, M["alu"], rx, top + 0.35, -4.5, bevel=0.15)
    stripe = M.setdefault("orange", mat("Warnstreifen", "#e8731c", 0.0, 0.45))
    for i in range(6):
        z = -12.0 + i * 3.0
        box("Vortek_Hotend", 1.3, 3.4, 1.7, M["head"], rx, top - 1.7, z, bevel=0.3, seg=4)
        box("Vortek_Etikett", 0.05, 0.8, 0.9, M["head_cover"], rx - 0.66, top - 0.8, z, bevel=0)
        text("Vortek_Nr", str(i + 1), 0.6, M["head"], T(rx - 0.7, top - 0.8, z), FONT, 0.0, 1.0, rot=(math.pi / 2, 0, -math.pi / 2))
        for k in range(3):
            s = box("Vortek_Streifen", 0.05, 0.16, 1.0, stripe, rx - 0.66, top - 2.2 - k * 0.35, z, bevel=0)
            s.rotation_euler = (math.radians(35), 0, 0)
        cyl("Vortek_Kragen", 0.42, 0.3, M["heater"], rx, top - 3.55, z, seg=20)
        cyl("Vortek_Duese", 0.28, 0.7, M["brass"], rx, top - 4.05, z, seg=16, r2=0.1)
    return gantry, head


# ---------------------------------------------------------------- Z-Achse, Bett, Druckteil
def plate_texture():
    n = 1024
    img = bpy.data.images.new("Druckplatte", n, n, alpha=False)
    rng = np.random.default_rng(3)
    base = np.array([0x15, 0x16, 0x1a], dtype=np.float32) / 255
    a = np.ones((n, n, 4), dtype=np.float32)
    noise = rng.normal(0, 0.012, (n, n, 1)).astype(np.float32)
    a[..., :3] = base + noise
    gold = np.array([0xd4, 0xaf, 0x37], dtype=np.float32) / 255
    yy, xx = np.mgrid[0:n, 0:n]
    step = 64
    line = ((xx % step) < 2) | ((yy % step) < 2)
    a[line, :3] = a[line, :3] * 0.8 + gold * 0.2
    border = (xx < 18) | (xx > n - 19) | (yy < 18) | (yy > n - 19)
    a[border, :3] = a[border, :3] * 0.6 + gold * 0.4
    a[..., :3] = np.clip(a[..., :3], 0, 1) ** 2.2  # sRGB → linear
    img.pixels.foreach_set(a.ravel())
    img.pack()
    return img


def gear_outline(teeth=22, r_tip=7.2, r_root=6.2, samples=18):
    pts = []
    for i in range(teeth * samples):
        u = i / (teeth * samples)
        ph = (u * teeth) % 1.0

        def sm(a, b, v):
            t = min(1, max(0, (v - a) / (b - a)))
            return t * t * (3 - 2 * t)

        r = r_root + (r_tip - r_root) * (sm(0.08, 0.3, ph) - sm(0.5, 0.72, ph))
        a = u * 2 * math.pi
        pts.append((math.cos(a) * r, math.sin(a) * r))
    return pts


def circle(cx, cy, r, n=40):
    # gegen den Uhrzeigersinn egal: 2D-Kurven erkennen Löcher selbst
    return [(cx + math.cos(2 * math.pi * k / n) * r, cy + math.sin(2 * math.pi * k / n) * r) for k in range(n)]


def build_gear(parent):
    cu = bpy.data.curves.new("ZahnradProfil", "CURVE")
    cu.dimensions = "2D"
    cu.fill_mode = "BOTH"
    loops = [gear_outline(), circle(0, 0, 1.6, 48)]
    for i in range(5):
        a = i / 5 * 2 * math.pi
        loops.append(circle(math.cos(a) * 3.9, math.sin(a) * 3.9, 1.05, 36))
    for lp in loops:
        sp = cu.splines.new("POLY")
        sp.points.add(len(lp) - 1)
        for p, (x, y) in zip(sp.points, lp):
            p.co = (x, y, 0, 1)
        sp.use_cyclic_u = True
    tmp = bpy.data.objects.new("tmp", cu)
    COL.objects.link(tmp)
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(tmp.evaluated_get(dg))
    bpy.data.objects.remove(tmp)

    bm = bmesh.new()
    bm.from_mesh(me)
    bpy.data.meshes.remove(me)
    bmesh.ops.triangulate(bm, faces=bm.faces)
    for f in bm.faces:
        if f.normal.z > 0:
            f.normal_flip()
    twist = 0.05
    tw = lambda z: twist * (z if z < PART_HEIGHT / 2 else PART_HEIGHT - z)
    layer = 0.15
    steps = max(1, round(H_LOCAL / layer))
    cur = list(bm.faces)
    z = 0.0
    for s in range(steps):
        ret = bmesh.ops.extrude_face_region(bm, geom=cur)
        nv = [g for g in ret["geom"] if isinstance(g, bmesh.types.BMVert)]
        nf = [g for g in ret["geom"] if isinstance(g, bmesh.types.BMFace)]
        z2 = min(H_LOCAL, z + layer)
        bmesh.ops.translate(bm, vec=(0, 0, z2 - z), verts=nv)
        bmesh.ops.rotate(bm, cent=(0, 0, 0), matrix=Matrix.Rotation(tw(z2) - tw(z), 3, "Z"), verts=nv)
        if s > 0:
            bmesh.ops.delete(bm, geom=cur, context="FACES_ONLY")
        cur = nf
        z = z2
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

    # Material: Gold-PLA mit Schichtlinien + glühende Oberkante
    m, nt, p = new_mat("Druckteil_PLA")
    p.inputs["Base Color"].default_value = hexcol("#d4af37")
    p.inputs["Metallic"].default_value = 0.35
    p.inputs["Roughness"].default_value = 0.36
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tc.outputs["Object"], sep.inputs["Vector"])
    wave = nt.nodes.new("ShaderNodeTexWave")
    wave.wave_type = "BANDS"
    wave.bands_direction = "Z"
    wave.inputs["Scale"].default_value = 1.0 / layer / 2.0  # ein Band pro Schicht (Objektmaße ~ 0..1 je Einheit)
    wave.wave_profile = "SIN"
    nt.links.new(tc.outputs["Object"], wave.inputs["Vector"])
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.35
    bump.inputs["Distance"].default_value = 0.02
    nt.links.new(wave.outputs["Fac"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], p.inputs["Normal"])
    # Glühen nur dort, wo die Düse gerade Material ablegt (heller Fleck, klingt nach ~1,3 cm ab)
    dist = nt.nodes.new("ShaderNodeVectorMath")
    dist.operation = "DISTANCE"
    dist.inputs[1].default_value = (NOZ_PX / S, -NOZ_PZ / S, H_LOCAL)
    nt.links.new(tc.outputs["Object"], dist.inputs[0])
    mr = nt.nodes.new("ShaderNodeMapRange")
    mr.inputs["From Min"].default_value = 1.0
    mr.inputs["From Max"].default_value = 0.0
    nt.links.new(dist.outputs["Value"], mr.inputs["Value"])
    pw = nt.nodes.new("ShaderNodeMath")
    pw.operation = "POWER"
    pw.inputs[1].default_value = 3.0
    nt.links.new(mr.outputs["Result"], pw.inputs[0])
    p.inputs["Emission Color"].default_value = hexcol("#ff8a2a")
    em = nt.nodes.new("ShaderNodeMath")
    em.operation = "MULTIPLY"
    em.inputs[1].default_value = 12.0
    nt.links.new(pw.outputs["Value"], em.inputs[0])
    nt.links.new(em.outputs["Value"], p.inputs["Emission Strength"])

    gear = finish("Druckteil_Zahnrad", bm, m, T(0, PART_LIFT, PART_Z), parent, 35)
    gear.scale = (S, S, S)
    # Skirt
    ring("Skirt", 7.2 * S + 1.45, 7.2 * S + 1.1, 0.1, mat("Skirt", "#d4af37", 0.3, 0.4), 0, 0.05, PART_Z, seg=96, parent=parent)
    return gear


def build_bed():
    # Z-Spindeln + Führungsstangen
    for x, z in [(-HW + 4, -HD + 4), (HW - 4, -HD + 4), (0, -HD + 2.8)]:
        cyl("Z_Spindel", 0.4, 30, M["leadscrew"], x, Y0 + 4.2 + 15, z, seg=24)
        cyl("Z_Lager_unten", 0.9, 0.8, M["head"], x, Y0 + 4.8, z, seg=24, bevel=0.1)
        cyl("Z_Lager_oben", 0.9, 0.8, M["head"], x, Y0 + 34.0, z, seg=24, bevel=0.1)
        cyl("Z_Fuehrung", 0.3, 30, M["chrome"], x + (1.6 if x <= 0 else -1.6), Y0 + 4.2 + 15, z, seg=20)

    bed = empty("Bett")
    bed.location = T(0, BED_TOP, 0)
    # Rahmen (lokal: Plattenoberkante = 0)
    box("Bett_Traeger", W - 7, 0.7, D - 8, M["alu"], 0, -0.95, -1, bevel=0.2, parent=bed)
    for x, z in [(-HW + 4, -HD + 4), (HW - 4, -HD + 4), (0, -HD + 2.8)]:
        box("Bett_Arm", 2.6, 0.6, 2.6, M["alu"], x, -1.1, z + 1.5, bevel=0.2, parent=bed)
        cyl("Bett_Mutter", 0.75, 1.0, M["brass"], x, -1.1, z, seg=24, bevel=0.1, parent=bed)
    box("Bett_Heizplatte", W - 8.6, 0.25, D - 9.6, M["shell_dark"], 0, -0.62, -1, bevel=0.08, parent=bed)
    # Federstahlplatte mit Raster (Bildtextur → später direkt als GLB nutzbar)
    pw, pd = W - 9, D - 10
    box("Bett_Platte", pw, 0.35, pd, M["shell_dark"], 0, -0.2, -1, bevel=0.1, parent=bed)
    img = plate_texture()
    pm, nt, p = new_mat("Druckplatte_PEI")
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = img
    nt.links.new(tex.outputs["Color"], p.inputs["Base Color"])
    p.inputs["Metallic"].default_value = 0.3
    p.inputs["Roughness"].default_value = 0.55
    add_bump(pm, "noise", 120, 0.12)
    bm = bmesh.new()
    bm.loops.layers.uv.new("UVMap")
    bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=0.5, calc_uvs=True)
    bmesh.ops.scale(bm, vec=(pw - 0.3, pd - 0.3, 1), verts=bm.verts)
    finish("Druckplatte", bm, pm, T(0, -0.02, -1), bed, None)
    # Griffnase der Platte
    box("Platte_Lasche", 3.0, 0.1, 0.9, M["shell_dark"], 0, -0.06, -1 + pd / 2 + 0.3, bevel=0.04, parent=bed)
    gear = build_gear(bed)
    return bed, gear


def build_ptfe(head_world):
    start = T(6, Y1 - 0.5, -HD + 2.5)
    end = head_world
    mid = Vector(((start.x + end.x) / 2 + 3, (start.y + end.y) / 2, Y1 + 0.2 - 2))
    cu = bpy.data.curves.new("PTFE", "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = 0.18
    cu.bevel_resolution = 4
    sp = cu.splines.new("BEZIER")
    sp.bezier_points.add(2)
    for bp, p in zip(sp.bezier_points, [start, mid, end]):
        bp.co = p
        bp.handle_left_type = bp.handle_right_type = "AUTO"
    ob = bpy.data.objects.new("PTFE_Schlauch", cu)
    ob.data.materials.append(M["ptfe"])
    COL.objects.link(ob)


# ---------------------------------------------------------------- Licht & Kamera
def area(name, loc, target, size, size_y, energy, color=(1, 1, 1), visible_camera=False):
    l = bpy.data.lights.new(name, "AREA")
    l.shape = "RECTANGLE"
    l.size = size
    l.size_y = size_y
    l.energy = energy
    l.color = color
    o = bpy.data.objects.new(name, l)
    o.location = loc
    d = Vector(target) - Vector(loc)
    o.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    o.visible_camera = visible_camera
    COL.objects.link(o)
    return o


def build_lights():
    c = Vector((0, 0, 26))
    area("Hauptlicht", (55, -85, 95), c, 45, 30, 90000, (1, 0.98, 0.95))
    area("Rand_gold_links", (-70, 75, 55), c, 20, 40, 60000, (1.0, 0.72, 0.28))
    area("Rand_gold_rechts", (80, 55, 30), c, 15, 30, 30000, (1.0, 0.72, 0.28))
    # schmale Softbox links vorn → schöne Lichtkante auf Glas und Lack
    area("Softbox_Streifen", (-60, -60, 35), (0, 0, 28), 6, 70, 22000, (0.92, 0.95, 1.0))
    # area("Boden_Aufhellung", (0, -40, 3), (0, 0, 10), 60, 6, 2500, (1, 0.9, 0.75))


CAMS = {
    # aus den Kamera-Keyframes der Webseite (p = Scrollfortschritt)
    "1_start": dict(r=135, az=-0.42, el=0.17, ty=31, shift=-0.2, lens_fov=32),
    "4_seite": dict(r=120, az=0.62, el=0.2, ty=30, shift=-0.2, lens_fov=32),
    "2_druck": dict(r=78, az=0.12, el=0.36, ty=28, shift=-0.2, lens_fov=32),
    "3_detail": dict(pos=T(16, 40, 34), look=T(0, 30.5, 4), shift=0.0, lens_fov=24),
}


def make_camera():
    cd = bpy.data.cameras.new("Kamera")
    cd.sensor_fit = "VERTICAL"
    cam = bpy.data.objects.new("Kamera", cd)
    COL.objects.link(cam)
    scene.camera = cam
    return cam


def set_cam(cam, k):
    c = CAMS[k]
    if "pos" in c:
        pos, look = c["pos"], c["look"]
    else:
        r, az, el, ty = c["r"], c["az"], c["el"], c["ty"]
        pos = T(math.sin(az) * math.cos(el) * r, ty + math.sin(el) * r, math.cos(az) * math.cos(el) * r)
        look = T(0, ty, 0)
    cam.location = pos
    cam.rotation_euler = (look - pos).to_track_quat("-Z", "Y").to_euler()
    cam.data.angle_y = math.radians(c["lens_fov"])
    cam.data.shift_x = c["shift"]


# ---------------------------------------------------------------- Aufbau
build_floor()
build_enclosure()
build_ams()
build_ams_ht()
gantry, head = build_motion()
bed, gear = build_bed()

# Druckkopf an die Kontur des Zahnrads stellen (wie im Web-Skript)
px, pz = NOZ_PX, NOZ_PZ
head.location = T(px, 0, 0)
gantry.location = T(0, 0, pz + PART_Z - HEAD_Z)
build_ptfe(T(px + 0.8, RAIL_Y + 1.0, pz + PART_Z - 1.0))
build_lights()
cam = make_camera()

# ---------------------------------------------------------------- Render
scene.render.engine = "CYCLES"
scene.cycles.samples = SAMPLES
scene.cycles.use_denoising = True
scene.cycles.max_bounces = 10
scene.cycles.transmission_bounces = 10
scene.cycles.glossy_bounces = 6
scene.render.resolution_x = 1600
scene.render.resolution_y = 900
scene.render.image_settings.file_format = "PNG"
scene.view_settings.view_transform = "AgX"
try:
    scene.view_settings.look = "AgX - Medium High Contrast"
except Exception:
    pass
try:
    prefs = bpy.context.preferences.addons["cycles"].preferences
    prefs.compute_device_type = "CUDA"
    prefs.get_devices()
    for dev in prefs.devices:
        dev.use = True
    scene.cycles.device = "GPU"
    print("Cycles-Geräte:", [d.name for d in prefs.devices if d.use])
except Exception as e:
    print("GPU nicht verfügbar, rendere auf CPU:", e)

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, "drucker_modell.blend"))

if not NO_RENDER:
    for k in CAMS:
        if ONLY and k not in ONLY:
            continue
        set_cam(cam, k)
        scene.render.filepath = os.path.join(OUT, f"{k}.png")
        bpy.ops.render.render(write_still=True)
        print("Gerendert:", scene.render.filepath)
