"""
Gerenderte Materialmuster für den Materialführer: je Werkstoff ein Musterplättchen mit Namen
und ein gedrehter Sechskant-Turm, gleich ausgeleuchtet, damit die Oberflächen vergleichbar sind.

Aufruf:
  blender -b -P materialmuster.py -- [--nur pla,petg-basic] [--samples 64]

Ausgabe: public/materialien/<id>.webp (960×540). Die IDs entsprechen src/data/materials.js.
"""

import bpy
import bmesh
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.append(HERE)
import studio as st  # noqa: E402

REPO = os.path.dirname(HERE)
OUT = st.out_dir(REPO, "public", "materialien")

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
ONLY = argv[argv.index("--nur") + 1].split(",") if "--nur" in argv else None
SAMPLES = int(argv[argv.index("--samples") + 1]) if "--samples" in argv else 64

# id: Anzeigename, Farbe, Rauheit, Metall, Extra-Eigenschaften
# Extras: trans (Transmission), coat, look ∈ {marble, wood, sparkle, fiber, foam, glow, palette, silk}, flex (gebogen)
M = {
    "pla": ("PLA Basic", "#e0612e", 0.38, 0.0, {}),
    "pla-matte": ("PLA Matte", "#3d5c4b", 0.9, 0.0, {}),
    "pla-pure": ("PLA Pure", "#efe9dc", 0.42, 0.0, {}),
    "pla-silk": ("PLA Silk+", "#d4a92e", 0.2, 0.55, {"look": "silk"}),
    "pla-translucent": ("PLA Transl.", "#3e9ad8", 0.12, 0.0, {"trans": 0.8}),
    "pla-tough": ("PLA Tough+", "#2c67ad", 0.4, 0.0, {}),
    "pla-aero": ("PLA Aero", "#e6e4df", 0.95, 0.0, {"look": "foam"}),
    "pla-marble": ("PLA Marble", "#e7e5e0", 0.55, 0.0, {"look": "marble"}),
    "pla-wood": ("PLA Wood", "#9a6b3f", 0.75, 0.0, {"look": "wood"}),
    "pla-metal": ("PLA Metal", "#8d9198", 0.42, 0.75, {}),
    "pla-glow": ("PLA Glow", "#cdeec0", 0.45, 0.0, {"look": "glow"}),
    "pla-sparkle": ("PLA Sparkle", "#23252b", 0.45, 0.0, {"look": "sparkle", "flake": "#e8d9a8"}),
    "pla-galaxy": ("PLA Galaxy", "#2a1f45", 0.42, 0.0, {"look": "sparkle", "flake": "#cfc6ff"}),
    "pla-cf": ("PLA-CF", "#2b2c2f", 0.8, 0.0, {"look": "fiber"}),
    "petg-basic": ("PETG Basic", "#1c7c8e", 0.16, 0.0, {"trans": 0.25, "coat": 0.6}),
    "petg-matte": ("PETG Matte", "#6a6e75", 0.82, 0.0, {}),
    "petg-translucent": ("PETG Transl.", "#77d0c4", 0.08, 0.0, {"trans": 0.9}),
    "petg-cf": ("PETG-CF", "#2a2b2e", 0.78, 0.0, {"look": "fiber"}),
    "abs": ("ABS", "#c9cdd3", 0.5, 0.0, {}),
    "abs-gf": ("ABS-GF", "#e3dfd5", 0.72, 0.0, {"look": "fiber", "fiber_light": True}),
    "asa": ("ASA", "#ecebe7", 0.5, 0.0, {}),
    "asa-cf": ("ASA-CF", "#2d2e31", 0.8, 0.0, {"look": "fiber"}),
    "asa-aero": ("ASA Aero", "#b7b9bd", 0.95, 0.0, {"look": "foam"}),
    "tpu-85a": ("TPU 85A", "#c23a2e", 0.55, 0.0, {"flex": 1.0}),
    "tpu-90a": ("TPU 90A", "#1f2023", 0.5, 0.0, {"flex": 0.8}),
    "tpu-95a-hf": ("TPU 95A HF", "#2f61a8", 0.5, 0.0, {"flex": 0.6}),
    "tpu-ams": ("TPU AMS", "#e3b53a", 0.5, 0.0, {"flex": 0.6}),
    "pc": ("PC", "#eef3f6", 0.05, 0.0, {"trans": 0.95, "coat": 0.4}),
    "pc-fr": ("PC FR", "#1e1f22", 0.4, 0.0, {"coat": 0.3}),
    "pa6-cf": ("PA6-CF", "#28292c", 0.82, 0.0, {"look": "fiber"}),
    "pa6-gf": ("PA6-GF", "#5b5e63", 0.75, 0.0, {"look": "fiber", "fiber_light": True}),
    "paht-cf": ("PAHT-CF", "#262729", 0.85, 0.0, {"look": "fiber"}),
    "pet-cf": ("PET-CF", "#2c2d30", 0.76, 0.0, {"look": "fiber"}),
    "ppa-cf": ("PPA-CF", "#252528", 0.82, 0.0, {"look": "fiber"}),
    "pps-cf": ("PPS-CF", "#2e2b27", 0.8, 0.0, {"look": "fiber"}),
}


