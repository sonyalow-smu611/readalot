# Exports room.blend for the app: the 3D room, and a still of the first view.
#
#   /Applications/Blender.app/Contents/MacOS/Blender -b client/blender/room.blend -P client/blender/render_room.py
#
# Outputs:
#   public/room/bedroom.glb       the room the home page draws with Three.js (Room3D.vue)
#   src/assets/room/room.webp     the first view as a picture: shown while the room loads, and
#                                 instead of it on devices that cannot draw 3D
import os

import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
CLIENT = os.path.join(HERE, "..")


def flat_colours():
    """glTF carries no procedural textures: a material whose colour comes from nodes would reach
    the app white. Gives each one a plain colour instead, the middle of the colour ramp that feeds
    it (or its viewport colour). Only for the export; room.blend is not saved."""
    for mat in bpy.data.materials:
        if not mat.use_nodes or "Principled BSDF" not in mat.node_tree.nodes:
            continue
        socket = mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"]
        if not socket.is_linked:
            continue
        ramp = upstream_ramp(socket.links[0].from_node)
        colour = ramp.color_ramp.evaluate(0.5) if ramp else mat.diffuse_color
        for link in list(socket.links):
            mat.node_tree.links.remove(link)
        socket.default_value = tuple(colour)


def upstream_ramp(node, seen=None):
    seen = seen or set()
    if node in seen:
        return None
    seen.add(node)
    if node.type == "VALTORGB":
        return node
    for socket in node.inputs:
        for link in socket.links:
            found = upstream_ramp(link.from_node, seen)
            if found:
                return found
    return None


def export_glb():
    out = os.path.join(CLIENT, "public", "room")
    os.makedirs(out, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=os.path.join(out, "bedroom.glb"),
        export_format="GLB",
        export_apply=True,  # bevels and cushions are modifiers
        use_visible=True,  # leaves out the placeholder books, hidden in the viewport
        export_extras=True,  # slot zones and positions travel as custom properties
        # the hero book's cover and page actions, merged into one animation that opens it
        export_animation_mode="ACTIVE_ACTIONS",
        export_cameras=True,
        export_lights=False,  # the app lights the room itself, and changes it with the weather
        export_yup=True,
    )


def render_still():
    scene = bpy.context.scene
    # hidden objects still render; the placeholder books fill the shelves in the picture
    out = os.path.join(CLIENT, "src", "assets", "room")
    os.makedirs(out, exist_ok=True)
    scene.render.image_settings.file_format = "WEBP"
    scene.render.image_settings.color_mode = "RGB"
    scene.render.image_settings.quality = 85
    scene.render.filepath = os.path.join(out, "room.webp")
    bpy.ops.render.render(write_still=True)


# the still first: it is drawn with the procedural materials, which the export then flattens
render_still()
flat_colours()
export_glb()
