# Builds the home-page bedroom in Blender and saves it as room.blend. The bookcase is not built
# here: build_bookshelf.py adds it afterwards (see README.md in this folder for the order).
#
#   /Applications/Blender.app/Contents/MacOS/Blender -b -P client/blender/build_room.py
#
# The scene is made from primitives so it can be rebuilt from this file; it is fine to open
# room.blend and model on top of it instead, as long as the named markers below keep their names.
#
# Markers the app looks for (by object name):
#   hit.<name>          an invisible box: tapping it opens that thing (chair, corkboard, ...)
#   slot.<zone>.<n>     where a shop decoration can stand (custom props: zone, x)
#   walk.<n>            points on the floor that pets wander between
#   glass.<n> / sky.<n> the window panes, and the sky behind them, where the app shows the weather
#   clock.hour / clock.minute   the clock hands, turned about the clock's centre
#   lamp.shade / lamp.light     the lamp, lit at night
#   camera              where the reader stands, and the first view
#
# Layout: the room is 4.4 m wide (x), 4 m deep (y) and 2.7 m tall (z). The back wall (y = 2)
# has the bay window, the left wall (x = -2.2) the bookcase (build_bookshelf.py), the right wall (x = 2.2) the bed,
# and the front wall (y = -2) the door and the clock.
import math
import os

import bmesh
import bpy
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))

# the app's palette (client/src/styles/theme.css), so the room sits with the HTML panels
WALL = "#E6D6C3"
WALL_SIDE = "#E9DCCB"
CEILING = "#F1E7DA"
FLOOR = "#B08D6C"
WOOD = "#7A5639"
WOOD_LIGHT = "#AF8F71"
FABRIC_LIGHT = "#C9B092"
THROW = "#C79B8C"
RUG = "#CDB89C"
PAPER = "#FFFDF9"
CORK = "#B98E62"
LINEN = "#EFE6DA"
BLANKET = "#C9A397"

ROOM_X = (-2.2, 2.2)
ROOM_Y = (-2.0, 2.0)
ROOM_H = 2.7
WALL_T = 0.1

# the bay window in the back wall
BAY_OPEN_X = (-1.0, 1.0)
BAY_DEPTH = 0.55
BAY_INSET = 0.4  # how far in from each side the bay's back wall starts
SILL_Z = 0.5
HEAD_Z = 2.2
BAY_TOP_Z = 2.45

EYE = (0.0, -0.3, 1.45)


def hex_rgba(value, alpha=1.0):
    value = value.lstrip("#")
    srgb = [int(value[i : i + 2], 16) / 255 for i in (0, 2, 4)]
    linear = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb]
    return (*linear, alpha)


MATERIALS = {}


def material(name, color, roughness=0.7, alpha=1.0):
    """A plain Principled material. Only colour, roughness and alpha reach the app (glTF)."""
    if name in MATERIALS:
        return MATERIALS[name]
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = hex_rgba(color)
    bsdf.inputs["Roughness"].default_value = roughness
    if alpha < 1:
        bsdf.inputs["Alpha"].default_value = alpha
        if hasattr(mat, "surface_render_method"):
            mat.surface_render_method = "BLENDED"
    MATERIALS[name] = mat
    return mat


def select_only(obj):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


def box(name, x, y, z, mat, bevel=0.0):
    """A box spanning the (min, max) ranges x, y and z."""
    size = Vector((x[1] - x[0], y[1] - y[0], z[1] - z[0]))
    centre = Vector(((x[0] + x[1]) / 2, (y[0] + y[1]) / 2, (z[0] + z[1]) / 2))
    bpy.ops.mesh.primitive_cube_add(size=1, location=centre)
    obj = bpy.context.object
    obj.name = name
    obj.scale = size
    bpy.ops.object.transform_apply(scale=True)
    if bevel:
        mod = obj.modifiers.new("bevel", "BEVEL")
        mod.width = bevel
        mod.segments = 3
        mod.limit_method = "NONE"
        bpy.ops.object.shade_smooth()
    if mat:
        obj.data.materials.append(mat)
    return obj


def soft(obj, levels=2):
    """Rounds a bevelled box into a cushion."""
    mod = obj.modifiers.new("soft", "SUBSURF")
    mod.levels = levels
    mod.render_levels = levels
    select_only(obj)
    bpy.ops.object.shade_smooth()
    return obj


