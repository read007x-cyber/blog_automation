import subprocess

try:
    res = subprocess.run(["gh", "auth", "status"], capture_output=True, text=True)
    print("GH Auth Output:")
    print(res.stdout)
    print(res.stderr)
    print("Return Code:", res.returncode)
except Exception as e:
    print("GH CLI error:", e)
