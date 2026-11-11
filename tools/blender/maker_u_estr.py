"""
Maker Student - imagenes de la unidad "Estructuras y rigidez" (marcos, cargas, voladizos y refuerzos).

Uso (desde la raiz del repo):
  blender -b --factory-startup --python tools/blender/maker_u_estr.py -- [triangulo|cargas|voladizo|all] [nombre_imagen ...]

Cada imagen es una funcion que construye la escena, la renderiza a public/assets/img/estr/<nombre>.webp y la limpia.
Los esquemas de flexion (vigas curvadas) estan exagerados para que se vean: son dibujos, no medidas.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from maker_lib import *
from maker_lib import _prism, _to_obj, _cut, _cyl_cutter, _circle_pts

OUT = os.path.join(ROOT, "public", "assets", "img", "estr")
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


AY = -5.0  # plano de las flechas (delante de todo)


# ---------------------------------------------------------------- piezas nuevas

def bar(P, p, q, n, color, layer, stage=1):
    """Viga de n agujeros entre dos puntos (x, z) en la capa `layer`."""
    ang = math.atan2(q[1] - p[1], q[0] - p[0])
    o = P.add(beam(n, color), color, stage)
    plane(o, p[0], p[1], layer, rot=ang)
    return o


def peg(P, x, z, layers, stage=1):
    """Pasador que atraviesa `layers` capas (2 o 3), con la cabeza hacia la camara."""
    length = 2.1 if layers == 2 else 3.1
    center = 1.5 if layers == 2 else 2.0
    o = P.add(pin(length), "oscuro", stage)
    plane(o, x, z, center)
    return o


def box(w, d, h, color, loc, bevel=0.03):
    """Caja de w (x) x d (y) x h (z) centrada en loc."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Diagonal((w, d, h, 1)))
    o = _to_obj("caja", bm, color, smooth_sides=False, bevel=bevel)
    o.location = loc
    return o


def band(pts, o0, o1, width, color, y=0.0, bevel=0.02):
    """Banda delgada que sigue una polilinea (x, z), entre los desplazamientos o0 y o1 respecto a la linea (normal hacia arriba).
    Extruida `width` en Y, centrada en y."""
    n = len(pts)
    top, bot = [], []
    for i, (x, z) in enumerate(pts):
        a, b = pts[max(i - 1, 0)], pts[min(i + 1, n - 1)]
        tx, tz = b[0] - a[0], b[1] - a[1]
        l = math.hypot(tx, tz) or 1.0
        nx, nz = -tz / l, tx / l
        top.append((x + nx * o1, z + nz * o1))
        bot.append((x + nx * o0, z + nz * o0))
    bm = _prism(bot + top[::-1], width)
    o = _to_obj("banda", bm, color, smooth_sides=False, bevel=bevel)
    o.matrix_world = Matrix.Translation((0, y, 0)) @ Matrix.Rotation(math.pi / 2, 4, "X")
    return o


def band_yz(pts, o0, o1, length, color, x=0.0, bevel=0.01):
    """Banda cuyo perfil (y, z) se extruye `length` a lo largo de X (chapa ondulada)."""
    n = len(pts)
    top, bot = [], []
    for i, (u, v) in enumerate(pts):
        a, b = pts[max(i - 1, 0)], pts[min(i + 1, n - 1)]
        tx, tv = b[0] - a[0], b[1] - a[1]
        l = math.hypot(tx, tv) or 1.0
        nx, nv = -tv / l, tx / l
        top.append((u + nx * o1, v + nv * o1))
        bot.append((u + nx * o0, v + nv * o0))
    bm = _prism(bot + top[::-1], length)
    o = _to_obj("chapa", bm, color, smooth_sides=False, bevel=bevel)
    # local (x, y, z) -> mundo (y, z, x)
    M3 = Matrix(((0, 0, 1, x), (1, 0, 0, 0), (0, 1, 0, 0), (0, 0, 0, 1)))
    o.matrix_world = M3
    return o


