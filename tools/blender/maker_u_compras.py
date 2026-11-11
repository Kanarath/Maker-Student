"""
Maker Student - imagenes de la unidad "Guia de compras Technic".

Uso (desde la raiz del repo):
  blender -b --factory-startup --python tools/blender/maker_u_compras.py -- [piezas|medir|kit|all] [nombre_imagen ...]

Piezas genericas tipo Technic (sin marcas) tumbadas sobre la mesa: vigas, pines (con y sin agarre),
ejes, topes, engranajes de 8/16/24/40 dientes, manivela, y los objetos de las comparaciones.
Las imagenes se guardan en public/assets/img/compras/<nombre>.webp.
NO hay precios ni enlaces: eso vive en el motor de practica (seccion Compras).
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import maker_lib as L
from maker_lib import *

OUT = os.path.join(ROOT, "public", "assets", "img", "compras")
args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else ["all"]
GROUP = args[0] if args else "all"
ONLY = set(args[1:])
W, H = 1280, 720
SAMPLES = int(os.environ.get("MAKER_SAMPLES", 40))  # MAKER_SAMPLES=16 para pruebas rapidas

COLORS.update({"mesa": "#6a5845", "papel": "#ecebe4", "tope": "#f2b230", "pin_liso": "#9aa3b5"})

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

    def show(self, k):
        for o, color, stage in self.items:
            if stage > k:
                o.hide_render = True
                o.hide_viewport = True
            else:
                set_mat(o, color if stage == k else "ghost")

    def full(self):
        for o, color, stage in self.items:
            set_mat(o, color)


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


def ball(r, loc, color):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=24, ring_count=14)
    o = bpy.context.active_object
    for p in o.data.polygons:
        p.use_smooth = True
    return _fin(o, color, 0)


def table(w=40, d=22, color="mesa"):
    return box(w, d, 0.6, (0, 0, -0.3), color, bevel=0.05)


def tray(cx, cy, w, d, h=0.9, color="oscuro"):
    os_ = [box(w, d, 0.15, (cx, cy, 0.075), color)]
    t = 0.2
    os_.append(box(w, t, h, (cx, cy - d / 2 + t / 2, h / 2), color))
    os_.append(box(w, t, h, (cx, cy + d / 2 - t / 2, h / 2), color))
    os_.append(box(t, d, h, (cx - w / 2 + t / 2, cy, h / 2), color))
    os_.append(box(t, d, h, (cx + w / 2 - t / 2, cy, h / 2), color))
    return os_


def place_group(objs, mat):
    for o in objs:
        o.matrix_world = mat @ o.matrix_world


def lay_beam(n, color, x, y, z=0.0, rz=0.0):
    o = beam(n, color)
    o.location = (x, y, z + 0.4875)
    o.rotation_euler = (0, 0, rz)
    return o


def lay_gear(t, color, x, y, z=0.0, rz=0.0):
    o = gear(t, color)
    o.location = (x, y, z + 0.25)
    o.rotation_euler = (0, 0, rz)
    return o


def lay_stopper(color, x, y, z=0.0):
    o = stopper(color)
    o.location = (x, y, z + 0.15)
    return o


def lay_axle(length, color, x, y, z=0.0, rz=0.0):
    o = axle(length, color)
    o.matrix_world = Matrix.Translation((x, y, z + 0.24)) @ Matrix.Rotation(rz, 4, "Z") @ Matrix.Rotation(math.pi / 2, 4, "Y")
    return o


def lay_pin(length, ribbed, color, x, y, z=0.0, rz=0.0):
    """Pin tumbado (con estrias si `ribbed`). Devuelve la lista de objetos."""
    objs = [pin(length, color)]
    if ribbed:
        for dz in (-0.55, -0.1, 0.35):
            objs.append(cyl(0.33, 0.1, (0, 0, dz), color, bevel=0.01))
    place_group(objs, Matrix.Translation((x, y, z + 0.285)) @ Matrix.Rotation(rz, 4, "Z") @ Matrix.Rotation(math.pi / 2, 4, "Y"))
    return objs


def stand_pin(length, ribbed, color, x, y, zc):
    objs = [pin(length, color)]
    if ribbed:
        for dz in (-0.55, -0.1, 0.35):
            objs.append(cyl(0.33, 0.1, (0, 0, dz), color, bevel=0.01))
    place_group(objs, Matrix.Translation((x, y, zc)))
    return objs


def crank(x, y, rz=0.0, z=0.0):
    """Manivela: viga de 4 agujeros con un eje en un extremo y un pin como mango en el otro."""
    b = beam(4, "rojo")
    ax = axle(3.6, "eje")
    hd = pin(1.8, "oscuro")
    b.location = (0, 0, 0.4875)
    ax.location = (0, 0, 0.9)
    hd.location = (3.0, 0, 0.9)
    objs = [b, ax, hd]
    place_group(objs, Matrix.Translation((x, y, z)) @ Matrix.Rotation(rz, 4, "Z"))
    return objs


def harc(cx, cy, z, radius, a0, a1, color="acento", r=0.07):
    n = 30
    pts = [Vector((cx + radius * math.cos(a0 + (a1 - a0) * i / n), cy + radius * math.sin(a0 + (a1 - a0) * i / n), z)) for i in range(n + 1)]
    cu = bpy.data.curves.new("arco", "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = r
    cu.bevel_resolution = 3
    cu.use_fill_caps = True
    sp = cu.splines.new("POLY")
    sp.points.add(len(pts) - 1)
    for p, v in zip(sp.points, pts):
        p.co = (v.x, v.y, v.z, 1)
    o = bpy.data.objects.new("arco", cu)
    bpy.context.scene.collection.objects.link(o)
    o.data.materials.append(M(color))
    tip = pts[-1]
    tang = (pts[-1] - pts[-3]).normalized()
    arrow(tip - tang * 0.001, tip + tang * 0.34, color, r=r, head=0.34)
    return o


def top_cam(cx, cy, dist, height, lens=45, tz=0.0):
    camera((cx + 1.0, cy - dist, height), (cx, cy, tz), lens)


# ---------------------------------------------------------------- PIEZAS BASICAS

def build_pieces():
    P = Parts()
    P.add(table(), "mesa", 1)
    P.add(lay_beam(7, "amarillo", -12.0, 5.5), "amarillo", 1)
    P.add(lay_beam(5, "azul", -3.0, 5.5), "azul", 1)
    P.add(lay_beam(3, "rojo", 3.5, 5.5), "rojo", 1)
    for x in (-11.0, -9.0):
        P.add(lay_pin(2.2, True, "oscuro", x, 2.0), "oscuro", 2)
    for x in (-6.0, -4.0):
        P.add(lay_pin(2.2, False, "pin_liso", x, 2.0), "pin_liso", 2)
    P.add(lay_axle(6.0, "rojo", -9.0, -1.5), "rojo", 3)
    P.add(lay_axle(4.0, "rojo", -3.5, -1.5), "rojo", 3)
    P.add(lay_axle(3.0, "rojo", 0.5, -1.5), "rojo", 3)
    for x in (3.5, 5.0, 6.5):
        P.add(lay_stopper("tope", x, -1.5), "tope", 4)
    P.add(lay_gear(8, "gris", -10.5, -6.0), "gris", 5)
    P.add(lay_gear(16, "amarillo", -7.0, -6.0), "amarillo", 5)
    P.add(lay_gear(24, "azul", -2.5, -6.0), "azul", 5)
    P.add(lay_gear(40, "rojo", 3.8, -6.0), "rojo", 5)
    return P


def pieces_cam():
    camera((-1.5, -27.0, 20.0), (-2.5, -0.5, 0.0), 45)


@image("piezas", "c_hero")
def c_hero():
    P = build_pieces(); P.full(); pieces_cam(); render(f"{OUT}/c_hero.webp", W, H)


def _step_p(k):
    P = build_pieces(); P.show(k); pieces_cam(); render(f"{OUT}/c_s{k}.webp", W, H)


@image("piezas", "c_s1")
def c_s1():
    _step_p(1)


@image("piezas", "c_s2")
def c_s2():
    _step_p(2)


@image("piezas", "c_s3")
def c_s3():
    _step_p(3)


@image("piezas", "c_s4")
def c_s4():
    _step_p(4)


@image("piezas", "c_s5")
def c_s5():
    _step_p(5)


@image("piezas", "c_extremos")
def c_extremos():
    """Vistos de frente: el pin acaba en un circulo y el eje en una cruz."""
    P = Parts(); P.add(table(16, 10), "mesa", 1)
    ax = axle(4.0, "rojo")
    ax.matrix_world = Matrix.Translation((2.2, 0, 0.9)) @ Matrix.Rotation(math.pi / 2, 4, "X")
    P.add(ax, "rojo", 1)
    pn = [pin(3.0, "oscuro")]
    place_group(pn, Matrix.Translation((-2.2, 0, 0.9)) @ Matrix.Rotation(math.pi / 2, 4, "X"))
    P.add(pn, "oscuro", 1)
    P.add(box(2.4, 1.2, 1.8, (2.2, 2.2, 0.9), "gris", bevel=0.05), "gris", 1)  # soportes para que se vean de frente
    P.add(box(2.4, 1.2, 1.8, (-2.2, 2.2, 0.9), "gris", bevel=0.05), "gris", 1)
    P.full()
    camera((0.0, -9.5, 2.4), (0.0, 0, 0.9), 50)
    render(f"{OUT}/c_extremos.webp", W, H)


def _hinge(rigid):
    P = Parts(); P.add(table(20, 12), "mesa", 1)
    pin_color = "oscuro" if rigid else "pin_liso"
    a = lay_beam(5, "amarillo", 0.0, 0.0)
    b = beam(5, "azul")
    ang = 0.0 if rigid else math.radians(38)
    b.location = (0, 0, 0.975 + 0.4875)
    b.rotation_euler = (0, 0, ang)
    P.add(a, "amarillo", 1); P.add(b, "azul", 1)
    P.add(stand_pin(2.4, rigid, pin_color, 0, 0, 0.975), pin_color, 1)
    P.full()
    return b, ang


@image("piezas", "c_error_mal")
def c_error_mal():
    _hinge(True)
    # cruz roja sobre el extremo libre: no gira
    for rz in (0.7, -0.7):
        box(2.2, 0.22, 0.12, (4.0, 0, 2.2), "mal", bevel=0.0, rot=(0, 0, rz))
    top_cam(2.0, 0.0, 12, 11, lens=45, tz=0.5)
    render(f"{OUT}/c_error_mal.webp", W, H)


@image("piezas", "c_error_bien")
def c_error_bien():
    _hinge(False)
    harc(0, 0, 2.2, 3.4, 0.0, math.radians(38), "bien", r=0.07)
    top_cam(2.0, 0.0, 12, 11, lens=45, tz=0.5)
    render(f"{OUT}/c_error_bien.webp", W, H)


# ---------------------------------------------------------------- MEDIR

B10X = -4.95  # primer agujero de la viga de 10 (la viga mide 9,9 unidades en total)


def hole_x(k):
    return B10X + (k - 1)


def build_ruler_scene():
    P = Parts()
    P.add(table(26, 12), "mesa", 1)
    x0 = B10X - 0.45  # borde izquierdo de la viga = marca 0 de la regla
    P.add(box(13.0, 1.7, 0.2, (x0 + 6.5, -2.0, 0.1), "masa", bevel=0.02), "masa", 1)
    for i in range(0, 11):  # una marca cada centimetro = 1,25 unidades de 8 mm
        P.add(box(0.07, 0.6 if i % 2 == 0 else 0.4, 0.04, (x0 + i * 1.25, -2.4, 0.21), "oscuro", bevel=0), "oscuro", 1)
    P.add(lay_beam(10, "amarillo", B10X, 0.0), "amarillo", 1)
    return P


def medir_cam():
    camera((0.0, -17.0, 14.0), (0.0, -0.7, 0.0), 45)


@image("medir", "m_s1")
def m_s1():
    P = build_ruler_scene(); P.show(1); medir_cam(); render(f"{OUT}/m_s1.webp", W, H)


@image("medir", "m_s2")
def m_s2():
    P = build_ruler_scene()
    for k in range(1, 11):
        P.add(ball(0.2, (hole_x(k), 0, 1.15), "acento" if k in (2, 9) else "oscuro"), "acento" if k in (2, 9) else "oscuro", 2)
    P.show(2); medir_cam(); render(f"{OUT}/m_s2.webp", W, H)


@image("medir", "m_s3")
def m_s3():
    P = build_ruler_scene()
    for k in range(1, 11):
        P.add(ball(0.2, (hole_x(k), 0, 1.15), "acento" if k in (2, 9) else "oscuro"), "acento" if k in (2, 9) else "oscuro", 2)
    for k in range(2, 9):
        P.add(arrow((hole_x(k) + 0.05, 1.3, 1.3), (hole_x(k + 1) - 0.05, 1.3, 1.3), "cian" if k % 2 == 0 else "bien", r=0.06, head=0.25), "cian" if k % 2 == 0 else "bien", 3)
    P.show(3); medir_cam(); render(f"{OUT}/m_s3.webp", W, H)


def lever15(P):
    x0 = -7.0
    hx = lambda k: x0 + (k - 1)
    P.add(table(30, 12), "mesa", 1)
    P.add(lay_beam(15, "amarillo", x0, 0.0), "amarillo", 1)
    P.add(stand_pin(2.4, False, "pin_liso", hx(4), 0, 0.975), "pin_liso", 1)
    P.add(box(1.4, 1.4, 1.4, (hx(2), 0, 0.975 + 0.7), "verde", bevel=0.06), "verde", 1)
    return hx


@image("medir", "m_hero")
def m_hero():
    P = Parts(); hx = lever15(P); P.full()
    # fuerza grande en la carga (hoyo 2), pequena en la mano (hoyo 14): 5 veces menos
    arrow((hx(2), -1.6, 6.0), (hx(2), -1.6, 2.6), "acento", r=0.1, head=0.45)
    arrow((hx(14), -1.6, 3.2), (hx(14), -1.6, 1.9), "cian", r=0.06, head=0.3)
    # brazos: 2 saltos y 10 saltos desde el apoyo
    arrow((hx(4), 2.2, 0.6), (hx(2), 2.2, 0.6), "acento", r=0.07, head=0.3)
    arrow((hx(4), 2.2, 0.6), (hx(14), 2.2, 0.6), "cian", r=0.07, head=0.3)
    camera((0.0, -19.0, 12.0), (0.0, 0.3, 0.8), 42)
    render(f"{OUT}/m_hero.webp", W, H)


@image("medir", "m_engranajes")
def m_engranajes():
    """Pinon de 8 dientes y rueda de 24: la grande da 1 vuelta mientras el pequeno da 3 (relacion 3:1)."""
    P = Parts(); P.add(table(16, 10), "mesa", 1)
    g1 = lay_gear(8, "azul", 0.0, 0.0, 0.0, 0.0)
    g2 = lay_gear(24, "amarillo", 2.0, 0.0, 0.0, math.pi + math.pi / 24)
    P.add(g1, "azul", 1); P.add(g2, "amarillo", 1)
    for x, c in ((0.0, "eje"), (2.0, "eje")):
        a = axle(2.4, c); a.location = (x, 0, 0.75); P.add(a, "eje", 1)
    P.full()
    harc(0, 0, 1.6, 0.95, math.radians(120), math.radians(-170), "acento", r=0.06)
    harc(2.0, 0, 1.6, 2.1, math.radians(60), math.radians(120 - 0), "cian", r=0.06)
    camera((1.0, -9.0, 9.0), (1.0, 0.0, 0.0), 50)
    render(f"{OUT}/m_engranajes.webp", W, H)


@image("medir", "m_error_mal")
def m_error_mal():
    """Mal: contar los agujeros (8 marcas) en vez de los saltos entre el 2 y el 9."""
    P = build_ruler_scene(); P.full()
    for k in range(2, 10):
        ball(0.26, (hole_x(k), 0, 1.2), "mal")
    medir_cam(); render(f"{OUT}/m_error_mal.webp", W, H)


@image("medir", "m_error_bien")
def m_error_bien():
    P = build_ruler_scene(); P.full()
    for k in range(2, 9):
        arrow((hole_x(k) + 0.05, 0, 1.3), (hole_x(k + 1) - 0.05, 0, 1.3), "bien", r=0.07, head=0.28)
    medir_cam(); render(f"{OUT}/m_error_bien.webp", W, H)


# ---------------------------------------------------------------- KIT Y LOTES

def build_kit():
    P = Parts()
    P.add(table(40, 22), "mesa", 1)
    P.add(tray(0, 0, 30, 17), "oscuro", 1)
    z = 0.15
    # 1) vigas largas
    P.add(lay_beam(15, "amarillo", -13.0, 6.0, z), "amarillo", 1)
    P.add(lay_beam(11, "azul", -13.0, 3.8, z), "azul", 1)
    P.add(lay_beam(9, "rojo", -13.0, 1.6, z), "rojo", 1)
    P.add(lay_beam(7, "amarillo", -13.0, -0.6, z), "amarillo", 1)
    # 2) pines, ejes y topes
    for i in range(4):
        P.add(lay_pin(2.2, True, "oscuro", 3.0 + i * 1.6, 6.0, z), "oscuro", 2)
        P.add(lay_pin(2.2, False, "pin_liso", 3.0 + i * 1.6, 4.4, z), "pin_liso", 2)
    for i, ln in enumerate((6.0, 4.0, 4.0, 3.0)):
        P.add(lay_axle(ln, "rojo", 4.0, 2.6 - i * 1.0, z), "rojo", 2)
    for i in range(6):
        P.add(lay_stopper("tope", 10.0 + (i % 3) * 1.3, 2.6 - (i // 3) * 1.3, z), "tope", 2)
    # 3) engranajes 8, 16, 24 y 40
    P.add(lay_gear(8, "gris", -9.5, -4.8, z), "gris", 3)
    P.add(lay_gear(16, "amarillo", -6.5, -4.8, z), "amarillo", 3)
    P.add(lay_gear(24, "azul", -2.0, -4.8, z), "azul", 3)
    P.add(lay_gear(40, "rojo", 4.5, -4.2, z), "rojo", 3)
    # 4) manivela
    P.add(crank(11.0, -5.6, 0.2, z), "rojo", 4)
    return P


def kit_cam():
    camera((0.0, -29.0, 22.0), (0.0, -0.5, 0.0), 45)


@image("kit", "k_hero")
def k_hero():
    P = build_kit(); P.full(); kit_cam(); render(f"{OUT}/k_hero.webp", W, H)


def _step_k(k):
    P = build_kit(); P.show(k); kit_cam(); render(f"{OUT}/k_s{k}.webp", W, H)


@image("kit", "k_s1")
def k_s1():
    _step_k(1)


@image("kit", "k_s2")
def k_s2():
    _step_k(2)


@image("kit", "k_s3")
def k_s3():
    _step_k(3)


@image("kit", "k_s4")
def k_s4():
    _step_k(4)


def brick(x, y, z, color, rz=0.0):
    b = box(2.0, 1.0, 0.9, (0, 0, 0.45), color, bevel=0.03)
    objs = [b]
    for sx in (-0.5, 0.5):
        objs.append(cyl(0.22, 0.18, (sx, 0, 1.0), color, bevel=0.0, seg=16))
    place_group(objs, Matrix.Translation((x, y, z)) @ Matrix.Rotation(rz, 4, "Z"))
    return objs


@image("kit", "k_lotes")
def k_lotes():
    """Dos lotes: el de la izquierda trae piezas utiles (vigas, ejes, engranajes); el de la derecha, casi todo ladrillos normales."""
    P = Parts(); P.add(table(40, 18), "mesa", 1)
    P.add(tray(-10.5, 0, 17, 13), "oscuro", 1)
    P.add(tray(10.5, 0, 17, 13), "oscuro", 1)
    z = 0.15
    P.add(lay_beam(11, "amarillo", -17.0, 4.0, z), "amarillo", 1)
    P.add(lay_beam(7, "azul", -17.0, 2.0, z), "azul", 1)
    P.add(lay_axle(5.0, "rojo", -13.0, 0.0, z), "rojo", 1)
    P.add(lay_axle(3.0, "rojo", -8.5, 0.0, z), "rojo", 1)
    for i in range(3):
        P.add(lay_pin(2.2, i % 2 == 0, "oscuro" if i % 2 == 0 else "pin_liso", -15.5 + i * 1.6, -1.8, z), "oscuro", 1)
    P.add(lay_gear(24, "azul", -13.0, -4.0, z), "azul", 1)
    P.add(lay_gear(8, "gris", -9.2, -4.2, z), "gris", 1)
    P.add(lay_gear(16, "amarillo", -6.8, -3.2, z), "amarillo", 1)
    P.add(lay_beam(5, "rojo", 15.5, 4.0, z, 0.0), "rojo", 1)
    spots = [(5.0, 4.0, 0.2), (7.5, 2.0, 1.0), (9.5, 4.2, 2.0), (12.0, 2.2, 0.4), (14.5, 1.0, 1.6), (6.5, -0.5, 0.9), (9.0, -1.0, 2.4),
             (11.5, -0.2, 0.1), (14.0, -2.2, 1.2), (6.0, -3.0, 0.6), (8.5, -4.2, 1.9), (11.0, -3.6, 0.3), (14.0, -4.6, 2.6), (16.0, -0.5, 1.4)]
    cols = ("rojo", "amarillo", "azul", "gris", "verde")
    for i, (x, y, rz) in enumerate(spots):
        P.add(brick(x, y, z, cols[i % 5], rz), cols[i % 5], 1)
    P.full()
    ball(0.5, (-10.5, 7.8, 0.6), "bien")
    ball(0.5, (10.5, 7.8, 0.6), "mal")
    camera((0.0, -30.0, 24.0), (0.0, 0.5, 0.0), 45)
    render(f"{OUT}/k_lotes.webp", W, H)


def _motor(x, y):
    objs = [cyl(1.4, 3.4, (0, 0, 1.4), "gris", rot=(0, math.pi / 2, 0), bevel=0.05),
            cyl(0.2, 1.4, (2.4, 0, 1.4), "eje", rot=(0, math.pi / 2, 0), bevel=0.0),
            box(1.0, 2.4, 0.7, (-0.4, 0, 0.35), "oscuro", bevel=0.05)]
    place_group(objs, Matrix.Translation((x, y, 0.0)))
    return objs


@image("kit", "k_error_mal")
def k_error_mal():
    """Mal: lo primero que se compra es un motor y una bateria; no hay con que montar nada."""
    P = Parts(); P.add(table(26, 14), "mesa", 1)
    _motor(-4.0, 0.0)
    box(4.2, 2.4, 1.4, (4.0, 0.0, 0.7), "oscuro", bevel=0.1)
    box(3.0, 1.2, 0.05, (4.0, 0.0, 1.43), "amarillo", bevel=0.0)
    P.full()
    arrow((0.0, -3.2, 5.0), (0.0, -3.2, 2.6), "mal", r=0.1, head=0.5)
    camera((0.0, -16.0, 12.0), (0.0, 0, 0.8), 45)
    render(f"{OUT}/k_error_mal.webp", W, H)


@image("kit", "k_error_bien")
def k_error_bien():
    """Bien: vigas, ejes, engranajes y una manivela; el motor puede esperar."""
    P = Parts(); P.add(table(26, 14), "mesa", 1)
    P.add(lay_beam(11, "amarillo", -8.0, 3.0), "amarillo", 1)
    P.add(lay_axle(4.0, "rojo", -5.0, 0.5), "rojo", 1)
    P.add(lay_gear(8, "gris", -8.0, -3.0), "gris", 1)
    P.add(lay_gear(24, "azul", -6.0, -3.0, 0.0, math.pi + math.pi / 24), "azul", 1)
    P.add(lay_gear(16, "amarillo", 0.0, -3.5), "amarillo", 1)
    P.add(crank(4.0, 0.5, 0.2), "rojo", 1)
    for i in range(3):
        P.add(lay_pin(2.2, i % 2 == 0, "oscuro" if i % 2 == 0 else "pin_liso", 2.0 + i * 1.6, 3.5), "oscuro", 1)
    P.full()
    arrow((0.0, -5.4, 5.0), (0.0, -5.4, 2.6), "bien", r=0.1, head=0.5)
    camera((0.0, -16.0, 12.0), (0.0, 0, 0.8), 45)
    render(f"{OUT}/k_error_bien.webp", W, H)


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
