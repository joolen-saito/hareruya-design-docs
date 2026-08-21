#!/usr/bin/env python3
"""シナリオテスト項目(scenario_test/test_items/all_scenario_test_items.tsv・11列)を、
結合テストの具体化TSV(integration_test/e2e/exec/tsv/m03-*_concretized.tsv・13列。
F04系4本は11列の旧仕様なので参照しない)と同じ列構成・整形規則へ機械変換する。
括弧最小化(結合テスト側 strip_parens)だけは適用しない。シナリオ層では括弧が
『経路R01（正常代表）』のように原典の識別情報を担っており、除去すると情報が落ちるため。

出力: scenario_test/exec/tsv/sti-<業務コード>_concretized.tsv（業務別10本・14列）

列構成（先頭13列は結合テスト具体化TSVと同一。14列目はシナリオ層固有）:
  機能名 / テストID / I/FID / テスト観点 / 優先度 / テスト項目名 / 前提条件 /
  使用シード / 入力データ/リクエスト内容 / 操作手順/実行方法 / 期待結果／レスポンス /
  自動検証（内部: session/DB/URL） / 実行方法 / 確認対象

変換規則（`実行方法` 列を除き、すべて元TSVからの決定的な導出。値の新規創作はしない）:
  - 前提条件: 12キーの構造化ブロブを1行に再構成する。落とすのは他列で完全に復元できる
    業務(→機能名の ' — ' 前)／元シナリオの表題(→' — ' 後)／データパターンID・種別(→入力データ列)／
    シードデータ(→使用シード列) だけ。業務経路条件は全行保持し、前提差分がその後続分である
    1,033行では追加分のみを『追加前提』として出す（逆変換で再結合する）。
    復元可能性は主張ではなく G8 の逆変換が全行で検証する。
  - 使用シード: 前提条件の「シードデータ:」以降を分離して独立列にする（実値をそのまま転記）。
  - 入力データ: データパターンID・種別・目的・入力を1行へ。
  - 操作手順: セル内改行を除去し「担当者: X／1. … 2. …」の1行に平坦化する。担当者は
    ステップ実施者で主アクター（シナリオ全体の主担当）とは別概念のため必ず残す。
    従属行「対象: …」は直前の手順へ併合する。
  - 期待結果: 文末の句点を落として「〜こと」で統一（結合テスト側 Gate B13 と同一）。
  - 自動検証（内部）: シナリオ層は業務要件の充足を画面・現物で観測する層であり、
    元データに内部状態(session/DB/URL)の観測仕様が存在しないため一律「—」。
  - 実行方法: **この列だけは元TSVからの導出ではない**。列の意味は「テストの実行方法」で、
    シナリオ層に自動実行ハーネスが存在しないという事実から一律「手動」とする（業務そのものの
    実行形態ではない。例: 業務が夜間バッチでも、テストは人が起動・観測するので「手動」）。
    確認手段の要約は行わない。確認対象から行全体のラベルを導くと必ず他列と矛盾する
    （EXEC_VALUES のコメントに3度の破綻を記録）。更新有無は14列目の確認対象に原文で残る。
  - 確認対象: 元の値を逐語で転記する（重複要素も出現回数どおり残す）。

使い方: python3 scenario_test/tools/emit_scenario_concretized_tsv.py
"""
from __future__ import annotations

import csv
import re
import sys
from collections import OrderedDict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "scenario_test/test_items/all_scenario_test_items.tsv"
OUT_DIR = ROOT / "scenario_test/exec/tsv"

SRC_COLS = ["機能名", "テストID", "I/FID", "テスト観点", "優先度", "テスト項目名",
            "前提条件", "入力データ/リクエスト内容", "操作手順/実行方法",
            "期待結果／レスポンス", "確認対象"]

OUT_COLS = [
    "機能名", "テストID", "I/FID", "テスト観点", "優先度", "テスト項目名",
    "前提条件", "使用シード", "入力データ/リクエスト内容", "操作手順/実行方法",
    "期待結果／レスポンス", "自動検証（内部: session/DB/URL）", "実行方法", "確認対象",
]