def tube(r, t, length, color, loc):
    """Tubo hueco a lo largo de X."""
    bm = _prism(_circle_pts(0, 0, r, 40), length)
    o = _to_obj("tubo", bm, color, smooth_sides=True, bevel=0)
    _cut(o, [_cyl_cutter([(0, 0)], r=r - t, depth=length + 2)])
    for p in o.data.polygons:
        p.use_smooth = True
    M3 = Matrix(((0, 0, 1, loc[0]), (1, 0, 0, loc[1]), (0, 1, 0, loc[2]), (0, 0, 0, 1)))
    o.matrix_world = M3
    return o


def cyl(r, h, color, loc, axis="z"):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=24, radius1=r, radius2=r, depth=h)
    o = _to_obj("cil", bm, color, smooth_sides=True, bevel=0.01)
    o.location = loc
    if axis == "x":
        o.rotation_euler = (0, math.pi / 2, 0)
    elif axis == "y":
        o.rotation_euler = (math.pi / 2, 0, 0)
    return o


def marker(x, z, color, y=AY, r=0.2):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=(x, y, z), segments=20, ring_count=12)
    o = bpy.context.active_object
    o.data.materials.append(M(color))
    for p in o.data.polygons:
        p.use_smooth = True
    return o


# ---------------------------------------------------------------- MARCOS (triangulo)

FW, FH = 4.0, 3.0  # marco de 4 x 3 agujeros: la diagonal mide justo 5 (triangulo 3-4-5)


def frame(P, x0=0.0, shear_deg=0.0, diag=False, diag_one_end=False, stage_base=1, push=False):
    """Marco de 4x3 con pines en las esquinas. shear_deg > 0 empuja la parte de arriba hacia la derecha."""
    t = math.radians(shear_deg)
    s, c = math.sin(t), math.cos(t)
    A = (x0, 0.0)
    B = (x0 + FW, 0.0)
    C = (x0 + FW + FH * s, FH * c)
    D = (x0 + FH * s, FH * c)
    bar(P, A, B, 5, "gris", 1, stage_base)
    bar(P, D, C, 5, "gris", 1, stage_base)
    bar(P, B, C, 4, "azul", 2, stage_base + 1)
    bar(P, A, D, 4, "azul", 2, stage_base + 1)
    # esquinas: A y C llevan pin largo si habra diagonal
    long_ = diag
    for pt, st in ((A, stage_base + 1), (B, stage_base + 1), (C, stage_base + 1), (D, stage_base + 1)):
        layers = 3 if (diag and pt in (A, C)) else 2
        peg(P, pt[0], pt[1], layers, st)
    if diag:
        if diag_one_end:
            # unida solo a A, con la longitud del marco original
            ang = math.atan2(FH, FW)
            o = P.add(beam(6, "rojo"), "rojo", stage_base + 2)
            plane(o, A[0], A[1], 3, rot=ang)
        else:
            bar(P, A, C, 6, "rojo", 3, stage_base + 2)
    return A, B, C, D


def frame_cam(xmid=2.0, z=1.5, dist=20, lens=50):
    camera((xmid + 3.0, -dist, z + 5.0), (xmid, 0, z - 0.1), lens)


def push_arrow(D, color="acento", length=2.2):
    arrow((D[0] - length - 0.7, AY + 0.5, D[1] + 0.1), (D[0] - 0.7, AY + 0.5, D[1] + 0.1), color, r=0.09, head=0.4)


def ghost_outline(x0):
    """Contorno fino del marco original (sin empujar), delante del todo."""
    pts = [(x0, 0), (x0 + FW, 0), (x0 + FW, FH), (x0, FH), (x0, 0)]
    for a, b in zip(pts, pts[1:]):
        rope([(a[0], -3.4, a[1]), (b[0], -3.4, b[1])], color="ghost", r=0.035)


@image("triangulo", "t_hero")
def t_hero():
    P = Parts()
    A, B, C, D = frame(P, 0.0, 24.0, diag=False)
    A2, B2, C2, D2 = frame(P, 8.5, 0.0, diag=True)
    P.color_all()
    push_arrow(D)
    push_arrow(D2, "acento")
    ghost_outline(0.0)
    camera((6.8, -31, 7.5), (6.1, 0, 1.3), 50)
    render(f"{OUT}/t_hero.webp", W, H)


