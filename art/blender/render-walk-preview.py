"""Large inspection frames only; the game keeps the compact runtime atlases."""
import bpy
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'art/blender/misty.blend'))
scene=bpy.context.scene;arm=bpy.data.objects['Misty animated character']
arm.animation_data.action=bpy.data.actions['sword-walk']
scene.frame_start=1;scene.frame_end=24;scene.render.resolution_percentage=200
folder=ROOT/'assets/characters/misty-baked/preview-walk';folder.mkdir(exist_ok=True)
scene.render.filepath=str(folder)+'/'
bpy.ops.render.render(animation=True)
