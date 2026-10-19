"""PDFの1ページの一部を高解像度で切り出す。使い方: render_clip.py <PDF> <ページ> <y0比> <y1比> <出力>"""
import sys
import pymupdf
doc = pymupdf.open(sys.argv[1])
pg = doc[int(sys.argv[2]) - 1]
r = pg.rect
clip = pymupdf.Rect(r.x0, r.y0 + r.height * float(sys.argv[3]), r.x1, r.y0 + r.height * float(sys.argv[4]))
pix = pg.get_pixmap(dpi=220, clip=clip)
pix.save(sys.argv[5]); print(sys.argv[5], pix.width, pix.height)