@image("triangulo", "t_cede")
def t_cede():
    P = Parts()
    A, B, C, D = frame(P, 0.0, 24.0, diag=False)
    P.color_all()
    push_arrow(D)
    ghost_outline(0.0)
    frame_cam(2.5, 1.5, 21)
    render(f"{OUT}/t_cede.webp", W, H)


def _t_step(k):
    P = Parts()
    frame(P, 0.0, 0.0, diag=True)
    P.show(k)
    frame_cam(2.0, 1.5, 19)
    return P


@image("triangulo", "t_s1")
def t_s1():
    _t_step(1)
    render(f"{OUT}/t_s1.webp", W, H)


@image("triangulo", "t_s2")
def t_s2():
    _t_step(2)
    render(f"{OUT}/t_s2.webp", W, H)


@image("triangulo", "t_s3")
def t_s3():
    _t_step(3)
    render(f"{OUT}/t_s3.webp", W, H)


@image("triangulo", "t_s4")
def t_s4():
    P = Parts()
    A, B, C, D = frame(P, 0.0, 0.0, diag=True)
    P.color_all()
    push_arrow(D)
    frame_cam(2.0, 1.5, 19)
    render(f"{OUT}/t_s4.webp", W, H)


@image("triangulo", "t_error_mal")
def t_error_mal():
    """Diagonal unida por un solo extremo: el marco sigue cediendo."""
    P = Parts()
    A, B, C, D = frame(P, 0.0, 22.0, diag=True, diag_one_end=True)
    P.color_all()
    push_arrow(D, "mal")
    tip = (FW, FH)
    marker(tip[0], tip[1], "mal", y=AY + 0.2, r=0.22)
    frame_cam(2.5, 1.5, 19)
    render(f"{OUT}/t_error_mal.webp", W, H)


@image("triangulo", "t_error_bien")
def t_error_bien():
    P = Parts()
    A, B, C, D = frame(P, 0.0, 0.0, diag=True)
    P.color_all()
    push_arrow(D, "bien")
    marker(A[0], A[1], "bien", y=AY + 0.2, r=0.22)
    marker(C[0], C[1], "bien", y=AY + 0.2, r=0.22)
    frame_cam(2.0, 1.5, 19)
    render(f"{OUT}/t_error_bien.webp", W, H)


# ---------------------------------------------------------------- CARGAS

def sag_pts(x0, x1, z0, sag, n=24):
    """Curva parabolica entre x0 y x1 (apoyada en z0) con flecha `sag` en el centro."""
    pts = []
    for i in range(n + 1):
        t = i / n
        pts.append((x0 + (x1 - x0) * t, z0 - sag * 4 * t * (1 - t)))
    return pts


def books(x0, x1, z=0.0):
    """Dos libros (cajas) que sostienen una hoja entre x0 y x1; la cara de arriba esta en z."""
    a = box(2.6, 4.0, 2.0, "azul", (x0 - 1.3 + 0.0, 0, z - 1.0))
    b = box(2.6, 4.0, 2.0, "rojo", (x1 + 1.3, 0, z - 1.0))
    return a, b


def coins(xc, z, n=6, color="eje"):
    for i in range(n):
        cyl(0.38, 0.09, color, (xc, 0, z + 0.05 + 0.095 * i))


def paper_cam(xc=4.0, dist=24, lens=45):
    camera((xc + 4.0, -dist, 6.5), (xc, 0, -0.1), lens)


def paper_bridge(kind, xc0=0.0, with_coins=True, sag=None):
    """kind: 'plano' | 'acordeon' | 'tubo'. Vano de 8 entre libros (de xc0 a xc0+8)."""
    x0, x1 = xc0, xc0 + 8.0
    books(x0, x1)
    xm = (x0 + x1) / 2
    top = 0.0
    if kind == "plano":
        s = 1.0 if sag is None else sag
        pts = sag_pts(x0 - 0.5, x1 + 0.5, 0.0, s)
        band(pts, 0.0, 0.07, 3.2, "masa")
        # monedas sobre el centro (donde la hoja es casi horizontal)
        top = -s + 0.07
    elif kind == "acordeon":
        # chapa ondulada: pliegues a lo largo del puente (perfil en YZ)
        prof = []
        folds = 6
        for i in range(folds * 2 + 1):
            u = -1.6 + 3.2 * i / (folds * 2)
            v = 0.34 if i % 2 == 0 else 0.0
            prof.append((u, v))
        s = 0.12
        # se apoya recta (casi sin flecha)
        band_yz(prof, 0.0, 0.07, 9.0, "masa", x=xm)
        top = 0.34 + 0.07 - s
    else:
        tube(0.5, 0.05, 9.0, "masa", (xm, 0.0, 0.5))
        top = 1.0
    if with_coins:
        coins(xm, top)
    return top