# 前提条件ブロブの固定キー（出現順）。G2 のラウンドトリップ検証で構造を保証する。
PRE_KEYS = ["元シナリオ", "業務", "経路ID", "経路種別", "業務経路条件", "最終業務状態",
            "主アクター", "関連システム", "データパターンID", "データパターン種別",
            "前提差分", "シードデータ"]

# 実行方法は全行「手動」の一値。確認対象からラベルを導く試みは3度すべて破綻した:
#   (1) 既定を「EC-CUBE画面確認」→ 関連システムにEC-CUBEが無い行にも付き捏造になった
#   (2) 「EC-CUBE外」→ 更新が無いことと EC-CUBE を操作しないことは別で、EC-CUBE画面を
#       操作しつつ更新は発生しない行（STI-TSUHAN-EC-001-004 等）に誤って付いた
#   (3) 「EC-CUBE更新なし」→ 操作手順が「EC-CUBEに価格変更を反映させる」と明記する行
#       （STI-PRICE-002-004 等3行）で、同じ行の別の列と矛盾した
# 確認対象は1要素に複数の観測先を並記しており、そこから行全体の実行方法を要約すると
# 必ず他列と衝突する。更新有無・確認手段は14列目の確認対象に原文で残す。
EXEC_VALUES = ("手動",)

# 元TSVの規模。ここが変わる＝正本(all_scenario_test_items.tsv)が更新されたということなので、
# 意図した更新かを人が確認してから定数を直す。入力と出力の両方が同時に1行落ちるような
# 静かな欠落は、入力自身を基準にした照合では検出できない。
EXPECTED_TOTAL = 1067
EXPECTED_BY_BIZ = {
    "商品登録・編集": ("product", 101), "価格管理": ("price", 37), "店頭買取": ("kaitori", 78),
    "仕入れ業務": ("shiire", 39), "在庫管理": ("zaiko", 261), "店頭受取受注管理": ("order", 141),
    "通販受注管理": ("tsuhan", 171), "ネット買取": ("online", 150), "イベント管理": ("event", 67),
    "デッキ登録": ("deck", 22),
}


class GateError(Exception):
    """ハードゲート違反。黙って落とさず必ず異常終了させる。"""


def parse_precondition(text: str) -> "OrderedDict[str, str]":
    """『元シナリオ: … / 業務: … / … / シードデータ: …』を分解する。
    値自身が ' / ' を含む（シードデータ）ため、既知キーの出現位置で切り出す。
    キー境界の探索位置と切断位置は同一の一致を使う（別々に取ると値が重複帰属する）。"""
    bounds: list[tuple[str, int, int]] = []   # (キー, マーカー開始, 値開始)
    pos = 0
    for key in PRE_KEYS:
        if not bounds:
            pat = re.compile(r"(?:^|\s/\s)" + re.escape(key) + r":\s")
            m = re.compile(re.escape(key) + r":\s").match(text)
        else:
            pat = re.compile(r"\s/\s" + re.escape(key) + r":\s")
            m = pat.search(text, pos)
        if not m:
            raise GateError(f"前提条件のキー '{key}' を検出できない: {text[:120]}")
        # 同じキーのマーカーが2回以上現れると、値側の偽マーカーと正規マーカーを区別できず
        # ラウンドトリップ(G2)も成立してしまうため、ここで弾く。
        hits = len(pat.findall(text))
        if hits != 1:
            raise GateError(f"前提条件のキー '{key}' のマーカーが{hits}回出現: {text[:120]}")
        bounds.append((key, m.start(), m.end()))
        pos = m.end()
    out: "OrderedDict[str, str]" = OrderedDict()
    for i, (key, _start, vstart) in enumerate(bounds):
        vend = len(text) if i + 1 == len(bounds) else bounds[i + 1][1]
        out[key] = text[vstart:vend].strip()
    # G2: 再直列化が入力と一致すること（値中に偽のキー区切りが紛れていれば必ず落ちる）
    rebuilt = " / ".join(f"{k}: {v}" for k, v in out.items())
    if rebuilt != text.strip():
        raise GateError(f"前提条件のラウンドトリップ不一致: {text[:120]}")
    return out


