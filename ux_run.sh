#!/bin/bash
# Uso: bash ux_run.sh vNN  -> capturas de toda la app (sitio actual de main) y páginas en /home/claude/ux_vNN/pages
set -e; V=$1; Q=/home/claude/qa; S=$Q/site_$V; O=/home/claude/ux_$V
rm -rf $S $O && cp -r /home/claude/ascenso $S && rm -rf $S/.git && mkdir -p $O/png
cd $Q && TZ=America/Santiago OUT=$O/png SITE=$S timeout 300 node uxshots.js && TZ=America/Santiago OUT=$O/png SITE=$S timeout 120 node uxshots2.js
python3 $Q/ux_pages.py $O/png $O/pages