@image("cargas", "c_tres")
def c_tres():
    # traccion: cuerda entre dos postes con flechas hacia fuera
    xs = -9.0
    box(0.6, 0.6, 3.0, "oscuro", (xs - 2.4, 0, 0.5))
    box(0.6, 0.6, 3.0, "oscuro", (xs + 2.4, 0, 0.5))
    rope([(xs - 2.1, 0, 0.5), (xs + 2.1, 0, 0.5)], r=0.09)
    arrow((xs - 2.8, 0, 2.6), (xs - 4.6, 0, 2.6), "acento", r=0.1, head=0.45)
    arrow((xs + 2.8, 0, 2.6), (xs + 4.6, 0, 2.6), "acento", r=0.1, head=0.45)
    # compresion: columna con flechas hacia dentro
    box(1.1, 1.1, 3.6, "gris", (0, 0, 0.3))
    box(2.2, 1.6, 0.3, "oscuro", (0, 0, -1.65))
    arrow((0, 0, 4.9), (0, 0, 2.3), "cian", r=0.1, head=0.45)
    # flexion: viga apoyada con carga al centro (esquema)
    xf = 9.0
    for dx in (-2.9, 2.9):
        pts = [(xf + dx - 0.5, -1.5), (xf + dx + 0.5, -1.5), (xf + dx, -0.6)]
        bm = _prism(pts, 1.0)
        o = _to_obj("apoyo", bm, "azul", smooth_sides=False, bevel=0.02)
        o.matrix_world = Matrix.Rotation(math.pi / 2, 4, "X")
    band(sag_pts(xf - 3.4, xf + 3.4, 0.0, 0.5), -0.3, 0.3, 1.0, "amarillo")
    arrow((xf, 0, 4.0), (xf, 0, 1.2), "acento", r=0.1, head=0.45)
    camera((0, -37, 7.0), (0, 0, 0.8), 40)
    render(f"{OUT}/c_tres.webp", W, H)


@image("cargas", "c_flexion")
def c_flexion():
    xf = 5.0
    half = 5.4
    sag = 0.9
    for dx in (-5.0, 5.0):
        pts = [(xf + dx - 0.7, -1.8), (xf + dx + 0.7, -1.8), (xf + dx, -0.4)]
        bm = _prism(pts, 2.0)
        o = _to_obj("apoyo", bm, "gris", smooth_sides=False, bevel=0.02)
        o.matrix_world = Matrix.Rotation(math.pi / 2, 4, "X")
    pts = sag_pts(xf - half, xf + half, 0.0, sag)
    band(pts, 0.0, 0.45, 2.0, "azul")       # cara de arriba: se comprime
    band(pts, -0.45, 0.0, 2.0, "amarillo")  # cara de abajo: se estira
    # carga al centro
    m, h = weight(2, "verde")
    m.location = (xf, 0, -sag + 0.45)
    arrow((xf, 0, 3.6), (xf, 0, 2.0), "acento", r=0.1, head=0.45)

    def zc(xc):
        t = (xc - (xf - half)) / (2 * half)
        return -sag * 4 * t * (1 - t)

    # arriba (azul): se aprieta -> flechas hacia el centro. Abajo (amarillo): se estira -> flechas hacia fuera
    for xc, s in ((xf - 3.4, 1), (xf + 3.4, -1)):
        z = zc(xc) + 0.22
        arrow((xc - s * 0.8, -1.12, z), (xc + s * 0.7, -1.12, z), "cian", r=0.06, head=0.28)
        z = zc(xc) - 0.22
        arrow((xc + s * 0.1, -1.12, z), (xc - s * 0.95, -1.12, z), "acento", r=0.06, head=0.28)
    camera((xf + 1.5, -17, 5.0), (xf, 0, 0.3), 45)
    render(f"{OUT}/c_flexion.webp", W, H)


