self.addEventListener("install",function(){self.skipWaiting()});
self.addEventListener("activate",function(e){e.waitUntil(self.clients.claim())});
self.addEventListener("fetch",function(){});
var FN="https://gtwqhrmobusntfsqebdc.supabase.co/functions/v1/push-tick";
self.addEventListener("push",function(e){var d={};try{d=e.data?e.data.json():{}}catch(x){}
 e.waitUntil(self.registration.showNotification(d.title||"Ascenso",{body:d.body||"Tienes una misión pendiente",tag:d.tag||"ascenso",icon:"icon-192.png",badge:"icon-192.png",renotify:true,requireInteraction:true,vibrate:[300,150,300,150,300],data:{mid:d.mid||null},actions:d.mid?[{action:"snooze",title:"Posponer 10 min"},{action:"open",title:"Abrir"}]:[]}))});
self.addEventListener("notificationclick",function(e){var n=e.notification;n.close();var mid=n.data&&n.data.mid;
 if(e.action==="snooze"&&mid){e.waitUntil(self.registration.pushManager.getSubscription().then(function(s){return s?fetch(FN,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"snooze",endpoint:s.endpoint,mission_id:mid})}):null}).catch(function(){}));return}
 e.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:true}).then(function(cs){for(var k=0;k<cs.length;k++){if("focus" in cs[k])return cs[k].focus()}return self.clients.openWindow("./")}))});
