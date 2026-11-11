"""
Maker Student - imagenes de la unidad "Proyecto: tu brazo de 2-3 GDL" (requisitos, calculos, montaje por fases).

Uso (desde la raiz del repo):
  blender -b --factory-startup --python tools/blender/maker_u_proy.py -- [req|calc|build|all] [nombre_imagen ...]

Reutiliza el constructor `build_arm` de maker_u_brazo.py (mismo brazo que en la unidad "Brazos y manipuladores").
El brazo del proyecto: eslabon 1 = viga de 11 agujeros (10 pasos = 8,0 cm), eslabon 2 = viga de 9 (8 pasos = 6,4 cm).
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import maker_u_brazo as B
from maker_u_brazo import *   # build_arm, box, cyl, dim, arc_xy, circle_curve, marker3, begin, purge, P2, SH_Z...

OUT = os.path.join(ROOT, "public", "assets", "img", "proy")
IMAGES = {}
N1, N2 = 11, 9
L1, L2 = N1 - 1, N2 - 1


def image(group, name):
    def deco(fn):
        IMAGES[name] = (group, fn)
        return fn
    return deco


def arm(**kw):
    kw.setdefault("n1", N1)
    kw.setdefault("n2", N2)
    return build_arm(**kw)


def ik(T, l1=L1, l2=L2):
    """Angulos (grados) de los eslabones 1 y 2 para llevar el centro de la palma a T=(x, z), codo arriba."""
    dx, dz = T[0], T[1] - SH_Z
    d = math.hypot(dx, dz)
    A = math.acos((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))
    a1 = math.atan2(dz, dx) + A
    E = (l1 * math.cos(a1), SH_Z + l1 * math.sin(a1))
    a2 = math.atan2(T[1] - E[1], T[0] - E[0])
    return math.degrees(a1), math.degrees(a2)


def cam(a=(4, -52, 24), t=(2.5, 0, 3.4), lens=70):
    camera(a, t, lens)


def side_cam():
    camera((9, -74, 8.5), (8.5, 0, 3.2), 90)


# ---------------------------------------------------------------- REQUISITOS

CAP = (10.0, 0.0)
TARGET = (-10.0, 0.0)


def _table(cap=True, target=True):
    if cap:
        c = cyl(0.8, 0.7, "rojo"); place(c, CAP[0], CAP[1], -0.3)
    if target:
        circle_curve((TARGET[0], TARGET[1], -0.62), 1.4, "bien", r=0.09)


@image("req", "r_mesa")
def r_mesa():
    _table()
    a1, a2 = ik((CAP[0], 3.4))
    P, g = arm(a1=a1, a2=a2); P.paint()
    arc_xy((0, 0, -0.55), 10.0, math.radians(8), math.radians(172), "acento", r=0.08)
    cam((3, -44, 25), (0, 0, 2.0), 50); render(f"{OUT}/r_mesa.webp", W, H)


@image("req", "r_esquema")
def r_esquema():
    a1, a2 = 38, -32
    S = (0.0, SH_Z); E = pt(S, L1, math.radians(a1)); T = pt(E, L2, math.radians(a2))
    rope([(0, 0, 0.0), (0, 0, SH_Z)], "gris", 0.22)
    rope([(S[0], 0, S[1]), (E[0], 0, E[1])], "amarillo", 0.2)
    rope([(E[0], 0, E[1]), (T[0], 0, T[1])], "rojo", 0.2)
    marker3(0, 0, 0.0, "acento", 0.5)
    marker3(S[0], 0, S[1], "cian", 0.5)
    marker3(E[0], 0, E[1], "bien", 0.5)
    marker3(T[0], 0, T[1], "masa", 0.4)
    arc_xy((0, 0, 0.0), 2.0, math.radians(200), math.radians(330), "acento", r=0.07)
    arc_arrow((S[0], -0.6, S[1]), 2.4, math.radians(8), math.radians(a1 - 6), "cian", r=0.07)
    arc_arrow((E[0], -0.6, E[1]), 2.2, math.radians(a1 + 2), math.radians(a2 + 6), "bien", r=0.07)
    cam((8, -34, 18), (5, 0, 6.0), 50); render(f"{OUT}/r_esquema.webp", W, H)


@image("req", "r_alcance")
def r_alcance():
    P, g = arm(a1=8, a2=8, cargo=False); P.paint()
    S, E, T = g["S"], g["E"], g["T"]
    zt = 9.2
    dim((S[0], -7, zt), (E[0], -7, zt), "acento")
    dim((E[0], -7, zt), (T[0], -7, zt), "cian")
    dim((S[0], -7, zt + 1.6), (T[0], -7, zt + 1.6), "masa")
    camera((9, -74, 12), (9, 0, 5.5), 90); render(f"{OUT}/r_alcance.webp", W, H)


@image("req", "r_hero")
def r_hero():
    _table(cap=False)
    a1, a2 = ik((6.0, 6.2))
    P, g = arm(a1=a1, a2=a2, cargo=True, cargo_c="rojo"); P.paint()
    T = g["T"]
    arc_xy((0, 0, -0.55), 10.0, math.radians(100), math.radians(172), "acento", r=0.08)
    cam((3, -44, 25), (0, 0, 2.0), 50); render(f"{OUT}/r_hero.webp", W, H)


def _compare(n1, n2, heavy):
    P, g = build_arm(a1=0, a2=0, n1=n1, n2=n2, cargo=True, cargo_c="masa")
    P.paint()
    T = g["T"]
    col = "mal" if heavy else "bien"
    arrow((T[0], -7.5, 4.4), (T[0], -7.5, 4.4 - (2.8 if heavy else 1.2)), col, r=0.16 if heavy else 0.08, head=0.45 if heavy else 0.34)
    dim((0, -7.5, -0.2), (T[0], -7.5, -0.2), col)
    camera((14, -62, 11), (14, 0, 3.2), 60)


@image("req", "r_err_mal")
def r_err_mal():
    _compare(15, 13, True); render(f"{OUT}/r_err_mal.webp", W, H)


@image("req", "r_err_bien")
def r_err_bien():
    _compare(9, 7, False); render(f"{OUT}/r_err_bien.webp", W, H)


# ---------------------------------------------------------------- CALCULOS

def _calc_scene(step):
    P, g = arm(a1=0, a2=0, cargo=True)
    P.paint()
    T = g["T"]
    mid = T[0] / 2
    arrow((T[0], -7.5, 4.3), (T[0], -7.5, 1.3), "acento", r=0.1, head=0.4)
    dim((0, -7.5, -0.2), (T[0], -7.5, -0.2), "masa")
    if step >= 2:
        arrow((mid, -7.5, 4.6), (mid, -7.5, 2.6), "cian", r=0.08, head=0.36)
        dim((0, -7.5, 0.9), (mid, -7.5, 0.9), "cian")
    if step >= 3:
        arc_arrow((0, -3.2, SH_Z), 2.6, math.radians(20), math.radians(110), "bien", r=0.09)
    if step >= 4:
        servo_items = [o for o, c, s in P.items if c == "servo"]
        set_mat(servo_items[0], "bien")
        arc_arrow((0, -3.2, SH_Z), 3.6, math.radians(20), math.radians(110), "bien", r=0.09)
    return g


@image("calc", "k_s1")
def k_s1():
    _calc_scene(1); side_cam(); render(f"{OUT}/k_s1.webp", W, H)


@image("calc", "k_s2")
def k_s2():
    _calc_scene(2); side_cam(); render(f"{OUT}/k_s2.webp", W, H)


@image("calc", "k_s3")
def k_s3():
    _calc_scene(3); side_cam(); render(f"{OUT}/k_s3.webp", W, H)


@image("calc", "k_s4")
def k_s4():
    _calc_scene(4); side_cam(); render(f"{OUT}/k_s4.webp", W, H)


@image("calc", "k_contrapeso")
def k_contrapeso():
    P, g = arm(a1=0, a2=0, cargo=True); P.paint()
    rear = beam(5, "gris"); plane(rear, -5, SH_Z, g["ly"]["l1"]); set_mat(rear, "gris")
    pn = pin(2.4); plane(pn, -5, SH_Z, 3.0); set_mat(pn, "oscuro")
    hg = beam(3, "rojo"); plane(hg, -5, SH_Z, 3.0 + 0.0, rot=-math.pi / 2)
    m, h = weight(3, "verde")
    m.matrix_world = Matrix.Translation((-5, -4.5, SH_Z - 2 + 0.3 - h))
    T = g["T"]
    arrow((T[0], -7.5, 4.3), (T[0], -7.5, 1.3), "acento", r=0.1, head=0.4)
    arrow((-5, -7.5, SH_Z - 2.3), (-5, -7.5, SH_Z - 4.3), "acento", r=0.14, head=0.4)
    dim((0, -7.5, -0.2), (T[0], -7.5, -0.2), "masa")
    dim((-5, -7.5, -0.2), (0, -7.5, -0.2), "masa")
    camera((8, -80, 8.5), (7.0, 0, 3.2), 90); render(f"{OUT}/k_contrapeso.webp", W, H)


# ---------------------------------------------------------------- CONSTRUCCION

POSE = dict(a1=40, a2=-50)


def _phase(k):
    P, g = arm(**POSE, cargo=True, cargo_c="rojo")
    P.show(k)
    arm_cam((13, -33, 15), (5.5, 0, 6.3)); render(f"{OUT}/f_s{k}.webp", W, H)


@image("build", "f_s1")
def f_s1(): _phase(1)


@image("build", "f_s2")
def f_s2(): _phase(2)


@image("build", "f_s3")
def f_s3(): _phase(3)


@image("build", "f_s4")
def f_s4(): _phase(4)


@image("build", "f_s5")
def f_s5(): _phase(5)


@image("build", "f_hero")
def f_hero():
    P, g = arm(**POSE, cargo=True, cargo_c="rojo"); P.paint()
    arc_xy((0, 0, 0.6), 2.6, math.radians(200), math.radians(320), "acento", r=0.08)
    arc_arrow((0, -3.0, SH_Z), 2.6, math.radians(8), math.radians(36), "cian", r=0.08)
    E = g["E"]
    arc_arrow((E[0], -4.9, E[1]), 2.2, math.radians(42), math.radians(-8), "bien", r=0.08)
    arm_cam((13, -33, 15), (5.5, 0, 6.3)); render(f"{OUT}/f_hero.webp", W, H)


def _err_arm(good):
    P, g = arm(a1=0, a2=0, cargo=True, cargo_c="masa"); P.paint()
    servo_items = [o for o, c, s in P.items if c == "servo"]
    set_mat(servo_items[0], "bien" if good else "mal")
    T = g["T"]
    if good:
        arrow((T[0], -7.5, 4.3), (T[0], -7.5, 3.1), "bien", r=0.07, head=0.3)
    else:
        arrow((T[0], -7.5, 4.8), (T[0], -7.5, 0.4), "mal", r=0.2, head=0.55)
    side_cam()


@image("build", "f_err_mal")
def f_err_mal():
    _err_arm(False); render(f"{OUT}/f_err_mal.webp", W, H)


@image("build", "f_err_bien")
def f_err_bien():
    _err_arm(True); render(f"{OUT}/f_err_bien.webp", W, H)


# ---------------------------------------------------------------- principal

def main_proy():
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else ["all"]
    group = args[0] if args else "all"
    only = set(args[1:])
    todo = [(n, g, f) for n, (g, f) in IMAGES.items() if (group in ("all", g)) and (not only or n in only)]
    begin()
    for n, g, f in todo:
        f()
        purge()
    print("HECHO", len(todo))


main_proy()
