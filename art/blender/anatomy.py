"""Arm geometry in world space, with an explicit anatomical elbow pole.

No Blender dependency: it can be checked before any expensive scene render.
Angles are flexion from straight, in degrees. Straight-lock and hyperflexion
are excluded from the reachable set; the hand endpoint is returned explicitly.
"""
import math
def add(a,b):return tuple(x+y for x,y in zip(a,b))
def sub(a,b):return tuple(x-y for x,y in zip(a,b))
def mul(a,s):return tuple(x*s for x in a)
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def length(a):return math.sqrt(dot(a,a))
def unit(a):
 n=length(a)
 if n<1e-10:raise ValueError('Cannot normalize a zero vector')
 return mul(a,1/n)
def solve_arm(root,target,pole,upper=16/28,lower=15/28,min_flex=7,max_flex=145):
 delta=sub(target,root)
 direction=unit(delta) if length(delta)>1e-9 else (0,0,-1)
 near=math.sqrt(upper*upper+lower*lower+2*upper*lower*math.cos(math.radians(max_flex)))
 far=math.sqrt(upper*upper+lower*lower+2*upper*lower*math.cos(math.radians(min_flex)))
 distance=max(near,min(far,length(delta)))
 end=add(root,mul(direction,distance))
 hint=sub(pole,root);plane=sub(hint,mul(direction,dot(hint,direction)))
 if length(plane)<1e-7:
  # Stable side-plane fallback rather than an arbitrary XZ sign flip.
  axis=min(((1,0,0),(0,1,0),(0,0,1)),key=lambda a:abs(dot(direction,a)))
  plane=sub(axis,mul(direction,dot(axis,direction)))
 along=(upper*upper-lower*lower+distance*distance)/(2*distance)
 height=math.sqrt(max(0,upper*upper-along*along))
 elbow=add(add(root,mul(direction,along)),mul(unit(plane),height))
 return elbow,end
