"""PDFの指定ページをPNGに描き出す。使い方: render.py <PDF> <出力接頭辞> <ページ...>"""
import sys
import fitz
doc = fitz.open(sys.argv[1])
for p in sys.argv[3:]:
    pg = doc[int(p) - 1]
    pix = pg.get_pixmap(dpi=110)
    out = f"{sys.argv[2]}_p{p}.png"
    pix.save(out)
    print(out, pix.width, pix.height)
