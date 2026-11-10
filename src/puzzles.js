export function metrics(type,values){if(type==='valves'){const[a,b,c]=values;return[a+b,b+c,a+c]}if(type==='balance'){const[a,b,c]=values;return[a+b+c,a-b,b-c]}if(type==='mirrors')return values.map((v,i)=>(v+i)%4);return values}
export function targetMetrics(type,code){return metrics(type,code)}
export function dialsSolved(type,values,code){const a=metrics(type,values),b=targetMetrics(type,code);return a.length===b.length&&a.every((v,i)=>v===b[i])}
export function timingGood(phase){return phase>=.35&&phase<=.65}
export function inputSequence(state,value,code,requireTiming=false,phase=.5){if(requireTiming&&!timingGood(phase))return{input:[],ok:false,reason:'Мимо доли. Дождись зелёного окна.'};const input=[...state.input,value];if(code[input.length-1]!==value)return{input:[],ok:false,reason:'Механизм сбросил последовательность.'};return{input,ok:input.length===code.length,reason:input.length===code.length?'Механизм запущен.':'Верно. Следующий знак.'}}
