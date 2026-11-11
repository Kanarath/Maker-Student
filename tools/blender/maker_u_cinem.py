"""
Maker Student - imagenes de la unidad "Cinematica del brazo" (angulos y posicion, resolucion y precision, trayectorias).

Uso (desde la raiz del repo):
  blender -b --factory-startup --python tools/blender/maker_u_cinem.py -- [posicion|precision|trayectoria|all] [nombre_imagen ...]

Brazo plano de dos eslabones con piezas tipo Technic, en el plano vertical XZ (vista de frente).
Proporcion de los dibujos: 1 agujero = 2 cm en el ejemplo (12 cm y 8 cm = eslabones de 6 y 4 agujeros), solo para la figura.
Salida: public/assets/img/cinem/<nombre>.webp. Lo nuevo en color y lo anterior en gris.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import maker_lib
from maker_lib import *
from maker_lib import _mat, _to_obj

OUT = os.path.join(ROOT, "public", "assets", "img", "cinem")
args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else ["all"]
GROUP = args[0] if args else "all"
ONLY = set(args[1:])
W, H = 1280, 720
SAMPLES = 40
if os.environ.get("MAKER_FAST"):  # vista previa rapida (no se guarda en public/)
    W, H, SAMPLES = 640, 360, 6
    OUT = os.environ["MAKER_FAST"]

EXTRA = {
    "carton": ("#c9a46a", 0.0, 0.7),
    "madera": ("#b7864f", 0.0, 0.6),
}
_orig_M = maker_lib.M


def _M2(key):
    if key in EXTRA:
        h, metal, rough = EXTRA[key]
        return _mat("x_" + key, hexc(h), metal, rough)
    return _orig_M(key)


maker_lib.M = _M2
M = _M2

KEEP = set()
IMAGES = {}


def image(group, name):
    def deco(fn):
        IMAGES[name] = (group, fn)
        return fn
    return deco


def begin():
    reset()
    studio(floor_z=-2.2, size=300)
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
        for o, color, stage in self.items:
            set_mat(o, color)


# ------------------------------------------------------------------ utilidades

def sphere(p, r, color):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=p, segments=24, ring_count=14)
    o = bpy.context.active_object
    o.data.materials.append(M(color))
    for q in o.data.polygons:
        q.use_smooth = True
    return o


def box(sx, sy, sz, color, bevel=0.04):
    import bmesh as _bm
    bm = _bm.new()
    _bm.ops.create_cube(bm, size=1.0, matrix=Matrix.Diagonal((sx, sy, sz, 1)))
    return _to_obj("caja", bm, color, smooth_sides=False, bevel=bevel)


def cyl(r, depth, color, seg=28, bevel=0.02):
    import bmesh as _bm
    bm = _bm.new()
    _bm.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r, radius2=r, depth=depth)
    return _to_obj("cil", bm, color, bevel=bevel)


def bar(p, q, r=0.06, color="gris"):
    import bmesh as _bm
    p, q = Vector(p), Vector(q)
    d = q - p
    L = d.length
    bm = _bm.new()
    _bm.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=14, radius1=r, radius2=r, depth=L, matrix=Matrix.Translation((0, 0, L / 2)))
    o = _to_obj("barra", bm, color, bevel=0)
    o.matrix_world = Matrix.Translation(p) @ d.to_track_quat("Z", "Y").to_matrix().to_4x4()
    return o


def dashed(p, q, color="gris", r=0.04, n=14):
    p, q = Vector(p), Vector(q)
    for i in range(n):
        a = p + (q - p) * (i / n)
        b = p + (q - p) * ((i + 0.55) / n)
        bar(a, b, r, color)


def circle_xz(center, radius, color="verde", r=0.045, y=-0.2, n=96):
    pts = [(center[0] + radius * math.cos(2 * math.pi * i / n), y, center[1] + radius * math.sin(2 * math.pi * i / n)) for i in range(n + 1)]
    cu = bpy.data.curves.new("anillo", "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = r
    cu.bevel_resolution = 3
    sp = cu.splines.new("POLY")
    sp.points.add(len(pts) - 1)
    for p, v in zip(sp.points, pts):
        p.co = (v[0], v[1], v[2], 1)
    o = bpy.data.objects.new("anillo", cu)
    bpy.context.scene.collection.objects.link(o)
    o.data.materials.append(M(color))
    return o


# ------------------------------------------------------------------ brazo plano

O = (0.0, 0.0)
L1, L2 = 6.0, 4.0


def fk(th1, th2, l1=L1, l2=L2, o=O):
    """Posiciones (x, z) del codo y la punta. Angulos en radianes: th1 respecto a la horizontal; th2 relativo al primer eslabon."""
    ex, ez = o[0] + l1 * math.cos(th1), o[1] + l1 * math.sin(th1)
    tx, tz = ex + l2 * math.cos(th1 + th2), ez + l2 * math.sin(th1 + th2)
    return (ex, ez), (tx, tz)


def ik(x, z, l1=L1, l2=L2, up=True, o=O):
    """Dos soluciones (codo arriba / abajo) para llegar a (x, z)."""
    x, z = x - o[0], z - o[1]
    d2 = x * x + z * z
    c = (d2 - l1 * l1 - l2 * l2) / (2 * l1 * l2)
    c = max(-1.0, min(1.0, c))
    th2 = -math.acos(c) if up else math.acos(c)
    th1 = math.atan2(z, x) - math.atan2(l2 * math.sin(th2), l1 + l2 * math.cos(th2))
    return th1, th2


def build_arm(th1, th2, l1=L1, l2=L2, c1="amarillo", c2="azul", stage_base=1, layer=0.9, board=True):
    """Brazo: base (viga y soporte), eslabon 1 (etapa 2) y eslabon 2 + codo (etapa 3). Devuelve (P, codo, punta)."""
    P = Parts()
    (ex, ez), (tx, tz) = fk(th1, th2, l1, l2)
    if board:
        b = P.add(beam(15, "gris"), "gris", stage_base); plane(b, -3.0, -0.95, 0.3)
        post = P.add(beam(3, "gris"), "gris", stage_base); plane(post, 0.0, -0.95, 0.3, rot=math.pi / 2)
    pv = P.add(pin(2.0), "oscuro", stage_base); plane(pv, O[0], O[1], 0.9)
    a1 = P.add(beam(int(l1) + 1, c1), c1, 2); plane(a1, O[0], O[1], 0.9, rot=th1)
    pe = P.add(pin(2.0), "oscuro", 3); plane(pe, ex, ez, 1.9)
    a2 = P.add(beam(int(l2) + 1, c2), c2, 3); plane(a2, ex, ez, 1.9, rot=th1 + th2)
    tip = P.add(cyl(0.2, 0.8, "verde"), "verde", 3); tip.matrix_world = Matrix.Translation((tx, -2.2, tz)) @ Matrix.Rotation(math.pi / 2, 4, "X")
    return P, (ex, ez), (tx, tz)


def cam():
    camera((4.5, -17.5, 5.0), (4.0, 0.0, 2.6), 40)


def angle_arcs(th1, th2, ex, ez):
    arc_arrow((O[0], -2.6, O[1]), 2.2, 0.0, th1, "cian", r=0.07)
    a, b = th1, th1 + th2
    arc_arrow((ex, -2.6, ez), 1.7, a, b, "acento", r=0.07)
    dashed((O[0], -2.6, O[1]), (O[0] + 3.4, -2.6, O[1]), "cian")
    dashed((ex, -2.6, ez), (ex + 3.0 * math.cos(th1), -2.6, ez + 3.0 * math.sin(th1)), "acento")


TH1, TH2 = math.radians(40), math.radians(55)


@image("posicion", "c_p_hero")
def c_p_hero():
    P, (ex, ez), tip = build_arm(TH1, TH2); P.color_all()
    angle_arcs(TH1, TH2, ex, ez)
    cam(); render(f"{OUT}/c_p_hero.webp", W, H)


@image("posicion", "c_p_s1")
def c_p_s1():
    P, *_ = build_arm(TH1, TH2); P.show(1); cam(); render(f"{OUT}/c_p_s1.webp", W, H)


@image("posicion", "c_p_s2")
def c_p_s2():
    P, *_ = build_arm(TH1, TH2); P.show(2); cam(); render(f"{OUT}/c_p_s2.webp", W, H)


@image("posicion", "c_p_s3")
def c_p_s3():
    P, *_ = build_arm(TH1, TH2); P.show(3); cam(); render(f"{OUT}/c_p_s3.webp", W, H)


@image("posicion", "c_p_s4")
def c_p_s4():
    P, (ex, ez), tip = build_arm(TH1, TH2); P.show(3)
    angle_arcs(TH1, TH2, ex, ez)
    # transportador de carton en el hombro
    cam(); render(f"{OUT}/c_p_s4.webp", W, H)


def right_angle_scene(l1=6, l2=8):
    P, (ex, ez), (tx, tz) = build_arm(0.0, math.radians(90), l1, l2)
    P.color_all()
    return (ex, ez), (tx, tz)


def cam_pit():
    camera((4.5, -19.0, 5.0), (3.5, 0.0, 3.6), 40)


@image("posicion", "c_p_pit")
def c_p_pit():
    (ex, ez), (tx, tz) = right_angle_scene()
    arrow((O[0], -2.7, O[1] - 0.2), (tx, -2.7, tz), "bien", r=0.07, head=0.4)
    dashed((ex, -2.7, ez), (ex, -2.7, ez + 8.0), "gris")
    cam_pit(); render(f"{OUT}/c_p_pit.webp", W, H)


@image("posicion", "c_p_suma_mal")
def c_p_suma_mal():
    (ex, ez), (tx, tz) = right_angle_scene()
    arrow((O[0], -2.7, O[1] - 0.5), (ex, -2.7, ez - 0.5), "mal", r=0.07, head=0.4)
    arrow((ex + 0.9, -2.7, ez), (tx + 0.9, -2.7, tz), "mal", r=0.07, head=0.4)
    cam_pit(); render(f"{OUT}/c_p_suma_mal.webp", W, H)


@image("posicion", "c_p_pit_bien")
def c_p_pit_bien():
    c_p_pit_impl = right_angle_scene()
    (ex, ez), (tx, tz) = c_p_pit_impl
    arrow((O[0], -2.7, O[1] - 0.2), (tx, -2.7, tz), "bien", r=0.07, head=0.4)
    cam_pit(); render(f"{OUT}/c_p_pit_bien.webp", W, H)


@image("posicion", "c_p_dos")
def c_p_dos():
    target = fk(TH1, TH2)[1]
    for up, col, c2 in ((False, "gris", "gris"), (True, "amarillo", "azul")):
        t1, t2 = ik(target[0], target[1], up=up)
        P, e, t = build_arm(t1, t2, c1=col, c2=c2, board=up)
        if up:
            P.color_all()
        else:
            for o, c, s in P.items:
                set_mat(o, "ghost")
    sphere((target[0], -2.9, target[1]), 0.3, "bien")
    cam(); render(f"{OUT}/c_p_dos.webp", W, H)


@image("posicion", "c_p_fuera")
def c_p_fuera():
    """Objetivo fuera del alcance: el brazo, estirado, no llega."""
    ang = math.radians(35)
    P, e, t = build_arm(ang, 0.0); P.color_all()
    circle_xz(O, L1 + L2, "verde", 0.05, y=-3.0)
    tx, tz = (L1 + L2 + 3.0) * math.cos(ang), (L1 + L2 + 3.0) * math.sin(ang)
    sphere((tx, -2.9, tz), 0.32, "mal")
    dashed((t[0], -2.9, t[1]), (tx, -2.9, tz), "mal")
    camera((5.5, -20.0, 5.5), (5.0, 0.0, 4.5), 40)
    render(f"{OUT}/c_p_fuera.webp", W, H)


@image("posicion", "c_p_dentro")
def c_p_dentro():
    """Objetivo dentro del alcance: el brazo llega."""
    ang = math.radians(35)
    tx, tz = (L1 + L2 - 2.5) * math.cos(ang), (L1 + L2 - 2.5) * math.sin(ang)
    t1, t2 = ik(tx, tz, up=True)
    P, e, t = build_arm(t1, t2); P.color_all()
    circle_xz(O, L1 + L2, "verde", 0.05, y=-3.0)
    sphere((tx, -2.9, tz), 0.32, "bien")
    camera((5.5, -20.0, 5.5), (5.0, 0.0, 4.5), 40)
    render(f"{OUT}/c_p_dentro.webp", W, H)


# ------------------------------------------------------------------ resolucion

def pivot_arms(lengths, th, colors):
    """Varios brazos desde el mismo pivote, girados th."""
    P = Parts()
    pv = P.add(pin(2.0), "oscuro", 1); plane(pv, 0, 0, 0.9)
    out = []
    for i, (l, c) in enumerate(zip(lengths, colors)):
        a = P.add(beam(int(l) + 1, c), c, 2); plane(a, 0, 0, 0.9 + 0.5 * i, rot=th)
        out.append(a)
    return P, out


STEP = math.radians(12)  # paso exagerado para que se vea (en el texto se explica)


@image("precision", "c_r_hero")
def c_r_hero():
    P = Parts()
    pv = P.add(pin(2.0), "oscuro", 1); plane(pv, 0, 0, 0.9)
    for l, c, col, i in ((10, "amarillo", "acento", 0), (5, "azul", "cian", 1)):
        a = P.add(beam(l + 1, c), c, 1); plane(a, 0, 0, 0.9 + 0.5 * i, rot=0.0)
        g = P.add(beam(l + 1, "gris"), "gris", 1); plane(g, 0, 0, 0.9 + 0.5 * i - 0.3, rot=STEP)
        arc_arrow((0, -3.2 - i * 0.3, 0), l, 0.0, STEP, col, r=0.09)
    P.color_all()
    camera((4.0, -18.0, 4.5), (4.5, 0.0, 1.0), 38)
    render(f"{OUT}/c_r_hero.webp", W, H)


def _res_scene(L, col, step=STEP):
    P = Parts()
    pv = P.add(pin(2.0), "oscuro", 1); plane(pv, 0, 0, 0.9)
    a = P.add(beam(L + 1, "amarillo"), "amarillo", 1); plane(a, 0, 0, 0.9, rot=0.0)
    g = P.add(beam(L + 1, "gris"), "gris", 1); plane(g, 0, 0, 0.6, rot=step)
    P.color_all()
    set_mat(g, "ghost")
    arc_arrow((0, -2.2, 0), L, 0.0, step, col, r=0.1)
    return P


@image("precision", "c_r_largo")
def c_r_largo():
    _res_scene(10, "mal"); camera((4.0, -18.0, 4.5), (4.5, 0.0, 1.0), 38); render(f"{OUT}/c_r_largo.webp", W, H)


@image("precision", "c_r_corto")
def c_r_corto():
    _res_scene(5, "bien"); camera((4.0, -18.0, 4.5), (4.5, 0.0, 1.0), 38); render(f"{OUT}/c_r_corto.webp", W, H)


def _lim_scene(stage_show, th=0.0, arc=False):
    P = Parts()
    b = P.add(beam(11, "gris"), "gris", 1); plane(b, -3.0, -1.0, 0.3)
    pv = P.add(pin(2.0), "oscuro", 1); plane(pv, 0, 0, 0.9)
    sw = P.add(box(2.4, 1.2, 1.0, "oscuro"), "oscuro", 2); sw.location = (4.4, -0.9, -1.0 + 0.0)
    bt = P.add(cyl(0.28, 0.4, "rojo"), "rojo", 2); bt.location = (4.4, -0.9, -0.3)
    a = P.add(beam(9, "amarillo"), "amarillo", 3); plane(a, 0, 0, 0.9, rot=th)
    return P


def cam_lim():
    camera((4.0, -15.0, 3.5), (4.0, 0.0, 0.2), 38)


@image("precision", "c_r_s1")
def c_r_s1():
    P = _lim_scene(1); P.show(1); cam_lim(); render(f"{OUT}/c_r_s1.webp", W, H)


@image("precision", "c_r_s2")
def c_r_s2():
    P = _lim_scene(2); P.show(2); cam_lim(); render(f"{OUT}/c_r_s2.webp", W, H)


@image("precision", "c_r_s3")
def c_r_s3():
    P = _lim_scene(3); P.show(3); cam_lim(); render(f"{OUT}/c_r_s3.webp", W, H)


@image("precision", "c_r_s4")
def c_r_s4():
    P = _lim_scene(3, th=math.radians(12)); P.show(3)
    arc_arrow((0, -2.0, 0), 8.0, 0.0, math.radians(12), "acento", r=0.09)
    dashed((0, -2.0, 0), (9.2, -2.0, 0), "gris")
    cam_lim(); render(f"{OUT}/c_r_s4.webp", W, H)


# ------------------------------------------------------------------ trayectorias

START, END = (4.0, 6.5), (9.0, 2.0)


def poses_on_line(n, ease=False):
    pts = []
    for i in range(n):
        t = i / (n - 1)
        if ease:
            t = t * t * (3 - 2 * t)
        pts.append((START[0] + (END[0] - START[0]) * t, START[1] + (END[1] - START[1]) * t))
    return pts


def draw_ghost_arm(th1, th2, layer=1.2):
    (ex, ez), (tx, tz) = fk(th1, th2)
    a1 = beam(int(L1) + 1, "gris"); plane(a1, O[0], O[1], layer, rot=th1); set_mat(a1, "ghost")
    a2 = beam(int(L2) + 1, "gris"); plane(a2, ex, ez, layer + 0.5, rot=th1 + th2); set_mat(a2, "ghost")


def base_only():
    b = beam(15, "gris"); plane(b, -3.0, -0.95, 0.3)
    post = beam(3, "gris"); plane(post, 0.0, -0.95, 0.3, rot=math.pi / 2)
    pv = pin(2.0); plane(pv, 0, 0, 0.9)


def cam_tray():
    camera((5.0, -18.5, 5.0), (5.0, 0.0, 3.4), 40)


def path_line(color="verde", pts=None):
    pts = pts or [START, END]
    for a, b in zip(pts[:-1], pts[1:]):
        bar((a[0], -2.9, a[1]), (b[0], -2.9, b[1]), 0.06, color)


@image("trayectoria", "c_t_hero")
def c_t_hero():
    base_only()
    for p in poses_on_line(4)[:-1]:
        t1, t2 = ik(p[0], p[1], up=True)
        draw_ghost_arm(t1, t2, layer=1.0)
    t1, t2 = ik(END[0], END[1], up=True)
    P, e, t = build_arm(t1, t2, board=False); P.color_all()
    path_line("bien")
    sphere((START[0], -2.9, START[1]), 0.3, "acento")
    sphere((END[0], -2.9, END[1]), 0.3, "bien")
    cam_tray(); render(f"{OUT}/c_t_hero.webp", W, H)


@image("trayectoria", "c_t_recta")
def c_t_recta():
    c_t_hero_like("bien", straight=True, name="c_t_recta")


@image("trayectoria", "c_t_arco")
def c_t_arco():
    c_t_hero_like("mal", straight=False, name="c_t_arco")


def c_t_hero_like(col, straight, name):
    base_only()
    if straight:
        pose_pts = poses_on_line(4)
        path = [START, END]
        angs = [ik(p[0], p[1], up=True) for p in pose_pts]
    else:
        t1s, t2 = ik(START[0], START[1], up=True)
        t1e, _ = ik(END[0], END[1], up=True)
        # solo se mueve el hombro: el codo se queda como esta
        angs = [(t1s + (t1e - t1s) * i / 3, t2) for i in range(4)]
        path = [fk(a, b)[1] for a, b in [(t1s + (t1e - t1s) * k / 20, t2) for k in range(21)]]
    for t1, t2 in angs[:-1]:
        draw_ghost_arm(t1, t2, layer=1.0)
    t1, t2 = angs[-1]
    P, e, t = build_arm(t1, t2, board=False); P.color_all()
    path_line(col, path)
    sphere((START[0], -2.9, START[1]), 0.3, "acento")
    sphere((END[0], -2.9, END[1]), 0.3, "bien" if straight else "mal")
    cam_tray(); render(f"{OUT}/{name}.webp", W, H)


@image("trayectoria", "c_t_s1")
def c_t_s1():
    P = Parts()
    b = P.add(box(16, 5, 0.5, "madera"), "madera", 1); b.location = (4.0, -0.2, -1.5)
    P.add(sphere((START[0], -1.2, START[1] - 1.5 + 0.0), 0.3, "acento"), "acento", 1)
    P.add(sphere((END[0], -1.2, END[1] - 1.5 + 0.0), 0.3, "bien"), "bien", 1)
    P.color_all()
    for p, col in ((START, "acento"), (END, "bien")):
        bar((p[0], -1.2, -1.2), (p[0], -1.2, p[1] - 1.5), 0.04, col)
    camera((5.0, -16.0, 6.0), (5.0, 0.0, 2.0), 40)
    render(f"{OUT}/c_t_s1.webp", W, H)


@image("trayectoria", "c_t_s2")
def c_t_s2():
    base_only()
    circle_xz(O, L1 + L2, "verde", 0.05, y=-1.4)
    circle_xz(O, L1 - L2, "verde", 0.05, y=-1.4)
    sphere((START[0], -1.4, START[1]), 0.3, "acento")
    sphere((END[0], -1.4, END[1]), 0.3, "bien")
    cam_tray(); render(f"{OUT}/c_t_s2.webp", W, H)


@image("trayectoria", "c_t_s3")
def c_t_s3():
    t1, t2 = ik(START[0], START[1], up=True)
    P, (ex, ez), tip = build_arm(t1, t2); P.show(3)
    angle_arcs(t1, t2, ex, ez)
    sphere((START[0], -2.9, START[1]), 0.3, "acento")
    cam_tray(); render(f"{OUT}/c_t_s3.webp", W, H)


@image("trayectoria", "c_t_s4")
def c_t_s4():
    """Arranque y frenada suaves: los puntos se juntan en los extremos (va despacio) y se separan en el medio (va deprisa)."""
    base_only()
    pts = poses_on_line(9, ease=True)
    t1, t2 = ik(pts[4][0], pts[4][1], up=True)
    P, e, t = build_arm(t1, t2, board=False); P.show(3)
    for i, p in enumerate(pts):
        sphere((p[0], -2.9, p[1]), 0.18, "cian")
    bar((START[0], -2.9, START[1]), (END[0], -2.9, END[1]), 0.03, "gris")
    cam_tray(); render(f"{OUT}/c_t_s4.webp", W, H)


# ------------------------------------------------------------------ main

def main():
    todo = [(n, g, f) for n, (g, f) in IMAGES.items() if (GROUP in ("all", g)) and (not ONLY or n in ONLY)]
    begin()
    import time
    for n, g, f in todo:
        t0 = time.time()
        f()
        purge()
        print("TIEMPO", n, round(time.time() - t0, 1), "s")
    print("HECHO", len(todo))


main()
