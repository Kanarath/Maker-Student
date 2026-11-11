"""
Maker Student - imagenes de la unidad "Brazos y manipuladores" (grados de libertad, par, pinzas, diagnostico).

Uso (desde la raiz del repo):
  blender -b --factory-startup --python tools/blender/maker_u_brazo.py -- [gdl|par|pinza|diag|all] [nombre_imagen ...]

Este archivo tambien lo importa maker_u_proy.py (constructor del brazo `build_arm`, etc.).
Piezas propias (servo, cremallera, pinza, lapiz, caja...) definidas aqui con el estilo de maker_lib.
Convencion del brazo vertical: plano XZ, capa k en y = -k (la capa alta queda delante de la camara).
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import maker_lib as ML
from maker_lib import *

ML.COLORS["servo"] = "#4b5270"
ML.COLORS["papel"] = "#f1ecd9"
ML.COLORS["mesa"] = "#3a3f52"

OUT = os.path.join(ROOT, "public", "assets", "img", "brazo")
W, H = 1280, 720
SAMPLES = 32
FLOOR = -0.65

KEEP = set()
IMAGES = {}  # nombre -> (grupo, funcion)


def image(group, name):
    def deco(fn):
        IMAGES[name] = (group, fn)
        return fn
    return deco


def begin(floor_z=FLOOR):
    reset()
    studio(floor_z=floor_z, size=300)
    eevee(SAMPLES)
    try:  # sin trazado de rayos: mucho mas rapido en equipos sin GPU, con un aspecto casi igual
        bpy.context.scene.eevee.use_raytracing = False
    except Exception:
        pass
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


class P2:
    """Lista de piezas con etapa; show(k): lo nuevo en color y lo anterior en gris."""

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

    def paint(self):
        for o, color, stage in self.items:
            set_mat(o, color)

    def gray(self):
        for o, color, stage in self.items:
            set_mat(o, "ghost")


# ---------------------------------------------------------------- piezas propias

def _bm_cube(bm, size, center=(0, 0, 0)):
    bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation(center) @ Matrix.Diagonal((size[0], size[1], size[2], 1)))


def box(sx, sy, sz, color="gris", bevel=0.04):
    bm = bmesh.new()
    _bm_cube(bm, (sx, sy, sz))
    return ML._to_obj("caja", bm, color, smooth_sides=False, bevel=bevel)


def cyl(r, h, color="gris", seg=28):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r, radius2=r, depth=h)
    return ML._to_obj("cil", bm, color, bevel=0.02)


def servo_body():
    """Servo: caja con orejas. Origen = eje de salida; el cuerpo se extiende a +x; el eje sale hacia +Z local (hacia la camara con plane())."""
    bm = bmesh.new()
    _bm_cube(bm, (2.4, 1.2, 1.0), (0.5, 0, 0))
    _bm_cube(bm, (3.2, 0.9, 0.25), (0.5, 0, -0.35))
    return ML._to_obj("servo", bm, "servo", smooth_sides=False, bevel=0.04)


def servo_shaft(length=0.9):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=20, radius1=0.28, radius2=0.28, depth=length,
                          matrix=Matrix.Translation((0, 0, 0.5 + length / 2)))
    return ML._to_obj("eje_servo", bm, "eje", bevel=0.015)


def pencil():
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=20, radius1=0.27, radius2=0.27, depth=3.2,
                          matrix=Matrix.Translation((0, 0, 1.6)))
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=True, segments=20, radius1=0.27, radius2=0.04, depth=0.5,
                          matrix=Matrix.Translation((0, 0, -0.25)))
    return ML._to_obj("lapiz", bm, "rojo", bevel=0.01)


def rack(n=13, thick=0.5, color="amarillo"):
    """Cremallera de modulo 1 mm (paso = pi/8 unidades). Dientes hacia -y, linea primitiva en y=0, diente central en x=0."""
    p = math.pi / 8
    x0 = -(n // 2 + 0.5) * p
    x1 = x0 + n * p
    pts = [(x0, 0.556), (x0, 0.156)]
    for k in range(n):
        xc = x0 + (k + 0.5) * p
        pts += [(xc - 0.30 * p, 0.156), (xc - 0.10 * p, -0.125), (xc + 0.10 * p, -0.125), (xc + 0.30 * p, 0.156)]
    pts += [(x1, 0.156), (x1, 0.556)]
    return ML._to_obj("cremallera", ML._prism(pts, thick), color, smooth_sides=False, bevel=0.012)


def marker3(x, y, z, color="bien", r=0.34):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=(x, y, z), segments=20, ring_count=12)
    o = bpy.context.active_object
    o.data.materials.append(M(color))
    for p in o.data.polygons:
        p.use_smooth = True
    return o


def dim(a, b, color="masa", r=0.04, head=0.24):
    """Cota: dos flechas desde el centro hacia los extremos."""
    mid = tuple((a[i] + b[i]) / 2 for i in range(3))
    arrow(mid, a, color, r=r, head=head)
    arrow(mid, b, color, r=r, head=head)


def arc_xy(c, radius, a0, a1, color="acento", r=0.07, head=0.34):
    """Flecha curva horizontal (plano XY) alrededor del eje Z que pasa por c."""
    n = 28
    pts = []
    for i in range(n + 1):
        a = a0 + (a1 - a0) * i / n
        pts.append((c[0] + radius * math.cos(a), c[1] + radius * math.sin(a), c[2]))
    o = rope(pts, color, r)
    tip = Vector(pts[-1])
    tang = (Vector(pts[-1]) - Vector(pts[-3])).normalized()
    arrow(tip - tang * 0.001, tip + tang * head, color, r=r, head=head)
    return o


def circle_curve(c, radius, color="cian", r=0.06, n=72):
    pts = [(c[0] + radius * math.cos(2 * math.pi * i / n), c[1] + radius * math.sin(2 * math.pi * i / n), c[2]) for i in range(n)]
    pts.append(pts[0])
    return rope(pts, color, r)


def annulus(c, r0, r1, color_key="anillo", n=96):
    bm = bmesh.new()
    inner = [bm.verts.new((c[0] + r0 * math.cos(2 * math.pi * i / n), c[1] + r0 * math.sin(2 * math.pi * i / n), c[2])) for i in range(n)]
    outer = [bm.verts.new((c[0] + r1 * math.cos(2 * math.pi * i / n), c[1] + r1 * math.sin(2 * math.pi * i / n), c[2])) for i in range(n)]
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((inner[i], inner[j], outer[j], outer[i]))
    me = bpy.data.meshes.new("anillo")
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new("anillo", me)
    bpy.context.scene.collection.objects.link(o)
    o.data.materials.append(ML._mat(color_key, hexc("#1b8c99"), 0, 0.5, hexc("#2de0f2"), 0.5))
    return o


def pt(S, L, a):
    return (S[0] + L * math.cos(a), S[1] + L * math.sin(a))


# ---------------------------------------------------------------- BRAZO VERTICAL (3 GDL)

SH_Z = 4.8          # altura del hombro (agujero superior de la columna)
LY = dict(col=0, s1=1, l1=2, s2=3, l2=4, palm=5, fing=6, pin=1)
LY2 = dict(col=0, l1=1, l2=2, palm=3, fing=4)   # sin servos (solo pasadores)


def build_arm(a1=50, a2=-15, ag=-90, n1=9, n2=7, servo=True, cargo=False, cargo_c="masa", pads=True, stages=True):
    """Brazo de piezas tipo Technic: base, plataforma giratoria, columna, hombro (servo + eslabon 1),
    codo (servo + eslabon 2), pinza (+ carga). Angulos absolutos en grados (a1: eslabon 1, a2: eslabon 2, ag: direccion de los dedos).
    Etapas: 1 base + plataforma, 2 columna, 3 hombro + eslabon 1, 4 codo + eslabon 2, 5 pinza, 6 carga."""
    P = P2()
    ly = LY if servo else LY2
    L1, L2 = n1 - 1, n2 - 1
    r1, r2, rg = math.radians(a1), math.radians(a2), math.radians(ag)
    S = (0.0, SH_Z)
    E = pt(S, L1, r1)
    T = pt(E, L2, r2)
    # etapa 1: base y plataforma giratoria
    base = box(9, 7, 0.5, "gris"); base.location = (0, 0, -0.4); P.add(base, "gris", 1)
    tt = gear(24, "azul"); place(tt, 0, 0, 0.1); P.add(tt, "azul", 1)
    # etapa 2: columna
    col = beam(5, "gris"); plane(col, 0, SH_Z - 4, ly["col"], rot=math.pi / 2); P.add(col, "gris", 2)
    # etapa 3: hombro + eslabon 1
    if servo:
        s1 = servo_body(); plane(s1, S[0], S[1], ly["s1"], rot=-math.pi / 2); P.add(s1, "servo", 3)
        sh1 = servo_shaft(); plane(sh1, S[0], S[1], ly["s1"]); P.add(sh1, "eje", 3)
        cp1 = stopper(); plane(cp1, S[0], S[1], ly["l1"] + 0.65); P.add(cp1, "oscuro", 3)
    else:
        pn = pin(2.6); plane(pn, S[0], S[1], 0.6); P.add(pn, "oscuro", 3)
    l1 = beam(n1, "amarillo"); plane(l1, S[0], S[1], ly["l1"], rot=r1); P.add(l1, "amarillo", 3)
    # etapa 4: codo + eslabon 2
    if servo:
        s2 = servo_body(); plane(s2, E[0], E[1], ly["s2"], rot=r1 + math.pi); P.add(s2, "servo", 4)
        sh2 = servo_shaft(); plane(sh2, E[0], E[1], ly["s2"]); P.add(sh2, "eje", 4)
        cp2 = stopper(); plane(cp2, E[0], E[1], ly["l2"] + 0.65); P.add(cp2, "oscuro", 4)
    else:
        pn = pin(2.6); plane(pn, E[0], E[1], 1.5); P.add(pn, "oscuro", 4)
    l2 = beam(n2, "rojo"); plane(l2, E[0], E[1], ly["l2"], rot=r2); P.add(l2, "rojo", 4)
    # etapa 5: pinza (palma + dos dedos con almohadillas)
    fwd = (math.cos(rg), math.sin(rg))
    pd = (math.cos(rg + math.pi / 2), math.sin(rg + math.pi / 2))
    pn = pin(2.4); plane(pn, T[0], T[1], ly["palm"] - 0.5); P.add(pn, "oscuro", 5)
    palm = beam(5, "verde")
    plane(palm, T[0] - 2 * pd[0], T[1] - 2 * pd[1], ly["palm"], rot=rg + math.pi / 2); P.add(palm, "verde", 5)
    for sgn in (-2, 2):
        fx, fz = T[0] + sgn * pd[0], T[1] + sgn * pd[1]
        f = beam(4, "verde"); plane(f, fx, fz, ly["fing"], rot=rg); P.add(f, "verde", 5)
        pf = pin(1.6); plane(pf, fx, fz, ly["fing"] - 0.5); P.add(pf, "oscuro", 5)
        if pads:
            side = -1 if sgn > 0 else 1
            pc = (fx + side * 0.55 * pd[0] + fwd[0] * 1.9, fz + side * 0.55 * pd[1] + fwd[1] * 1.9)
            pad = box(0.2, 2.3, 0.9, "oscuro", bevel=0.02)
            plane(pad, pc[0], pc[1], ly["fing"], rot=rg + math.pi / 2); P.add(pad, "oscuro", 5)
    if cargo:
        c = box(2.7, 2.3, 0.9, cargo_c, bevel=0.05)
        cc = (T[0] + fwd[0] * 1.9, T[1] + fwd[1] * 1.9)
        plane(c, cc[0], cc[1], ly["fing"], rot=rg + math.pi / 2); P.add(c, cargo_c, 6)
    info = dict(S=S, E=E, T=T, ly=ly, fwd=fwd, pd=pd, L1=L1, L2=L2)
    return P, info


def arm_cam(a=(13, -33, 15), t=(5.5, 0, 6.3), lens=50):
    camera(a, t, lens)


# ---------------------------------------------------------------- BRAZO PLANO SOBRE PAPEL

def build_flat(a1=60, a2=-20, n1=9, n2=7, pen=True):
    """Brazo de 2 eslabones tumbado sobre un papel. Etapas: 1 papel + base, 2 eslabon 1, 3 eslabon 2, 4 lapiz."""
    P = P2()
    L1, L2 = n1 - 1, n2 - 1
    r1, r2 = math.radians(a1), math.radians(a2)
    S = (0.0, 0.0)
    E = pt(S, L1, r1)
    T = pt(E, L2, r2)
    paper = box(34, 34, 0.3, "papel", bevel=0.03); paper.location = (0, 0, -0.15); P.add(paper, "papel", 1)
    base = beam(5, "gris"); place(base, 0, 0, 0.49, rz=math.radians(240)); P.add(base, "gris", 1)
    pn = pin(3.3); place(pn, 0, 0, 1.7); P.add(pn, "oscuro", 2)
    l1 = beam(n1, "amarillo"); place(l1, S[0], S[1], 1.47, rz=r1); P.add(l1, "amarillo", 2)
    pe = pin(3.0); place(pe, E[0], E[1], 2.0); P.add(pe, "oscuro", 3)
    l2 = beam(n2, "rojo"); place(l2, E[0], E[1], 2.44, rz=r2); P.add(l2, "rojo", 3)
    if pen:
        pc = pencil(); place(pc, T[0], T[1], 0.1); P.add(pc, "azul", 4)
    return P, dict(S=S, E=E, T=T, L1=L1, L2=L2)


def flat_cam(lens=28, t=(0, 0, 0)):
    camera((t[0], t[1] - 22, 30), t, lens)


# ---------------------------------------------------------------- GDL

@image("gdl", "g_hero")
def g_hero():
    P, g = build_arm(a1=50, a2=-15); P.paint()
    ly = g["ly"]
    # 1) giro de la base (plano horizontal)
    arc_xy((0, 0, 0.6), 2.6, math.radians(200), math.radians(320), "acento", r=0.08)
    # 2) hombro
    arc_arrow((0, -3.0, SH_Z), 2.6, math.radians(8), math.radians(42), "cian", r=0.08)
    # 3) codo
    E = g["E"]
    arc_arrow((E[0], -4.9, E[1]), 2.2, math.radians(48), math.radians(-5), "bien", r=0.08)
    arm_cam(); render(f"{OUT}/g_hero.webp", W, H)


def _flat_stage(k):
    P, g = build_flat(); P.show(k); flat_cam(40, (2, 2, 0)); render(f"{OUT}/g_s{k}.webp", W, H)


@image("gdl", "g_s1")
def g_s1(): _flat_stage(1)


@image("gdl", "g_s2")
def g_s2(): _flat_stage(2)


@image("gdl", "g_s3")
def g_s3(): _flat_stage(3)


@image("gdl", "g_s4")
def g_s4(): _flat_stage(4)


@image("gdl", "g_max")
def g_max():
    P, g = build_flat(a1=48, a2=48); P.paint()
    S, E, T = g["S"], g["E"], g["T"]
    off = 1.5
    n = (-math.sin(math.radians(48)) * off, math.cos(math.radians(48)) * off)
    arrow((S[0] + n[0], S[1] + n[1], 0.4), (E[0] + n[0], E[1] + n[1], 0.4), "acento", r=0.09, head=0.4)
    arrow((E[0] + n[0], E[1] + n[1], 0.4), (T[0] + n[0], T[1] + n[1], 0.4), "cian", r=0.09, head=0.4)
    circle_curve((0, 0, 0.05), g["L1"] + g["L2"], "cian", r=0.06)
    flat_cam(); render(f"{OUT}/g_max.webp", W, H)


@image("gdl", "g_min")
def g_min():
    P, g = build_flat(a1=48, a2=228); P.paint()
    S, E, T = g["S"], g["E"], g["T"]
    circle_curve((0, 0, 0.05), g["L1"] - g["L2"], "bien", r=0.07)
    n = (-math.sin(math.radians(48)), math.cos(math.radians(48)))
    arrow((S[0] + n[0] * 1.5, S[1] + n[1] * 1.5, 0.4), (E[0] + n[0] * 1.5, E[1] + n[1] * 1.5, 0.4), "acento", r=0.09, head=0.4)
    arrow((E[0] - n[0] * 1.5, E[1] - n[1] * 1.5, 0.4), (T[0] - n[0] * 1.5, T[1] - n[1] * 1.5, 0.4), "cian", r=0.09, head=0.4)
    flat_cam(40, (2, 2, 0)); render(f"{OUT}/g_min.webp", W, H)


@image("gdl", "g_espacio")
def g_espacio():
    P, g = build_flat(a1=75, a2=10); P.paint()
    annulus((0, 0, 0.03), g["L1"] - g["L2"], g["L1"] + g["L2"])
    circle_curve((0, 0, 0.12), g["L1"] + g["L2"], "cian", r=0.07)
    circle_curve((0, 0, 0.12), g["L1"] - g["L2"], "bien", r=0.07)
    flat_cam(); render(f"{OUT}/g_espacio.webp", W, H)


@image("gdl", "g_err_mal")
def g_err_mal():
    P, g = build_flat(a1=60, a2=-20, pen=False); P.paint()
    S, E, T = g["S"], g["E"], g["T"]
    mid1 = ((S[0] + E[0]) / 2, (S[1] + E[1]) / 2)
    mid2 = ((E[0] + T[0]) / 2, (E[1] + T[1]) / 2)
    for (x, y) in (mid1, mid2, (pt(S, 0, 0)[0] + 3.0 * math.cos(math.radians(240)), 3.0 * math.sin(math.radians(240)))):
        marker3(x, y, 3.7, "mal", 0.55)
    flat_cam(40, (3, 3, 0)); render(f"{OUT}/g_err_mal.webp", W, H)


@image("gdl", "g_err_bien")
def g_err_bien():
    P, g = build_flat(a1=60, a2=-20, pen=False); P.paint()
    S, E, T = g["S"], g["E"], g["T"]
    for (x, y) in (S, E):
        marker3(x, y, 3.9, "bien", 0.6)
    flat_cam(40, (3, 3, 0)); render(f"{OUT}/g_err_bien.webp", W, H)


# ---------------------------------------------------------------- PAR (carga en el brazo)

def _par_cam():
    camera((9, -66, 8.5), (7.0, 0, 3.2), 90)


@image("par", "c_carga")
def c_carga():
    P, g = build_arm(a1=0, a2=0, cargo=True); P.paint()
    T = g["T"]
    arrow((T[0] + 1.9 * 0, -7.5, 4.2), (T[0], -7.5, 1.2), "acento", r=0.1, head=0.4)
    dim((0, -7.5, -0.2), (T[0], -7.5, -0.2), "masa")
    _par_cam(); render(f"{OUT}/c_carga.webp", W, H)


@image("par", "c_hero")
def c_hero():
    P, g = build_arm(a1=0, a2=0, cargo=True); P.paint()
    T = g["T"]
    arrow((T[0], -7.5, 4.2), (T[0], -7.5, 1.2), "acento", r=0.1, head=0.4)
    arrow((7.0, -7.5, 4.6), (7.0, -7.5, 2.6), "cian", r=0.08, head=0.36)
    dim((0, -7.5, -0.2), (T[0], -7.5, -0.2), "masa")
    dim((0, -7.5, 0.9), (7.0, -7.5, 0.9), "cian")
    arc_arrow((0, -3.2, SH_Z), 2.6, math.radians(20), math.radians(110), "bien", r=0.08)
    _par_cam(); render(f"{OUT}/c_hero.webp", W, H)


def build_balance(tilt=0.0, load=1, counter=0):
    """Brazo equilibrado: viga de 11 agujeros que gira en su agujero central (el 6.o).
    Carga: `load` pesas a 4 pasos a la izquierda; contrapeso: `counter` pesas a 2 pasos a la derecha."""
    P = P2()
    PIVOT = (6.0, 6.0)
    base = beam(9, "gris"); plane(base, 2, 0.0, 0); P.add(base, "gris", 1)
    col = beam(7, "azul"); plane(col, 6, 0.0, 1, rot=math.pi / 2); P.add(col, "azul", 2)
    pv = pin(3.2); plane(pv, PIVOT[0], PIVOT[1], 1.4); P.add(pv, "oscuro", 2)

    def rot(dx):
        c, s = math.cos(tilt), math.sin(tilt)
        return (PIVOT[0] + dx * c, PIVOT[1] + dx * s)

    h0 = rot(-5.0)
    arm = beam(11, "amarillo"); plane(arm, h0[0], h0[1], 2, rot=tilt); P.add(arm, "amarillo", 3)
    for dx, units, stage in ((-4.0, load, 3), (2.0, counter, 4)):
        if not units:
            continue
        x, z = rot(dx)
        hg = beam(3, "rojo"); plane(hg, x, z, 3, rot=-math.pi / 2); P.add(hg, "rojo", stage)
        pn = pin(2.1); plane(pn, x, z, 2.5); P.add(pn, "oscuro", stage)
        m, h = weight(units, "verde")
        m.matrix_world = Matrix.Translation((x, -4, z - 2 + 0.3 - h)); P.add(m, "verde", stage)
    return P, rot


def _bal_cam():
    camera((7.5, -25, 9.0), (5.0, 0, 3.6), 50)


@image("par", "c_s1")
def c_s1():
    P, _ = build_balance(); P.show(1); _bal_cam(); render(f"{OUT}/c_s1.webp", W, H)


@image("par", "c_s2")
def c_s2():
    P, _ = build_balance(); P.show(2); _bal_cam(); render(f"{OUT}/c_s2.webp", W, H)


@image("par", "c_s3")
def c_s3():
    P, _ = build_balance(tilt=math.radians(11), load=1); P.show(3)
    _bal_cam(); render(f"{OUT}/c_s3.webp", W, H)


@image("par", "c_s4")
def c_s4():
    P, _ = build_balance(load=1, counter=2); P.show(4); _bal_cam(); render(f"{OUT}/c_s4.webp", W, H)


@image("par", "c_contrapeso")
def c_contrapeso():
    P, rot = build_balance(load=1, counter=2); P.paint()
    AYY = -5.0
    arrow((2, AYY, 3.6), (2, AYY, 1.8), "acento", r=0.08, head=0.34)
    arrow((8, AYY, 3.6), (8, AYY, 1.2), "acento", r=0.12, head=0.4)
    dim((2, AYY, 7.6), (6, AYY, 7.6), "masa")
    dim((6, AYY, 7.6), (8, AYY, 7.6), "masa")
    _bal_cam(); render(f"{OUT}/c_contrapeso.webp", W, H)


def _motor_scene(near):
    P, g = build_arm(a1=0, a2=0, cargo=False, pads=True); P.paint()
    if near:
        blk = box(2.2, 1.0, 2.4, "azul"); place(blk, -1.4, 0, 1.5); set_mat(blk, "azul")
        x = -1.4
        arrow((x, -2.5, 2.9), (x, -2.5, 0.7), "bien", r=0.08, head=0.34)
        dim((0, -2.5, -0.2), (x, -2.5, -0.2), "bien")
    else:
        blk = box(2.2, 1.0, 2.4, "azul"); plane(blk, 8, SH_Z + 1.9, 3); set_mat(blk, "azul")
        x = 8.0
        arrow((x, -7.5, SH_Z + 3.2), (x, -7.5, SH_Z - 0.2), "mal", r=0.14, head=0.4)
        dim((0, -7.5, 0.0), (x, -7.5, 0.0), "mal")
    _par_cam()


@image("par", "c_motor_codo")
def c_motor_codo():
    _motor_scene(False); render(f"{OUT}/c_motor_codo.webp", W, H)


@image("par", "c_motor_base")
def c_motor_base():
    _motor_scene(True); render(f"{OUT}/c_motor_base.webp", W, H)


# ---------------------------------------------------------------- PINZA

def build_rack_gripper(arrows=False):
    """Pinza de cremallera vista desde arriba: etapas 1 base, 2 eje + piñón + manivela, 3 cremalleras, 4 dedos."""
    P = P2()
    pl = beam(9, "gris"); place(pl, -4, 0, 0.0); P.add(pl, "gris", 1)
    ax = axle(3.2); place(ax, 0, 0, 1.3); P.add(ax, "eje", 2)
    pin_g = gear(8, "azul"); place(pin_g, 0, 0, 0.9, rz=math.radians(22.5)); P.add(pin_g, "azul", 2)
    cr = beam(3, "rojo"); place(cr, 0, 0, 2.55, rz=math.radians(-35)); P.add(cr, "rojo", 2)
    rp = 0.5
    r1 = rack(13, 0.5, "amarillo"); place(r1, 0, rp, 0.9); P.add(r1, "amarillo", 3)
    r2 = rack(13, 0.5, "azul"); place(r2, 0, -rp, 0.9, rz=math.pi); P.add(r2, "azul", 3)
    f1 = beam(5, "verde"); place(f1, 2.2, 0.5, 1.9, rz=math.pi / 2); P.add(f1, "verde", 4)
    f2 = beam(5, "verde"); place(f2, -2.2, -0.5, 1.9, rz=math.pi / 2); P.add(f2, "verde", 4)
    for (x, y) in ((2.2, 0.5), (-2.2, -0.5)):
        pp = pin(2.2); place(pp, x, y, 1.45); P.add(pp, "oscuro", 4)
    for (x, y) in ((1.65, 3.0), (-1.65, 2.0)):
        pad = box(0.2, 2.2, 0.9, "oscuro", bevel=0.02); place(pad, x, y + 0.5, 1.9); P.add(pad, "oscuro", 4)
    return P


def _rack_cam():
    camera((6.5, -14, 15), (0.0, 1.8, 1.0), 50)


@image("pinza", "n_s1")
def n_s1():
    P = build_rack_gripper(); P.show(1); _rack_cam(); render(f"{OUT}/n_s1.webp", W, H)


@image("pinza", "n_s2")
def n_s2():
    P = build_rack_gripper(); P.show(2); _rack_cam(); render(f"{OUT}/n_s2.webp", W, H)


@image("pinza", "n_s3")
def n_s3():
    P = build_rack_gripper(); P.show(3); _rack_cam(); render(f"{OUT}/n_s3.webp", W, H)


@image("pinza", "n_s4")
def n_s4():
    P = build_rack_gripper(); P.show(4); _rack_cam(); render(f"{OUT}/n_s4.webp", W, H)


@image("pinza", "n_cremallera")
def n_cremallera():
    P = build_rack_gripper(); P.paint()
    arc_xy((0, 0, 3.4), 1.0, math.radians(30), math.radians(160), "acento", r=0.07)
    arrow((2.6, 0.5, 2.9), (1.2, 0.5, 2.9), "cian", r=0.07, head=0.3)
    arrow((-2.6, -0.5, 2.9), (-1.2, -0.5, 2.9), "cian", r=0.07, head=0.3)
    _rack_cam(); render(f"{OUT}/n_cremallera.webp", W, H)


def _grip_front(pads, slip):
    """Pinza vista de frente agarrando una pieza (plano XZ)."""
    HZ = 6.0
    palm = beam(5, "verde"); plane(palm, -2, HZ, 1); set_mat(palm, "verde")
    for x in (-2, 2):
        f = beam(4, "verde"); plane(f, x, HZ, 2, rot=-math.pi / 2)
        pn = pin(1.6); plane(pn, x, HZ, 1.5)
    cz = HZ - 1.9 - (0.9 if slip else 0)
    cargo = box(2.7 if pads else 3.0, 0.9, 2.2, "masa", bevel=0.05); cargo.location = (0, -2, cz)
    if pads:
        for s in (-1, 1):
            pad = box(0.2, 0.9, 2.4, "oscuro", bevel=0.02); pad.location = (s * 1.45, -2, HZ - 1.9)
    return HZ, cz


def _grip_cam():
    camera((2.5, -17, 8.2), (0, 0, 4.2), 50)


@image("pinza", "n_roz_mal")
def n_roz_mal():
    HZ, cz = _grip_front(False, True)
    arrow((0, -4.0, cz + 1.4), (0, -4.0, cz - 1.9), "acento", r=0.1, head=0.4)
    for s in (-1, 1):
        arrow((s * 3.3, -3.0, cz + 0.6), (s * 3.3, -3.0, cz + 0.9), "cian", r=0.05, head=0.2)
        arrow((s * 3.4, -3.0, cz), (s * 2.0, -3.0, cz), "masa", r=0.05, head=0.22)
    _grip_cam(); render(f"{OUT}/n_roz_mal.webp", W, H)


@image("pinza", "n_roz_bien")
def n_roz_bien():
    HZ, cz = _grip_front(True, False)
    arrow((0, -4.0, cz + 0.2), (0, -4.0, cz - 1.9), "acento", r=0.1, head=0.4)
    for s in (-1, 1):
        arrow((s * 3.3, -3.0, cz - 0.9), (s * 3.3, -3.0, cz + 0.9), "bien", r=0.08, head=0.3)
        arrow((s * 3.4, -3.0, cz), (s * 2.0, -3.0, cz), "masa", r=0.05, head=0.22)
    _grip_cam(); render(f"{OUT}/n_roz_bien.webp", W, H)


def _para_scene(parallel, a1=35):
    P, g = build_arm(a1=0, a2=0)
    for o, c, s in P.items:
        if s >= 3:
            o.hide_render = True; o.hide_viewport = True
        else:
            set_mat(o, c)
    r = math.radians(a1)
    S = (0.0, SH_Z); S2 = (0.0, SH_Z - 2)
    L = 8.0
    bar1 = beam(9, "amarillo"); plane(bar1, S[0], S[1], 1, rot=r)
    P1 = pt(S, L, r)
    if parallel:
        bar2 = beam(9, "amarillo"); plane(bar2, S2[0], S2[1], 1, rot=r)
        for q in (S, S2):
            pn = pin(2.2); plane(pn, q[0], q[1], 0.5)
        P2_ = pt(S2, L, r)
        for q in (P1, P2_):
            pn = pin(2.2); plane(pn, q[0], q[1], 1.5)
        hand_ang = -math.pi / 2
        hand = beam(6, "verde"); plane(hand, P1[0], P1[1], 2, rot=hand_ang)
    else:
        pn = pin(2.2); plane(pn, S[0], S[1], 0.5)
        hand_ang = -math.pi / 2 + r
        hand = beam(6, "verde"); plane(hand, P1[0], P1[1], 2, rot=hand_ang)
        pn = pin(2.2); plane(pn, P1[0], P1[1], 1.5)
    end = pt(P1, 5, hand_ang)
    tray_dir = hand_ang + math.pi / 2
    tc = pt(end, 0, 0)
    tray = beam(5, "verde"); plane(tray, end[0] - 2 * math.cos(tray_dir), end[1] - 2 * math.sin(tray_dir), 3, rot=tray_dir)
    pt_ = pin(2.2); plane(pt_, end[0], end[1], 2.5)
    cup = box(1.8, 0.9, 2.2, "masa", bevel=0.05)
    up = tray_dir + math.pi / 2
    cc = (end[0] + 1.3 * math.cos(up), end[1] + 1.3 * math.sin(up))
    plane(cup, cc[0], cc[1], 3, rot=tray_dir)
    # flecha vertical de la orientacion de la mano
    return P1, end, hand_ang


@image("pinza", "n_para_mal")
def n_para_mal():
    P1, end, ha = _para_scene(False)
    arrow((end[0] + 3.0, -4.6, end[1] + 0.2), (end[0] + 3.0 + 1.9 * math.sin(math.radians(35)), -4.6, end[1] + 1.9 * math.cos(math.radians(35))), "mal", r=0.08, head=0.32)
    camera((8, -30, 8.5), (4.5, 0, 5.5), 50); render(f"{OUT}/n_para_mal.webp", W, H)


@image("pinza", "n_para_bien")
def n_para_bien():
    P1, end, ha = _para_scene(True)
    arrow((end[0] + 3.0, -4.6, end[1] + 0.2), (end[0] + 3.0, -4.6, end[1] + 2.0), "bien", r=0.08, head=0.32)
    camera((8, -30, 8.5), (4.5, 0, 5.5), 50); render(f"{OUT}/n_para_bien.webp", W, H)


# ---------------------------------------------------------------- DIAGNOSTICO

@image("diag", "d_cae")
def d_cae():
    P, g = build_arm(a1=20, a2=0, cargo=True); P.paint()
    Q, g2 = build_arm(a1=-35, a2=-40, cargo=False); Q.gray()
    for o, c, s in Q.items:
        if s <= 2:
            o.hide_render = True
    arc_arrow((0, -3.0, SH_Z), 5.0, math.radians(18), math.radians(-30), "mal", r=0.09)
    arm_cam((12, -34, 12), (5.2, 0, 4.4)); render(f"{OUT}/d_cae.webp", W, H)


@image("diag", "d_juego")
def d_juego():
    P, g = build_arm(a1=35, a2=0, servo=False); P.paint()
    Q, g2 = build_arm(a1=35, a2=8, servo=False); Q.gray()
    for o, c, s in Q.items:
        if s <= 3:
            o.hide_render = True
    T = g["T"]
    arrow((T[0] + 1.0, -4.3, T[1] - 1.8), (T[0] + 1.0, -4.3, T[1] + 1.8), "acento", r=0.08, head=0.32)
    arrow((T[0] + 1.0, -4.3, T[1] + 1.8), (T[0] + 1.0, -4.3, T[1] - 1.8), "acento", r=0.08, head=0.32)
    arm_cam((12, -33, 15), (5.5, 0, 7.5)); render(f"{OUT}/d_juego.webp", W, H)


def _long_arm(brace):
    P, g = build_arm(a1=15, a2=0, n1=13, n2=11, servo=False); P.paint()
    return P, g


@image("diag", "d_vibra")
def d_vibra():
    P, g = _long_arm(False)
    T = g["T"]
    for da, col in ((10, "ghost"), (-10, "ghost")):
        Q, g2 = build_arm(a1=15, a2=da, n1=13, n2=11, servo=False)
        Q.gray()
        for o, c, s in Q.items:
            if s <= 3:
                o.hide_render = True
    arrow((T[0] + 2.5, -4.6, T[1] - 3.5), (T[0] + 2.5, -4.6, T[1] + 3.5), "cian", r=0.08, head=0.34)
    arrow((T[0] + 2.5, -4.6, T[1] + 3.5), (T[0] + 2.5, -4.6, T[1] - 3.5), "cian", r=0.08, head=0.34)
    camera((15, -42, 13), (8.5, 0, 6.5), 50); render(f"{OUT}/d_vibra.webp", W, H)


@image("diag", "d_diagonal")
def d_diagonal():
    P, g = build_arm(a1=15, a2=0, n1=13, n2=11, servo=False); P.paint()
    # triangulo 3-4-5 sobre el primer eslabon: dos diagonales (5 pasos) y vertice a 3 pasos de altura
    S = g["S"]; a = math.radians(15)

    def loc(lx, lz):
        return (S[0] + lx * math.cos(a) - lz * math.sin(a), S[1] + lx * math.sin(a) + lz * math.cos(a))
    for (x0, z0, x1, z1, lay) in ((0, 0, 4, 3, 3), (8, 0, 4, 3, 4)):
        p0, p1 = loc(x0, z0), loc(x1, z1)
        ang = math.atan2(p1[1] - p0[1], p1[0] - p0[0])
        d = beam(6, "azul"); plane(d, p0[0], p0[1], lay, rot=ang)
        pa = pin(2.6 if lay == 4 else 2.2); plane(pa, p0[0], p0[1], 3.0 if lay == 4 else 2.5)
    pv = pin(2.8); a_top = loc(4, 3); plane(pv, a_top[0], a_top[1], 3.5)
    camera((15, -42, 13), (8.5, 0, 6.5), 50); render(f"{OUT}/d_diagonal.webp", W, H)


def _cable_arm(slack):
    P, g = build_arm(a1=60, a2=-60, servo=False); P.paint()
    S, E, T = g["S"], g["E"], g["T"]
    y = -2.3 if slack else -5.0
    if slack:
        # sale de la columna, sigue el eslabon 1 por encima, hace un bucle holgado en el codo y sigue el eslabon 2
        a = math.radians(60); b = math.radians(-60)
        off = 0.9
        p0 = (0.0, 2.2)
        ptsl = [(p0[0], y, p0[1]), (S[0] - 0.9, y, S[1] + 0.5)]
        n1 = (-math.sin(a) * off, math.cos(a) * off)
        n2 = (-math.sin(b) * off, math.cos(b) * off)
        A = (S[0] + n1[0], S[1] + n1[1]); B = (E[0] + n1[0], E[1] + n1[1])
        ptsl += [(A[0], y, A[1]), (B[0] - 0.2, y, B[1])]
        # bucle suave hacia fuera del codo
        for i in range(1, 12):
            t = i / 12
            ang = a + math.radians(90) - t * math.radians(240) + math.radians(0)
            ptsl.append((E[0] + 1.9 * math.cos(ang), y, E[1] + 1.9 * math.sin(ang)))
        C = (E[0] + n2[0], E[1] + n2[1]); D = (T[0] + n2[0], T[1] + n2[1])
        ptsl += [(C[0], y, C[1]), (D[0], y, D[1])]
        rope(ptsl, "bien", 0.12)
        for q in (A, B, C, D):
            br = box(0.5, 0.5, 0.35, "azul"); place(br, q[0], -2.3, q[1]); set_mat(br, "azul")
    else:
        # cable tenso: recta de la columna a la pinza, cruzando por dentro del codo
        rope([(0.0, y, 2.2), (T[0], y, T[1])], "mal", 0.12)
    camera((10, -32, 12), (5, 0, 7.0), 50)


@image("diag", "d_cable_mal")
def d_cable_mal():
    _cable_arm(False); render(f"{OUT}/d_cable_mal.webp", W, H)


@image("diag", "d_cable_bien")
def d_cable_bien():
    _cable_arm(True); render(f"{OUT}/d_cable_bien.webp", W, H)


# ---------------------------------------------------------------- principal

def main():
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else ["all"]
    group = args[0] if args else "all"
    only = set(args[1:])
    todo = [(n, g, f) for n, (g, f) in IMAGES.items() if (group in ("all", g)) and (not only or n in only)]
    begin()
    for n, g, f in todo:
        f()
        purge()
    print("HECHO", len(todo))


if __name__ == "__main__":
    main()
