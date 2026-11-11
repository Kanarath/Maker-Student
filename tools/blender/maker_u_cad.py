"""
Maker Student - imagenes de la unidad "CAD e impresion 3D".

Uso (desde la raiz del repo):
  blender -b --factory-startup --python tools/blender/maker_u_cad.py -- [modelado|fdm|diseno|all] [nombre_imagen ...]

Cada imagen es una funcion que construye la escena, la renderiza a
public/assets/img/cad/<nombre>.webp y la limpia. Aqui no hay piezas tipo Technic:
son piezas dibujadas (placas, capas, impresora generica) en el mismo estilo visual.
Las medidas son esquematicas y estan exageradas a proposito (holguras, capas)
para que se vean; el texto de la leccion dice las cifras reales.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import maker_lib as ML
from maker_lib import *

OUT = os.path.join(ROOT, "public", "assets", "img", "cad")
args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else ["all"]
GROUP = args[0] if args else "all"
ONLY = set(args[1:])
W, H = 1280, 720
SAMPLES = int(os.environ.get("MAKER_SAMPLES", "40"))

COLORS["amarillo2"] = "#f9d27a"
COLORS["azul2"] = "#6fa8ee"

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
    for coll in (bpy.data.curves, bpy.data.cameras, bpy.data.meshes):
        for d in list(coll):
            if d.users == 0:
                coll.remove(d)


# ---------------------------------------------------------------- utilidades

def rrect(w, h, r, n=7, cx=0.0, cy=0.0, corners=(1, 1, 1, 1)):
    """Rectangulo redondeado centrado (lista de puntos). corners: radio activo en (+x+y, -x+y, -x-y, +x-y)."""
    pts = []
    hx, hy = w / 2, h / 2
    centers = [(hx, hy, 0), (-hx, hy, 90), (-hx, -hy, 180), (hx, -hy, 270)]
    for (px, py, a0), on in zip(centers, corners):
        rr = r if on else 0.0
        sx = 1 if px > 0 else -1
        sy = 1 if py > 0 else -1
        if rr == 0:
            pts.append((cx + px, cy + py))
            continue
        for i in range(n + 1):
            a = math.radians(a0 + 90 * i / n)
            pts.append((cx + px - sx * rr + rr * math.cos(a), cy + py - sy * rr + rr * math.sin(a)))
    return pts


def solid(points, t, color, z=0.0, bevel=0.025):
    """Prisma de espesor t apoyado en z (la base en z)."""
    o = ML._to_obj("solido", ML._prism(points, t), color, smooth_sides=True, bevel=bevel)
    o.location = (0, 0, z + t / 2)
    return o


def hole(o, x, y, r):
    ML._cut(o, [ML._cyl_cutter([(x, y)], r=r, depth=6.0)])


def box(sx, sy, sz, loc, color, bevel=0.02):
    """Caja de tamano (sx, sy, sz) con su CENTRO en loc."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Diagonal((sx, sy, sz, 1)))
    o = ML._to_obj("caja", bm, color, smooth_sides=False, bevel=bevel)
    o.location = loc
    return o


def cyl(r, depth, loc, color, seg=40, bevel=0.015, rot=(0, 0, 0)):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r, radius2=r, depth=depth)
    o = ML._to_obj("cil", bm, color, bevel=bevel)
    o.location = loc
    o.rotation_euler = rot
    return o


def cone(r1, r2, depth, loc, color, seg=32):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r1, radius2=r2, depth=depth)
    o = ML._to_obj("cono", bm, color, bevel=0.0)
    o.location = loc
    return o


def line_loop(points, z, color="cian", r=0.028):
    pts = [(x, y, z) for x, y in points] + [(points[0][0], points[0][1], z)]
    return rope(pts, color, r)


def circle_pts(cx, cy, r, n=40):
    return [(cx + r * math.cos(2 * math.pi * i / n), cy + r * math.sin(2 * math.pi * i / n)) for i in range(n)]


def dbl_arrow(a, b, color="acento", r=0.03, head=0.2):
    mid = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2)
    arrow(mid, a, color, r=r, head=head)
    arrow(mid, b, color, r=r, head=head)


def cam_plate(dist=1.0, target=(0, 0, 0.3), loc=(3.2, -7.2, 5.6), lens=50):
    camera(tuple(c * dist if i < 2 else c for i, c in enumerate(loc)), target, lens)


# ---------------------------------------------------------------- MODELADO

PW, PH, PR = 4.0, 2.4, 0.35  # placa de 40 x 24 mm (1 unidad = 10 mm)
HX, HR = -1.0, 0.30          # agujero de 6 mm de diametro


