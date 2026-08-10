import subprocess

cwd = "/Users/jsh/main"

def run_git(cmd_args):
    res = subprocess.run(["git"] + cmd_args, capture_output=True, text=True, cwd=cwd)
    return res.stdout.strip()

print("Branch:", run_git(["branch", "--show-current"]))
print("Remote:", run_git(["remote", "v"]))
print("Log:\n", run_git(["log", "n", "1"]))
print("Status:\n", run_git(["status", "short"]))
