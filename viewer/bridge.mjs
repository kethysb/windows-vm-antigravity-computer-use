import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { WebSocketServer } from 'ws';

// Configuracao
const PORT_HTTP = process.env.VIEWER_PORT ? parseInt(process.env.VIEWER_PORT, 10) : 5993;
const VNC_PORT = process.env.VNC_PORT ? parseInt(process.env.VNC_PORT, 10) : 5958;
const VNC_HOST = process.env.VNC_HOST || '127.0.0.1';

// Diretorio raiz do noVNC
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(currentDir, 'noVNC');

const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.json': 'application/json'
};

// Servidor HTTP para servir a interface web do noVNC
const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
    const file = path.resolve(root, '.' + (pathname === '/' ? '/vnc.html' : pathname));

    if (!file.startsWith(root + path.sep)) {
      res.writeHead(403).end('Acesso negado');
      return;
    }

    const data = await readFile(file);
    res.writeHead(200, {
      'Content-Type': mime[path.extname(file)] ?? 'application/octet-stream',
      'Cache-Control': 'no-store'
    }).end(data);
  } catch (error) {
    if (error instanceof URIError || (error instanceof Error && 'code' in error && error.code === 'ENOENT')) {
      res.writeHead(404).end('Arquivo noVNC nao encontrado. Certifique-se de clonar ou baixar o noVNC na pasta viewer/noVNC.');
      return;
    }
    console.error('Erro no servidor HTTP:', error);
    res.writeHead(500).end('Erro interno');
  }
});

// Servidor WebSocket (Websockify) para fazer bridge entre o Browser e o VNC TCP da VM
const sockets = new WebSocketServer({ noServer: true });

server.on('upgrade', (req, socket, head) => {
  if (req.url !== '/websockify') {
    socket.destroy();
    return;
  }
  sockets.handleUpgrade(req, socket, head, ws => sockets.emit('connection', ws));
});

sockets.on('connection', ws => {
  const tcp = net.connect({ host: VNC_HOST, port: VNC_PORT });

  tcp.on('data', data => {
    if (ws.readyState === 1) ws.send(data);
  });

  ws.on('message', data => tcp.write(data));

  tcp.on('error', error => {
    console.error(`Erro na conexao TCP VNC (${VNC_HOST}:${VNC_PORT}):`, error.message);
    ws.close();
  });

  ws.on('error', error => {
    console.error('Erro no WebSocket:', error.message);
    tcp.destroy();
  });

  tcp.on('close', () => ws.close());
  ws.on('close', () => tcp.destroy());
});

server.listen(PORT_HTTP, '127.0.0.1', () => {
  console.log(`=======================================================`);
  console.log(`🌐 Visualizador Web da VM Ativo!`);
  console.log(`📡 Ouvindo em: http://127.0.0.1:${PORT_HTTP}/vnc.html?autoconnect=1&resize=scale&path=websockify`);
  console.log(`🎯 Conectado ao VNC da VM em: ${VNC_HOST}:${VNC_PORT}`);
  console.log(`=======================================================`);
});
