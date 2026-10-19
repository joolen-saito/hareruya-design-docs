from common import *
hdr, I = load('F03-03')
O = []
B_PLAIN = "M03-27 L0092・L0119・L0123・L0124・L0129・L0134、M03-02 L0075〜L0077、M03-09 L0130〜L0134"
B_CARD = B_PLAIN + "、M03-02 L0092・L0146（識別ID 35）"
WHY_ANY = "元の『任意の金額』『登録済みの任意の1件』は、CSV に具体値が要るので基準価格・販売価格1000、買取価格100、原価単価10、サイズ1、重量1、サプライ・グッズのカテゴリにした（商品名(英)は商品名と同じ値）。支店の商品公開ステータスは、元のシードが『非公開』と書いた商品だけ0、書いていない商品は ee の初期値の1（公開）とした。"
WHY_SPEC = "CSVが作る状態ニアミントの規格の公開ステータスを規格の画面で『公開』にする（元の手順で規格の公開ステータスを公開にしていたため）。"
WHY_CARD = "カード指定で自動で入る商品名は、元のシードの商品名に入れ直す。"
FIX = {}  # sid -> (list of replacements)

def run(sid, old, rows, builders, basis, why, extra=None):
    s = old.split('。')
    for pat, new in builders:
        sub(s, pat, new, n=(len(new) if isinstance(new, list) else 1)) if isinstance(new, list) else sub(s, pat, new)
    O.append([sid, "直す", joined(s), "", basis, why])

def loopintro(n): return f"次を商品コードごとに1件ずつ行う。"

def card_edit(name, cat=None, extra="", loop=True):
    t = open_edit(None) + "、" + card_pick() + f"。続けて商品名(日)に「{name}」、商品名(英)に「{name}」を入れ（カード指定で自動で入った値は書き換える）、"
    if cat: t += f"商品カテゴリはサプライ・グッズの選択を外して「{cat}」を選び、"
    t += extra + DISC + "「商品を登録」ボタンを押す"
    return t

SPEC_LIST = spec_list_open()
def spec_after(lang="日本語", extras=""):
    return SPEC_LIST + "。" + spec_edit_nm(lang, extras)

