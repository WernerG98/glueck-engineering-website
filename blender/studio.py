"""
Gemeinsame Studio-Bausteine für alle Blender-Renderings der Webseite (Glück-Engineering-Look:
dunkles Studio, weiches Hauptlicht, goldene Streiflichter, gedruckte Oberflächen mit Schichtlinien).

Wird von fertigteile_render.py, materialmuster.py und artwork_wand.py importiert.
"""

import bpy
import bmesh
import math
import os
import re
import zipfile
import xml.etree.ElementTree as ET
from mathutils import Vector, Matrix

BLENDER_EXE = r"D:\Engineering\90_Programme\Blender\blender.exe"


# ---------------------------------------------------------------- Farben & Materialien
def lin(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hexcol(h, a=1.0):
    h = h.lstrip("#")
    return (lin(int(h[0:2], 16) / 255), lin(int(h[2:4], 16) / 255), lin(int(h[4:6], 16) / 255), a)


def new_mat(name):
    m = bpy.data.materials.new(name)
    try:
        m.use_nodes = True
    except Exception:
        pass
    return m, m.node_tree, m.node_tree.nodes["Principled BSDF"]


def simple_mat(name, color, metal=0.0, rough=0.5, **inputs):
    m, nt, p = new_mat(name)
    p.inputs["Base Color"].default_value = hexcol(color) if isinstance(color, str) else color
    p.inputs["Metallic"].default_value = metal
    p.inputs["Roughness"].default_value = rough
    for k, v in inputs.items():
        p.inputs[k.replace("_", " ")].default_value = v
    return m


def printed_mat(name, color, rough=0.45, metal=0.0, layer=0.2, layer_strength=0.35, axis="Z", **inputs):
    """FDM-Oberfläche: Grundmaterial + Schichtlinien als Bump entlang der Druckachse (Objektkoordinaten in mm)."""
    m = simple_mat(name, color, metal, rough, **inputs)
    nt = m.node_tree
    p = nt.nodes["Principled BSDF"]
    tc = nt.nodes.new("ShaderNodeTexCoord")
    wave = nt.nodes.new("ShaderNodeTexWave")
    wave.wave_type = "BANDS"
    wave.bands_direction = axis
    # Wave-Bänder: Periode = 2π / (20 · Scale) → Scale für eine Schicht pro Periode
    wave.inputs["Scale"].default_value = (2 * math.pi / 20) / layer
    wave.inputs["Distortion"].default_value = 0.0
    nt.links.new(tc.outputs["Object"], wave.inputs["Vector"])
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = layer_strength
    bump.inputs["Distance"].default_value = layer * 0.15
    nt.links.new(wave.outputs["Fac"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], p.inputs["Normal"])
    return m


# ---------------------------------------------------------------- Szene
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    return bpy.context.scene


def render_settings(scene, w, h, samples=96, transparent=False):
    scene.render.engine = "CYCLES"
    scene.cycles.samples = samples
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 8
    scene.cycles.transmission_bounces = 8
    scene.render.resolution_x = w
    scene.render.resolution_y = h
    scene.render.film_transparent = transparent
    scene.view_settings.view_transform = "AgX"
    try:
        scene.view_settings.look = "AgX - Medium High Contrast"
    except Exception:
        pass
    try:
        prefs = bpy.context.preferences.addons["cycles"].preferences
        prefs.compute_device_type = "CUDA"
        prefs.get_devices()
        for d in prefs.devices:
            d.use = d.type != "CPU"
        print("Render-Geräte:", [(d.name, d.type) for d in prefs.devices if d.use])
        scene.cycles.device = "GPU"
    except Exception as e:
        print("GPU nicht verfügbar:", e)


def world(scene, color="#0a0a0b", strength=1.0):
    w = bpy.data.worlds.new("Welt")
    scene.world = w
    try:
        w.use_nodes = True
    except Exception:
        pass
    bg = w.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = hexcol(color)
    bg.inputs["Strength"].default_value = strength


def link(ob):
    bpy.context.scene.collection.objects.link(ob)
    return ob


def mesh_obj(name, bm, material=None, smooth_angle=None):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    if smooth_angle:
        me.shade_smooth()
        me.set_sharp_from_angle(angle=math.radians(smooth_angle))
    if material:
        me.materials.append(material)
    return link(bpy.data.objects.new(name, me))


def cyclorama(name="Hohlkehle", width=400, depth=300, height=200, radius=60, color="#141416", rough=0.55):
    """Nahtloser Studiohintergrund: Boden geht mit einer Rundung in die Rückwand über (Front = -Y)."""
    bm = bmesh.new()
    # Profil in (y, z): Boden von y=-depth bis y=0, Viertelkreis, Wand bis z=height
    prof = [(-depth, 0.0)]
    for i in range(17):
        a = (math.pi / 2) * i / 16
        prof.append((math.sin(a) * radius, radius - math.cos(a) * radius))
    prof.append((radius, height))
    rows = []
    for x in (-width / 2, width / 2):
        rows.append([bm.verts.new((x, y, z)) for y, z in prof])
    for i in range(len(prof) - 1):
        bm.faces.new((rows[0][i], rows[1][i], rows[1][i + 1], rows[0][i + 1]))
    return mesh_obj(name, bm, simple_mat(name, color, 0.0, rough), 40)


def area(name, loc, target, size, size_y, energy, color=(1, 1, 1), visible_camera=False, spread=None):
    l = bpy.data.lights.new(name, "AREA")
    l.shape = "RECTANGLE"
    l.size = size
    l.size_y = size_y
    l.energy = energy
    l.color = color
    if spread:
        l.spread = math.radians(spread)
    o = bpy.data.objects.new(name, l)
    o.location = loc
    o.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    o.visible_camera = visible_camera
    return link(o)


def spot(name, loc, target, energy, color=(1, 1, 1), angle=40, blend=0.4, radius=0.5):
    l = bpy.data.lights.new(name, "SPOT")
    l.energy = energy
    l.color = color
    l.spot_size = math.radians(angle)
    l.spot_blend = blend
    l.shadow_soft_size = radius
    o = bpy.data.objects.new(name, l)
    o.location = loc
    o.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    return link(o)


GOLD = (1.0, 0.74, 0.32)


def camera(loc, target, lens=85, sensor=36, name="Kamera"):
    cd = bpy.data.cameras.new(name)
    cd.lens = lens
    cd.sensor_width = sensor
    cam = link(bpy.data.objects.new(name, cd))
    cam.location = loc
    cam.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    bpy.context.scene.camera = cam
    return cam


# ---------------------------------------------------------------- Modelle laden
def import_stl(path):
    bpy.ops.wm.stl_import(filepath=path)
    ob = bpy.context.selected_objects[0]
    return ob


def import_3mf(path, name="Teil"):
    """Minimaler 3MF-Leser (Bambu Studio): sammelt alle Meshes inkl. Komponenten-Transformationen."""
    ns = {"m": "http://schemas.microsoft.com/3dmanufacturing/core/2015/02"}
    z = zipfile.ZipFile(path)
    verts_all, faces_all = [], []

    def mat_of(t):
        if not t:
            return Matrix.Identity(4)
        v = [float(x) for x in t.split()]
        return Matrix(((v[0], v[3], v[6], v[9]), (v[1], v[4], v[7], v[10]), (v[2], v[5], v[8], v[11]), (0, 0, 0, 1)))

    models = {n: ET.fromstring(z.read(n)) for n in z.namelist() if n.endswith(".model")}

    def add_object(model_name, obj_id, M):
        root = models[model_name]
        for obj in root.iter("{%s}object" % ns["m"]):
            if obj.get("id") != str(obj_id):
                continue
            mesh = obj.find("m:mesh", ns)
            if mesh is not None:
                base = len(verts_all)
                for v in mesh.find("m:vertices", ns):
                    verts_all.append(M @ Vector((float(v.get("x")), float(v.get("y")), float(v.get("z")))))
                for t in mesh.find("m:triangles", ns):
                    faces_all.append((base + int(t.get("v1")), base + int(t.get("v2")), base + int(t.get("v3"))))
            comps = obj.find("m:components", ns)
            if comps is not None:
                for c in comps:
                    pth = c.get("{http://schemas.microsoft.com/3dmanufacturing/production/2015/06}path")
                    sub = pth.lstrip("/") if pth else model_name
                    add_object(sub, c.get("objectid"), M @ mat_of(c.get("transform")))

    main = "3D/3dmodel.model"
    for item in models[main].find("m:build", ns):
        add_object(main, item.get("objectid"), Matrix.Identity(4))
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(v) for v in verts_all], [], faces_all)
    me.update()
    return link(bpy.data.objects.new(name, me))