def build_precondition(p: "OrderedDict[str, str]") -> str:
    """他列で復元できないキーをすべて残して前提条件を1行に再構成する。
    落とすのは 業務(機能名の ' — ' 前) / 元シナリオの表題(' — ' 後) /
    データパターンID・種別(入力データ列) / シードデータ(使用シード列) だけで、
    いずれも G8 の逆変換で入力と完全一致することを検証する。"""
    scn = p["元シナリオ"].split(" ", 1)[0]          # SCN-… のIDのみ（表題は機能名にある）
    cond, delta = p["業務経路条件"].strip(), p["前提差分"].strip()
    # 前提差分は 1,033行で「業務経路条件＋追加の前提」の形。全文再掲を避け、差分側は
    # 追加分だけを『追加前提』として出す。ラベルで形を区別するので逆変換で再結合でき、
    # G8が全行で復元を検証する（前方一致しない34行は両方を全文で残す）。
    if delta.startswith(cond):
        rest = delta[len(cond):].strip()
        tail = f"追加前提: {rest}" if rest else ""
    else:
        tail = f"前提差分: {delta}"
    parts = [
        f"元シナリオ {scn}",
        f"経路{p['経路ID']}（{p['経路種別']}）",
        f"主アクター: {p['主アクター']}",
        f"業務経路条件: {cond}",
        tail,
        f"最終業務状態: {p['最終業務状態']}",
        f"関連システム: {p['関連システム']}",
    ]
    return "／".join(one_line(x) for x in parts if x)


def parse_input(text: str) -> dict[str, str]:
    """『データパターンID=… / 種別=… [/ 分岐ID=…] / 目的=… / 入力=…』を分解する。
    分岐ID は分岐/異常行(34件)にのみ現れる独立フィールドで、種別に含めてはならない。"""
    m = re.match(r"データパターンID=(?P<dpid>.*?) / 種別=(?P<kind>.*?)"
                 r"(?: / 分岐ID=(?P<branch>.*?))?"
                 r" / 目的=(?P<purpose>.*?)(?: / 入力=(?P<data>.*))?$", text, flags=re.S)
    if not m:
        raise GateError(f"入力データの形式が想定外: {text[:120]}")
    d = {k: (v or "").strip() for k, v in m.groupdict().items()}
    if " / " in d["kind"] or "=" in d["kind"]:
        raise GateError(f"種別に別フィールドが混入: {d['kind']!r}")
    # G6: 分解結果を再直列化して入力と完全一致すること。分岐IDの欠落・重複・
    # 値中への偽マーカー混入は、正規表現が任意フィールドを黙って読み飛ばすため
    # ここでしか検出できない。
    order = [("データパターンID", "dpid"), ("種別", "kind"), ("分岐ID", "branch"),
             ("目的", "purpose"), ("入力", "data")]
    rebuilt = " / ".join(f"{label}={d[key]}" for label, key in order if d[key])
    if rebuilt != text.strip():
        raise GateError(f"入力データのラウンドトリップ不一致: {text[:120]}")
    for label, _key in order:
        hits = len(re.findall(r"(?:^| / )" + re.escape(label) + r"=", text))
        if hits > 1:
            raise GateError(f"入力データのフィールド '{label}' が{hits}回出現: {text[:120]}")
    # G7: 分岐IDとデータパターンIDの整合。実データでは DP-A/DP-E の34行が必ず同記号の分岐IDを
    # 持ち(A22/E12)、DP-Nの1,033行は持たない。この対応が崩れる入力＝分岐IDの欠落や取り違えで、
    # ラウンドトリップだけでは検出できない(欠落した入力もそれ自体は自己整合するため)。
    m2 = re.match(r"DP-([NAE])\d+$", d["dpid"])
    if not m2:
        raise GateError(f"データパターンIDの形式が想定外: {d['dpid']!r}")
    sym = m2.group(1)
    if sym == "N" and d["branch"]:
        raise GateError(f"DP-N に分岐ID '{d['branch']}' が付いている")
    if sym in ("A", "E"):
        # 記号だけでなく番号も照合する。生成元 generate_test_items.py:739 の対応規則は
        # expected_id = f"DP-{branch_id[0]}{numeric:03d}" で、A2 なら DP-A002 でなければならない。
        mb = re.fullmatch(r"([AE])(\d+)", d["branch"])
        if not mb or f"DP-{mb.group(1)}{int(mb.group(2)):03d}" != d["dpid"]:
            raise GateError(f"{d['dpid']} と分岐ID {d['branch']!r} が対応しない")
    return d


