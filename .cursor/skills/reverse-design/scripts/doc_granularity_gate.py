#!/usr/bin/env python3
"""設計書の粒度ゲート — 基準機能と同じ情報粒度で書けているかを機械的に採点する。

基準機能（2026-08-17 ユーザー指定）:
  0203 基本設計仕様書(受注管理機能) / 受注情報検索 一覧(検索入力)
  = `functions/pf-eccube3/m05-01_admin_order_order_search_list.md`

粒度の定義:
  「粒度」を分量で測ってはいけない。画面の大きさに比例するだけで、書き手の丁寧さを測れない。
  実測（2026-08-17）: 検索入力と検索結果は絶対量では 186行 対 84行 と倍以上違うが、
  画面要素数（Excel画面項目定義の識別ID件数）で割ると 条件語 0.52 対 0.57、
  具体値 0.29 対 0.30 でほぼ同等だった。つまり体感の粒度差の実体は画面の大きさ（83要素 対 23要素）
  であって、書き方の差ではない。

  そこで粒度を **画面要素あたりの密度** で定義する。
    条件語密度 … 「とき / 場合 / ただし / 除く / 以上 / 未満 …」の出現数 ÷ 画面要素数
                  ＝ 分岐と境界を書き切っているかの近似
    具体値密度 … バッククォート識別子と「N件 / N文字 / N桁 …」の出現数 ÷ 画面要素数
                  ＝ 既定値・上限・変換規則を具体値で書いているかの近似
  どちらも基準機能の実測値を下限とする。

正本の区分（reverse-design SKILL.md 1a。取り違えると循環参照になる）:
  現行踏襲・カスタマイズ … 現行ソース（pf-eccube3 / ec-cube / pf-api / pf-article /
                            deck-api / deck-builder）が正本
  標準                  … ec-cube-enterprise が正本
  新規実装              … Excel基本設計が正本
  メッセージ被覆(G4)に使える棚卸し `message_inventory/` は ec-cube-enterprise 由来なので、
  **標準区分にしか適用してはいけない**。実測で ee メッセージを持つ192機能の区分は
  カスタマイズ105／現行踏襲58／新規実装17／標準14 であり、163機能は正本が別にある。
  例: M05-01（カスタマイズ）の現行文言「この受注情報を削除してもよろしいですか」「GMO決済エラー」は
  ee 棚卸しに0件、逆に ee の「注文情報を削除してよろしいですか」は pf-eccube3 に無い。

検査:
  G1 粒度密度   条件語密度・具体値密度が基準機能以上（画面要素数が取れる機能のみ）
  G2 必須小節   表示メッセージ / Excel設計書との乖離 / 永続化 に相当する記述がある
  G3 節構成    基準機能が持つ節(H2)をすべて持つ。必須節は固定値ではなく基準機能から読む
  G4 メッセージ被覆  `message_inventory/MESSAGE_LIST.tsv` の当該機能のメッセージIDが
                 設計書に載っている。表示メッセージの正本は区分によらず ec-cube-enterprise
                 （2026-08-19 ユーザー決定）
  G5 乖離節の禁止内容  乖離節に Excel の画面項目に関する内容を書いていない。Excel設計書だけに
                 在るもの（現行に実装が無いもの）を列挙していない。乖離がI/Oとふるまいに
                 限られている（実装手段・認可設定を書いていない）（2026-08-18 ユーザー指示）
  G6 結論の書き方  結論を端的に置いている。接続詞で文を始めない／意図や目的を説明しない／
                 一文に結論を複数積まない／理由節の割合が基準機能以下（2026-08-18 ユーザー指示）
  G7 永続化の中身  永続化節に書くのは DB への登録・更新・削除とキャッシュへの入出力だけ。
                 ログ・イベント発行・セッション・メール・ファイル出力・読み取りを書いていない
                 （2026-08-18／2026-08-19 ユーザー決定）
  G8 置かない節  ページャ・セッション・Cookie の節を作っていない（2026-08-18 ユーザー決定）
  G9 画面操作     散文に占める画面操作の記述の割合が基準機能以下。詳細設計書は画面操作に
                 依存しないI/O・ふるまい・業務ロジックに限る（2026-08-18 ユーザー決定）
  G10 メッセージ前置き  表示メッセージ節は見出しの直後を表から始める。出典や採番規則の説明を
                 書かない（2026-08-19 ユーザー決定）

使い方:
  python3 .cursor/skills/reverse-design/scripts/doc_granularity_gate.py
  python3 .cursor/skills/reverse-design/scripts/doc_granularity_gate.py --function M05-01 --strict
  python3 .cursor/skills/reverse-design/scripts/doc_granularity_gate.py --report /tmp/granularity.tsv
  python3 .cursor/skills/reverse-design/scripts/doc_granularity_gate.py --worst 30
"""

