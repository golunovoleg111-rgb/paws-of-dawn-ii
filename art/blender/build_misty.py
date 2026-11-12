"""Reproducible, original Misty model + skeletal actions + transparent sprite bake.
Run Blender --background --python art/blender/build_misty.py -- --preview
No sprite fragments are used as model geometry or textures.
"""
import bpy, math, json, os, sys
import random
from mathutils import Vector, Matrix
from bpy_extras.object_utils import world_to_camera_view
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(Path(__file__).resolve().parent))
from anatomy import solve_arm
REVIEW='--review' in sys.argv
OUT=ROOT/'work/review-misty' if REVIEW else ROOT/'assets/characters/misty-baked'
OUT.mkdir(parents=True,exist_ok=True)
PREVIEW='--preview' in sys.argv
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def mat(name,color,metal=0,rough=.4):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
 return m
fur=mat('Obsidian fur',(.010,.014,.022),0,.82)
furLight=mat('Fur ridges',(.025,.033,.045),0,.8)
inner=mat('Inner ears',(.23,.105,.16),0,.65)
steel=mat('Moonsteel',(.17,.23,.31),.65,.4)
edge=mat('Silver engraved edges',(.62,.69,.74),.85,.24)
gold=mat('Antique pale gold',(.52,.37,.16),.8,.3)
leather=mat('Black leather',(.045,.033,.048),0,.58)
purple=mat('Amethyst woven cloth',(.105,.045,.23),0,.88)
violet=mat('Violet embroidery',(.33,.18,.46),.25,.48)
eye=mat('Jade irises',(.22,.63,.22),.12,.2)
black=mat('Onyx pupils',(.003,.005,.006),.1,.18)
nosemat=mat('Soft black nose',(.055,.032,.055),0,.37)
white=mat('Eye glints',(.92,1,.88),.1,.1)
wood=mat('Bow walnut',(.19,.075,.025),0,.48)
for material in [fur,furLight]:
 nodes=material.node_tree.nodes;links=material.node_tree.links
 tex=nodes.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=180;tex.inputs['Detail'].default_value=3
 bump=nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.28;bump.inputs['Distance'].default_value=.018
 links.new(tex.outputs['Fac'],bump.inputs['Height']);links.new(bump.outputs['Normal'],nodes.get('Principled BSDF').inputs['Normal'])
skinparts=[];bind=[]
def finish(o,name,material,bone=None,skin=False):
 o.name=name;o.data.materials.append(material)
 if o.type=='MESH':
  for p in o.data.polygons:p.use_smooth=True
 if bone:bind.append((o,bone))
 if skin:skinparts.append(o)
 return o
def uv(name,pos,size,material,bone=None,skin=False):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=16,location=pos)
 o=bpy.context.object;o.scale=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 return finish(o,name,material,bone,skin)
def mesh(name,verts,faces,material,bone=None,sub=0,skin=False):
 d=bpy.data.meshes.new(name);d.from_pydata(verts,[],faces);d.update();o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);finish(o,name,material,bone,skin)
 if sub:
  m=o.modifiers.new('Sculpted smooth surfaces','SUBSURF');m.levels=sub;m.render_levels=sub
 return o
def tube(name,points,r,material,bone=None):
 d=bpy.data.curves.new(name,'CURVE');d.dimensions='3D';d.resolution_u=12;d.bevel_depth=r;d.bevel_resolution=3
 p=d.splines.new('BEZIER');p.bezier_points.add(len(points)-1)
 for v,co in zip(p.bezier_points,points):v.co=co;v.handle_left_type=v.handle_right_type='AUTO'
 o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);return finish(o,name,material,bone)
def capsule(name,a,b,r,material,bone=None,skin=False,r2=None):
 a,b=Vector(a),Vector(b);o=uv(name,(a+b)/2,(r,r,(b-a).length/2+r*.75),material,bone,skin);o.rotation_mode='QUATERNION';o.rotation_quaternion=(b-a).to_track_quat('Z','Y');return o
