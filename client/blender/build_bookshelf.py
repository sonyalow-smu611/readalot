# Builds the bookcase designed in bookshelf.blend into room.blend, against the room's left wall,
# and saves room.blend. Run it after build_room.py (see README.md).
#
#   /Applications/Blender.app/Contents/MacOS/Blender -b client/blender/room.blend -P client/blender/build_bookshelf.py
#
# Ported from the procedural build code kept in bookshelf.blend (its "Text" text block): the same
# case of bevelled boards, and the same seeded book generator for the placeholder books, at a size
# that fits the room. The case is built facing -y about its own origin, then stood against the
# wall by its root, `bookshelf`. Re-running rebuilds only the "Bookshelf" collection.
#
# What the app looks for (see README.md):
#   shelf.<row>     one hidden box per row of books, row 0 at the top; the app stands the
#                   reader's books along it, facing out of the case whichever wall it is on
#   hit.bookshelf   the hidden box over the case that catches a tap on it
#   herobook        bookshelf.blend's hero book, copied with its cover and page animations: the
#                   app takes a copy of it off the shelf for the book the reader taps, and opens
#                   it. Parked outside the room and left out of the still picture
# Placeholder books are hidden in the viewport: they fill the still picture (render_room.py) but
# are left out of the export, where the reader's real books go instead.
import os
import random
from math import cos, radians, sin

import bmesh
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))

W, D, H = 1.52, 0.40, 2.16  # width, depth, height
T = 0.04  # board thickness
ROWS = 5

# Against the left wall (build_room.py: x = -2.2), facing into the room, slid towards the back
# left corner as far as the armchair there allows. A quarter turn faces the case's front (-y) +x.
WALL_X = -2.2
ALONG_Y = (-0.75, 0.77)
PLACE = (WALL_X + D / 2, (ALONG_Y[0] + ALONG_Y[1]) / 2, 0.0)
TURN = radians(90)

# the hero book, copied from bookshelf.blend under the names the app looks for
SOURCE = os.path.join(HERE, "bookshelf.blend")
HERO_NAMES = {
    "HeroBook": "herobook",
    "Hero_FrontCover": "herobook.cover.front",
    "Hero_BackCover": "herobook.cover.back",
    "Hero_Spine": "herobook.spine",
    "Hero_PageBlock": "herobook.pages",
    **{f"Hero_Page_{n}": f"herobook.page.{n}" for n in range(10)},
}
# the potted plant and the box that stood on top of the hand-remodelled bookcase, kept in
# furniture.blend
FURNITURE = os.path.join(HERE, "furniture.blend")
ON_TOP = ["case pot", "case leaf 0", "case leaf 1", "case leaf 2", "case leaf 3", "case leaf 4", "case box"]
# where that bookcase's middle stood (its front faced -y too), so they keep their places
REMODEL_CASE_MIDDLE = (-0.86, -0.22, 0.0)

# outside the room, beyond the front wall, where the camera never sees it
HERO_PARKED = (0.0, -6.0, 1.2)

random.seed(7)


def fresh_collection(name):
    old = bpy.data.collections.get(name)
    if old:
        for ob in list(old.objects):
            bpy.data.objects.remove(ob, do_unlink=True)
        bpy.data.collections.remove(old)
    col = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(col)
    return col


def sock(sockets, name, typ):
    return next(s for s in sockets if s.name == name and s.type == typ)


def ramp(nodes, stops, constant=True):
    r = nodes.new("ShaderNodeValToRGB")
    r.color_ramp.interpolation = "CONSTANT" if constant else "LINEAR"
    els = r.color_ramp.elements
    els[0].position, els[0].color = stops[0][0], (*stops[0][1], 1)
    els[1].position, els[1].color = stops[1][0], (*stops[1][1], 1)
    for pos, c in stops[2:]:
        els.new(pos).color = (*c, 1)
    return r


def flat_mat(name, color, roughness):
    """A plain colour: what the app gets (glTF carries no procedural textures)."""
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Roughness"].default_value = roughness
    return m


