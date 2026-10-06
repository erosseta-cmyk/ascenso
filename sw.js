var V="ascenso-v11",SHELL=["./","index.html","manifest.webmanifest","icon-192.png","icon-512.png","supabase.js","591.supabase.js"];
self.addEventListener("install",function(e){e.waitUntil(caches.open(V).then(function(c){return c.addAll(SHELL)}).catch(function(){}).then(function(){return self.skipWaiting()}))});
self.addEventListener("activate",function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==V}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener("fetch",function(e){var r=e.request;if(r.method!=="GET")return;var u=new URL(r.url);if(u.origin!==self.location.origin)return;
 var page=r.mode==="navigate"||/\/(index\.html)?$/.test(u.pathname)||/\.(js|webmanifest)$/.test(u.pathname);
 if(page){e.respondWith(fetch(r,{cache:"no-store"}).then(function(res){if(res&&res.ok){var cp=res.clone();caches.open(V).then(function(c){c.put(r.mode==="navigate"?"./":r,cp)})}return res}).catch(function(){return caches.match(r.mode==="navigate"?"./":r,{ignoreSearch:true}).then(function(m){return m||caches.match("./")})}));return}
 if(/\.(jpg|png)$/.test(u.pathname)){e.respondWith(caches.match(r).then(function(m){return m||fetch(r).then(function(res){if(res&&res.ok){var cp=res.clone();caches.open(V).then(function(c){c.put(r,cp)})}return res})}));return}});
var FN="https://gtwqhrmobusntfsqebdc.supabase.co/functions/v1/push-tick";
self.addEventListener("push",function(e){var d={};try{d=e.data?e.data.json():{}}catch(x){}
 e.waitUntil(self.registration.showNotification(d.title||"Ascenso",{body:d.body||"Tienes una misión pendiente",tag:d.tag||"ascenso",icon:"icon-192.png",badge:"icon-192.png",renotify:true,requireInteraction:true,vibrate:[300,150,300,150,300],data:{mid:d.mid||null},actions:d.mid?[{action:"snooze",title:"Posponer 10 min"},{action:"open",title:"Abrir"}]:[]}))});
self.addEventListener("notificationclick",function(e){var n=e.notification;n.close();var mid=n.data&&n.data.mid;
 if(e.action==="snooze"&&mid){e.waitUntil(self.registration.pushManager.getSubscription().then(function(s){return s?fetch(FN,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"snooze",endpoint:s.endpoint,mission_id:mid})}):null}).catch(function(){}));return}
 e.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:true}).then(function(cs){for(var k=0;k<cs.length;k++){if("focus" in cs[k])return cs[k].focus()}return self.clients.openWindow("./")}))});