def node(nt, t, **kw):
    n = nt.nodes.new(t)
    for k, v in kw.items():
        n.inputs[k].default_value = v
    return n


def sample_mat(mid):
    name, color, rough, metal, ex = M[mid]
    m = st.printed_mat(f"Muster_{mid}", color, rough=rough, metal=metal, layer=0.2, layer_strength=0.3)
    nt = m.node_tree
    p = nt.nodes["Principled BSDF"]
    out = nt.nodes["Material Output"]
    tc = nt.nodes.new("ShaderNodeTexCoord")
    if "trans" in ex:
        p.inputs["Transmission Weight"].default_value = ex["trans"]
        p.inputs["IOR"].default_value = 1.55
    if "coat" in ex:
        p.inputs["Coat Weight"].default_value = ex["coat"]
    look = ex.get("look")
    if look == "silk":
        p.inputs["Specular Tint"].default_value = st.hexcol(color)
        p.inputs["Anisotropic"].default_value = 0.6
    elif look == "palette":
        sep = nt.nodes.new("ShaderNodeSeparateXYZ")
        nt.links.new(tc.outputs["Object"], sep.inputs["Vector"])
        mr = node(nt, "ShaderNodeMapRange", **{"From Min": 0.0, "From Max": 42.0})
        nt.links.new(sep.outputs["Z"], mr.inputs["Value"])
        ramp = nt.nodes.new("ShaderNodeValToRGB")
        cr = ramp.color_ramp
        cr.elements[0].color = st.hexcol("#d94f70")
        cr.elements[1].color = st.hexcol("#3ab0c9")
        e = cr.elements.new(0.5)
        e.color = st.hexcol("#f2b631")
        nt.links.new(mr.outputs["Result"], ramp.inputs["Fac"])
        nt.links.new(ramp.outputs["Color"], p.inputs["Base Color"])
    elif look == "marble":
        wave = node(nt, "ShaderNodeTexWave", Scale=0.08, Distortion=18.0, Detail=6.0)
        wave.wave_type = "BANDS"
        wave.bands_direction = "DIAGONAL"
        nt.links.new(tc.outputs["Object"], wave.inputs["Vector"])
        ramp = nt.nodes.new("ShaderNodeValToRGB")
        cr = ramp.color_ramp
        cr.elements[0].position = 0.0
        cr.elements[0].color = st.hexcol("#e9e7e2")
        e = cr.elements.new(0.48)
        e.color = st.hexcol("#e4e1dc")
        e2 = cr.elements.new(0.5)
        e2.color = st.hexcol("#55575c")
        cr.elements[-1].position = 0.53
        cr.elements[-1].color = st.hexcol("#e2dfd9")
        nt.links.new(wave.outputs["Fac"], ramp.inputs["Fac"])
        # Sprenkel
        nz = node(nt, "ShaderNodeTexNoise", Scale=0.9, Detail=2.0)
        nt.links.new(tc.outputs["Object"], nz.inputs["Vector"])
        mix = nt.nodes.new("ShaderNodeMix")
        mix.data_type = "RGBA"
        mix.inputs["Factor"].default_value = 0.0
        nt.links.new(ramp.outputs["Color"], mix.inputs["A"])
        mix.inputs["B"].default_value = st.hexcol("#2b2c30")
        gt = node(nt, "ShaderNodeMath")
        gt.operation = "GREATER_THAN"
        gt.inputs[1].default_value = 0.72
        nt.links.new(nz.outputs["Fac"], gt.inputs[0])
        nt.links.new(gt.outputs["Value"], mix.inputs["Factor"])
        nt.links.new(mix.outputs["Result"], p.inputs["Base Color"])
    elif look == "wood":
        wave = node(nt, "ShaderNodeTexWave", Scale=0.12, Distortion=6.0, Detail=4.0)
        wave.wave_type = "RINGS"
        nt.links.new(tc.outputs["Object"], wave.inputs["Vector"])
        ramp = nt.nodes.new("ShaderNodeValToRGB")
        ramp.color_ramp.elements[0].color = st.hexcol("#7a5130")
        ramp.color_ramp.elements[1].color = st.hexcol("#b4844f")
        nt.links.new(wave.outputs["Fac"], ramp.inputs["Fac"])
        nt.links.new(ramp.outputs["Color"], p.inputs["Base Color"])
    elif look == "glow":
        p.inputs["Emission Color"].default_value = st.hexcol("#9dff8a")
        p.inputs["Emission Strength"].default_value = 0.6
    elif look in ("sparkle", "fiber", "foam"):
        if look == "foam":
            nz = node(nt, "ShaderNodeTexNoise", Scale=1.2, Detail=8.0)
            nt.links.new(tc.outputs["Object"], nz.inputs["Vector"])
            bump = node(nt, "ShaderNodeBump", Strength=0.45, Distance=0.15)
            nt.links.new(nz.outputs["Fac"], bump.inputs["Height"])
            nt.links.new(bump.outputs["Normal"], p.inputs["Normal"])
        else:
            vor = node(nt, "ShaderNodeTexVoronoi", Scale=6.0 if look == "sparkle" else 9.0)
            nt.links.new(tc.outputs["Object"], vor.inputs["Vector"])
            lt = node(nt, "ShaderNodeMath")
            lt.operation = "LESS_THAN"
            lt.inputs[1].default_value = 0.09 if look == "sparkle" else 0.16
            nt.links.new(vor.outputs["Distance"], lt.inputs[0])
            p2 = nt.nodes.new("ShaderNodeBsdfPrincipled")
            if look == "sparkle":
                p2.inputs["Base Color"].default_value = st.hexcol(ex.get("flake", "#e8d9a8"))
                p2.inputs["Metallic"].default_value = 1.0
                p2.inputs["Roughness"].default_value = 0.12
            else:
                p2.inputs["Base Color"].default_value = st.hexcol("#8d8f94" if ex.get("fiber_light") else "#45474c")
                p2.inputs["Roughness"].default_value = 0.6
            mix = nt.nodes.new("ShaderNodeMixShader")
            nt.links.new(lt.outputs["Value"], mix.inputs["Fac"])
            nt.links.new(p.outputs["BSDF"], mix.inputs[1])
            nt.links.new(p2.outputs["BSDF"], mix.inputs[2])
            nt.links.new(mix.outputs["Shader"], out.inputs["Surface"])
    return m


