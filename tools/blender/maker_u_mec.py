"""
Maker Student - imagenes de la unidad "Mecanismos que mueven"
(tipos de movimiento, biela-manivela, levas, cremallera y tornillo sin fin, trinquete y cruz de Malta).

Uso (desde la raiz del repo):
  blender -b --factory-startup --python tools/blender/maker_u_mec.py -- [mov|biela|leva|cremallera|trinquete|all] [nombre_imagen ...]

Salida: public/assets/img/mec/<nombre>.webp. Las piezas nuevas (biela-manivela con piston, leva con seguidor,
cremallera, tornillo sin fin con rueda, trinquete con una, cruz de Malta) se definen aqui con las primitivas de maker_lib.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import maker_lib as L
from maker_lib import *

OUT = os.path.join(ROOT, "public", "assets", "img", "mec")
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

    def full(self):
        for o, color, stage in self.items:
            set_mat(o, color)


# ---------------------------------------------------------------- piezas nuevas

def poly(points, t, color, bevel=0.03, name="pieza", smooth=False):
    return L._to_obj(name, L._prism(points, t), color, smooth_sides=smooth, bevel=bevel)


def rect(w, h, t, color, bevel=0.03):
    return poly([(-w / 2, -h / 2), (w / 2, -h / 2), (w / 2, h / 2), (-w / 2, h / 2)], t, color, bevel)


def disc(r, t, color, n=64, bevel=0.02):
    pts = [(r * math.cos(2 * math.pi * i / n), r * math.sin(2 * math.pi * i / n)) for i in range(n)]
    return poly(pts, t, color, bevel, smooth=True)


def cyl(r, depth, color, seg=32):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r, radius2=r, depth=depth)
    return L._to_obj("cil", bm, color, bevel=0.015)


def arrow_xz(p0, p1, y, color="acento", r=0.07, head=0.28):
    return arrow((p0[0], y, p0[1]), (p1[0], y, p1[1]), color, r=r, head=head)


def cam(xm, zm, dist=22, lift=5.0, shift=3.0, lens=50):
    camera((xm + shift, -dist, zm + lift), (xm, 0, zm), lens)


def cutter_poly(points):
    bm = L._prism(points, 4.0)
    me = bpy.data.meshes.new("cutter")
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new("cutter", me)
    bpy.context.scene.collection.objects.link(o)
    return o


def cutter_cyl(x, y, r):
    return L._cyl_cutter([(x, y)], r=r, depth=4.0)


def helix_x(r, pitch, x0, x1, yc, zc, color="amarillo", bevel=0.06, phase=0.0):
    n_per = 32
    N = int((x1 - x0) / pitch * n_per)
    pts = [(x0 + pitch * i / n_per, yc + r * math.cos(phase + 2 * math.pi * i / n_per),
            zc + r * math.sin(phase + 2 * math.pi * i / n_per)) for i in range(N + 1)]
    return rope(pts, color, bevel)


def arc_x(cx, cy, cz, radius, a0, a1, color="acento", r=0.07):
    """Flecha curva alrededor del eje X, en el plano YZ (angulos medidos de +Y hacia +Z)."""
    n = 30
    pts = [(cx, cy + radius * math.cos(a0 + (a1 - a0) * i / n), cz + radius * math.sin(a0 + (a1 - a0) * i / n)) for i in range(n + 1)]
    o = rope(pts, color, r)
    tip = Vector(pts[-1])
    tang = (Vector(pts[-1]) - Vector(pts[-3])).normalized()
    arrow(tip - tang * 0.001, tip + tang * 0.36, color, r=r, head=0.36)
    return o


# ---------------------------------------------------------------- TIPOS DE MOVIMIENTO

@image("mov", "mv_cuatro")
def mv_cuatro():
    AY = -3.2
    # 1) rotativo: rueda con manivela
    w = pulley(1.6, "azul", 0.6); plane(w, 3, 9, 1.0)
    cr = beam(3, "rojo"); plane(cr, 3, 9, 1.8, rot=math.radians(35))
    hub = pin(1.6); plane(hub, 3, 9, 1.3)
    arc_arrow((3, AY, 9), 2.5, math.radians(130), math.radians(-10) + 0.0, "acento", r=0.08)
    # 2) lineal: carro por un carril
    rail = beam(9, "gris"); plane(rail, 8, 8, 0)
    car = rect(1.8, 1.2, 0.9, "verde"); plane(car, 10, 9.05, 0.0)
    arrow_xz((11.2, 9.05), (15.6, 9.05), AY, "acento", r=0.09, head=0.4)
    # 3) alternativo: piston entre dos guias
    for dz in (-0.95, 0.95):
        g = beam(8, "gris"); plane(g, 0, 1.0 + dz, 0)
    pis = rect(2.0, 0.96, 0.9, "amarillo"); plane(pis, 3.5, 1.0, 0.0)
    arrow_xz((4.8, 1.0), (7.6, 1.0), AY, "acento", r=0.08, head=0.36)
    arrow_xz((2.2, 1.0), (-0.6, 1.0), AY, "cian", r=0.08, head=0.36)
    # 4) oscilante: viga que se balancea en arco
    pv = (13.0, 5.2)
    bar = beam(6, "rojo"); plane(bar, pv[0], pv[1], 0.5, rot=math.radians(-90 + 18))
    pn = pin(2.2); plane(pn, pv[0], pv[1], 0.5)
    arc_arrow((pv[0], AY, pv[1]), 5.9, math.radians(-94), math.radians(-128), "cian", r=0.08)
    arc_arrow((pv[0], AY, pv[1]), 5.9, math.radians(-86), math.radians(-52), "acento", r=0.08)
    camera((8.5, -37, 9.0), (8.2, 0, 4.8), 50); render(f"{OUT}/mv_cuatro.webp", W, H)


# ---------------------------------------------------------------- BIELA-MANIVELA

BC = (2.0, 4.0)
BR = 2.0
BL = 7.0


def slider_x(th):
    return BC[0] + BR * math.cos(th) + math.sqrt(BL ** 2 - (BR * math.sin(th)) ** 2)


def build_crank(th):
    P = Parts()
    sup = P.add(beam(5, "gris"), "gris", 1); plane(sup, BC[0], 2.0, 0, rot=math.pi / 2)
    for dz in (-0.95, 0.95):
        g = P.add(beam(11, "gris"), "gris", 1); plane(g, BC[0] + 0.9, BC[1] + dz, 0)
    ax = P.add(axle(2.1), "eje", 2); plane(ax, BC[0], BC[1], 0.5)
    cr = P.add(beam(3, "rojo"), "rojo", 2); plane(cr, BC[0], BC[1], 1.0, rot=th)
    xp = slider_x(th)
    pis = P.add(rect(1.6, 0.96, 1.8, "verde"), "verde", 3); plane(pis, xp, BC[1], 0.6)
    T = (BC[0] + BR * math.cos(th), BC[1] + BR * math.sin(th))
    ang = math.atan2(BC[1] - T[1], xp - T[0])
    rod = P.add(beam(8, "amarillo"), "amarillo", 4); plane(rod, T[0], T[1], 2.1, rot=ang)
    p1 = P.add(pin(2.4), "oscuro", 4); plane(p1, T[0], T[1], 1.55)
    p2 = P.add(pin(3.2), "oscuro", 4); plane(p2, xp, BC[1], 1.3)
    return P, xp


def crank_cam():
    camera((9.0, -26, 10.0), (6.8, 0, 3.6), 50)


@image("biela", "bm_s1")
def bm_s1():
    P, _ = build_crank(math.radians(50)); P.show(1); crank_cam(); render(f"{OUT}/bm_s1.webp", W, H)


@image("biela", "bm_s2")
def bm_s2():
    P, _ = build_crank(math.radians(50)); P.show(2); crank_cam(); render(f"{OUT}/bm_s2.webp", W, H)


@image("biela", "bm_s3")
def bm_s3():
    P, _ = build_crank(math.radians(50)); P.show(3); crank_cam(); render(f"{OUT}/bm_s3.webp", W, H)


@image("biela", "bm_s4")
def bm_s4():
    P, _ = build_crank(math.radians(50)); P.show(4); crank_cam(); render(f"{OUT}/bm_s4.webp", W, H)


@image("biela", "bm_hero")
def bm_hero():
    th = math.radians(50)
    P, xp = build_crank(th); P.full()
    arc_arrow((BC[0], -3.2, BC[1]), 2.9, math.radians(100), math.radians(190), "acento", r=0.07)
    arrow_xz((xp + 1.3, BC[1]), (xp + 3.0, BC[1]), -1.6, "cian", r=0.08, head=0.36)
    crank_cam(); render(f"{OUT}/bm_hero.webp", W, H)


def carrera_scene(good):
    th = math.pi / 2
    P, xp = build_crank(th); P.full()
    # fantasmas: el piston en los dos extremos del recorrido
    x_a, x_b = slider_x(math.pi), slider_x(0.0)
    for xg in (x_a, x_b):
        gp = rect(1.6, 0.96, 1.8, "ghost"); plane(gp, xg, BC[1], 0.6)
    y = -3.0
    z = 2.0
    if good:
        arrow_xz((x_a, z), (x_b, z), y, "bien", r=0.06, head=0.28)
        arrow_xz((x_b, z), (x_a, z), y, "bien", r=0.06, head=0.28)
        arrow_xz((BC[0] + 0.5, BC[1]), (BC[0] + 0.5, BC[1] + BR), y, "cian", r=0.05, head=0.22)
    else:
        arrow_xz((x_a, z), (x_a + BR, z), y, "mal", r=0.06, head=0.28)
        arrow_xz((BC[0] + 0.5, BC[1]), (BC[0] + 0.5, BC[1] + BR), y, "cian", r=0.05, head=0.22)
    crank_cam()
    render(f"{OUT}/bm_carrera_{'bien' if good else 'mal'}.webp", W, H)


@image("biela", "bm_carrera_bien")
def bm_carrera_bien():
    carrera_scene(True)


@image("biela", "bm_carrera_mal")
def bm_carrera_mal():
    carrera_scene(False)


# ---------------------------------------------------------------- LEVAS

CA = (4.0, 3.0)   # eje de la leva
CRD = 2.2         # radio del disco
CE = 1.0          # excentricidad (8 mm)


def cam_contact_z(phi, e=CE):
    xc, zc = CA[0] + e * math.cos(phi), CA[1] + e * math.sin(phi)
    return zc + math.sqrt(CRD ** 2 - (e * math.cos(phi)) ** 2)


def build_cam(phi, e=CE):
    P = Parts()
    post = P.add(beam(5, "gris"), "gris", 1); plane(post, CA[0], -1.0, 0, rot=math.pi / 2)
    for dx in (-0.95, 0.95):
        g = P.add(beam(4, "gris"), "gris", 1); plane(g, CA[0] + dx, 7.0, 0, rot=math.pi / 2)
    br = P.add(beam(3, "azul"), "azul", 1); plane(br, CA[0] - 0.95, 10.0, 1.0)
    ax = P.add(axle(2.2), "eje", 2); plane(ax, CA[0], CA[1], 0.5)
    xc, zc = CA[0] + e * math.cos(phi), CA[1] + e * math.sin(phi)
    dk = P.add(disc(CRD, 0.6, "amarillo"), "amarillo", 2); plane(dk, xc, zc, 1.0)
    hub = P.add(cyl(0.38, 0.8, "oscuro"), "oscuro", 2); plane(hub, CA[0], CA[1], 1.2)
    mk = P.add(cyl(0.2, 0.8, "rojo"), "rojo", 2); plane(mk, xc + (CRD - 0.5) * math.cos(phi), zc + (CRD - 0.5) * math.sin(phi), 1.2)
    zt = cam_contact_z(phi, e)
    fo = P.add(beam(8, "verde"), "verde", 3); plane(fo, CA[0], zt + 0.45, 0, rot=math.pi / 2)
    return P, zt


def cam_cam():
    camera((9.0, -34, 12.0), (4.2, 0, 5.3), 50)


@image("leva", "lv_s1")
def lv_s1():
    P, _ = build_cam(math.radians(90)); P.show(1); cam_cam(); render(f"{OUT}/lv_s1.webp", W, H)


@image("leva", "lv_s2")
def lv_s2():
    P, _ = build_cam(math.radians(90)); P.show(2); cam_cam(); render(f"{OUT}/lv_s2.webp", W, H)


@image("leva", "lv_s3")
def lv_s3():
    P, _ = build_cam(math.radians(90)); P.show(3); cam_cam(); render(f"{OUT}/lv_s3.webp", W, H)


def cam_marks(arrows=True):
    zlow = cam_contact_z(math.radians(270))
    zhigh = cam_contact_z(math.radians(90))
    for z in (zlow, zhigh):
        r = rect(1.0, 0.08, 0.1, "acento", 0.0)
        r.location = (CA[0] + 2.7, -2.4, z)
        r.rotation_euler = (math.pi / 2, 0, 0)
        set_mat(r, "acento")
    if arrows:
        arrow_xz((CA[0] + 3.5, zlow), (CA[0] + 3.5, zhigh), -2.4, "cian", r=0.05, head=0.25)
        arrow_xz((CA[0] + 3.5, zhigh), (CA[0] + 3.5, zlow), -2.4, "cian", r=0.05, head=0.25)


@image("leva", "lv_alto")
def lv_alto():
    P, _ = build_cam(math.radians(90)); P.full()
    cam_marks()
    arc_arrow((CA[0], -3.0, CA[1]), 3.0, math.radians(-30), math.radians(60), "acento", r=0.07)
    cam_cam(); render(f"{OUT}/lv_alto.webp", W, H)


@image("leva", "lv_bajo")
def lv_bajo():
    P, _ = build_cam(math.radians(270)); P.full()
    cam_marks()
    arc_arrow((CA[0], -3.0, CA[1]), 3.0, math.radians(-30), math.radians(60), "acento", r=0.07)
    cam_cam(); render(f"{OUT}/lv_bajo.webp", W, H)


@image("leva", "lv_hero")
def lv_hero():
    P, _ = build_cam(math.radians(35)); P.full()
    arc_arrow((CA[0], -3.0, CA[1]), 3.0, math.radians(-30), math.radians(60), "acento", r=0.07)
    arrow_xz((CA[0] + 3.5, 5.0), (CA[0] + 3.5, 7.2), -2.4, "cian", r=0.07, head=0.32)
    cam_cam(); render(f"{OUT}/lv_hero.webp", W, H)


@image("leva", "lv_error_mal")
def lv_error_mal():
    P, _ = build_cam(math.radians(35), e=0.0); P.full()
    arc_arrow((CA[0], -3.0, CA[1]), 3.0, math.radians(-30), math.radians(60), "acento", r=0.07)
    cam_cam(); render(f"{OUT}/lv_error_mal.webp", W, H)


# ---------------------------------------------------------------- CREMALLERA

RT = 12
RP = RT / 16.0                    # radio primitivo del piñon
PITCH_T = 2 * math.pi / RT        # paso angular
PP = math.pi * 2 * RP / RT        # paso lineal = pi / 8
RZC = 4.0                         # altura del eje del piñon
RXC = 6.0


def rack_poly(xc, n, zp):
    root = zp - 1.25 / 8
    tip = zp + 1.0 / 8
    bot = root - 0.644
    x0 = xc - (n // 2) * PP - 0.5 * PP
    pts = [(x0, bot), (x0, root)]
    for j in range(-(n // 2), n - n // 2):
        xj = xc + j * PP
        pts += [(xj - 0.3 * PP, root), (xj - 0.1 * PP, tip), (xj + 0.1 * PP, tip), (xj + 0.3 * PP, root)]
    x1 = xc + (n - n // 2) * PP - 0.5 * PP
    pts += [(x1, root), (x1, bot)]
    return pts


def build_rack(shift=0.0, drop=0.0):
    P = Parts()
    zp = RZC - RP
    zb = zp - 1.25 / 8 - 0.644 - 0.45
    base = P.add(beam(13, "gris"), "gris", 1); plane(base, RXC - 6, zb, 1.0)
    post = P.add(beam(5, "azul"), "azul", 1); plane(post, RXC, zb, 0, rot=math.pi / 2)
    pn = P.add(pin(2.1), "oscuro", 1); plane(pn, RXC, zb, 0.5)
    ax = P.add(axle(2.0), "eje", 2); plane(ax, RXC, RZC, 0.4)
    phi = shift / RP
    g = P.add(gear(RT, "azul"), "azul", 2); plane(g, RXC, RZC, 1.0, rot=PITCH_T / 2 + phi)
    rk = P.add(poly(rack_poly(RXC + shift, 30, zp - drop), 0.5, "amarillo", 0.015), "amarillo", 3); plane(rk, 0, 0, 1.0)
    ptr = P.add(beam(2, "rojo"), "rojo", 2); plane(ptr, RXC, RZC, 1.7, rot=math.radians(20) + phi)
    return P


def rack_cam():
    camera((RXC + 2.0, -13, RZC + 2.0), (RXC, 0, RZC - 0.7), 50)


@image("cremallera", "rk_s1")
def rk_s1():
    P = build_rack(); P.show(1); rack_cam(); render(f"{OUT}/rk_s1.webp", W, H)


@image("cremallera", "rk_s2")
def rk_s2():
    P = build_rack(); P.show(2); rack_cam(); render(f"{OUT}/rk_s2.webp", W, H)


@image("cremallera", "rk_s3")
def rk_s3():
    P = build_rack(); P.show(3); rack_cam(); render(f"{OUT}/rk_s3.webp", W, H)


@image("cremallera", "rk_hero")
def rk_hero():
    P = build_rack(shift=0.6); P.full()
    arc_arrow((RXC, -3.0, RZC), 1.6, math.radians(40), math.radians(150), "acento", r=0.06)
    arrow_xz((RXC - 1.2, RZC - RP - 1.5), (RXC + 2.2, RZC - RP - 1.5), -2.0, "cian", r=0.06, head=0.3)
    rack_cam(); render(f"{OUT}/rk_hero.webp", W, H)


@image("cremallera", "rk_error_mal")
def rk_error_mal():
    P = build_rack(drop=0.4); P.full(); rack_cam(); render(f"{OUT}/rk_error_mal.webp", W, H)


@image("cremallera", "rk_error_bien")
def rk_error_bien():
    P = build_rack(); P.full(); rack_cam(); render(f"{OUT}/rk_error_bien.webp", W, H)


# ---------------------------------------------------------------- TORNILLO SIN FIN

@image("cremallera", "sf_hero")
def sf_hero():
    t = 24
    rp = t / 16.0
    p = math.pi / 8
    xw, zw = 5.0, 5.0
    rwp = 0.4
    za = zw - rp - rwp
    plate = beam(4, "gris"); plane(plate, xw, 0.5, 0, rot=math.pi / 2)
    ax = axle(2.0); plane(ax, xw, zw, 0.4)
    g = gear(t, "amarillo"); plane(g, xw, zw, 1.0, rot=(2 * math.pi / t) / 2)
    xs = xw - p / 4 - 6 * p
    xe = xw + 2.6
    core = cyl(rwp - 0.156, xe - xw + 2.6 + 0.4, "eje")
    core.rotation_euler = (0, math.pi / 2, 0)
    core.location = ((xw - 2.6 + xe) / 2 - 0.0, -1.0, za)
    helix_x(rwp + 0.03, p, xs, xe, -1.0, za, "azul", bevel=0.07)
    stub1 = cyl(0.2, 1.0, "eje"); stub1.rotation_euler = (0, math.pi / 2, 0); stub1.location = (xw - 3.0, -1.0, za)
    stub2 = cyl(0.2, 1.0, "eje"); stub2.rotation_euler = (0, math.pi / 2, 0); stub2.location = (xe + 0.3, -1.0, za)
    arc_x(xw - 3.6, -1.0, za, 0.9, math.radians(90), math.radians(250), "acento", r=0.06)
    arc_arrow((xw, -3.0, zw), 2.4, math.radians(60), math.radians(120) - math.radians(180), "cian", r=0.06)
    camera((xw + 3.5, -12.5, zw + 1.5), (xw, 0, zw - 1.3), 50); render(f"{OUT}/sf_hero.webp", W, H)


# ---------------------------------------------------------------- TRINQUETE

TC = (4.0, 4.0)
TRR, TRT = 1.7, 2.2          # radio de fondo y de punta
TP = math.radians(30)        # 12 dientes


def ratchet_pts():
    pts = []
    for k in range(12):
        a = k * TP
        pts.append((TRR * math.cos(a), TRR * math.sin(a)))
        a2 = a + 0.9 * TP
        pts.append((TRT * math.cos(a2), TRT * math.sin(a2)))
    return pts


def ratchet_r(a):
    a = a % TP
    u = a / TP
    if u < 0.9:
        return TRR + (TRT - TRR) * u / 0.9
    return TRT - (TRT - TRR) * (u - 0.9) / 0.1


PAWL_L = 3.3
PAWL_P = (TC[0] - 2.5, TC[1] + TRR + 2.1)


def pawl_poly():
    pts = []
    for i in range(13):
        a = math.pi / 2 + math.pi * i / 12
        pts.append((0.45 * math.cos(a), 0.45 * math.sin(a)))
    pts += [(PAWL_L, -0.1), (PAWL_L, 0.1)]
    return pts


def pawl_angle(wrot, lift=0.0):
    """Angulo de la una (desde el pivote hacia la punta) que apoya justo en el perfil de la rueda girada `wrot`."""
    best = None
    deg = -80.0
    while deg < 10.0:
        a = math.radians(deg)
        tx = PAWL_P[0] + PAWL_L * math.cos(a)
        tz = PAWL_P[1] + PAWL_L * math.sin(a)
        dx, dz = tx - TC[0], tz - TC[1]
        d = math.hypot(dx, dz)
        loc = math.atan2(dz, dx) - wrot
        if d > ratchet_r(loc):
            best = a
            break
        deg += 0.1
    return best + math.radians(lift)


def build_ratchet(wrot=0.0, lift=0.0):
    P = Parts()
    pl = P.add(rect(9.5, 9.0, 0.5, "gris"), "gris", 1); plane(pl, TC[0] - 0.5, TC[1] + 0.7, 0)
    ax = P.add(axle(2.2), "eje", 2); plane(ax, TC[0], TC[1], 0.4)
    wh = P.add(poly(ratchet_pts(), 0.5, "azul", 0.02), "azul", 2); plane(wh, TC[0], TC[1], 1.0, rot=wrot)
    hub = P.add(cyl(0.45, 0.7, "oscuro"), "oscuro", 2); plane(hub, TC[0], TC[1], 1.5)
    ang = pawl_angle(wrot, lift)
    pw = P.add(poly(pawl_poly(), 0.5, "amarillo", 0.02), "amarillo", 3); plane(pw, PAWL_P[0], PAWL_P[1], 1.0, rot=ang)
    pp = P.add(pin(2.1), "oscuro", 3); plane(pp, PAWL_P[0], PAWL_P[1], 0.6)
    return P


def ratchet_cam():
    camera((6.5, -17, 7.5), (4.0, 0, 4.4), 50)


@image("trinquete", "tq_s1")
def tq_s1():
    P = build_ratchet(); P.show(1); ratchet_cam(); render(f"{OUT}/tq_s1.webp", W, H)


@image("trinquete", "tq_s2")
def tq_s2():
    P = build_ratchet(); P.show(2); ratchet_cam(); render(f"{OUT}/tq_s2.webp", W, H)


@image("trinquete", "tq_s3")
def tq_s3():
    P = build_ratchet(); P.show(3); ratchet_cam(); render(f"{OUT}/tq_s3.webp", W, H)


@image("trinquete", "tq_hero")
def tq_hero():
    P = build_ratchet(); P.full()
    arc_arrow((TC[0], -3.0, TC[1]), 3.0, math.radians(20), math.radians(-60), "cian", r=0.08)
    ratchet_cam(); render(f"{OUT}/tq_hero.webp", W, H)


@image("trinquete", "tq_libre")
def tq_libre():
    P = build_ratchet(wrot=math.radians(-14)); P.full()
    arc_arrow((TC[0], -3.0, TC[1]), 3.0, math.radians(20), math.radians(-60), "bien", r=0.08)
    ratchet_cam(); render(f"{OUT}/tq_libre.webp", W, H)


@image("trinquete", "tq_bloq")
def tq_bloq():
    P = build_ratchet(); P.full()
    arc_arrow((TC[0], -3.0, TC[1]), 3.0, math.radians(-60), math.radians(20), "mal", r=0.08)
    ratchet_cam(); render(f"{OUT}/tq_bloq.webp", W, H)


@image("trinquete", "tq_error_mal")
def tq_error_mal():
    P = build_ratchet(lift=14.0); P.full()
    ratchet_cam(); render(f"{OUT}/tq_error_mal.webp", W, H)


@image("trinquete", "tq_error_bien")
def tq_error_bien():
    P = build_ratchet(); P.full()
    ratchet_cam(); render(f"{OUT}/tq_error_bien.webp", W, H)


# ---------------------------------------------------------------- CRUZ DE MALTA

GO = (3.0, 4.0)
GD = (7.0, 4.0)
GA = 4.0
G_RD = GA * math.sin(math.pi / 4)      # radio de la manivela del impulsor
G_RLOCK = 2.2


def malta_wheel():
    o = disc(3.4, 0.5, "amarillo", n=72, bevel=0.02)
    cut = []
    for k in range(4):
        a = math.radians(90 * k)
        cut.append(cutter_cyl(GA * math.cos(a), GA * math.sin(a), G_RLOCK + 0.1))
    for k in range(4):
        a = math.radians(45 + 90 * k)
        c, s = math.cos(a), math.sin(a)
        r0 = GA - G_RD
        hw = 0.26
        pts = [(r0, -hw), (6.0, -hw), (6.0, hw), (r0, hw)]
        cut.append(cutter_poly([(x * c - y * s, x * s + y * c) for x, y in pts]))
        cut.append(cutter_cyl(r0 * c, r0 * s, hw))
    L._cut(o, cut)
    return o


def driver_parts():
    pts = [(0.0, 0.0)]
    n = 40
    for i in range(n + 1):
        a = math.radians(40 + 280 * i / n)
        pts.append((G_RLOCK * math.cos(a), G_RLOCK * math.sin(a)))
    pac = poly(pts, 0.5, "azul", 0.02)
    arm = poly([(0, -0.25), (G_RD, -0.25), (G_RD, 0.25), (0, 0.25)], 0.5, "azul", 0.02)
    return pac, arm


def build_malta(psi):
    """psi: angulo de la manivela del impulsor alrededor de su eje (rad). Devuelve (rotacion rueda)."""
    P = Parts()
    bm_ = P.add(beam(9, "gris"), "gris", 1); plane(bm_, 1.0, GO[1], 0)
    for c in (GO, GD):
        ax = P.add(axle(2.2), "eje", 1); plane(ax, c[0], c[1], 0.4)
    px, pz = GD[0] + G_RD * math.cos(psi) - GO[0], GD[1] + G_RD * math.sin(psi) - GO[1]
    deg = math.degrees(psi) % 360
    if 135 <= deg <= 225:
        theta = math.atan2(pz, px) - math.radians(45)
    else:
        theta = 0.0
    wh = P.add(malta_wheel(), "amarillo", 2); plane(wh, GO[0], GO[1], 1.0, rot=theta)
    pac, arm = driver_parts()
    P.add(pac, "azul", 3); plane(pac, GD[0], GD[1], 1.0, rot=psi)
    P.add(arm, "azul", 3); plane(arm, GD[0], GD[1], 1.0, rot=psi)
    pg = P.add(cyl(0.22, 1.2, "rojo"), "rojo", 3)
    plane(pg, GD[0] + G_RD * math.cos(psi), GD[1] + G_RD * math.sin(psi), 1.0)
    return P, theta


def malta_cam():
    camera((5.2, -19, 8.5), (5.0, 0, 4.0), 50)


@image("trinquete", "gn_reposo")
def gn_reposo():
    P, th = build_malta(math.radians(60)); P.full()
    arc_arrow((GD[0], -2.6, GD[1]), 3.1, math.radians(100), math.radians(190), "acento", r=0.07)
    malta_cam(); render(f"{OUT}/gn_reposo.webp", W, H)


@image("trinquete", "gn_paso")
def gn_paso():
    P, th = build_malta(math.radians(165)); P.full()
    arc_arrow((GD[0], -2.6, GD[1]), 3.1, math.radians(130), math.radians(220), "acento", r=0.07)
    arc_arrow((GO[0], -2.6, GO[1]), 3.9, math.radians(120), math.radians(60), "cian", r=0.07)
    malta_cam(); render(f"{OUT}/gn_paso.webp", W, H)


# ---------------------------------------------------------------- principal

def main():
    todo = [(n, g, f) for n, (g, f) in IMAGES.items() if (GROUP in ("all", g)) and (not ONLY or n in ONLY)]
    begin()
    for n, g, f in todo:
        f()
        purge()
    print("HECHO", len(todo))


main()