def plate(color="amarillo", z=0.0, t=0.5, with_hole=True, r=PR):
    o = solid(rrect(PW, PH, r), t, color, z)
    if with_hole:
        hole(o, HX, 0, HR)
    return o


def sketch(z=0.02, color="cian", dims=True, corners_r=PR):
    line_loop(rrect(PW, PH, corners_r), z, color)
    line_loop(circle_pts(HX, 0, HR), z, color, r=0.024)
    if dims:
        zz = z + 0.01
        dbl_arrow((-PW / 2, -PH / 2 - 0.55, zz), (PW / 2, -PH / 2 - 0.55, zz), "acento")
        dbl_arrow((PW / 2 + 0.55, -PH / 2, zz), (PW / 2 + 0.55, PH / 2, zz), "acento")
        for x in (-PW / 2, PW / 2):
            line_loop([(x, -PH / 2 - 0.15), (x, -PH / 2 - 0.75)], zz, "acento", r=0.012)
        for y in (-PH / 2, PH / 2):
            line_loop([(PW / 2 + 0.15, y), (PW / 2 + 0.75, y)], zz, "acento", r=0.012)


@image("modelado", "c_s1")
def c_s1():
    sketch()
    cam_plate(target=(0.2, -0.2, 0))
    render(f"{OUT}/c_s1.webp", W, H)


@image("modelado", "c_s2")
def c_s2():
    # boceto en gris (lo anterior) y el solido en color, subiendo desde el
    z0 = 1.3
    line_loop(rrect(PW, PH, PR), 0.02, "ghost")
    line_loop(circle_pts(HX, 0, HR), 0.02, "ghost", r=0.024)
    plate("amarillo", z=z0)
    for sx in (-1, 1):
        for sy in (-1, 1):
            rope([(sx * (PW / 2 - PR * 0.3), sy * (PH / 2 - PR * 0.3), 0.02), (sx * (PW / 2 - PR * 0.3), sy * (PH / 2 - PR * 0.3), z0)], "ghost", 0.012)
    arrow((PW / 2 + 0.7, 0, 0.1), (PW / 2 + 0.7, 0, z0 + 0.2), "acento", r=0.06, head=0.3)
    camera((4.2, -8.6, 4.8), (0.3, 0, 0.9), 50)
    render(f"{OUT}/c_s2.webp", W, H)


@image("modelado", "c_s3")
def c_s3():
    plate("amarillo")
    # marcas: el agujero y una esquina redondeada
    line_loop(circle_pts(HX, 0, HR + 0.16), 0.55, "cian", r=0.03)
    arrow((HX, 0.0, 1.6), (HX, 0.0, 0.75), "cian", r=0.05, head=0.3)
    arrow((PW / 2 - 0.3, PH / 2 - 0.3, 1.6), (PW / 2 - 0.3, PH / 2 - 0.3, 0.75), "acento", r=0.05, head=0.3)
    cam_plate(target=(0.1, 0, 0.2), loc=(3.0, -6.8, 5.2))
    render(f"{OUT}/c_s3.webp", W, H)


@image("modelado", "c_stl")
def c_stl():
    # el STL es una superficie hecha de triangulos
    o = plate("oscuro", t=0.5, r=0.4)
    w = o.copy()
    w.data = o.data.copy()
    bpy.context.scene.collection.objects.link(w)
    w.modifiers.clear()
    tri = w.modifiers.new("tri", "TRIANGULATE")
    wf = w.modifiers.new("wire", "WIREFRAME")
    wf.thickness = 0.018
    wf.use_replace = True
    set_mat(w, "cian")
    cam_plate(target=(0.1, 0, 0.2), loc=(3.0, -6.8, 5.2))
    render(f"{OUT}/c_stl.webp", W, H)


@image("modelado", "c_hero")
def c_hero():
    # boceto plano a la izquierda, pieza a la derecha
    ox = -3.3
    for (x, y, rr) in ((ox, 0, None),):
        pass
    pts = [(px + ox, py) for px, py in rrect(PW, PH, PR)]
    line_loop(pts, 0.02, "cian")
    line_loop(circle_pts(HX + ox, 0, HR), 0.02, "cian", r=0.024)
    dbl_arrow((ox - PW / 2, -PH / 2 - 0.5, 0.03), (ox + PW / 2, -PH / 2 - 0.5, 0.03), "acento", r=0.025)
    o = solid(rrect(PW, PH, PR, cx=3.3), 0.5, "amarillo")
    hole(o, HX + 3.3, 0, HR)
    arrow((-0.85, 0, 0.35), (0.95, 0, 0.35), "acento", r=0.07, head=0.34)
    camera((0.8, -15.5, 10.0), (0.0, 0, 0.0), 50)
    render(f"{OUT}/c_hero.webp", W, H)