def loft(name,rings,material,bone=None):
 n=32;v=[]
 for z,rx,ry,cx in rings:
  for i in range(n):
   a=i*math.tau/n;v.append((cx+math.cos(a)*rx,math.sin(a)*ry,z))
 f=[]
 for j in range(len(rings)-1):
  for i in range(n):f.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
 f.extend([tuple(reversed(range(n))),tuple((len(rings)-1)*n+i for i in range(n))])
 return mesh(name,v,f,material,bone,1)
def points(p):
 def cv(q,y=0):return Vector((q['x']/28,y,-q['y']/28))
 hip,shoulder=cv(p['hip']),cv(p['shoulder']);d={'spine':(hip,shoulder),'head':(shoulder+Vector((0,0,.05)),shoulder+Vector((.02,0,.55)))}
 for i,side in enumerate(['far','near']):
  y=.24 if i==0 else -.24;l=p['legs'][i];a,b,e=[cv(l[k],y) for k in ['root','joint','end']]
  d['thigh_'+side]=(a,b);d['shin_'+side]=(b,e);d['foot_'+side]=(e,e+Vector((.25,0,-.09)))
  y=.39 if i==0 else -.39;a=shoulder+Vector((.025,y,-.1));old=p['arms'][i];h=Vector(((old['end']['x']-old['root']['x'])/28+shoulder.x,y,-old['end']['y']/28))
  if side=='near':h.x+=.22
  pole=a+Vector((-1,.3 if side=='far' else -.3,-.25))
  elbow,hand=solve_arm(tuple(a),tuple(h),tuple(pole))
  elbow,hand=Vector(elbow),Vector(hand)
  d['upper_'+side]=(a,elbow);d['lower_'+side]=(elbow,hand);d['hand_'+side]=(hand,hand+Vector((.02,0,-.18)))
  if side=='near':
   angle=p['weaponAngle']+.22;d['weapon']=(hand,hand+Vector((math.sin(angle),0,math.cos(angle))))
 return d
CLIPS=json.loads((ROOT/'art/blender/poses.json').read_text())
REST=points(CLIPS[0]['frames'][0]);hip,shoulder=REST['spine']
S=shoulder.z;HEAD=shoulder+Vector((0,0,-.16))
# A genuinely continuous skin under the armour, including neck and shoulders.
uv('Pelvis',hip,(.26,.28,.23),fur,skin=True)
uv('Torso',hip.lerp(shoulder,.55),(.27,.31,.54),fur,skin=True)
uv('Shoulder bridge',shoulder+Vector((0,0,-.1)),(.26,.42,.23),fur,skin=True)
uv('Continuous neck',shoulder+Vector((0,0,.16)),(.23,.24,.25),fur,skin=True)
uv('Cranium',HEAD+Vector((.035,0,.69)),(.32,.29,.36),fur,skin=True)
uv('Forehead',HEAD+Vector((.18,0,.73)),(.22,.25,.25),fur,skin=True)
uv('Lower jaw',HEAD+Vector((.235,0,.49)),(.23,.22,.13),fur,skin=True)
for side in [-1,1]:
 uv('Muzzle pad',HEAD+Vector((.31,side*.115,.58)),(.20,.135,.12),furLight,'head')
 uv('Cheekbone',HEAD+Vector((.02,side*.23,.57)),(.21,.13,.20),fur,skin=True)
 # Solid sculpted pointed ears, not billboards.
 x=-.055;y=side*.20;z=(S-.16)+.94
 verts=[(x-.21,y-side*.065,z-.13),(x+.19,y-side*.065,z-.13),(x-.115,y,z+.32),(x-.21,y+side*.065,z-.13),(x+.19,y+side*.065,z-.13)]
 ear=mesh('Sculpted ear',verts,[(0,1,2),(1,4,2),(4,3,2),(3,0,2),(0,3,4,1)],fur,'head')
 bevel=ear.modifiers.new('Rounded ear rim','BEVEL');bevel.width=.025;bevel.segments=3
 mesh('Velvet ear inset',[(x-.16,y-side*.068,z-.075),(x+.13,y-side*.068,z-.075),(x-.105,y-side*.022,z+.24)],[(0,1,2)],inner,'head')
 # Forward-set eyes and a black vertical pupil, visible from both sides.
 pos=HEAD+Vector((.244,side*.214,.77))
 e=uv('Almond eye socket',pos,(.14,.025,.085),black,'head');e.rotation_euler[2]=side*.35
 uv('Jade eye',pos+Vector((.015,side*.028,.002)),(.105,.019,.064),eye,'head')
 uv('Vertical slit pupil',pos+Vector((.028,side*.052,.002)),(.012,.007,.052),black,'head')
 uv('Eye highlight',pos+Vector((.057,side*.058,.028)),(.009,.006,.012),white,'head')
 tube('Expressive brow',[(.10,side*.257,(S-.16)+.86),(.21,side*.27,(S-.16)+.87),(.34,side*.21,(S-.16)+.82)],.029,furLight,'head')
 for k in range(5):
  xx=-.13-k*.016;zz=(S-.16)+.60-k*.052
  mesh('Tapered cheek fur',[(xx+.12,side*.24,zz+.08),(xx+.04,side*(.28+k*.012),zz-.01),(xx-.12,side*(.30+k*.015),zz-.06)],[(0,1,2)],fur,'head')
 for k in range(3):
  tube('Whisker',[(.39,side*.14,(S-.16)+.60-k*.035),(.42,side*.31,(S-.16)+.63-k*.045),(.32,side*.47,(S-.16)+.65-k*.07)],.0045,edge,'head')
