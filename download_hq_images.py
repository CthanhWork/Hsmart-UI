import os
import urllib.request

urls = [
    ("iphone.jpg", "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80"),
    ("macbook.jpg", "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80"),
    ("headphones.jpg", "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80"),
    ("camera.jpg", "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80"),
    ("watch.jpg", "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80"),
    ("mouse.jpg", "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80"),
    ("keyboard.jpg", "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=800&q=80"),
    ("laptop_desk.jpg", "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=800&q=80"),
    ("shoes.jpg", "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80"),
    ("perfume.jpg", "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80"),
    ("speaker.jpg", "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80"),
    ("ipad.jpg", "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80"),
    ("drone.jpg", "https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?auto=format&fit=crop&w=800&q=80"),
    ("gamepad.jpg", "https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?auto=format&fit=crop&w=800&q=80"),
    ("vr.jpg", "https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?auto=format&fit=crop&w=800&q=80"),
    ("sunglasses.jpg", "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80"),
    ("backpack.jpg", "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80"),
    ("tshirt.jpg", "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80"),
    ("jeans.jpg", "https://images.unsplash.com/photo-1542272604-780c40fb2814?auto=format&fit=crop&w=800&q=80"),
    ("hat.jpg", "https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=800&q=80"),
    ("makeup.jpg", "https://images.unsplash.com/photo-1596462502278-27bf85033e5a?auto=format&fit=crop&w=800&q=80"),
    ("skincare.jpg", "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80"),
    ("coffee_maker.jpg", "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=800&q=80"),
    ("blender.jpg", "https://images.unsplash.com/photo-1585237832868-d010c14b6fc7?auto=format&fit=crop&w=800&q=80"),
    ("vacuum.jpg", "https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=800&q=80"),
    ("microwave.jpg", "https://images.unsplash.com/photo-1585827552668-d0728b355e3c?auto=format&fit=crop&w=800&q=80"),
    ("tv.jpg", "https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=800&q=80"),
    ("monitor.jpg", "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80"),
    ("printer.jpg", "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=800&q=80"),
    ("router.jpg", "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80"),
    ("smart_home.jpg", "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80"),
    ("desk_lamp.jpg", "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80"),
    ("office_chair.jpg", "https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?auto=format&fit=crop&w=800&q=80"),
    ("bookshelf.jpg", "https://images.unsplash.com/photo-1594620302200-9a762244a156?auto=format&fit=crop&w=800&q=80"),
    ("plant.jpg", "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=800&q=80"),
    ("water_bottle.jpg", "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80"),
    ("yoga_mat.jpg", "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=800&q=80"),
    ("dumbbell.jpg", "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=800&q=80"),
    ("bicycle.jpg", "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80"),
    ("tent.jpg", "https://images.unsplash.com/photo-1504280390227-331bef208f64?auto=format&fit=crop&w=800&q=80")
]

dest_dir = r"d:\H-smart UI\public\products_hq"
os.makedirs(dest_dir, exist_ok=True)

import ssl
ssl._create_default_https_context = ssl._create_unverified_context

for name, url in urls:
    filepath = os.path.join(dest_dir, name)
    if not os.path.exists(filepath):
        try:
            urllib.request.urlretrieve(url, filepath)
            print(f"Downloaded {name}")
        except Exception as e:
            print(f"Failed to download {name}: {e}")
    else:
        print(f"Already have {name}")

print("Done downloading 40 HQ images.")