# ---------------------------------------------------------------- FDM

LAYER_COLS = ("amarillo", "amarillo2")


def vase_radius(z, top):
    t = z / top
    return 0.55 + 0.55 * math.sin(math.pi * t * 0.9 + 0.2) + 0.25 * t * t


def build_vase(n=22, lh=0.16, hot=True, x=0.0, y=0.0, gap=0.012):
    top = n * lh
    objs = []
    for i in range(n):
        r = vase_radius(i * lh + lh / 2, top)
        col = LAYER_COLS[i % 2]
        if hot and i == n - 1:
            col = "acento"
        objs.append(cyl(r, lh - gap, (x, y, i * lh + lh / 2), col, seg=48, bevel=0.0))
    return objs, top


@image("fdm", "c_capas")
def c_capas():
    build_vase(n=24, lh=0.19)
    # una capa recien depositada y una flecha que baja hasta ella
    camera((6.5, -15.0, 6.5), (0, 0, 2.2), 50)
    render(f"{OUT}/c_capas.webp", W, H)


@image("fdm", "c_impresora")
def c_impresora():
    # impresora FDM generica y simplificada
    base = box(6.0, 5.0, 0.8, (0, 0, 0.4), "oscuro", 0.06)
    cama = box(3.8, 3.4, 0.16, (0, 0, 1.0), "azul", 0.03)
    for sx in (-1, 1):
        box(0.5, 0.6, 5.6, (sx * 2.7, 1.4, 3.6), "gris", 0.05)
    box(5.9, 0.6, 0.5, (0, 1.4, 6.4), "gris", 0.05)  # travesano superior
    box(5.4, 0.45, 0.45, (0, 0.2, 4.35), "rojo", 0.05)  # portico horizontal
    carro = box(1.0, 0.8, 0.7, (0.5, -0.25, 4.35), "amarillo", 0.05)
    cone(0.28, 0.06, 0.55, (0.5, -0.25, 3.72), "acento")  # boquilla
    # carrete y filamento
    cyl(0.9, 0.55, (0, 1.7, 7.3), "verde", seg=48, rot=(math.pi / 2, 0, 0))
    cyl(0.25, 0.7, (0, 1.7, 7.3), "oscuro", seg=24, rot=(math.pi / 2, 0, 0))
    rope([(0.5, 1.2, 6.9), (0.5, 0.4, 5.8), (0.5, -0.25, 4.7)], "cuerda", 0.035)
    # pieza a medio imprimir sobre la cama
    n_done = 14
    lh = 0.16
    for i in range(n_done):
        r = 0.5 + 0.22 * math.sin(i * 0.35)
        col = LAYER_COLS[i % 2] if i < n_done - 1 else "acento"
        cyl(r, lh - 0.012, (0.5, -0.25, 1.08 + i * lh + lh / 2), col, seg=40, bevel=0.0)
    camera((7.5, -20.0, 10.5), (0, 0.4, 4.3), 50)
    render(f"{OUT}/c_impresora.webp", W, H)


def stack_overhang(angle, n=7, h=0.32, w=1.5, d=1.3, supports=False, mark_air=False):
    """Pared inclinada hecha de capas: cada capa se desplaza o = h * tan(angle) respecto a la anterior."""
    o = h * math.tan(math.radians(angle))
    box(9.0, 2.2, 0.16, (3.0, 0, -0.08), "azul", 0.03)  # cama
    for i in range(n):
        x0 = i * o
        z0 = i * h
        col = LAYER_COLS[i % 2]
        if mark_air and i > 0:
            sup = max(0.0, w - o)
            box(sup, d, h - 0.012, (x0 + sup / 2 - 0.0 + (0.0), 0, z0 + h / 2), col, 0.0)
            # parte en el aire (la que sobresale mas que la capa anterior)
            box(min(o, w), d, h - 0.012, (x0 + sup + min(o, w) / 2 + 0.0, 0, z0 + h / 2), "mal", 0.0)
        else:
            box(w, d, h - 0.012, (x0 + w / 2, 0, z0 + h / 2), col, 0.0)
    if supports:
        xr = w
        rib = 0.09
        x = xr + 0.12
        top_x = (n - 1) * o + w
        while x < top_x:
            # primera capa cuyo borde derecho supera x
            i = 0
            while i * o + w < x:
                i += 1
            box(rib, d * 0.9, i * h - 0.01, (x, 0, i * h / 2), "azul2", 0.0)
            x += 0.24
    return o