from __future__ import annotations

import argparse
import csv
import importlib.util
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
CONVERTER = (
    ROOT / ".cursor/skills/function-spec-html-render/scripts/convert_function_spec_html.py"
)
MESSAGE_LIST = ROOT / "message_inventory" / "MESSAGE_LIST.tsv"
SHEET_MAP = ROOT / "functions" / "function-sheet-map.tsv"
EXCEL_DIR = ROOT / "excel_to_html" / "output"
EXEMPTIONS = ROOT / "functions" / "doc-granularity-exemptions.tsv"

REFERENCE_FUNCTION = "M05-01"
REFERENCE_DOC = "m05-01_admin_order_order_search_list.md"

FUNCTION_PREFIX_RE = re.compile(r"^([a-z]\d{2}-\d{2}[a-z]?)_")
MSG_ID_RE = re.compile(r"\b([A-Z0-9]+(?:-[A-Z0-9]+)*-MSG-\d+)\b")
# 分岐・境界を書いているかの近似。日本語の条件表現を数える。
CONDITION_RE = re.compile(r"とき|場合|ただし|除く|以上|以下|未満|より後|より前|限り|だけ")
# 具体値の近似。バッククォート識別子と、単位付きの数値。
CONCRETE_RE = re.compile(
    r"`[^`\n]+`|(?<![\w.])\d{1,6}\s*(?:件|文字|桁|回|日|分|秒|ページ|欄|項目|つ|種)"
)
# G3 の必須節は基準機能から読む。固定値にすると基準機能自身が落ちる状態を作れてしまう
# （実際、2026-08-18 まで「処理フロー」を必須にしていたが基準機能はこの節を持たない）。
# 基準は検索入力であり、ゲートは基準に従う（2026-08-18 ユーザー決定）。
# G2: 節名は自由だが、この観点の記述が本文のどこかに要る。
# 「Excel設計書との乖離」は必須にしない。乖離が在るときだけ書く節なので、必須にすると
# 乖離の無い機能に書くことを強制して捏造を誘発する（実測 386/390 が不記載＝正常）。
REQUIRED_TOPICS = {
    "表示メッセージ": re.compile(r"表示メッセージ|メッセージID|文言"),
    "永続化": re.compile(r"永続化|保存先|更新しない|登録・更新|DB操作"),
}
DIVERGENCE_RE = re.compile(r"乖離|Excel設計書との差|基本設計との差")
# G5: 乖離節に書いてはいけないもの（2026-08-18 ユーザー指示）。
# 乖離節は「現行ソースにあって Excel設計書に無いふるまい」だけを書く節である。
# Excel の画面項目に関する内容と、Excel設計書だけに在るもの（現行に実装が無いもの）は
# 設計書の出力対象ではない。前者は Excel を正とする規約 1b-1 の復唱にあたり、後者は
# 逆生成設計書の対象外（新規に作るものであって現行から読み取れるふるまいではない）。
# 逆向き対比表: 見出し行の先頭セルが Excel から始まる表。
DIVERGENCE_REVERSE_TABLE_RE = re.compile(r"^\|\s*Excel", re.M)
# 乖離節に持ち込まない画面項目の語彙。「ラベル」は現行の文言を書くときに使うので入れない。
SCREEN_ITEM_RE = re.compile(r"画面項目|項目定義|識別ID")
# Excel設計書だけに在るものを列挙している文。節の位置によらず本文全体で見る。
EXCEL_ONLY_RE = re.compile(r"Excel設計書だけに(?:在る|ある)|Excelだけに(?:在る|ある)|現行ソースに実装が無く")
# 乖離はI/Oとふるまいに限る（2026-08-18 ユーザー指示）。実装手段・構成・認可設定は
# 利用者から見た入出力でもふるまいでもないので乖離に書かない。設計書全体で内部の
# 呼び出し順を書かないのと同じ線引きである。
IMPLEMENTATION_DETAIL_RE = re.compile(
    r"通信方式|暗号化|HTTPS?|SSL|認証|認可|権限|偽造防止|CSRF|トークン"
    r"|エンドポイント|受付先|ルート定義|呼び出し順|内部構造|クラス|メソッド"
)
# G6: 結論を端的に書く（2026-08-18 ユーザー指示）。基準機能と検索結果の実測で差が出たのは
# 文の長さではない（平均36.3字 対 37.6字でほぼ同じ）。差は「結論をそのまま置いているか」で、
# 基準機能は接続詞始まり0・目的説明0・一文に結論を複数入れる文0、理由節を含む文は10%だった。
# 対する検索結果は理由節20%で、機構の説明に結論が埋もれていた。基準の実測値を上限にする。
SENTENCE_MIN_FOR_RATIO = 20  # 文が少ないと比率が跳ねるので、比率の判定はこの数から
# 「ものである」「のである」は「ので」を含むが理由節ではない。「ための〜」は目的の説明として
# PURPOSE_RE が拾うので、ここでは除く。
REASON_CLAUSE_RE = re.compile(r"ため(?!の)|ので[、。]|からである")
# 前の文に寄りかかる書き出し。結論だけを読む読者が迷子になる。
CONJUNCTION_HEAD_RE = re.compile(
    r"^(そのため|そのうえで|また|さらに|なお|したがって|よって|つまり|一方|これにより|このため)"
)
# 動作ではなく意図・目的を述べる文。「何が起きるか」を書く設計書には要らない。
PURPOSE_RE = re.compile(r"ための[^。]*である|目的である|ためのものである")
# 一文に結論を複数積む書き方。読み手がどちらが結論か決められない。
MULTI_CONCLUSION_RE = re.compile(r"ことも[、。]|たり、")