def cylinder(name, centre, radius, depth, mat, rotation=(0, 0, 0), vertices=32):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=centre, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    bpy.ops.object.shade_smooth()
    obj.data.materials.append(mat)
    return obj


def sphere(name, centre, radius, mat, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=radius, location=centre, segments=24, ring_count=12)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.shade_smooth()
    obj.data.materials.append(mat)
    return obj


def prism(name, points, z, mat):
    """A flat polygon (x, y points, counter-clockwise) extruded from z[0] to z[1]."""
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bottom = [bm.verts.new((x, y, z[0])) for x, y in points]
    top = [bm.verts.new((x, y, z[1])) for x, y in points]
    bm.faces.new(list(reversed(bottom)))
    bm.faces.new(top)
    count = len(points)
    for i in range(count):
        j = (i + 1) % count
        bm.faces.new([bottom[i], bottom[j], top[j], top[i]])
    bm.normal_update()
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    return obj


def panel(name, p0, p1, z, thickness, mat):
    """A wall-like box standing on the line from p0 to p1 (x, y), from z[0] to z[1]."""
    dx, dy = p1[0] - p0[0], p1[1] - p0[1]
    length = math.hypot(dx, dy)
    obj = box(name, (-length / 2, length / 2), (-thickness / 2, thickness / 2), z, mat)
    obj.location = ((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, obj.location.z)
    obj.rotation_euler.z = math.atan2(dy, dx)
    return obj


def marker(name, location, **props):
    """An empty the app reads by name; custom props reach it as glTF extras."""
    bpy.ops.object.empty_add(type="PLAIN_AXES", radius=0.08, location=location)
    obj = bpy.context.object
    obj.name = name
    for key, value in props.items():
        obj[key] = value
    return obj


def hidden_box(name, x, y, z):
    """A box only the app uses (to find where things are, or to catch taps); never drawn."""
    obj = box(name, x, y, z, material("marker", "#FF00FF"))
    obj.display_type = "WIRE"
    obj.hide_render = True
    return obj


def pivot_at_world_origin(obj):
    """Keeps the mesh where it is but moves its origin to (0, 0, 0), so the object can then be
    placed (and turned) about a point outside itself, like a clock hand about the clock's centre."""
    select_only(obj)
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
    return obj


def cut(target, cutter):
    """Cuts `cutter`'s shape out of `target`, then deletes the cutter."""
    mod = target.modifiers.new("cut", "BOOLEAN")
    mod.operation = "DIFFERENCE"
    mod.object = cutter
    select_only(target)
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter, do_unlink=True)


# --- Shell -----------------------------------------------------------------------------------
def build_shell():
    x0, x1 = ROOM_X
    y0, y1 = ROOM_Y
    wall = material("wall", WALL, 0.9)
    side = material("wall side", WALL_SIDE, 0.9)
    box("floor", (x0, x1), (y0, y1 + BAY_DEPTH), (-0.1, 0), material("floor", FLOOR, 0.55))
    seam = material("floor seam", "#94735A", 0.8)
    for i in range(-9, 10):
        box(f"floor seam {i}", (i * 0.24 - 0.004, i * 0.24 + 0.004), (y0, y1), (0, 0.001), seam)
    box("ceiling", (x0, x1), (y0, y1), (ROOM_H, ROOM_H + 0.1), material("ceiling", CEILING, 0.9))

    back = box("wall back", (x0 - WALL_T, x1 + WALL_T), (y1, y1 + WALL_T), (0, ROOM_H), wall)
    hole = box("bay hole", BAY_OPEN_X, (y1 - 0.5, y1 + 0.5), (0, BAY_TOP_Z), None)
    cut(back, hole)
    box("wall front", (x0 - WALL_T, x1 + WALL_T), (y0 - WALL_T, y0), (0, ROOM_H), wall)
    box("wall left", (x0 - WALL_T, x0), (y0, y1), (0, ROOM_H), side)
    box("wall right", (x1, x1 + WALL_T), (y0, y1), (0, ROOM_H), side)

    skirting = material("skirting", WOOD_LIGHT, 0.6)
    box("skirting front", (x0, x1), (y0, y0 + 0.02), (0, 0.1), skirting)
    box("skirting right", (x1 - 0.02, x1), (y0, y1), (0, 0.1), skirting)
    box("skirting back left", (x0, BAY_OPEN_X[0]), (y1 - 0.02, y1), (0, 0.1), skirting)
    box("skirting back right", (BAY_OPEN_X[1], x1), (y1 - 0.02, y1), (0, 0.1), skirting)
    cornice = material("cornice", "#EFE4D6", 0.7)
    box("cornice front", (x0, x1), (y0, y0 + 0.06), (ROOM_H - 0.1, ROOM_H), cornice)
    box("cornice back", (x0, x1), (y1 - 0.06, y1), (ROOM_H - 0.1, ROOM_H), cornice)
    box("cornice right", (x1 - 0.06, x1), (y0, y1), (ROOM_H - 0.1, ROOM_H), cornice)