def cam_front(cx=1.6, cz=1.2, dist=14.5):
    camera((cx - 3.2, -dist, cz + 3.4), (cx, 0, cz), 50)


@image("fdm", "c_vol_ok")
def c_vol_ok():
    stack_overhang(30, n=7)
    cam_front()
    render(f"{OUT}/c_vol_ok.webp", W, H)


@image("fdm", "c_vol_limite")
def c_vol_limite():
    stack_overhang(45, n=7)
    cam_front(cx=2.0)
    render(f"{OUT}/c_vol_limite.webp", W, H)


@image("fdm", "c_vol_mal")
def c_vol_mal():
    stack_overhang(70, n=7, mark_air=True)
    cam_front(cx=3.0)
    render(f"{OUT}/c_vol_mal.webp", W, H)


@image("fdm", "c_vol_soporte")
def c_vol_soporte():
    stack_overhang(70, n=7, supports=True)
    cam_front(cx=3.0)
    render(f"{OUT}/c_vol_soporte.webp", W, H)


def layered_bar_standing(tilt_deg=0.0, n=18, h=0.33, w=0.9):
    box(2.6, 2.2, 0.2, (0, 0, -0.1), "azul", 0.03)
    objs = []
    for i in range(n):
        col = LAYER_COLS[i % 2]
        objs.append((i, box(w, w, h - 0.012, (0, 0, i * h + h / 2), col, 0.0)))
    return objs, h


@image("fdm", "c_orient_mal")
def c_orient_mal():
    objs, h = layered_bar_standing()
    k = 3  # capa por donde se abre
    up = [o for i, o in objs if i >= k]
    for o in up:
        o.location.z += 0.0
    # gira lo que esta encima de la capa k alrededor de su borde +X
    bpy.context.view_layer.update()
    group_rotate(up, (0.45, k * h), math.radians(5))
    # hueco oscuro visible en la rotura (lado -X)
    arrow((-2.4, 0, 5.2), (-0.7, 0, 5.2), "acento", r=0.09, head=0.4)
    arrow((-0.9, -1.0, 0.95), (-0.5, -0.5, k * h + 0.02), "mal", r=0.04, head=0.22)
    camera((4.0, -18.0, 6.6), (0, 0, 3.0), 50)
    render(f"{OUT}/c_orient_mal.webp", W, H)


@image("fdm", "c_orient_bien")
def c_orient_bien():
    # barra tumbada: sus capas (planos horizontales) corren a lo largo de la barra
    box(2.6, 2.2, 0.2, (0, 0, -0.1), "azul", 0.03)
    L, w = 5.2, 0.9
    h = 0.33
    for i in range(3):
        box(L, w, h - 0.012, (L / 2 - 1.2, 0, i * h + h / 2), LAYER_COLS[i % 2], 0.0)
    box(0.8, 1.6, 1.4, (-1.55, 0, 0.7), "gris", 0.04)  # sujecion
    arrow((L - 1.5, 0, 3.0), (L - 1.5, 0, 1.25), "acento", r=0.09, head=0.4)
    camera((3.6, -10.5, 3.6), (1.4, 0, 1.3), 50)
    render(f"{OUT}/c_orient_bien.webp", W, H)


# ---------------------------------------------------------------- DISENO PARA IMPRIMIR

def plate_sq(hole_r, size=3.0, t=0.5, color="azul"):
    o = solid(rrect(size, size, 0.2), t, color)
    hole(o, 0, 0, hole_r)
    return o


@image("diseno", "c_tol_mal")
def c_tol_mal():
    # el agujero sale mas pequeno que el diseno (circulo cian) y el eje no entra
    plate_sq(0.42)
    line_loop(circle_pts(0, 0, 0.5), 0.52, "cian", r=0.025)
    cyl(0.5, 1.8, (0, 0, 1.75), "amarillo", seg=48, bevel=0.02)
    arrow((1.1, 0, 3.1), (1.1, 0, 1.0), "mal", r=0.06, head=0.3)
    camera((3.8, -9.0, 5.6), (0, 0, 1.5), 50)
    render(f"{OUT}/c_tol_mal.webp", W, H)


@image("diseno", "c_tol_bien")
def c_tol_bien():
    # se dibuja el agujero con holgura: aun saliendo algo menor, el eje entra
    plate_sq(0.56)
    line_loop(circle_pts(0, 0, 0.62), 0.52, "cian", r=0.025)
    cyl(0.5, 1.8, (0, 0, 1.3), "amarillo", seg=48, bevel=0.02)
    arrow((1.1, 0, 3.0), (1.1, 0, 1.4), "bien", r=0.06, head=0.3)
    camera((3.8, -9.0, 5.6), (0, 0, 1.5), 50)
    render(f"{OUT}/c_tol_bien.webp", W, H)