center=HEAD+Vector((.485,0,.64))
mesh('Triangular feline nose',[center+Vector((.025,-.075,.03)),center+Vector((.025,.075,.03)),center+Vector((.045,0,-.035)),center+Vector((-.035,0,.018))],[(0,1,2),(0,3,1),(0,2,3),(1,3,2)],nosemat,'head',1)
tube('Mouth',[(.47,-.12,(S-.16)+.53),(.49,0,(S-.16)+.51),(.47,.12,(S-.16)+.53)],.009,black,'head')
# Fine tapered fur is real geometry, bound with the head and rendered into the sprite.
random.seed(17)
verts=[];faces=[]
for i in range(1800):
 theta=random.uniform(0,math.tau);u=random.uniform(-.8,.98);r=math.sqrt(1-u*u)
 normal=Vector((r*math.cos(theta),r*math.sin(theta),u))
 if normal.x>.4 and normal.z<.65:continue
 base=HEAD+Vector((.035+normal.x*.322,normal.y*.292,.69+normal.z*.362))
 direction=Vector((-.012,normal.y*.007,-.018))+normal*.017
 tangent=normal.cross(Vector((0,0,1)))
 if tangent.length<.01:tangent=Vector((1,0,0))
 tangent.normalize();k=len(verts);width=random.uniform(.0015,.003)
 verts.extend([base-tangent*width,base+tangent*width,base+direction]);faces.append((k,k+1,k+2))
mesh('Fine silhouette fur',verts,faces,furLight,'head')
for side in ['far','near']:
 for kind,r in [('thigh',.15),('shin',.105),('upper',.112),('lower',.093)]:
  a,b=REST[kind+'_'+side];capsule('Continuous '+kind,a,b,r,fur,skin=True)
 a,b=REST['hand_'+side];uv('Gloved palm',a,(.096,.083,.13),leather,'hand_'+side)
 # Knuckles and fingers enclose the grip, no detached hand overlays.
 for k in range(4):
  uv('Glove finger',a+Vector((.055,-.057+k*.037,-.025)),(.055,.021,.075),leather,'hand_'+side)
 uv('Thumb',a+Vector((.055,-.075,.07)),(.045,.035,.07),leather,'hand_'+side)
 a,b=REST['foot_'+side];uv('Leather boot',a+Vector((.09,0,-.09)),(.22,.125,.13),leather,'foot_'+side)
 uv('Steel sabaton',a+Vector((.15,-.005,-.075)),(.18,.128,.087),steel,'foot_'+side)
 tube('Boot silver seam',[a+Vector((.27,-.09,-.08)),a+Vector((.22,-.126,-.055)),a+Vector((.02,-.126,-.045))],.012,edge,'foot_'+side)
