#!/usr/bin/env python3
"""使い方: make_prompt.py <組の名前> <巡: R1|R2|R3> <業務名>...  … _review/<組>/prompt_<巡>.md を作る"""
import sys
from pathlib import Path
B = Path(__file__).resolve().parent
SRC = {
 "店頭受取受注管理": ("scenario_test/markdown/05_店頭受取受注管理.md", "0203 受注管理機能・0304 フロント_注文・0505 API_受注管理・0405 バッチ_受注管理・0306 フロント_会員"),
 "店頭買取": ("scenario_test/markdown/06_店頭買取.md・07_店頭買取_tobe.md", "0205 店頭買取・0601 その他_MTGバイヤー・0308 フロント・0506 API_店頭買取・0406 バッチ_店頭買取・0202 在庫管理"),
 "ネット買取": ("scenario_test/markdown/14_ネット買取.md", "0206 ネット買取・0305 フロント・0507 API_ネット買取・0601 その他_MTGバイヤー・0306 フロント_会員"),
 "イベント管理": ("scenario_test/markdown/08_イベント管理.md", "0214 イベント・0307 フロント・0517 API_その他・0306 フロント_会員・0413 バッチ_イベント"),
 "商品登録・編集": ("scenario_test/markdown/09_商品登録・編集.md・10_商品登録・編集_tobe.md", "0204 商品管理・0208 カード管理・0202 在庫管理・0303 フロント・0404 バッチ_商品・0502 API_商品管理・0514 API_カード"),
 "価格管理": ("scenario_test/markdown/11_価格管理.md", "0204 商品管理・0211 分析・集計・0202 在庫管理"),
 "在庫管理": ("scenario_test/markdown/12_在庫管理.md・13_在庫管理_tobe.md・01_業務フロー画面マトリクス.md", "0202 在庫管理機能・0402 バッチ_在庫・0501 API_在庫管理・0204 商品管理"),
 "仕入れ業務": ("scenario_test/markdown/15_仕入れ業務.md", "0204 商品管理・0202 在庫管理・0205 店頭買取・0206 ネット買取"),
 "デッキ登録": ("scenario_test/markdown/18_デッキ登録.md", "0212 デッキ管理・0306 フロント_会員・0515 API_デッキ・0209 基本情報"),
}
grp, rnd, biz = sys.argv[1], sys.argv[2], sys.argv[3:]
src = "\n".join(f"- {b}: 業務フロー {SRC[b][0]}／設計書 excel_to_html/output/ の {SRC[b][1]}" for b in biz)
prior = ""
if rnd != "R1":
    prev = sorted((B / grp).glob("dispositions_R*.md"))
    prior = ("\n## 前の巡の扱い\n前の巡の指摘とその扱いは " + "・".join(f"scenario_test/coverage/scenario_pattern_matrix/_review/{grp}/{p.name}" for p in prev)
             + " にある。却下したものを新しい根拠なしに再び出さない。直した箇所が正しく直っているかは確かめてよい。新しい事実の指摘だけを出す。\n")
    if rnd == "R3":
        prior += "今回は最終巡。まだ出ていない事実の誤りだけを出す。\n"
t = (B / "prompt_template.md").read_text(encoding="utf-8")
t = t.replace("{ROUND}", rnd).replace("{BIZLIST}", "・".join(biz)).replace("{SOURCES}", src).replace("{PRIOR}", prior).replace("{MAX}", "20" if rnd == "R1" else "15")
(B / grp).mkdir(exist_ok=True)
(B / grp / f"prompt_{rnd}.md").write_text(t, encoding="utf-8")
print(B / grp / f"prompt_{rnd}.md")
