import bpy, math, os, sys
sys.path.insert(0,'/tmp/blender-numpy')
from mathutils import Vector

ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=os.path.join(ROOT,'outputs','blender')
os.makedirs(OUT,exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
for datablocks in (bpy.data.meshes,bpy.data.curves,bpy.data.materials,bpy.data.cameras,bpy.data.lights):
    for block in list(datablocks):
        if block.users==0: datablocks.remove(block)

def mat(name,color,metal=0,rough=.55,emission=None):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=(*color,1); p.inputs['Metallic'].default_value=metal; p.inputs['Roughness'].default_value=rough
    if emission:
        p.inputs['Emission Color'].default_value=(*emission,1); p.inputs['Emission Strength'].default_value=.45
    return m

skin=mat('Warm porcelain skin',(0.68,.38,.24),0,.62)
robe=mat('Deep umber school robe',(.19,.105,.065),0,.76)
robe_hi=mat('Robe raised piping',(.46,.29,.15),.12,.5)
cloth=mat('Midnight blue lining',(.045,.085,.15),.12,.62)
gold=mat('Antique brass',(.68,.42,.12),.72,.32)
hair=mat('Dark chestnut hair',(.10,.045,.028),.05,.5)
white=mat('Ivory shirt',(.78,.72,.58),0,.7)
eye=mat('Polished dark eyes',(.018,.026,.038),.08,.15)
glow=mat('Aether crystal',(.12,.67,.95),.25,.2,(.1,.65,1))
scale=mat('Dragon scales — obsidian plum',(.075,.042,.105),.35,.34)
scale_hi=mat('Dragon scale highlights',(.28,.085,.11),.42,.31)
horn=mat('Ivory horns',(.82,.66,.42),.18,.38)
fire=mat('Ember orange',(.96,.15,.025),.18,.25,(1,.08,.008))

def assign(obj,material): obj.data.materials.append(material); return obj
def smooth(obj):
    if obj.type=='MESH':
        for p in obj.data.polygons:p.use_smooth=True
    return obj
def uv(name,loc,scale3,material,segments=24,rings=16):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,location=loc); o=bpy.context.object;o.name=name;o.scale=scale3;assign(o,material);smooth(o);return o
def bevel_box(name,loc,scale3,material,bevel=.08):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=scale3;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);assign(o,material)
    mod=o.modifiers.new('Soft tailored edges','BEVEL');mod.width=bevel;mod.segments=3;o.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL');return o
def cone(name,loc,r1,r2,depth,material,rot=(0,0,0),verts=12):
    bpy.ops.mesh.primitive_cone_add(vertices=verts,radius1=r1,radius2=r2,depth=depth,location=loc,rotation=rot);o=bpy.context.object;o.name=name;assign(o,material);smooth(o);return o
def between(name,a,b,r,material,verts=12,r2=None):
    a,b=Vector(a),Vector(b);d=b-a
    bpy.ops.mesh.primitive_cone_add(vertices=verts,radius1=r,radius2=(r if r2 is None else r2),depth=d.length,location=(a+b)/2);o=bpy.context.object;o.name=name;o.rotation_mode='QUATERNION';o.rotation_quaternion=d.to_track_quat('Z','Y');assign(o,material);smooth(o);return o
def curve(name,pts,bevel,material):
    c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.bevel_depth=bevel;c.bevel_resolution=3
    s=c.splines.new('BEZIER');s.bezier_points.add(len(pts)-1)
    for p,co in zip(s.bezier_points,pts):p.co=co;p.handle_left_type='AUTO';p.handle_right_type='AUTO'
    o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);assign(o,material);return o
def mesh_poly(name,verts,faces,material):
    me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.materials.append(material);me.update();o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);return o