# --- Bay window and its seat -----------------------------------------------------------------
def build_bay():
    y1 = ROOM_Y[1]
    left, right = BAY_OPEN_X
    corners = [(left, y1), (left + BAY_INSET, y1 + BAY_DEPTH), (right - BAY_INSET, y1 + BAY_DEPTH), (right, y1)]
    wall = material("wall", WALL, 0.9)
    frame = material("window frame", WOOD_LIGHT, 0.55)
    glass_mat = material("glass", "#E8F2F7", 0.05, alpha=0.15)

    # three faces of the bay: low wall, glass, frame, and a short wall above
    for i in range(3):
        p0, p1 = corners[i], corners[i + 1]
        panel(f"bay low {i}", p0, p1, (0, SILL_Z), 0.08, wall)
        panel(f"bay head {i}", p0, p1, (HEAD_Z, BAY_TOP_Z), 0.08, wall)
        panel(f"glass.{i}", p0, p1, (SILL_Z, HEAD_Z), 0.01, glass_mat)
        panel(f"bay sill {i}", p0, p1, (SILL_Z - 0.03, SILL_Z), 0.14, frame)
        panel(f"bay lintel {i}", p0, p1, (HEAD_Z, HEAD_Z + 0.04), 0.1, frame)
        panel(f"bay transom {i}", p0, p1, (1.72, 1.76), 0.06, frame)
        for k, point in enumerate([p0, p1]):
            box(f"bay post {i}.{k}", (point[0] - 0.035, point[0] + 0.035), (point[1] - 0.035, point[1] + 0.035), (SILL_Z, HEAD_Z), frame)
        if i == 1:
            mid = ((p0[0] + p1[0]) / 2, p0[1])
            box("bay mullion", (mid[0] - 0.02, mid[0] + 0.02), (mid[1] - 0.03, mid[1] + 0.03), (SILL_Z, HEAD_Z), frame)
    prism("bay ceiling", corners, (BAY_TOP_Z, BAY_TOP_Z + 0.05), material("ceiling", CEILING, 0.9))

    # the seat fills the bay, a cushion on top and two pillows
    seat_pts = [(left + 0.04, y1 - 0.12), (right - 0.04, y1 - 0.12),
                (right - BAY_INSET - 0.03, y1 + BAY_DEPTH - 0.06), (left + BAY_INSET + 0.03, y1 + BAY_DEPTH - 0.06)]
    prism("seat base", seat_pts, (0, 0.42), material("seat wood", WOOD_LIGHT, 0.6))
    prism("seat cushion", seat_pts, (0.42, 0.52), material("cushion", FABRIC_LIGHT, 0.85))
    for k, x in enumerate((-0.55, 0.55)):
        pillow = soft(box(f"seat pillow {k}", (x - 0.16, x + 0.16), (y1 + 0.18, y1 + 0.3), (0.52, 0.8), material("pillow", THROW, 0.9), bevel=0.04))
        pillow.rotation_euler.z = math.radians(25 if x < 0 else -25)

    # outside: the sky. The app leaves it see-through and shows the live weather behind it
    # (WindowView: sun and birds, clouds, rain, the moon); the still picture shows it plain
    sky = material("sky", "#9EC4E0", 1.0)
    box("sky.0", (-6, 6), (5.5, 5.6), (-1, 6), sky)
    box("sky.1", (-6, -5.9), (2.1, 5.5), (-1, 6), sky)
    box("sky.2", (5.9, 6), (2.1, 5.5), (-1, 6), sky)

    hidden_box("hit.window", (left + 0.1, right - 0.1), (y1 + 0.2, y1 + 0.5), (SILL_Z + 0.1, HEAD_Z - 0.1))
    # decorations stand on the cushion, along the back of the seat
    for k, x in enumerate((-0.35, 0.0, 0.35)):
        marker(f"slot.seat.{k}", (x, y1 + 0.32, 0.52), zone="seat", x=0.25 + k * 0.25)


