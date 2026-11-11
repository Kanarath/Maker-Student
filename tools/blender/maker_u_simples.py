"""
Maker Student - imagenes de la unidad "Maquinas simples y correas"
(plano inclinado y cuna, tornillo, rueda y eje, correas y cadenas).

Uso (desde la raiz del repo):
  blender -b --factory-startup --python tools/blender/maker_u_simples.py -- [rampa|tornillo|correas|all] [nombre_imagen ...]

Salida: public/assets/img/simples/<nombre>.webp. Las piezas nuevas (rampa, cuna, tornillo con rosca,
rueda con eje, correa y cadena) se definen aqui con las primitivas de maker_lib.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import maker_lib as L
from maker_lib import *

OUT = os.path.join(ROOT, "public", "assets", "img", "simples")
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


def disc(r, t, color, n=48, bevel=0.02):
    pts = [(r * math.cos(2 * math.pi * i / n), r * math.sin(2 * math.pi * i / n)) for i in range(n)]
    return poly(pts, t, color, bevel, smooth=True)


def cyl(r, depth, color, loc=(0, 0, 0), seg=32):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r, radius2=r, depth=depth,
                          matrix=Matrix.Translation(loc))
    return L._to_obj("cil", bm, color, bevel=0.015)


def helix(r, pitch, z0, z1, color="amarillo", bevel=0.09, loc=(0, 0, 0), phase=0.0):
    n_per = 32
    N = int((z1 - z0) / pitch * n_per)
    pts = [(loc[0] + r * math.cos(phase + 2 * math.pi * i / n_per), loc[1] + r * math.sin(phase + 2 * math.pi * i / n_per),
            loc[2] + z0 + pitch * i / n_per) for i in range(N + 1)]
    return rope(pts, color, bevel)


def arc_h(center, z, radius, a0, a1, color="acento", r=0.07):
    """Flecha curva en un plano horizontal (XY), alrededor del eje vertical Z."""
    n = 30
    pts = [(center[0] + radius * math.cos(a0 + (a1 - a0) * i / n), center[1] + radius * math.sin(a0 + (a1 - a0) * i / n), z)
           for i in range(n + 1)]
    o = rope(pts, color, r)
    tip = Vector(pts[-1])
    tang = (Vector(pts[-1]) - Vector(pts[-3])).normalized()
    arrow(tip - tang * 0.001, tip + tang * 0.36, color, r=r, head=0.36)
    return o


def hand(P, stage=4):
    pass


def tri_ramp(hx, h, layer, color="azul", t=0.9):
    return poly([(0, 0), (hx, 0), (hx, h)], t, color, bevel=0.03)


def vec(a, b):
    return Vector((a[0], 0, a[1])), Vector((b[0], 0, b[1]))


def arrow_xz(p0, p1, y, color="acento", r=0.07, head=0.28):
    return arrow((p0[0], y, p0[1]), (p1[0], y, p1[1]), color, r=r, head=head)


def cam(xm, zm, dist=22, lift=5.0, shift=3.0, lens=50):
    camera((xm + shift, -dist, zm + lift), (xm, 0, zm), lens)


# ---------------------------------------------------------------- RAMPA Y CUNA

ALPHA = math.asin(0.25)   # rampa de 12 de largo y 3 de alto
HX = 12 * math.cos(ALPHA)
SL = (math.cos(ALPHA), math.sin(ALPHA))
NL = (-math.sin(ALPHA), math.cos(ALPHA))
AYR = -3.0


def build_ramp_beams():
    P = Parts()
    base = P.add(beam(13, "gris"), "gris", 1); plane(base, 0, 0, 0)
    up = P.add(beam(4, "azul"), "azul", 1); plane(up, HX, 0, 0, rot=math.pi / 2)
    ramp = P.add(beam(13, "amarillo"), "amarillo", 2); plane(ramp, 0, 0, 1.0, rot=ALPHA)
    p1 = P.add(pin(2.1), "oscuro", 2); plane(p1, 0, 0, 0.5)
    p2 = P.add(pin(2.1), "oscuro", 2); plane(p2, HX, 3, 0.5)
    return P


def slope_pt(s, off=0.0):
    return (s * SL[0] + off * NL[0], s * SL[1] + off * NL[1])


def add_load_beams(P, s=7.0, stage=3):
    c = slope_pt(s, 0.45 + 0.6)
    box = P.add(rect(1.8, 1.2, 0.9, "verde"), "verde", stage)
    plane(box, c[0], c[1], 1.0, rot=ALPHA)
    return c


def ramp_forces(c, F=0.6, Wl=2.4, y=AYR):
    arrow_xz(c, (c[0], c[1] - Wl), y, "cian", r=0.07, head=0.3)
    s = (c[0] + SL[0] * 1.1, c[1] + SL[1] * 1.1)
    e = (s[0] + SL[0] * (F + 0.3), s[1] + SL[1] * (F + 0.3))
    arrow_xz(s, e, y, "acento", r=0.07, head=0.3)


def ramp_cam():
    cam(6.0, 2.0, dist=21, lift=5.0, shift=3.0)


@image("rampa", "ri_s1")
def ri_s1():
    P = build_ramp_beams(); add_load_beams(P); P.show(1); ramp_cam(); render(f"{OUT}/ri_s1.webp", W, H)


@image("rampa", "ri_s2")
def ri_s2():
    P = build_ramp_beams(); add_load_beams(P); P.show(2); ramp_cam(); render(f"{OUT}/ri_s2.webp", W, H)


@image("rampa", "ri_s3")
def ri_s3():
    P = build_ramp_beams(); add_load_beams(P); P.show(3); ramp_cam(); render(f"{OUT}/ri_s3.webp", W, H)


@image("rampa", "ri_hero")
def ri_hero():
    P = build_ramp_beams(); c = add_load_beams(P); P.full()
    ramp_forces(c)
    ramp_cam(); render(f"{OUT}/ri_hero.webp", W, H)


def solid_ramp(hx, h, s_frac=0.55):
    """Rampa maciza (triangulo azul) con la carga y sus dos flechas; la flecha de empuje vale peso*h/largo."""
    o = tri_ramp(hx, h, 1.0); plane(o, 0, 0, 1.0)
    Ls = math.hypot(hx, h)
    a = math.atan2(h, hx)
    d = (math.cos(a), math.sin(a)); n = (-math.sin(a), math.cos(a))
    s = Ls * s_frac
    c = (s * d[0] + 0.6 * n[0], s * d[1] + 0.6 * n[1])
    box = rect(1.8, 1.2, 0.9, "verde"); plane(box, c[0], c[1], 1.0, rot=a)
    Wl = 2.4
    arrow_xz(c, (c[0], c[1] - Wl), AYR, "cian", r=0.07, head=0.3)
    F = Wl * h / Ls
    st = (c[0] + d[0] * 1.1, c[1] + d[1] * 1.1)
    arrow_xz(st, (st[0] + d[0] * (F + 0.3), st[1] + d[1] * (F + 0.3)), AYR, "acento", r=0.07, head=0.3)
    # altura: linea vertical fina en el extremo alto
    return a


@image("rampa", "ri_corta")
def ri_corta():
    solid_ramp(4.0, 3.0); cam(3.0, 1.9, dist=16, lift=4.0, shift=1.5); render(f"{OUT}/ri_corta.webp", W, H)


@image("rampa", "ri_larga")
def ri_larga():
    # 12 de largo real (11,62 de base) y 3 de alto
    solid_ramp(HX, 3.0); cam(6.0, 1.8, dist=21, lift=4.5, shift=2.0); render(f"{OUT}/ri_larga.webp", W, H)


@image("rampa", "ri_cuna")
def ri_cuna():
    """Cuna (amarilla) clavada entre dos bloques: la fuerza hacia abajo se convierte en empuje lateral."""
    left = poly([(-3.2, 0), (-0.05, 0), (-0.05, 2.0), (-0.6, 4.0), (-3.2, 4.0)], 1.6, "gris"); plane(left, 0, 0, 1.0)
    right = poly([(3.2, 0), (0.05, 0), (0.05, 2.0), (0.6, 4.0), (3.2, 4.0)], 1.6, "gris"); plane(right, 0, 0, 1.0)
    wedge = poly([(0, 2.0), (0.9, 5.0), (1.3, 5.0), (1.3, 5.6), (-1.3, 5.6), (-1.3, 5.0), (-0.9, 5.0)], 1.6, "amarillo")
    plane(wedge, 0, 0, 1.0)
    arrow_xz((0, 8.2), (0, 6.0), AYR, "acento", r=0.1, head=0.4)
    arrow_xz((-1.4, 2.6), (-2.7, 2.6), AYR, "cian", r=0.08, head=0.34)
    arrow_xz((1.4, 2.6), (2.7, 2.6), AYR, "cian", r=0.08, head=0.34)
    camera((3.5, -21, 8.5), (0, 0, 3.4), 50); render(f"{OUT}/ri_cuna.webp", W, H)


def error_ramp(good):
    P = build_ramp_beams(); c = add_load_beams(P); P.full()
    top = (HX, 3.0)
    if good:
        # altura: vertical desde la base hasta el extremo alto
        arrow_xz((HX + 1.0, 0.0), (HX + 1.0, 3.0), AYR, "bien", r=0.06, head=0.28)
        arrow_xz((HX + 1.0, 3.0), (HX + 1.0, 0.0), AYR, "bien", r=0.06, head=0.28)
    else:
        # mal: medir la altura a lo largo de la rampa
        o = (0.0, 0.9)
        arrow_xz((0.0, 1.1), (HX * 0.99, 3.45), AYR, "mal", r=0.06, head=0.3)
    ramp_cam()
    render(f"{OUT}/ri_error_{'bien' if good else 'mal'}.webp", W, H)


@image("rampa", "ri_error_mal")
def ri_error_mal():
    error_ramp(False)


@image("rampa", "ri_error_bien")
def ri_error_bien():
    error_ramp(True)


# ---------------------------------------------------------------- TORNILLO, RUEDA Y EJE

def build_screw(pitch, x=0.0, y=0.0, z_nut=0.0, color="amarillo", with_nut=True, nut_color="gris", length=4.8, r=0.5):
    z0, z1 = z_nut - 2.2, z_nut - 2.2 + length
    core = cyl(r - 0.03, length, "eje", loc=(x, y, (z0 + z1) / 2))
    th = helix(r, pitch, z0 + 0.1, z1 - 0.2, color, bevel=min(0.1, pitch * 0.2), loc=(x, y, 0))
    head = cyl(0.85, 0.45, "oscuro", loc=(x, y, z1 + 0.22))
    slot = rect(1.5, 0.22, 0.2, "eje"); slot.location = (x, y, z1 + 0.5)
    nut = None
    if with_nut:
        nut = rect(3.2, 3.2, 0.8, nut_color); nut.location = (x, y, z_nut)
    return core, th, head, slot, nut


def screw_cam():
    camera((5.0, -13.0, 5.0), (0.3, 0, 0.9), 50)


@image("tornillo", "tr_hero")
def tr_hero():
    build_screw(0.9)
    arc_h((0, 0), 3.5, 1.4, math.radians(40), math.radians(330), "acento", r=0.07)
    arrow((2.4, 0, 0.5), (2.4, 0, 1.9), "cian", r=0.07, head=0.32)
    screw_cam(); render(f"{OUT}/tr_hero.webp", W, H)


@image("tornillo", "tr_paso")
def tr_paso():
    """Dos tornillos con la misma longitud: paso fino (avanza poco por vuelta) y paso grueso."""
    build_screw(0.45, x=-2.6, color="verde", nut_color="gris")
    build_screw(1.1, x=2.6, color="amarillo", nut_color="gris")
    arrow((-4.6, 0, 0.5), (-4.6, 0, 0.5 + 0.45 + 0.28), "cian", r=0.05, head=0.2)
    arrow((4.6, 0, 0.5), (4.6, 0, 0.5 + 1.1 + 0.28), "cian", r=0.06, head=0.3)
    camera((0.5, -13.5, 4.6), (0, 0, 0.8), 50); render(f"{OUT}/tr_paso.webp", W, H)


# rueda y eje: ratio 4 : 1
RC = (4.0, 6.0)
RW, RD = 2.0, 0.5     # radios de la rueda y del tambor del eje


def build_wheel_axle(rope_on=True):
    P = Parts()
    b = P.add(beam(9, "gris"), "gris", 1); plane(b, 0, 0, 0)
    v = P.add(beam(8, "azul"), "azul", 1); plane(v, RC[0], 0, 0, rot=math.pi / 2)
    ax = P.add(axle(3.8), "eje", 2); plane(ax, RC[0], RC[1], 1.3)
    wh = P.add(pulley(RW, "amarillo", 0.55), "amarillo", 3); plane(wh, RC[0], RC[1], 1.0)
    dr = P.add(pulley(RD, "rojo", 0.7), "rojo", 3); plane(dr, RC[0], RC[1], 1.95)
    if rope_on:
        gw, gd = 0.8 * RW, 0.8 * RD
        r1 = P.add(rope([(RC[0] - gw, -1.0, RC[1]), (RC[0] - gw, -1.0, 2.3)], "cuerda"), "cuerda", 4)
        r2 = P.add(rope([(RC[0] + gd, -1.95, RC[1]), (RC[0] + gd, -1.95, 2.9)], "cuerda"), "cuerda", 4)
        m, h = weight(2, "verde")
        P.add(m, "verde", 4)
        m.location = (RC[0] + gd, -1.95, 2.9 - h)
    return P


def wa_cam():
    camera((8.0, -25, 10.0), (4.0, 0, 4.2), 50)


@image("tornillo", "re_s1")
def re_s1():
    P = build_wheel_axle(); P.show(1); wa_cam(); render(f"{OUT}/re_s1.webp", W, H)


@image("tornillo", "re_s2")
def re_s2():
    P = build_wheel_axle(); P.show(2); wa_cam(); render(f"{OUT}/re_s2.webp", W, H)


@image("tornillo", "re_s3")
def re_s3():
    P = build_wheel_axle(); P.show(3); wa_cam(); render(f"{OUT}/re_s3.webp", W, H)


@image("tornillo", "re_s4")
def re_s4():
    P = build_wheel_axle(); P.show(4); wa_cam(); render(f"{OUT}/re_s4.webp", W, H)


@image("tornillo", "re_hero")
def re_hero():
    P = build_wheel_axle(); P.full()
    gw, gd = 0.8 * RW, 0.8 * RD
    arrow_xz((RC[0] - gw, 2.3), (RC[0] - gw, 1.45), -1.0, "acento", r=0.07, head=0.3)
    arrow_xz((RC[0] + gd, 1.8), (RC[0] + gd, -1.0), -1.95, "cian", r=0.07, head=0.3)
    wa_cam(); render(f"{OUT}/re_hero.webp", W, H)


def re_error(good):
    P = build_wheel_axle(); P.full()
    z = RC[1]
    y = -2.9
    if good:
        arrow_xz((RC[0], z + 2.6), (RC[0] - RW, z + 2.6), y, "bien", r=0.05, head=0.25)
        arrow_xz((RC[0], z + 3.3), (RC[0] + RD, z + 3.3), y, "bien", r=0.05, head=0.2)
    else:
        arrow_xz((RC[0] - RD, z + 2.6), (RC[0] - RW, z + 2.6), y, "mal", r=0.05, head=0.25)
        arrow_xz((RC[0] - RD, z + 3.3), (RC[0] + RD, z + 3.3), y, "mal", r=0.05, head=0.2)
    wa_cam()
    render(f"{OUT}/re_error_{'bien' if good else 'mal'}.webp", W, H)


@image("tornillo", "re_error_mal")
def re_error_mal():
    re_error(False)


@image("tornillo", "re_error_bien")
def re_error_bien():
    re_error(True)


# ---------------------------------------------------------------- CORREAS Y CADENAS

C1 = (2.0, 4.0)
C2 = (8.0, 4.0)
YB = -1.3


def arcs_pts(arcs, n=40):
    pts = []
    for (c, r, a0, a1) in arcs:
        for i in range(n + 1):
            a = a0 + (a1 - a0) * i / n
            pts.append((c[0] + r * math.cos(a), c[1] + r * math.sin(a)))
    return pts


def belt_arcs(r1, r2, crossed=False):
    d = C2[0] - C1[0]
    if not crossed:
        b = math.acos((r2 - r1) / d)
        return [(C2, r2, -b, b), (C1, r1, b, 2 * math.pi - b)]
    g = math.acos((r1 + r2) / d)
    return [(C2, r2, math.pi + g, 3 * math.pi - g), (C1, r1, 2 * math.pi - g, g)]


def path_pts(r1, r2, crossed=False, sag=0.0):
    arcs = belt_arcs(r1, r2, crossed)
    pts = arcs_pts(arcs, 40)
    if sag:
        # la tira de arriba (de la ultima punta del arco grande a la primera del pequeno) se hunde
        res = []
        k = 41
        for i, p in enumerate(pts):
            res.append(p)
        a_end = pts[k - 1]
        b_start = pts[k]
        mid = []
        for j in range(1, 20):
            t = j / 20
            mid.append((a_end[0] + (b_start[0] - a_end[0]) * t, a_end[1] + (b_start[1] - a_end[1]) * t - sag * 4 * t * (1 - t)))
        pts = pts[:k] + mid + pts[k:]
    return pts


def build_belts(kind="correa", crossed=False, sag=0.0, tight=True):
    P = Parts()
    top = P.add(beam(11, "gris"), "gris", 1); plane(top, 0, 4, 1.0)
    for x in (0, 10):
        leg = P.add(beam(5, "azul"), "azul", 1); plane(leg, x, 0, 0, rot=math.pi / 2)
        pn = P.add(pin(2.1), "oscuro", 1); plane(pn, x, 4, 0.5)
    for c in (C1, C2):
        ax = P.add(axle(2.6), "eje", 1); plane(ax, c[0], c[1], 1.9)
    if kind == "correa":
        a, b = 0.8, 2.4
        p1 = P.add(pulley(a, "azul"), "azul", 2); plane(p1, C1[0], C1[1], 2.2)
        p2 = P.add(pulley(b, "amarillo"), "amarillo", 3); plane(p2, C2[0], C2[1], 2.2)
        ga, gb = 0.8 * a + 0.04, 0.8 * b + 0.04
        pts = path_pts(ga, gb, crossed, sag)
        P.add(rope([(x, -2.2, z) for x, z in pts] + [(pts[0][0], -2.2, pts[0][1])], "cuerda", 0.06), "cuerda", 4)
    else:
        t1, t2 = 8, 24
        g1 = P.add(gear(t1, "azul"), "azul", 2); plane(g1, C1[0], C1[1], 2.2)
        g2 = P.add(gear(t2, "amarillo"), "amarillo", 3); plane(g2, C2[0], C2[1], 2.2)
        pts = path_pts(t1 / 16, t2 / 16, False)
        for i, (px, pz, ang) in enumerate(chain_links(pts)):
            lk = rect(0.31, 0.15, 0.34, "gris" if i % 2 else "eje", 0.02)
            P.add(lk, "gris" if i % 2 else "eje", 4)
            plane(lk, px, pz, 2.2, rot=ang)
    return P


def chain_links(pts, pitch=math.pi / 8):
    # longitud total y reparto de eslabones equiespaciados
    seg = [math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]) for i in range(len(pts) - 1)]
    total = sum(seg)
    n = max(2, round(total / pitch))
    step = total / n
    out = []
    acc = 0.0
    k = 0
    for j in range(n):
        target = j * step
        while k < len(seg) - 1 and acc + seg[k] < target:
            acc += seg[k]
            k += 1
        t = (target - acc) / seg[k] if seg[k] else 0
        x = pts[k][0] + (pts[k + 1][0] - pts[k][0]) * t
        z = pts[k][1] + (pts[k + 1][1] - pts[k][1]) * t
        ang = math.atan2(pts[k + 1][1] - pts[k][1], pts[k + 1][0] - pts[k][0])
        out.append((x, z, ang))
    return out


def belt_cam():
    camera((8.0, -22, 9.5), (5.0, 0, 3.8), 50)


@image("correas", "co_s1")
def co_s1():
    P = build_belts(); P.show(1); belt_cam(); render(f"{OUT}/co_s1.webp", W, H)


@image("correas", "co_s2")
def co_s2():
    P = build_belts(); P.show(2); belt_cam(); render(f"{OUT}/co_s2.webp", W, H)


@image("correas", "co_s3")
def co_s3():
    P = build_belts(); P.show(3); belt_cam(); render(f"{OUT}/co_s3.webp", W, H)


@image("correas", "co_s4")
def co_s4():
    P = build_belts(); P.show(4); belt_cam(); render(f"{OUT}/co_s4.webp", W, H)


def turn_arrows(same=True, y=-3.0, r1=0.8 + 0.5, r2=2.4 + 0.5):
    # motriz (pequena) gira antihoraria; la conducida, igual (abierta) u opuesta (cruzada)
    arc_arrow((C1[0], y, C1[1]), r1, math.radians(110), math.radians(30), "acento", r=0.07)
    if same:
        arc_arrow((C2[0], y, C2[1]), r2, math.radians(130), math.radians(80), "cian", r=0.07)
    else:
        arc_arrow((C2[0], y, C2[1]), r2, math.radians(80), math.radians(130), "cian", r=0.07)


@image("correas", "co_hero")
def co_hero():
    P = build_belts(); P.full()
    arc_arrow((C1[0], -3.0, C1[1]), 1.45, math.radians(30), math.radians(150), "acento", r=0.07)
    arc_arrow((C2[0], -3.0, C2[1]), 3.0, math.radians(60), math.radians(100), "cian", r=0.07)
    belt_cam(); render(f"{OUT}/co_hero.webp", W, H)


@image("correas", "co_cruzada")
def co_cruzada():
    P = build_belts(crossed=True); P.full()
    arc_arrow((C1[0], -3.0, C1[1]), 1.45, math.radians(30), math.radians(150), "acento", r=0.07)
    arc_arrow((C2[0], -3.0, C2[1]), 3.0, math.radians(100), math.radians(60), "cian", r=0.07)
    belt_cam(); render(f"{OUT}/co_cruzada.webp", W, H)


@image("correas", "co_cadena")
def co_cadena():
    P = build_belts(kind="cadena"); P.full()
    arc_arrow((C1[0], -3.0, C1[1]), 1.1, math.radians(30), math.radians(150), "acento", r=0.07)
    arc_arrow((C2[0], -3.0, C2[1]), 2.3, math.radians(60), math.radians(100), "cian", r=0.07)
    belt_cam(); render(f"{OUT}/co_cadena.webp", W, H)


@image("correas", "co_error_mal")
def co_error_mal():
    P = build_belts(sag=1.3); P.full()
    belt_cam(); render(f"{OUT}/co_error_mal.webp", W, H)


@image("correas", "co_error_bien")
def co_error_bien():
    P = build_belts(); P.full()
    belt_cam(); render(f"{OUT}/co_error_bien.webp", W, H)


# ---------------------------------------------------------------- principal

def main():
    todo = [(n, g, f) for n, (g, f) in IMAGES.items() if (GROUP in ("all", g)) and (not ONLY or n in ONLY)]
    begin()
    for n, g, f in todo:
        f()
        purge()
    print("HECHO", len(todo))


main()
