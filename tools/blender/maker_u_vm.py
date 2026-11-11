"""
Maker Student - imagenes de la unidad "Ventaja mecanica" (palanca, poleas, engranajes).

Uso (desde la raiz del repo):
  blender -b --factory-startup --python tools/blender/maker_u_vm.py -- [palanca|poleas|engranajes|all] [nombre_imagen ...]

Cada imagen es una funcion que construye la escena con piezas de maker_lib.py,
la renderiza a public/assets/img/vm/<nombre>.webp y la limpia.
En las imagenes de montaje paso a paso, lo nuevo sale en color y lo anterior en gris.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from maker_lib import *

OUT = os.path.join(ROOT, "public", "assets", "img", "vm")
args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else ["all"]
GROUP = args[0] if args else "all"
ONLY = set(args[1:])
W, H = 1280, 720
SAMPLES = 40

KEEP = set()
IMAGES = {}  # nombre -> (grupo, funcion)


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


# ---------------------------------------------------------------- PALANCA

PIV = (5, 4.0)
AY = -5.0  # plano de las flechas (delante de todo)  # x, z del apoyo


def build_lever(left=None, right=None, tilt=0.0, hanger=True, stage_view=None):
    """Palanca de 11 agujeros apoyada en el agujero 6 (x=5).
    left/right: (unidades, distancia en agujeros al apoyo). tilt en radianes (+ baja el lado derecho)."""
    P = Parts()
    base = P.add(beam(9, "gris"), "gris", 1); plane(base, 1, -2.0, 0)
    up = P.add(beam(7, "azul"), "azul", 2); plane(up, 5, -2.0, 1, rot=math.pi / 2)
    pin0 = P.add(pin(2.1), "oscuro", 2); plane(pin0, 5, -2.0, 0.5)
    lev = P.add(beam(11, "amarillo"), "amarillo", 3); plane(lev, 0, PIV[1], 2)
    pv = P.add(pin(3.2), "oscuro", 3); plane(pv, PIV[0], PIV[1], 1.4)
    moving = [lev]
    for side, spec in (("L", left), ("R", right)):
        if not spec:
            continue
        units, dist = spec
        x = PIV[0] - dist if side == "L" else PIV[0] + dist
        hg = P.add(beam(3, "rojo"), "rojo", 4); plane(hg, x, PIV[1], 3, rot=-math.pi / 2)
        pn = P.add(pin(2.1), "oscuro", 4); plane(pn, x, PIV[1], 2.5)
        m, h = weight(units, "verde")
        P.add(m, "verde", 4)
        m.matrix_world = Matrix.Translation((x, -4, PIV[1] - 2 + 0.3 - h))  # cuelga del ultimo agujero, delante
        moving += [hg, pn, m]
    if tilt:
        group_rotate(moving, PIV, tilt)
        # el pin del apoyo no se mueve; los demas si
    return P, moving


def lever_cam(w=1.0):
    camera((8.0, -24, 8.5), (5.0, 0, 1.8), 50)


@image("palanca", "p_s1")
def p_s1():
    P, _ = build_lever(left=(2, 2), right=(1, 4)); P.show(1); lever_cam(); render(f"{OUT}/p_s1.webp", W, H)


@image("palanca", "p_s2")
def p_s2():
    P, _ = build_lever(left=(2, 2), right=(1, 4)); P.show(2); lever_cam(); render(f"{OUT}/p_s2.webp", W, H)


@image("palanca", "p_s3")
def p_s3():
    P, _ = build_lever(left=(2, 2), right=(1, 4)); P.show(3); lever_cam(); render(f"{OUT}/p_s3.webp", W, H)


@image("palanca", "p_s4")
def p_s4():
    P, _ = build_lever(left=(2, 2), right=(1, 4)); P.show(4); lever_cam(); render(f"{OUT}/p_s4.webp", W, H)


@image("palanca", "p_hero")
def p_hero():
    P, _ = build_lever(left=(2, 2), right=(1, 4)); P.show(4)
    for o, c, s in P.items:
        set_mat(o, c)
    arrow((3, AY, PIV[1] + 2.3), (3, AY, PIV[1] + 0.9), "acento")
    arrow((9, AY, PIV[1] + 2.3), (9, AY, PIV[1] + 0.9), "cian", r=0.045, head=0.24)
    lever_cam(); render(f"{OUT}/p_hero.webp", W, H)


@image("palanca", "p_ventaja")
def p_ventaja():
    P, _ = build_lever(left=(4, 1), right=(1, 4))
    for o, c, s in P.items:
        set_mat(o, c)
    # fuerza grande cerca, fuerza pequena lejos
    arrow((4, AY, PIV[1] + 3.0), (4, AY, PIV[1] + 0.9), "acento", r=0.09)
    arrow((9, AY, PIV[1] + 1.8), (9, AY, PIV[1] + 0.9), "cian", r=0.045, head=0.24)
    lever_cam(); render(f"{OUT}/p_ventaja.webp", W, H)


@image("palanca", "p_recorrido")
def p_recorrido():
    """Palanca inclinada: el extremo lejano recorre mucho mas que el cercano."""
    P, moving = build_lever(left=(4, 1), right=(1, 4), tilt=math.radians(-14))
    for o, c, s in P.items:
        set_mat(o, c)
    # dos arcos de recorrido: corto a 1 agujero, largo a 4 agujeros
    arc_arrow((PIV[0], AY, PIV[1]), 1.0, math.radians(180 - 1), math.radians(180 + 15), "acento", r=0.06)
    arc_arrow((PIV[0], AY, PIV[1]), 4.0, math.radians(-1), math.radians(14), "cian", r=0.06)
    lever_cam(); render(f"{OUT}/p_recorrido.webp", W, H)


@image("palanca", "p_inclina")
def p_inclina():
    P, _ = build_lever(left=(2, 3), right=(1, 4), tilt=math.radians(-9))
    for o, c, s in P.items:
        set_mat(o, c)
    lever_cam(); render(f"{OUT}/p_inclina.webp", W, H)


def _dist_arrows(x0, color, tipz=PIV[1] + 1.3):
    for x in (3, 9):
        arrow((x0, AY, tipz), (x, AY, tipz), color, r=0.05, head=0.25)


@image("palanca", "p_error_borde_mal")
def p_error_borde_mal():
    P, _ = build_lever(left=(2, 2), right=(1, 4))
    for o, c, s in P.items:
        set_mat(o, c)
    # mal: medir desde el extremo de la viga
    _dist_arrows(0, "mal", PIV[1] + 1.3)
    lever_cam(); render(f"{OUT}/p_error_borde_mal.webp", W, H)


@image("palanca", "p_error_borde_bien")
def p_error_borde_bien():
    P, _ = build_lever(left=(2, 2), right=(1, 4))
    for o, c, s in P.items:
        set_mat(o, c)
    arrow((PIV[0], AY, PIV[1] + 1.3), (3, AY, PIV[1] + 1.3), "bien", r=0.05, head=0.25)
    arrow((PIV[0], AY, PIV[1] + 1.3), (9, AY, PIV[1] + 1.3), "bien", r=0.05, head=0.25)
    lever_cam(); render(f"{OUT}/p_error_borde_bien.webp", W, H)


def _marker(x, color, z=None):
    z = PIV[1] + 0.95 if z is None else z
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.17, location=(x, AY, z), segments=20, ring_count=12)
    o = bpy.context.active_object
    o.data.materials.append(M(color))
    for p in o.data.polygons:
        p.use_smooth = True
    return o


@image("palanca", "p_error_cuenta_mal")
def p_error_cuenta_mal():
    """Mal: contar tambien el agujero del apoyo (5 marcas para llegar a 4 agujeros)."""
    P, _ = build_lever(left=(2, 2), right=(1, 4))
    for o, c, s in P.items:
        set_mat(o, c)
    for x in range(5, 10):
        _marker(x, "mal")
    lever_cam(); render(f"{OUT}/p_error_cuenta_mal.webp", W, H)


@image("palanca", "p_error_cuenta_bien")
def p_error_cuenta_bien():
    """Bien: contar los saltos desde el apoyo (el agujero del apoyo es el cero)."""
    P, _ = build_lever(left=(2, 2), right=(1, 4))
    for o, c, s in P.items:
        set_mat(o, c)
    for x in range(6, 10):
        _marker(x, "bien")
    lever_cam(); render(f"{OUT}/p_error_cuenta_bien.webp", W, H)


# ---------------------------------------------------------------- POLEAS

FIX = (4.34, 7.0)
MOV = (2.78, 4.0)
R_P = 0.78


def rope_pts(kind, mov=MOV):
    """Puntos de la cuerda segun el montaje ('fija' o 'movil')."""
    pts = []
    y = -1.25
    def arc(c, a0, a1, n=20):
        return [(c[0] + R_P * math.cos(a0 + (a1 - a0) * i / n), y, c[1] + R_P * math.sin(a0 + (a1 - a0) * i / n)) for i in range(n + 1)]
    if kind == "fija":
        # peso a la izquierda, mano a la derecha, por encima de la polea fija
        L = FIX[0] - R_P
        pts += [(L, y, 2.2), (L, y, FIX[1])]
        pts += arc(FIX, math.pi, 0)
        pts += [(FIX[0] + R_P, y, 2.2)]
    else:
        ax = mov[0] - R_P
        pts += [(2.0, y, FIX[1]), (2.0, y, mov[1])]
        pts += arc(mov, math.pi, 2 * math.pi)
        pts += [(mov[0] + R_P, y, mov[1]), (FIX[0] - R_P, y, FIX[1])]
        pts += arc(FIX, math.pi, 0)
        pts += [(FIX[0] + R_P, y, 2.2)]
    return pts


def build_pulleys(kind, lift=0.0):
    P = Parts()
    for x in (0, 7):
        b = P.add(beam(8, "gris"), "gris", 1); plane(b, x, 0, 0, rot=math.pi / 2)
    top = P.add(beam(8, "gris"), "gris", 1); plane(top, 0, 7, 0)
    bot = P.add(beam(8, "gris"), "gris", 1); plane(bot, 0, 0, 0)
    fx = P.add(axle(2.6), "eje", 2); plane(fx, FIX[0], FIX[1], 0.9)
    # soporte de la polea fija
    fp = P.add(pulley(R_P, "azul"), "azul", 2); plane(fp, FIX[0], FIX[1], 1.25)
    if kind == "fija":
        m, h = weight(3, "masa")
        P.add(m, "masa", 4)
        L = FIX[0] - R_P
        m.location = (L, -1.25, 2.2 - 0.5 - h)
        rp = P.add(rope(rope_pts("fija")), "cuerda", 3)
        return P
    mv = (MOV[0], MOV[1] + lift)
    mp = P.add(pulley(R_P, "rojo"), "rojo", 3); plane(mp, mv[0], mv[1], 1.25)
    hub = P.add(pin(1.8), "oscuro", 3); plane(hub, mv[0], mv[1], 1.25)
    hg = P.add(beam(2, "amarillo"), "amarillo", 4); plane(hg, mv[0], mv[1], 2.0, rot=-math.pi / 2)
    m, h = weight(2, "masa")
    P.add(m, "masa", 4)
    m.location = (mv[0], -2.0, mv[1] - 1 - 0.45 - h + 0.3)
    anchor = P.add(pin(1.8), "oscuro", 3); plane(anchor, 2.0, FIX[1], 0.9)
    pts = rope_pts("movil", mv)
    P.add(rope(pts), "cuerda", 3)
    return P


def pulley_cam():
    camera((6.5, -27, 8.0), (3.5, 0, 3.6), 50)


@image("poleas", "po_s1")
def po_s1():
    P = build_pulleys("movil"); P.show(1); pulley_cam(); render(f"{OUT}/po_s1.webp", W, H)


@image("poleas", "po_s2")
def po_s2():
    P = build_pulleys("movil"); P.show(2); pulley_cam(); render(f"{OUT}/po_s2.webp", W, H)


@image("poleas", "po_s3")
def po_s3():
    P = build_pulleys("movil"); P.show(3); pulley_cam(); render(f"{OUT}/po_s3.webp", W, H)


@image("poleas", "po_s4")
def po_s4():
    P = build_pulleys("movil"); P.show(4); pulley_cam(); render(f"{OUT}/po_s4.webp", W, H)


@image("poleas", "po_hero")
def po_hero():
    P = build_pulleys("movil")
    for o, c, s in P.items:
        set_mat(o, c)
    arrow((FIX[0] + R_P, -1.25, 3.4), (FIX[0] + R_P, -1.25, 1.6), "acento", r=0.07)
    pulley_cam(); render(f"{OUT}/po_hero.webp", W, H)


@image("poleas", "po_fija")
def po_fija():
    P = build_pulleys("fija")
    for o, c, s in P.items:
        set_mat(o, c)
    # mismas flechas: tiras con la misma fuerza que el peso, solo cambia la direccion
    arrow((FIX[0] + R_P, -1.25, 3.4), (FIX[0] + R_P, -1.25, 1.6), "acento", r=0.07)
    arrow((FIX[0] - R_P, -1.25, 0.3), (FIX[0] - R_P, -1.25, -1.1), "cian", r=0.07)
    pulley_cam(); render(f"{OUT}/po_fija.webp", W, H)


def _strand_marks(xs, color):
    for x in xs:
        arrow((x, -2.4, 4.9), (x, -2.4, 6.3), color, r=0.09, head=0.36)


@image("poleas", "po_error_cuenta_mal")
def po_error_cuenta_mal():
    """Mal: contar tambien el tramo por el que tiras (3 tramos)."""
    P = build_pulleys("movil")
    for o, c, s in P.items:
        set_mat(o, c)
    _strand_marks((2.0, MOV[0] + R_P, FIX[0] + R_P), "mal")
    pulley_cam(); render(f"{OUT}/po_error_cuenta_mal.webp", W, H)


@image("poleas", "po_error_cuenta_bien")
def po_error_cuenta_bien():
    """Bien: solo los tramos que sujetan la polea movil (2 tramos)."""
    P = build_pulleys("movil")
    for o, c, s in P.items:
        set_mat(o, c)
    _strand_marks((2.0, MOV[0] + R_P), "bien")
    pulley_cam(); render(f"{OUT}/po_error_cuenta_bien.webp", W, H)


# ---------------------------------------------------------------- ENGRANAJES

GZ = 3.0  # altura de los ejes


def pair_phase(t1, t2, phi):
    """Giro de cada engranaje (rotacion de t1 = phi). El primero tiene un diente hacia +X (hacia el segundo)."""
    return phi, math.pi + math.pi / t2 - phi * t1 / t2


def build_pair(t1, t2, d=None, phi=0.0, c1="azul", c2="amarillo", crank=True, pointer=True, colorize_up_to=None):
    """Dos engranajes en una placa. d = distancia entre ejes (por defecto la que engrana)."""
    P = Parts()
    d = (t1 + t2) / 16.0 if d is None else d
    x1 = 1.0
    x2 = x1 + d
    plate = P.add(beam(11, "gris"), "gris", 1); plane(plate, 0, GZ, 0)
    a1 = P.add(axle(3.2), "eje", 2); plane(a1, x1, GZ, 1.0)
    a2 = P.add(axle(3.2), "eje", 2); plane(a2, x2, GZ, 1.0)
    r1, r2 = pair_phase(t1, t2, phi)
    g1 = P.add(gear(t1, c1), c1, 3); plane(g1, x1, GZ, 0.9, rot=r1)
    g2 = P.add(gear(t2, c2), c2, 4); plane(g2, x2, GZ, 0.9, rot=r2)
    if crank:
        cr = P.add(beam(3, "rojo"), "rojo", 5); plane(cr, x1, GZ, 2.0, rot=-2.4 + phi)
        ang = -2.4 + phi
        hx, hz = x1 + 2 * math.cos(ang), GZ + 2 * math.sin(ang)
        hp = P.add(pin(1.2), "oscuro", 5); plane(hp, hx, hz, 2.3)
    if pointer:
        ptr = P.add(beam(2, "verde"), "verde", 5); plane(ptr, x2, GZ, 2.0, rot=r2 - (math.pi + math.pi / t2) + math.pi / 2)
    return P, x1, x2


def gear_cam(x_mid=3.0, z=GZ, dist=17, lens=50):
    camera((x_mid + 3.0, -dist, z + 5.0), (x_mid, 0, z - 0.2), lens)


@image("engranajes", "g_s1")
def g_s1():
    P, x1, x2 = build_pair(8, 24); P.show(1); gear_cam(4.0); render(f"{OUT}/g_s1.webp", W, H)


@image("engranajes", "g_s2")
def g_s2():
    P, x1, x2 = build_pair(8, 24); P.show(2); gear_cam(4.0); render(f"{OUT}/g_s2.webp", W, H)


@image("engranajes", "g_s3")
def g_s3():
    P, x1, x2 = build_pair(8, 24); P.show(3); gear_cam(4.0); render(f"{OUT}/g_s3.webp", W, H)


@image("engranajes", "g_s4")
def g_s4():
    P, x1, x2 = build_pair(8, 24); P.show(4); gear_cam(4.0); render(f"{OUT}/g_s4.webp", W, H)


@image("engranajes", "g_s5")
def g_s5():
    P, x1, x2 = build_pair(8, 24); P.show(5); gear_cam(4.0); render(f"{OUT}/g_s5.webp", W, H)


@image("engranajes", "g_hero")
def g_hero():
    P, x1, x2 = build_pair(8, 24)
    for o, c, s in P.items:
        set_mat(o, c)
    gear_cam(4.0); render(f"{OUT}/g_hero.webp", W, H)


def _turn_arrows(x1, x2, t1, t2, drive_big=False):
    # el que mueve gira en sentido horario (visto de frente); el movido, antihorario
    r1, r2 = t1 / 16.0, t2 / 16.0
    # el pequeno recorre un arco largo, el grande uno corto (mismo tiempo)
    big = max(t1, t2)
    ratio = max(t1, t2) / min(t1, t2)
    short = math.radians(60)
    long_ = min(short * ratio, math.radians(280))
    for (x, r, t, cw) in ((x1, r1, t1, True), (x2, r2, t2, False)):
        span = long_ if t < big else short
        a_mid = math.radians(90)
        if cw:
            a0, a1 = a_mid + span / 2, a_mid - span / 2
        else:
            a0, a1 = a_mid - span / 2, a_mid + span / 2
        arc_arrow((x, -2.4, GZ), r + 0.55, a0, a1, "acento" if cw else "cian", r=0.07)


@image("engranajes", "g_lento_fuerte")
def g_lento_fuerte():
    P, x1, x2 = build_pair(8, 24, crank=True, pointer=False)
    for o, c, s in P.items:
        set_mat(o, c)
    _turn_arrows(x1, x2, 8, 24)
    gear_cam(4.0); render(f"{OUT}/g_lento_fuerte.webp", W, H)


@image("engranajes", "g_rapido_flojo")
def g_rapido_flojo():
    P, x1, x2 = build_pair(24, 8, c1="amarillo", c2="azul", crank=True, pointer=False)
    for o, c, s in P.items:
        set_mat(o, c)
    _turn_arrows(x1, x2, 24, 8)
    gear_cam(4.0); render(f"{OUT}/g_rapido_flojo.webp", W, H)


@image("engranajes", "g_loco")
def g_loco():
    """Tres engranajes 8-24-8 en fila (ejes a 2 agujeros): el del medio (loco) solo cambia el sentido."""
    plate = beam(11, "gris"); plane(plate, 0, GZ, 0)
    xs = [1.0, 3.0, 5.0]
    ts = [8, 24, 8]
    rots = (0.0, math.pi + math.pi / 24, 0.0)  # fase de dientes calculada para que engranen
    for x, t, r, c in zip(xs, ts, rots, ("azul", "gris", "amarillo")):
        a = axle(3.2); plane(a, x, GZ, 1.0)
        g = gear(t, c); plane(g, x, GZ, 0.9, rot=r)
    for x, t, cw in zip(xs, ts, (True, False, True)):
        rr = t / 16 + 0.55
        arc_arrow((x, -2.0, GZ), rr, math.radians(125 if cw else 55), math.radians(55 if cw else 125),
                  "acento" if cw else "cian", r=0.07)
    camera((3.0, -18, GZ + 4.2), (3.0, 0, GZ - 0.2), 50); render(f"{OUT}/g_loco.webp", W, H)


@image("engranajes", "g_tren")
def g_tren():
    """Tren compuesto 8->24 y 8->24 (en total 9 vueltas del pequeno por cada vuelta de la ultima)."""
    P = Parts()
    plate = beam(11, "gris"); plane(plate, 0, GZ, 0)
    xs = [1.0, 3.0, 5.0]
    a = axle(4.4); plane(a, xs[0], GZ, 1.2)
    b = axle(4.4); plane(b, xs[1], GZ, 1.2)
    c = axle(4.4); plane(c, xs[2], GZ, 1.2)
    gA = gear(8, "azul"); plane(gA, xs[0], GZ, 0.9, rot=0.0)
    r24 = math.pi + math.pi / 24
    gB = gear(24, "gris"); plane(gB, xs[1], GZ, 0.9, rot=r24)
    gB2 = gear(8, "azul"); plane(gB2, xs[1], GZ, 2.1, rot=0.0)
    gC = gear(24, "amarillo"); plane(gC, xs[2], GZ, 2.1, rot=r24)
    for x, cw, r in ((xs[0], True, 0.9), (xs[1], False, 1.0), (xs[2], True, 1.0)):
        arc_arrow((x, -3.0, GZ), r + 0.8, math.radians(125 if cw else 55), math.radians(55 if cw else 125),
                  "acento" if cw else "cian", r=0.07)
    camera((6.0, -19, GZ + 6.0), (3.2, 0, GZ - 0.2), 50); render(f"{OUT}/g_tren.webp", W, H)


def _pair_dist(name, d):
    P, x1, x2 = build_pair(8, 24, d=d, crank=False, pointer=False)
    for o, c, s in P.items:
        set_mat(o, c)
    gear_cam(3.6); render(f"{OUT}/{name}.webp", W, H)


@image("engranajes", "g_dist_lejos")
def g_dist_lejos():
    _pair_dist("g_dist_lejos", 3.0)


@image("engranajes", "g_dist_justa")
def g_dist_justa():
    _pair_dist("g_dist_justa", 2.0)


@image("engranajes", "g_dist_cerca")
def g_dist_cerca():
    _pair_dist("g_dist_cerca", 1.4)


# ---------------------------------------------------------------- principal

def main():
    todo = [(n, g, f) for n, (g, f) in IMAGES.items() if (GROUP in ("all", g)) and (not ONLY or n in ONLY)]
    begin()
    for n, g, f in todo:
        f()
        purge()
    print("HECHO", len(todo))


main()
