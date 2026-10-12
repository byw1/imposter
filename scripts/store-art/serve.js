const http=require('http'),fs=require('fs'),path=require('path');
const root=process.argv[2], port=+process.argv[3]||8099;
const types={'.html':'text/html','.js':'text/javascript','.wasm':'application/wasm','.ttf':'font/ttf','.png':'image/png','.json':'application/json','.css':'text/css','.mp3':'audio/mpeg','.wav':'audio/wav','.svg':'image/svg+xml','.ico':'image/x-icon'};
http.createServer((req,res)=>{let p=decodeURIComponent(req.url.split('?')[0]);let f=path.join(root,p);
 if(!fs.existsSync(f)||fs.statSync(f).isDirectory()){f=path.join(root,p,'index.html'); if(!fs.existsSync(f)) f=path.join(root,'index.html');}
 res.setHeader('Cross-Origin-Opener-Policy','same-origin');res.setHeader('Cross-Origin-Embedder-Policy','require-corp');
 res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).pipe(res);}).listen(port);