def prepare_part(ob, target_size=10.0, smooth_angle=35):
    """Mesh aufräumen, auf den Boden setzen, mittig ausrichten und auf Zielgröße skalieren.
    Die Objektkoordinaten bleiben in mm (für maßstabsgetreue Schichtlinien)."""
    me = ob.data
    bm = bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    me.shade_smooth()
    me.set_sharp_from_angle(angle=math.radians(smooth_angle))
    # Grob aufgelöste CAD-Exporte: große flache Dreiecke neben Rundungen würden sonst schräg verschmiert
    # schattiert → Normalen nach Flächengröße gewichten (flache Flächen bleiben flach)
    wn = ob.modifiers.new("Gewichtete_Normalen", "WEIGHTED_NORMAL")
    wn.mode = "FACE_AREA"
    wn.keep_sharp = True
    wn.weight = 100
    # Ursprung in die Mitte der Unterseite
    xs = [v.co.x for v in me.vertices]
    ys = [v.co.y for v in me.vertices]
    zs = [v.co.z for v in me.vertices]
    c = Vector(((min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, min(zs)))
    me.transform(Matrix.Translation(-c))
    dims = Vector((max(xs) - min(xs), max(ys) - min(ys), max(zs) - min(zs)))
    s = target_size / max(dims)
    ob.scale = (s, s, s)
    ob.location = (0, 0, 0)
    ob.rotation_euler = (0, 0, 0)
    return dims, s


def out_dir(*parts):
    d = os.path.join(*parts)
    os.makedirs(d, exist_ok=True)
    return d


def safe_name(s):
    return re.sub(r"[^A-Za-z0-9_-]+", "_", s)
