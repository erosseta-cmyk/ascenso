# Uso: python3 ux_pages.py <dir_png> <dir_salida>  -> páginas ux-N.jpg (3 capturas por página, 390 px)
import sys,glob,os
from PIL import Image, ImageDraw, ImageFont
src,out=sys.argv[1],sys.argv[2];os.makedirs(out,exist_ok=True)
f=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',15)
names={'00_acceso':'Acceso','01_mi_dia':'Paciente · Mi día (con pauta del kine)','02_misiones':'Paciente · Misiones','03_entreno':'Paciente · Entreno (plan activo)','04_registrar_sesion':'Paciente · Registrar sesión (formulario abierto)','04b_registrar_sintomas':'Paciente · Registrar sesión con síntomas marcados','04c_dia_completado':'Paciente · Entreno con la sesión de hoy ya registrada','05_evolucion':'Paciente · Evolución (personaje)','06_progreso':'Paciente · Progreso','07_bitacora':'Paciente · Bitácora','08_ajustes':'Paciente · Ajustes','09_modo_simple':'Paciente · Modo simple','10_bienvenida_nuevo':'Usuario nuevo · Bienvenida','11_kine_pacientes':'Kine · Lista de pacientes','12_kine_ficha_paciente':'Kine · Ficha abierta','13_kine_indicar_ejercicios':'Kine · Indicar ejercicios + buscador','14_kine_planes_biblioteca':'Kine · Planes y biblioteca'}
tiles=[]
for fn in sorted(glob.glob(src+'/*.png')):
    k=os.path.basename(fn)[:-4];im=Image.open(fn).convert('RGB');H=im.height;parts=[(0,H)] if H<=1350 else [(0,1300),(1300,H)]
    for i,(a,b) in enumerate(parts):
        tiles.append((names.get(k,k)+(f' ({i+1}/{len(parts)})' if len(parts)>1 else ''),im.crop((0,a,390,b))))
for n,g in enumerate([tiles[i:i+3] for i in range(0,len(tiles),3)],1):
    H=max(t.height for _,t in g)+36;W=Image.new('RGB',(1200,H),'white');d=ImageDraw.Draw(W)
    for j,(lab,t) in enumerate(g):W.paste(t,(j*400,36));d.text((j*400+4,9),lab,fill=(20,20,20),font=f)
    W.save(f'{out}/ux-{n}.jpg',quality=82)
print(len(tiles),'capturas en',n,'páginas')