# Hero: layered, stylized RPG school mage with sculpted robe, face, staff and a real crest material.
hero=bpy.data.objects.new('HERO | Seac Pai Van academy mage',None);bpy.context.collection.objects.link(hero); hero.location=(-2.35,0,0);hero.rotation_euler[0]=math.pi/2
def H(o):o.parent=hero;return o
# Lower robe and upper torso are separate shaped volumes, with a mantle and inset lining.
H(cone('Hero | flared robe hem',(0,.63,0),.62,.35,1.08,robe,verts=16))
H(uv('Hero | tailored shoulders',(0,1.35,0),(.43,.34,.29),robe))
H(bevel_box('Hero | blue shirt inset',(0,1.22,.278),(.26,.55,.04),cloth,.045))
H(cone('Hero | collar',(0,1.50,.01),.18,.09,.19,white,verts=8))
H(uv('Hero | neck',(0,1.67,.015),(.14,.16,.14),skin,20,12))
H(uv('Hero | face',(0,1.98,.025),(.34,.39,.29),skin,32,24))
# ears, expressive eyes, pupils, brows and a small smile face toward +Z.
for side in (-1,1):
    H(uv('Hero | ear',(.325*side,1.99,.015),(.075,.11,.075),skin,16,12))
    H(uv('Hero | eye white',(.125*side,2.025,.283),(.078,.095,.037),white,18,12))
    H(uv('Hero | pupil',(.125*side,2.012,.316),(.042,.058,.025),eye,16,12))
    H(curve('Hero | eyebrow',[(.055*side,2.15,.307),(.13*side,2.17,.32),(.20*side,2.145,.305)],.018,hair))
H(uv('Hero | nose',(0,1.96,.315),(.045,.055,.04),skin,16,12))
H(curve('Hero | smile',[(-.07,1.84,.292),(0,1.82,.31),(.07,1.84,.292)],.012,hair))
# Hair cap and swept locks.
H(uv('Hero | hair cap',(0,2.22,-.005),(.36,.22,.31),hair,24,16))
for x,y,z,s in [(-.25,2.15,.12,.13),(-.12,2.12,.24,.12),(.05,2.15,.25,.11),(.23,2.17,.14,.13)]:H(uv('Hero | swept fringe',(x,y,z),(s,.13,.10),hair,16,12))
# Broad soft pointed wizard-school hat with stitched brim and crown.
H(uv('Hero | hat brim',(0,2.36,0),(.57,.10,.39),cloth,32,16))
hat=H(cone('Hero | sculpted hat crown',(0,2.57,-.025),.34,.025,.48,cloth,rot=(0,.1,-.10),verts=20));
H(curve('Hero | hat brass piping',[(-.48,2.37,.03),(-.25,2.40,.34),(0,2.41,.39),(.25,2.40,.34),(.48,2.37,.03)],.018,gold))
H(uv('Hero | hat sigil',(0,2.58,.245),(.07,.09,.025),glow,16,12))
# Cloak shoulders, hood seam and robe piping.
for side in (-1,1):
    H(between('Hero | sleeve',(side*.28,1.38,0),(side*.48,.91,.035),.13,robe,16,.105))
    H(uv('Hero | hand',(side*.50,.87,.06),(.115,.13,.11),skin,18,12))
H(curve('Hero | robe center seam',[(0,1.50,.24),(0,1.10,.30),(0,.46,.50)],.018,robe_hi))
H(curve('Hero | hem embroidery',[(-.48,.30,.22),(-.25,.20,.47),(0,.17,.52),(.25,.20,.47),(.48,.30,.22)],.025,gold))
# Boots under robe.
for side in (-1,1):
    H(uv('Hero | boots',(.20*side,.10,.08),(.18,.14,.26),hair,18,12))
# Staff with articulated metal collar and floating crystal.
staff=H(between('Hero | carved staff',(.62,.22,.03),(.66,1.88,.03),.045,robe_hi,12,.035))
for yy in (.30,1.54,1.70):H(uv('Hero | staff ferrule',(.65,yy,.03),(.07,.055,.065),gold,16,10))
H(uv('Hero | staff crystal',(.66,1.97,.03),(.13,.19,.12),glow,20,14))
for a in range(3):
    ang=a*math.tau/3;H(between('Hero | crystal prong',(.66+math.cos(ang)*.10,1.82,.03+math.sin(ang)*.08),(.66+math.cos(ang)*.14,1.97,.03+math.sin(ang)*.12),.025,gold,8,.014))