# G7: 永続化節はDBの永続化だけを書く（2026-08-18 ユーザー決定）。
# 永続化節がDB限定なら「この節は丸ごと ec-cube-enterprise を正とする」と機械的に言える
# （SKILL.md 1c）。混在すると行ごとに正本が変わる。結合テストのDB直接参照の判定にも
# そのまま使える。実測でも永続化節を持つ23本のうち21本は既にDB限定だった。
# 追い出す先: セッションは業務ロジック（画面間で持ち越すもの＝ふるまい）、
# メール・ファイルは「出力: メール」「出力: CSVファイル」、ログとイベント発行は書かない。
# 永続化に書くのは DB への登録・更新・削除と、キャッシュへの入出力だけ
# （2026-08-19 ユーザー決定）。読み取りは書かない。「更新しない」と明記するのは可。
PERSISTENCE_READ_RE = re.compile(r"参照|読み取り|読み込み|取得する|検索する|SELECT")
PERSISTENCE_READ_EXEMPT_RE = re.compile(r"更新しない|作成しない|削除しない")
PERSISTENCE_NON_DB = {
    "ログ": re.compile(r"ログ(?!イン)|監査"),
    "イベント通知": re.compile(r"イベント|通知を発行|後続処理へ発行"),
    "セッション": re.compile(r"セッション|Cookie"),
    "メール": re.compile(r"メール"),
    "ファイル出力": re.compile(r"CSV|PDF|帳票|ファイルを出力"),
}

# G8: 設計書に置かない節（2026-08-18 ユーザー決定）。
# ページャは画面の共通部品で、挙動は基本設計の画面項目定義が定める（規約1b-1の復唱になる）。
# セッション・Cookie の保持は内部の仕組みで、利用者から見た入出力でもふるまいでもない。
# どちらも機能固有のふるまいではないので、独立した節にしない。
BANNED_SECTION_RE = re.compile(r"ページャ|ページング|セッション|Cookie|持ち越す")

# G9: 詳細設計書は画面操作に依存しないI/O・ふるまい・業務ロジックに限る（2026-08-18 ユーザー決定）。
# 基準機能はこの形で書かれている（本文106行のうちUI操作語を含む散文は1行）。表は対象外にする。
# 表示メッセージ表は文言と表示位置を逐語で載せる様式で、そこにダイアログやチェックボックスが
# 出るのは避けられないためである。
UI_OPERATION_RE = re.compile(
    r"押す|押下|クリック|タップ|ボタン|メニュー|リンク|プルダウン|セレクトボックス"
    r"|チェックボックス|チェックを|選ぶと|選択すると|オンにし|オフにし"
    r"|別タブ|別ウィンドウ|ダイアログ|ポップアップ|モーダル|スクロール"
)

# G4: 表示メッセージの正本は区分によらず ec-cube-enterprise とする（2026-08-19 ユーザー決定）。
# 設計書はリニューアル後の仕様なので、画面に出る文言も移行先の実装から採る。
# それ以前は「標準区分だけ」に限っていたが、その規約は表示メッセージについては撤回した。
# 挙動・画面・処理の正本が現行ソースであることは変わらない（SKILL.md 1b）。
EE_CANONICAL_KINDS: tuple[str, ...] | None = None  # None = 全区分に適用

# G10: 表示メッセージ節は見出しの直後を表から始める（2026-08-19 ユーザー決定）。
# 出典や採番規則の説明は規約の担当で、設計書の読者に要る情報ではない。
# 表を持たない機能が「この機能はメッセージを扱わない」と一文だけ書くのは可とする。


def load_converter():
    spec = importlib.util.spec_from_file_location("convert_function_spec_html", CONVERTER)
    module = importlib.util.module_from_spec(spec)
    sys.modules["convert_function_spec_html"] = module
    spec.loader.exec_module(module)  # type: ignore[union-attr]
    return module


