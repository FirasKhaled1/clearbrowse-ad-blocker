import os
import struct
import zlib

# Change this to 'shield', 'stop_sign', or 'eye'
SHAPE_STYLE = 'eye'

def create_icon_png(size, is_gray=False):
    width = size
    height = size
    raw_rows = []

    c_bg = (0, 0, 0, 0)
    c_main = (128, 128, 128, 255) if is_gray else (3, 169, 244, 255)
    c_inner = (255, 255, 255, 255)

    cx, cy = (width - 1) / 2.0, (height - 1) / 2.0
    r = size * 0.44

    for y in range(height):
        row = bytearray([0])
        for x in range(width):
            dx = (x - cx) / r
            dy = (y - cy) / r
            
            in_shape = False
            in_mark = False

            if SHAPE_STYLE == 'shield':
                in_shape = (dx**2 + (dy - 0.1)**2 <= 1.0) and (dy <= 0.85 - 0.45 * abs(dx))
                in_mark = (abs(dx) <= 0.22) and (-0.45 <= dy <= 0.35)
                
            elif SHAPE_STYLE == 'stop_sign':
                # An octagon with a white "minus" line in the center
                in_shape = (abs(dx) + abs(dy) <= 1.25) and (abs(dx) <= 0.95) and (abs(dy) <= 0.95)
                in_mark = (abs(dy) <= 0.2) and (abs(dx) <= 0.6)
                
            elif SHAPE_STYLE == 'eye':
                # An almond eye shape with a circular pupil
                in_shape = abs(dy) <= 0.6 * (1.0 - dx**2)
                in_mark = (dx**2 + dy**2)**0.5 <= 0.3

            if in_shape and in_mark:
                row.extend(c_inner)
            elif in_shape:
                row.extend(c_main)
            else:
                row.extend(c_bg)
                
        raw_rows.append(bytes(row))

    raw_data = b"".join(raw_rows)
    compressed_data = zlib.compress(raw_data)
    png = bytearray(b"\x89PNG\r\n\x1a\n")
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    png.extend(struct.pack(">I", len(ihdr)) + b"IHDR" + ihdr + struct.pack(">I", zlib.crc32(b"IHDR" + ihdr)))
    png.extend(struct.pack(">I", len(compressed_data)) + b"IDAT" + compressed_data + struct.pack(">I", zlib.crc32(b"IDAT" + compressed_data)))
    png.extend(struct.pack(">I", 0) + b"IEND" + struct.pack(">I", zlib.crc32(b"IEND")))
    return bytes(png)

os.makedirs("icons", exist_ok=True)
for dimension in [16, 48, 128]:
    with open(f"icons/icon{dimension}.png", "wb") as f:
        f.write(create_icon_png(dimension, is_gray=False))
    with open(f"icons/icon{dimension}_gray.png", "wb") as f:
        f.write(create_icon_png(dimension, is_gray=True))

print(f"Generated {SHAPE_STYLE} icons successfully.")