# Merge the entire skin to a single watertight surface before skeletal binding.
bpy.ops.object.select_all(action='DESELECT')
for o in skinparts:o.select_set(True)
bpy.context.view_layer.objects.active=skinparts[0];bpy.ops.object.join();skin=bpy.context.object;skin.name='Misty continuous sculpted skin'
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
mod=skin.modifiers.new('Continuous anatomy voxel union','REMESH');mod.mode='VOXEL';mod.voxel_size=.032;mod.use_smooth_shade=True
bpy.ops.object.modifier_apply(modifier=mod.name)
mod=skin.modifiers.new('Sculpt smoothing','SMOOTH');mod.factor=.7;mod.iterations=4;bpy.ops.object.modifier_apply(modifier=mod.name)
# Tail is a curved 3D appendage, rendered with the full character.
tail=tube('Long feline tail',[(-.18,0,1.53),(-.56,.05,1.45),(-.95,.10,1.66),(-1.2,.08,1.68)],.085,fur,'spine')
# Shaped breastplate, segmented waist plates and a closed gorget around the neck.
loft('Sculpted breastplate',[(1.58,.29,.33,0),(1.75,.28,.33,0),(2.0,.35,.39,.015),(2.20,.35,.40,.025),(2.30,.29,.35,.015)],steel,'spine')
for z,rx,ry in [(1.62,.30,.34),(1.75,.29,.34),(2.27,.31,.37)]:
 tube('Plate gold rim',[(rx*math.cos(i*math.tau/32),ry*math.sin(i*math.tau/32),z) for i in range(33)],.014,gold,'spine')
loft('Closed gorget',[(S-.10,.22,.25,0),(S+.045,.19,.22,0),(S+.095,.18,.20,0)],steel,'spine')
loft('Leather belt',[(1.54,.28,.30,0),(1.64,.28,.30,0)],leather,'spine')
uv('Belt buckle',(.278,-.04,1.59),(.025,.11,.07),gold,'spine')

for side in [-1,1]:
 for z in [1.82,1.98,2.14,2.23]:
  uv('Cuirass rivet',(.19,side*.27,z),(.023,.024,.023),gold,'spine')
 for z in [1.79,1.87,1.95]:
  tube('Layered waist plate seam',[(.24,side*.10,z),(.20,side*.23,z+.015),(.06,side*.294,z+.025),(-.12,side*.25,z+.02)],.012,edge,'spine')
# Quilted violet collar fills the neckline without a hollow gap.
loft('Padded violet collar',[(S-.04,.23,.25,0),(S+.12,.20,.22,0)],purple,'spine')

# Visible engraved crescent emblem on the side facing the camera.
tube('Lunar chest crest',[(.05,-.405,2.14),(.14,-.40,2.10),(.16,-.39,1.99),(.08,-.39,1.94),(-.005,-.39,1.98)],.015,edge,'spine')
for k in range(3):
 z=1.89+k*.095
 tube('Chest filigree',[(.18,-.28,z),(.10,-.315,z+.02),(.08,-.325,z+.07)],.008,gold,'spine')
