"""
Maker Student - imagenes de la unidad "Fuerza, peso y movimiento".

Uso (desde la raiz del repo):
  blender -b --factory-startup --python tools/blender/maker_u_fuerza.py -- [peso|roz|trabajo|all] [nombre_imagen ...]

Cada imagen es una funcion que construye la escena, la renderiza a
public/assets/img/fuerza/<nombre>.webp y la limpia.
Codigo de colores de las flechas (siempre acompanado de texto en la leccion):
  peso = violeta, normal = cian, tiron = naranja, rozamiento = rojo, resultante = verde.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import maker_lib as L
from maker_lib import *

OUT = os.path.join(ROOT, "public", "assets", "img", "fuerza")
args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else ["all"]
GROUP = args[0] if args else "all"
ONLY = set(args[1:])
W, H = 1280, 720
SAMPLES = int(os.environ.get("MAKER_SAMPLES", 40))  # MAKER_SAMPLES=16 para pruebas rapidas

COLORS.update({"mesa": "#6a5845", "carton": "#b98a55", "piel": "#d9a37c", "papel": "#ecebe4", "lapiz": "#e8c24a"})

FC = {"tiron": "#ff8a1f", "roz": "#ff5a4a", "peso": "#b794f6", "normal": "#2de0f2", "res": "#4ade80", "dist": "#2de0f2"}

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


def torus(R, r, loc, color, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, location=loc, major_segments=40, minor_segments=14)
    o = bpy.context.active_object
    o.rotation_euler = rot
    for p in o.data.polygons:
        p.use_smooth = True
    return _fin(o, color, 0)


def earrow(a, b, kind, r=0.07, head=0.3):
    o = arrow(a, b, "acento", r=r, head=head)
    o.data.materials.clear()
    o.data.materials.append(L._mat("f_" + kind, hexc(FC[kind]), 0, 0.3, hexc(FC[kind]), 1.2))
    return o


def table(w=34, d=16, color="mesa"):
    return box(w, d, 0.6, (0, 0, -0.3), color, bevel=0.05)


def lay_rot(objs, loc, rz=0.0, ry=0.0):
    R = Matrix.Translation(loc) @ Matrix.Rotation(rz, 4, "Z") @ Matrix.Rotation(ry, 4, "Y")
    for p in objs:
        p.matrix_world = R @ p.matrix_world


def book(loc=(0, 0, 0), ry=0.0):
    """Libro de 5 x 3,6 x 0,9 con la base en z=0 (despues se coloca con lay_rot). Devuelve [(objeto, color)]."""
    parts = [(box(5.0, 3.6, 0.12, (0, 0, 0.84), "rojo", bevel=0.03), "rojo"), (box(5.0, 3.6, 0.12, (0, 0, 0.06), "rojo", bevel=0.03), "rojo"),
             (box(0.15, 3.6, 0.9, (-2.425, 0, 0.45), "rojo", bevel=0.03), "rojo"), (box(4.8, 3.4, 0.66, (0.1, 0, 0.45), "papel", bevel=0.02), "papel")]
    lay_rot([p for p, c in parts], loc, 0.0, ry)
    return parts


def add_book(P, loc, stage, ry=0.0):
    for o, c in book(loc, ry):
        P.add(o, c, stage)


def hand_obj(x, y, z, rz=0.0):
    parts = [box(2.4, 2.6, 0.7, (0, 0, 0.35), "piel", bevel=0.2)]
    for i in range(4):
        parts.append(box(0.5, 1.8, 0.5, (-0.9 + i * 0.6, 2.1, 0.25), "piel", bevel=0.2))
    parts.append(box(0.55, 1.4, 0.5, (1.5, 0.9, 0.25), "piel", bevel=0.2, rot=(0, 0, -0.7)))
    lay_rot(parts, (x, y, z), rz)
    return parts


def ruler_x(P, x0, y, z, length=12.0, stage=1):
    """Regla tumbada a lo largo de X; la marca 0 esta en x0 y hay una marca por unidad."""
    P.add(box(length, 1.5, 0.22, (x0 - 0.5 + length / 2, y, z + 0.11), "masa", bevel=0.02), "masa", stage)
    for i in range(int(length) - 1):
        P.add(box(0.07 if i else 0.14, 0.55 if i % 5 == 0 else 0.32, 0.04, (x0 + i, y - 0.4, z + 0.23), "oscuro", bevel=0), "oscuro", stage)


# ---------------------------------------------------------------- PESO: goma medidor colgado

ZTOP, REST, STR = 10.0, 3.0, 1.5


def board(P, x0, masses, mark=None):
    """Tablero con regla, goma colgada y `masses` pesas. `mark`: (z, color) linea de lectura."""
    P.add(box(5.5, 0.4, 11, (x0, 1.0, 5.5), "azul", bevel=0.04), "azul", 1)
    P.add(box(1.0, 0.12, 6.4, (x0 + 1.7, 0.55, 4.0), "masa", bevel=0.02), "masa", 1)
    for i in range(7):
        P.add(box(0.7 if i else 0.9, 0.14, 0.06 if i else 0.09, (x0 + 1.5, 0.55, 7.0 - i), "oscuro", bevel=0), "oscuro", 1)
    P.add(cyl(0.35, 0.7, (x0, 0.5, ZTOP), "oscuro", rot=(math.pi / 2, 0, 0)), "oscuro", 2)
    ze = ZTOP - REST - STR * masses
    P.add(rope([(x0, 0.2, ZTOP), (x0, 0.2, ze)], "amarillo", r=0.1), "amarillo", 2)
    if masses:
        P.add(cyl(0.12, 0.8, (x0, 0.2, ze - 0.4), "oscuro", bevel=0), "oscuro", 3)
    for i in range(masses):
        P.add(box(1.5, 1.5, 1.4, (x0, 0.2, ze - 0.8 - 0.7 - 1.4 * i), "verde", bevel=0.08), "verde", 3 + i)
    if mark:
        z, col = mark
        P.add(box(2.7, 0.1, 0.07, (x0 + 0.6, -0.1, z), col, bevel=0), col, 2 if masses == 0 else 3 + masses - 1)
    return ze


def board_cam():
    camera((0.5, -28.0, 6.0), (0.4, 0, 5.3), 50)


@image("peso", "p_s1")
def p_s1():
    P = Parts(); P.add(table(14, 8), "mesa", 1); board(P, 0, 0); P.show(1); board_cam(); render(f"{OUT}/p_s1.webp", W, H)


@image("peso", "p_s2")
def p_s2():
    P = Parts(); P.add(table(14, 8), "mesa", 1); board(P, 0, 0, (ZTOP - REST, "acento")); P.show(2); board_cam(); render(f"{OUT}/p_s2.webp", W, H)


@image("peso", "p_s3")
def p_s3():
    P = Parts(); P.add(table(14, 8), "mesa", 1); board(P, 0, 1, (ZTOP - REST - STR, "acento")); P.show(3); board_cam(); render(f"{OUT}/p_s3.webp", W, H)


@image("peso", "p_s4")
def p_s4():
    P = Parts(); P.add(table(14, 8), "mesa", 1); board(P, 0, 2, (ZTOP - REST - 2 * STR, "acento")); P.show(4); board_cam(); render(f"{OUT}/p_s4.webp", W, H)


@image("peso", "p_hero")
def p_hero():
    P = Parts(); P.add(table(34, 8), "mesa", 1)
    for x0, m in ((-9, 0), (0, 1), (9, 2)):
        board(P, x0, m, (ZTOP - REST - STR * m, "acento"))
    P.full()
    camera((0.0, -31.0, 6.5), (0.0, 0, 5.2), 38)
    render(f"{OUT}/p_hero.webp", W, H)


@image("peso", "p_error_mal")
def p_error_mal():
    P = Parts(); P.add(table(14, 8), "mesa", 1)
    board(P, 0, 1, (ZTOP - REST - STR - 0.8 - 1.4, "mal")); P.full(); board_cam(); render(f"{OUT}/p_error_mal.webp", W, H)


@image("peso", "p_error_bien")
def p_error_bien():
    P = Parts(); P.add(table(14, 8), "mesa", 1)
    board(P, 0, 1, (ZTOP - REST - STR, "bien")); P.full(); board_cam(); render(f"{OUT}/p_error_bien.webp", W, H)


@image("peso", "p_tierra_luna")
def p_tierra_luna():
    """El mismo bloque en dos sitios: la masa es la misma; el peso (flecha) en la Luna es unas 6 veces menor."""
    P = Parts()
    P.add(box(30, 10, 0.6, (0, 0, -0.3), "mesa", bevel=0.05), "mesa", 1)
    for x, col in ((-7.0, "azul"), (7.0, "gris")):
        P.add(box(5.5, 3.4, 0.4, (x, 0, 4.0 - 0.2), col, bevel=0.05), col, 1)
        P.add(cyl(0.7, 4.0, (x, 0, 2.0), col, bevel=0.0), col, 1)
        P.add(box(2.2, 2.2, 2.2, (x, 0, 4.0 + 1.1), "masa", bevel=0.08), "masa", 1)
    P.full()
    earrow((-7.0 - 1.7, -2.4, 5.1), (-7.0 - 1.7, -2.4, -0.9), "peso", r=0.09, head=0.45)
    earrow((7.0 - 1.7, -2.4, 5.1), (7.0 - 1.7, -2.4, 4.1), "peso", r=0.09, head=0.45)
    camera((0.0, -27.0, 6.5), (0.0, 0, 2.6), 42)
    render(f"{OUT}/p_tierra_luna.webp", W, H)


@image("peso", "p_suma")
def p_suma():
    """Tirones opuestos de 40 N y 25 N sobre una caja: la resultante es 15 N hacia el lado del mayor (escala 0,1 por N)."""
    P = Parts(); P.add(table(30, 10), "mesa", 1)
    P.add(box(4.0, 3.0, 2.8, (0, 0, 1.4), "masa", bevel=0.08), "masa", 1)
    P.add(rope([(-2.0, 0, 1.4), (-8.5, 0, 1.4)], "cuerda", r=0.08), "cuerda", 1)
    P.add(rope([(2.0, 0, 1.4), (7.0, 0, 1.4)], "cuerda", r=0.08), "cuerda", 1)
    P.full()
    earrow((-2.0, -2.2, 1.9), (-6.0, -2.2, 1.9), "tiron", r=0.1, head=0.5)
    earrow((2.0, -2.2, 1.9), (4.5, -2.2, 1.9), "normal", r=0.1, head=0.5)
    earrow((0.0, -2.2, 0.55), (-1.5, -2.2, 0.55), "res", r=0.12, head=0.5)
    camera((0.0, -19.0, 9.0), (-0.5, 0, 1.2), 45)
    render(f"{OUT}/p_suma.webp", W, H)


# ---------------------------------------------------------------- ROZAMIENTO

BX = -6.0


def roz_scene(P, stretch, books=1, roll=False, hand_on=True):
    P.add(table(), "mesa", 1)
    z0 = 0.0
    if roll:
        for i in range(5):
            P.add(cyl(0.3, 4.4, (BX - 1.6 + i * 0.8, 0, 0.3), "lapiz", rot=(math.pi / 2, 0, 0), bevel=0.0), "lapiz", 2)
        z0 = 0.6
    for k in range(books):
        add_book(P, (BX, 0, z0 + 0.9 * k), 2)
    zc = z0 + 0.45
    x_end = BX + 2.5 + 3.0 + stretch
    P.add(rope([(BX + 2.5, 0, zc), (x_end, 0, zc)], "amarillo", r=0.11), "amarillo", 2)
    if hand_on:
        for o in hand_obj(x_end + 1.1, 0, 0.0, rz=-math.pi / 2):
            P.add(o, "piel", 2)
    ruler_x(P, BX + 2.5, -3.2, 0.0, 14.0)
    return x_end, zc


def roz_cam():
    camera((1.0, -21.0, 13.0), (1.5, 0.3, 0.6), 48)


def roz_arrows(t, zt=1.9):
    earrow((BX + 1.0, -2.3, zt), (BX + 1.0 + t, -2.3, zt), "tiron", r=0.09, head=0.4)
    earrow((BX - 1.0, -2.3, 0.4), (BX - 1.0 - t, -2.3, 0.4), "roz", r=0.09, head=0.4)


@image("roz", "r_s1")
def r_s1():
    P = Parts(); roz_scene(P, 0.0); P.show(2); roz_cam(); render(f"{OUT}/r_s1.webp", W, H)


@image("roz", "r_s2")
def r_s2():
    P = Parts(); roz_scene(P, 2.6); P.show(2); roz_arrows(2.6); roz_cam(); render(f"{OUT}/r_s2.webp", W, H)


@image("roz", "r_s3")
def r_s3():
    P = Parts(); roz_scene(P, 1.9); P.show(2); roz_arrows(1.9)
    arrow((BX, 2.6, 0.5), (BX + 2.2, 2.6, 0.5), "cian", r=0.06, head=0.3)  # velocidad: el libro ya avanza
    roz_cam(); render(f"{OUT}/r_s3.webp", W, H)


@image("roz", "r_s4")
def r_s4():
    P = Parts(); roz_scene(P, 5.2, books=2); P.show(2); roz_arrows(5.2, 2.4)
    camera((2.0, -23.0, 13.0), (2.0, 0.3, 0.6), 48)
    render(f"{OUT}/r_s4.webp", W, H)


@image("roz", "r_s5")
def r_s5():
    P = Parts(); roz_scene(P, 0.4, roll=True); P.show(2); roz_arrows(0.4, 2.3)
    roz_cam(); render(f"{OUT}/r_s5.webp", W, H)


@image("roz", "r_hero")
def r_hero():
    P = Parts(); roz_scene(P, 2.6); P.full(); roz_arrows(2.6); roz_cam(); render(f"{OUT}/r_hero.webp", W, H)


@image("roz", "r_fbd")
def r_fbd():
    """Las cuatro fuerzas sobre un bloque en reposo justo antes de moverse (peso = normal y tiron = rozamiento)."""
    P = Parts()
    P.add(box(18, 3.6, 0.6, (0, 0, -0.3), "gris", bevel=0.05), "gris", 1)
    P.add(box(5, 3, 1.6, (0, 0, 0.8), "rojo", bevel=0.08), "rojo", 1)
    P.full()
    earrow((-0.9, -2.4, 0.8), (-0.9, -2.4, -1.9), "peso", r=0.09, head=0.45)
    earrow((0.9, -2.4, 0.8), (0.9, -2.4, 3.5), "normal", r=0.09, head=0.45)
    earrow((2.5, -2.4, 0.8), (6.1, -2.4, 0.8), "tiron", r=0.09, head=0.45)
    earrow((-2.5, -2.4, 0.8), (-6.1, -2.4, 0.8), "roz", r=0.09, head=0.45)
    camera((0.0, -17.0, 4.0), (0.0, 0, 0.8), 45)
    render(f"{OUT}/r_fbd.webp", W, H)


@image("roz", "r_area")
def r_area():
    """Ladrillo de plano y de canto: el rozamiento (flecha) es el mismo en el modelo basico."""
    P = Parts()
    P.add(table(28, 10), "mesa", 1)
    P.add(box(6, 3, 2, (-7.5, 0, 1.0), "rojo", bevel=0.08), "rojo", 1)
    P.add(box(6, 2, 3, (7.5, 0, 1.5), "rojo", bevel=0.08), "rojo", 1)
    P.full()
    for x in (-7.5, 7.5):
        earrow((x + 3.2, -2.2, 0.5), (x + 6.2, -2.2, 0.5), "tiron", r=0.08, head=0.4)
        earrow((x - 3.2, -2.2, 0.5), (x - 6.2, -2.2, 0.5), "roz", r=0.08, head=0.4)
    camera((0.0, -23.0, 8.0), (0.0, 0, 1.2), 42)
    render(f"{OUT}/r_area.webp", W, H)


def _tiron(angle):
    P = Parts(); P.add(table(), "mesa", 1)
    add_book(P, (BX, 0, 0), 1)
    x0, z0 = BX + 2.5, 0.45
    ex, ez = x0 + 6.0 * math.cos(angle), z0 + 6.0 * math.sin(angle)
    P.add(rope([(x0, 0, z0), (ex, 0, ez)], "amarillo", r=0.11), "amarillo", 1)
    P.full()
    return x0, z0, ex, ez


@image("roz", "r_error_mal")
def r_error_mal():
    x0, z0, ex, ez = _tiron(math.radians(40))
    earrow((x0 + 0.8, -2.3, z0 + 0.5), (ex - 0.8, -2.3, ez - 0.9), "tiron", r=0.09, head=0.4)
    ball(0.4, (ex, 0, ez), "mal")
    roz_cam(); render(f"{OUT}/r_error_mal.webp", W, H)


@image("roz", "r_error_bien")
def r_error_bien():
    x0, z0, ex, ez = _tiron(0.0)
    earrow((x0 + 0.8, -2.3, z0 + 0.5), (ex - 0.8, -2.3, z0 + 0.5), "tiron", r=0.09, head=0.4)
    ball(0.4, (ex, 0, ez), "bien")
    roz_cam(); render(f"{OUT}/r_error_bien.webp", W, H)


# ---------------------------------------------------------------- TRABAJO

HH = 5.0    # altura a subir
LL = 12.0   # longitud de la rampa
TH = math.asin(HH / LL)


def vertical(P, ox, stage=1):
    """Libro colgado de la goma, subido HH sobre el suelo; la goma muy estirada."""
    add_book(P, (ox, 0, HH), stage)
    P.add(rope([(ox, 0, HH + 0.9), (ox, 0, HH + 0.9 + 7.0)], "amarillo", r=0.11), "amarillo", stage)
    P.add(torus(0.5, 0.12, (ox, 0, HH + 0.9 + 7.4), "oscuro", rot=(math.pi / 2, 0, 0)), "oscuro", stage)


def ramp(P, ox, stage=1, strt=3.0 + 4.0 * HH / LL):
    lowx = ox - 5.0
    u = (math.cos(TH), 0, math.sin(TH))
    n = (-math.sin(TH), 0, math.cos(TH))
    cx, cz = lowx + 6.0 * u[0] - 0.15 * n[0], 6.0 * u[2] - 0.15 * n[2]
    sl = box(LL, 4.0, 0.3, (0, 0, 0), "carton", bevel=0.03)
    lay_rot([sl], (cx, 0, cz), 0.0, -TH)
    P.add(sl, "carton", stage)
    P.add(box(2.4, 4.0, HH, (lowx + LL * u[0] + 1.0, 0, HH / 2), "gris", bevel=0.04), "gris", stage)
    s = 2.4
    pos = (lowx + s * u[0], 0, s * u[2])
    add_book(P, pos, stage, ry=-TH)
    st = (pos[0] + u[0] * 2.5 + n[0] * 0.45, 0, pos[2] + u[2] * 2.5 + n[2] * 0.45)
    en = (st[0] + u[0] * strt, 0, st[2] + u[2] * strt)
    P.add(rope([st, en], "amarillo", r=0.11), "amarillo", stage)
    P.add(torus(0.5, 0.12, (en[0] + u[0] * 0.4, 0, en[2] + u[2] * 0.4), "oscuro", rot=(math.pi / 2, 0, -TH)), "oscuro", stage)
    return pos, st, en, u


def shelf(P, ox, stage=1):
    P.add(box(5, 4, HH, (ox, 0, HH / 2), "gris", bevel=0.04), "gris", stage)


@image("trabajo", "t_s1")
def t_s1():
    P = Parts(); P.add(table(30, 10), "mesa", 1)
    shelf(P, 6.0)
    add_book(P, (-5.0, 0, 0), 1)
    P.show(1)
    earrow((2.2, -2.3, 0.0), (2.2, -2.3, HH), "dist", r=0.09, head=0.45)
    camera((0.5, -21.0, 9.0), (0.5, 0, 2.6), 45)
    render(f"{OUT}/t_s1.webp", W, H)


@image("trabajo", "t_s2")
def t_s2():
    P = Parts(); P.add(table(30, 10), "mesa", 1)
    shelf(P, 6.0)
    vertical(P, -3.0)
    P.show(1)
    earrow((-3.0 + 3.2, -2.3, 0.0), (-3.0 + 3.2, -2.3, HH), "dist", r=0.09, head=0.45)
    earrow((-3.0 - 2.4, -2.3, HH + 1.0), (-3.0 - 2.4, -2.3, HH + 6.0), "tiron", r=0.09, head=0.45)
    camera((0.5, -23.0, 10.0), (0.5, 0, 5.0), 45)
    render(f"{OUT}/t_s2.webp", W, H)


@image("trabajo", "t_s3")
def t_s3():
    P = Parts(); P.add(table(30, 10), "mesa", 1)
    pos, st, en, u = ramp(P, 0.0)
    P.show(1)
    earrow((st[0] + 1.0, -2.3, st[2] + 1.8), (st[0] + 1.0 + 1.9 * u[0], -2.3, st[2] + 1.8 + 1.9 * u[2]), "tiron", r=0.09, head=0.45)
    camera((0.5, -23.0, 10.0), (0.5, 0, 3.0), 45)
    render(f"{OUT}/t_s3.webp", W, H)


def _compare():
    P = Parts(); P.add(table(40, 10), "mesa", 1)
    vertical(P, -10.0)
    shelf(P, -6.5)
    pos, st, en, u = ramp(P, 8.0)
    P.full()
    earrow((-10.0 - 2.4, -2.3, HH + 1.0), (-10.0 - 2.4, -2.3, HH + 5.0), "tiron", r=0.11, head=0.5)
    earrow((-10.0 + 3.2, -2.3, 0.0), (-10.0 + 3.2, -2.3, HH), "dist", r=0.09, head=0.45)
    f = 4.0 * HH / LL
    earrow((st[0] + 1.0, -2.3, st[2] + 1.8), (st[0] + 1.0 + f * u[0], -2.3, st[2] + 1.8 + f * u[2]), "tiron", r=0.11, head=0.5)
    earrow((8.0 - 5.0, -2.3, -0.5), (8.0 - 5.0 + LL * u[0], -2.3, -0.5 + LL * u[2]), "dist", r=0.09, head=0.45)
    camera((0.0, -34.0, 11.0), (-1.0, 0, 3.8), 42)


@image("trabajo", "t_hero")
def t_hero():
    _compare(); render(f"{OUT}/t_hero.webp", W, H)


@image("trabajo", "t_s4")
def t_s4():
    _compare(); render(f"{OUT}/t_s4.webp", W, H)


@image("trabajo", "t_palanca")
def t_palanca():
    """Palanca 4:1 (carga a 1 agujero del apoyo, mano a 4): 4 veces menos fuerza, 4 veces mas recorrido."""
    P = Parts()
    PZ = 4.0
    base = P.add(beam(9, "gris"), "gris", 1); plane(base, -2, -2, 0)
    up = P.add(beam(7, "azul"), "azul", 1); plane(up, 1, -2, 1, rot=math.pi / 2)
    lev = P.add(beam(7, "amarillo"), "amarillo", 1); plane(lev, 0, PZ, 2)
    pv = P.add(pin(3.2), "oscuro", 1); plane(pv, 1, PZ, 1.4)
    m, h = weight(4, "verde", w=1.2)
    P.add(m, "verde", 1)
    m.matrix_world = Matrix.Translation((0, -3.0, PZ - 0.6 - h))
    hg = P.add(beam(3, "rojo"), "rojo", 1); plane(hg, 0, PZ, 3, rot=-math.pi / 2)
    group_rotate([lev, m, hg], (1, PZ), 0.2)
    P.full()
    AY = -5.0
    earrow((0.0, AY, PZ - 0.5), (0.0, AY, PZ - 4.6), "peso", r=0.09, head=0.4)
    earrow((5.0, AY, PZ + 2.3), (5.0, AY, PZ + 1.3), "tiron", r=0.06, head=0.28)
    arc_arrow((1, AY, PZ), 1.0, math.radians(179), math.radians(168), "cian", r=0.05)
    arc_arrow((1, AY, PZ), 4.0, math.radians(-1), math.radians(-11.5), "cian", r=0.05)
    camera((3.0, -21.0, 7.5), (2.0, 0, 2.2), 50)
    render(f"{OUT}/t_palanca.webp", W, H)


def _ramp_marks(mode):
    P = Parts(); P.add(table(30, 10), "mesa", 1)
    ramp(P, 0.0, strt=3.0 + 1.7)
    P.full()
    if mode == "mal":
        for i in range(6):
            ball(0.28, (-5.0 + LL * math.cos(TH) + 0.4, -2.0, i * HH / 5.0), "mal")
    else:
        for i in range(7):
            s = i * LL / 6.0
            ball(0.28, (-5.0 + s * math.cos(TH), -2.0, s * math.sin(TH) + 0.6), "bien")
    camera((0.5, -21.0, 9.0), (0.5, 0, 2.8), 45)


@image("trabajo", "t_error_mal")
def t_error_mal():
    _ramp_marks("mal"); render(f"{OUT}/t_error_mal.webp", W, H)


@image("trabajo", "t_error_bien")
def t_error_bien():
    _ramp_marks("bien"); render(f"{OUT}/t_error_bien.webp", W, H)


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
