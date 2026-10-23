#!/usr/bin/env python3
"""実在しない試験用のURL（https://…example.test…）の置き換え規則（依頼者決定 2026-10-21）。 urlmap.py

依頼者「既存画像URLに https://example.test から始まるURLが記載されているが、これが実在しない」への決定。
- カード画像のURL（カード登録CSVの「画像URL(日本語)」「画像URL(英語)」、DBに直接入れるカード画像、APIが返すカード画像URL）は、
  設計書の記入例（0208 カード登録CSV「img/goods/L/TDM/en_7de21787f2._jpg」、0510 API「img/goods/card/AKH/jp/scarab_feast.jpg」）と
  同じ形の相対パス img/goods/<元のパス> にする。M14-04 の既存画像URLだけは、同じシードの2行目（img/m1404/029-2.jpg）に揃える。
- それ以外（バナーの画像URL・リンク先URL、帯URL、GOOGLE MAP URL、デッキの出典URL・引用元URL、記事URL、配信の基点など）は、
  検証用ドメイン https://replace-dev.hareruyamtg.com:8443 にする（依頼者「https://replace-dev.hareruyamtg.com:8443/が検証用ドメインです」）。
  サブドメインはパスの先頭へ移す（https://cdn.example.test/x.png → https://replace-dev.hareruyamtg.com:8443/cdn/x.png）。
  スキーム（http・https・大文字の HTTP）はそのまま残す（サイトマップの組み立てを確かめるケースが区別に使う）。
- スマレジの接続先（https://smaregi-….example.test）は外部システムのURLなので変えない。メールアドレス（…@example.test）も変えない。
- 文字数の境界値（「https://example.test/」に a を N 文字連結した合計 M 文字）は、接頭が20文字伸びる分 a を20文字減らす（合計は変わらない）。

N(text) は何度当てても同じ（置き換えた後の文に example.test は残らない）。
"""
import re

DOMAIN = "replace-dev.hareruyamtg.com:8443"
OLD_ROOT = "https://example.test/"
NEW_ROOT = f"https://{DOMAIN}/"
GROW = len(NEW_ROOT) - len(OLD_ROOT)   # 20

# スキーム://（サブドメイン.）example.test（/パス）。パスは ASCII の文字だけ（直後の日本語は含めない）。
# パスの途中に別のURLのスキームが続くとき（配信の基点＋登録値「…/HTTP://…」）は、そこで切る
URL = re.compile(r"(?i)(https?)://((?:[a-z0-9-]+\.)*)example\.test(?![a-z0-9-])"
                 r"(/(?:(?![A-Za-z][A-Za-z0-9+.\-]*://)[A-Za-z0-9._~%/\-])*)?")

# 文字数の境界値。接頭を検証用ドメインにして、連結する a を GROW 文字減らす
LEN_QUOTED = re.compile(r"「https://example\.test/」(に|へ)(英字a|半角英字「a」|「a」)を(\d+)文字")
LEN_PLAIN = re.compile(rf"{len(OLD_ROOT)}文字のhttps://example\.test/にaを(\d+)文字")

CARD_FIXED = {"cards/m14-04-029.jpg": "img/m1404/029-1.jpg"}
CARD_NAMES = {"a-jp.jpg", "a-en.jpg", "b-jp.jpg", "b-en.jpg", "pe-card.png"}   # M14-01・F06-16・F06-17 のカード登録CSV


def is_card_image(sub, path):
    """カード画像のURLか（A14-01・A14-03・A15-12・F06-16・F06-17・M14-01・M14-04・M15-06）"""
    if sub.lower() == "img.":                                   # A15-12 の日本語画像・英語画像
        return True
    return bool(re.fullmatch(r"a14-01-\d+/[^/]+\.jpg", path)   # A14-01 のカード画像（記事URL a14-01-008/article は除く）
                or re.match(r"a14-03[-/]", path)               # A14-03
                or path in CARD_NAMES
                or path.startswith("cards/"))                   # M14-04・M15-06


def _url(m):
    scheme, sub, path = m.group(1), m.group(2), m.group(3) or ""
    if sub.lower().startswith("smaregi"):
        return m.group(0)
    core = path.lstrip("/").rstrip(".-")
    tail = path[len(path.rstrip(".-")):]
    if core and is_card_image(sub, core):
        return CARD_FIXED.get(core, f"img/goods/{core}") + tail
    host = DOMAIN + ("/" + sub.rstrip(".").replace(".", "/") if sub else "")
    return f"{scheme}://{host}{path}"


def N(text):
    if "example.test" not in text.lower():
        return text
    text = LEN_QUOTED.sub(lambda m: f"「{NEW_ROOT}」{m.group(1)}{m.group(2)}を{int(m.group(3)) - GROW}文字", text)
    text = LEN_PLAIN.sub(lambda m: f"{len(NEW_ROOT)}文字の{NEW_ROOT}にaを{int(m.group(1)) - GROW}文字", text)
    return URL.sub(_url, text)


def left(text):
    """置き換えずに残った example.test のURL（スマレジの接続先を除く）"""
    return [m.group(0) for m in URL.finditer(text) if not m.group(2).lower().startswith("smaregi")]