def book_mat():
    """bookshelf.blend's leather: one material for every placeholder book, its colour picked per
    object via Object Info > Random, gold spine bands via Generated Z. Only in the still picture."""
    old = bpy.data.materials.get("BookLeather")
    if old:
        bpy.data.materials.remove(old)
    m = bpy.data.materials.new("BookLeather")
    m.use_nodes = True
    n, l = m.node_tree.nodes, m.node_tree.links
    bsdf = n["Principled BSDF"]
    palette = [(0.04, 0.11, 0.10), (0.03, 0.07, 0.09), (0.16, 0.07, 0.03), (0.32, 0.19, 0.09),
               (0.20, 0.03, 0.03), (0.05, 0.09, 0.04), (0.14, 0.12, 0.06), (0.03, 0.05, 0.10)]
    info = n.new("ShaderNodeObjectInfo")
    pal = ramp(n, [(i / len(palette), c) for i, c in enumerate(palette)])
    l.new(info.outputs["Random"], pal.inputs["Fac"])

    tc, sep = n.new("ShaderNodeTexCoord"), n.new("ShaderNodeSeparateXYZ")
    bands = ramp(n, [(0, (0, 0, 0)), (0.06, (1, 1, 1)), (0.09, (0, 0, 0)),
                     (0.12, (1, 1, 1)), (0.13, (0, 0, 0)), (0.86, (1, 1, 1)),
                     (0.87, (0, 0, 0)), (0.90, (1, 1, 1)), (0.93, (0, 0, 0))])
    l.new(tc.outputs["Generated"], sep.inputs["Vector"])
    l.new(sep.outputs["Z"], bands.inputs["Fac"])

    mix = n.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    sock(mix.inputs, "B", "RGBA").default_value = (0.55, 0.36, 0.1, 1)  # gold
    l.new(bands.outputs["Color"], mix.inputs["Factor"])
    l.new(pal.outputs["Color"], sock(mix.inputs, "A", "RGBA"))
    l.new(sock(mix.outputs, "Result", "RGBA"), bsdf.inputs["Base Color"])
    l.new(bands.outputs["Color"], bsdf.inputs["Metallic"])
    bsdf.inputs["Roughness"].default_value = 0.6

    noise, bump = n.new("ShaderNodeTexNoise"), n.new("ShaderNodeBump")
    noise.inputs["Scale"].default_value = 300
    bump.inputs["Strength"].default_value = 0.12
    l.new(noise.outputs["Fac"], bump.inputs["Height"])
    l.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    return m


