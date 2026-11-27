"""
Studio-Renderings der Fertigteile: je Teil ein Standbild (WebP) und ein 360°-Drehvideo (MP4, Schleife).

Aufruf:
  blender -b -P fertigteile_render.py -- [--nur id1,id2] [--mit-video] [--samples 128]

Quelle sind die Modelle aus public/models (dieselben wie im 3D-Viewer), Ausgabe nach
public/fertigteile/<id>.webp und <id>.mp4. Neues Teil: Eintrag in TEILE ergänzen, Skript laufen lassen.
"""

import bpy
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.append(HERE)
import studio as st  # noqa: E402

REPO = os.path.dirname(HERE)
MODELS = os.path.join(REPO, "public", "models")
OUT = st.out_dir(REPO, "public", "fertigteile")

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
ONLY = argv[argv.index("--nur") + 1].split(",") if "--nur" in argv else None
NO_VIDEO = "--mit-video" not in argv  # Drehvideo nur auf Wunsch (Standbild wirkt ruhiger)
SAMPLES = int(argv[argv.index("--samples") + 1]) if "--samples" in argv else 128

# id: (Datei, Farbe, Rauheit, Darstellung: Drehung um X/Y vor dem Rendern (Grad), Kamerahöhe in Grad)
TEILE = {
    "vw-t4-fuehrung-blende": ("vw-t4-fuehrung-blende.stl", "#2a2c30", 0.5, (0, 0, 0), 32),
    "vw-t5-clip-kopfstuetze": ("vw-t5-clip-kopfstuetze.stl", "#2a2c30", 0.5, (0, 0, 0), 30),
    "honda-xrv750-spritzschutz": ("honda-xrv750-spritzschutz.3mf", "#2a2c30", 0.5, (0, 0, 0), 40),
    "vw-t4-t5-t6-heckklappenaussteller": ("heckklappenaussteller-t4-t5-t6.stl", "#2a2c30", 0.5, (0, 0, 0), 38),
    "vw-t3-heckklappenaussteller": ("heckklappenaussteller-t3.stl", "#2a2c30", 0.5, (0, 0, 0), 38),
}

FRAMES = 72  # 3 s bei 24 fps


def build(pid):
    fname, color, rough, rot, elev = TEILE[pid]
    scene = st.reset()
    st.world(scene, "#060607", 1.0)
    path = os.path.join(MODELS, fname)
    ob = st.import_3mf(path, pid) if fname.endswith(".3mf") else st.import_stl(path)
    ob.name = pid
    dims, s = st.prepare_part(ob, target_size=10.0)
    ob.data.materials.clear()
    ob.data.materials.append(st.printed_mat("PETG", color, rough=rough, layer=0.2, layer_strength=0.5))
    # Bump-Höhe in Weltmaßen: ~0,03 mm Schichtwulst × Skalierung (sonst kippen Normalen → schwarze Flächen)
    for n in ob.data.materials[0].node_tree.nodes:
        if n.type == "BUMP":
            n.inputs["Distance"].default_value = 0.03 * s

    # Drehteller: Teil hängt an einem Empty, das sich um Z dreht
    turn = st.link(bpy.data.objects.new("Drehteller", None))
    ob.parent = turn
    turn.rotation_euler = (math.radians(rot[0]), math.radians(rot[1]), math.radians(-30))
    h = dims.z * s

    # groß genug, dass glatte Flächen keine Hintergrundkante spiegeln
    cyc = st.cyclorama(width=1400, depth=700, height=700, radius=60, color="#131315", rough=0.32)
    cyc.location.y = 40  # Rundung beginnt weit hinter dem Teil (sonst schneidet sie durch flache Teile)
    # dezenter Goldring auf dem Boden unter dem Teil
    import bmesh

    bm = bmesh.new()
    bmesh.ops.create_circle(bm, cap_ends=False, segments=128, radius=7.3)
    ring = st.mesh_obj("Ring", bm)
    ring.data.materials.append(st.simple_mat("Ringgold", "#000000", 0, 0.5, Emission_Color=st.hexcol("#d4af37"), Emission_Strength=3.0))
    mod = ring.modifiers.new("Dicke", "SKIN")
    for v in ring.data.skin_vertices[0].data:
        v.radius = (0.035, 0.035)
    ring.location.z = 0.01

    # Licht: weiches Hauptlicht, zwei goldene Kanten, flache Aufhellung von vorn
    c = (0, 0, h / 2)
    st.area("Haupt", (-14, -18, 24), c, 16, 12, 30000, (1, 0.98, 0.95))
    st.area("Gold_links", (-22, 16, 9), c, 6, 14, 16000, st.GOLD)
    st.area("Gold_rechts", (22, 14, 7), c, 6, 14, 12000, st.GOLD)
    st.area("Aufhellung", (8, -26, 4), c, 20, 4, 3500, (0.9, 0.93, 1.0))
    # großes weiches Oberlicht: hellt Schlagschatten auf (sonst wirken sie auf hellen Teilen wie Löcher)
    st.area("Oberlicht", (0, -4, 40), (0, 0, 0), 40, 40, 9000, (1, 0.98, 0.95))
    st.area("Hintergrund", (0, 20, 2), (0, 45, 25), 40, 10, 9000, (1.0, 0.82, 0.5))

    dist = 42.0
    e = math.radians(elev)
    st.camera((0, -math.cos(e) * dist, math.sin(e) * dist + h / 2), (0, 0, h * 0.45), lens=85)
    return scene, turn


def render(pid):
    scene, turn = build(pid)
    # Standbild
    st.render_settings(scene, 1200, 1200, SAMPLES)
    scene.render.image_settings.file_format = "WEBP"
    scene.render.image_settings.quality = 88
    scene.render.filepath = os.path.join(OUT, f"{pid}.webp")
    bpy.ops.render.render(write_still=True)
    print("Standbild:", scene.render.filepath)
    if NO_VIDEO:
        return
    # 360°-Drehung
    turn.rotation_euler.z = math.radians(-30)
    turn.keyframe_insert("rotation_euler", index=2, frame=1)
    turn.rotation_euler.z = math.radians(-30 + 360)
    turn.keyframe_insert("rotation_euler", index=2, frame=FRAMES + 1)
    for fc in turn.animation_data.action.fcurves if hasattr(turn.animation_data.action, "fcurves") else []:
        for kp in fc.keyframe_points:
            kp.interpolation = "LINEAR"
    try:
        for layer in turn.animation_data.action.layers:
            for strip in layer.strips:
                for cb in strip.channelbags:
                    for fc in cb.fcurves:
                        for kp in fc.keyframe_points:
                            kp.interpolation = "LINEAR"
    except Exception:
        pass
    scene.frame_start, scene.frame_end = 1, FRAMES
    scene.render.fps = 24
    st.render_settings(scene, 720, 720, max(24, SAMPLES // 5))
    try:
        scene.render.image_settings.media_type = "VIDEO"
    except Exception:
        pass
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format = "MPEG4"
    scene.render.ffmpeg.codec = "H264"
    scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
    scene.render.ffmpeg.gopsize = 24
    scene.render.ffmpeg.audio_codec = "NONE"
    scene.render.filepath = os.path.join(OUT, f"{pid}.mp4")
    bpy.ops.render.render(animation=True)
    print("Video:", scene.render.filepath)


for pid in TEILE:
    if ONLY and pid not in ONLY:
        continue
    render(pid)
