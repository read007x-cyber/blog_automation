import subprocess
import os

env = os.environ.copy()
env["NAVER_ID"] = "read007x"
env["NAVER_PW"] = "!9dnjf17dlf"

topic_dir = "/Users/jsh/main/output/아쿠아슈즈 인기와 가성비 비교 분석"

res = subprocess.run(["node", "/Users/jsh/main/scripts/naver_auto_upload.js", topic_dir], env=env, capture_output=True, text=True, cwd="/Users/jsh/main")

print("Naver Upload Execution Return Code:", res.returncode)
print("Naver Upload Output:\n", res.stdout)
print("Naver Upload Error Info:\n", res.stderr)