def function_no(name: str) -> str | None:
    m = FUNCTION_PREFIX_RE.match(name)
    return m.group(1).upper() if m else None


def collect_docs(base: Path) -> dict[str, list[Path]]:
    """機能No → その機能の設計書群（画面ごとの分割先を含む）。

    本体（`functions/<repo>/`）と退避先（`functions/_archive/<repo>/`）は用途が違うので
    呼び分ける。被覆は退避先に残っていれば情報が失われていないので両方を見るが、
    章立てと粒度は納品物である本体だけを見る（退避先を混ぜると本文を丸ごと退避して
    本体が空になっている設計書が通ってしまう）。
    """
    docs: dict[str, list[Path]] = defaultdict(list)
    if not base.is_dir():
        return docs
    for path in sorted(base.glob("*/*.md")):
        fid = function_no(path.name)
        if fid:
            docs[fid].append(path)
    return docs


def _plain(fragment: str) -> str:
    return re.sub(r"\s+", "", re.sub(r"<[^>]+>", "", fragment)).strip()


def screen_element_counts() -> dict[str, int]:
    """機能No → Excel画面項目定義の項目数（粒度密度の分母）。

    Excel由来HTMLのシートから「識別ID」列を持つ表を拾い、`function-sheet-map.tsv` で
    機能Noへ寄せる。1機能が複数シートに分かれている場合は合算する。
    """
    per_sheet: dict[tuple[str, str], int] = {}
    for html in sorted(EXCEL_DIR.glob("*.html")):
        if html.name == "index.html":
            continue
        text = html.read_text(encoding="utf-8")
        book = html.name.split("_")[0]
        marks = [
            (m.group(1), m.start())
            for m in re.finditer(r'<section class="sheet-panel" id="(sheet-\d+)">', text)
        ] + [("END", len(text))]
        for i in range(len(marks) - 1):
            seg = text[marks[i][1] : marks[i + 1][1]]
            count = 0
            for table in re.finditer(r"<table.*?</table>", seg, re.S):
                body = table.group(0)
                heads = [_plain(x) for x in re.findall(r"<th[^>]*>(.*?)</th>", body, re.S)]
                # 画面項目定義の表だけを分母にする。同じ「識別ID」列を持っていても
                # 識別ID/項目名/備考 の3列表はCSV・帳票の出力項目一覧であり、画面の要素ではない。
                # これを混ぜるとCSV出力機能の分母が列数まで膨らみ（M05-04 で90）、
                # Excelを正とする規約（1b-1）どおり列を復唱していない設計書を不当に低く採点する。
                if "識別ID" not in heads or "ラベル" not in heads:
                    continue
                ii, li = heads.index("識別ID"), heads.index("ラベル")
                for row in re.finditer(r"<tr[^>]*>(.*?)</tr>", body, re.S):
                    cells = [
                        _plain(x) for x in re.findall(r"<td[^>]*>(.*?)</td>", row.group(1), re.S)
                    ]
                    if (
                        len(cells) > max(ii, li)
                        and re.match(r"^\d+(-\d+)*$", cells[ii])
                        and cells[li]
                    ):
                        count += 1
            if count:
                per_sheet[(book, marks[i][0])] = count

    out: dict[str, int] = defaultdict(int)
    if not SHEET_MAP.is_file():
        return out
    # 台帳は「機能Noの行 × 一致したシート」で行が立つ。1つの機能Noが todo-list に複数行あると
    # （M05-01 の 検索入力／検索結果 など）同じシートが複数回現れるため、シートは1回だけ数える。
    seen: set[tuple[str, str, str]] = set()
    with SHEET_MAP.open(encoding="utf-8") as f:
        for row in csv.DictReader(f, delimiter="\t"):
            feature_no = row["機能No"].upper()
            key = (row["ブック"], row["シートID"])
            if key not in per_sheet or (feature_no, *key) in seen:
                continue
            seen.add((feature_no, *key))
            out[feature_no] += per_sheet[key]
    return out


