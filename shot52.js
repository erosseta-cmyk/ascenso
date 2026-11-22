const {serve,open}=require('./lib');const F=require('./fixtures');
(async()=>{const srv=await serve(8997);const {b,p}=await open(8997,{email:"rosa@x.cl",state:JSON.parse(JSON.stringify(F.B)),path:'?k=recupera'});await p.evaluate(()=>{view.evo=null;S.seenStage=99;S.ui.simpleAsked=1;tab='dia';render();scrollTo(0,0)});await p.screenshot({path:'shots/v52_card.png'});await b.close();srv.close()})();
