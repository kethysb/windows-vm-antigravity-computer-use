import { spawn } from 'node:child_process';
import { createConnection } from 'node:net';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// Configuracoes
const VMX_PATH = process.env.VMX_PATH || 'C:\\Users\\Kethely\\Documents\\Virtual Machines\\Tiny10\\Tiny10.vmx';
const VMRUN_PATH = process.env.VMRUN_PATH || 'C:\\Program Files (x86)\\VMware\\VMware Workstation\\vmrun.exe';
const VNC_HOST = process.env.VNC_HOST || '127.0.0.1';
const VNC_PORT = process.env.VNC_PORT || '5958';
const VIEWER_PORT = process.env.VIEWER_PORT || '5993';

function result(message, isError = false) {
  return { content: [{ type: 'text', text: message }], isError };
}

function run(command, args, timeout = 60000) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    const output = [];
    const timer = setTimeout(() => child.kill(), timeout);
    child.stdout.on('data', chunk => output.push(chunk));
    child.on('error', reject);
    child.on('close', code => {
      clearTimeout(timer);
      if (code === 0) resolve(Buffer.concat(output).toString('utf8').trim());
      else reject(new Error(`Comando falhou com código ${code}.`));
    });
  });
}

function checkPort(port) {
  return new Promise(resolve => {
    const socket = createConnection({ host: '127.0.0.1', port: parseInt(port, 10) });
    const finish = val => { socket.destroy(); resolve(val); };
    socket.setTimeout(1500);
    socket.once('connect', () => finish(true));
    socket.once('error', () => finish(false));
    socket.once('timeout', () => finish(false));
  });
}

async function isVmRunning() {
  try {
    const list = await run(VMRUN_PATH, ['-T', 'ws', 'list']);
    return list.toLowerCase().includes(VMX_PATH.toLowerCase());
  } catch {
    return false;
  }
}

async function executeVncAction(toolName, args = {}) {
  const client = new Client({ name: 'vm-vnc-bridge', version: '1.0.0' });
  const vncServerScript = join(process.cwd(), 'node_modules', '@hrrrsn', 'mcp-vnc', 'dist', 'index.js');

  await client.connect(new StdioClientTransport({
    command: process.execPath,
    args: [vncServerScript],
    env: { ...process.env, VNC_HOST, VNC_PORT: String(VNC_PORT) }
  }));

  try {
    return await client.callTool({ name: toolName, arguments: args });
  } finally {
    await client.close();
  }
}

const tools = [
  {
    name: 'vm_status',
    description: 'Informa se a máquina virtual Windows está ligada e se os serviços VNC e Web Viewer estão ativos.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'vm_start',
    description: 'Inicia a VM Windows em segundo plano (modo headless / nogui) pelo VMware.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'vm_screenshot',
    description: 'Captura um screenshot da tela atual da VM Windows via VNC para análise visual do agente.',
    inputSchema: {
      type: 'object',
      properties: {
        delay: { type: 'number', description: 'Tempo de espera em ms antes de capturar' }
      }
    }
  },
  {
    name: 'vm_click',
    description: 'Clica em coordenadas da tela da VM (x, y).',
    inputSchema: {
      type: 'object',
      properties: {
        x: { type: 'number', description: 'Coordenada X' },
        y: { type: 'number', description: 'Coordenada Y' },
        button: { type: 'string', enum: ['left', 'right', 'middle'], default: 'left' },
        double: { type: 'boolean', default: false }
      },
      required: ['x', 'y']
    }
  },
  {
    name: 'vm_type_text',
    description: 'Digita um texto dentro da VM com opção de pressionar Enter.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Texto a digitar' },
        enter: { type: 'boolean', default: false }
      },
      required: ['text']
    }
  },
  {
    name: 'vm_key_press',
    description: 'Envia tecla ou combinação (ex: "Enter", "Ctrl+c", "Alt+F4", "Shift+Tab").',
    inputSchema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Tecla ou combinação' }
      },
      required: ['key']
    }
  }
];

async function handleToolCall(name, args) {
  switch (name) {
    case 'vm_status': {
      const running = await isVmRunning();
      const vncActive = await checkPort(VNC_PORT);
      const viewerActive = await checkPort(VIEWER_PORT);
      return result(JSON.stringify({ running, vnc: vncActive, viewer: viewerActive }, null, 2));
    }
    case 'vm_start': {
      if (await isVmRunning()) return result('A VM já está em execução.');
      await run(VMRUN_PATH, ['-T', 'ws', 'start', VMX_PATH, 'nogui']);
      return result('VM iniciada com sucesso em modo headless!');
    }
    case 'vm_screenshot':
      return await executeVncAction('vnc_screenshot', args);
    case 'vm_click':
      return await executeVncAction('vnc_click', args);
    case 'vm_type_text':
      return await executeVncAction('vnc_type_text', args);
    case 'vm_key_press':
      return await executeVncAction('vnc_key_press', args);
    default:
      throw new Error(`Ferramenta desconhecida: ${name}`);
  }
}

const server = new Server({ name: 'windows-vm-manager', version: '1.0.0' }, { capabilities: { tools: {} } });
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));
server.setRequestHandler(CallToolRequestSchema, async request => {
  try {
    return await handleToolCall(request.params.name, request.params.arguments || {});
  } catch (error) {
    return result(error instanceof Error ? error.message : 'Erro desconhecido', true);
  }
});

await server.connect(new StdioServerTransport());
