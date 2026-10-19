"""PDFをページ番号付きテキストへ変換する。使い方: pdf2txt.py <入力PDF> <出力txt>"""
import sys
import pypdf

src, dst = sys.argv[1], sys.argv[2]
reader = pypdf.PdfReader(src)
with open(dst, "w", encoding="utf-8") as f:
    for i, page in enumerate(reader.pages, start=1):
        try:
            text = page.extract_text() or ""
        except Exception as e:  # 壊れたページは飛ばして記録する
            text = f"[抽出失敗: {e}]"
        f.write(f"\n=====PAGE {i}=====\n")
        f.write(text)
print(dst, len(reader.pages), "pages")
