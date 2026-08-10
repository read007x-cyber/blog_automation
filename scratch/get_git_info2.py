import subprocess

cwd = "/Users/jsh/main"

res = subprocess.run(["git", "log", "-1"], capture_output=True, text=True, cwd=cwd)
print("Latest Commit Log:")
print(res.stdout.strip())

res_count = subprocess.run(["git", "rev-list", "--count", "HEAD"], capture_output=True, text=True, cwd=cwd)
print("Total Commits Count:", res_count.stdout.strip())
