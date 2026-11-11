"""
Maker Student - imagenes de la unidad "Seguridad, herramientas y metodo".

Uso (desde la raiz del repo):
  blender -b --factory-startup --python tools/blender/maker_u_seg.py -- [banco|herr|metodo|all] [nombre_imagen ...]

Cada imagen es una funcion que construye la escena, la renderiza a
public/assets/img/seg/<nombre>.webp y la limpia. Las herramientas (gafas, bandeja,
calibre, cuter, regla, mano, cuaderno, prototipo de carton...) son formas genericas
definidas aqui con primitivas.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from maker_lib import *

OUT = os.path.join(ROOT, "public", "assets", "img", "seg")
args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else ["all"]
GROUP = args[0] if args else "all"
ONLY = set(args[1:])
W, H = 1280, 720
SAMPLES = int(os.environ.get("MAKER_SAMPLES", 40))  # MAKER_SAMPLES=16 para pruebas rapidas

COLORS.update({
    "mesa": "#6a5845", "carton": "#b98a55", "piel": "#d9a37c", "papel": "#ecebe4",
    "tapete": "#2c6e49", "lente": "#bfe6ff", "taza": "#c0453a", "marco": "#e9edf5",
})

KEEP = set()
IMAGES = {}


def image(group, name):
    def deco(fn):
        IMAGES[name] = (group, fn)
        return fn
    return deco


def begin():
    reset()
    studio(floor_z=-0.62, size=300)
    eevee(SAMPLES)
    bpy.context.scene.eevee.use_raytracing = False  # mucho mas rapido y suficiente para estas escenas
    KEEP.clear()
    KEEP.update(o.name for o in bpy.data.objects)


def purge():
    for o in list(bpy.data.objects):
        if o.name not in KEEP:
            bpy.data.objects.remove(o, do_unlink=True)
    for coll in (bpy.data.curves, bpy.data.cameras):
        for d in list(coll):
            if d.users == 0:
                coll.remove(d)


class Parts:
    def __init__(self):
        self.items = []

    def add(self, o, color, stage=1):
        for x in (o if isinstance(o, (list, tuple)) else [o]):
            self.items.append((x, color, stage))
        return o

    @staticmethod
    def _lens(o):
        return bool(o.data.materials) and o.data.materials[0] is not None and o.data.materials[0].name == "lente"

    def show(self, k):
        for o, color, stage in self.items:
            if self._lens(o):
                if stage > k:
                    o.hide_render = True
                continue
            if stage > k:
                o.hide_render = True
                o.hide_viewport = True
            else:
                set_mat(o, color if stage == k else "ghost")

    def full(self):
        for o, color, stage in self.items:
            if not self._lens(o):
                set_mat(o, color)


# ---------------------------------------------------------------- primitivas

def _fin(o, color, bevel):
    o.data.materials.append(M(color))
    if bevel:
        b = o.modifiers.new("Bisel", "BEVEL")
        b.width = bevel
        b.segments = 2
        b.limit_method = "ANGLE"
        b.angle_limit = math.radians(40)
    return o


def box(sx, sy, sz, loc, color, bevel=0.04, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.active_object
    o.scale = (sx, sy, sz)
    bpy.ops.object.transform_apply(scale=True)
    o.rotation_euler = rot
    return _fin(o, color, min(bevel, sx / 3, sy / 3, sz / 3))


def cyl(r, depth, loc, color, rot=(0, 0, 0), seg=28, bevel=0.03):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=depth, location=loc, vertices=seg)
    o = bpy.context.active_object
    o.rotation_euler = rot
    for p in o.data.polygons:
        p.use_smooth = abs(p.normal.z) < 0.5
    return _fin(o, color, bevel)


def cone(r, depth, loc, color, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cone_add(radius1=r, radius2=0, depth=depth, location=loc, vertices=24)
    o = bpy.context.active_object
    o.rotation_euler = rot
    return _fin(o, color, 0)


def ball(r, loc, color):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=24, ring_count=14)
    o = bpy.context.active_object
    for p in o.data.polygons:
        p.use_smooth = True
    return _fin(o, color, 0)


def torus(R, r, loc, color, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, location=loc, major_segments=40, minor_segments=14)
    o = bpy.context.active_object
    o.rotation_euler = rot
    for p in o.data.polygons:
        p.use_smooth = True
    return _fin(o, color, 0)


def lay(o, x, y, z, rz=0.0):
    """Pieza con eje Z (viga, engranaje, tope) tumbada en el plano de la mesa."""
    o.location = (x, y, z)
    o.rotation_euler = (0, 0, rz)
    return o


def lay_axis(o, x, y, z, rz=0.0):
    """Pieza larga con eje Z (pin, eje) tumbada a lo largo del eje X girada rz."""
    o.matrix_world = Matrix.Translation((x, y, z)) @ Matrix.Rotation(rz, 4, "Z") @ Matrix.Rotation(math.pi / 2, 4, "Y")
    return o


def table(w=36, d=20, color="mesa"):
    return box(w, d, 0.6, (0, 0, -0.3), color, bevel=0.05)


def tray(cx, cy, w, d, h=0.9, color="azul"):
    os_ = [box(w, d, 0.15, (cx, cy, 0.075), color)]
    t = 0.2
    os_.append(box(w, t, h, (cx, cy - d / 2 + t / 2, h / 2), color))
    os_.append(box(w, t, h, (cx, cy + d / 2 - t / 2, h / 2), color))
    os_.append(box(t, d, h, (cx - w / 2 + t / 2, cy, h / 2), color))
    os_.append(box(t, d, h, (cx + w / 2 - t / 2, cy, h / 2), color))
    return os_


def lens_mat():
    m = bpy.data.materials.get("lente")
    if m:
        return m
    m = bpy.data.materials.new("lente")
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*hexc("#bfe6ff"), 1)
    b.inputs["Alpha"].default_value = 0.35
    b.inputs["Roughness"].default_value = 0.05
    try:
        m.surface_render_method = "BLENDED"
    except Exception:
        pass
    m.diffuse_color = (*hexc("#bfe6ff"), 0.4)
    return m


def glasses(cx, cy, z, standing=False, scale=1.0):
    """Gafas de proteccion. Tumbadas (por defecto) o de pie mirando a la camara (standing)."""
    objs = []
    R = 1.5 * scale
    if standing:
        for s in (-1, 1):
            objs.append(torus(R, 0.16 * scale, (cx + s * (R + 0.15), cy, z), "marco", rot=(math.pi / 2, 0, 0)))
            lens = cyl(R, 0.08, (cx + s * (R + 0.15), cy, z), "lente", rot=(math.pi / 2, 0, 0), bevel=0)
            lens.data.materials.clear(); lens.data.materials.append(lens_mat())
            objs.append(lens)
            objs.append(box(0.3, 2.4 * scale, 0.3, (cx + s * (2 * R + 0.3), cy + 1.1 * scale, z), "marco"))
        objs.append(box(0.5, 0.2, 0.2, (cx, cy, z + 0.2), "marco"))
    else:
        for s in (-1, 1):
            objs.append(torus(R, 0.16 * scale, (cx + s * (R + 0.15), cy, z + 0.2), "marco"))
            lens = cyl(R, 0.08, (cx + s * (R + 0.15), cy, z + 0.2), "lente", bevel=0)
            lens.data.materials.clear(); lens.data.materials.append(lens_mat())
            objs.append(lens)
            objs.append(box(0.3, 2.6 * scale, 0.3, (cx + s * (2 * R + 0.3), cy + 1.5 * scale, z + 0.2), "marco"))
        objs.append(box(0.5, 0.25, 0.25, (cx, cy, z + 0.2), "marco"))
    return objs


def hand(x, y, z, rz=0.0):
    """Mano plana y sencilla (palma + 4 dedos + pulgar), apoyada en z."""
    parts = [box(2.4, 2.6, 0.7, (0, 0, 0.35), "piel", bevel=0.2)]
    for i in range(4):
        parts.append(box(0.5, 1.8, 0.5, (-0.9 + i * 0.6, 2.1, 0.25), "piel", bevel=0.2))
    parts.append(box(0.55, 1.4, 0.5, (1.5, 0.9, 0.25), "piel", bevel=0.2, rot=(0, 0, -0.7)))
    R = Matrix.Translation((x, y, z)) @ Matrix.Rotation(rz, 4, "Z")
    for p in parts:
        p.matrix_world = R @ p.matrix_world
    return parts


def cutter(x, y, z, rz=0.0, ext=1.0):
    """Cuter: mango amarillo y cuchilla que apunta a +X (rz gira todo)."""
    h = box(4.2, 1.1, 0.7, (0, 0, 0.35), "amarillo", bevel=0.12)
    nose = box(1.0, 0.9, 0.55, (2.6, 0, 0.3), "oscuro", bevel=0.08)
    blade = box(1.4 * ext, 0.08, 0.5, (3.1 + 0.6 * ext, 0, 0.36), "eje", bevel=0.01)
    R = Matrix.Translation((x, y, z)) @ Matrix.Rotation(rz, 4, "Z")
    for p in (h, nose, blade):
        p.matrix_world = R @ p.matrix_world
    return [h, nose, blade]


def ruler(x, y, z, length=12.0, rz=0.0, color="gris"):
    r = box(length, 1.5, 0.22, (0, 0, 0.11), color, bevel=0.02)
    parts = [r]
    for i in range(int(length)):
        parts.append(box(0.06, 0.5 if i % 2 == 0 else 0.3, 0.04, (-length / 2 + 0.5 + i, -0.5, 0.23), "oscuro", bevel=0))
    R = Matrix.Translation((x, y, z)) @ Matrix.Rotation(rz, 4, "Z")
    for p in parts:
        p.matrix_world = R @ p.matrix_world
    return parts


def screwdriver(x, y, z, rz=0.0):
    hd = cyl(0.65, 3.2, (0, 0, 0.65), "rojo", rot=(0, math.pi / 2, 0), bevel=0.1)
    hd.location.x = -1.6
    sh = cyl(0.14, 4.0, (3.0, 0, 0.65), "eje", rot=(0, math.pi / 2, 0), bevel=0.0)
    tip = box(0.5, 0.05, 0.4, (5.15, 0, 0.65), "eje", bevel=0.0)
    R = Matrix.Translation((x, y, z)) @ Matrix.Rotation(rz, 4, "Z")
    for p in (hd, sh, tip):
        p.matrix_world = R @ p.matrix_world
    return [hd, sh, tip]


def scissors(x, y, z, rz=0.0):
    b1 = box(5.5, 0.3, 0.2, (2.6, 0.35, 0.3), "eje", bevel=0.02, rot=(0, 0, 0.09))
    b2 = box(5.5, 0.3, 0.2, (2.6, -0.35, 0.5), "eje", bevel=0.02, rot=(0, 0, -0.09))
    r1 = torus(0.75, 0.15, (-1.6, 1.0, 0.3), "azul")
    r2 = torus(0.75, 0.15, (-1.6, -1.0, 0.5), "azul")
    h1 = box(2.0, 0.3, 0.2, (-0.4, 0.45, 0.3), "azul", bevel=0.02, rot=(0, 0, 0.35))
    h2 = box(2.0, 0.3, 0.2, (-0.4, -0.45, 0.5), "azul", bevel=0.02, rot=(0, 0, -0.35))
    R = Matrix.Translation((x, y, z)) @ Matrix.Rotation(rz, 4, "Z")
    for p in (b1, b2, r1, r2, h1, h2):
        p.matrix_world = R @ p.matrix_world
    return [b1, b2, r1, r2, h1, h2]


def caliper(x, y, z, gap=0.52, rz=0.0):
    """Calibre tumbado: regla con mordaza fija a la izquierda y corredera con mordaza movil. Mide `gap` entre mordazas."""
    parts = [box(16, 1.3, 0.25, (8, 0, 0.125), "eje", bevel=0.02)]
    parts.append(box(0.5, 4.2, 0.25, (-0.25, 1.45, 0.125), "eje", bevel=0.02))  # mordaza fija
    parts.append(box(3.2, 2.0, 0.5, (gap + 0.25 + 1.6 - 0.25 + 0.0, 0.2, 0.35), "rojo", bevel=0.1))  # corredera
    parts.append(box(0.5, 4.2, 0.25, (gap + 0.25, 1.45, 0.125 + 0.25), "eje", bevel=0.02))  # mordaza movil
    for i in range(0, 15):
        parts.append(box(0.05, 0.45 if i % 5 else 0.7, 0.04, (4.8 + i, -0.45, 0.26), "oscuro", bevel=0))
    R = Matrix.Translation((x, y, z)) @ Matrix.Rotation(rz, 4, "Z")
    for p in parts:
        p.matrix_world = R @ p.matrix_world
    return parts


# ---------------------------------------------------------------- escena de mesa

def desk_cam(cx=0.0, cy=0.0, dist=21, height=15, lens=50, tz=0.5):
    camera((cx + 2.0, cy - dist, height), (cx, cy, tz), lens)


def marker(x, y, z, color, r=0.3):
    return ball(r, (x, y, z), color)


def scatter_pieces(P, stage, spots):
    """Piezas sueltas por la mesa (desorden)."""
    k = 0
    for (x, y, rz) in spots:
        kind = k % 4
        if kind == 0:
            o = lay(beam(5 + (k % 3), ("amarillo", "azul", "rojo")[k % 3]), x, y, 0.4875, rz)
        elif kind == 1:
            o = lay_axis(pin(2.2), x, y, 0.285, rz)
        elif kind == 2:
            o = lay(gear(16 if k % 2 else 8, "gris"), x, y, 0.25, rz)
        else:
            o = lay_axis(axle(4.0), x, y, 0.24, rz)
        P.add(o, ("amarillo", "azul", "rojo")[k % 3] if kind == 0 else ("oscuro" if kind == 1 else ("gris" if kind == 2 else "eje")), stage)
        k += 1


def pieces_in_tray(P, stage, cx, cy):
    o = lay(beam(7, "amarillo"), cx - 5.0, cy + 1.8, 0.15 + 0.4875, 0.0); P.add(o, "amarillo", stage)
    o = lay(beam(5, "azul"), cx - 3.5, cy + 0.2, 0.15 + 0.4875, 0.0); P.add(o, "azul", stage)
    o = lay(beam(3, "rojo"), cx - 2.0, cy - 1.4, 0.15 + 0.4875, 0.0); P.add(o, "rojo", stage)
    for i, (dx, dy) in enumerate(((2.5, 1.8), (2.8, 0.7), (3.1, -0.4))):
        o = lay_axis(pin(2.2), cx + dx, cy + dy, 0.15 + 0.285, 0.0); P.add(o, "oscuro", stage)
    o = lay(gear(16, "gris"), cx + 5.0, cy - 1.6, 0.15 + 0.25, 0.0); P.add(o, "gris", stage)
    o = lay_axis(axle(4.0), cx + 3.0, cy - 2.6, 0.15 + 0.24, 0.1); P.add(o, "eje", stage)


def lamp(P, stage, x, y):
    P.add(cyl(1.3, 0.35, (x, y, 0.175), "oscuro", bevel=0.05), "oscuro", stage)
    P.add(cyl(0.16, 7.0, (x, y, 3.8), "gris", bevel=0.0), "gris", stage)
    P.add(cyl(0.16, 4.5, (x + 1.6, y + 0.5, 7.4), "gris", rot=(0, math.pi / 2 - 0.35, 0), bevel=0.0), "gris", stage)
    P.add(cone(1.5, 1.9, (x + 3.3, y + 0.9, 6.5), "amarillo", rot=(math.pi, 0, 0)), "amarillo", stage)


def build_bench(stage_tray=3):
    P = Parts()
    P.add(table(), "mesa", 1)
    P.add(box(14, 9, 0.12, (0, 0.5, 0.06), "tapete", bevel=0.03), "tapete", 1)
    lamp(P, 2, -11.5, 4.5)
    P.add(tray(0, 0.5, 12.5, 7.0), "azul", 3)
    pieces_in_tray(P, 3, 0, 0.5)
    P.add(glasses(9.6, -3.4, 0.0, scale=0.9), "marco", 4)
    return P


@image("banco", "b_hero")
def b_hero():
    P = build_bench(); P.full()
    for o in [o for o, c, s in P.items if c == "lente"]:
        pass
    desk_cam(-1, 0.0, 30, 20, lens=38)
    render(f"{OUT}/b_hero.webp", W, H)


def _step_bench(k, name):
    P = build_bench(); P.show(k)
    desk_cam(-1, 0.0, 30, 20, lens=38)
    render(f"{OUT}/{name}.webp", W, H)


@image("banco", "b_s1")
def b_s1():
    _step_bench(1, "b_s1")


@image("banco", "b_s2")
def b_s2():
    _step_bench(2, "b_s2")


@image("banco", "b_s3")
def b_s3():
    _step_bench(3, "b_s3")


@image("banco", "b_s4")
def b_s4():
    _step_bench(4, "b_s4")


@image("banco", "b_salto")
def b_salto():
    """Una pieza sale disparada hacia los ojos: las gafas la paran."""
    P = Parts()
    P.add(table(), "mesa", 1)
    P.add(glasses(0.0, 2.0, 2.2, standing=True, scale=1.0), "marco", 1)
    pn = lay_axis(pin(2.2), -9.0, 2.0, 3.4, 0.0)
    pn.rotation_mode = "XYZ"
    pn.matrix_world = Matrix.Translation((-8.0, 2.0, 3.6)) @ Matrix.Rotation(0.4, 4, "Z") @ Matrix.Rotation(math.pi / 2, 4, "Y")
    P.add(pn, "oscuro", 1)
    for sx in (-1.65, 1.65):
        P.add(box(0.8, 0.8, 0.8, (sx, 2.0, 0.4), "oscuro", bevel=0.05), "oscuro", 1)
    P.full()
    arrow((-11.5, 2.0, 3.0), (-5.2, 2.0, 3.0), "mal", r=0.1, head=0.5)
    camera((-3.0, -22.0, 9.0), (-3.5, 2.0, 2.8), 50)
    render(f"{OUT}/b_salto.webp", W, H)


def _clutter(tidy):
    P = Parts()
    P.add(table(), "mesa", 1)
    if tidy:
        P.add(tray(0, 0.5, 12.5, 7.0), "azul", 1)
        pieces_in_tray(P, 1, 0, 0.5)
        P.add(cyl(1.1, 2.6, (16.0, 7.0, 1.3), "taza"), "taza", 1)  # la taza, lejos y en su sitio
        P.add(box(3.0, 6.0, 0.35, (-16.5, 6.0, 0.175), "oscuro", bevel=0.1), "oscuro", 1)
    else:
        P.add(cyl(1.1, 2.6, (-2.5, 1.0, 1.3), "taza"), "taza", 1)
        P.add(box(3.0, 6.0, 0.35, (3.5, -1.0, 0.175), "oscuro", bevel=0.1, rot=(0, 0, 0.5)), "oscuro", 1)
        P.add(box(2.6, 5.4, 0.05, (3.5, -1.0, 0.37), "azul", bevel=0.0, rot=(0, 0, 0.5)), "azul", 1)
        scatter_pieces(P, 1, [(-9, 3, 0.4), (-6, -3, 2.1), (-0.5, -4, 1.0), (7, 4, 0.2), (9, -3.5, 2.6),
                              (-12, -1, 0.9), (5.5, 1.5, 1.4), (-4, 4.5, 3.0), (11, 1, 0.1), (1.5, 3.8, 0.7)])
    P.full()
    return P


@image("banco", "b_error_mal")
def b_error_mal():
    _clutter(False)
    for (x, y) in ((-2.5, 1.0), (3.5, -1.0)):
        arrow((x, y, 5.2), (x, y, 3.6), "mal", r=0.09, head=0.45)
    desk_cam(0, 0, 23, 15)
    render(f"{OUT}/b_error_mal.webp", W, H)


@image("banco", "b_error_bien")
def b_error_bien():
    _clutter(True)
    arrow((0, 0.5, 5.2), (0, 0.5, 2.6), "bien", r=0.09, head=0.45)
    desk_cam(0, 0, 23, 15)
    render(f"{OUT}/b_error_bien.webp", W, H)


# ---------------------------------------------------------------- HERRAMIENTAS

def build_tools():
    P = Parts()
    P.add(table(), "mesa", 1)
    P.add(box(22, 12, 0.12, (0, 0, 0.06), "tapete", bevel=0.03), "tapete", 1)
    for o in caliper(-9.5, -3.2, 0.12, rz=0.0):
        P.add(o, "eje", 1)
    for o in screwdriver(-9.0, 2.2, 0.12, rz=0.15):
        P.add(o, "eje", 1)
    for o in cutter(3.0, -3.0, 0.12, rz=0.25):
        P.add(o, "amarillo", 1)
    for o in scissors(2.0, 2.4, 0.12, rz=0.1):
        P.add(o, "eje", 1)
    return P


@image("herr", "h_hero")
def h_hero():
    reset_tools = None
    # colores por pieza (calibre rojo/gris, destornillador rojo, cuter amarillo, tijeras azul)
    base = Parts()
    base.add(table(), "mesa", 1)
    base.add(box(22, 12, 0.12, (0, 0, 0.06), "tapete", bevel=0.03), "tapete", 1)
    caliper(-9.5, -3.2, 0.12)
    screwdriver(-9.0, 2.2, 0.12, rz=0.15)
    cutter(3.0, -3.0, 0.12, rz=0.25)
    scissors(2.0, 2.4, 0.12, rz=0.1)
    desk_cam(-1, 0, 22, 14)
    render(f"{OUT}/h_hero.webp", W, H)


@image("herr", "h_calibre")
def h_calibre():
    """El calibre abraza un eje: lee el grosor con precision de decimas de milimetro."""
    P = Parts()
    P.add(table(), "mesa", 1)
    caliper(-3.0, -1.5, 0.0, gap=0.52)
    # eje de pie entre las mordazas: la mordaza fija esta en x=-3, el eje en su cara interior
    ax = axle(3.0)
    ax.location = (-3.0 + 0.26 + 0.0, -1.5 + 1.45 + 0.5, 1.5)
    arrow((-3.0 + 0.26, -1.5 + 4.2, 3.6), (-3.0 + 0.26, -1.5 + 3.3, 3.6), "acento", r=0.07, head=0.3)
    desk_cam(0.5, 0.0, 12, 9, tz=0.3)
    camera((0.0, -10.0, 8.0), (-1.4, 0.0, 0.6), 50)
    render(f"{OUT}/h_calibre.webp", W, H)


# corte de carton seguro
def build_cut(stage_max=4):
    P = Parts()
    P.add(table(), "mesa", 1)
    P.add(box(15, 9, 0.2, (0, 0.5, 0.1), "tapete", bevel=0.04), "tapete", 1)
    P.add(box(11, 6, 0.3, (0, 0.5, 0.35), "carton", bevel=0.05), "carton", 1)
    P.add(box(10.6, 0.08, 0.04, (0, 0.5, 0.52), "oscuro", bevel=0), "oscuro", 2)
    P.add(ruler(0, 0.5 - 0.75, 0.5, 12.0), "gris", 2)
    return P


def cut_cam():
    camera((3.0, -17.0, 13.0), (0.0, 0.8, 0.3), 50)


@image("herr", "h_s1")
def h_s1():
    P = build_cut(); P.show(1); cut_cam(); render(f"{OUT}/h_s1.webp", W, H)


@image("herr", "h_s2")
def h_s2():
    P = build_cut(); P.show(2); cut_cam(); render(f"{OUT}/h_s2.webp", W, H)


def _cut_full(extra_stage):
    P = build_cut()
    # mano libre apoyada en la regla, lejos de la linea de corte
    for o in hand(-3.2, -3.2, 0.72, rz=0.0):
        P.add(o, "piel", 3)
    cut_parts = cutter(2.0, 0.5, 0.52, rz=0.0)
    for o in cut_parts:
        P.add(o, "amarillo", 3)
    return P


@image("herr", "h_s3")
def h_s3():
    P = build_cut()
    for o in hand(-3.0, -3.0, 0.72, rz=0.0):
        P.add(o, "piel", 3)
    for o in cutter(1.0, 0.5, 0.5, rz=0.0):
        P.add(o, "amarillo", 3)
    P.show(3)
    arrow((-3.5, 1.9, 1.0), (-0.5, 1.9, 1.0), "cian", r=0.07, head=0.35)
    arrow((-3.5, 2.8, 1.0), (-0.5, 2.8, 1.0), "cian", r=0.07, head=0.35)
    cut_cam(); render(f"{OUT}/h_s3.webp", W, H)


@image("herr", "h_s4")
def h_s4():
    P = build_cut()
    for o in cutter(7.0, -5.5, 0.12, rz=0.2, ext=0.0):
        P.add(o, "amarillo", 4)
    # cartón ya cortado: dos mitades separadas
    P.show(4)
    cut_cam(); render(f"{OUT}/h_s4.webp", W, H)


@image("herr", "h_error_mal")
def h_error_mal():
    """Mal: sin regla, sin tabla y la mano justo delante de la cuchilla."""
    P = Parts()
    P.add(table(), "mesa", 1)
    P.add(box(11, 6, 0.3, (0, 0.5, 0.15), "carton", bevel=0.05), "carton", 1)
    P.add(box(10.6, 0.08, 0.04, (0, 0.5, 0.32), "oscuro", bevel=0), "oscuro", 1)
    for o in hand(4.5, 0.5, 0.32, rz=-math.pi / 2):
        P.add(o, "piel", 1)
    for o in cutter(-1.0, 0.5, 0.32, rz=0.0):
        P.add(o, "amarillo", 1)
    P.full()
    arrow((1.8, 1.9, 1.2), (3.4, 1.9, 1.2), "mal", r=0.09, head=0.4)
    cut_cam(); render(f"{OUT}/h_error_mal.webp", W, H)


@image("herr", "h_error_bien")
def h_error_bien():
    P = build_cut()
    for o in hand(-3.0, -3.0, 0.72, rz=0.0):
        P.add(o, "piel", 3)
    for o in cutter(1.0, 0.5, 0.5, rz=0.0):
        P.add(o, "amarillo", 3)
    P.full()
    arrow((1.8, 2.0, 1.3), (4.4, 2.0, 1.3), "bien", r=0.09, head=0.4)
    cut_cam(); render(f"{OUT}/h_error_bien.webp", W, H)


# ---------------------------------------------------------------- METODO

def proto(pivot_x=0.0, load_x=-4.0, hand_x=4.0, tilt=0.0, parts=None, stage=1):
    """Palanca de carton: base, apoyo en rombo, viga y un peso. Plano XZ (camara en -Y)."""
    P = parts or Parts()
    P.add(box(16, 5, 0.3, (0, 0, 0.15), "carton", bevel=0.04), "carton", stage)
    ful = box(2.6, 3.0, 2.6, (pivot_x, 0, 0.3 + 0.0), "carton", bevel=0.05, rot=(0, math.pi / 4, 0))
    ful.location = (pivot_x, 0, 0.3 + 0.0)
    P.add(ful, "carton", stage)
    top = 0.3 + 1.84
    bm = box(11, 1.4, 0.3, (0, 0, top + 0.15), "carton", bevel=0.04)
    wt = box(1.6, 1.6, 1.6, (load_x, 0, top + 0.3 + 0.8), "verde", bevel=0.06)
    pin_ = cyl(0.3, 1.8, (pivot_x, 0, top + 0.15), "oscuro", rot=(math.pi / 2, 0, 0), bevel=0.02)
    P.add([bm, wt, pin_], "carton", stage)
    P.items[-3] = (bm, "carton", stage)
    P.items[-2] = (wt, "verde", stage)
    P.items[-1] = (pin_, "oscuro", stage)
    if tilt:
        group_rotate([bm, wt], (pivot_x, top + 0.15), tilt)
    return P


def notebook(P, stage, x=-8.0, y=-1.0):
    P.add(box(5.0, 7.0, 0.35, (x, y, 0.175), "papel", bevel=0.05, rot=(0, 0, 0.12)), "papel", stage)
    for i in range(5):
        ln = box(3.2, 0.1, 0.03, (x, y - 2.4 + i * 1.1, 0.37), "oscuro", bevel=0, rot=(0, 0, 0.12))
        P.add(ln, "oscuro", stage)
    pc = cyl(0.18, 4.6, (x + 3.8, y - 2.0, 0.25), "amarillo", rot=(0, math.pi / 2, 0.8), bevel=0.0)
    P.add(pc, "amarillo", stage)


def meth_cam():
    camera((1.0, -19.0, 8.5), (-0.5, 0, 2.2), 50)


def build_meth(stage_max=4):
    P = Parts()
    P.add(table(26, 14), "mesa", 1)
    return P


@image("metodo", "m_s1")
def m_s1():
    P = build_meth()
    notebook(P, 1, x=-6.0, y=-0.5)
    P.add(box(2.4, 2.4, 2.4, (3.0, 0.5, 1.2), "verde", bevel=0.08), "verde", 1)
    P.show(1)
    camera((1.0, -17.0, 12.0), (-1.5, 0.3, 0.8), 50)
    render(f"{OUT}/m_s1.webp", W, H)


@image("metodo", "m_s2")
def m_s2():
    P = build_meth()
    notebook(P, 1, x=-9.5, y=-1.0)
    proto(0.0, -4.0, 4.0, parts=P, stage=2)
    P.show(2)
    meth_cam(); render(f"{OUT}/m_s2.webp", W, H)


@image("metodo", "m_s3")
def m_s3():
    P = build_meth()
    notebook(P, 1, x=-9.5, y=-1.0)
    proto(0.0, -4.0, 4.0, parts=P, stage=2)
    P.show(3)
    # prueba: la mano tira hacia abajo en el extremo derecho y se mide cuanto cuesta
    arrow((-4.0, -1.5, 8.2), (-4.0, -1.5, 5.4), "acento", r=0.08, head=0.4)
    arrow((4.0, -1.5, 8.2), (4.0, -1.5, 5.4), "cian", r=0.08, head=0.4)
    P.items  # nada que colorear: lo nuevo son las flechas
    meth_cam(); render(f"{OUT}/m_s3.webp", W, H)


@image("metodo", "m_s4")
def m_s4():
    P = build_meth()
    notebook(P, 1, x=-9.5, y=-1.0)
    proto(-2.0, -4.0, 4.0, parts=P, stage=4)
    P.show(4)
    arrow((-4.0, -1.5, 8.2), (-4.0, -1.5, 5.4), "acento", r=0.08, head=0.4)
    arrow((4.0, -1.5, 7.0), (4.0, -1.5, 5.4), "cian", r=0.08, head=0.4)
    meth_cam(); render(f"{OUT}/m_s4.webp", W, H)


@image("metodo", "m_hero")
def m_hero():
    P = build_meth()
    notebook(P, 1, x=-9.5, y=-1.0)
    proto(-2.0, -4.0, 4.0, parts=P, stage=1)
    P.full()
    meth_cam(); render(f"{OUT}/m_hero.webp", W, H)


@image("metodo", "m_v1v2")
def m_v1v2():
    """Dos versiones: apoyo en el centro (v1) y apoyo movido hacia la carga (v2): misma carga, menos fuerza."""
    P = Parts()
    P.add(table(40, 14), "mesa", 1)
    for off, (px, handlen) in ((-9.0, (0.0, 2.8)), (9.0, (-2.0, 1.0))):
        # cada version en su sitio: se desplaza todo off en X
        sub = Parts()
        proto(px, -4.0, 4.0, parts=sub, stage=1)
        sub.full()
        for o, c, s in sub.items:
            o.matrix_world = Matrix.Translation((off, 0, 0)) @ o.matrix_world
        arrow((off - 4.0, -1.5, 8.2), (off - 4.0, -1.5, 5.4), "acento", r=0.08, head=0.4)
        arrow((off + 4.0, -1.5, 5.4 + handlen), (off + 4.0, -1.5, 5.4), "cian", r=0.08, head=0.4)
    camera((0.0, -27.0, 10.0), (0.0, 0, 2.6), 50)
    render(f"{OUT}/m_v1v2.webp", W, H)


def _marks(colors_xz, color):
    for (x, z) in colors_xz:
        ball(0.35, (x, -1.0, z), color)


@image("metodo", "m_error_mal")
def m_error_mal():
    """Mal: se cambian tres cosas a la vez (apoyo, longitud, peso) y no se sabe cual ayudo."""
    P = build_meth()
    proto(-2.0, -4.0, 4.0, parts=P, stage=1)
    P.full()
    top = 0.3 + 1.84
    for (x, z) in ((-2.0, top + 1.4), (5.6, top + 0.8), (-4.0, top + 3.4)):
        ball(0.4, (x, -1.2, z), "mal")
    meth_cam(); render(f"{OUT}/m_error_mal.webp", W, H)


@image("metodo", "m_error_bien")
def m_error_bien():
    P = build_meth()
    proto(-2.0, -4.0, 4.0, parts=P, stage=1)
    P.full()
    top = 0.3 + 1.84
    ball(0.4, (-2.0, -1.2, top + 1.4), "bien")
    meth_cam(); render(f"{OUT}/m_error_bien.webp", W, H)


# ---------------------------------------------------------------- principal

def main():
    todo = [(n, g, f) for n, (g, f) in IMAGES.items() if (GROUP in ("all", g)) and (not ONLY or n in ONLY)]
    if os.environ.get("MAKER_SKIP_EXISTING"):
        todo = [t for t in todo if not os.path.exists(f"{OUT}/{t[0]}.webp")]
    begin()
    for n, g, f in todo:
        f()
        purge()
    print("HECHO", len(todo))


main()