def build_input(d: dict[str, str]) -> str:
    """分解済みの入力データを1行に整える。"""
    parts = [f"{d['dpid']}（{d['kind']}）"]
    if d["branch"]:
        parts.append(f"分岐ID: {d['branch']}")
    parts.append(f"目的: {one_line(d['purpose'])}")   # 句点も原文どおり残す(G8で逆変換照合)
    if d["data"]:
        parts.append(f"入力: {one_line(d['data'])}")
    return "／".join(parts)


def build_steps(text: str) -> str:
    """複数行の手順を1行へ平坦化する。先頭の『担当者: X』はステップ実施者であり
    主アクターとは別概念のため保持する。『対象: …』の従属行は直前の手順へ併合する。"""
    actor = ""
    steps: list[str] = []
    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            continue
        if line.startswith("担当者: ") and not steps and not actor:
            actor = line
            continue
        if re.match(r"^\d+\.\s", line):
            steps.append(line)
        elif steps:
            steps[-1] += f"、{line}"
        else:
            steps.append(line)
    body = one_line(" ".join(steps))
    if actor and body:
        return f"{one_line(actor)}／{body}"
    return body or one_line(actor) or "—"


def norm_expect(text: str) -> str:
    """期待結果の文末を『〜こと』で統一する（結合テスト具体化TSVと同じ規則）。"""
    t = one_line(text).rstrip("。、 ")
    if not t:
        return "—"
    return t if t.endswith("こと") else t + "こと"


def build_targets(text: str) -> str:
    """確認対象を逐語で転記する。重複要素も原文どおり残す(出現回数自体が情報)。"""
    parts = [x.strip() for x in one_line(text).split(" / ")]
    return " / ".join(p for p in parts if p) or "—"


def exec_method(targets: str) -> str:
    """テストの実行方法を決める。シナリオ層に自動実行ハーネスは無いため全行「手動」。
    これは列の性質上プロジェクト事実であり、元TSVからの導出ではない（モジュール説明参照）。
    確認手段の要約は一切行わない（EXEC_VALUES のコメント参照）。"""
    return "手動"


