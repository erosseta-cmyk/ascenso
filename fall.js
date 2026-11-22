const {serve,open}=require('./lib');const F=require('./fixtures');
(async()=>{const srv=await serve(8921);const out=[];
for(const [age,route] of [["75+","aventurera"],["75+","guerrero"],["18-29","aventurera"],["18-29","guerrero"]]){const st=JSON.parse(JSON.stringify(F.C));st.profile.ageR=age;st.profile.route=route;st.train.senior=age==="75+";
 const {b,p}=await open(8921,{email:"c@x.cl",state:st});
 out.push(await p.evaluate(a=>["ves_x1h","ves_brandt_daroff","atx_cuadrupedia","fz_plancha_lateral","mmii_talon_cama","plancha_rod"].map(id=>a+" "+id+" → "+(rxSrc(id)||"(sin imagen)")),age+"/"+route));await b.close()}
console.log(out.flat().join("\n"));srv.close()})();