def bracket_pts(fillet, t=0.7, L=3.0, n=10):
    """Perfil en L (x, z): brazo vertical a la izquierda, brazo horizontal abajo. fillet = radio de la esquina interior."""
    outer = [(0, 0), (L, 0), (L, t)]
    pts = [(0, 0), (L, 0), (L, t)]
    if fillet <= 0:
        pts += [(t, t), (t, L), (0, L)]
    else:
        cx, cz = t + fillet, t + fillet
        pts.append((cx, t))
        for i in range(1, n):
            a = -math.pi / 2 - (math.pi / 2) * i / n
            pts.append((cx + fillet * math.cos(a), cz + fillet * math.sin(a)))
        pts += [(t, cz), (t, L), (0, L)]
    return pts


def build_bracket(fillet):
    pts = bracket_pts(fillet)
    cx = sum(p[0] for p in pts) / len(pts)
    pts = [(x - 1.5, z) for x, z in pts]
    o = ML._to_obj("L", ML._prism(pts, 1.4), "amarillo", smooth_sides=False, bevel=0.02)
    o.rotation_euler = (math.pi / 2, 0, 0)
    return o


def _marker(x, y, z, color, r=0.17):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=(x, y, z), segments=20, ring_count=12)
    o = bpy.context.active_object
    o.data.materials.append(M(color))
    for p in o.data.polygons:
        p.use_smooth = True
    return o


@image("diseno", "c_filete_mal")
def c_filete_mal():
    build_bracket(0.0)
    # la fuerza intenta abrir la L: la esquina interior concentra la tension
    arrow((0.9, -1.0, 2.5), (-0.7, -1.0, 2.5), "acento", r=0.07, head=0.3)
    _marker(-1.5 + 0.7, -1.0, 0.7, "mal")
    camera((1.2, -9.2, 4.4), (-0.1, 0, 1.4), 50)
    render(f"{OUT}/c_filete_mal.webp", W, H)


@image("diseno", "c_filete_bien")
def c_filete_bien():
    build_bracket(0.55)
    arrow((0.9, -1.0, 2.5), (-0.7, -1.0, 2.5), "acento", r=0.07, head=0.3)
    _marker(-1.5 + 0.7 + 0.2, -1.0, 0.7 + 0.2, "bien")
    camera((1.2, -9.2, 4.4), (-0.1, 0, 1.4), 50)
    render(f"{OUT}/c_filete_bien.webp", W, H)


def wall_frame(cx, cy, size, wall, color, z=0.0, h=0.35):
    s = size
    box(s, wall, h, (cx, cy + s / 2 - wall / 2, z + h / 2), color, 0.0)
    box(s, wall, h, (cx, cy - s / 2 + wall / 2, z + h / 2), color, 0.0)
    box(wall, s - 2 * wall, h, (cx - s / 2 + wall / 2, cy, z + h / 2), color, 0.0)
    box(wall, s - 2 * wall, h, (cx + s / 2 - wall / 2, cy, z + h / 2), color, 0.0)


def infill_grid(cx, cy, size, inner, spacing, color="azul", h=0.35, bar=0.07):
    n = int(inner / spacing)
    for i in range(1, n + 1):
        off = -inner / 2 + i * spacing - spacing / 2
        if abs(off) < inner / 2:
            box(bar, inner, h, (cx + off, cy, h / 2), color, 0.0)
            box(inner, bar, h, (cx, cy + off, h / 2), color, 0.0)


@image("diseno", "c_paredes")
def c_paredes():
    # dos cuadrados con el mismo relleno: 2 paredes a la izquierda, 4 a la derecha
    S, wl = 3.0, 0.1
    for cx, nw in ((-2.0, 2), (2.0, 4)):
        box(S + 0.4, S + 0.4, 0.1, (cx, 0, -0.05), "oscuro", 0.0)
        for k in range(nw):
            wall_frame(cx, 0, S - 2 * k * wl, wl, "amarillo" if k % 2 == 0 else "amarillo2")
        inner = S - 2 * nw * wl
        infill_grid(cx, 0, S, inner, 0.55)
    camera((0, -3.2, 10.0), (0, 0, 0), 50)
    render(f"{OUT}/c_paredes.webp", W, H)


# ---------------------------------------------------------------- principal

def main():
    todo = [(n, g, f) for n, (g, f) in IMAGES.items() if (GROUP in ("all", g)) and (not ONLY or n in ONLY)]
    begin()
    for n, g, f in todo:
        f()
        purge()
    print("HECHO", len(todo))


main()
