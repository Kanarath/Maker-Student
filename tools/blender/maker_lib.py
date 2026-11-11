"""
Maker Student - biblioteca de piezas tipo Technic para Blender (sin interfaz).

Todo el modelo usa una unidad = un paso entre agujeros (8 mm en Technic real).
  - viga: agujeros cada 1,0 ; ancho 0,9 ; grosor 0,975 ; agujero de radio 0,30
  - engranaje de t dientes: radio primitivo t/16  (modulo 1 mm = 1/8 de unidad),
    asi que dos engranajes engranan a distancia (t1 + t2) / 16 unidades.
No son piezas de ninguna marca: son formas genericas con proporciones parecidas.

Las piezas se crean con su eje de agujero en Z y centradas en Z. Para montarlas
en un plano vertical (XZ, mirando desde -Y) se usa `plane()`: la capa k queda en
y = -k, asi las capas altas quedan delante de la camara.
"""
import bpy, bmesh, math, os
from mathutils import Vector, Matrix

PITCH = 1.0
BEAM_W = 0.9
BEAM_T = 0.975
HOLE_R = 0.30

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))


# ---------------------------------------------------------------- materiales

def _mat(name, color, metal=0.0, rough=0.45, emit=None, strength=0.0):
    m = bpy.data.materials.get(name)
    if m:
        return m
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Metallic"].default_value = metal
    b.inputs["Roughness"].default_value = rough
    if emit:
        b.inputs["Emission Color"].default_value = (*emit, 1)
        b.inputs["Emission Strength"].default_value = strength
    m.diffuse_color = (*color, 1)
    return m


def hexc(h):
    h = h.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    # a lineal (los colores de la web estan en sRGB)
    f = lambda c: ((c + 0.055) / 1.055) ** 2.4 if c > 0.04045 else c / 12.92
    return (f(r), f(g), f(b))


COLORS = {
    "amarillo": "#f2b230",
    "azul": "#2f7fe0",
    "rojo": "#d8382f",
    "gris": "#9aa3b5",
    "oscuro": "#2a2c35",
    "eje": "#d5d9e2",
    "masa": "#e9edf5",
    "cuerda": "#f4eedd",
    "verde": "#37b26c",
}


def _floor_mat():
    m = bpy.data.materials.get("suelo")
    if m:
        return m
    m = bpy.data.materials.new("suelo")
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    b.inputs["Roughness"].default_value = 0.7
    try:
        b.inputs["Specular IOR Level"].default_value = 0.0
    except Exception:
        pass
    tc = nt.nodes.new("ShaderNodeTexCoord")
    ln = nt.nodes.new("ShaderNodeVectorMath"); ln.operation = "LENGTH"
    mr = nt.nodes.new("ShaderNodeMapRange")
    mr.inputs["From Min"].default_value = 3.0
    mr.inputs["From Max"].default_value = 26.0
    mr.inputs["To Min"].default_value = 1.0
    mr.inputs["To Max"].default_value = 0.0
    mr.clamp = True
    mx = nt.nodes.new("ShaderNodeMix"); mx.data_type = "RGBA"
    mx.inputs["A"].default_value = (0.0, 0.0, 0.0, 1)
    mx.inputs["B"].default_value = (*hexc("#232739"), 1)
    nt.links.new(tc.outputs["Object"], ln.inputs[0])
    nt.links.new(ln.outputs["Value"], mr.inputs["Value"])
    nt.links.new(mr.outputs["Result"], mx.inputs["Factor"])
    nt.links.new(mx.outputs["Result"], b.inputs["Base Color"])
    m.diffuse_color = (*hexc("#232739"), 1)
    return m


def M(key):
    if key == "ghost":
        return _mat("ghost", hexc("#555a68"), 0.0, 0.8)
    if key == "acento":
        return _mat("acento", hexc("#ff8a1f"), 0, 0.3, hexc("#ff8a1f"), 1.2)
    if key == "cian":
        return _mat("cian", hexc("#2de0f2"), 0, 0.3, hexc("#2de0f2"), 1.2)
    if key == "mal":
        return _mat("mal", hexc("#ff5a4a"), 0, 0.3, hexc("#ff5a4a"), 1.0)
    if key == "bien":
        return _mat("bien", hexc("#4ade80"), 0, 0.3, hexc("#4ade80"), 1.0)
    if key == "suelo":
        return _floor_mat()
    return _mat("m_" + key, hexc(COLORS[key]), 0.0, 0.32)


