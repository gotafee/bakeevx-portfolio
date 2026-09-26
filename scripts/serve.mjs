import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('dist');
const port=Number(process.argv[process.argv.indexOf('--port')+1])||4323;
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2','.xml':'application/xml','.txt':'text/plain; charset=utf-8','.json':'application/json'};
http.createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  let file=path.resolve(root,'.'+pathname);
  if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403);res.end();return}
  const info=await stat(file).catch(()=>null);
  if(info?.isDirectory()){if(!pathname.endsWith('/')){res.writeHead(301,{Location:pathname+'/'});res.end();return}file=path.join(file,'index.html')}
  let status=200;let body=await readFile(file).catch(()=>null);
  if(!body){status=404;file=path.join(root,'404.html');body=await readFile(file)}
  res.writeHead(status,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(req.method==='HEAD'?undefined:body);
 }catch{res.writeHead(400);res.end('Bad request')}
}).listen(port,'127.0.0.1',()=>console.log(`Preview: http://127.0.0.1:${port}`));
