# Recalcula el candado de seguridad (CSP) de index.html.
# Hay que correrlo después de CUALQUIER cambio en un <script> de index.html; si no, la app no carga.
import re,hashlib,base64,sys
p=sys.argv[1] if len(sys.argv)>1 else 'index.html';s=open(p,encoding='utf-8').read()
s=re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]*>\n?','',s)
hs=["'sha256-"+base64.b64encode(hashlib.sha256(m.group(1).encode('utf-8')).digest()).decode()+"'" for m in re.finditer(r'<script>([\s\S]*?)</script>',s)]
csp="script-src 'self' "+" ".join(hs)+"; object-src 'none'; base-uri 'self'"
s=s.replace('<meta charset="utf-8">','<meta charset="utf-8">\n<meta http-equiv="Content-Security-Policy" content="'+csp+'">',1)
open(p,'w',encoding='utf-8').write(s);print('CSP actualizado:',len(hs),'scripts')