# School crest image as a shallow, UV-mapped enamel pin at the left chest, in front of fabric.
img=bpy.data.images.load(os.path.join(ROOT,'school-crest.jpeg'),check_existing=True);img.pack()
crestmat=bpy.data.materials.new('Official school crest | enamel badge');crestmat.use_nodes=True;nodes=crestmat.node_tree.nodes;links=crestmat.node_tree.links;bs=nodes.get('Principled BSDF');tex=nodes.new('ShaderNodeTexImage');tex.image=img;tex.interpolation='Linear';links.new(tex.outputs['Color'],bs.inputs['Base Color']);links.new(tex.outputs['Alpha'],bs.inputs['Alpha']);bs.inputs['Metallic'].default_value=.12;bs.inputs['Roughness'].default_value=.36;crestmat.surface_render_method='DITHERED'
# beveled brass badge frame and image plate; facing front camera.
badge=H(bevel_box('Hero | brass school badge frame',(-.13,1.30,.342),(.20,.24,.045),gold,.035))
plate=H(bevel_box('Hero | school crest enamel',(-.13,1.30,.371),(.157,.194,.012),white,.018));plate.data.materials.clear();plate.data.materials.append(crestmat)

# Dragon: substantial four-legged boss with articulated wings, horns, layered scales and tail.
dragon=bpy.data.objects.new('BOSS | Ember wyrm',None);bpy.context.collection.objects.link(dragon);dragon.location=(2.45,0,0);dragon.rotation_euler[0]=math.pi/2
def D(o):o.parent=dragon;return o
D(uv('Dragon | armored torso',(0,.87,0),(.70,.48,.43),scale,32,20))
D(uv('Dragon | shoulder armor',(-.43,1.10,0),(.46,.46,.45),scale_hi,24,16))
D(uv('Dragon | neck',(-.70,1.38,.01),(.30,.55,.30),scale,24,16)).rotation_euler[1]=-.45
D(uv('Dragon | skull',(-.94,1.75,.04),(.36,.31,.30),scale_hi,24,16))
D(uv('Dragon | muzzle',(-1.13,1.61,.10),(.30,.17,.25),scale,20,12))
for side in (-1,1):
    D(uv('Dragon | eye socket',(-1.03,1.84,.27*side),(.12,.09,.07),gold,16,12))
    D(uv('Dragon | eye',(-1.06,1.84,.32*side),(.055,.055,.04),fire,16,12))
    D(cone('Dragon | swept horn',(-.84,2.05,.18*side),.11,.012,.42,horn,rot=(.1,side*.22,-.35),verts=10))
    D(cone('Dragon | cheek spike',(-.65,1.48,.33*side),.10,.01,.30,horn,rot=(math.pi/2,side*.25,0),verts=8))
# Four stout legs and talons.
for x in (-.43,.43):
    for z in (-.27,.27):
        D(between('Dragon | forelimb',(x,.84,z),(x-.04,.25,z*1.2),.17,scale,12,.13))
        D(uv('Dragon | clawed paw',(x-.05,.20,z*1.2),(.22,.13,.18),scale_hi,16,12))
        for c in (-1,0,1):D(cone('Dragon | ivory talon',(x-.17,.15,z*1.2+c*.075),.045,.008,.15,horn,rot=(0,-.4,0),verts=8))
