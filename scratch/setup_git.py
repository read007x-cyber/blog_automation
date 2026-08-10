import subprocess
import os

cwd = "/Users/jsh/main"

# 1. Git 저장소 초기화 여부 확인 및 init
try:
    res = subprocess.run(["git", "rev-parse", "--is-inside-work-tree"], capture_output=True, text=True, cwd=cwd)
    if res.returncode != 0:
        subprocess.run(["git", "init"], cwd=cwd)
except Exception as e:
    subprocess.run(["git", "init"], cwd=cwd)

# 2. 파일 추적 스테이징
subprocess.run(["git", "add", "."], cwd=cwd)

# 3. 커밋 메시지 작성 및 커밋
commit_msg = "Initial commit: Blog Automation System and Agents Setup"
subprocess.run(["git", "commit", "-m", commit_msg], cwd=cwd)

print("Git repository status:")
subprocess.run(["git", "status"], cwd=cwd)