# --- Reading corner: armchair, side table, lamp ----------------------------------------------
# The armchair is the one remodelled by hand, kept in furniture.blend: its frame, cushions and
# throw, the open book on its seat (the button for Currently Reading) and its tap target.
FURNITURE = os.path.join(HERE, "furniture.blend")
ARMCHAIR = [
    "chair base", "chair back", "chair arm", "chair arm.001",
    "chair leg", "chair leg.001", "chair leg.002", "chair leg.003",
    "seat cushion", "back cushion", "throw",
    "book spine", "book board", "book board.001", "book half", "book half.001", "ribbon",
    *["line"] + [f"line.{k:03d}" for k in range(1, 10)],
    "hotspot.chair",
]
# in the back left corner, turned to face the middle of the room (it faces -y as remodelled)
ARMCHAIR_AT = (-1.5, 1.42)
ARMCHAIR_TURN = math.radians(45)


def copy_armchair():
    with bpy.data.libraries.load(FURNITURE, link=False) as (source, copied):
        copied.objects = [name for name in source.objects if name in ARMCHAIR]
    parts = copied.objects
    for part in parts:
        bpy.context.scene.collection.objects.link(part)
    bpy.context.view_layer.update()

    # turned about the middle of where it stands on the floor
    corners = [part.matrix_world @ Vector(c) for part in parts if part.type == "MESH" for c in part.bound_box]
    middle = Vector(((min(c.x for c in corners) + max(c.x for c in corners)) / 2,
                     (min(c.y for c in corners) + max(c.y for c in corners)) / 2, 0))
    chair = bpy.data.objects.new("armchair", None)
    chair.location = middle
    bpy.context.scene.collection.objects.link(chair)
    bpy.context.view_layer.update()
    for part in parts:
        if part.parent is None:
            part.parent = chair
            part.matrix_parent_inverse = chair.matrix_world.inverted()
    chair.location = (*ARMCHAIR_AT, 0)
    chair.rotation_euler.z = ARMCHAIR_TURN
    # the room's tap targets are hit.<name>
    bpy.data.objects["hotspot.chair"].name = "hit.chair"


def build_reading_corner():
    copy_armchair()

    # side table with the lamp, against the back wall beside the bay
    table_x, table_y = -0.7, 1.72
    top_mat = material("table", WOOD, 0.5)
    cylinder("side table top", (table_x, table_y, 0.58), 0.22, 0.04, top_mat)
    cylinder("side table stem", (table_x, table_y, 0.3), 0.03, 0.56, top_mat)
    cylinder("side table foot", (table_x, table_y, 0.02), 0.15, 0.03, top_mat)
    lamp_x = table_x - 0.08
    brass = material("brass", "#B8943F", 0.35)
    cylinder("lamp base", (lamp_x, table_y, 0.65), 0.07, 0.1, brass)
    cylinder("lamp stem", (lamp_x, table_y, 0.8), 0.012, 0.25, brass)
    bpy.ops.mesh.primitive_cone_add(vertices=32, radius1=0.16, radius2=0.1, depth=0.2, location=(lamp_x, table_y, 0.98))
    shade = bpy.context.object
    shade.name = "lamp.shade"
    bpy.ops.object.shade_smooth()
    shade.data.materials.append(material("lamp shade", "#F1E2C0", 0.6))
    marker("lamp.light", (lamp_x, table_y, 0.95))
    marker("slot.side-table.0", (table_x + 0.11, table_y - 0.05, 0.6), zone="side-table", x=0.5)


