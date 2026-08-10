import subprocess

cwd = "/Users/jsh/main"
res = subprocess.run(["node", "/Users/jsh/main/scripts/naver_login_session.js"], capture_output=True, text=True, cwd=cwd)

print("Login Session Window Output:")
print(res.stdout)
print(res.stderr)
