import os
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

URL = "https://archive.org/download/tiny-10-23-h2/tiny10%20x64%2023h2.iso"
DEST_DIR = r"C:\Users\Kethely\Documents\Virtual Machines\ISO"
FINAL_FILE = os.path.join(DEST_DIR, "tiny10_x64_23h2.iso")
PARTS_DIR = os.path.join(DEST_DIR, "tiny10_parts")

os.makedirs(DEST_DIR, exist_ok=True)
os.makedirs(PARTS_DIR, exist_ok=True)

TOTAL_SIZE = 3839819776
NUM_PARTS = 12
PART_SIZE = (TOTAL_SIZE + NUM_PARTS - 1) // NUM_PARTS

def download_part(part_idx):
    start = part_idx * PART_SIZE
    end = min(start + PART_SIZE - 1, TOTAL_SIZE - 1)
    part_file = os.path.join(PARTS_DIR, f"part_{part_idx:02d}.tmp")

    # Resume support
    existing = 0
    if os.path.exists(part_file):
        existing = os.path.getsize(part_file)
        if existing == (end - start + 1):
            print(f"[Parte {part_idx:02d}] Já baixada completamente ({existing/(1024*1024):.1f} MB).")
            return part_idx

    current_start = start + existing
    if current_start > end:
        return part_idx

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Range": f"bytes={current_start}-{end}"
    }

    max_retries = 5
    for attempt in range(max_retries):
        try:
            req = urllib.request.Request(URL, headers=headers)
            with urllib.request.urlopen(req, timeout=30) as resp:
                mode = "ab" if existing > 0 else "wb"
                with open(part_file, mode) as f:
                    while True:
                        chunk = resp.read(256 * 1024)
                        if not chunk:
                            break
                        f.write(chunk)
            print(f"[Parte {part_idx:02d}] Concluída com sucesso!")
            return part_idx
        except Exception as e:
            print(f"[Parte {part_idx:02d}] Tentativa {attempt+1} falhou: {e}. Reconectando...")
            time.sleep(3)
            if os.path.exists(part_file):
                existing = os.path.getsize(part_file)
                current_start = start + existing
                headers["Range"] = f"bytes={current_start}-{end}"
    raise Exception(f"Falha ao baixar parte {part_idx}")

def main():
    print(f"=== INICIANDO DOWNLOAD ACELERADO DO TINY10 (12 CONEXÕES) ===")
    print(f"Tamanho Total: {TOTAL_SIZE / (1024**3):.2f} GB")
    t0 = time.time()

    with ThreadPoolExecutor(max_workers=NUM_PARTS) as executor:
        futures = [executor.submit(download_part, i) for i in range(NUM_PARTS)]
        for fut in as_completed(futures):
            fut.result()

    print("\nTodas as 12 partes baixadas! Consolidando arquivo final...")
    with open(FINAL_FILE, "wb") as f_out:
        for i in range(NUM_PARTS):
            p_file = os.path.join(PARTS_DIR, f"part_{i:02d}.tmp")
            with open(p_file, "rb") as f_in:
                while True:
                    b = f_in.read(10 * 1024 * 1024)
                    if not b:
                        break
                    f_out.write(b)
            # Remove part file after merging
            os.remove(p_file)

    try:
        os.rmdir(PARTS_DIR)
    except:
        pass

    dt = time.time() - t0
    final_size = os.path.getsize(FINAL_FILE)
    print(f"=== DOWNLOAD FINALIZADO COM SUCESSO! ===")
    print(f"Arquivo: {FINAL_FILE}")
    print(f"Tamanho: {final_size / (1024**3):.2f} GB")
    print(f"Tempo total: {dt / 60:.1f} minutos ({final_size / (1024*1024) / dt:.2f} MB/s)")

if __name__ == "__main__":
    main()