def density(text: str, elements: int) -> tuple[float, float, float]:
    """(条件語密度, 具体値密度, 記述量の充足)。見出し行は文章量に数えない。

    密度は本文行あたりで測る＝「書いてある文の具体性」。画面要素あたりにすると、
    Excel の画面項目定義が既に持っている項目まで分母に入り、Excelを正とする規約(1b-1)
    どおり復唱していない設計書を不当に低く採点する（M05-11 は画面要素258で、
    要素あたりだと基準の3倍の分量を要求されてしまう）。

    記述量の充足だけは画面要素あたりで測る＝「画面の規模に見合う量を書いているか」。
    具体性と充足はどちらか一方では不足で、具体性だけでは薄い設計書が通り、
    充足だけでは水増しした設計書が通る。
    """
    body = [l for l in text.split("\n") if l.strip() and not l.lstrip().startswith("#")]
    joined = "\n".join(body)
    lines = max(len(body), 1)
    # 分岐は2通りの書き方で表される。散文の条件語（「〜のとき」）と、表の行
    # （左列が条件・右列がふるまい）である。条件語だけを数えると、条件を列見出しに
    # 追い出す様式を不当に低く採点する（M05-13 は 74行中 条件語9 だが、エッジケース表で
    # 7ケースを列挙しており実際は薄くない）。両方を分岐の担い手として数える。
    rows = 0
    for line in body:
        if not line.lstrip().startswith("|"):
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) < 2 or set("".join(cells)) <= set("-: "):
            continue
        rows += 1
    cond = (len(CONDITION_RE.findall(joined)) + rows) / lines
    conc = len(CONCRETE_RE.findall(joined)) / lines
    volume = len(body) / elements if elements else 0.0
    return cond, conc, volume


def section_titles(converter, text: str) -> set[str]:
    titles: set[str] = set()
    fence: str | None = None
    for line in text.split("\n"):
        fence_match = converter.FENCE_RE.match(line)
        if fence_match:
            marker = fence_match.group(1)[0]
            fence = marker if fence is None else (None if fence == marker else fence)
            continue
        if fence is not None:
            continue
        heading = converter.HEADING_RE.match(line)
        if heading and len(heading.group(1)) == converter.SECTION_HEADING_LEVEL:
            titles.add(heading.group(2).strip())
    return titles


def body_sentences(text: str) -> list[str]:
    """本文の文。見出し・表・区切り線は文章量に数えない（表は別の様式なので対象外）。"""
    out: list[str] = []
    for line in text.split("\n"):
        s = line.strip()
        if not s or s.startswith("#") or s.startswith("|") or s.startswith("---"):
            continue
        s = re.sub(r"^\d+\.\s*|^-\s*", "", s)
        for sent in re.split(r"(?<=。)", s):
            sent = sent.strip()
            if sent:
                out.append(sent)
    return out


def conclusion_style(text: str) -> tuple[float, int, int, int, int]:
    """(理由節率, 接続詞始まり, 目的説明, 一文に結論が複数, 文数)。"""
    ss = body_sentences(text)
    if not ss:
        return 0.0, 0, 0, 0, 0
    reason = sum(1 for s in ss if REASON_CLAUSE_RE.search(s))
    conj = sum(1 for s in ss if CONJUNCTION_HEAD_RE.match(s))
    purpose = sum(1 for s in ss if PURPOSE_RE.search(s))
    multi = sum(1 for s in ss if MULTI_CONCLUSION_RE.search(s))
    return reason / len(ss), conj, purpose, multi, len(ss)


def ui_operation_ratio(text: str) -> tuple[float, int, list[str]]:
    """散文に占める画面操作の記述の割合（G9）。表と見出しは数えない。"""
    prose = [
        l.strip()
        for l in text.split("\n")
        if l.strip() and not l.startswith("#") and not l.strip().startswith("|")
    ]
    if not prose:
        return 0.0, 0, []
    hits = [l for l in prose if UI_OPERATION_RE.search(l)]
    return len(hits) / len(prose), len(prose), hits


def message_preamble(text: str) -> list[str]:
    """表示メッセージ節の見出し直後に散文の前置きが無いか（G10）。"""
    out: list[str] = []
    lines = text.split("\n")
    heading_re = re.compile(r"^(#{2,4})\s+(.*)$")
    for i, line in enumerate(lines):
        m = heading_re.match(line)
        if not m or "表示メッセージ" not in m.group(2):
            continue
        level = len(m.group(1))
        end = len(lines)
        for j in range(i + 1, len(lines)):
            m2 = heading_re.match(lines[j])
            if m2 and len(m2.group(1)) <= level:
                end = j
                break
        seg = lines[i + 1 : end]
        has_table = any(s.strip().startswith("|") for s in seg)
        first = next((s.strip() for s in seg if s.strip()), "")
        # 表を持たない機能の「メッセージを扱わない」の一文は残してよい。
        if has_table and first and not first.startswith("|") and not first.startswith("#"):
            out.append(first[:40])
    return out


def banned_sections(text: str) -> list[str]:
    """設計書に置かない節が無いか（G8）。"""
    out: list[str] = []
    for line in text.split("\n"):
        m = re.match(r"^#{2,4}\s+(.*)$", line)
        if m and BANNED_SECTION_RE.search(m.group(1)):
            out.append(m.group(1).strip())
    return sorted(set(out))


