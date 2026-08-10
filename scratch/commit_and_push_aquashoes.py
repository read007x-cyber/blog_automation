import subprocess

cwd = "/Users/jsh/main"

subprocess.run(["git", "add", "."], cwd=cwd)
commit_msg = "Add Aqua Shoes comparison post results and 5Step publishing log"
subprocess.run(["git", "commit", "-m", commit_msg], cwd=cwd)
res_push = subprocess.run(["git", "push", "origin", "master"], capture_output=True, text=True, cwd=cwd)

print("Push Return Code:", res_push.returncode)
print("Push Output:\n", res_push.stdout)
print("Push Error/Info:\n", res_push.stderr)
