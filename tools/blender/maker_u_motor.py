"""
Maker Student - imagenes de la unidad "Motores y energia" (circuito, motores, reductor y seguridad con baterias).

Uso (desde la raiz del repo):
  blender -b --factory-startup --python tools/blender/maker_u_motor.py -- [circuito|motores|bateria|all] [nombre_imagen ...]

Cada imagen es una funcion que construye la escena, la renderiza a public/assets/img/motor/<nombre>.webp y la limpia.
Todo son formas genericas (sin marcas): pila cilindrica, motor de CC, servo, paso a paso, bateria plana de litio.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from maker_lib import *
from maker_lib import _prism, _to_obj

OUT = os.path.join(ROOT, "public", "assets", "img", "motor")
args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else ["all"]
GROUP = args[0] if args else "all"
ONLY = set(args[1:])
W, H = 1280, 720
SAMPLES = 40

KEEP = set()
IMAGES = {}


def image(group, name):
    def deco(fn):
        IMAGES[name] = (group, fn)
        return fn
    return deco


def begin():
    reset()
    studio(floor_z=-3.2, size=300)
    eevee(SAMPLES)
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
        self.items.append((o, color, stage))
        return o

    def show(self, k):
        for o, color, stage in self.items:
            if stage > k:
                o.hide_render = True
                o.hide_viewport = True
            else:
                set_mat(o, color if stage == k else "ghost")

    def color_all(self):
        for o, c, s in self.items:
            set_mat(o, c)


# ---------------------------------------------------------------- piezas nuevas

def box(w, d, h, color, loc, bevel=0.03, rot=None):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Diagonal((w, d, h, 1)))
    o = _to_obj("caja", bm, color, smooth_sides=False, bevel=bevel)
    o.location = loc
    if rot:
        o.rotation_euler = rot
    return o


def cyl(r, h, color, loc, axis="z", seg=28, bevel=0.01):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r, radius2=r, depth=h)
    o = _to_obj("cil", bm, color, smooth_sides=True, bevel=bevel)
    o.location = loc
    if axis == "x":
        o.rotation_euler = (0, math.pi / 2, 0)
    elif axis == "y":
        o.rotation_euler = (math.pi / 2, 0, 0)
    return o


def sphere(r, color, loc, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=32, ring_count=18)
    o = bpy.context.active_object
    o.scale = scale
    o.data.materials.append(M(color))
    for p in o.data.polygons:
        p.use_smooth = True
    return o


def wire(pts, color, r=0.07, fillet=0.5):
    """Cable: polilinea con las esquinas redondeadas."""
    out = [Vector(pts[0])]
    for i in range(1, len(pts) - 1):
        p0, p1, p2 = Vector(pts[i - 1]), Vector(pts[i]), Vector(pts[i + 1])
        a = p1 + (p0 - p1).normalized() * min(fillet, (p0 - p1).length / 2)
        b = p1 + (p2 - p1).normalized() * min(fillet, (p2 - p1).length / 2)
        for k in range(1, 7):
            t = k / 6
            out.append((1 - t) ** 2 * a + 2 * t * (1 - t) * p1 + t * t * b)
    out.append(Vector(pts[-1]))
    return rope([tuple(v) for v in out], color=color, r=r)


def cell(P, x, y, z=0.7, along="y", plus=1, body="azul", stage=1):
    """Pila cilindrica de 3,6 de largo. `plus` = +1 / -1: lado (en el eje) donde esta el polo +."""
    ax = "x" if along == "x" else "y"
    d = Vector((1, 0, 0)) if along == "x" else Vector((0, 1, 0))
    c = Vector((x, y, z))
    P.add(cyl(0.7, 3.6, body, c, ax), body, stage)
    P.add(cyl(0.72, 0.5, "oscuro", c - d * plus * 1.55, ax), "oscuro", stage)   # extremo negativo
    P.add(cyl(0.72, 0.4, "rojo", c + d * plus * 1.35, ax), "rojo", stage)       # collar del polo positivo
    P.add(cyl(0.26, 0.35, "eje", c + d * plus * 1.95, ax), "eje", stage)        # boton del +
    return c + d * plus * 2.12, c - d * plus * 1.8   # puntos de conexion (+, -)


def switch(P, x, y, closed=True, stage=1):
    P.add(box(2.6, 1.5, 0.35, "oscuro", (x, y, 0.175)), "oscuro", stage)
    for dx in (-0.9, 0.9):
        P.add(cyl(0.22, 0.5, "eje", (x + dx, y, 0.55)), "eje", stage)
    lev = box(1.9, 0.3, 0.13, "amarillo", (0, 0, 0))
    a = 0.0 if closed else math.radians(38)
    lev.matrix_world = Matrix.Translation((x - 0.9, y, 0.8)) @ Matrix.Rotation(-a, 4, "Y") @ Matrix.Translation((0.95, 0, 0))
    P.add(lev, "amarillo", stage)
    return (x - 0.9, y, 0.7), (x + 0.9, y, 0.7)


def dc_motor(P, x, y, z=0.9, stage=1, direction=(1, 0, 0)):
    """Motor de corriente continua tumbado a lo largo de X, con el eje hacia +X. Devuelve los dos bornes (lengetas)."""
    P.add(cyl(0.9, 3.0, "gris", (x + 1.5, y, z), "x", seg=36), "gris", stage)
    P.add(cyl(0.92, 0.35, "oscuro", (x + 0.1, y, z), "x", seg=36), "oscuro", stage)
    P.add(cyl(0.14, 1.6, "eje", (x + 3.8, y, z), "x"), "eje", stage)
    t1 = (x - 0.15, y + 0.4, z - 0.2)
    t2 = (x - 0.15, y - 0.4, z - 0.2)
    for t in (t1, t2):
        P.add(box(0.35, 0.18, 0.5, "eje", t), "eje", stage)
    return t1, t2


# ---------------------------------------------------------------- CIRCUITO

def circuit(P, closed=True, stages=(1, 2, 3, 4)):
    """Pila a la izquierda, interruptor arriba, motor a la derecha. Etapas: pila, motor, cables, interruptor."""
    sc, sm, sw, ss = stages
    plus, minus = cell(P, -6.0, 0.0, 0.7, "y", plus=1, stage=sc)
    t1, t2 = dc_motor(P, 4.6, 0.0, 0.9, stage=sm)
    swl, swr = switch(P, 0.0, 4.0, closed, stage=ss)
    zw = 0.7
    # cable positivo (rojo): + de la pila -> interruptor -> borne del motor
    P.add(wire([(plus.x, plus.y, zw), (-6.0, 4.0, zw), (swl[0] - 0.15, 4.0, zw)], "rojo"), "rojo", sw)
    P.add(wire([(swr[0] + 0.15, 4.0, zw), (4.4, 4.0, zw), (4.4, t1[1], t1[2] + 0.05), (t1[0], t1[1], t1[2] + 0.05)], "rojo"), "rojo", sw)
    # cable de vuelta (azul): borne del motor -> - de la pila
    P.add(wire([(t2[0], t2[1], t2[2] + 0.05), (4.4, t2[1], t2[2] + 0.05), (4.4, -4.0, zw), (-6.0, -4.0, zw), (minus.x, minus.y, zw)], "azul"), "azul", sw)


def circuit_cam():
    camera((0.6, -17.5, 13.5), (0.6, 0.0, 0.2), 44)


def current_arrows(color="acento"):
    z = 1.35
    r, hd = 0.09, 0.4
    arrow((-4.6, 4.0, z), (-2.4, 4.0, z), color, r, hd)
    arrow((2.4, 4.0, z), (3.9, 4.0, z), color, r, hd)
    arrow((3.2, -4.0, z), (1.0, -4.0, z), color, r, hd)
    arrow((-2.4, -4.0, z), (-4.7, -4.0, z), color, r, hd)


@image("circuito", "e_hero")
def e_hero():
    P = Parts()
    circuit(P, True)
    P.color_all()
    current_arrows()
    circuit_cam()
    render(f"{OUT}/e_hero.webp", W, H)


def _e_step(k):
    P = Parts()
    circuit(P, False, stages=(1, 2, 4, 3))  # pila, motor, interruptor(3), cables(4)
    # en este orden de montaje: 1 pila, 2 motor, 3 interruptor, 4 cables
    P.show(k)
    circuit_cam()


@image("circuito", "e_s1")
def e_s1():
    _e_step(1); render(f"{OUT}/e_s1.webp", W, H)


@image("circuito", "e_s2")
def e_s2():
    _e_step(2); render(f"{OUT}/e_s2.webp", W, H)


@image("circuito", "e_s3")
def e_s3():
    _e_step(3); render(f"{OUT}/e_s3.webp", W, H)


@image("circuito", "e_s4")
def e_s4():
    _e_step(4); render(f"{OUT}/e_s4.webp", W, H)


def cell_row(P, n=4, colors=None, y=0.0):
    colors = colors or ["azul"] * n
    for k in range(n):
        x = -1.0 - (n - 1) * 1.9 + k * 3.8  # centradas, con el + de una tocando el - de la siguiente
        cell(P, x, y, 0.7, "x", plus=1, body=colors[k])


@image("circuito", "e_serie")
def e_serie():
    P = Parts()
    n = 4
    cell_row(P, n)
    P.color_all()
    # cada pila aporta 1,5 V (flechas cortas); juntas, 4 x 1,5 (flecha larga)
    xs = [-1.0 - (n - 1) * 1.9 + k * 3.8 for k in range(n)]
    for x in xs:
        arrow((x - 1.5, 0, 2.2), (x + 1.5, 0, 2.2), "acento", r=0.07, head=0.32)
    arrow((xs[0] - 1.8, 0, 3.4), (xs[-1] + 2.1, 0, 3.4), "cian", r=0.1, head=0.45)
    camera((-0.5, -23.0, 9.0), (-0.5, 0, 1.4), 44)
    render(f"{OUT}/e_serie.webp", W, H)


@image("circuito", "e_corto_mal")
def e_corto_mal():
    P = Parts()
    plus, minus = cell(P, 0.0, 0.0, 0.7, "x", plus=1)
    P.color_all()
    # clip metalico que une los dos polos
    wire([(minus.x - 0.05, 0, 0.7), (minus.x - 0.4, 0, 2.4), (plus.x + 0.4, 0, 2.4), (plus.x + 0.05, 0, 0.7)], "eje", r=0.09, fillet=0.35)
    # calor: flechas hacia arriba
    for x in (-1.4, 0.0, 1.4):
        arrow((x, 0, 3.0), (x, 0, 4.4), "mal", r=0.07, head=0.32)
    marker = sphere(0.22, "mal", (plus.x + 0.05, -0.1, 0.7))
    marker2 = sphere(0.22, "mal", (minus.x - 0.05, -0.1, 0.7))
    camera((1.5, -13.0, 5.5), (0.0, 0, 1.9), 44)
    render(f"{OUT}/e_corto_mal.webp", W, H)


@image("circuito", "e_corto_bien")
def e_corto_bien():
    P = Parts()
    # caja de plastico abierta con las pilas dentro y el clip fuera
    wall = "gris"
    box(8.6, 0.25, 1.6, wall, (0, 2.1, 0.8))
    box(8.6, 0.25, 1.6, wall, (0, -2.1, 0.8))
    box(0.25, 4.2, 1.6, wall, (-4.3, 0, 0.8))
    box(0.25, 4.2, 1.6, wall, (4.3, 0, 0.8))
    box(8.6, 4.2, 0.2, wall, (0, 0, 0.1))
    for y in (-1.0, 1.0):
        # pilas tumbadas: una con el + a cada lado (no se tocan los polos de dos pilas distintas)
        cell(P, 0.0, y, 0.9, "x", plus=1 if y > 0 else -1)
    P.color_all()
    # clip fuera, lejos
    wire([(6.2, -2.0, 0.1), (6.2, -2.0, 0.6), (7.6, -2.0, 0.6), (7.6, -2.0, 0.1)], "eje", r=0.09, fillet=0.2)
    marker = sphere(0.22, "bien", (4.3, -0.3, 2.3))
    camera((2.0, -15.0, 9.5), (1.5, 0, 0.6), 44)
    render(f"{OUT}/e_corto_bien.webp", W, H)


# ---------------------------------------------------------------- MOTORES

@image("motores", "m_tipos")
def m_tipos():
    # motor de CC: cilindro con eje y dos bornes
    x = -5.8
    cyl(0.95, 2.8, "gris", (x, 0.5, 1.0), "y", seg=36)
    cyl(0.97, 0.3, "oscuro", (x, 1.95, 1.0), "y", seg=36)
    cyl(0.14, 1.5, "eje", (x, -1.6, 1.0), "y")
    for dx in (-0.4, 0.4):
        box(0.18, 0.4, 0.55, "eje", (x + dx, 2.3, 0.8))
    # servo: caja con orejas, brazo de salida y cable de tres hilos
    x = 0.0
    box(2.4, 1.3, 2.6, "azul", (x, 0.3, 1.3))
    box(3.5, 0.25, 0.7, "azul", (x, 0.3, 0.45))
    cyl(0.42, 0.5, "eje", (x + 0.35, -0.55, 2.6), "y")
    box(1.7, 0.18, 0.3, "masa", (x + 0.35 + 0.55, -0.9, 2.6))
    for k, c in enumerate(("rojo", "amarillo", "oscuro")):
        wire([(x - 0.4 + k * 0.4, 1.0, 0.8), (x - 0.4 + k * 0.4, 2.2, 0.5), (x - 0.4 + k * 0.4, 3.4, 0.3)], c, r=0.05, fillet=0.4)
    # paso a paso: cuerpo cuadrado con brida frontal
    x = 6.0
    box(2.5, 2.6, 2.5, "oscuro", (x, 0.9, 1.25))
    box(2.7, 0.3, 2.7, "gris", (x, -0.55, 1.35))
    cyl(0.17, 1.4, "eje", (x, -1.5, 1.35), "y")
    for dx in (-1.0, 1.0):
        for dz in (-1.0, 1.0):
            cyl(0.12, 0.12, "eje", (x + dx, -0.74, 1.35 + dz), "y")
    wire([(x, 2.2, 0.8), (x, 3.0, 0.5), (x + 0.5, 4.0, 0.3)], "rojo", r=0.05)
    camera((0.0, -25.0, 10.5), (0.0, 0.3, 1.2), 44)
    render(f"{OUT}/m_tipos.webp", W, H)


GZ = 3.0


def build_reductor(P, jam=False):
    """Motor detras de la placa y reduccion 8-24 + 8-24 (9:1). Etapas: 1 placa y motor, 2 piñon, 3 primera rueda, 4 segunda etapa."""
    plate = P.add(beam(11, "gris"), "gris", 1); plane(plate, 0, GZ, 0)
    # el motor va por detras de la placa (y > 0), con su eje atravesandola
    mo = P.add(cyl(1.0, 3.0, "rojo", (1.0, 2.4, GZ), "y", seg=36), "rojo", 1)
    cap = P.add(cyl(1.02, 0.3, "oscuro", (1.0, 3.95, GZ), "y", seg=36), "oscuro", 1)
    face = P.add(cyl(0.6, 0.12, "gris", (1.0, 0.94, GZ), "y"), "gris", 1)
    sh = P.add(axle(3.2), "eje", 1); plane(sh, 1.0, GZ, 1.0)
    xs = [1.0, 3.0, 5.0]
    r24 = math.pi + math.pi / 24
    g1 = P.add(gear(8, "azul"), "azul", 2); plane(g1, xs[0], GZ, 0.9, rot=0.0)
    ax2 = P.add(axle(4.4), "eje", 3); plane(ax2, xs[1], GZ, 1.2)
    g2 = P.add(gear(24, "gris"), "gris", 3); plane(g2, xs[1], GZ, 0.9, rot=r24)
    g2b = P.add(gear(8, "azul"), "azul", 4); plane(g2b, xs[1], GZ, 2.1, rot=0.0)
    ax3 = P.add(axle(4.4), "eje", 4); plane(ax3, xs[2], GZ, 1.2)
    g3 = P.add(gear(24, "amarillo"), "amarillo", 4); plane(g3, xs[2], GZ, 2.1, rot=r24)
    return xs


def reductor_cam():
    camera((6.5, -19.0, GZ + 6.2), (3.0, 0.6, GZ - 0.2), 50)


def _m_step(k):
    P = Parts()
    build_reductor(P)
    P.show(k)
    reductor_cam()


@image("motores", "m_s1")
def m_s1():
    _m_step(1); render(f"{OUT}/m_s1.webp", W, H)


@image("motores", "m_s2")
def m_s2():
    _m_step(2); render(f"{OUT}/m_s2.webp", W, H)


@image("motores", "m_s3")
def m_s3():
    _m_step(3); render(f"{OUT}/m_s3.webp", W, H)


@image("motores", "m_s4")
def m_s4():
    _m_step(4); render(f"{OUT}/m_s4.webp", W, H)


@image("motores", "m_hero")
def m_hero():
    P = Parts()
    xs = build_reductor(P)
    P.color_all()
    arc_arrow((xs[0], -3.0, GZ), 1.5, math.radians(125), math.radians(55), "cian", r=0.04)
    arc_arrow((xs[2], -3.0, GZ), 2.3, math.radians(125), math.radians(55), "acento", r=0.12)
    reductor_cam()
    render(f"{OUT}/m_hero.webp", W, H)


@image("motores", "m_error_mal")
def m_error_mal():
    """Algo atasca la ultima rueda: el motor sigue empujando."""
    P = Parts()
    xs = build_reductor(P)
    P.color_all()
    # una viga atravesada contra los dientes de la rueda grande
    blk = beam(4, "mal"); plane(blk, xs[2] + 1.95, GZ - 1.5, 2.1, rot=math.radians(90))
    arc_arrow((xs[0], -3.0, GZ), 1.5, math.radians(125), math.radians(55), "mal", r=0.04)
    reductor_cam()
    render(f"{OUT}/m_error_mal.webp", W, H)


@image("motores", "m_error_bien")
def m_error_bien():
    P = Parts()
    xs = build_reductor(P)
    P.color_all()
    arc_arrow((xs[0], -3.0, GZ), 1.5, math.radians(125), math.radians(55), "bien", r=0.04)
    arc_arrow((xs[2], -3.0, GZ), 2.3, math.radians(125), math.radians(55), "bien", r=0.12)
    reductor_cam()
    render(f"{OUT}/m_error_bien.webp", W, H)


# ---------------------------------------------------------------- BATERIAS

def pouch(P, x, y, z, swollen=False, stage=1, color="azul"):
    """Bateria plana de litio con dos cables. Hinchada = abombada."""
    if swollen:
        P.add(sphere(1.0, color, (x, y, z + 0.95), scale=(2.2, 1.25, 0.95)), color, stage)
    else:
        P.add(box(4.4, 2.5, 0.5, color, (x, y, z + 0.25), bevel=0.06), color, stage)
    P.add(wire([(x + 2.2, y + 0.3, z + 0.25), (x + 3.4, y + 0.3, z + 0.25), (x + 4.2, y + 0.9, z + 0.25)], "rojo", r=0.07), "rojo", stage)
    P.add(wire([(x + 2.2, y - 0.3, z + 0.25), (x + 3.4, y - 0.3, z + 0.25), (x + 4.2, y - 0.9, z + 0.25)], "oscuro", r=0.07), "oscuro", stage)


def station(P, stage_tile=1, stage_pouch=2, stage_charger=3, stage_bin=4):
    P.add(box(9.0, 5.2, 0.3, "gris", (0.5, 0.0, 0.15), bevel=0.05), "gris", stage_tile)
    pouch(P, -1.8, 0.0, 0.3, False, stage_pouch)
    # cargador con piloto y cable de red (solo el cuerpo; sin enchufe)
    P.add(box(1.8, 1.4, 1.0, "oscuro", (4.6, -0.2, 0.8)), "oscuro", stage_charger)
    P.add(sphere(0.14, "verde", (4.6, -0.95, 1.0)), "verde", stage_charger)
    P.add(wire([(4.6 - 0.9, -0.2, 0.6), (4.1, -0.2, 0.6), (3.0, 0.5, 0.5), (2.4, 0.9, 0.4)], "rojo", r=0.07), "rojo", stage_charger)
    # contenedor de reciclaje
    P.add(cyl(1.1, 1.8, "verde", (8.2, 1.2, 1.0)), "verde", stage_bin)
    P.add(box(1.2, 0.3, 0.12, "oscuro", (8.2, 1.2, 1.95)), "oscuro", stage_bin)


def station_cam():
    camera((3.0, -15.0, 9.5), (3.0, 0.2, 0.5), 44)


def _b_step(k):
    P = Parts()
    station(P)
    P.show(k)
    station_cam()


@image("bateria", "b_s1")
def b_s1():
    _b_step(1); render(f"{OUT}/b_s1.webp", W, H)


@image("bateria", "b_s2")
def b_s2():
    _b_step(2); render(f"{OUT}/b_s2.webp", W, H)


@image("bateria", "b_s3")
def b_s3():
    _b_step(3); render(f"{OUT}/b_s3.webp", W, H)


@image("bateria", "b_s4")
def b_s4():
    _b_step(4); render(f"{OUT}/b_s4.webp", W, H)


@image("bateria", "b_hero")
def b_hero():
    P = Parts()
    station(P)
    P.color_all()
    marker = sphere(0.24, "bien", (-1.8, -3.4, 0.9))
    station_cam()
    render(f"{OUT}/b_hero.webp", W, H)


@image("bateria", "b_hinchada_mal")
def b_hinchada_mal():
    P = Parts()
    P.add(box(9.0, 5.2, 0.3, "gris", (0.5, 0.0, 0.15), bevel=0.05), "gris", 1)
    pouch(P, 0.0, 0.0, 0.3, True, 1)
    P.color_all()
    for x in (-1.2, 0.0, 1.2):
        arrow((x, 0, 2.2), (x, 0, 3.6), "mal", r=0.07, head=0.32)
    camera((1.0, -12.5, 6.0), (1.5, 0, 0.7), 44)
    render(f"{OUT}/b_hinchada_mal.webp", W, H)


@image("bateria", "b_hinchada_bien")
def b_hinchada_bien():
    P = Parts()
    P.add(box(9.0, 5.2, 0.3, "gris", (0.5, 0.0, 0.15), bevel=0.05), "gris", 1)
    # la bateria dañada, dentro de una caja metalica abierta, sobre la baldosa y lejos de todo
    for loc, size in (((0, 2.0, 1.1), (5.6, 0.2, 2.0)), ((0, -2.0, 1.1), (5.6, 0.2, 2.0)), ((-2.8, 0, 1.1), (0.2, 4.2, 2.0)), ((2.8, 0, 1.1), (0.2, 4.2, 2.0))):
        P.add(box(size[0], size[1], size[2], "eje", loc), "eje", 1)
    P.add(box(5.6, 4.2, 0.12, "eje", (0, 0, 0.36)), "eje", 1)
    pouch(P, -0.6, 0.0, 0.4, True, 1)
    P.color_all()
    sphere(0.25, "bien", (0.0, -3.2, 2.0))
    camera((1.0, -12.5, 7.5), (0.8, 0, 0.9), 44)
    render(f"{OUT}/b_hinchada_bien.webp", W, H)


@image("bateria", "b_mezcla_mal")
def b_mezcla_mal():
    P = Parts()
    cell_row(P, 4, ["azul", "azul", "amarillo", "azul"])
    P.color_all()
    xs = [-1.0 - 3 * 1.9 + k * 3.8 for k in range(4)]
    sphere(0.28, "mal", (xs[2], -1.2, 1.9))
    camera((-0.5, -23.0, 9.0), (-0.5, 0, 1.0), 44)
    render(f"{OUT}/b_mezcla_mal.webp", W, H)


@image("bateria", "b_mezcla_bien")
def b_mezcla_bien():
    P = Parts()
    cell_row(P, 4, ["azul"] * 4)
    P.color_all()
    xs = [-1.0 - 3 * 1.9 + k * 3.8 for k in range(4)]
    for x in xs:
        sphere(0.28, "bien", (x, -1.2, 1.9))
    camera((-0.5, -23.0, 9.0), (-0.5, 0, 1.0), 44)
    render(f"{OUT}/b_mezcla_bien.webp", W, H)


# ---------------------------------------------------------------- principal

def main():
    todo = [(n, g, f) for n, (g, f) in IMAGES.items() if (GROUP in ("all", g)) and (not ONLY or n in ONLY)]
    begin()
    floor = bpy.data.objects["Suelo"]
    for n, g, f in todo:
        floor.location.z = -0.02 if (g in ("circuito", "bateria") or n == "m_tipos") else -3.2
        f()
        purge()
    print("HECHO", len(todo))


main()