# ---------------------------------------------------------------- escena

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    s = bpy.context.scene
    s.world = bpy.data.worlds.new("World")
    s.world.use_nodes = True
    bg = s.world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.0015, 0.0018, 0.003, 1)
    bg.inputs["Strength"].default_value = 1.0
    return s


def studio(floor=True, floor_z=0.0, size=60):
    """Suelo oscuro y tres luces de estudio."""
    if floor:
        bpy.ops.mesh.primitive_plane_add(size=size, location=(0, 0, floor_z))
        f = bpy.context.active_object
        f.name = "Suelo"
        f.data.materials.append(M("suelo"))

    def area(name, loc, energy, size_, color=(1, 1, 1)):
        d = bpy.data.lights.new(name, "AREA")
        d.energy, d.size, d.color = energy, size_, color
        o = bpy.data.objects.new(name, d)
        bpy.context.scene.collection.objects.link(o)
        o.location = loc
        o.rotation_euler = (-Vector(loc)).to_track_quat("-Z", "Y").to_euler()
        return o

    area("Key", (-8, -14, 14), 2600, 10, (1.0, 0.96, 0.9))
    area("Fill", (14, -10, 6), 900, 12, (0.8, 0.88, 1.0))
    area("Rim", (4, 12, 10), 1600, 8, (1.0, 0.85, 0.75))


def eevee(samples=48):
    s = bpy.context.scene
    s.render.engine = "BLENDER_EEVEE_NEXT"
    s.eevee.taa_render_samples = samples
    for attr, val in (("use_raytracing", True), ("use_shadows", True)):
        try:
            setattr(s.eevee, attr, val)
        except Exception:
            pass
    s.view_settings.view_transform = "Standard"
    s.view_settings.look = "None"


def camera(loc, target, lens=50):
    s = bpy.context.scene
    cam = bpy.data.objects.new("Cam", bpy.data.cameras.new("Cam"))
    s.collection.objects.link(cam)
    s.camera = cam
    cam.data.lens = lens
    cam.data.clip_end = 400
    cam.location = loc
    cam.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    return cam


def render(path, w=1280, h=720):
    s = bpy.context.scene
    s.render.resolution_x, s.render.resolution_y = w, h
    s.render.resolution_percentage = 100
    s.render.image_settings.file_format = "WEBP"
    s.render.image_settings.quality = 88
    s.render.filepath = path
    os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.ops.render.render(write_still=True)
    print("RENDER", os.path.relpath(path, ROOT))


# ---------------------------------------------------------------- mallas base

def _to_obj(name, bm, mat_key, smooth_sides=True, bevel=0.035):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = bool(smooth_sides and abs(p.normal.z) < 0.5)
    o = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(o)
    me.materials.append(M(mat_key))
    if bevel:
        b = o.modifiers.new("Bisel", "BEVEL")
        b.width = bevel
        b.segments = 2
        b.limit_method = "ANGLE"
        b.angle_limit = math.radians(40)
    return o


def _prism(points, t, z0=None):
    """Polígono (lista de (x,y)) extruido en Z, centrado."""
    z0 = -t / 2 if z0 is None else z0
    bm = bmesh.new()
    vs = [bm.verts.new((x, y, z0)) for x, y in points]
    f = bm.faces.new(vs)
    if f.normal.z > 0:
        f.normal_flip()
    r = bmesh.ops.extrude_face_region(bm, geom=[f])
    vs2 = [v for v in r["geom"] if isinstance(v, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, verts=vs2, vec=(0, 0, t))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def _circle_pts(cx, cy, r, n=28, a0=0.0, a1=2 * math.pi, closed=True):
    steps = n if closed else n + 1
    return [(cx + r * math.cos(a0 + (a1 - a0) * i / n), cy + r * math.sin(a0 + (a1 - a0) * i / n)) for i in range(steps if not closed else n)]


def _cut(obj, cutters):
    """Resta `cutters` (lista de objetos) a `obj` y aplica el resultado."""
    for c in cutters:
        m = obj.modifiers.new("corte", "BOOLEAN")
        m.operation = "DIFFERENCE"
        m.solver = "EXACT"
        m.object = c
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(obj.evaluated_get(dg))
    old = obj.data
    obj.modifiers.clear()
    obj.data = me
    for p in me.polygons:
        p.use_smooth = abs(p.normal.z) < 0.5
    me.materials.clear()
    me.materials.append(old.materials[0])
    bpy.data.meshes.remove(old)
    for c in cutters:
        bpy.data.objects.remove(c, do_unlink=True)


def _cyl_cutter(positions, r=HOLE_R, depth=3.0):
    bm = bmesh.new()
    for (x, y) in positions:
        bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=24, radius1=r, radius2=r, depth=depth,
                              matrix=Matrix.Translation((x, y, 0)))
    me = bpy.data.meshes.new("cutter")
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new("cutter", me)
    bpy.context.scene.collection.objects.link(o)
    return o


