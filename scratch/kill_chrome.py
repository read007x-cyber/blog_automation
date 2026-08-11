import subprocess

subprocess.run(["pkill", "-f", "Google Chrome for Testing"])
subprocess.run(["pkill", "-f", "naver_user_data"])
print("Killed remaining chrome instances.")