def box(col, name, loc, dims, mat, rot=(0, 0, 0), bevel=0.004, parent=None):
    """bookshelf.blend's box: `loc` is the centre, in the case's own frame (x across, y from
    front to back, z up from the floor). Parented to the case's root, which stands it in the
    room."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= dims[0]
        v.co.y *= dims[1]
        v.co.z *= dims[2]
    bm.to_mesh(me)
    bm.free()
    if mat:
        me.materials.append(mat)
    ob = bpy.data.objects.new(name, me)
    ob.location = loc
    ob.rotation_euler = rot
    ob.parent = parent
    col.objects.link(ob)
    if bevel:
        b = ob.modifiers.new("Bevel", "BEVEL")
        b.width = bevel
        b.segments = 2
    return ob


def hidden_box(col, name, loc, dims, parent):
    """A box only the app uses, to find where things are; never drawn."""
    ob = box(col, name, loc, dims, None, bevel=0, parent=parent)
    ob.display_type = "WIRE"
    ob.hide_render = True
    return ob


def copy_hero(col):
    """bookshelf.blend's hero book: its covers and pages, and the actions that open the cover and
    flip the pages. Not the action that flies it off the shelf: the app works that out for
    whichever book was tapped."""
    with bpy.data.libraries.load(SOURCE, link=False) as (source, copied):
        copied.objects = [name for name in source.objects if name in HERO_NAMES]
    for ob in copied.objects:
        ob.name = HERO_NAMES[ob.name.split(".")[0]]
        col.objects.link(ob)
        ob.hide_render = True
    root = bpy.data.objects["herobook"]
    root.animation_data_clear()
    root.location = HERO_PARKED
    root.rotation_euler = (0, 0, 0)


def copy_on_top(col, root):
    with bpy.data.libraries.load(FURNITURE, link=False) as (source, copied):
        copied.objects = [name for name in source.objects if name in ON_TOP]
    for ob in copied.objects:
        col.objects.link(ob)
        ob.location = [a - b for a, b in zip(ob.location, REMODEL_CASE_MIDDLE)]
        ob.parent = root


def build():
    col = fresh_collection("Bookshelf")
    wood = flat_mat("bookshelf wood", (0.06, 0.03, 0.014), 0.55)
    leather = book_mat()

    # the case's root, stood against the wall; everything else is placed in its frame
    root = bpy.data.objects.new("bookshelf", None)
    root.location = PLACE
    root.rotation_euler = (0, 0, TURN)
    col.objects.link(root)

    # --- case ---
    box(col, "case side left", (-W / 2 + T / 2, 0, H / 2), (T, D, H), wood, parent=root)
    box(col, "case side right", (W / 2 - T / 2, 0, H / 2), (T, D, H), wood, parent=root)
    box(col, "case back", (0, D / 2 - 0.01, H / 2), (W, 0.02, H), wood, parent=root)
    gap = (H - T * (ROWS + 1)) / ROWS
    floors = [T / 2 + i * (gap + T) for i in range(ROWS + 1)]
    for i, z in enumerate(floors):
        box(col, f"case shelf {i}", (0, 0, z), (W - 2 * T, D, T), wood, parent=root)

    # --- where the app stands the reader's books (row 0 at the top), and the tap target ---
    for row in range(ROWS):
        z0 = floors[ROWS - 1 - row] + T / 2
        hidden_box(col, f"shelf.{row}", (0, -0.01, z0 + gap / 2), (W - 2 * T - 0.02, D - 0.04, gap), root)
    hidden_box(col, "hit.bookshelf", (0, -0.01, H / 2), (W, D + 0.02, H), root)

    # --- placeholder books, for the still picture only ---
    front = -D / 2 + 0.02
    books = []

    def book(loc, dims, rot=(0, 0, 0)):
        ob = box(col, f"placeholder book {len(books)}", loc, dims, leather, rot=rot, parent=root)
        books.append(ob)

    for row in range(ROWS):
        z0 = floors[row] + T / 2
        x, x_end = -W / 2 + T + 0.01, W / 2 - T - 0.01
        while x < x_end - 0.08:
            r = random.random()
            if r < 0.08 and x_end - x > 0.35:  # horizontal stack
                z = z0
                for _ in range(random.randint(3, 6)):
                    th, ln, dp = random.uniform(.03, .05), random.uniform(.22, .3), random.uniform(.2, .28)
                    book((x + 0.16, front + dp / 2, z + th / 2), (ln, dp, th), rot=(0, 0, radians(random.uniform(-4, 4))))
                    z += th
                x += 0.34
            elif r < 0.14:  # leaning book
                w, h, dp = random.uniform(.035, .06), gap * random.uniform(.7, .85), random.uniform(.22, .3)
                a = radians(random.uniform(12, 22))
                span = h * sin(a) + w * cos(a)
                book((x + span / 2, front + dp / 2, z0 + (h * cos(a) + w * sin(a)) / 2), (w, dp, h), rot=(0, -a, 0))
                x += span + 0.01
            else:  # upright book
                w, h, dp = random.uniform(.03, .08), gap * random.uniform(.62, .93), random.uniform(.22, .31)
                if x + w > x_end:
                    break
                book((x + w / 2, front + dp / 2, z0 + h / 2), (w, dp, h))
                x += w + random.uniform(0, .004)

    # hidden in the viewport, so the export (visible objects only) leaves them out
    for ob in books:
        ob.hide_set(True)

    copy_on_top(col, root)
    copy_hero(col)
    return len(books)


count = build()
assert count > 50, f"only {count} placeholder books"
bpy.ops.wm.save_mainfile()
print({"placeholder_books": count})