def persistence_violations(text: str) -> list[str]:
    """永続化節にDB以外が混ざっていないか（G7）。"""
    violations: list[str] = []
    lines = text.split("\n")
    heading_re = re.compile(r"^(#{2,4})\s+(.*)$")
    for i, line in enumerate(lines):
        m = heading_re.match(line)
        if not m or "永続化" not in m.group(2):
            continue
        level = len(m.group(1))
        end = len(lines)
        for j in range(i + 1, len(lines)):
            m2 = heading_re.match(lines[j])
            if m2 and len(m2.group(1)) <= level:
                end = j
                break
        segment = "\n".join(lines[i + 1 : end])
        for name, rx in PERSISTENCE_NON_DB.items():
            if rx.search(segment):
                violations.append(name)
        for line in segment.split("\n"):
            if PERSISTENCE_READ_RE.search(line) and not PERSISTENCE_READ_EXEMPT_RE.search(line):
                violations.append("読み取りの記述")
                break
    return sorted(set(violations))


def divergence_violations(text: str) -> list[str]:
    """乖離節の禁止内容を検出する（G5）。

    乖離節は「現行ソースにあって Excel設計書に無いふるまい」だけを書く。次は書かない。
      - Excel の画面項目に関する内容
      - Excel設計書だけに在るもの（現行に実装が無いもの）
      - I/O とふるまい以外（通信方式・認可設定・受付先などの実装手段）
    """
    violations: list[str] = []
    if EXCEL_ONLY_RE.search(text):
        violations.append("Excel設計書だけに在るものの列挙")

    lines = text.split("\n")
    heading_re = re.compile(r"^(#{2,4})\s+(.*)$")
    for i, line in enumerate(lines):
        m = heading_re.match(line)
        if not m or not DIVERGENCE_RE.search(m.group(2)):
            continue
        level = len(m.group(1))
        end = len(lines)
        for j in range(i + 1, len(lines)):
            m2 = heading_re.match(lines[j])
            if m2 and len(m2.group(1)) <= level:
                end = j
                break
        segment = "\n".join(lines[i + 1 : end])
        if DIVERGENCE_REVERSE_TABLE_RE.search(segment):
            violations.append(f"Excel起点の対比表（{m.group(2).strip()}）")
        if SCREEN_ITEM_RE.search(segment):
            violations.append(f"画面項目に関する記述（{m.group(2).strip()}）")
        if IMPLEMENTATION_DETAIL_RE.search(segment):
            violations.append(f"I/O・ふるまい以外の記述（{m.group(2).strip()}）")
    return sorted(set(violations))


def load_canonical_messages() -> dict[str, set[str]]:
    by_function: dict[str, set[str]] = defaultdict(set)
    if not MESSAGE_LIST.is_file():
        return by_function
    with MESSAGE_LIST.open(encoding="utf-8") as f:
        for row in csv.DictReader(f, delimiter="\t"):
            fid = row.get("機能ID", "").strip()
            if fid:
                by_function[fid].add(row["メッセージID"].strip())
    return by_function


