const day=o=>{const d=new Date();d.setDate(d.getDate()-o);return d.toISOString().slice(0,10)};
const base=()=>({v:1,updatedAt:Date.now(),created:day(30),profile:{name:"Paciente",route:"aventurera",birthY:1990,birthM:5,av:{ch:"camina",v:"f"}},onboard:{at:Date.now()-30*864e5,version:"2026-10-05-v1",health:true,healthAt:Date.now()-30*864e5},missions:[],done:{},journal:[],train:{parq:Array(10).fill(false),parqAt:day(20),parqLog:[],cleared:null,clearedBy:null,hold:null,plan:null,stage:1,stageAt:0,walkAt:0,sessions:[],deleted:[]},member:{trialStart:null,periods:[],suspended:false,audit:[]},timer:null,ui:{}});
// A: usuario nuevo, sin edad, sin plan
const A=base();A.created=day(0);A.onboard.at=Date.now();
// B: usuario de 3 semanas: misiones, plan activo, etapa 2 escalón 1, sesiones
const B=base();B.profile={name:"Rosa",route:"aventurera",birthY:1958,birthM:4,ageR:"60-74",age60:true,av:{ch:"camina",v:"f"}};
B.missions=[{id:"m1",name:"Caminar 20 minutos",cat:"Cuerpo",xp:20,time:"",dur:0,days:[0,1,2,3,4,5,6],created:day(22)},{id:"m2",name:"Tomar agua",cat:"Alimentación",xp:10,time:"",dur:0,days:[0,1,2,3,4,5,6],created:day(22)}];
for(let i=1;i<=21;i++){if(i%3)B.done[day(i)]={m1:20,m2:10}}
B.train.plan={days:"lun-mie-vie",walk:15,since:day(21)};B.train.senior=true;B.train.stage=2;B.train.stageAt=Date.now()-8*864e5;B.train.lvl=1;B.train.lvlAt=Date.now()-4*864e5;B.seenStage=3;
let id=0;for(let i=1;i<=20;i+=2)B.train.sessions.push({ex:[],exN:4,id:"s"+(id++),at:Date.now()-i*864e5,date:day(i),type:i%4===1?"fuerza":"caminata",stage:i<8?2:1,result:"completa",borg:5,pain:1,painNew:false,alert:false,note:"",xp:50});
B.journal=[{id:"j1",date:day(3),text:"Me sentí bien",mood:4}];
// C: paciente con pauta del kine, cargas y marcas, mayor de 75
const C=base();C.profile={name:"Luis",route:"guerrero",birthY:1948,birthM:2,ageR:"75+",age60:true,av:{ch:"camina",v:"m"}};C.rxDone={};
for(let i=0;i<12;i++){const o={};if(i%2===0)o["mmii_ext_rodilla"]=Date.now()-i*864e5;if(i%3===0)o["fz_hip_thrust"]=Date.now()-i*864e5;if(Object.keys(o).length)C.rxDone[day(i)]=o}
C.loads={fz_hip_thrust:[{d:day(1),c:"10",r:[12,12,10],p:1},{d:day(5),c:"8",r:[10,10,9],p:2}]};
const mineC=[{id:7,email:"kinerecupera@gmail.com",since:"2026-10-01T12:00:00Z",pro_name:"Klgo. Esteban Rosset",rxAt:day(14),rx:[{ex:"mmii_ext_rodilla",dose:"2×10 por lado, 1 vez al día"},{ex:"fz_hip_thrust",dose:"3×8-12, 3 veces por semana",c0:"8"},{ex:"",name:"Caminar 10 minutos",dose:"todos los días"}]}];
module.exports={A,B,C,mineC};