@image("cargas", "c_p1")
def c_p1():
    """Paso 1: dos libros y una hoja plana apoyada (sin carga)."""
    x0, x1 = 0.0, 8.0
    books(x0, x1)
    band(sag_pts(x0 - 0.5, x1 + 0.5, 0.0, 0.0), 0.0, 0.07, 3.2, "masa")
    # cota del vano
    arrow((x0, AY + 0.5, 1.4), (x1, AY + 0.5, 1.4), "cian", r=0.05, head=0.3)
    arrow((x1, AY + 0.5, 1.4), (x0, AY + 0.5, 1.4), "cian", r=0.05, head=0.3)
    paper_cam()
    render(f"{OUT}/c_p1.webp", W, H)


@image("cargas", "c_p2")
def c_p2():
    paper_bridge("plano")
    paper_cam()
    render(f"{OUT}/c_p2.webp", W, H)


@image("cargas", "c_p3")
def c_p3():
    paper_bridge("acordeon")
    paper_cam()
    render(f"{OUT}/c_p3.webp", W, H)


@image("cargas", "c_p4")
def c_p4():
    paper_bridge("tubo")
    paper_cam()
    render(f"{OUT}/c_p4.webp", W, H)


@image("cargas", "c_hero")
def c_hero():
    for k, xo in (("plano", -12.0), ("acordeon", 0.0), ("tubo", 12.0)):
        paper_bridge(k, xo - 4.0)
    camera((2.0, -42, 9.0), (0, 0, 0.0), 45)
    render(f"{OUT}/c_hero.webp", W, H)


def _fold_profile(folds=6, amp=0.34, w=3.2):
    out = []
    for i in range(folds * 2 + 1):
        out.append((-w / 2 + w * i / (folds * 2), amp if i % 2 == 0 else 0.0))
    return out


@image("cargas", "c_error_mal")
def c_error_mal():
    """Pliegues atravesados (como un fuelle): la hoja se dobla igual de facil."""
    x0, x1 = 0.0, 8.0
    books(x0, x1)
    pts = []
    n = 16
    for i in range(n + 1):
        t = i / n
        x = x0 - 0.5 + 9.0 * t
        pts.append((x, (0.25 if i % 2 == 0 else 0.0) - 0.7 * 4 * t * (1 - t)))
    band(pts, 0.0, 0.07, 3.2, "masa")
    coins(4.0, -0.7 + 0.25, 6)
    arrow((4.0, AY + 0.5, 4.4), (4.0, AY + 0.5, 2.0), "mal", r=0.08, head=0.36)
    paper_cam()
    render(f"{OUT}/c_error_mal.webp", W, H)


@image("cargas", "c_error_bien")
def c_error_bien():
    x0, x1 = 0.0, 8.0
    books(x0, x1)
    band_yz(_fold_profile(), 0.0, 0.07, 9.0, "masa", x=4.0)
    coins(4.0, 0.34 + 0.07, 6)
    arrow((4.0, AY + 0.5, 4.4), (4.0, AY + 0.5, 2.0), "bien", r=0.08, head=0.36)
    paper_cam()
    render(f"{OUT}/c_error_bien.webp", W, H)


# ---------------------------------------------------------------- VOLADIZOS Y REFUERZOS

def tip_defl(L, k=0.0045):
    return k * L ** 3


def cantilever_pts(x0, L, z0, delta, n=28):
    out = []
    for i in range(n + 1):
        x = L * i / n
        y = delta * (3 * L * x * x - x ** 3) / (2 * L ** 3)
        out.append((x0 + x, z0 - y))
    return out


def wall_slab(z0, z1, x=-1.1):
    return box(1.4, 3.0, z1 - z0, "oscuro", (x, 0, (z0 + z1) / 2))


