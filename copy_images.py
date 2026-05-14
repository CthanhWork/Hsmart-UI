import os
import random
import shutil

src_dir = r"D:\AI_Datasource\lvis\val2017\val2017"
dest_dir = r"d:\H-smart UI\public\products"

os.makedirs(dest_dir, exist_ok=True)

all_files = [f for f in os.listdir(src_dir) if f.endswith('.jpg')]
selected_files = random.sample(all_files, min(40, len(all_files)))

for f in selected_files:
    shutil.copy(os.path.join(src_dir, f), os.path.join(dest_dir, f))

print(f"Copied {len(selected_files)} images to {dest_dir}")