_BEAM_CACHE = {}


def beam_mesh(n):
    key = ("beam", n)
    if key in _BEAM_CACHE:
        return _BEAM_CACHE[key]
    r = BEAM_W / 2
    pts = []
    L = (n - 1) * PITCH
    # semicirculo derecho (de -90 a 90) y luego el izquierdo (de 90 a 270)
    for i in range(0, 13):
        a = -math.pi / 2 + math.pi * i / 12
        pts.append((L + r * math.cos(a), r * math.sin(a)))
    for i in range(0, 13):
        a = math.pi / 2 + math.pi * i / 12
        pts.append((r * math.cos(a), r * math.sin(a)))
    bm = _prism(pts, BEAM_T)
    tmp = _to_obj("tmp", bm, "gris", bevel=0)
    _cut(tmp, [_cyl_cutter([(i * PITCH, 0) for i in range(n)])])
    me = tmp.data.copy()
    bpy.data.objects.remove(tmp, do_unlink=True)
    _BEAM_CACHE[key] = me
    return me


def beam(n, color="amarillo", name="viga"):
    me = beam_mesh(n)
    o = bpy.data.objects.new(f"{name}{n}", me)
    bpy.context.scene.collection.objects.link(o)
    o.data = me
    o.data = me.copy()
    o.data.materials.clear()
    o.data.materials.append(M(color))
    b = o.modifiers.new("Bisel", "BEVEL")
    b.width = 0.03
    b.segments = 2
    b.limit_method = "ANGLE"
    b.angle_limit = math.radians(40)
    return o


def pin(length=2.2, color="oscuro"):
    """Pasador con cabeza. Eje Z, centrado."""
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=20, radius1=0.285, radius2=0.285, depth=length)
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=20, radius1=0.4, radius2=0.4, depth=0.14,
                          matrix=Matrix.Translation((0, 0, length / 2 + 0.07)))
    return _to_obj("pin", bm, color, bevel=0.02)


def stopper(color="oscuro"):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=20, radius1=0.42, radius2=0.42, depth=0.3)
    return _to_obj("tope", bm, color, bevel=0.03)


def axle(length=3.0, color="eje"):
    """Eje de seccion en cruz."""
    a, w = 0.26, 0.085
    pts = [(w, a), (-w, a), (-w, w), (-a, w), (-a, -w), (-w, -w), (-w, -a), (w, -a), (w, -w), (a, -w), (a, w), (w, w)]
    return _to_obj("eje", _prism(pts, length), color, smooth_sides=False, bevel=0.012)


def _gear_pts(t):
    rp = t / 16.0
    r_root, r_tip = rp - 1.25 / 8, rp + 1.0 / 8
    p = 2 * math.pi / t
    pts = []
    for k in range(t):
        a = k * p
        pts += [(r_root, a - 0.30 * p), (r_tip, a - 0.10 * p), (r_tip, a + 0.10 * p), (r_root, a + 0.30 * p)]
    return [(r * math.cos(a), r * math.sin(a)) for r, a in pts]


def gear(t, color="gris", thick=0.5):
    """Engranaje de t dientes; un diente apunta a +X. Eje Z."""
    o = _to_obj(f"engr{t}", _prism(_gear_pts(t), thick), color, smooth_sides=False, bevel=0.012)
    a, w = 0.27, 0.095
    cross = [(w, a), (-w, a), (-w, w), (-a, w), (-a, -w), (-w, -w), (-w, -a), (w, -a), (w, -w), (a, -w), (a, w), (w, w)]
    c = _to_obj("cruz", _prism(cross, thick + 1), "gris", bevel=0)
    c.hide_render = True
    _cut(o, [c])
    return o


def weight(units, color="masa", w=0.8):
    """Masa colgante: `units` cuerpos apilados (cada uno 0,55 de alto, con una rendija). Origen en la base."""
    bm = bmesh.new()
    for i in range(units):
        bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation((0, 0, 0.55 * i + 0.275)) @ Matrix.Diagonal((w, w, 0.5, 1)))
    o = _to_obj("masa", bm, color, smooth_sides=False, bevel=0.035)
    return o, 0.55 * units