def one_line(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").replace("　", " ")).strip()


def biz_code(biz: str) -> str:
    """業務名→出力ファイルの業務コード。固定マップで引く。
    テストIDから拾って後勝ちで決めると、1行のID改変でファイル全体を誤命名できてしまう。"""
    if biz not in EXPECTED_BY_BIZ:
        raise GateError(f"未知の業務『{biz}』(EXPECTED_BY_BIZ に無い)")
    return EXPECTED_BY_BIZ[biz][0]


def convert(row: list[str], idx: dict[str, int]) -> tuple[str, list[str]]:
    get = lambda c: row[idx[c]] if idx[c] < len(row) else ""  # noqa: E731
    pre = parse_precondition(get("前提条件"))
    inp = parse_input(get("入力データ/リクエスト内容"))
    ifid = one_line(get("I/FID"))
    out = [
        one_line(get("機能名")),
        one_line(get("テストID")),
        ifid if ifid not in ("", "-") else "—",
        one_line(get("テスト観点")),
        one_line(get("優先度")),
        one_line(get("テスト項目名")),
        build_precondition(pre),
        one_line(pre["シードデータ"]) or "—",
        build_input(inp),
        build_steps(get("操作手順/実行方法")),
        norm_expect(get("期待結果／レスポンス")),
        "—",
        exec_method(build_targets(get("確認対象"))),
        build_targets(get("確認対象")),
    ]
    # G3: 前提条件から落とすキーが、同一出力行の他列から復元できること
    biz = out[0].split(" — ")[0]
    if pre["業務"] != biz:
        raise GateError(f"{out[1]}: 業務『{pre['業務']}』が機能名から復元できない")
    # G10: テストIDの業務記号が機能名の業務と対応すること（出力先ファイルの決定根拠）
    if out[1].split("-")[1].lower() != biz_code(biz):
        raise GateError(f"{out[1]}: テストIDの業務記号が業務『{biz}』と対応しない")
    # 部分一致では『代替系』が『代替系 / 分岐ID=A1』を通してしまうため、分解値と完全一致で照合する
    if pre["データパターンID"] != inp["dpid"] or pre["データパターン種別"] != inp["kind"]:
        raise GateError(f"{out[1]}: データパターンID/種別が入力データ列と一致しない "
                        f"前提({pre['データパターンID']}/{pre['データパターン種別']}) "
                        f"入力({inp['dpid']}/{inp['kind']})")
    if one_line(pre["シードデータ"]) != out[7]:
        raise GateError(f"{out[1]}: シードデータが使用シード列と一致しない")
    return out[0].split(" — ")[0], out


def restore(out: list[str]) -> list[str]:
    """G8の逆変換: 出力14列から入力11列を復元する。復元できない＝情報が失われている。
    `自動検証` と `実行方法` は元TSV由来でないため復元対象外。"""
    o = dict(zip(OUT_COLS, out))
    biz, _, title = o["機能名"].partition(" — ")

    m = re.match(r"元シナリオ (?P<scn>\S+)／経路(?P<rid>[^（]+)（(?P<rkind>[^）]+)）"
                 r"／主アクター: (?P<actor>.*?)／業務経路条件: (?P<cond>.*?)"
                 r"(?:／(?P<label>追加前提|前提差分): (?P<tail>.*?))?"
                 r"／最終業務状態: (?P<final>.*?)／関連システム: (?P<sys>.*)$", o["前提条件"])
    if not m:
        raise GateError(f"{o['テストID']}: 前提条件を逆変換できない")
    g = m.groupdict()
    # 『追加前提』は業務経路条件の後続分なので再結合する。『前提差分』はそのまま全文。
    if g["label"] == "追加前提":
        g["delta"] = f"{g['cond']} {g['tail']}".strip()
    elif g["label"] == "前提差分":
        g["delta"] = g["tail"]
    else:
        g["delta"] = g["cond"]

    mi = re.match(r"(?P<dpid>DP-[NAE]\d+)（(?P<kind>[^）]*)）"
                  r"(?:／分岐ID: (?P<branch>[^／]*))?／目的: (?P<purpose>.*?)"
                  r"(?:／入力: (?P<data>.*))?$", o["入力データ/リクエスト内容"])
    if not mi:
        raise GateError(f"{o['テストID']}: 入力データを逆変換できない")
    gi = {k: (v or "") for k, v in mi.groupdict().items()}

    pre = " / ".join([
        f"元シナリオ: {g['scn']} {title}", f"業務: {biz}", f"経路ID: {g['rid']}",
        f"経路種別: {g['rkind']}", f"業務経路条件: {g['cond']}",
        f"最終業務状態: {g['final']}", f"主アクター: {g['actor']}",
        f"関連システム: {g['sys']}", f"データパターンID: {gi['dpid']}",
        f"データパターン種別: {gi['kind']}", f"前提差分: {g['delta']}",
        f"シードデータ: {o['使用シード']}",
    ])
    inp = " / ".join([f"データパターンID={gi['dpid']}", f"種別={gi['kind']}"]
                     + ([f"分岐ID={gi['branch']}"] if gi["branch"] else [])
                     + [f"目的={gi['purpose']}"]
                     + ([f"入力={gi['data']}"] if gi["data"] else []))

    actor, _, body = o["操作手順/実行方法"].partition("／")
    lines = [actor]
    nums = [int(x) for x in re.findall(r"(?:^|\s)(\d+)\. ", body)]
    if nums != list(range(1, len(nums) + 1)):
        raise GateError(f"{o['テストID']}: 手順番号が連番でない {nums}")
    chunks = re.split(r"(?:^|\s)\d+\. ", body)[1:]
    for i, chunk in enumerate(chunks, 1):
        head, sep, tail = chunk.partition("、対象: ")
        lines.append(f"{i}. {head}")
        if sep:
            lines.append(f"対象: {tail}")

    return [o["機能名"], o["テストID"], "-" if o["I/FID"] == "—" else o["I/FID"],
            o["テスト観点"], o["優先度"], o["テスト項目名"], pre, inp,
            "\n".join(lines), o["期待結果／レスポンス"] + "。", o["確認対象"]]


def verify_output_only_cols(out: list[str]) -> None:
    """G9: 元TSVに対応の無い2列を検査する。G8は入力由来の列しか照合しないため、
    この2列が壊れても他のゲートはすべて通過してしまう。"""
    o = dict(zip(OUT_COLS, out))
    if o["自動検証（内部: session/DB/URL）"] != "—":
        raise GateError(f"{o['テストID']}: 自動検証列は全行『—』のはず: {o['自動検証（内部: session/DB/URL）']!r}")
    if o["実行方法"] not in EXEC_VALUES:
        raise GateError(f"{o['テストID']}: 実行方法が許可値外: {o['実行方法']!r}")


def verify_restored(src_row: list[str], out: list[str], idx: dict[str, int]) -> None:
    """G8: 逆変換の結果を入力行と照合する。許す差は各セル内の空白の畳み込みのみで、
    それ以外の欠落・改変（前提条件の表題差し替え等）はここで必ず落ちる。"""
    got = restore(out)
    for i, col in enumerate(SRC_COLS):
        want = src_row[idx[col]]
        if col == "操作手順/実行方法":
            a = [one_line(x) for x in want.splitlines() if x.strip()]
            b = [one_line(x) for x in got[i].splitlines() if x.strip()]
        else:
            a, b = one_line(want), one_line(got[i])
        if a != b:
            raise GateError(f"{out[1]}: 逆変換不一致 [{col}]\n  入力: {a!r:.160}\n  復元: {b!r:.160}")


def verify_written(paths: dict[str, Path], groups: "OrderedDict[str, list[list[str]]]",
                   expected_ids: list[str]) -> None:
    """G5: 書き出したファイルを読み直し、業務ごとに**行の並びまで含めて**メモリ上の生成結果と
    完全一致することを照合する。ID集合の突合だけでは、行が別の業務ファイルへ入れ替わっても
    通過してしまう。あわせて全体のID一意性・総行数・想定外の残存ファイルを検査する。"""
    if len(set(expected_ids)) != len(expected_ids):
        dup = [i for i in set(expected_ids) if expected_ids.count(i) > 1]
        raise GateError(f"入力のテストID重複: {sorted(dup)[:5]}")
    seen_ids: list[str] = []
    for biz, path in paths.items():
        with path.open(encoding="utf-8", newline="") as fh:
            rows = list(csv.reader(fh, delimiter="\t"))
        if rows[0] != OUT_COLS:
            raise GateError(f"{path.name}: ヘッダ不一致")
        if rows[1:] != groups[biz]:
            raise GateError(f"{path.name}: 読み直した内容が生成結果と一致しない")
        for r in rows[1:]:
            if len(r) != len(OUT_COLS):
                raise GateError(f"{path.name}: {r[1] if len(r) > 1 else '?'} が{len(r)}列")
            if any("\n" in c or "\t" in c or "\r" in c for c in r):
                raise GateError(f"{path.name}: セル内改行/タブ残存")
            if r[0].split(" — ")[0] != biz:
                raise GateError(f"{path.name}: {r[1]} は業務『{r[0].split(' — ')[0]}』で所属ファイルが違う")
            verify_output_only_cols(r)
            seen_ids.append(r[1])
    if len(set(seen_ids)) != len(seen_ids):
        dup = [i for i in set(seen_ids) if seen_ids.count(i) > 1]
        raise GateError(f"出力のテストID重複: {sorted(dup)[:5]}")
    if sorted(seen_ids) != sorted(expected_ids):
        missing = set(expected_ids) - set(seen_ids)
        extra = set(seen_ids) - set(expected_ids)
        raise GateError(f"テストID集合不一致 欠落{len(missing)}件 余剰{len(extra)}件 "
                        f"{sorted(missing)[:3]} {sorted(extra)[:3]}")
    stale = sorted(p.name for p in OUT_DIR.glob("*.tsv") if p not in set(paths.values()))
    if stale:
        raise GateError(f"想定外の残存TSV: {stale}（旧出力を手動で削除すること）")


def main() -> int:
    csv.field_size_limit(10 ** 7)
    with SRC.open(encoding="utf-8", newline="") as fh:
        reader = csv.reader(fh, delimiter="\t")
        header = next(reader)
        src_rows = list(reader)
    # G1: 入力の列構成が想定どおりであること
    if header != SRC_COLS:
        print(f"NG 入力ヘッダ不一致: {header}")
        return 1

    idx = {c: i for i, c in enumerate(header)}
    groups: "OrderedDict[str, list[list[str]]]" = OrderedDict()
    try:
        for row in src_rows:
            if len(row) != len(SRC_COLS):
                raise GateError(f"入力行の列数不正: {row[:2]} {len(row)}列")
            biz, out = convert(row, idx)
            verify_restored(row, out, idx)
            verify_output_only_cols(out)
            groups.setdefault(biz, []).append(out)
    except GateError as e:
        print(f"NG {e}")
        return 1

    # G11: 業務の集合と業務別件数が既知の規模と一致すること。入力と出力の両方から同時に
    # 1行が失われる静かな欠落は、入力自身を基準にした照合では検出できない。
    actual = {b: len(rows) for b, rows in groups.items()}
    expect = {b: n for b, (_c, n) in EXPECTED_BY_BIZ.items()}
    if actual != expect or sum(actual.values()) != EXPECTED_TOTAL:
        print(f"NG 規模不一致: 期待{expect}(計{EXPECTED_TOTAL}) 実際{actual}(計{sum(actual.values())})")
        print("   正本を意図的に更新した場合は EXPECTED_TOTAL / EXPECTED_BY_BIZ を直すこと")
        return 1

    # G4: 出力パスが業務ごとに一意であること（衝突すると後勝ちで片方が消える）
    try:
        paths = {biz: OUT_DIR / f"sti-{biz_code(biz)}_concretized.tsv" for biz in groups}
    except GateError as e:
        print(f"NG {e}")
        return 1
    if len(set(paths.values())) != len(paths):
        dup = [b for b in paths if list(paths.values()).count(paths[b]) > 1]
        print(f"NG 出力パス衝突: {dup}")
        return 1

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for biz, rows in groups.items():
        with paths[biz].open("w", encoding="utf-8", newline="") as fh:
            w = csv.writer(fh, delimiter="\t", lineterminator="\n")
            w.writerow(OUT_COLS)
            w.writerows(rows)
        print(f"出力: {paths[biz].relative_to(ROOT)}  {len(rows)}行  ({biz})")

    try:
        verify_written(paths, groups, [r[idx["テストID"]] for r in src_rows])
    except GateError as e:
        print(f"NG {e}")
        return 1
    print(f"合計 {len(src_rows)}行 / {len(groups)}ファイル")
    print("ゲート: G1入力列構成 G2前提条件ラウンドトリップ G3落としたキーの復元可能性 "
          "G4出力パス一意 G5書き出し後の再読込照合とID一意性 G6入力データラウンドトリップ "
          "G7分岐IDとDPIDの整合 G8出力→入力の逆変換照合 G9出力専用2列の検査 "
          "G10テストIDの業務記号 G11既知規模との一致 …すべてPASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