@image("voladizo", "v_largo_corto")
def v_largo_corto():
    wall_slab(-2.2, 6.2)
    # brazo corto (L=3, arriba) y largo (L=6, abajo); misma carga
    for L, z0, col in ((3.0, 4.2, "amarillo"), (6.0, 0.6, "amarillo")):
        d = tip_defl(L)
        pts = cantilever_pts(0.0, L, z0, d)
        band(pts, -0.25, 0.25, 0.9, col)
        # linea de referencia (sin carga)
        rope([(0, 0, z0), (L + 0.4, 0, z0)], color="ghost", r=0.025)
        m, h = weight(2, "verde")
        m.location = (L, 0, z0 - d - 0.25 - h - 0.5)
        rope([(L, 0, z0 - d - 0.2), (L, 0, z0 - d - 0.55)], r=0.04)
        arrow((L + 1.0, AY + 1.0, z0 + 1.0), (L + 1.0, AY + 1.0, z0 - 0.4), "acento", r=0.07, head=0.32)
    arrow((7.2, AY + 1.0, 0.6), (7.2, AY + 1.0, 0.6 - tip_defl(6.0)), "cian", r=0.05, head=0.2)
    camera((5.4, -27, 4.6), (3.6, 0, 1.2), 50)
    render(f"{OUT}/v_largo_corto.webp", W, H)


def cant_z(L, z0, delta, x):
    return z0 - delta * (3 * L * x * x - x ** 3) / (2 * L ** 3)


@image("voladizo", "v_motor")
def v_motor():
    """Mismo brazo y misma carga: motor cerca de la base (flecha pequena) o en la punta (flecha grande). Esquema exagerado."""
    wall_slab(-2.4, 6.4)
    L = 6.0
    # arriba: motor cerca de la base
    z0 = 4.4
    d_small = tip_defl(L) * 0.35
    band(cantilever_pts(0.0, L, z0, d_small), -0.25, 0.25, 0.9, "amarillo")
    box(1.4, 1.2, 1.1, "rojo", (0.9, 0, cant_z(L, z0, d_small, 0.9) + 0.25 + 0.55))
    m, h = weight(1, "verde")
    m.location = (L, 0, z0 - d_small - 0.5 - h)
    rope([(L, 0, z0 - d_small - 0.2), (L, 0, z0 - d_small - 0.5)], r=0.04)
    # abajo: motor en la punta
    z1 = 0.4
    d_big = tip_defl(L) * 1.9
    band(cantilever_pts(0.0, L, z1, d_big), -0.25, 0.25, 0.9, "amarillo")
    xm = L - 0.8
    box(1.4, 1.2, 1.1, "rojo", (xm, 0, cant_z(L, z1, d_big, xm) + 0.25 + 0.55))
    m2, h2 = weight(1, "verde")
    m2.location = (L, 0, z1 - d_big - 0.5 - h2)
    rope([(L, 0, z1 - d_big - 0.2), (L, 0, z1 - d_big - 0.5)], r=0.04)
    for z in (z0, z1):
        rope([(0, 0, z), (L + 0.8, 0, z)], color="ghost", r=0.025)
    camera((5.4, -27, 4.6), (3.6, 0, 1.4), 50)
    render(f"{OUT}/v_motor.webp", W, H)


def truss(P, with_diag=True, upto=5):
    """Brazo en voladizo triangulado (2 paneles de 4 x 3). Etapas: 1 pared, 2 cuerdas, 3 montantes, 4 diagonales, 5 peso."""
    # pared
    P.add(wall_slab(-1.2, 7.2), "oscuro", 1)
    bar(P, (0, 0), (0, 6), 7, "gris", 1, 1)
    # cuerdas superior e inferior
    bar(P, (0, 4), (8, 4), 9, "amarillo", 2, 2)
    bar(P, (0, 1), (8, 1), 9, "amarillo", 2, 2)
    # montantes en x = 4 y x = 8
    for x in (4, 8):
        bar(P, (x, 1), (x, 4), 4, "azul", 1, 3)
    # pines: nudos con diagonal llevan pin largo
    diag_nodes = {(0, 4), (4, 1), (4, 4), (8, 1)}
    P_nodes = [(0, 4, 2), (0, 1, 2), (4, 4, 3), (4, 1, 3), (8, 4, 3), (8, 1, 3)]
    for x, z, st in P_nodes:
        peg(P, x, z, 3 if (x, z) in diag_nodes else 2, st)
    # diagonales (en tension): bajan hacia la punta
    bar(P, (0, 4), (4, 1), 6, "rojo", 3, 4)
    bar(P, (4, 4), (8, 1), 6, "rojo", 3, 4)