def arrow(start, end, color="acento", r=0.07, head=0.28):
    """Flecha 3D de `start` a `end` (emisiva)."""
    s, e = Vector(start), Vector(end)
    d = e - s
    L = d.length
    q = d.to_track_quat("Z", "Y")
    bm = bmesh.new()
    shaft = max(L - head, 0.01)
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=14, radius1=r, radius2=r, depth=shaft,
                          matrix=Matrix.Translation((0, 0, shaft / 2)))
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=True, segments=18, radius1=r * 2.6, radius2=0, depth=head,
                          matrix=Matrix.Translation((0, 0, shaft + head / 2)))
    me = bpy.data.meshes.new("flecha")
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new("flecha", me)
    bpy.context.scene.collection.objects.link(o)
    me.materials.append(M(color))
    for p in me.polygons:
        p.use_smooth = True
    o.matrix_world = Matrix.Translation(s) @ q.to_matrix().to_4x4()
    return o


def arc_arrow(center, radius, a0, a1, color="acento", r=0.06, plane="XZ", z=0.0):
    """Flecha curva en el plano XZ (alrededor de Y) de angulo a0 a a1 (radianes, sentido antihorario visto desde -Y)."""
    n = 28
    pts = []
    for i in range(n + 1):
        a = a0 + (a1 - a0) * i / n
        pts.append(Vector((center[0] + radius * math.cos(a), center[1], center[2] + radius * math.sin(a))))
    cu = bpy.data.curves.new("arco", "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = r
    cu.bevel_resolution = 3
    cu.use_fill_caps = True
    sp = cu.splines.new("POLY")
    sp.points.add(len(pts) - 1)
    for p, v in zip(sp.points, pts):
        p.co = (v.x, v.y, v.z, 1)
    o = bpy.data.objects.new("arco", cu)
    bpy.context.scene.collection.objects.link(o)
    o.data.materials.append(M(color))
    # cabeza de flecha tangente al final
    tip = pts[-1]
    tang = (pts[-1] - pts[-3]).normalized()
    head = arrow(tip - tang * 0.001, tip + tang * 0.34, color, r=r, head=0.34)
    return o, head


def rope(points, color="cuerda", r=0.045):
    """Cuerda: polilinea suave por `points` (lista de (x,y,z))."""
    cu = bpy.data.curves.new("cuerda", "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = r
    cu.bevel_resolution = 3
    cu.use_fill_caps = True
    sp = cu.splines.new("POLY")
    sp.points.add(len(points) - 1)
    for p, v in zip(sp.points, points):
        p.co = (v[0], v[1], v[2], 1)
    o = bpy.data.objects.new("cuerda", cu)
    bpy.context.scene.collection.objects.link(o)
    o.data.materials.append(M(color))
    return o


def pulley(radius=0.78, color="azul", thick=0.55):
    """Polea con garganta (eje Z)."""
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=40, radius1=radius, radius2=radius, depth=0.14,
                          matrix=Matrix.Translation((0, 0, thick / 2 - 0.07)))
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=40, radius1=radius, radius2=radius, depth=0.14,
                          matrix=Matrix.Translation((0, 0, -thick / 2 + 0.07)))
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=40, radius1=radius * 0.8, radius2=radius * 0.8, depth=thick)
    return _to_obj("polea", bm, color, bevel=0.025)


# ---------------------------------------------------------------- colocacion

def place(o, x=0.0, y=0.0, z=0.0, rx=0.0, ry=0.0, rz=0.0):
    o.location = (x, y, z)
    o.rotation_euler = (rx, ry, rz)
    return o


def plane(o, x, z, layer, rot=0.0):
    """Monta una pieza (eje Z) en el plano XZ, en la capa `layer` (y = -layer), girada `rot` alrededor del eje de la capa."""
    # primero giro dentro del plano de la pieza (alrededor de su eje Z), luego pongo el eje a lo largo de Y
    o.rotation_mode = "XYZ"
    m = Matrix.Translation((x, -layer, z)) @ Matrix.Rotation(math.pi / 2, 4, "X") @ Matrix.Rotation(rot, 4, "Z")
    o.matrix_world = m
    return o


def set_mat(o, key):
    o.data.materials.clear()
    o.data.materials.append(M(key))


def group_rotate(objs, pivot, angle):
    """Gira objetos alrededor del eje Y que pasa por `pivot` (x, z). angle>0 baja el lado +X."""
    px, pz = pivot
    R = Matrix.Translation((px, 0, pz)) @ Matrix.Rotation(angle, 4, "Y") @ Matrix.Translation((-px, 0, -pz))
    for o in objs:
        o.matrix_world = R @ o.matrix_world


def mesh_look(path_blend=None):
    pass
