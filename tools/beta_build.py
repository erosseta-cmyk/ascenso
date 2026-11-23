# Construye beta/index.html (copia de prueba aislada) a partir de un index.html.
# Uso: python3 tools/beta_build.py [origen=index.html]
# Aislamiento: almacenamiento con prefijo "beta::" (no comparte sesión ni datos locales con la app real),
# sin service worker ni manifest (no se instala), aviso rojo fijo, noindex, y solo cuentas en BETA_OK.
import sys,re,subprocess,os,json
src=sys.argv[1] if len(sys.argv)>1 else 'index.html'
s=open(src,encoding='utf-8').read()
allow=json.load(open('beta/allow.json')) if os.path.exists('beta/allow.json') else []
head_inject=('<base href="/ascenso/"><meta name="robots" content="noindex,nofollow">'
 '<script>(function(){var P="beta::",S=Storage.prototype,g=S.getItem,t=S.setItem,r=S.removeItem;'
 'S.getItem=function(k){return g.call(this,P+k)};S.setItem=function(k,v){return t.call(this,P+k,v)};S.removeItem=function(k){return r.call(this,P+k)};'
 'window.__BETA=true;window.__BETA_OK='+json.dumps([e.lower() for e in allow])+'})();</script>')
i=s.find('<head>');assert i>=0;s=s[:i+6]+head_inject+s[i+6:]
s=s.replace('<link rel="manifest" href="manifest.webmanifest">','',1)
assert s.count('serviceWorker.register("sw.js")')==1
s=s.replace('serviceWorker.register("sw.js")','serviceWorker.getRegistration("/ascenso/beta/__sin_sw__")')
bar=('<div role="note" style="position:sticky;top:0;z-index:99999;background:#b91c1c;color:#fff;font:700 15px/1.3 system-ui;'
 'padding:8px 12px;text-align:center">COPIA DE PRUEBA · solo cuentas de prueba autorizadas · no es la app de tus pacientes</div>')
j=s.find('<body');j=s.find('>',j)+1;s=s[:j]+bar+s[j:]
a='function afterAuth(){if(!session){'
assert s.count(a)==1
s=s.replace(a,'function afterAuth(){if(session&&session.user&&!(window.__BETA_OK||[]).includes(String(session.user.email||"").toLowerCase())){try{sb.auth.signOut()}catch(e){}session=null;authMsg="Esta copia de prueba solo acepta cuentas de prueba autorizadas."}if(!session){')
s=re.sub(r'<title>[^<]*</title>','<title>Ascenso · COPIA DE PRUEBA</title>',s,count=1)
os.makedirs('beta',exist_ok=True);open('beta/index.html','w',encoding='utf-8').write(s)
print(subprocess.run(['python3','tools/csp.py','beta/index.html'],capture_output=True,text=True).stdout.strip())
print('beta/index.html listo; cuentas permitidas:',len(allow))
