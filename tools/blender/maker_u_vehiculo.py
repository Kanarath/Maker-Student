"""
Maker Student - imagenes de la unidad "Vehiculos Technic" (direccion, diferencial, suspension y diagnostico).

Uso (desde la raiz del repo):
  blender -b --factory-startup --python tools/blender/maker_u_vehiculo.py -- [direccion|diferencial|suspension|diag|all] [nombre_imagen ...]

Piezas nuevas definidas aqui: rueda, cremallera, volante, engranaje conico (aprox.), muelle helicoidal,
amortiguador, motor y bloques. Son formas genericas (no de ninguna marca).
Cada imagen se renderiza a public/assets/img/vehiculo/<nombre>.webp. Lo nuevo en color y lo anterior en gris.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import maker_lib
from maker_lib import *
from maker_lib import _mat, _prism, _to_obj, _cyl_cutter, _cut, _gear_pts

OUT = os.path.join(ROOT, "public", "assets", "img", "vehiculo")
args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else ["all"]
GROUP = args[0] if args else "all"
ONLY = set(args[1:])
W, H = 1280, 720
SAMPLES = 40
if os.environ.get("MAKER_FAST"):  # vista previa rapida (no se guarda en public/)
    W, H, SAMPLES = 640, 360, 6
    OUT = os.environ["MAKER_FAST"]

# ---- materiales extra (se enganchan a M de la biblioteca sin tocarla)
EXTRA = {
    "neum": ("#5a6176", 0.0, 0.7),
    "llanta": ("#aeb6c8", 0.2, 0.35),
    "hielo": ("#9fdcf0", 0.0, 0.15),
    "asfalto": ("#6f7586", 0.0, 0.8),
    "motor": ("#5d6478", 0.2, 0.4),
    "madera": ("#b7864f", 0.0, 0.6),
    "muelle": ("#c9ced9", 0.6, 0.3),
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
    """Piezas con etapa. color=None: pieza con varios materiales (se respeta en su etapa; gris antes)."""

    def __init__(self):
        self.items = []

    def add(self, o, color, stage=1):
        self.items.append((o, color, stage))
        return o

    def _ghost(self, o):
        o.data.materials.clear()
        o.data.materials.append(M("ghost"))

    def show(self, k, mapping=None):
        for o, color, stage in self.items:
            st = mapping.get(stage, stage) if mapping else stage
            if st > k:
                o.hide_render = True
                o.hide_viewport = True
            elif st == k:
                if color:
                    set_mat(o, color)
            else:
                self._ghost(o)

    def color_all(self):
        for o, color, stage in self.items:
            if color:
                set_mat(o, color)


# ------------------------------------------------------------------ utilidades

def put(o, loc=(0, 0, 0), rx=0.0, ry=0.0, rz=0.0):
    o.matrix_world = Matrix.Translation(loc) @ Matrix.Rotation(rz, 4, "Z") @ Matrix.Rotation(ry, 4, "Y") @ Matrix.Rotation(rx, 4, "X")
    return o


def rot_about(o, pivot, ang):
    """Gira el objeto `ang` radianes alrededor de la vertical (Z) que pasa por pivot=(x, y)."""
    px, py = pivot
    R = Matrix.Translation((px, py, 0)) @ Matrix.Rotation(ang, 4, "Z") @ Matrix.Translation((-px, -py, 0))
    o.matrix_world = R @ o.matrix_world


def cyl(r, depth, color, seg=32, bevel=0.02):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r, radius2=r, depth=depth)
    return _to_obj("cil", bm, color, bevel=bevel)


def box(sx, sy, sz, color, bevel=0.04):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Diagonal((sx, sy, sz, 1)))
    return _to_obj("caja", bm, color, smooth_sides=False, bevel=bevel)


def sphere(p, r, color):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=p, segments=24, ring_count=14)
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
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=14, radius1=r, radius2=r, depth=L,
                          matrix=Matrix.Translation((0, 0, L / 2)))
    o = _to_obj("barra", bm, color, bevel=0)
    o.matrix_world = Matrix.Translation(p) @ d.to_track_quat("Z", "Y").to_matrix().to_4x4()
    return o


def join(objs):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    return bpy.context.active_object


def wheel(r=1.3, w=0.9):
    """Rueda con neumatico oscuro y llanta clara. Eje Z (se coloca con rx=pi/2 para dejarlo en Y)."""
    tire = cyl(r, w, "neum", bevel=0.0)
    mod = tire.modifiers.new("Bisel", "BEVEL")
    mod.width = 0.14
    mod.segments = 3
    rim = cyl(r * 0.62, w + 0.06, "llanta", bevel=0.02)
    cap = cyl(r * 0.2, w + 0.16, "oscuro", bevel=0.02)
    return join([tire, rim, cap])


def ring_arc(center, radius, a0, a1, color="acento", r=0.07, z=0.2, head=True):
    """Flecha curva horizontal (plano XY) alrededor de center=(x, y), angulos en radianes."""
    n = 36
    pts = []
    for i in range(n + 1):
        a = a0 + (a1 - a0) * i / n
        pts.append((center[0] + radius * math.cos(a), center[1] + radius * math.sin(a), z))
    cu = bpy.data.curves.new("arco", "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = r
    cu.bevel_resolution = 3
    cu.use_fill_caps = True
    sp = cu.splines.new("POLY")
    sp.points.add(len(pts) - 1)
    for p, v in zip(sp.points, pts):
        p.co = (v[0], v[1], v[2], 1)
    o = bpy.data.objects.new("arco", cu)
    bpy.context.scene.collection.objects.link(o)
    o.data.materials.append(M(color))
    if head:
        tip = Vector(pts[-1])
        tang = (Vector(pts[-1]) - Vector(pts[-3])).normalized()
        arrow(tip - tang * 0.001, tip + tang * 0.45, color, r=r, head=0.45)
    return o


def spring(p, q, rad=0.42, turns=7, r=0.06, color="muelle"):
    """Muelle helicoidal entre dos puntos."""
    p, q = Vector(p), Vector(q)
    d = q - p
    L = d.length
    qr = d.to_track_quat("Z", "Y").to_matrix().to_4x4()
    pts = []
    n = turns * 20
    for i in range(n + 1):
        t = i / n
        a = t * turns * 2 * math.pi
        v = Vector((rad * math.cos(a), rad * math.sin(a), 0.25 + (L - 0.5) * t))
        pts.append(v)
    pts = [Vector((0, 0, 0))] + pts + [Vector((0, 0, L))]
    cu = bpy.data.curves.new("muelle", "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = r
    cu.bevel_resolution = 3
    cu.use_fill_caps = True
    sp = cu.splines.new("POLY")
    sp.points.add(len(pts) - 1)
    for pt, v in zip(sp.points, pts):
        pt.co = (v.x, v.y, v.z, 1)
    o = bpy.data.objects.new("muelle", cu)
    bpy.context.scene.collection.objects.link(o)
    o.data.materials.append(M(color))
    o.matrix_world = Matrix.Translation(p) @ qr
    return o


# ------------------------------------------------------------------ el coche

ZR, ZC, ZD, ZT = 2.4, 3.4, 4.375, 4.4   # rails, travesaño trasero/cremallera/diag A, diag B, travesaño delantero
XR, XF = 1.0, 9.0                       # eje trasero / delantero
YW, YK = 4.4, 3.5                       # centro de rueda y pivote de direccion
ARM = 1.0                               # brazo de direccion
RACK_X = 6.8


def steer_angles(R, L=XF - XR, yk=YK):
    """Angulos Ackermann (rad) de rueda interior (izq) y exterior (der) para un giro a la izquierda de radio R (al eje trasero)."""
    return math.atan(L / (R - yk)), math.atan(L / (R + yk))


def build_car(thL=0.0, thR=0.0, motor=False, wheel_kind="neum"):
    """Coche visto desde arriba: frente hacia +X. thL/thR: giro (rad) de la rueda izquierda y derecha (+ = izquierda)."""
    P = Parts()
    # etapa 1: chasis
    for sy in (-1.5, 1.5):
        r = P.add(beam(11, "gris"), "gris", 1); put(r, (0, sy, ZR))
    rb = P.add(beam(8, "azul"), "azul", 1); put(rb, (XR, -3.5, ZC), rz=math.pi / 2)
    d1 = P.add(beam(5, "amarillo"), "amarillo", 1)
    a = math.atan2(2.4, 3.2)
    put(d1, (2.0, -1.5, ZC), rz=a)
    d2 = P.add(beam(5, "amarillo"), "amarillo", 1)
    put(d2, (2.0, 1.5, ZD), rz=-a)
    # etapa 2: ejes y ruedas
    ax = P.add(axle(8.8), "eje", 2); put(ax, (XR, 0, 0), rx=math.pi / 2)
    for sy in (-1, 1):
        w = P.add(wheel(), None, 2); put(w, (XR, sy * YW, 0), rx=math.pi / 2)
    fb = P.add(beam(8, "azul"), "azul", 2); put(fb, (XF, -3.5, ZT), rz=math.pi / 2)
    for sy, th in ((1, thL), (-1, thR)):
        k = (XF, sy * YK)
        kp = P.add(cyl(0.2, 4.9, "oscuro"), "oscuro", 2); put(kp, (k[0], k[1], 2.75))
        stub = P.add(axle(1.4), "eje", 2); put(stub, (k[0], sy * (YK + 0.45), 0), rx=math.pi / 2)
        wh = P.add(wheel(), None, 2); put(wh, (XF, sy * YW, 0), rx=math.pi / 2)
        for o in (stub, wh):
            rot_about(o, k, th)
    # etapa 3: cremallera, brazos y varillas
    s = -ARM * (math.sin(thL) + math.sin(thR)) / 2
    rack = P.add(beam(4, "rojo"), "rojo", 3); put(rack, (RACK_X, -1.5 + s, ZC), rz=math.pi / 2)
    teeth = []
    for i in range(10):
        t = box(0.16, 0.2, 0.4, "rojo", bevel=0.01); put(t, (RACK_X + 0.55, -1.2 + s + i * 0.3927, ZC)); teeth.append(t)
    P.add(join(teeth), "rojo", 3)
    for sy, th in ((1, thL), (-1, thR)):
        k = (XF, sy * YK)
        arm = P.add(beam(2, "verde"), "verde", 3); put(arm, (k[0], k[1], ZC), rz=math.pi)
        rot_about(arm, k, th)
        tip = (k[0] - ARM * math.cos(th), k[1] - ARM * math.sin(th), ZC)
        end = (RACK_X, sy * 1.5 + s, ZC)
        P.add(bar(end, tip, 0.13, "gris"), "gris", 3)
    # etapa 4: pinon, columna y volante
    px = RACK_X + 0.55 + 0.1 + 0.5
    ph = -s / 0.5  # giro del pinon (rad): la cremallera se desplaza s
    pin_g = P.add(gear(8, "azul"), "azul", 4); put(pin_g, (px, 0, ZC), rz=ph + math.pi / 8)
    col = P.add(axle(4.2), "eje", 4); put(col, (px, 0, 5.0))
    sw = P.add(volante(), "rojo", 4); put(sw, (px, 0, 7.2), rz=ph)
    if motor:
        # etapa 5: motor con reduccion 8 -> 24 hacia el eje trasero
        mb = P.add(box(2.4, 2.2, 1.6, "motor"), "motor", 5); put(mb, (4.6, 0, 0))
        mx = P.add(axle(2.0), "eje", 5); put(mx, (3.0, 0.9, 0), rx=math.pi / 2)
        g8 = P.add(gear(8, "azul"), "azul", 5); put(g8, (3.0, 1.4, 0), rx=math.pi / 2)
        g24 = P.add(gear(24, "amarillo"), "amarillo", 5); put(g24, (1.0, 1.4, 0), rx=math.pi / 2, ry=0)
    return P


def volante():
    bpy.ops.mesh.primitive_torus_add(major_radius=1.05, minor_radius=0.13, major_segments=36, minor_segments=12)
    t = bpy.context.active_object
    t.data.materials.append(M("rojo"))
    sp = []
    for i in range(3):
        b = bar((0, 0, 0), (math.cos(i * 2.0944 + 1.57) * 1.0, math.sin(i * 2.0944 + 1.57) * 1.0, 0), 0.08, "rojo")
        sp.append(b)
    for q in t.data.polygons:
        q.use_smooth = True
    return join([t] + sp)


def cam_top(tx, ty, scale, tilt=18.0, d=60.0):
    """Camara ortografica casi cenital con el frente del coche (+X) hacia arriba y la izquierda del coche (+Y) a la izquierda de la imagen."""
    s_ = bpy.context.scene
    cam = bpy.data.objects.new("Cam", bpy.data.cameras.new("Cam"))
    s_.collection.objects.link(cam)
    s_.camera = cam
    cam.data.type = "ORTHO"
    cam.data.ortho_scale = scale
    cam.data.clip_end = 400
    cam.matrix_world = Matrix.Translation((tx, ty, 0)) @ Matrix.Rotation(-math.pi / 2, 4, "Z") @ Matrix.Rotation(math.radians(tilt), 4, "X") @ Matrix.Translation((0, 0, d))
    return cam


def car_cam(tx=4.8, ty=0.0, h=0, back=0, lens=0):
    cam_top(tx, ty, 24.0, 16.0)


def turn_geometry(R=14.0):
    thL, thR = steer_angles(R)
    C = (XR, R)
    return thL, thR, C


# ---- imagenes de la direccion

DIR_MAP = None


@image("direccion", "v_dir_s1")
def v_dir_s1():
    P = build_car(motor=False); P.show(1); car_cam(); render(f"{OUT}/v_dir_s1.webp", W, H)


@image("direccion", "v_dir_s2")
def v_dir_s2():
    P = build_car(motor=False); P.show(2); car_cam(); render(f"{OUT}/v_dir_s2.webp", W, H)


@image("direccion", "v_dir_s3")
def v_dir_s3():
    P = build_car(motor=False); P.show(3); car_cam(); render(f"{OUT}/v_dir_s3.webp", W, H)


@image("direccion", "v_dir_s4")
def v_dir_s4():
    P = build_car(motor=False); P.show(4); car_cam(); render(f"{OUT}/v_dir_s4.webp", W, H)


def _axis_line(p, th, length, color, z=0.15, r=0.05):
    """Recta del eje de una rueda (perpendicular a su avance) desde p hacia el centro de giro."""
    d = (-math.sin(th), math.cos(th))
    return bar((p[0], p[1], z), (p[0] + d[0] * length, p[1] + d[1] * length, z), r, color)


def circles_scene(thL, thR, C, color_lines, rear=True, arcs=True):
    kl, kr = (XF, YK), (XF, -YK)
    for k, th in ((kl, thL), (kr, thR)):
        L = math.hypot(C[0] - k[0], C[1] - k[1]) if color_lines == "bien" else 17.0
        _axis_line(k, th, L, color_lines if color_lines != "bien" else "cian")
    if rear:
        bar((XR, 0.0, 0.15), (XR, C[1], 0.15), 0.05, "cian")
    if arcs:
        for (px, py) in ((XF, YK), (XF, -YK), (XR, YK + 0.0), (XR, -YK)):
            rr = math.hypot(px - C[0], py - C[1])
            a = math.atan2(py - C[1], px - C[0])
            ring_arc(C, rr, a - 0.05, a + 0.45, "acento" if py > 0 else "cian", r=0.06, z=0.12)


@image("direccion", "v_dir_hero")
def v_dir_hero():
    thL, thR, C = turn_geometry(14.0)
    P = build_car(thL, thR); P.color_all()
    circles_scene(thL, thR, C, "bien")
    sphere((C[0], C[1], 0.3), 0.35, "bien")
    cam_top(5.0, 5.5, 25.0, 12.0)
    render(f"{OUT}/v_dir_hero.webp", W, H)


@image("direccion", "v_dir_bien")
def v_dir_bien():
    thL, thR, C = turn_geometry(14.0)
    P = build_car(thL, thR); P.color_all()
    circles_scene(thL, thR, C, "bien", arcs=False)
    sphere((C[0], C[1], 0.3), 0.4, "bien")
    cam_top(5.0, 5.5, 25.0, 12.0)
    render(f"{OUT}/v_dir_bien.webp", W, H)


@image("direccion", "v_dir_mal")
def v_dir_mal():
    th = math.radians(30)
    P = build_car(th, th); P.color_all()
    for k in ((XF, YK), (XF, -YK)):
        _axis_line(k, th, 17.0, "mal")
    bar((XR, 0.0, 0.15), (XR, 18, 0.15), 0.05, "gris")
    # donde corta cada recta a la linea del eje trasero (x = 1)
    for sy in (1, -1):
        t = (XF - XR) / math.sin(th)
        sphere((XR, sy * YK + t * math.cos(th), 0.3), 0.4, "mal")
    cam_top(5.0, 5.5, 25.0, 12.0)
    render(f"{OUT}/v_dir_mal.webp", W, H)


# ------------------------------------------------------------------ diferencial

def bevel_gear(rbig, rsmall, h, color, teeth=12):
    """Engranaje conico aproximado: tronco de cono con dientes en el borde ancho. Eje Z, base ancha en z=0, punta estrecha en z=h."""
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=32, radius1=rbig, radius2=rsmall, depth=h,
                          matrix=Matrix.Translation((0, 0, h / 2)))
    for i in range(teeth):
        a = 2 * math.pi * i / teeth
        m = Matrix.Translation((rbig * math.cos(a), rbig * math.sin(a), 0.12)) @ Matrix.Rotation(a, 4, "Z") @ Matrix.Diagonal((0.2, rbig * 0.32, 0.26, 1))
        bmesh.ops.create_cube(bm, size=1.0, matrix=m)
    return _to_obj("conico", bm, color, smooth_sides=False, bevel=0.015)


def gear_ring(t, hole_r, color, thick=0.5):
    o = _to_obj(f"corona{t}", _prism(_gear_pts(t), thick), color, smooth_sides=False, bevel=0.012)
    _cut(o, [_cyl_cutter([(0, 0)], r=hole_r, depth=3.0)])
    return o


def build_diff(spin=0.0):
    """Eje con diferencial. Semiejes a lo largo de Y, corona (24) con el centro hueco, satelites y planetarios."""
    P = Parts()
    for sy in (-1, 1):
        ax = P.add(axle(5.0), "eje", 1); plane(ax, 0, 0, -sy * 3.1)
        w = P.add(wheel(), None, 1); plane(w, 0, 0, -sy * 5.0)
    ring = P.add(gear_ring(24, 1.12, "amarillo"), "amarillo", 2); plane(ring, 0, 0, 0, rot=spin)
    pin_x = P.add(axle(2.7), "eje", 3); put(pin_x, (0, 0, 0), ry=math.pi / 2)
    for sy in (-1, 1):
        sg = P.add(bevel_gear(0.62, 0.3, 0.7, "azul"), "azul", 3)
        sg.matrix_world = Matrix.Translation((0, sy * 0.18, 0)) @ Matrix.Rotation(-sy * math.pi / 2, 4, "X")
    for sx_ in (-1, 1):
        sp = P.add(bevel_gear(0.36, 0.2, 0.45, "rojo", teeth=8), "rojo", 3)
        sp.matrix_world = Matrix.Translation((sx_ * 0.62, 0, 0)) @ Matrix.Rotation(sx_ * math.pi / 2, 4, "Y")
    # entrada: pinon de 8 dientes a (24 + 8) / 16 = 2 agujeros, con manivela
    ph = math.pi + math.pi / 8
    g8 = P.add(gear(8, "verde"), "verde", 4); plane(g8, 2.0, 0, 0, rot=ph)
    ax8 = P.add(axle(2.4), "eje", 4); plane(ax8, 2.0, 0, 0)
    cr = P.add(beam(3, "rojo"), "rojo", 4); plane(cr, 2.0, 0, 1.0, rot=-0.6)
    hx, hz = 2.0 + 2 * math.cos(-0.6), 2 * math.sin(-0.6)
    hp = P.add(pin(1.2), "oscuro", 4); plane(hp, hx, hz, 1.3)
    return P


def diff_cam():
    camera((-9.5, -11.5, 8.5), (0.5, 0, 0.2), 42)


@image("diferencial", "v_dif_s1")
def v_dif_s1():
    P = build_diff(); P.show(1); diff_cam(); render(f"{OUT}/v_dif_s1.webp", W, H)


@image("diferencial", "v_dif_s2")
def v_dif_s2():
    P = build_diff(); P.show(2); diff_cam(); render(f"{OUT}/v_dif_s2.webp", W, H)


@image("diferencial", "v_dif_s3")
def v_dif_s3():
    P = build_diff(); P.show(3); diff_cam(); render(f"{OUT}/v_dif_s3.webp", W, H)


@image("diferencial", "v_dif_s4")
def v_dif_s4():
    P = build_diff(); P.show(4); diff_cam(); render(f"{OUT}/v_dif_s4.webp", W, H)


@image("diferencial", "v_dif_hero")
def v_dif_hero():
    P = build_diff(); P.color_all()
    arc_arrow((2.0, -2.2, 0), 1.0, math.radians(120), math.radians(30), "acento", r=0.07)
    arc_arrow((0, 5.9, 0), 1.65, math.radians(110), math.radians(40), "cian", r=0.07)
    arc_arrow((0, -5.9, 0), 1.65, math.radians(120), math.radians(-20), "cian", r=0.07)
    diff_cam(); render(f"{OUT}/v_dif_hero.webp", W, H)


@image("diferencial", "v_dif_hielo")
def v_dif_hielo():
    P = build_diff(); P.color_all()
    plate_l = box(5.2, 3.4, 0.25, "hielo", bevel=0.05); plate_l.location = (0, 4.9, -1.42)
    plate_r = box(5.2, 3.4, 0.25, "asfalto", bevel=0.05); plate_r.location = (0, -4.9, -1.42)
    floor(-1.55)
    arc_arrow((0, 5.9, 0), 1.65, math.radians(150), math.radians(-60), "acento", r=0.08)
    sphere((0, -5.95, 0.0), 0.35, "mal")
    diff_cam(); render(f"{OUT}/v_dif_hielo.webp", W, H)


def _rear_arcs(kind):
    thL, thR, C = turn_geometry(14.0)
    P = build_car(thL, thR); P.color_all()
    base = -math.pi / 2
    for sy in (1, -1):
        rr = abs(C[1] - sy * YW)
        if kind == "mal":
            span, col = 7.0 / rr, "mal"
        else:
            span, col = 0.5, ("bien" if kind == "bien" else ("acento" if sy > 0 else "cian"))
        ring_arc(C, rr, base - 0.02, base - 0.02 + span, col, r=0.11, z=0.2)
    sphere((C[0], C[1], 0.3), 0.35, "bien")
    cam_top(5.0, 5.5, 25.0, 12.0)


@image("diferencial", "v_dif_curva")
def v_dif_curva():
    _rear_arcs("curva"); render(f"{OUT}/v_dif_curva.webp", W, H)


@image("diferencial", "v_dif_mal")
def v_dif_mal():
    _rear_arcs("mal"); render(f"{OUT}/v_dif_mal.webp", W, H)


@image("diferencial", "v_dif_bien")
def v_dif_bien():
    _rear_arcs("bien"); render(f"{OUT}/v_dif_bien.webp", W, H)


# ------------------------------------------------------------------ suspension y vuelco

PIV = (0.0, 1.0)
ARM_L = 4.0


def build_susp(arm_deg=-10.0):
    P = Parts()
    a = math.radians(arm_deg)
    hub = (PIV[0] + ARM_L * math.cos(a), PIV[1] + ARM_L * math.sin(a))
    ch = P.add(beam(9, "gris"), "gris", 1); plane(ch, -1.0, 4.0, 0)
    br = P.add(beam(4, "gris"), "gris", 1); plane(br, 0.0, 4.0, 1.0, rot=-math.pi / 2)
    pv = P.add(pin(2.6), "oscuro", 2); plane(pv, PIV[0], PIV[1], 1.0)
    arm = P.add(beam(5, "azul"), "azul", 2); plane(arm, PIV[0], PIV[1], 1.6, rot=a)
    wh = P.add(wheel(), None, 3); plane(wh, hub[0], hub[1], 0.3)
    hp = P.add(pin(1.6), "oscuro", 3); plane(hp, hub[0], hub[1], 1.6)
    ax_ = 3.0
    zb = PIV[1] + math.tan(a) * (ax_ - PIV[0]) + 0.35
    top = 3.45
    sp = P.add(spring((ax_, -2.4, zb), (ax_, -2.4, top), rad=0.45, turns=6, r=0.07), "muelle", 4)
    dm = P.add(cyl(0.2, (top - zb) * 0.55, "oscuro"), "oscuro", 4)
    dm.matrix_world = Matrix.Translation((ax_, -2.4, zb + (top - zb) * 0.55 / 2))
    rod = P.add(cyl(0.1, (top - zb) * 0.55, "eje"), "eje", 4)
    rod.matrix_world = Matrix.Translation((ax_, -2.4, top - (top - zb) * 0.55 / 2))
    return P, hub


def susp_cam():
    camera((3.5, -17, 5.0), (2.5, 0, 1.6), 45)


def _susp(k, name):
    P, hub = build_susp(); floor(hub[1] - 1.3); P.show(k); susp_cam(); render(f"{OUT}/{name}.webp", W, H)


@image("suspension", "v_susp_s1")
def v_susp_s1():
    _susp(1, "v_susp_s1")


@image("suspension", "v_susp_s2")
def v_susp_s2():
    _susp(2, "v_susp_s2")


@image("suspension", "v_susp_s3")
def v_susp_s3():
    _susp(3, "v_susp_s3")


@image("suspension", "v_susp_s4")
def v_susp_s4():
    _susp(4, "v_susp_s4")


@image("suspension", "v_susp_hero")
def v_susp_hero():
    P, hub = build_susp(); P.color_all(); floor(hub[1] - 1.3)
    arrow((hub[0], -2.6, hub[1] - 2.9), (hub[0], -2.6, hub[1] - 1.5), "acento", r=0.08)
    arrow((hub[0] + 2.5, -2.6, hub[1] - 0.2), (hub[0] + 2.5, -2.6, hub[1] + 1.4), "cian", r=0.08)
    susp_cam(); render(f"{OUT}/v_susp_hero.webp", W, H)


def car_front(cx, w, h_cg, body_h, ok):
    """Coche visto de frente (mira hacia +Y). El lado +X es el que baja al inclinar."""
    objs = []
    wr = 0.9
    for sx_ in (-1, 1):
        wo = cyl(wr, 0.8, "neum", bevel=0.05)
        wo.matrix_world = Matrix.Translation((cx + sx_ * w / 2, 0, wr)) @ Matrix.Rotation(math.pi / 2, 4, "Y")
        objs.append(wo)
    body = box(w + 1.0, 4.2, body_h, "azul" if ok else "rojo", bevel=0.1)
    body.location = (cx, 0, wr * 2 - 0.6 + body_h / 2)
    objs.append(body)
    objs.append(sphere((cx, -2.3, h_cg), 0.34, "amarillo"))
    slab = box(w + 7.0, 6.0, 0.4, "asfalto", bevel=0.05); slab.location = (cx, 0, -0.2); objs.append(slab)
    return objs, (cx + w / 2, 0.0)


def tilt_scene(cx, w, h_cg, body_h, deg, ok):
    objs, piv = car_front(cx, w, h_cg, body_h, ok)
    group_rotate(objs, piv, math.radians(deg))
    phi = math.radians(deg)
    dx, dz = cx - piv[0], h_cg
    gx = piv[0] + dx * math.cos(phi) + dz * math.sin(phi)
    gz = -dx * math.sin(phi) + dz * math.cos(phi)
    surf = -(gx - piv[0]) * math.tan(phi)
    bar((gx, -2.3, gz), (gx, -2.3, surf + 0.02), 0.07, "bien" if ok else "mal")
    for sx_ in (-1, 1):
        px = piv[0] + (sx_ * w / 2 - w / 2) * math.cos(phi)
        pz = -(sx_ * w / 2 - w / 2) * math.sin(phi)
        sphere((px, -2.3, pz + 0.05), 0.2, "masa")


def vuelco_cam():
    camera((2.0, -22.0, 8.5), (0.0, 0, 3.0), 45)


@image("suspension", "v_vuelco_mal")
def v_vuelco_mal():
    floor(-1.0); tilt_scene(0.0, 3.4, 3.6, 4.2, 30, False); vuelco_cam(); render(f"{OUT}/v_vuelco_mal.webp", W, H)


@image("suspension", "v_vuelco_bien")
def v_vuelco_bien():
    floor(-1.0); tilt_scene(0.0, 6.6, 1.7, 1.6, 30, True); vuelco_cam(); render(f"{OUT}/v_vuelco_bien.webp", W, H)


@image("suspension", "v_vuelco")
def v_vuelco():
    floor(-1.0)
    tilt_scene(-6.0, 3.4, 3.6, 4.2, 30, False)
    tilt_scene(6.5, 6.6, 1.7, 1.6, 30, True)
    camera((1.0, -30.0, 9.0), (0.0, 0, 2.2), 45)
    render(f"{OUT}/v_vuelco.webp", W, H)


# ------------------------------------------------------------------ diagnostico

DMAP = {1: 1, 2: 2, 3: 3, 4: 3, 5: 4}


def _diag(k, name):
    P = build_car(motor=True); P.show(k, DMAP); car_cam(); render(f"{OUT}/{name}.webp", W, H)


@image("diag", "v_diag_s1")
def v_diag_s1():
    _diag(1, "v_diag_s1")


@image("diag", "v_diag_s2")
def v_diag_s2():
    _diag(2, "v_diag_s2")


@image("diag", "v_diag_s3")
def v_diag_s3():
    _diag(3, "v_diag_s3")


@image("diag", "v_diag_s4")
def v_diag_s4():
    _diag(4, "v_diag_s4")


@image("diag", "v_diag_hero")
def v_diag_hero():
    P = build_car(motor=True); P.color_all(); car_cam(); render(f"{OUT}/v_diag_hero.webp", W, H)


def _peso(front):
    P = build_car(motor=True); P.color_all()
    m, h = weight(2, "masa", w=1.5)
    m.location = ((XF if front else XR + 1.6), 0, 5.15)
    x = XF if front else XR
    col = "mal" if front else "bien"
    for sy in (-1, 1):
        arrow((x, sy * YW, 4.6), (x, sy * YW, 1.6), col, r=0.09, head=0.38)
    cam_top(5.0, 0.0, 24.0, 30.0)


@image("diag", "v_diag_peso_mal")
def v_diag_peso_mal():
    _peso(True); render(f"{OUT}/v_diag_peso_mal.webp", W, H)


@image("diag", "v_diag_peso_bien")
def v_diag_peso_bien():
    _peso(False); render(f"{OUT}/v_diag_peso_bien.webp", W, H)


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
