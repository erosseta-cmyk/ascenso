const {PGlite}=require('@electric-sql/pglite');const {pgcrypto}=require('@electric-sql/pglite/contrib/pgcrypto');const fs=require('fs');
async function mk(){const db=new PGlite({extensions:{pgcrypto}});await db.exec(fs.readFileSync(__dirname+'/sql/base.sql','utf8'));await db.exec(fs.readFileSync(__dirname+'/sql/sec.sql','utf8'));return db}
module.exports={mk};
if(require.main===module)mk().then(async db=>{console.log((await db.query("select count(*) from pg_proc where pronamespace='sec'::regnamespace")).rows, (await db.query("select sec.t0()")).rows)}).catch(e=>{console.error('ERR',e.message,e.position);process.exit(1)});