def load_exemptions() -> set[str]:
    if not EXEMPTIONS.is_file():
        return set()
    with EXEMPTIONS.open(encoding="utf-8") as f:
        return {
            r["メッセージID"].strip()
            for r in csv.DictReader(f, delimiter="\t")
            if r.get("メッセージID", "").strip()
            and not r["メッセージID"].strip().startswith("#")
        }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--function", help="機能No（例 M05-01）に絞る")
    parser.add_argument("--report", type=Path, help="機能×指標のマトリクスをTSV出力する")
    parser.add_argument("--worst", type=int, default=0, help="粒度が基準から遠い順にN件出す")
    parser.add_argument("--strict", action="store_true", help="違反があれば非ゼロ終了する")
    parser.add_argument("--limit", type=int, default=20, help="表示する違反の件数上限")
    args = parser.parse_args()

    converter = load_converter()
    docs = collect_docs(ROOT / "functions")
    archived = collect_docs(ROOT / "functions" / "_archive")
    elements = screen_element_counts()
    canonical = load_canonical_messages()
    exempt = load_exemptions()

    # 基準値は基準機能の実測から取る（固定値を書かない）。
    ref_path = next(
        (p for p in docs.get(REFERENCE_FUNCTION, []) if p.name == REFERENCE_DOC), None
    )
    if ref_path is None or REFERENCE_FUNCTION not in elements:
        print(
            f"基準機能 {REFERENCE_FUNCTION}／{REFERENCE_DOC} か、その画面要素数が取れない",
            file=sys.stderr,
        )
        return 1
    # 基準は「その画面（検索入力）だけ」で測る。機能Noを共有する検索結果を混ぜない。
    ref_elements = 83
    ref_text = ref_path.read_text(encoding="utf-8")
    required_sections = tuple(sorted(section_titles(converter, ref_text)))
    if not required_sections:
        print("基準機能から必須節を読めない", file=sys.stderr)
        return 1
    ref_cond, ref_conc, ref_vol = density(ref_text, ref_elements)
    ref_reason, _, _, _, ref_sent = conclusion_style(ref_text)
    ref_ui, _, _ = ui_operation_ratio(ref_text)
    print(
        f"基準 {REFERENCE_FUNCTION} {REFERENCE_DOC}: 画面要素{ref_elements} "
        f"条件語{ref_cond:.2f}/行 具体値{ref_conc:.2f}/行 記述量{ref_vol:.2f}行/要素 "
        f"理由節{ref_reason:.2f}/文({ref_sent}文) 画面操作{ref_ui:.2f}/行 "
        f"必須節={'/'.join(required_sections)}"
    )

    targets = sorted(docs)
    if args.function:
        want = args.function.upper()
        targets = [t for t in targets if t == want]
        if not targets:
            print(f"機能No {want} の設計書が無い", file=sys.stderr)
            return 1

    rows = [
        "機能No\t区分\t画面要素\t条件語/行\t具体値/行\t行/要素\t粒度\t欠落節\t欠落観点\tメッセージ欠落\t設計書\t乖離節の禁止内容\t結論の書き方\t永続化のDB以外\t置かない節\t画面操作\tメッセージ前置き"
    ]
    g1_fail: list[str] = []
    g2_fail: list[str] = []
    g3_fail: list[str] = []
    g4_fail: list[str] = []
    g5_fail: list[str] = []
    g6_fail: list[str] = []
    g7_fail: list[str] = []
    g8_fail: list[str] = []
    g9_fail: list[str] = []
    g10_fail: list[str] = []
    scored: list[tuple[float, str]] = []
    advisories: list[str] = []
    no_denominator = 0

    for fid in targets:
        paths = docs[fid]
        texts = [p.read_text(encoding="utf-8") for p in paths]
        blob = "\n".join(texts)
        kind = converter.customization_kind(source=paths[0]) or "(不明)"

        n = elements.get(fid, 0)
        cond, conc, vol = density(blob, n)
        short = []
        if cond < ref_cond:
            short.append(f"条件語{cond:.2f}<{ref_cond:.2f}/行")
        # 具体値密度はゲートにしない。定数・上限・変換規則を持たない機能（単純な編集・削除
        # 画面など）が実在し、必須にすると数値の水増しを強制して捏造を誘発する
        # （GRANULARITY.md 5）。基準未満は助言として集計するだけにとどめる。
        if conc < ref_conc:
            advisories.append(f"[参考]具体値が基準未満 {fid}: {conc:.2f}<{ref_conc:.2f}/行")
        if n and vol < ref_vol:
            short.append(f"記述量{vol:.2f}<{ref_vol:.2f}行/要素")
        if n:
            grade = "基準以上" if not short else "基準未満"
            scored.append((min(cond / ref_cond, conc / ref_conc, vol / ref_vol), fid))
        else:
            grade = "分母なし(具体性のみ判定)"
            no_denominator += 1
        if short:
            g1_fail.append(f"[G1]粒度が基準未満 {fid}（{kind}）: {' / '.join(short)}")

        titles: set[str] = set()
        for text in texts:
            titles |= section_titles(converter, text)
        missing_sections = [s for s in required_sections if s not in titles]
        if missing_sections and titles:
            g3_fail.append(f"[G3]基準機能の節が無い {fid}: {' / '.join(missing_sections)}")

        missing_topics = [name for name, rx in REQUIRED_TOPICS.items() if not rx.search(blob)]
        if missing_topics and titles:
            g2_fail.append(f"[G2]必須の観点が無い {fid}: {' / '.join(missing_topics)}")

        # G4 は ee 正本が正しい区分にだけ適用する（1a）。
        missing_messages: list[str] = []
        if EE_CANONICAL_KINDS is None or kind in EE_CANONICAL_KINDS:
            embedded = set(MSG_ID_RE.findall(blob)) | {
                m
                for p in archived.get(fid, [])
                for m in MSG_ID_RE.findall(p.read_text(encoding="utf-8"))
            }
            missing_messages = sorted(
                m for m in canonical.get(fid, set()) - embedded if m not in exempt
            )
            if missing_messages:
                g4_fail.append(
                    f"[G4]メッセージ欠落 {fid}（{kind}）: {len(missing_messages)}件 "
                    f"→ {', '.join(missing_messages[:5])}"
                )

        # G5 は本体の設計書だけを見る（退避先は納品物ではない）。
        banned: list[str] = []
        for text in texts:
            banned.extend(divergence_violations(text))
        banned = sorted(set(banned))
        if banned:
            g5_fail.append(f"[G5]乖離節に書けない内容 {fid}: {' / '.join(banned)}")

        # G6 は結論の書き方。表は別の様式なので本文の文だけを見る。
        style: list[str] = []
        for path in paths:
            text = path.read_text(encoding="utf-8")
            reason, conj, purpose, multi, nsent = conclusion_style(text)
            if nsent >= SENTENCE_MIN_FOR_RATIO and reason > ref_reason:
                style.append(f"理由節{reason:.2f}>{ref_reason:.2f}/文({path.name})")
            if conj:
                style.append(f"接続詞始まり{conj}文({path.name})")
            if purpose:
                style.append(f"目的の説明{purpose}文({path.name})")
            if multi:
                style.append(f"一文に結論が複数{multi}文({path.name})")
        if style:
            g6_fail.append(f"[G6]結論が端的でない {fid}: {' / '.join(style)}")

        nondb: list[str] = []
        for text in texts:
            nondb.extend(persistence_violations(text))
        nondb = sorted(set(nondb))
        if nondb:
            g7_fail.append(f"[G7]永続化にDB以外が混ざる {fid}: {' / '.join(nondb)}")

        banned_sec: list[str] = []
        for text in texts:
            banned_sec.extend(banned_sections(text))
        banned_sec = sorted(set(banned_sec))
        if banned_sec:
            g8_fail.append(f"[G8]設計書に置かない節 {fid}: {' / '.join(banned_sec[:4])}")

        ui_over: list[str] = []
        for path in paths:
            ratio, _, hits = ui_operation_ratio(path.read_text(encoding="utf-8"))
            if ratio > ref_ui:
                ui_over.append(f"{ratio:.2f}>{ref_ui:.2f}/行 {len(hits)}行({path.name})")
        if ui_over:
            g9_fail.append(f"[G9]画面操作の記述が多い {fid}: {' / '.join(ui_over)}")

        preamble: list[str] = []
        for text in texts:
            preamble.extend(message_preamble(text))
        if preamble:
            g10_fail.append(f"[G10]表示メッセージに前置きがある {fid}: {preamble[0]}…")

        rows.append(
            f"{fid}\t{kind}\t{n}\t{cond:.2f}\t{conc:.2f}\t{vol:.2f}\t{grade}"
            f"\t{'/'.join(missing_sections) if missing_sections else '-'}"
            f"\t{'/'.join(missing_topics) if missing_topics else '-'}"
            f"\t{len(missing_messages)}"
            f"\t{','.join(sorted({p.name for p in paths}))}"
            f"\t{'/'.join(banned) if banned else '-'}"
            f"\t{'/'.join(style) if style else '-'}"
            f"\t{'/'.join(nondb) if nondb else '-'}"
            f"\t{'/'.join(banned_sec) if banned_sec else '-'}"
            f"\t{'/'.join(ui_over) if ui_over else '-'}"
            f"\t{'あり' if preamble else '-'}"
        )

    if args.report:
        args.report.write_text("\n".join(rows) + "\n", encoding="utf-8")
        print(f"マトリクス: {args.report}")

    print(f"\n対象機能: {len(targets)}")
    print(
        f"  G1 粒度が基準未満: {len(g1_fail)}件"
        f"（採点できた {len(targets) - no_denominator}件 / 分母なし {no_denominator}件）"
    )
    print(f"  G2 必須の観点が無い: {len(g2_fail)}件")
    print(f"  G3 基準機能の節が無い: {len(g3_fail)}件")
    print(f"  G4 メッセージ欠落: {len(g4_fail)}件")
    print(f"  G5 乖離節に書けない内容: {len(g5_fail)}件")
    print(f"  G6 結論が端的でない: {len(g6_fail)}件")
    print(f"  G7 永続化にDB以外が混ざる: {len(g7_fail)}件")
    print(f"  G8 設計書に置かない節: {len(g8_fail)}件")
    print(f"  G9 画面操作の記述が多い: {len(g9_fail)}件")
    print(f"  G10 表示メッセージに前置きがある: {len(g10_fail)}件")
    print(f"     （参考）具体値密度が基準未満: {len(advisories)}件 — ゲートしない（捏造誘発を避ける）")

    if args.worst:
        print(f"\n粒度が基準から遠い順 上位{args.worst}件:")
        for ratio, fid in sorted(scored)[: args.worst]:
            print(f"  {ratio:5.2f}  {fid}")

    fails = g1_fail + g2_fail + g3_fail + g4_fail + g5_fail + g6_fail + g7_fail + g8_fail + g9_fail + g10_fail
    if fails:
        print(f"\nNG: {len(fails)}件")
        for f in fails[: args.limit]:
            print("  -", f)
        if len(fails) > args.limit:
            print(f"  … 他 {len(fails) - args.limit}件")
    else:
        print("\nOK: 粒度ゲート通過")

    return 1 if (fails and args.strict) else 0


if __name__ == "__main__":
    sys.exit(main())