for side in ['far','near']:
 y=.39 if side=='far' else -.39
 a,b=REST['upper_'+side]
 uv('Rounded overlapping pauldron',a+Vector((0,0,-.005)),(.20,.17,.20),steel,'upper_'+side)
 tube('Pauldron trim',[(a.x+.18*math.cos(t),y-.155,a.z+.15*math.sin(t)) for t in [i*math.pi/16 for i in range(17)]],.015,gold,'upper_'+side)
 a,b=REST['lower_'+side];capsule('Engraved vambrace',a.lerp(b,.17),a.lerp(b,.77),.109,steel,'lower_'+side)
 tube('Vambrace inlay',[a.lerp(b,.18)+Vector((0,-.11,0)),a.lerp(b,.48)+Vector((.025,-.11,0)),a.lerp(b,.77)+Vector((0,-.11,0))],.011,edge,'lower_'+side)
 a,b=REST['thigh_'+side];capsule('Leather cuisse',a.lerp(b,.15),a.lerp(b,.70),.17,leather,'thigh_'+side)
 uv('Knee guard',b+Vector((.065,-.015,0)),(.15,.14,.14),steel,'shin_'+side)
 a,b=REST['shin_'+side];capsule('Fluted steel greave',a.lerp(b,.2),a.lerp(b,.8),.12,steel,'shin_'+side)
 tube('Greave crest',[a.lerp(b,.20)+Vector((.1,-.06,0)),a.lerp(b,.55)+Vector((.12,-.06,0)),a.lerp(b,.85)+Vector((.09,-.06,0))],.013,edge,'shin_'+side)
 # Tassets follow the thigh, overlapping the belt in every pose.
 a,b=REST['thigh_'+side];capsule('Hip leather tasset',a+Vector((.04,0,.03)),a.lerp(b,.36)+Vector((.06,0,0)),.18,steel,'thigh_'+side)
# Cloth cape: one tessellated 3D surface with stable weighted attachment.
v=[];f=[];rows=15;cols=13
for j in range(rows):
 t=j/(rows-1);z=S-.04-t*1.83;width=.24+t*.25
 for i in range(cols):
  u=i/(cols-1)*2-1;v.append((-.23-t*.36-.045*math.cos(u*math.pi*4),u*width,z+.035*math.cos(u*math.pi*4)*t))
for j in range(rows-1):
 for i in range(cols-1):a=j*cols+i;f.append((a,a+1,a+cols+1,a+cols))
cape=mesh('Woven violet cape',v,f,purple,'spine',1)
solid=cape.modifiers.new('Cloth thickness','SOLIDIFY');solid.thickness=.018
for side in [-1,1]:
 tube('Cape embroidered border',[(-.23-t*.36-.045,side*(.24+t*.25),S-.04-t*1.83) for t in [i/20 for i in range(21)]],.012,gold,'spine')
for k in range(3):
 uv('Silver cloak clasp',(-.05,-.34,S-.03-k*.025),(.07,.027,.07),gold,'spine')
# A real armature and actions are saved in the .blend source.
armdata=bpy.data.armatures.new('Misty skeleton');arm=bpy.data.objects.new('Misty animated character',armdata);bpy.context.collection.objects.link(arm);bpy.context.view_layer.objects.active=arm;arm.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
for name,(a,b) in REST.items():
 eb=armdata.edit_bones.new(name);eb.head=a;eb.tail=b
bpy.ops.object.mode_set(mode='OBJECT');arm.show_in_front=True
def bind_rigid(o,bone):
 # Use the same rest-space skinning for armour and skin. Bone parenting adds a
 # tail offset and is unsuitable for geometry authored in world coordinates.
 if o.type!='MESH':
  bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH')
 o.data.transform(o.matrix_world);o.matrix_world=Matrix.Identity(4)
 vg=o.vertex_groups.new(name=bone);vg.add(list(range(len(o.data.vertices))),1,'REPLACE')
 modifier=o.modifiers.new('Rigid skeletal attachment','ARMATURE');modifier.object=arm
for o,bone in bind:bind_rigid(o,bone)
def merge_bound(objects,name):
 # Collapse the modelling objects into a single weighted mesh. This retains all
 # per-bone weights while avoiding hundreds of separate modifier evaluations.
 for o in objects:
  bpy.context.view_layer.objects.active=o
  for modifier in list(o.modifiers):
   if modifier.type!='ARMATURE':bpy.ops.object.modifier_apply(modifier=modifier.name)
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.select_set(True)
 bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();result=bpy.context.object;result.name=name
 return result
body_render=merge_bound([o for o,bone in bind],'Misty weighted armour, face and cloth')
# Assign smooth skinning weights to the continuous mesh using the nearest bones.
def distance_segment(p,a,b):
 d=b-a;t=max(0,min(1,(p-a).dot(d)/d.length_squared));return(p-(a+d*t)).length
