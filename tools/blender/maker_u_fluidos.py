"""
Maker Student - imagenes de la unidad "Neumatica e hidraulica" (presion, pistones, aire y brazo hidraulico de jeringuillas).

Uso (desde la raiz del repo):
  blender -b --factory-startup --python tools/blender/maker_u_fluidos.py -- [presion|pistones|brazo|all] [nombre_imagen ...]

Piezas nuevas definidas aqui: jeringuilla SIN AGUJA (cuerpo transparente, embolo, vastago, pestanas, boquilla),
tubo flexible con agua, burbujas, clavo y bloque de madera. Formas genericas, sin marcas.
Salida: public/assets/img/fluidos/<nombre>.webp. Lo nuevo en color y lo anterior en gris.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import maker_lib
from maker_lib import *
from maker_lib import _mat, _prism, _to_obj

OUT = os.path.join(ROOT, "public", "assets", "img", "fluidos")
args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else ["all"]
GROUP = args[0] if args else "all"
ONLY = set(args[1:])
W, H = 1280, 720
SAMPLES = 40
if os.environ.get("MAKER_FAST"):  # vista previa rapida (no se guarda en public/)
    W, H, SAMPLES = 640, 360, 6
    OUT = os.environ["MAKER_FAST"]

EXTRA = {
    "agua": ("#2f9cff", 0.0, 0.15),
    "madera": ("#b7864f", 0.0, 0.6),
    "aire": ("#e8eefc", 0.0, 0.3),
    "goma": ("#23252d", 0.0, 0.6),
    "carton": ("#c9a46a", 0.0, 0.7),
    "muelle": ("#c9ced9", 0.6, 0.3),
}
_orig_M = maker_lib.M
_GLASS = {}


def _glass(name, color, alpha):
    if name in _GLASS:
        return _GLASS[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*hexc(color), 1)
    b.inputs["Roughness"].default_value = 0.08
    b.inputs["Alpha"].default_value = alpha
    try:
        m.surface_render_method = "BLENDED"
    except Exception:
        pass
    m.diffuse_color = (*hexc(color), alpha)
    _GLASS[name] = m
    return m


def _M2(key):
    if key == "vidrio":
        return _glass("vidrio", "#cfe3ff", 0.20)
    if key == "vidrio_g":
        return _glass("vidrio_g", "#7b8196", 0.22)
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
    studio(floor_z=-1.3, size=300)
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
    bpy.data.objects["Suelo"].location.z = -1.3


def floor(z):
    bpy.data.objects["Suelo"].location.z = z


class Parts:
    def __init__(self):
        self.items = []

    def add(self, o, color, stage=1, ghost="ghost"):
        self.items.append((o, color, stage, ghost))
        return o

    def show(self, k):
        for o, color, stage, ghost in self.items:
            if stage > k:
                o.hide_render = True
                o.hide_viewport = True
            else:
                set_mat(o, color if stage == k else ghost)

    def color_all(self):
        for o, color, stage, ghost in self.items:
            set_mat(o, color)


# ------------------------------------------------------------------ utilidades

def cylx(r, x0, x1, color, seg=36, bevel=0.0, r1=None):
    """Cilindro (o cono si r1) a lo largo de X desde x0 hasta x1, en coordenadas locales de la pieza."""
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r, radius2=(r if r1 is None else r1), depth=abs(x1 - x0),
                          matrix=Matrix.Translation(((x0 + x1) / 2, 0, 0)) @ Matrix.Rotation(math.pi / 2, 4, "Y") @ Matrix.Rotation(math.pi if x1 < x0 else 0, 4, "X"))
    o = _to_obj("cil", bm, color, bevel=bevel)
    return o


def box(sx, sy, sz, color, bevel=0.04):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Diagonal((sx, sy, sz, 1)))
    return _to_obj("caja", bm, color, smooth_sides=False, bevel=bevel)


def sphere(p, r, color):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=p, segments=20, ring_count=12)
    o = bpy.context.active_object
    o.data.materials.append(M(color))
    for q in o.data.polygons:
        q.use_smooth = True
    return o


def bar(p, q, r=0.12, color="gris"):
    p, q = Vector(p), Vector(q)
    d = q - p
    L = d.length
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=14, radius1=r, radius2=r, depth=L, matrix=Matrix.Translation((0, 0, L / 2)))
    o = _to_obj("barra", bm, color, bevel=0)
    o.matrix_world = Matrix.Translation(p) @ d.to_track_quat("Z", "Y").to_matrix().to_4x4()
    return o


def curve_tube(points, r=0.16, color="agua"):
    cu = bpy.data.curves.new("tubo", "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = r
    cu.bevel_resolution = 5
    cu.use_fill_caps = True
    sp = cu.splines.new("POLY")
    sp.points.add(len(points) - 1)
    for p, v in zip(sp.points, points):
        p.co = (v[0], v[1], v[2], 1)
    o = bpy.data.objects.new("tubo", cu)
    bpy.context.scene.collection.objects.link(o)
    o.data.materials.append(M(color))
    return o


def bezier(p0, p1, p2, p3, n=40):
    out = []
    for i in range(n + 1):
        t = i / n
        a = (1 - t) ** 3; b = 3 * (1 - t) ** 2 * t; c = 3 * (1 - t) * t ** 2; d = t ** 3
        out.append(tuple(a * p0[k] + b * p1[k] + c * p2[k] + d * p3[k] for k in range(3)))
    return out


# ------------------------------------------------------------------ jeringuilla
# Marco local: boquilla en x = -0.7 (SIN aguja), extremo cerrado del cuerpo en x = 0, extremo abierto en x = Lb.
# `s` = distancia del embolo al extremo cerrado: el agua llena de 0 a s.

NOZ = 0.7


def syringe(P, place, r, Lb, s, rod, stages=(1, 1, 1), water=True, air=False, thumb="rojo", bubbles=0):
    """Anade una jeringuilla a P. place = matriz de colocacion. stages = (cuerpo, agua+embolo, nada)."""
    sb, sw, _ = stages
    glass = P.add(cylx(r, 0, Lb, "vidrio"), "vidrio", sb, ghost="vidrio_g"); glass.matrix_world = place
    cap = P.add(cylx(r * 1.02, -0.12, 0, "gris", bevel=0.01), "gris", sb); cap.matrix_world = place
    noz = P.add(cylx(r * 0.38, -NOZ, -0.1, "eje", seg=20, r1=r * 0.22), "eje", sb); noz.matrix_world = place
    fl = P.add(cylx(r * 1.55, Lb - 0.12, Lb, "gris", bevel=0.01), "gris", sb); fl.matrix_world = place
    if water and s > 0.05:
        w = P.add(cylx(r * 0.94, 0.0, s, "agua"), "agua", sw); w.matrix_world = place
    if air and s > 0.05:
        a = P.add(cylx(r * 0.94, 0.0, s, "aire"), "aire", sw); a.matrix_world = place
    for i in range(bubbles):
        b = sphere((0, 0, 0), r * 0.22, "aire")
        P.add(b, "aire", sw)
        b.matrix_world = place @ Matrix.Translation((s * (0.25 + 0.5 * i / max(1, bubbles - 1)), 0, r * 0.45))
    head = P.add(cylx(r * 0.96, s, s + 0.35, "goma", bevel=0.02), "goma", sw); head.matrix_world = place
    rd = P.add(cylx(r * 0.26, s + 0.35, s + rod, "eje"), "eje", sw); rd.matrix_world = place
    th = P.add(cylx(r * 1.35, s + rod, s + rod + 0.14, thumb, bevel=0.02), thumb, sw); th.matrix_world = place
    return place


def at(x, y, z, ang=0.0):
    """Colocacion en el plano XY (jeringuillas tumbadas): x, y, z y giro `ang` alrededor de Z."""
    return Matrix.Translation((x, y, z)) @ Matrix.Rotation(ang, 4, "Z")


def tube_between(P, a, b, d=1.6, stage=2, r=0.17, color="agua"):
    """Tubo en U entre dos puntos (boquillas que miran hacia -X): sale d hacia -X y vuelve."""
    pts = bezier(a, (a[0] - d, a[1], a[2]), (b[0] - d, b[1], b[2]), b)
    o = P.add(curve_tube(pts, r, color), color, stage)
    return o


def table_supports(xs, ys, z=-0.95):
    for x in xs:
        for y in ys:
            b = box(0.7, 3.4, 0.5, "madera"); b.location = (x, y, z)


# ------------------------------------------------------------------ presion: dos jeringuillas iguales

R1 = 0.85
LB = 6.0


def pair_equal(push=0.0, with_arrows=False, air=False):
    """Dos jeringuillas iguales unidas por un tubo, con agua (o aire). push = cuanto empujas la de la izquierda (unidades)."""
    P = Parts()
    ya, yb = -1.7, 1.7
    sa, sb_ = 3.0 + push, 3.0 - push
    syringe(P, at(0, ya, 0), R1, LB, sa, 6.2, stages=(1, 1, 1), water=not air, air=air)
    syringe(P, at(0, yb, 0), R1, LB, sb_, 6.2, stages=(2, 2, 2), water=not air, air=air)
    if not air:
        tube_between(P, (-NOZ + 0.05, ya, 0), (-NOZ + 0.05, yb, 0), d=1.8, stage=2)
    else:
        tube_between(P, (-NOZ + 0.05, ya, 0), (-NOZ + 0.05, yb, 0), d=1.8, stage=2, color="aire")
    if with_arrows:
        xa = sa + 6.2 + 0.14
        xb = sb_ + 6.2 + 0.14
        if push:
            P.add(arrow((xa + 1.9, ya, 0), (xa + 0.2, ya, 0), "acento", r=0.13, head=0.5), "acento", 3)
            P.add(arrow((xb + 0.2, yb, 0), (xb + 1.9, yb, 0), "cian", r=0.13, head=0.5), "cian", 3)
    return P


def cam_pair(wide=1.0):
    camera((8.0, -17.0, 12.0), (4.5, 0.0, 0.0), 40)


@image("presion", "f_p_hero")
def f_p_hero():
    P = pair_equal(push=1.6, with_arrows=True); P.color_all(); table_supports([1.5, 5.5], [-1.7, 1.7]); cam_pair(); render(f"{OUT}/f_p_hero.webp", W, H)


@image("presion", "f_p_s1")
def f_p_s1():
    P = pair_equal(); table_supports([1.5, 5.5], [-1.7]); P.show(1); cam_pair(); render(f"{OUT}/f_p_s1.webp", W, H)


@image("presion", "f_p_s2")
def f_p_s2():
    P = pair_equal(); table_supports([1.5, 5.5], [-1.7, 1.7]); P.show(2); cam_pair(); render(f"{OUT}/f_p_s2.webp", W, H)


@image("presion", "f_p_s3")
def f_p_s3():
    P = pair_equal(push=1.6, with_arrows=True); table_supports([1.5, 5.5], [-1.7, 1.7]); P.show(3); cam_pair(); render(f"{OUT}/f_p_s3.webp", W, H)


@image("presion", "f_p_agua")
def f_p_agua():
    P = pair_equal(push=1.2, with_arrows=True); P.color_all(); table_supports([1.5, 5.5], [-1.7, 1.7]); cam_pair(); render(f"{OUT}/f_p_agua.webp", W, H)


@image("presion", "f_p_aire")
def f_p_aire():
    # con aire, el mismo empuje se gasta en comprimir: el embolo de salida se mueve menos
    P = Parts()
    ya, yb = -1.7, 1.7
    syringe(P, at(0, ya, 0), R1, LB, 4.6, 6.2, air=True, water=False)
    syringe(P, at(0, yb, 0), R1, LB, 2.4, 6.2, air=True, water=False)
    tube_between(P, (-NOZ + 0.05, ya, 0), (-NOZ + 0.05, yb, 0), d=1.8, stage=1, color="aire")
    P.color_all()
    # un muelle de aire entre las dos
    arrow((4.6 + 6.2 + 2.0, ya, 0), (4.6 + 6.2 + 0.2, ya, 0), "acento", r=0.13, head=0.5)
    arrow((2.4 + 6.2 + 0.2, yb, 0), (2.4 + 6.2 + 1.0, yb, 0), "cian", r=0.13, head=0.5)
    table_supports([1.5, 5.5], [-1.7, 1.7]); cam_pair(); render(f"{OUT}/f_p_aire.webp", W, H)


@image("presion", "f_area")
def f_area():
    """La misma fuerza sobre poca area (clavo) o mucha (disco): el clavo se hunde."""
    for x, kind in ((-2.8, "clavo"), (2.8, "disco")):
        blk = box(4.2, 4.2, 2.2, "madera", bevel=0.05); blk.location = (x, 0, -0.2)
        if kind == "clavo":
            shaft = cylx(0.16, -1.0, 2.6, "gris", seg=20); shaft.matrix_world = Matrix.Translation((x, 0, 1.0)) @ Matrix.Rotation(-math.pi / 2, 4, "Y")
            tip = cylx(0.16, 0, 0.0, "gris")
            head = cylx(0.5, 2.6, 2.75, "gris", seg=24); head.matrix_world = Matrix.Translation((x, 0, 1.0)) @ Matrix.Rotation(-math.pi / 2, 4, "Y")
            bpy.data.objects.remove(tip, do_unlink=True)
            top = 3.75
        else:
            disc = cylx(1.5, 0, 0.5, "gris", seg=40, bevel=0.03); disc.matrix_world = Matrix.Translation((x, 0, 0.9)) @ Matrix.Rotation(-math.pi / 2, 4, "Y")
            top = 1.4
        arrow((x, 0, top + 3.0), (x, 0, top + 0.35), "acento", r=0.14, head=0.55)
    camera((1.0, -14.0, 8.0), (0.0, 0, 1.2), 45)
    render(f"{OUT}/f_area.webp", W, H)


# ------------------------------------------------------------------ pistones: relacion 4:1 de areas

RS, RB = 0.5, 1.0   # radios: area grande = 4 x area pequena


def pair_ratio(push=0.0, with_arrows=False, equal_arrows=False):
    """Jeringuilla pequena (se empuja) y grande (trabaja). Volumen que sale = volumen que entra: ds * As = db * Ab."""
    P = Parts()
    ys, yb = 2.0, -1.7
    ds = push                      # recorrido del pequeno
    db = push * (RS * RS) / (RB * RB)  # recorrido del grande (4 veces menos)
    syringe(P, at(0, yb, 0), RB, LB, 3.0 + 0.0 - db + 0.0 + 0.0 + 0.0, 5.8, stages=(1, 1, 1))
    syringe(P, at(0, ys, 0), RS, LB, 3.0 + ds, 6.0, stages=(2, 2, 2))
    tube_between(P, (-NOZ + 0.05, yb, 0), (-NOZ + 0.05, ys, 0), d=1.9, stage=2)
    if with_arrows:
        xs_ = 3.0 + ds + 6.0 + 0.14
        xb_ = 3.0 - db + 5.8 + 0.14
        if equal_arrows:
            P.add(arrow((xs_ + 1.9, ys, 0), (xs_ + 0.2, ys, 0), "mal", r=0.07, head=0.4), "mal", 3)
            P.add(arrow((xb_ + 0.2, yb, 0), (xb_ + 1.9, yb, 0), "mal", r=0.07, head=0.4), "mal", 3)
        else:
            # pequeno: flecha larga y fina (poca fuerza, mucho recorrido); grande: corta y gorda (mucha fuerza, poco recorrido)
            P.add(arrow((xs_ + 0.2 + ds * 0.8 + 0.4, ys, 0), (xs_ + 0.2, ys, 0), "acento", r=0.07, head=0.4), "acento", 3)
            P.add(arrow((xb_ + 0.2, yb, 0), (xb_ + 0.2 + db * 0.8 + 0.5, yb, 0), "cian", r=0.22, head=0.6), "cian", 3)
    return P


def cam_ratio():
    camera((8.5, -17.0, 12.0), (4.5, 0.3, 0.0), 40)


def _ratio_supports():
    table_supports([1.5, 5.5], [-1.7, 2.0])


@image("pistones", "f_h_hero")
def f_h_hero():
    P = pair_ratio(push=3.2, with_arrows=True); P.color_all(); _ratio_supports(); cam_ratio(); render(f"{OUT}/f_h_hero.webp", W, H)


@image("pistones", "f_h_s1")
def f_h_s1():
    P = pair_ratio(); _ratio_supports(); P.show(1); cam_ratio(); render(f"{OUT}/f_h_s1.webp", W, H)


@image("pistones", "f_h_s2")
def f_h_s2():
    P = pair_ratio(); _ratio_supports(); P.show(2); cam_ratio(); render(f"{OUT}/f_h_s2.webp", W, H)


@image("pistones", "f_h_s3")
def f_h_s3():
    P = pair_ratio(push=3.2, with_arrows=True); _ratio_supports(); P.show(3); cam_ratio(); render(f"{OUT}/f_h_s3.webp", W, H)


@image("pistones", "f_h_mal")
def f_h_mal():
    P = pair_ratio(push=3.2, with_arrows=True, equal_arrows=True); P.color_all(); _ratio_supports(); cam_ratio(); render(f"{OUT}/f_h_mal.webp", W, H)


@image("pistones", "f_h_bien")
def f_h_bien():
    P = pair_ratio(push=3.2, with_arrows=True); P.color_all(); _ratio_supports(); cam_ratio(); render(f"{OUT}/f_h_bien.webp", W, H)


# ------------------------------------------------------------------ brazo hidraulico (1 articulacion)

O = (0.0, 1.0)      # pivote del brazo (x, z)
QD = 3.0            # distancia del apoyo del cilindro al pivote
PB = (5.2, 0.9)     # base del cilindro esclavo
ROD = 2.2
LBS = 3.0
RSL = 0.55
MX = 9.0            # boquilla de la jeringuilla maestra (mira hacia -X)


def arm_pose(theta):
    a = math.radians(theta)
    Q = (O[0] + QD * math.cos(a), O[1] + QD * math.sin(a))
    d = math.hypot(Q[0] - PB[0], Q[1] - PB[1])
    return a, Q, d


def build_arm(theta=50.0, bubbles=0, leak=False):
    P = Parts()
    a, Q, d = arm_pose(theta)
    # etapa 1: base de carton y brazo
    base = P.add(box(11.0, 3.0, 0.3, "carton"), "carton", 1); base.location = (4.4, -0.4, 0.15)
    post = P.add(beam(3, "gris"), "gris", 1); plane(post, O[0], O[1] - 0.2, 0.3, rot=-math.pi / 2)
    arm = P.add(beam(9, "amarillo"), "amarillo", 1); plane(arm, O[0], O[1], 0.9, rot=a)
    pv = P.add(pin(1.8), "oscuro", 1); plane(pv, O[0], O[1], 0.9)
    # etapa 2: cilindro esclavo (jeringuilla con agua) empujando el brazo en Q
    ang = math.atan2(Q[1] - PB[1], Q[0] - PB[0])
    place = Matrix.Translation((PB[0], -1.6, PB[1])) @ Matrix.Rotation(-ang, 4, "Y")
    s = d - ROD
    syringe(P, place, RSL, LBS, s, ROD, stages=(2, 2, 2))
    qp = P.add(pin(1.6), "oscuro", 3); plane(qp, Q[0], Q[1], 1.5)
    pp = P.add(pin(1.6), "oscuro", 3); plane(pp, PB[0], PB[1] - 0.55, 1.5)
    # etapa 3: tubo y jeringuilla maestra (la que empujas)
    m = LBS - s
    mpl = Matrix.Translation((MX, -1.6, PB[1])) @ Matrix.Rotation(math.pi, 4, "Z")
    # el maestro mira hacia -X con la boquilla en MX: su marco local apunta hacia +X, asi que se gira 180 grados alrededor de Y
    mpl = Matrix.Translation((MX, -1.6, PB[1])) @ Matrix.Rotation(math.pi, 4, "Z")
    syringe(P, Matrix.Translation((MX, -1.6, PB[1])) @ Matrix.Rotation(0, 4, "Z"), RSL, LBS, m, 2.6, stages=(2, 2, 2), bubbles=bubbles)
    # boquilla del esclavo (lado contrario a Q)
    nozA = Vector((PB[0] - NOZ * math.cos(ang), -1.6, PB[1] - NOZ * math.sin(ang)))
    nozB = Vector((MX - NOZ, -1.6, PB[1]))
    p1 = nozA + Vector((-0.9 * math.cos(ang), 0, -0.9 * math.sin(ang)))
    pts = bezier(tuple(nozA), tuple(nozA + Vector((0.9, 0, -1.4))), tuple(nozB + Vector((-1.0, 0, -1.4))), tuple(nozB), 50)
    tb = P.add(curve_tube(pts, 0.15, "agua"), "agua", 2)
    # etapa 4: flechas (empujas aqui; el brazo sube)
    xm = MX + m + 2.6 + 0.14
    P.add(arrow((xm + 2.0, -1.6, PB[1]), (xm + 0.2, -1.6, PB[1]), "acento", r=0.12, head=0.5), "acento", 4)
    P.add(arrow((0.0, -0.9, 0.0), (0.0, -0.9, 0.0001), "cian", r=0.02, head=0.02), "cian", 4)
    return P, (a, Q)


def arc_arrow_arm(a):
    arc_arrow((O[0], -2.0, O[1]), 7.0, math.radians(2), a, "cian", r=0.08)


def cam_arm():
    camera((5.0, -19.0, 6.5), (5.2, 0.0, 2.0), 42)


@image("brazo", "f_b_s1")
def f_b_s1():
    P, _ = build_arm(); P.show(1); cam_arm(); render(f"{OUT}/f_b_s1.webp", W, H)


@image("brazo", "f_b_s2")
def f_b_s2():
    P, _ = build_arm(); P.show(2); cam_arm(); render(f"{OUT}/f_b_s2.webp", W, H)


@image("brazo", "f_b_s3")
def f_b_s3():
    P, _ = build_arm(); P.show(3); cam_arm(); render(f"{OUT}/f_b_s3.webp", W, H)


@image("brazo", "f_b_s4")
def f_b_s4():
    P, (a, Q) = build_arm(); P.show(4); arc_arrow_arm(a); cam_arm(); render(f"{OUT}/f_b_s4.webp", W, H)


@image("brazo", "f_b_hero")
def f_b_hero():
    P, (a, Q) = build_arm(); P.color_all(); arc_arrow_arm(a); cam_arm(); render(f"{OUT}/f_b_hero.webp", W, H)


@image("brazo", "f_b_burbuja_mal")
def f_b_burbuja_mal():
    P, (a, Q) = build_arm(bubbles=4); P.color_all(); cam_arm(); render(f"{OUT}/f_b_burbuja_mal.webp", W, H)


@image("brazo", "f_b_burbuja_bien")
def f_b_burbuja_bien():
    P, (a, Q) = build_arm(bubbles=0); P.color_all(); cam_arm(); render(f"{OUT}/f_b_burbuja_bien.webp", W, H)


@image("brazo", "f_b_aire_agua")
def f_b_aire_agua():
    """Mismo empuje en dos circuitos: con agua el otro embolo se mueve casi lo mismo; con aire, el aire se comprime y rebota."""
    P = Parts()
    for y, air in ((-3.2, False), (3.2, True)):
        s_in = 3.2
        syringe(P, at(0, y, 0), 0.7, 6.0, s_in, 5.0, air=air, water=not air)
        # tapon en la boquilla (el extremo esta tapado)
        cap = P.add(cylx(0.3, -0.75, -0.5, "rojo"), "rojo", 1); cap.matrix_world = at(0, y, 0)
    P.color_all()
    arrow((3.2 + 5.0 + 0.14 + 1.8, -3.2, 0), (3.2 + 5.0 + 0.14 + 0.2, -3.2, 0), "acento", r=0.12, head=0.5)
    arrow((3.2 + 5.0 + 0.14 + 1.8, 3.2, 0), (3.2 + 5.0 + 0.14 + 0.2, 3.2, 0), "acento", r=0.12, head=0.5)
    table_supports([1.5, 5.0], [-3.2, 3.2])
    camera((7.0, -17.0, 11.0), (4.2, 0.0, 0.0), 40)
    render(f"{OUT}/f_b_aire_agua.webp", W, H)


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
