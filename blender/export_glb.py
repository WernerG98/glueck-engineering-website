"""
Exportiert das Druckermodell als GLB für die Webseite (public/models/drucker.glb).

Aufruf (nach drucker_modell.py, das die .blend erzeugt):
  blender -b drucker_modell.blend -P export_glb.py

Was im Web dynamisch bleibt (Three.js), fliegt hier raus: Boden, Druckteil + Skirt,
PTFE-Schlauch, Display-Inhalt, Statusband, Lichter, Kamera.
Bewegliche Baugruppen stehen in Ruhelage (Ursprung), das Web-Skript bewegt sie:
  Gantry (Z), Druckkopf (X, Kind von Gantry), Bett (Y, Plattenoberkante = 0), Spule_0..3 (Drehung um X).
"""

import bpy
import os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), "public", "models", "drucker.glb")

DROP = {
    "Boden", "Druckteil_Zahnrad", "Skirt", "PTFE_Schlauch", "Statusband",
    "Display_Status", "Display_Prozent", "Display_Balken", "Display_Fortschritt", "AMS",
}

for ob in list(bpy.data.objects):
    if ob.name in DROP or ob.type in {"LIGHT", "CAMERA"}:
        bpy.data.objects.remove(ob, do_unlink=True)

for name in ("Gantry", "Druckkopf", "Bett"):
    bpy.data.objects[name].location = (0, 0, 0)

# Kurven/Text → Mesh (der glTF-Export nimmt nur Meshes sicher mit)
dg = bpy.context.evaluated_depsgraph_get()
for ob in [o for o in bpy.data.objects if o.type in {"CURVE", "FONT"}]:
    me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
    new = bpy.data.objects.new(ob.name + "_mesh", me)
    bpy.context.scene.collection.objects.link(new)
    new.parent = ob.parent
    new.matrix_basis = ob.matrix_basis.copy()
    name = ob.name
    bpy.data.objects.remove(ob, do_unlink=True)
    new.name = name

# Prozedurale Knoten (Rauheits-Rauschen, Bump) kann glTF nicht → auf feste Werte zurückführen
for m in bpy.data.materials:
    if not m.node_tree:
        continue
    nt = m.node_tree
    p = nt.nodes.get("Principled BSDF")
    if not p:
        continue
    for link in list(nt.links):
        if link.to_node != p:
            continue
        sock = link.to_socket.name
        src = link.from_node
        if sock == "Roughness" and src.type == "MAP_RANGE":
            p.inputs["Roughness"].default_value = (src.inputs["To Min"].default_value + src.inputs["To Max"].default_value) / 2
            nt.links.remove(link)
        elif sock == "Normal":
            nt.links.remove(link)
    # Glas-Trick (Schattenstrahl-Mix) entfernen → reines Principled an den Ausgang
    out = nt.nodes.get("Material Output")
    if out and out.inputs["Surface"].is_linked and out.inputs["Surface"].links[0].from_node.type == "MIX_SHADER":
        nt.links.new(p.outputs["BSDF"], out.inputs["Surface"])

bpy.ops.object.select_all(action="DESELECT")
for ob in bpy.context.scene.objects:
    ob.select_set(True)

os.makedirs(os.path.dirname(OUT), exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=OUT,
    export_format="GLB",
    use_selection=True,
    export_apply=True,
    export_yup=True,
    export_lights=False,
    export_cameras=False,
    export_extras=False,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=7,
    export_draco_position_quantization=14,
    export_draco_normal_quantization=10,
    export_draco_texcoord_quantization=12,
    export_image_format="WEBP",
)
print("GLB:", OUT, round(os.path.getsize(OUT) / 1024), "KB")
