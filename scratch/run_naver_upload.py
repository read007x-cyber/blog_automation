import subprocess
import os
import sys

env = os.environ.copy()
env["NAVER_ID"] = "read007x"

topic_dir = "/Users/jsh/main/output/아쿠아슈즈 인기와 가성비 비교 분석"
mode = sys.argv[1] if len(sys.argv) > 1 else "draft"

res = subprocess.run(["node", "/Users/jsh/main/scripts/naver_auto_upload.js", topic_dir, mode], env=env, capture_output=True, text=True, cwd="/Users/jsh/main")

print("Naver Upload Execution Return Code:", res.returncode)
print("Naver Upload Output:\n", res.stdout)
print("Naver Upload Error Info:\n", res.stderr)
