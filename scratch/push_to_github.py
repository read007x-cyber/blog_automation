import subprocess

cwd = "/Users/jsh/main"
remote_url = "https://github.com/read007x-cyber/blog_automation.git"

res_remote = subprocess.run(["git", "remote", "get-url", "origin"], capture_output=True, text=True, cwd=cwd)
if res_remote.returncode == 0:
    subprocess.run(["git", "remote", "set-url", "origin", remote_url], cwd=cwd)
else:
    subprocess.run(["git", "remote", "add", "origin", remote_url], cwd=cwd)

res_push = subprocess.run(["git", "push", "-u", "origin", "master"], capture_output=True, text=True, cwd=cwd)
print("Push Return Code:", res_push.returncode)
print("Push Output:\n", res_push.stdout)
print("Push Error/Info:\n", res_push.stderr)
