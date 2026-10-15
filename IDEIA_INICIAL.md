# 💡 Ideia Inicial & Histórico do Projeto: VM Windows Isolada para Computer Use de IA

> **Documento de Contexto Inicial e Engenharia de Origem**  
> *Registrado por Kethely Soriano ([@kethysb](https://github.com/kethysb)) para preservação de arquitetura e continuidade por outros agentes de IA.*

---

## 📌 1. A Origem do Problema (A Dor Real)

Durante a automação de ferramentas pesadas de SEO (especificamente o **GroupBuySEOTools Member v0.26.53**, envolvendo **Ahrefs**, **Alura**, **SEMrush** e navegadores proprietários baseados em Chromium/Wayfern com proxy residencial autenticado), surgiu um gargalo crítico de usabilidade:

1. **Competição pelo mouse físico:** O Windows gerencia apenas um cursor e uma janela ativa em primeiro plano por tela. Quando a usuária estava trabalhando, assistindo vídeos no YouTube ou jogando (Minecraft em tela cheia), qualquer clique ou disparo de foco por código (`SetForegroundWindow`, `pyautogui`) pausava o jogo ou tirava o foco do vídeo.
2. **Benchmark realizado no host:**
   - Desenvolvemos uma técnica com `AttachThreadInput` que reduziu a interferência para apenas **0.82 segundos** no host, extraindo 20 concorrentes orgânicos do Ahrefs em **9.51 segundos**.
   - **Porém**, mesmo 0.8s ainda causava pausa no menu de jogos e disputa pelo mouse.
3. **A Conclusão Definitiva:** Automações com *Computer Use* e agentes de IA **não devem rodar na máquina física principal**. Elas precisam de uma **Máquina Virtual (VM) isolada**, com placa de vídeo, tela virtual, teclado e mouse 100% independentes.

---

## 🏗️ 2. A Solução Arquitetural: Tiny10 + VMware Workstation

Para não sobrecarregar o PC host (que possui 32 GB de RAM e 12 threads), montamos uma VM Windows com a versão mais leve e limpa existente: o **Tiny10 23H2 (x64)**.

### Por que Tiny10?
- **Consumo:** Apenas ~1.0 GB a 1.2 GB de RAM em repouso.
- **Armazenamento:** Instalação compacta de ~5 GB em disco dinâmico.
- **Compatibilidade total:** Suporta todos os programas Windows (`.exe`), `.msi`, navegadores Chromium, Wayfern, Node.js e Python sem bloatware, sem telemetria e sem Cortana.

---

## 🔑 3. Configurações & Dados da Máquina Virtual

A VM já foi baixada, configurada e instalada no computador host com as seguintes especificações:

| Item | Configuração |
| :--- | :--- |
| **Hypervisor** | VMware Workstation Pro 17.5.2 |
| **Pasta da VM no Host** | `C:\Users\Kethely\Documents\Virtual Machines\Tiny10` |
| **Arquivo VMX** | `C:\Users\Kethely\Documents\Virtual Machines\Tiny10\Tiny10.vmx` |
| **Disco Virtual** | `Tiny10.vmdk` (40 GB dinâmico SATA) |
| **Recursos** | 2 vCPUs, 3 GB de RAM, Rede NAT (`192.168.30.x`) |
| **Usuário do Windows da VM** | `kethy` |
| **Senha do Windows da VM** | `123456` |
| **ISO do Tiny10 salva** | `C:\Users\Kethely\Documents\Virtual Machines\ISO\tiny10_x64_23h2.iso` |
| **ISO do VMware Tools salva** | `C:\Program Files (x86)\VMware\VMware Workstation\windows.iso` |

---

## 🔌 4. Os 2 Modos de Controle pela IA

### Modo A: VNC Nativo do Hypervisor (Zero Agentes no Guest)
No arquivo `Tiny10.vmx`, adicionamos:
```ini
RemoteDisplay.vnc.enabled = "TRUE"
RemoteDisplay.vnc.port = "5958"
RemoteDisplay.vnc.ip = "127.0.0.1"
RemoteDisplay.vnc.keyMap = "us"
```
- A IA enxerga e controla a tela via MCP Server (`@hrrrsn/mcp-vnc`).
- A usuária pode assistir ao vivo pelo navegador via `noVNC` em `http://127.0.0.1:5993`.

### Modo B: Headless CLI (`vmrun.exe`)
Com o VMware Tools instalado dentro do Windows:
```powershell
$vmrun = "C:\Program Files (x86)\VMware\VMware Workstation\vmrun.exe"
$vmx = "C:\Users\Kethely\Documents\Virtual Machines\Tiny10\Tiny10.vmx"

# Iniciar invisível em segundo plano
& $vmrun -T ws start $vmx nogui

# Capturar tela sem abrir janela no host
& $vmrun -T ws -gu kethy -gp 123456 captureScreen $vmx "print.png"

# Executar scripts ou comandos
& $vmrun -T ws -gu kethy -gp 123456 runProgramInGuest $vmx "C:\Windows\System32\cmd.exe" "/c python script.py"
```

---

## 🚀 5. Próximos Passos para o Agente de IA / Desenvolvedor

1. **Instalar VMware Tools:** Abrir a VM no VMware, montar `windows.iso` e rodar `setup64.exe` para liberar resolução 1080p e área de transferência compartilhada.
2. **Instalar Softwares de SEO na VM:** Colocar o `seotools-member.exe` na Área de Trabalho e fazer login na conta GroupBuySEOTools.
3. **Instalar Python:** Instalar Python 3.12 na VM com `pyautogui`, `playwright` e `pillow`.
4. **Execução Autônoma:** Iniciar a VM em modo `nogui` e deixar a IA minerar dados e rodar buscas sem limite de horário e com zero interrupção na máquina da usuária.

---
*Commit inicial de documentação da ideia original.*
