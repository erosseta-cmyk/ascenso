var V="ascenso-v79",SHELL=["./","index.html","manifest.webmanifest","icon-192.png","icon-512.png","supabase.js","591.supabase.js"];
self.addEventListener("install",function(e){e.waitUntil(caches.open(V).then(function(c){return c.addAll(SHELL)}).catch(function(){}).then(function(){return self.skipWaiting()}))});
self.addEventListener("activate",function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==V}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener("fetch",function(e){var r=e.request;if(r.method!=="GET")return;var u=new URL(r.url);if(u.origin!==self.location.origin||u.pathname.indexOf("/beta/")>=0)return;
 var page=r.mode==="navigate"||/\/(index\.html)?$/.test(u.pathname)||/\.(js|webmanifest)$/.test(u.pathname);
 if(page){e.respondWith(fetch(r,{cache:"no-store"}).then(function(res){if(res&&res.ok){var cp=res.clone();caches.open(V).then(function(c){c.put(r.mode==="navigate"?"./":r,cp)})}return res}).catch(function(){return caches.match(r.mode==="navigate"?"./":r,{ignoreSearch:true}).then(function(m){return m||caches.match("./")})}));return}
 if(/\.(jpg|png)$/.test(u.pathname)){e.respondWith(caches.match(r).then(function(m){return m||fetch(r).then(function(res){if(res&&res.ok){var cp=res.clone();caches.open(V).then(function(c){c.put(r,cp)})}return res})}));return}});
var FN="https://gtwqhrmobusntfsqebdc.supabase.co/functions/v1/push-tick";
/* B3: lo que se ve fuera de la app (incluida la pantalla bloqueada) nunca lleva el nombre del hábito, la dosis, el dolor ni datos del paciente,
   aunque el servidor envíe otro texto. El detalle se muestra dentro de Ascenso, según el perfil y el estado actual. */
var NT="Ascenso",NB="Tienes un recordatorio de Ascenso";
function kindOf(d){if(d.mid)return"m";if(/^(rx|vence|pro)$/.test(String(d.k||"")))return d.k;var t=String(d.title||"");/* servidor anterior: sin «k», se deduce del título (que nunca se muestra) */return /paciente/i.test(t)?"pro":/vence/i.test(t)?"vence":/ejercicios/i.test(t)?"rx":/pro-alert/.test(String(d.tag||""))?"pro":"x"}
self.addEventListener("push",function(e){var d={};try{d=e.data?e.data.json():{}}catch(x){}
 var mid=typeof d.mid==="string"?d.mid.slice(0,80):null,k=kindOf(d);
 e.waitUntil(self.registration.showNotification(NT,{body:NB,tag:mid?"m-"+mid:"a-"+k,icon:"icon-192.png",badge:"icon-192.png",renotify:true,requireInteraction:true,vibrate:[300,150,300,150,300],data:{mid:mid,k:k},actions:mid?[{action:"snooze",title:"Posponer 10 min"},{action:"open",title:"Abrir"}]:[]}))});
self.addEventListener("notificationclick",function(e){var n=e.notification;n.close();var mid=n.data&&n.data.mid;
 if(e.action==="snooze"&&mid){e.waitUntil(self.registration.pushManager.getSubscription().then(function(s){return s?fetch(FN,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"snooze",endpoint:s.endpoint,mission_id:mid})}):null}).catch(function(){}));return}
 var av=mid?"m:"+mid:(n.data&&n.data.k)||"x";
 e.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:true}).then(function(cs){for(var k=0;k<cs.length;k++){if("focus" in cs[k]){try{cs[k].postMessage({t:"aviso",v:av})}catch(x){}return cs[k].focus()}}return self.clients.openWindow("./?aviso="+encodeURIComponent(av))}))});