# --- Bed, nightstand, corkboard --------------------------------------------------------------
def build_bed_side():
    x1 = ROOM_X[1]
    bed_y = (0.12, 1.12)
    frame = material("bed frame", WOOD_LIGHT, 0.55)
    box("headboard", (x1 - 0.08, x1), (bed_y[0] - 0.04, bed_y[1] + 0.04), (0, 1.0), frame, bevel=0.01)
    box("bed base", (0.3, x1 - 0.08), bed_y, (0.08, 0.35), frame, bevel=0.01)
    soft(box("mattress", (0.32, x1 - 0.1), (bed_y[0] + 0.02, bed_y[1] - 0.02), (0.35, 0.55), material("linen", LINEN, 0.9), bevel=0.04), levels=1)
    soft(box("blanket", (0.3, x1 - 0.7), (bed_y[0], bed_y[1]), (0.4, 0.58), material("blanket", BLANKET, 0.9), bevel=0.03), levels=1)
    soft(box("pillow", (x1 - 0.55, x1 - 0.14), (bed_y[0] + 0.12, bed_y[1] - 0.12), (0.55, 0.68), material("pillow linen", PAPER, 0.9), bevel=0.05))

    # nightstand in the back corner
    box("nightstand", (x1 - 0.42, x1 - 0.02), (1.3, 1.7), (0, 0.55), material("nightstand", WOOD, 0.5), bevel=0.01)
    box("nightstand drawer", (x1 - 0.43, x1 - 0.42), (1.36, 1.64), (0.32, 0.48), material("drawer", WOOD_LIGHT, 0.5))
    cylinder("nightstand mug", (x1 - 0.32, 1.42, 0.6), 0.04, 0.09, material("mug", "#D9C5AE", 0.4))
    marker("slot.nightstand.0", (x1 - 0.2, 1.55, 0.55), zone="nightstand", x=0.5)

    # corkboard above the bed, with pinned cards; the white one in front is the Quote of the Day
    board_y = (0.2, 1.05)
    box("corkboard frame", (x1 - 0.04, x1), (board_y[0] - 0.03, board_y[1] + 0.03), (1.17, 1.83), frame)
    box("corkboard", (x1 - 0.05, x1 - 0.04), board_y, (1.2, 1.8), material("cork", CORK, 0.95))
    pin = material("pin", "#B42318", 0.4)
    cards = [((0.28, 0.5), (1.52, 1.74), "#F3D7A6"), ((0.55, 0.76), (1.56, 1.74), "#D6E7D5"),
             ((0.8, 0.98), (1.5, 1.72), "#E8C6BC"), ((0.26, 0.46), (1.26, 1.44), "#E7DCC9")]
    for k, (cy, cz, colour) in enumerate(cards):
        card = box(f"cork card {k}", (x1 - 0.055, x1 - 0.05), cy, cz, material(f"card {k}", colour, 0.9))
        card.rotation_euler.x = math.radians((-1) ** k * 4)
        sphere(f"pin {k}", (x1 - 0.06, (cy[0] + cy[1]) / 2, cz[1] - 0.02), 0.012, pin)
    quote = box("quote card", (x1 - 0.06, x1 - 0.055), (0.55, 0.95), (1.24, 1.46), material("quote card", PAPER, 0.9))
    quote.rotation_euler.x = math.radians(-3)
    sphere("quote pin", (x1 - 0.065, 0.75, 1.44), 0.014, pin)
    hidden_box("hit.corkboard", (x1 - 0.1, x1), board_y, (1.2, 1.8))


