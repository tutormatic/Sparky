import subprocess
import sys

if sys.argv[2] == "exec":
    completed_process = subprocess.run(sys.argv[1], shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

    if completed_process.returncode != 0:
        print(f"Error: {completed_process.stderr}")
    else:
        print(completed_process.stdout)
    
        print(completed_process.stderr)
else:
    # This is for the none selected code
