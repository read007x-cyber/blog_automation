import subprocess
import os

cwd = "/Users/jsh/main"

# /Users/jsh/main 경로에 독립된 git 저장소 생성
subprocess.run(["git", "init"], cwd=cwd)
subprocess.run(["git", "add", "."], cwd=cwd)
subprocess.run(["git", "commit", "-m", "Initial commit: Standalone Blog Automation System"], cwd=cwd)

print("Git Status in /Users/jsh/main:")
subprocess.run(["git", "status"], cwd=cwd)