for r in I:
    sid, old = r[0], r[5]
    k = sid[len('S-F03-03-'):]
    s = old.split('。')
    why = WHY_ANY + WHY_SPEC
    basis = B_PLAIN
    if k == 'STORE-001':
        code = "HQ-001-F0303-001"
        sub(s, r'^商品登録編集画面で商品名に「F0303-MODAL-001」', csv_upload([csv_row(code, "F0303-MODAL-001", pub=2, branch=0)]) + "。" + spec_open_edit(code))
        sub(s, r'^商品規格登録編集画面で商品コードに「HQ-001-F0303-001」', None)
        sub(s, r'^商品登録編集画面に戻り', None)
    elif k == 'CARRY-005':
        code = "URL-F0303-005"; nm = "F0303-URL-005"
        tag = "〔タグID-F0303-005〕に控えたタグのID"
        sub(s, r'^商品登録編集画面で商品名に任意の名称', csv_upload([csv_row(code, nm, tag=tag)]) + "。" + open_edit(code)
            + f"、商品カテゴリはサプライ・グッズの選択を外して「表示対象カテゴリ」を選び、" + DISC + "「商品を登録」ボタンを押す。" + spec_after())
        sub(s, r'^商品規格登録編集画面で商品コードに「URL-F0303-005」', None)
        sub(s, r'^商品登録編集画面に戻り', None)
        why += "元の商品名は『任意の名称』なので、シード専用に「F0303-URL-005」とした。タグはCSVのタグ(ID)列に、控えたタグIDを入れる。表示対象カテゴリはサプライ・グッズの配下でないので、取り込み後に商品登録編集画面で付け替える（M03-27 L0123）。"
        basis = B_PLAIN + "、M03-27 L0221"
    elif k == 'STORE-006':
        rows = [csv_row("HQ-001-006", "F0303店舗確認-006", pub=2, branch=0), csv_row("OSA-001-006", "F0303店舗確認-006", pub=1, branch=1)]
        sub(s, r'^1件目: 商品登録編集画面で商品名に', csv_upload(rows) + "。1件目（商品コード「HQ-001-006」）: " + spec_open_edit("HQ-001-006"))
        sub(s, r'^2件目: 商品登録編集画面で商品名に', "2件目（商品コード「OSA-001-006」）: " + spec_open_edit("OSA-001-006"))
        sub(s, r'^商品規格登録編集画面で商品コードに「(HQ|OSA)-001-006」', [None, None], ) if False else None
        idx = [i for i, x in enumerate(s) if re.search(r'^商品規格登録編集画面で商品コードに「(HQ|OSA)-001-006」', x) or x.startswith('商品登録編集画面に戻り')]
        assert len(idx) == 4, idx
        for i in idx: s[i] = None
        why += "2件目の『商品公開ステータス=非公開・支店の商品公開ステータス=公開』は、CSVの商品公開ステータス1・支店の商品公開ステータス1で入れる。"
    elif k == 'DETAIL-007':
        codes = ["DETAIL-ALL-007"] + [f"DETAIL-DIFF-{i:02d}-007" for i in range(1, 15)]
        rows = []
        for c in codes:
            lang = "英語" if c == "DETAIL-DIFF-08-007" else "日本語"
            price = 300 if c == "DETAIL-DIFF-14-007" else 150
            rows.append(csv_row(c, "F0303-ALL-007", pub=2, branch=1, base=price, buy=50, lang=lang))
        sub(s, r'^商品登録編集画面で商品名に「F0303-ALL-007」',
            csv_upload(rows) + "。" + loopintro(15) + card_edit("F0303-ALL-007", "表示対象カテゴリ", "（DETAIL-DIFF-01-007も登録のためいったん「表示対象カテゴリ」を選ぶ）") + "。"
            + SPEC_LIST + "。" + spec_edit_nm("日本語（DETAIL-DIFF-08-007は英語）"))
        sub(s, r'^商品規格登録編集画面で商品コードに各商品の商品コード、言語に日本語', None)
        sub(s, r'^商品登録編集画面に戻り', None)
        why += "価格は元のシードのとおり150（DETAIL-DIFF-14-007は300）、言語は日本語（DETAIL-DIFF-08-007は英語のID）、買取価格は元のシードに無いので50とした。"
        basis = B_CARD
    elif k in ('FOIL-FRAME-008', 'FOIL-FRAME-009', 'COLOR-TYPE-010', 'COLOR-TYPE-011', 'COLOR-TYPE-012', 'MANA-LANG-019', 'STOCK-RULE-023', 'COLOR-MULTI-035', 'CARRY-025', 'CARRY-027'):
        spec = {
            'FOIL-FRAME-008': ("F0303-FOIL-008", ["FOIL-NORMAL-008", "FOIL-FOIL-008", "FOIL-SPECIAL-008"], None),
            'FOIL-FRAME-009': ("F0303-FRAME-009", ["FRAME-NORMAL-009", "FRAME-SPECIAL-009"], None),
            'COLOR-TYPE-010': ("F0303-IDENTITY-010", ["IDENTITY-W-010", "IDENTITY-WU-010", "IDENTITY-U-010"], None),
            'COLOR-TYPE-011': ("F0303-COLOR-011", ["COLOR-W-011", "COLOR-R-011", "COLOR-U-011"], None),
            'COLOR-TYPE-012': ("F0303-TYPE-012", ["TYPE-CREATURE-012", "TYPE-ARTIFACT-012", "TYPE-LAND-012"], None),
            'MANA-LANG-019': ("F0303-MANA-019", [f"MANA-{i}-019" for i in range(9)], None),
            'STOCK-RULE-023': ("F0303-BAN-023", ["BAN-REGULAR-023", "BAN-PROHIBITED-023"], None),
            'COLOR-MULTI-035': ("F0303-035-MULTI", ["F0303-035-W", "F0303-035-WU", "F0303-035-U", "F0303-035-WR"], None),
            'CARRY-025': ("F0303-CARRY-025", ["CARRY-A-025", "CARRY-B-025"], [100, 200]),
            'CARRY-027': ("F0303-CARRY-027", ["CARRY-A-027", "CARRY-B-027"], None),
        }[k]
        nm, codes, prices = spec
        rows = [csv_row(c, nm, pub=2, branch=1, base=(prices[i] if prices else 1000)) for i, c in enumerate(codes)]
        sub(s, rf'^商品登録編集画面で商品名に「{re.escape(nm)}」',
            csv_upload(rows) + "。" + loopintro(len(codes)) + card_edit(nm) + "。" + spec_after())
        sub(s, r'^商品規格登録編集画面で商品コードに各商品の商品コード', None)
        if k in ('CARRY-025', 'CARRY-027'):
            pass
        n_p = sum(1 for x in s if x is not None and x.startswith('商品登録編集画面に戻り'))
        for i, x in enumerate(s):
            if x is not None and x.startswith('商品登録編集画面に戻り'): s[i] = None
        if prices:
            why += "価格は元のシードのとおり100円・200円（商品コードの順）。"
        basis = B_CARD
        why += WHY_CARD
    elif k == 'SUGGEST-018':
        code = "SUGGEST-001-018"
        sub(s, r'^商品登録編集画面で商品名に「F0303-SUGGEST-ALPHA-018」', csv_upload([csv_row(code, "F0303-SUGGEST-ALPHA-018")]) + "。" + spec_open_edit(code))
        sub(s, r'^商品規格登録編集画面で商品コードに「SUGGEST-001-018」', None)
        sub(s, r'^商品登録編集画面に戻り', None)
    elif k == 'MANA-LANG-020':
        codes = ["LANG-JP-020", "LANG-EN-020", "LANG-FR-020"]; langs = ["日本語", "英語", "フランス語"]
        rows = [csv_row(c, "F0303-LANG-020", lang=l) for c, l in zip(codes, langs)]
        sub(s, r'^商品登録編集画面で商品名に「F0303-LANG-020」',
            csv_upload(rows) + "。" + loopintro(3) + open_edit(None) + "、" + SPEC_LIST + "。" + spec_edit_nm("日本語（LANG-EN-020は英語、LANG-FR-020はフランス語）"))
        sub(s, r'^商品規格登録編集画面で商品コードに各商品の商品コード（LANG-JP-020', None)
        sub(s, r'^商品登録編集画面に戻り', None)
        why += "商品コードごとの言語（日本語・英語・フランス語）は、CSVの言語(ID)列で入れる。"
    elif k == 'STOCK-RULE-021':
        rows = [csv_row("STOCK-IN-021", "F0303-STOCK-021"), csv_row("STOCK-OUT-021", "F0303-STOCK-021")]
        sub(s, r'^1件目: 商品登録編集画面で商品名に', csv_upload(rows) + "。1件目（商品コード「STOCK-IN-021」）: " + spec_open_edit("STOCK-IN-021"))
        sub(s, r'^2件目: 商品登録編集画面で商品名に', "2件目（商品コード「STOCK-OUT-021」）: " + spec_open_edit("STOCK-OUT-021"))
        idx = [i for i, x in enumerate(s) if re.search(r'^商品規格登録編集画面で商品コードに「STOCK-(IN|OUT)-021」', x) or x.startswith('商品登録編集画面に戻り')]
        for i in idx: s[i] = None
        sub(s, r'^2件目は在庫を入れない（商品規格の登録時の在庫数0のままにする）', "2件目は在庫を入れない（取り込みで作られた規格の在庫数0のままにする）")
        why += "元の『2件目は在庫を入れない（商品規格の登録時の在庫数0のまま）』は、CSVが在庫0で規格を作る（M03-27 L0129）ので、『取り込みで作られた規格の在庫数0のまま』と読み替えた。"
        basis += "、M03-27 L0129"
    elif k == 'CARRY-024':
        codes = ["PRESERVE-BOTH-024", "PRESERVE-TAG-024", "PRESERVE-SALE-024"]
        tag = "〔タグID-F0303-024〕に控えたタグのID"
        rows = [csv_row(codes[0], "F0303-PRESERVE-024", tag=tag), csv_row(codes[1], "F0303-PRESERVE-024", tag=tag), csv_row(codes[2], "F0303-PRESERVE-024")]
        sub(s, r'^商品登録編集画面で商品名に「F0303-PRESERVE-024」',
            csv_upload(rows) + "。" + "タグ「T-F0303-024」は、PRESERVE-BOTH-024とPRESERVE-TAG-024だけCSVのタグ(ID)列に入れた（PRESERVE-SALE-024は空）。"
            + "次を商品コードごとに1件ずつ行う。" + open_edit(None) + "、" + SPEC_LIST + "。"
            + spec_edit_nm("日本語", "PRESERVE-BOTH-024とPRESERVE-SALE-024はセールフラグにチェックを入れて販売価格(円)に800を入れ（PRESERVE-TAG-024はセールフラグにチェックを付けず販売価格を1000のままにする）、"))
        sub(s, r'^商品規格登録編集画面で商品コードに各商品の商品コード（PRESERVE-BOTH-024', None)
        sub(s, r'^商品登録編集画面に戻り', None) if any(x and x.startswith('商品登録編集画面に戻り') for x in s) else None
        why += "セールフラグ付きの規格は、基準価格1000のままセールフラグにチェックを入れて販売価格を800にする（元のシードは金額を『任意』としていた。セール中の販売価格は基準価格より安い値にした）。"
        basis += "、M03-09 L0086〜L0087、M03-27 L0221"
    elif k == 'PRICE-031':
        specs = [("F0303-031-LOW", 50), ("F0303-031-MID", 150), ("F0303-031-HIGH", 300)]
        rows = [csv_row(c, "F0303-031-PRICE", base=p, buy=min(100, p // 2)) for c, p in specs]
        sub(s, r'^商品登録編集画面で商品名に「F0303-031-PRICE」',
            csv_upload(rows) + "。" + loopintro(3) + spec_open_edit(None))
        sub(s, r'^商品規格登録編集画面で商品コードと基準価格・販売価格に', None)
        sub(s, r'^商品登録編集画面に戻り', None) if any(x and x.startswith('商品登録編集画面に戻り') for x in s) else None
        why += "価格は元のシードのとおり50円・150円・300円（基準価格と販売価格に同じ値）。買取価格は元のシードに無いので、販売価格の半分以下（LOWは25、ほかは100）にした。"
    else:
        raise SystemExit(sid)
    O.append([sid, "直す", joined(s), "", basis, why])
write('F03-03', O)
print(len(O))