def truss_cam():
    camera((8.0, -31, 8.5), (4.2, 0, 2.0), 50)


def _truss_step(k):
    P = Parts()
    truss(P)
    P.show(k)
    truss_cam()
    return P


@image("voladizo", "v_s1")
def v_s1():
    _truss_step(1); render(f"{OUT}/v_s1.webp", W, H)


@image("voladizo", "v_s2")
def v_s2():
    _truss_step(2); render(f"{OUT}/v_s2.webp", W, H)


@image("voladizo", "v_s3")
def v_s3():
    _truss_step(3); render(f"{OUT}/v_s3.webp", W, H)


@image("voladizo", "v_s4")
def v_s4():
    _truss_step(4); render(f"{OUT}/v_s4.webp", W, H)


@image("voladizo", "v_hero")
def v_hero():
    P = Parts()
    truss(P)
    P.color_all()
    # carga colgada de la punta
    m, h = weight(3, "verde")
    m.location = (8, -2.0, 1.0 - 2.4 - h)
    rope([(8, -3.2, 1.0), (8, -3.2, -0.9)], r=0.05)
    m.location = (8, -3.2, -0.9 - h + 0.3)
    arrow((9.4, AY + 0.6, 1.2), (9.4, AY + 0.6, -0.6), "acento", r=0.09, head=0.4)
    # distancia L (de la pared a la carga)
    arrow((0, AY + 0.6, 5.5), (8, AY + 0.6, 5.5), "cian", r=0.05, head=0.3)
    arrow((8, AY + 0.6, 5.5), (0, AY + 0.6, 5.5), "cian", r=0.05, head=0.3)
    # momento en la pared (giro horario)
    arc_arrow((0, AY + 0.6, 2.5), 2.0, math.radians(200), math.radians(125), "cian", r=0.06)
    truss_cam()
    render(f"{OUT}/v_hero.webp", W, H)


def _two_beams(P_one_pin):
    """Dos vigas solapadas 3 agujeros: con un pin giran; con dos pines quedan rigidas."""
    ang = math.radians(-18) if P_one_pin else 0.0
    o1 = beam(6, "amarillo"); plane(o1, 0, 2, 1)
    # la segunda viga gira alrededor del pin de la izquierda de la zona de union (x = 3)
    px = 3.0
    o2 = beam(6, "azul")
    ang2 = ang
    m = Matrix.Translation((px, -2, 2)) @ Matrix.Rotation(math.pi / 2, 4, "X") @ Matrix.Rotation(ang2, 4, "Z")
    o2.matrix_world = m
    pins = []
    p1 = pin(2.1); plane(p1, px, 2, 1.5); pins.append(p1)
    if not P_one_pin:
        p2 = pin(2.1); plane(p2, px + 1, 2, 1.5); pins.append(p2)
    return o1, o2


@image("voladizo", "v_error_mal")
def v_error_mal():
    o1, o2 = _two_beams(True)
    # carga en el extremo de la viga azul y giro
    arc_arrow((3.0, AY, 2.0), 1.3, math.radians(10), math.radians(-30), "mal", r=0.06)
    camera((4.5, -18, 5.5), (4.0, 0, 1.8), 50)
    render(f"{OUT}/v_error_mal.webp", W, H)


@image("voladizo", "v_error_bien")
def v_error_bien():
    o1, o2 = _two_beams(False)
    m1 = marker(3.0, 2.0, "bien", y=AY + 0.5, r=0.22)
    m2 = marker(4.0, 2.0, "bien", y=AY + 0.5, r=0.22)
    camera((4.5, -18, 5.5), (4.0, 0, 1.8), 50)
    render(f"{OUT}/v_error_bien.webp", W, H)


# ---------------------------------------------------------------- principal

def main():
    todo = [(n, g, f) for n, (g, f) in IMAGES.items() if (GROUP in ("all", g)) and (not ONLY or n in ONLY)]
    begin()
    for n, g, f in todo:
        f()
        purge()
    print("HECHO", len(todo))


main()
