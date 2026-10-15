import ctypes
import time
import win32process
import pyautogui
import pyperclip
from PIL import ImageGrab

user32 = ctypes.windll.user32
kernel32 = ctypes.windll.kernel32
hdesk = user32.OpenInputDesktop(0, False, 0x01FF)
if hdesk: user32.SetThreadDesktop(hdesk)

t0 = time.time()
print("Cronômetro iniciado!")

hwnd = 983910
prev_fg = user32.GetForegroundWindow()

# Bring Wayfern to front for milliseconds
fg_tid, _ = win32process.GetWindowThreadProcessId(prev_fg)
cur_tid = kernel32.GetCurrentThreadId()
user32.AttachThreadInput(cur_tid, fg_tid, True)
user32.ShowWindow(hwnd, 9) # SW_RESTORE
user32.BringWindowToTop(hwnd)
user32.SetForegroundWindow(hwnd)
user32.AttachThreadInput(cur_tid, fg_tid, False)
time.sleep(0.3)

pyautogui.FAILSAFE = False

# Target: migalhas.com.br
target_domain = "migalhas.com.br"
target_url = f"https://app.ahrefs.com/site-explorer/organic-competitors?target={target_domain}"
pyperclip.copy(target_url)

pyautogui.hotkey('ctrl', 'l')
time.sleep(0.1)
pyautogui.hotkey('ctrl', 'v')
time.sleep(0.1)
pyautogui.press('enter')
print(f"URL enviada para Ahrefs: {target_domain} aos {round(time.time() - t0, 2)}s")

# Immediately restore user window
if prev_fg and prev_fg != hwnd:
    user32.SetForegroundWindow(prev_fg)
    print(f"Janela da usuária restaurada aos {round(time.time() - t0, 2)}s!")

# Wait 7.5 seconds for page load in background
time.sleep(7.5)

# Bring up to capture and scroll
user32.ShowWindow(hwnd, 9)
user32.SetForegroundWindow(hwnd)
time.sleep(0.4)

im1 = ImageGrab.grab()
save1 = r"C:\Users\Kethely\.gemini\antigravity\brain\960671fd-d9a7-4b78-835f-9845d66aa859\scratch\migalhas_top.png"
im1.save(save1)

# Scroll down for rows 10-20
pyautogui.click(600, 750)
pyautogui.press('pagedown')
time.sleep(0.4)

im2 = ImageGrab.grab()
save2 = r"C:\Users\Kethely\.gemini\antigravity\brain\960671fd-d9a7-4b78-835f-9845d66aa859\scratch\migalhas_bottom.png"
im2.save(save2)

# Minimize Wayfern cleanly
user32.ShowWindow(hwnd, 6) # SW_MINIMIZE
if prev_fg and prev_fg != hwnd:
    user32.SetForegroundWindow(prev_fg)

total_time = round(time.time() - t0, 2)
print(f"CONCLUÍDO! Tempo total cronometrado: {total_time} segundos.")

with open(r"C:\Users\Kethely\.gemini\antigravity\brain\960671fd-d9a7-4b78-835f-9845d66aa859\scratch\timing_result.txt", "w", encoding="utf-8") as f:
    f.write(f"{total_time}")