groups={n:skin.vertex_groups.new(name=n) for n in REST if n!='weapon'}
for vert in skin.data.vertices:
 p=vert.co;near=sorted([(distance_segment(p,a,b),name) for name,(a,b) in REST.items() if name!='weapon'])[:3]
 weights=[math.exp(-max(0,d-near[0][0])**2/.014) for d,n in near];total=sum(weights)
 for w,(d,n) in zip(weights,near):groups[n].add([vert.index],w/total,'REPLACE')
mod=skin.modifiers.new('Misty skeletal skinning','ARMATURE');mod.object=arm;mod.use_deform_preserve_volume=True
sub=skin.modifiers.new('Final skin smoothness','SUBSURF');sub.levels=1;sub.render_levels=1
# All six weapons are complete 3D objects and are baked inside each sprite.
weapons={}
hand=REST['hand_near'][0]
def weapon_objects(kind):
 before=set(bpy.data.objects);binding_start=len(bind);x,y,z=hand.x+.04,hand.y-.02,hand.z
 if 'bow' in kind:
  m=gold if kind=='royalbow' else wood
  tube(kind+' limbs',[(x+.12,y,z+.72),(x-.13,y,z+.45),(x-.18,y,z),(x-.13,y,z-.45),(x+.12,y,z-.72)],.035,m,'weapon')
  tube(kind+' string',[(x+.12,y,z+.72),(x+.12,y,z-.72)],.005,edge,'weapon')
  capsule('Bow grip',(x-.18,y,z-.09),(x-.18,y,z+.09),.043,leather,'weapon')
 else:
  height=1.45 if kind=='hammer' else 1.2
  capsule('Leather weapon grip',(x,y,z-.21),(x,y,z+.13),.036,leather,'weapon')
  uv('Weapon pommel',(x,y,z-.23),(.065,.065,.06),gold,'weapon')
  if kind=='hammer':
   capsule('Hammer haft',(x,y,z+.1),(x,y,z+1.05),.035,wood,'weapon')
   capsule('Forged hammer head',(x-.24,y,z+1.03),(x+.24,y,z+1.03),.14,gold,'weapon')
  else:
   capsule('Sword crossguard',(x-.20,y,z+.15),(x+.20,y,z+.15),.033,gold,'weapon')
   curve=.25 if kind=='sabre' else .08 if kind=='moonblade' else 0
   verts=[]
   for zz,ww in [(z+.17,.064),(z+.94,.052),(z+1.22,0)]:
    shift=curve*((zz-z)/1.22)**2
    verts.extend([(x-ww+shift,y-.014,zz),(x+ww+shift,y-.014,zz),(x+shift,y-.038,zz),(x+shift,y+.025,zz)])
   faces=[]
   for j in range(2):
    a=j*4;b=a+4
    faces.extend([(a,b,b+2,a+2),(a+2,b+2,b+1,a+1),(a+1,b+1,b+3,a+3),(a+3,b+3,b,a)])
   mesh('Faceted '+kind+' blade',verts,faces,edge,'weapon')
   if kind=='moonblade':uv('Moonstone',(x,y-.035,z+.13),(.06,.025,.08),eye,'weapon')
 objects=list(set(bpy.data.objects)-before)
 for o,bone in bind[binding_start:]:
  if o in objects:
   angle=.34;c,sn=math.cos(angle),math.sin(angle)
   rotation=Matrix(((c,0,sn,0),(0,1,0,0),(-sn,0,c,0),(0,0,0,1)))
   o.matrix_world=Matrix.Translation(hand) @ rotation @ Matrix.Translation(-hand) @ o.matrix_world
   bind_rigid(o,bone)
 return [merge_bound(objects,'Misty equipment '+kind)]
