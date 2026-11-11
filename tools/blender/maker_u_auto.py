"""
Maker Student - imagenes de la unidad "Automatizacion de lo cotidiano".

Uso (desde la raiz del repo):
  blender -b --factory-startup --python tools/blender/maker_u_auto.py -- [sensores|ascensor|idear|all] [nombre_imagen ...]

Cada imagen es una funcion que construye la escena, la renderiza a
public/assets/img/auto/<nombre>.webp y la limpia. En las imagenes de montaje paso a paso,
lo nuevo sale en color y lo anterior en gris. Piezas genericas (sensor, motor, final de
carrera, cabina...) definidas aqui con primitivas; las vigas vienen de maker_lib.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import maker_lib as ML
from maker_lib import *

OUT = os.path.join(ROOT, "public", "assets", "img", "auto")
args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else ["all"]
GROUP = args[0] if args else "all"
ONLY = set(args[1:])
W, H = 1280, 720
SAMPLES = int(os.environ.get("MAKER_SAMPLES", "40"))

COLORS["amarillo2"] = "#f9d27a"

KEEP = set()
IMAGES = {}


def image(group, name):
    def deco(fn):
        IMAGES[name] = (group, fn)
        return fn
    return deco


def begin():
    reset()
    studio(floor_z=0.0, size=300)
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
    """Lista de piezas con una etapa; `show(k)` pinta lo nuevo en color y lo anterior en gris."""

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

    def full(self):
        for o, color, stage in self.items:
            set_mat(o, color)


# ---------------------------------------------------------------- piezas propias

def box(sx, sy, sz, loc, color, bevel=0.02):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Diagonal((sx, sy, sz, 1)))
    o = ML._to_obj("caja", bm, color, smooth_sides=False, bevel=bevel)
    o.location = loc
    return o


def cyl(r, depth, loc, color, axis="z", seg=36, bevel=0.015):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r, radius2=r, depth=depth)
    o = ML._to_obj("cil", bm, color, bevel=bevel)
    o.location = loc
    if axis == "y":
        o.rotation_euler = (math.pi / 2, 0, 0)
    elif axis == "x":
        o.rotation_euler = (0, math.pi / 2, 0)
    return o


def sphere(r, loc, color):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=28, ring_count=16)
    o = bpy.context.active_object
    o.data.materials.append(M(color))
    for p in o.data.polygons:
        p.use_smooth = True
    return o


def dbl_arrow(a, b, color="cian", r=0.04, head=0.22):
    mid = tuple((a[i] + b[i]) / 2 for i in range(3))
    arrow(mid, a, color, r=r, head=head)
    arrow(mid, b, color, r=r, head=head)


def tilt_y(o, pivot, deg):
    """Gira un objeto alrededor del eje Y por `pivot` (x, z). Positivo: el lado +X baja."""
    bpy.context.view_layer.update()
    group_rotate([o], pivot, math.radians(deg))


# ---------------------------------------------------------------- SENSORES Y ACTUADORES

def sensor_obj(x, parts=None, stage=1, y=0.0):
    s = []
    base = box(1.6, 1.4, 1.3, (x, y, 0.65), "azul", 0.05)
    eye = sphere(0.5, (x, y - 0.55, 0.85), "masa")
    pupil = sphere(0.24, (x, y - 0.98, 0.85), "oscuro")
    for o, c in ((base, "azul"), (eye, "masa"), (pupil, "oscuro")):
        if parts is not None:
            parts.add(o, c, stage)
    return base


def brain_obj(x, parts=None, stage=1, y=0.0):
    body = box(2.0, 1.6, 1.0, (x, y, 0.5), "amarillo", 0.05)
    leds = [cyl(0.16, 0.12, (x - 0.5 + i * 0.5, y - 0.3, 1.06), c, bevel=0.0) for i, c in enumerate(("verde", "rojo", "azul"))]
    for o, c in [(body, "amarillo")] + list(zip(leds, ("verde", "rojo", "azul"))):
        if parts is not None:
            parts.add(o, c, stage)
    return body


def motor_obj(x, parts=None, stage=1, y=0.0):
    body = cyl(0.62, 1.5, (x, y, 0.75), "rojo", axis="x", bevel=0.03)
    cap = box(0.5, 1.3, 1.3, (x - 0.9, y, 0.75), "gris", 0.04)
    shaft = cyl(0.1, 0.9, (x + 1.15, y, 0.75), "eje", axis="x", bevel=0.0)
    g = ML.gear(8, "amarillo")
    g.matrix_world = Matrix.Translation((x + 1.4, y, 0.75)) @ Matrix.Rotation(math.pi / 2, 4, "X")
    for o, c in ((body, "rojo"), (cap, "gris"), (shaft, "eje"), (g, "amarillo")):
        if parts is not None:
            parts.add(o, c, stage)
    return body


def cam_blocks(dist=19.0):
    camera((1.6, -dist, 6.8), (1.0, 0, 1.2), 50)


@image("sensores", "a_bloques")
def a_bloques():
    box(11.0, 3.4, 0.2, (0.8, 0, -0.1), "oscuro", 0.03)
    sensor_obj(-3.4)
    brain_obj(0.8)
    motor_obj(5.0)
    for (x0, x1) in ((-2.3, -0.6), (2.0, 3.1)):
        arrow((x0, -0.1, 0.6), (x1, -0.1, 0.6), "acento", r=0.09, head=0.4)
    cam_blocks()
    render(f"{OUT}/a_bloques.webp", W, H)


@image("sensores", "a_lazo")
def a_lazo():
    box(11.0, 3.6, 0.2, (0.8, 0, -0.1), "oscuro", 0.03)
    sensor_obj(-3.4)
    brain_obj(0.8)
    motor_obj(5.0)
    for (x0, x1) in ((-2.3, -0.6), (2.0, 3.1)):
        arrow((x0, -0.1, 0.6), (x1, -0.1, 0.6), "acento", r=0.09, head=0.4)
    # camino de vuelta por encima: lo que hace la salida se mide y vuelve a la entrada
    rope([(5.0, 0, 1.5), (5.0, 0, 3.0), (-3.4, 0, 3.0)], "cian", 0.07)
    arrow((-3.4, 0, 3.0), (-3.4, 0, 1.45), "cian", r=0.07, head=0.45)
    cam_blocks()
    render(f"{OUT}/a_lazo.webp", W, H)


def build_fc(state):
    """Carro sobre un carril que avanza hacia un tope. state: 'lejos', 'pulsado' o 'sin' (sin final de carrera)."""
    box(15.0, 3.0, 0.3, (4.6, 0, 0.15), "oscuro", 0.04)
    box(11.2, 1.4, 0.3, (4.9, 0, 0.45), "gris", 0.03)                 # carril
    box(1.4, 1.6, 1.6, (-1.9, 0, 1.1), "azul", 0.05)                  # motor
    cyl(0.25, 0.5, (-1.0, 0, 1.0), "eje", axis="x", bevel=0.0)
    box(0.5, 1.4, 1.5, (10.4, 0, 1.05), "gris", 0.04)                 # tope
    cx = {"lejos": 3.6, "pulsado": 6.9, "sin": 8.95}[state]
    box(1.6, 1.2, 0.8, (cx, 0, 1.0), "amarillo", 0.05)                # carro
    box(0.2, 0.9, 0.45, (cx + 0.9, 0, 1.0), "verde", 0.02)            # parachoques
    rope([(-0.9, 0, 1.0), (cx - 0.8, 0, 1.0)], "cuerda", 0.05)       # hilo del motor al carro
    if state != "sin":
        box(0.8, 1.0, 0.7, (9.65, 0, 0.95), "rojo", 0.04)             # cuerpo del final de carrera
        lever = box(1.5, 0.3, 0.1, (8.65, 0, 1.0), "eje", 0.0)        # palanca, articulada en su extremo derecho
        if state == "lejos":
            bpy.context.view_layer.update()
            group_rotate([lever], (9.4, 1.0), math.radians(28))
    return cx


def cam_fc():
    camera((5.2, -19.5, 6.2), (4.6, 0, 1.1), 50)


@image("sensores", "a_fc_lejos")
def a_fc_lejos():
    cx = build_fc("lejos")
    arrow((cx - 0.8, -1.2, 2.3), (cx + 1.6, -1.2, 2.3), "acento", r=0.09, head=0.4)
    cam_fc()
    render(f"{OUT}/a_fc_lejos.webp", W, H)


@image("sensores", "a_fc_pulsado")
def a_fc_pulsado():
    cx = build_fc("pulsado")
    arrow((cx - 2.6, -1.2, 2.3), (cx - 0.7, -1.2, 2.3), "mal", r=0.09, head=0.4)   # lo que debe parar
    sphere(0.24, (9.65, -0.9, 1.7), "bien")                                          # senal de aviso
    cam_fc()
    render(f"{OUT}/a_fc_pulsado.webp", W, H)


@image("sensores", "a_fc_sin")
def a_fc_sin():
    cx = build_fc("sin")
    arrow((cx - 3.0, -1.2, 2.3), (cx - 0.7, -1.2, 2.3), "mal", r=0.11, head=0.45)
    sphere(0.24, (cx + 1.15, -0.9, 1.0), "mal")
    cam_fc()
    render(f"{OUT}/a_fc_sin.webp", W, H)


# ---------------------------------------------------------------- ASCENSOR

PC = (3.5, 7.0)   # centro de la polea (x, z)
PR_ = 1.6         # radio de la polea
YR = -2.0         # plano de la cuerda, la cabina y el contrapeso
CAB_X, CW_X = PC[0] - PR_, PC[0] + PR_
CAB_H = 2.2


def rope_over(cab_top, cw_top, with_cw=True):
    pts = [(CAB_X, YR, cab_top), (CAB_X, YR, PC[1])]
    n = 28
    for i in range(1, n):
        a = math.pi - math.pi * i / n
        pts.append((PC[0] + PR_ * math.cos(a), YR, PC[1] + PR_ * math.sin(a)))
    pts.append((CW_X, YR, PC[1]))
    pts.append((CW_X, YR, cw_top if with_cw else PC[1] - 1.1))
    return pts


def build_elevator(cab_z=2.2, cw_top=4.8, with_cw=True, with_sensors=False):
    P = Parts()
    for x in (0, 7):
        b = P.add(beam(10, "gris"), "gris", 1); plane(b, x, 0, 0, rot=math.pi / 2)
    bb = P.add(beam(8, "gris"), "gris", 1); plane(bb, 0, 0, 0)
    tb = P.add(beam(8, "gris"), "gris", 1); plane(tb, 0, 9, 0)
    br = P.add(beam(3, "azul"), "azul", 2); plane(br, PC[0], PC[1], 1, rot=math.pi / 2)
    pl = P.add(pulley(PR_, "rojo", 0.55), "rojo", 2); plane(pl, PC[0], PC[1], 2.0)
    ax = P.add(axle(3.0), "eje", 2); plane(ax, PC[0], PC[1], 1.8)
    mot = P.add(cyl(0.62, 1.1, (PC[0], -3.3, PC[1]), "azul", axis="y"), "azul", 2)
    # cabina: caja con puerta de dos hojas
    cz = cab_z + CAB_H / 2
    cab = P.add(box(1.8, 1.4, CAB_H, (CAB_X, YR, cz), "amarillo", 0.05), "amarillo", 3)
    d1 = P.add(box(0.78, 0.06, CAB_H - 0.5, (CAB_X - 0.42, YR - 0.72, cz - 0.1), "oscuro", 0.01), "oscuro", 3)
    d2 = P.add(box(0.78, 0.06, CAB_H - 0.5, (CAB_X + 0.42, YR - 0.72, cz - 0.1), "oscuro", 0.01), "oscuro", 3)
    P.add(rope(rope_over(cab_z + CAB_H, cw_top, with_cw), "cuerda", 0.05), "cuerda", 3)
    if with_cw:
        m, h = weight(3, "masa", 1.0)
        m.location = (CW_X, YR, cw_top - h)
        P.add(m, "masa", 4)
    if with_sensors:
        for z in (1.2, 6.4):
            sw = P.add(box(0.5, 0.6, 0.55, (0.95, -1.0, z), "rojo", 0.03), "rojo", 5)
            lv = P.add(box(0.5, 0.08, 0.12, (1.4, -1.0, z + (0.2 if z < 3 else -0.2)), "eje", 0.0), "eje", 5)
    return P, cab_z + CAB_H


def cam_elev():
    camera((8.0, -26, 7.6), (3.5, 0, 4.3), 50)


for _k in (1, 2, 3, 4, 5):
    def _mk(k):
        @image("ascensor", f"a_asc_s{k}")
        def _f():
            P, _ = build_elevator(with_sensors=True)
            P.show(k)
            cam_elev()
            render(f"{OUT}/a_asc_s{k}.webp", W, H)
        return _f
    _mk(_k)


def weight_arrows(down_cab, down_cw, z0=3.4, y=-3.1):
    arrow((CAB_X + 0.6, y, z0), (CAB_X + 0.6, y, z0 - down_cab), "acento", r=0.08, head=0.36)
    arrow((CW_X, y, z0 + 0.4), (CW_X, y, z0 + 0.4 - down_cw), "acento", r=0.08, head=0.36)


@image("ascensor", "a_asc_hero")
def a_asc_hero():
    P, _ = build_elevator(with_sensors=True)
    P.full()
    weight_arrows(1.8, 2.2)
    cam_elev()
    render(f"{OUT}/a_asc_hero.webp", W, H)


@image("ascensor", "a_asc_con")
def a_asc_con():
    P, _ = build_elevator()
    P.full()
    weight_arrows(1.8, 2.2)
    # la diferencia que compensa el motor (pequena)
    arrow((CAB_X - 0.6, -3.1, 3.4), (CAB_X - 0.6, -3.1, 3.0), "cian", r=0.06, head=0.3)
    cam_elev()
    render(f"{OUT}/a_asc_con.webp", W, H)


@image("ascensor", "a_asc_sin")
def a_asc_sin():
    P, _ = build_elevator(with_cw=False)
    P.full()
    arrow((CAB_X + 0.6, -3.1, 3.6), (CAB_X + 0.6, -3.1, 1.8), "acento", r=0.08, head=0.36)
    arrow((CAB_X - 0.6, -3.1, 4.7), (CAB_X - 0.6, -3.1, 6.5), "cian", r=0.08, head=0.36)
    cam_elev()
    render(f"{OUT}/a_asc_sin.webp", W, H)


@image("ascensor", "a_puerta")
def a_puerta():
    # puerta automatica de dos hojas con sensor de presencia y una persona en el hueco
    box(8.0, 1.0, 0.7, (0, 0, 5.35), "gris", 0.05)         # dintel
    for sx in (-4.3, 4.3):
        box(0.6, 1.0, 5.4, (sx, 0, 2.7), "gris", 0.05)      # jambas
    box(9.2, 2.4, 0.2, (0, -0.3, -0.1), "oscuro", 0.03)
    # hojas medio abiertas: hueco central de 1.6
    for sx in (-1, 1):
        box(3.0, 0.3, 5.0, (sx * 2.45, -0.2, 2.5), "azul", 0.04)
    # sensor sobre el dintel y su haz
    box(1.0, 0.8, 0.6, (0, -0.7, 5.95), "rojo", 0.04)
    cyl(0.2, 0.1, (0, -1.12, 5.95), "cian", axis="y", bevel=0.0)
    rope([(0, -1.2, 5.65), (0, -1.2, 0.2)], "cian", 0.05)
    # persona en el hueco
    cyl(0.42, 1.9, (0, -0.9, 1.5), "verde", seg=32, bevel=0.03)
    sphere(0.38, (0, -0.9, 2.78), "masa")
    # las hojas quieren abrirse (se paran y vuelven a abrir)
    arrow((-1.2, -0.6, 4.4), (-2.6, -0.6, 4.4), "acento", r=0.09, head=0.38)
    arrow((1.2, -0.6, 4.4), (2.6, -0.6, 4.4), "acento", r=0.09, head=0.38)
    camera((3.2, -13.5, 4.6), (0, 0, 2.7), 50)
    render(f"{OUT}/a_puerta.webp", W, H)


# ---------------------------------------------------------------- IDEAR (cortina)

SL_N = 8
SL_H = 0.16
TOP_Z = 6.6
SPOOL_Z = 7.2
SPOOLS = (1.2, 4.8)


def build_cortina(bar_z, with_switch=True, switch_pressed=False):
    P = Parts()
    for x in (0, 6):
        b = P.add(beam(9, "gris"), "gris", 1); plane(b, x, 0, 0, rot=math.pi / 2)
    tb = P.add(beam(7, "gris"), "gris", 1); plane(tb, 0, 8, 0)
    # eje y carretes
    ax = P.add(cyl(0.11, 6.6, (3.0, -1.0, SPOOL_Z), "eje", axis="x", bevel=0.0), "eje", 2)
    for sx in SPOOLS:
        P.add(cyl(0.48, 0.55, (sx, -1.0, SPOOL_Z), "amarillo", axis="x", bevel=0.03), "amarillo", 2)
    mot = P.add(cyl(0.6, 1.4, (5.45, -1.0, SPOOL_Z), "azul", axis="x", bevel=0.03), "azul", 2)
    red = P.add(box(0.8, 1.0, 1.1, (6.5, -1.0, SPOOL_Z), "gris", 0.04), "gris", 2)
    # cortina de laminas y barra inferior
    y = -0.8
    span = TOP_Z - bar_z
    for i in range(SL_N):
        z = bar_z + 0.2 + i * max(SL_H, (span - 0.2 - SL_H) / (SL_N - 1))
        P.add(box(3.4, 0.1, SL_H - 0.02, (3.0, y, z), "verde", 0.0), "verde", 3)
    bar = P.add(box(4.2, 0.28, 0.24, (3.0, y, bar_z), "rojo", 0.03), "rojo", 3)
    for sx in SPOOLS:
        P.add(rope([(sx, -1.0 - 0.48, SPOOL_Z), (sx, -1.0 - 0.48, bar_z + 0.05)], "cuerda", 0.035), "cuerda", 3)
    if with_switch:
        # final de carrera en la jamba izquierda: su palanca baja hasta la barra y la barra lo pulsa al llegar arriba
        P.add(box(0.4, 0.5, 0.5, (0.65, y, 6.3), "rojo", 0.03), "rojo", 4)
        P.add(box(0.1, 0.2, 0.8, (0.9, y, 5.85), "eje", 0.0), "eje", 4)
        P.add(box(0.45, 0.2, 0.08, (1.1, y, 5.47), "eje", 0.0), "eje", 4)
    return P


def cam_cortina():
    camera((6.5, -22, 7.4), (3.0, 0, 4.0), 50)


for _k in (1, 2, 3, 4):
    def _mk2(k):
        @image("idear", f"a_cort_s{k}")
        def _f():
            P = build_cortina(3.0)
            P.show(k)
            cam_cortina()
            render(f"{OUT}/a_cort_s{k}.webp", W, H)
        return _f
    _mk2(_k)


@image("idear", "a_cort_hero")
def a_cort_hero():
    P = build_cortina(3.0)
    P.full()
    arrow((3.0, -1.6, 2.2), (3.0, -1.6, 3.9), "acento", r=0.09, head=0.4)
    cam_cortina()
    render(f"{OUT}/a_cort_hero.webp", W, H)


@image("idear", "a_cort_mal")
def a_cort_mal():
    # sin final de carrera: la barra llega arriba y el motor sigue tirando
    P = build_cortina(5.3, with_switch=False)
    P.full()
    arrow((3.0, -1.6, 4.2), (3.0, -1.6, 5.8), "mal", r=0.09, head=0.4)
    sphere(0.22, (3.0, -1.4, 6.05), "mal")
    cam_cortina()
    render(f"{OUT}/a_cort_mal.webp", W, H)


@image("idear", "a_cort_bien")
def a_cort_bien():
    # con final de carrera: la barra pulsa y el motor se para
    P = build_cortina(5.3, with_switch=True)
    P.full()
    sphere(0.2, (0.65, -1.25, 6.3), "bien")
    cam_cortina()
    render(f"{OUT}/a_cort_bien.webp", W, H)


# ---------------------------------------------------------------- principal

def main():
    todo = [(n, g, f) for n, (g, f) in IMAGES.items() if (GROUP in ("all", g)) and (not ONLY or n in ONLY)]
    begin()
    for n, g, f in todo:
        f()
        purge()
    print("HECHO", len(todo))


main()
