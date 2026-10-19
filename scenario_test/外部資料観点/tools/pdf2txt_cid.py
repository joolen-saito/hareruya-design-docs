"""ToUnicode の無い CID フォント(Adobe-Japan1)の文字を Unicode へ戻してテキスト化する。
使い方: pdf2txt_cid.py <CMapファイル(UniJIS-UTF32-H)> <入力PDF> <出力txt>
ToUnicode を持つフォントの文字はそのまま使い、持たないフォントの文字だけを CID とみなして復号する。
"""
import re
import sys

import pypdf

cmap_path, src, dst = sys.argv[1], sys.argv[2], sys.argv[3]

# CID -> Unicode の逆引き表を作る（同じCIDに複数のUnicodeがあれば最小の符号位置を採る）
cid2uni = {}
mode = None
for line in open(cmap_path, encoding="latin-1"):
    line = line.strip()
    if line.endswith("begincidrange"):
        mode = "range"
        continue
    if line.endswith("begincidchar"):
        mode = "char"
        continue
    if line.startswith("end"):
        mode = None
        continue
    if mode == "range":
        m = re.match(r"<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*(\d+)", line)
        if m:
            lo, hi, cid = int(m.group(1), 16), int(m.group(2), 16), int(m.group(3))
            for i, u in enumerate(range(lo, hi + 1)):
                c = cid + i
                if c not in cid2uni or u < cid2uni[c]:
                    cid2uni[c] = u
    elif mode == "char":
        m = re.match(r"<([0-9a-fA-F]+)>\s*(\d+)", line)
        if m:
            u, c = int(m.group(1), 16), int(m.group(2))
            if c not in cid2uni or u < cid2uni[c]:
                cid2uni[c] = u


def needs_cid_decode(font_dict):
    if font_dict is None:
        return False
    try:
        if "/ToUnicode" in font_dict:
            return False
        enc = font_dict.get("/Encoding")
        if enc is None or "Identity" not in str(enc):
            return False
        return True
    except Exception:
        return False


reader = pypdf.PdfReader(src)
with open(dst, "w", encoding="utf-8") as f:
    for i, page in enumerate(reader.pages, start=1):
        parts = []

        def visitor(text, cm, tm, font_dict, font_size):
            if not text:
                return
            if needs_cid_decode(font_dict):
                out = []
                for ch in text:
                    code = ord(ch)
                    if ch in "\n\r":
                        out.append(ch)
                    elif code in cid2uni:
                        out.append(chr(cid2uni[code]))
                    else:
                        out.append(ch)
                parts.append("".join(out))
            else:
                parts.append(text)

        try:
            page.extract_text(visitor_text=visitor)
        except Exception as e:
            parts.append(f"[抽出失敗: {e}]")
        f.write(f"\n=====PAGE {i}=====\n")
        f.write("".join(parts))
print(dst, len(reader.pages), "pages")
