// The rejected 3D draft is retained as source work, not as a public art release.
export const MISTY_3D_RELEASED=false;
export function useBakedMisty(search=''){return MISTY_3D_RELEASED&&new URLSearchParams(search).get('art')==='3d'}