for kind in ['sword','sabre','bow','hammer','moonblade','royalbow']:weapons[kind]=weapon_objects(kind)
def pose(p):
 target=points(p)
 for name,(a,b) in target.items():
  pb=arm.pose.bones[name];rest=arm.data.bones[name]
  rotation=(rest.tail_local-rest.head_local).rotation_difference(b-a).to_matrix().to_4x4()
  pb.matrix=Matrix.Translation(a) @ rotation @ Matrix.Translation(-rest.head_local) @ rest.matrix_local
 bpy.context.view_layer.update()
def equip(weapon,action='idle'):
 for name,objects in weapons.items():
  for o in objects:o.hide_render=name!=weapon or action=='interact'
scene=bpy.context.scene;scene.render.engine='BLENDER_EEVEE_NEXT';scene.render.film_transparent=True
scene.render.resolution_x=256;scene.render.resolution_y=320;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
scene.render.image_settings.compression=35
scene.render.fps=24;scene.world.color=(.18,.18,.18)
scene.view_settings.view_transform='AgX'
scene.render.image_settings.color_depth='8'
def area(name,pos,power,color,size):
 d=bpy.data.lights.new(name,'AREA');d.energy=power;d.color=color;d.shape='DISK';d.size=size;o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);o.location=pos;o.rotation_euler=(Vector((0,0,1.8))-o.location).to_track_quat('-Z','Y').to_euler()
area('Warm key',(3,-4,6),550,(1,.84,.69),4)
area('Cool silver rim',(-3,2,4),750,(.53,.67,1),3)
area('Soft face fill',(4,1,3),200,(.76,.88,1),3)
camdata=bpy.data.cameras.new('Orthographic sprite camera');cam=bpy.data.objects.new('Orthographic sprite camera',camdata);bpy.context.collection.objects.link(cam)
cam.location=(3,-12,2.7);target=Vector((.05,0,1.8));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();camdata.type='ORTHO';camdata.ortho_scale=5.5;scene.camera=cam
scene.render.engine='BLENDER_EEVEE_NEXT';scene.render.film_transparent=True
if hasattr(scene,'eevee'):scene.eevee.taa_render_samples=16
equip('sword');pose(CLIPS[0]['frames'][0])
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'misty-review.blend' if REVIEW else ROOT/'art/blender/misty.blend'))
if PREVIEW:
 scene.render.resolution_percentage=200;scene.render.filepath=str(OUT/'preview.png');bpy.ops.render.render(write_still=True)
else:
 manifest={'version':1,'model':'art/blender/misty.blend','width':256,'height':320,'fps':24,'clips':{},'weapons':list(weapons),'camera':'orthographic','wholeCharacter':True,'scale':28*camdata.ortho_scale/320}
 foot=world_to_camera_view(scene,cam,Vector((0,0,0)));manifest['pivot']=[foot.x*256,(1-foot.y)*320]
 for clip in CLIPS:
  key=clip['weapon']+'-'+clip['action'];folder=OUT/key;folder.mkdir(exist_ok=True);equip(clip['weapon'],clip['action'])
  arm.animation_data_clear();action=bpy.data.actions.new(key);arm.animation_data_create();arm.animation_data.action=action
  for i,p in enumerate(clip['frames']):
   scene.frame_set(i+1);pose(p)
   for pb in arm.pose.bones:
    pb.rotation_mode='QUATERNION';pb.keyframe_insert('location',frame=i+1);pb.keyframe_insert('rotation_quaternion',frame=i+1);pb.keyframe_insert('scale',frame=i+1)
  scene.frame_start=1;scene.frame_end=clip['count'];scene.frame_set(1)
  scene.render.filepath=str(folder)+os.sep;bpy.ops.render.render(animation=True)
  action.use_fake_user=True;manifest['clips'][key]={'count':clip['count'],'fps':24,'loop':clip['action'] in ['idle','walk','run','crouch']}
  print('BAKED',key,flush=True)
 (OUT/'manifest.json').write_text(json.dumps(manifest,indent=2))
 equip('sword');arm.animation_data.action=bpy.data.actions.get('sword-walk');scene.frame_set(1)
 bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'art/blender/misty.blend'))
 print('MISTY BAKE COMPLETE',flush=True)
