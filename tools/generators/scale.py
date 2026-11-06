p='c9.py'; s=open(p).read()
R=[
# Canaan: olive trees ~6.5 m, goat-hair tent ~2.6 m high, 10 m long (a person 1.7 m = 255 x depth)
("'x': 250, 'y': 692, 'h': 250, 'kind': 'living'", "'x': 250, 'y': 692, 'h': 160, 'kind': 'living'"),
("'x': 1390, 'y': 696, 'h': 270, 'kind': 'living'", "'x': 1390, 'y': 696, 'h': 170, 'kind': 'living'"),
("'x': 720, 'y': 720, 'w': 520, 'h': 200, 'lit': lit", "'x': 720, 'y': 724, 'w': 330, 'h': 90, 'lit': lit"),
# halls: doors 2 x 4 m, braziers 1 m with a small flame
("'doors': [{'x': 1260, 'w': 150, 'h': 240, 'lit': True}]", "'doors': [{'x': 1260, 'w': 60, 'h': 110, 'lit': True}]"),
("{'type': 'brazier', 'depth': 0.3, 'x': 560, 'y': 790, 's': 1},", "{'type': 'brazier', 'depth': 0.3, 'x': 560, 'y': 790, 's': 0.6},"),
("{'type': 'brazier', 'depth': 0.3, 'x': 1040, 'y': 790, 's': 1},", "{'type': 'brazier', 'depth': 0.3, 'x': 1040, 'y': 790, 's': 0.6},"),
("'pos': [560, 718], 'h': 60,", "'pos': [560, 742], 'h': 20,"),
("'pos': [1040, 718], 'h': 60,", "'pos': [1040, 742], 'h': 20,"),
# household
("brothers = [light([1010 + i * 40, 744 + (i % 2) * 3], 50 + (i % 3) * 3,", "brothers = [light([1010 + i * 40, 744 + (i % 2) * 3], 56 + (i % 3) * 3,"),
("    light([920, 744], 40, depth=0.24, **prophet),", "    light([920, 744], 46, depth=0.24, **prophet),"),
("    light([960, 746], 32, depth=0.24,", "    light([960, 746], 38, depth=0.24,"),
("{'type': 'brazier', 'depth': 0.26, 'x': 620, 'y': 772, 's': 0.6},", "{'type': 'brazier', 'depth': 0.26, 'x': 620, 'y': 772, 's': 0.5},"),
("'pos': [620, 734], 'h': 30,", "'pos': [620, 738], 'h': 14,"),
# stars: Yusuf a boy
("      light([900, 744], 40, depth=0.24, pose='kneel', **prophet),", "      light([900, 744], 46, depth=0.24, pose='kneel', **prophet),"),
("      light([800, 780], 44, depth=0.3, **prophet),", "      light([800, 780], 58, depth=0.3, **prophet),"),
# the well: a curb 1.8 m across and 0.9 m high, its frame 2.2 m; a 5 m thorn tree
("walkers = [light([1150 + i * 36, 740], 50,", "walkers = [light([1150 + i * 36, 740], 62,"),
("'x': 1180, 'y': 712, 'h': 220, 'kind': 'bare'", "'x': 1180, 'y': 712, 'h': 150, 'kind': 'bare'"),
("{'type': 'well', 'depth': 0.24, 'x': 860, 'y': 742, 'w': 200, 'h': 70, 'frame': False},", "{'type': 'well', 'depth': 0.24, 'x': 860, 'y': 742, 'w': 66, 'h': 32, 'frame': False},"),
("      light([960, 742], 40, depth=0.25, **prophet_day,", "      light([960, 742], 49, depth=0.25, **prophet_day,"),
("      light([800, 820], 42, depth=0.3, pose='kneel', **prophet),", "      light([800, 820], 58, depth=0.3, pose='kneel', **prophet),"),
("*[light([1060 + i * 40, 746], 50, depth=0.235,", "*[light([1060 + i * 40, 746], 60, depth=0.235,"),
# caravan: camels 2 m at the hump, people beside them
("camels = {'type': 'animals', 'depth': 0.235, 'size': 0.8,", "camels = {'type': 'animals', 'depth': 0.235, 'size': 0.76,"),
("trek = {'type': 'animals', 'depth': 0.16, 'size': 0.8,", "trek = {'type': 'animals', 'depth': 0.16, 'size': 0.52,"),
("'x': 600, 'y': 712, 'h': 220, 'kind': 'bare'", "'x': 600, 'y': 712, 'h': 150, 'kind': 'bare'"),
("{'type': 'well', 'depth': 0.24, 'x': 860, 'y': 742, 'w': 200, 'h': 70, 'frame': True},", "{'type': 'well', 'depth': 0.24, 'x': 860, 'y': 742, 'w': 66, 'h': 32, 'frame': True},"),
("      light([960, 744], 52, depth=0.25, **dim),", "      light([930, 744], 64, depth=0.25, **dim),"),
("      light([1010, 748], 50, depth=0.25, **dim),", "      light([1000, 748], 62, depth=0.25, **dim),"),
("light([860, 724], 38, depth=0.245, show=[1, None], **prophet_day, pose='walk', path=[[860, 760], [900, 742]], dur=4000, delay=800)",
 "light([872, 746], 48, depth=0.245, show=[1, None], **prophet_day, pose='walk', path=[[862, 712], [890, 748]], dur=4000, delay=800)"),
("light([1240, 696], 46, depth=0.16,", "light([1240, 696], 41, depth=0.16,"),
("light([1272, 696], 34, depth=0.16,", "light([1272, 696], 32, depth=0.16,"),
# Egypt: a boy, then a young man
("light([920, 752], 40, depth=0.24, **prophet_day, pose='walk', path=[[700, 760], [1080, 748]], dur=9000, at={'1': {'h': 58,",
 "light([920, 752], 47, depth=0.24, **prophet_day, pose='walk', path=[[700, 760], [1080, 748]], dur=9000, at={'1': {'h': 61,"),
# the torn shirt: grown people in the hall at depth 0.32 are about 80
("    light([760, 778], 52, depth=0.32,", "    light([760, 778], 77, depth=0.32,"),
("    light([860, 776], 62, depth=0.32, **prophet,", "    light([860, 776], 82, depth=0.32, **prophet,"),
("    light([1262, 712], 56, depth=0.185,", "    light([1262, 712], 47, depth=0.185,"),
# prison
("'doors': [{'x': 1240, 'w': 120, 'h': 200}]", "'doors': [{'x': 1240, 'w': 40, 'h': 66}]"),
("    light([860, 786], 56, depth=0.3, pose='kneel',", "    light([860, 786], 77, depth=0.3, pose='kneel',"),
("    light([1000, 790], 54, depth=0.3,", "    light([1000, 790], 75, depth=0.3,"),
("    light([1090, 792], 52, depth=0.3,", "    light([1090, 792], 73, depth=0.3,"),
# the dais: five low steps and a platform, 1.4 m in all
("light([800, 526], 60, depth=0.2, color='#c89878'", "light([800, 674], 51, depth=0.2, color='#c89878'"),
("bros = [light([700 + i * 40, 788 + (i % 2) * 3], 50, depth=0.32,", "bros = [light([640 + i * 48, 788 + (i % 2) * 3], 80, depth=0.32,"),
("path=[[1350 + i * 40, 796], [700 + i * 40, 788]]", "path=[[1350 + i * 48, 796], [640 + i * 48, 788]]"),
("'path': [[700 + i * 40, 788], [1500 + i * 40, 796]]", "'path': [[640 + i * 48, 788], [1500 + i * 48, 796]]"),
("light([1110, 790], 42, depth=0.32, show=[1, None], color='#f8e0c0', glow=0.45, bright=1.1, solid=0.5, pose='walk', path=[[1420, 798], [1110, 790]], dur=7000)",
 "light([1140, 790], 76, depth=0.32, show=[1, None], color='#f8e0c0', glow=0.45, bright=1.1, solid=0.5, pose='walk', path=[[1450, 798], [1140, 790]], dur=7000)"),
("'pos': [1132, 780], 'h': 16,", "'pos': [1162, 762], 'h': 9,"),
("*[light([1080 + i * 40, 748], 50, depth=0.235,", "*[light([1080 + i * 40, 748], 60, depth=0.235,"),
("bow11 = [light([620 + i * 46, 800], 48, depth=0.32,", "bow11 = [light([540 + i * 52, 800], 80, depth=0.32,"),
("      light([744, 552], 56, depth=0.2, show=[2, None], **prophet),", "      light([750, 674], 51, depth=0.2, show=[2, None], **prophet),"),
("      light([856, 552], 50, depth=0.2, show=[2, None],", "      light([850, 674], 48, depth=0.2, show=[2, None],"),
("'pos': [840, 726], 'h': 60, 'color': '#ffffff'", "'pos': [842, 738], 'h': 22, 'color': '#ffffff'"),
]
for a,b in R:
    n=s.count(a); assert n>=1, a
    s=s.replace(a,b)
# the dais itself and Yusuf on it (three scenes)
n=s.count("'w': 560, 'steps': 6, 'rise': 22, 'dais': 50,"); s=s.replace("'w': 560, 'steps': 6, 'rise': 22, 'dais': 50,","'w': 420, 'steps': 5, 'rise': 6, 'dais': 12,"); print('dais',n)
n=s.count("light([800, 548], 60, depth=0.2, **prophet)"); s=s.replace("light([800, 548], 60, depth=0.2, **prophet)","light([800, 674], 51, depth=0.2, **prophet)"); print('yusuf on dais',n)
open(p,'w').write(s)
