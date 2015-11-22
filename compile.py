import glob, os, re, fileinput
from subprocess import call
from shutil import move

# this script will change the PROD value in consts.js to the production value before compilation by requireJs
print 'Turning on PROD flag...'
for root, dirs, files in os.walk("fireworks-client\src"):
    if root.endswith(".module-cache"):
        continue
    for file in files:
        if file == "consts.js":
             constFile = (os.path.join(root, file))

for line in fileinput.input(files=[constFile], inplace=1, backup='.bak'):
    line = re.sub(r'(PROD[\s]*:[\s]*)false', r'\1true', line.rstrip())
    print(line)

# compile the project...
call(["node", "tools/r.js", "-o", "build.js"]);

# recover the file we just edited
print 'Turning off PROD flag...'
move(constFile + '.bak', constFile)