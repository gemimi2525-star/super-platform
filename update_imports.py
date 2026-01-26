
import os

REPLACEMENTS = {
    "'@platform/core'": "'@/lib/core'",
    '"@platform/core"': '"@/lib/core"',
    
    "'@platform/ui-kit'": "'@super-platform/ui'",
    '"@platform/ui-kit"': '"@super-platform/ui"',
    
    "'@platform/ui'": "'@super-platform/ui-base'",
    '"@platform/ui"': '"@super-platform/ui-base"',
    
    "'@platform/firebase'": "'@/lib/firebase'",
    '"@platform/firebase"': '"@/lib/firebase"',
    
    "'@platform/firebase-admin'": "'@/lib/firebase-admin'",
    '"@platform/firebase-admin"': '"@/lib/firebase-admin"',
    
    "'@platform/types'": "'@/lib/types'",
    '"@platform/types"': '"@/lib/types"',
    
    "'@modules/": "'@/modules/",
    '"@modules/': '"@/modules/',
}

ROOT_DIR = '/Users/jukkritsuwannakum/Super-Platform'

def update_file(filepath):
    try:
        with open(filepath, 'r') as f:
            content = f.read()
        
        new_content = content
        for old, new in REPLACEMENTS.items():
            new_content = new_content.replace(old, new)
            
        if content != new_content:
            with open(filepath, 'w') as f:
                f.write(new_content)
            print(f"Updated: {filepath}")
    except Exception as e:
        print(f"Error reading {filepath}: {e}")

for root, dirs, files in os.walk(ROOT_DIR):
    if 'node_modules' in root or '.git' in root or '.next' in root:
        continue
    for file in files:
        if file.endswith(('.ts', '.tsx', '.js', '.jsx', '.json')):
            # Skip package.json and lock files
            if file == 'package.json' or file == 'package-lock.json':
                continue
            update_file(os.path.join(root, file))