def plaque(mat, label, flex):
    """Musterplättchen 60×36×4 mm, stehend, mit erhabenem Namen und abgestufter Dicke unten."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=(60, 4, 36), verts=bm.verts)
    bmesh.ops.bevel(bm, geom=list(bm.edges), offset=1.2, offset_type="OFFSET", segments=4, profile=0.5, affect="EDGES", clamp_overlap=True)
    bmesh.ops.translate(bm, vec=(0, 0, 18), verts=bm.verts)
    ob = st.mesh_obj("Plaettchen", bm, mat, 30)
    # Stufen (zeigen Deckkraft bei Transluzenz)
    for i, w in enumerate((1.0, 2.0, 3.0)):
        bm = bmesh.new()
        bmesh.ops.create_cube(bm, size=1.0)
        bmesh.ops.scale(bm, vec=(12, w, 7), verts=bm.verts)
        bmesh.ops.translate(bm, vec=(-18 + i * 13, -2 - w / 2, 6), verts=bm.verts)
        s = st.mesh_obj("Stufe", bm, mat, 30)
        s.parent = ob
    cu = bpy.data.curves.new("Name", "FONT")
    cu.body = label
    cu.size = 7.0 if len(label) <= 9 else 5.6
    cu.extrude = 0.5
    cu.align_x = "CENTER"
    cu.align_y = "CENTER"
    try:
        cu.font = bpy.data.fonts.load("C:/Windows/Fonts/bahnschrift.ttf")
    except Exception:
        pass
    t = st.link(bpy.data.objects.new("Name", cu))
    t.data.materials.append(mat)
    t.location = (0, -2.4, 24)
    t.rotation_euler = (math.pi / 2, 0, 0)
    t.parent = ob
    ob.location = (-14, 6, 0)
    ob.rotation_euler = (0, 0, math.radians(-12))
    return ob


def tower(mat, flex=None):
    """Gedrehter Sechskant-Turm mit runden Ecken (zeigt Glanz und Schichtlinien)."""
    bm = bmesh.new()
    n, rings, H, R = 36, 48, 42.0, 11.0
    loops = []
    for j in range(rings + 1):
        z = H * j / rings
        tw = math.radians(60) * (z / H)
        bulge = 1 + 0.08 * math.sin(math.pi * z / H)
        lp = []
        for i in range(n):
            a = 2 * math.pi * i / n
            # abgerundetes Sechseck
            hexr = math.cos(math.pi / 6) / math.cos(((a + math.pi / 6) % (math.pi / 3)) - math.pi / 6)
            r = R * bulge * (0.82 * hexr + 0.18)
            lp.append(bm.verts.new((math.cos(a + tw) * r, math.sin(a + tw) * r, z)))
        loops.append(lp)
    for j in range(rings):
        for i in range(n):
            bm.faces.new((loops[j][i], loops[j][(i + 1) % n], loops[j + 1][(i + 1) % n], loops[j + 1][i]))
    bm.faces.new(list(reversed(loops[0])))
    bm.faces.new(loops[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    ob = st.mesh_obj("Turm", bm, mat, 40)
    if flex:
        # TPU: der Turm biegt sich zur Seite
        md = ob.modifiers.new("Biegen", "SIMPLE_DEFORM")
        md.deform_method = "BEND"
        md.deform_axis = "Y"
        md.angle = math.radians(40 * flex)
    ob.location = (31, -16, 0)
    return ob


def scene_for(mid):
    scene = st.reset()
    st.world(scene, "#060607", 1.0)
    st.cyclorama(width=600, depth=200, height=200, radius=60, color="#141416", rough=0.35)
    mat = sample_mat(mid)
    name, *_ , ex = M[mid]
    plaque(mat, name, ex.get("flex"))
    tower(mat, ex.get("flex"))
    c = (4, 0, 18)
    st.area("Haupt", (-50, -70, 90), c, 50, 40, 160000, (1, 0.98, 0.95))
    st.area("Gold_links", (-90, 60, 30), c, 20, 50, 90000, st.GOLD)
    st.area("Gold_rechts", (90, 50, 25), c, 20, 50, 70000, st.GOLD)
    st.area("Aufhellung", (30, -90, 15), c, 60, 15, 20000, (0.9, 0.93, 1.0))
    st.area("Hintergrund", (0, 70, 5), (0, 150, 80), 120, 30, 60000, (1.0, 0.82, 0.5))
    # Gegenlicht hinter dem Muster (lässt Transluzentes leuchten)
    st.area("Gegenlicht", (-10, 60, 30), (-10, 0, 20), 40, 30, 25000, (1.0, 0.95, 0.88))
    st.camera((30, -265, 78), (-2, 0, 17), lens=85)
    st.render_settings(scene, 960, 540, SAMPLES)
    scene.render.image_settings.file_format = "WEBP"
    scene.render.image_settings.quality = 85
    scene.render.filepath = os.path.join(OUT, f"{mid}.webp")
    bpy.ops.render.render(write_still=True)
    print("Muster:", scene.render.filepath)


for mid in M:
    if ONLY and mid not in ONLY:
        continue
    scene_for(mid)