# Tail sweeping behind body to the right.
D(curve('Dragon | muscular tail',[(.45,.92,-.02),(.85,.75,-.02),(1.17,.46,-.02),(1.52,.52,-.02),(1.78,.83,-.02)],.17,scale))
D(cone('Dragon | tail blade',(1.83,.91,-.02),.18,.015,.44,scale_hi,rot=(0,0,-.6),verts=8))
# Wings are shaped surfaces with thick leading bones and inset membranes.
for side in (-1,1):
    z=side*.30
    root=(-.05,1.20,z);tip=(-.48,2.45,z);outer=(.70,2.18,z);rear=(.47,1.15,z)
    D(between('Dragon | wing leading spar',root,tip,.065,horn,10,.026))
    D(between('Dragon | wing outer spar',root,outer,.055,scale_hi,10,.02))
    D(between('Dragon | wing lower spar',root,rear,.045,horn,10,.018))
    verts=[root,tip,outer,rear]
    faces=[(0,1,2),(0,2,3)]
    panel=D(mesh_poly('Dragon | leathery wing membrane',verts,faces,scale_hi));sol=panel.modifiers.new('Membrane thickness','SOLIDIFY');sol.thickness=.025
    for q in (.35,.68):
        end=Vector(root).lerp(Vector(outer),q)+Vector((-.1,.36,0))
        D(between('Dragon | wing finger',root,end,.022,scale,8,.01))
# Layered dorsal plates and scales along the body.
for i in range(7):
    x=-.5+i*.19;y=1.30+math.sin(i*.5)*.06
    D(cone('Dragon | dorsal blade',(x,y,.01),.13,.008,.30,scale_hi,rot=(0,0,0),verts=7))
for i in range(3):
    D(uv('Dragon | chest scale',(-.75+i*.12,1.37,.28),(.10,.13,.035),gold,12,8))
# Jaw hinge and warm fire sacs in the throat.
D(curve('Dragon | lower jaw',[(-1.32,1.54,.02),(-1.15,1.45,.21),(-.96,1.49,.24)],.045,horn))
D(uv('Dragon | throat ember',(-1.16,1.62,.30),(.11,.07,.035),fire,12,8))

# Layout stage for Blender inspection/render.
floor_mat=mat('Arena | blue-black stone',(.012,.023,.043),.28,.72)
bpy.ops.mesh.primitive_plane_add(size=14,location=(0,0,-.08));floor=bpy.context.object;floor.name='Arena floor';floor.scale=(1,.53,1);assign(floor,floor_mat)
world=bpy.data.worlds.new('Rift arena world') if not bpy.data.worlds else bpy.data.worlds[0];bpy.context.scene.world=world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.006,.012,.025,1);world.node_tree.nodes['Background'].inputs[1].default_value=.28
def area(name,loc,power,color,size,target):
    d=bpy.data.lights.new(name,'AREA');d.energy=power;d.color=color;d.shape='DISK';d.size=size;o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
area('Key | warm softbox',(-3,-4,6),700,(1,.77,.52),4,(0,0,1));area('Rim | rift blue',(2,3,4),950,(.15,.48,1),3,(0,0,1));area('Fill | neutral',(4,-3,2),420,(.7,.82,1),3,(0,0,1))
camd=bpy.data.cameras.new('Battle character camera');cam=bpy.data.objects.new('Battle character camera',camd);bpy.context.collection.objects.link(cam);cam.location=(0,-12,2.2);cam.rotation_euler=(Vector((0,0,1.2))-cam.location).to_track_quat('-Z','Y').to_euler();camd.type='ORTHO';camd.ortho_scale=8.2;bpy.context.scene.camera=cam
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24
scene.render.resolution_x=1400;scene.render.resolution_y=560;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.film_transparent=False
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.render.filepath=os.path.join(OUT,'battle-characters.png')
scene.camera.data.lens=50
# Save editable scene and render a review still.
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'battle-characters.blend'))
bpy.ops.render.render(write_still=True)
# Export only the character roots and descendants; stage stays editable in the blend.
bpy.ops.object.select_all(action='DESELECT')
for root in (hero,dragon):
    for obj in [root]+list(root.children_recursive):obj.select_set(True)
bpy.context.view_layer.objects.active=hero
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'battle-characters.glb'),export_format='GLB',use_selection=True,export_apply=True)
print('BLENDER_MODEL_OK',bpy.app.version_string,os.path.join(OUT,'battle-characters.glb'))
