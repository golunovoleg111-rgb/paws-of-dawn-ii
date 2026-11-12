import unittest,math,json
from pathlib import Path
from anatomy import solve_arm,add,sub,mul,dot,length,unit
class Arms(unittest.TestCase):
 def test_downward_arm_elbow_bends_behind_body(self):
  elbow,hand=solve_arm((0,0,0),(.15,0,-1),(-1,-.3,-.25))
  self.assertLess(elbow[0],0)
 def test_all_rendered_arm_targets_use_pole_and_keep_bone_lengths(self):
  clips=json.loads(Path(__file__).with_name('poses.json').read_text());count=0
  for clip in clips:
   for p in clip['frames']:
    shoulder=(p['shoulder']['x']/28,0,-p['shoulder']['y']/28)
    for i,side in enumerate(['far','near']):
     y=.39 if i==0 else -.39;old=p['arms'][i]
     root=add(shoulder,(.025,y,-.1));target=((old['end']['x']-old['root']['x'])/28+shoulder[0]+(.22 if i else 0),y,-old['end']['y']/28)
     pole=add(root,(-1,.3 if i==0 else -.3,-.25))
     elbow,hand=solve_arm(root,target,pole)
     self.assertAlmostEqual(length(sub(elbow,root)),16/28,places=8)
     self.assertAlmostEqual(length(sub(hand,elbow)),15/28,places=8)
     d=unit(sub(hand,root));middle=sub(elbow,root);perp=sub(middle,mul(d,dot(middle,d)))
     self.assertGreater(dot(perp,sub(pole,root)),0)
     upper=unit(sub(elbow,root));lower=unit(sub(hand,elbow));angle=math.degrees(math.acos(max(-1,min(1,dot(upper,lower)))))
     self.assertGreaterEqual(angle,7-1e-6);self.assertLessEqual(angle,145+1e-6);count+=1
  self.assertEqual(count,1392)
 def test_unreachable_and_degenerate_targets_stay_finite(self):
  for target,pole in [((0,0,0),(-1,0,0)),((0,0,100),(0,0,20)),((100,0,0),(-10,0,0))]:
   elbow,hand=solve_arm((0,0,0),target,pole)
   self.assertTrue(all(math.isfinite(v) for v in (*elbow,*hand)))
   self.assertAlmostEqual(length(elbow),16/28,places=8)
if __name__=='__main__':unittest.main()