# --- Front wall: door and clock --------------------------------------------------------------
def build_front_wall():
    y0 = ROOM_Y[0]
    box("door frame", (0.9, 1.9), (y0, y0 + 0.04), (0, 2.12), material("door frame", WOOD_LIGHT, 0.55))
    box("door", (0.96, 1.84), (y0 + 0.04, y0 + 0.06), (0, 2.06), material("door", "#D8C4AC", 0.6), bevel=0.005)
    for z in (0.35, 1.15):
        box(f"door panel {z}", (1.06, 1.74), (y0 + 0.06, y0 + 0.07), (z, z + 0.65), material("door panel", "#CFB89D", 0.6))
    sphere("door knob", (1.0, y0 + 0.1, 1.0), 0.03, material("brass", "#B8943F", 0.35))

    # the clock: rim, face and ticks here; the hands turn in the app
    cx, cy, cz = -0.9, y0 + 0.03, 1.95
    face_on = (math.pi / 2, 0, 0)
    cylinder("clock rim", (cx, cy, cz), 0.24, 0.05, material("clock rim", "#6B4A34", 0.5), face_on, vertices=48)
    cylinder("clock face", (cx, cy + 0.03, cz), 0.21, 0.01, material("clock face", PAPER, 0.6), face_on, vertices=48)
    ink = material("clock ink", "#3F2E24", 0.6)
    for k in range(12):
        length = 0.04 if k % 3 == 0 else 0.022
        mark = pivot_at_world_origin(box(f"clock tick {k}", (-0.006, 0.006), (0, 0.004), (0.18 - length, 0.18), ink))
        mark.location = (cx, cy + 0.036, cz)
        mark.rotation_euler.y = k * math.pi / 6
    # hands point to 12 at rest; their origin is the clock's centre
    for name, length, width, lift in (("clock.hour", 0.11, 0.014, 0.04), ("clock.minute", 0.17, 0.009, 0.045)):
        hand = pivot_at_world_origin(box(name, (-width / 2, width / 2), (0, 0.004), (-0.02, length), ink))
        hand.location = (cx, cy + lift, cz)
    cylinder("clock cap", (cx, cy + 0.05, cz), 0.012, 0.01, ink, face_on)
    hidden_box("hit.clock", (cx - 0.25, cx + 0.25), (y0, y0 + 0.1), (cz - 0.25, cz + 0.25))


# --- Floor: rug, decoration spots, where pets walk -------------------------------------------
def build_floor():
    rug = cylinder("rug", (0, -0.25, 0.006), 1.0, 0.012, material("rug", RUG, 0.95), vertices=64)
    rug.scale = (1.3, 0.85, 1)
    border = cylinder("rug border", (0, -0.25, 0.003), 1.06, 0.006, material("rug border", "#CFA596", 0.95), vertices=64)
    border.scale = (1.3, 0.85, 1)
    # floor decorations stand along the front of the rug, away from where the reader stands
    for k, (x, y) in enumerate([(-1.3, -1.3), (-0.6, -1.5), (0.4, -1.5), (1.4, -1.0)]):
        marker(f"slot.room.{k}", (x, y, 0), zone="room", x=round(0.15 + k * 0.18, 2))
    for k, (x, y) in enumerate([(-1.2, -0.6), (-0.4, -1.2), (0.6, -1.3), (1.2, -0.4), (0.9, 0.0), (-1.0, 0.4), (0.0, 1.2)]):
        marker(f"walk.{k}", (x, y, 0))


def build_camera():
    bpy.ops.object.camera_add(location=EYE)
    cam = bpy.context.object
    cam.name = "camera"
    # first view: the reading corner, bookcase on the left and the bay window on the right
    cam.rotation_euler = (math.radians(86), 0, math.radians(48))
    cam.data.sensor_fit = "VERTICAL"
    cam.data.sensor_height = 24
    cam.data.lens = 15.6  # about 75 degrees tall, the app's starting zoom
    bpy.context.scene.camera = cam


def build_lights():
    # daylight through the bay window
    bpy.ops.object.light_add(type="SUN", rotation=(math.radians(-55), 0, math.radians(15)))
    sun = bpy.context.object
    sun.name = "sun"
    sun.data.energy = 3.0
    sun.data.color = (1.0, 0.94, 0.82)
    sun.data.angle = math.radians(4)
    bpy.ops.object.light_add(type="POINT", location=(0, 0, 2.4))
    room = bpy.context.object
    room.name = "room light"
    room.data.energy = 220
    room.data.shadow_soft_size = 1.2
    room.data.color = (1.0, 0.92, 0.8)
    world = bpy.data.worlds.new("world")
    bpy.context.scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = hex_rgba("#F2E8DC")
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.5


def render_settings():
    scene = bpy.context.scene
    engines = {item.identifier for item in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items}
    scene.render.engine = "BLENDER_EEVEE" if "BLENDER_EEVEE" in engines else "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x = 1080
    scene.render.resolution_y = 1920
    scene.view_settings.view_transform = "Standard"
    eevee = scene.eevee
    for prop, value in (("use_shadows", True), ("use_raytracing", True), ("taa_render_samples", 64)):
        if hasattr(eevee, prop):
            setattr(eevee, prop, value)


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    build_shell()
    build_bay()
    build_reading_corner()
    build_bed_side()
    build_front_wall()
    build_floor()
    build_camera()
    build_lights()
    render_settings()
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, "room.blend"))


main()
