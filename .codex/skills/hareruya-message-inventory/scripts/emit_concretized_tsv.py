#!/usr/bin/env python3
"""候補md(§4具体化ケース＋§8会計)から、母集合 all_it_cases.tsv と同一テンプレート(11列)の
concretized.tsv を出力する。

出力: integration_test/e2e/exec/tsv/<fid>_<slug>_concretized.tsv
- 列は all_it_cases.tsv と同一: 機能名/テストID/I/FID/テスト観点/優先度/テスト項目名/
  前提条件/入力データ/リクエスト内容/操作手順/実行方法/期待結果／レスポンス/実行方法
- 各母集合行(テストID=IT-<FID>-...-NNN)を保持し、§8の会計に従い:
    bound  → §7-10(前提/入力/手順/期待)を対応§4ケースの具体値へ差し替え・実行方法を精緻化・[L1:..]付与
    TBD    → 期待に「【TBD】理由」、実行方法「保留(TBD)」
    excluded → 期待に「【対象外(excluded)】理由」、実行方法「対象外(excluded)」
母集合のテストID・機能名・I/FID・観点・優先度・項目名は原則保持（監査追跡性）。

使い方: python3 emit_concretized_tsv.py --fid m03-02
"""
from __future__ import annotations

import argparse
import csv
import glob
import re
from pathlib import Path

import lib_messages as L

ROOT = L.DOC_ROOT
DRAFT_DIR = ROOT / "integration_test/e2e/exec/_drafts"
OUT_DIR = ROOT / "integration_test/e2e/exec/tsv"
ALL_IT = ROOT / "integration_test/all_it_cases.tsv"
COLS = ["機能名", "テストID", "I/FID", "テスト観点", "優先度", "テスト項目名",
        "前提条件", "入力データ/リクエスト内容", "操作手順/実行方法", "期待結果／レスポンス", "実行方法"]
# 出力は母集合11列に「自動検証（内部）」を期待結果と実行方法の間へ挿入した12列。
OUT_COLS = COLS[:10] + ["自動検証（内部: session/DB/URL）"] + [COLS[10]]

# 目視できない内部状態の手掛かり（この語を含む句は「自動検証(内部)」列へ寄せる）
INTERNAL_HINT = re.compile(
    r"(session|セッション|page_count|eccube\.admin|に保存|へ保存|保存され|リダイレクト|302|"
    r"クエリ|sort_no|dtb_|COUNT|レコードが追加|レコードを|更新される（時刻|update_date|"
    r"フラグ|キーに|に格納|永続|DB(上|の|へ|で)|テーブル)")


def split_expectation(text: str) -> tuple[str, str]:
    """期待テキストを (画面で目視できる, 自動検証(内部)) に分割。
    明示マーカー『自動検証(内部):』があればそこで分割。無ければ句(、／。)単位で内部語を含む句を内部側へ。"""
    if not text or text == "—":
        return text, "—"
    m = re.search(r"／?\s*自動検証\s*[（(]?内部[^:：]*[)）]?\s*[:：]\s*(.+)$", text)
    if m:
        obs = text[:m.start()].rstrip("／ 。").strip()
        return (obs or "（画面上の目立った変化なし）"), m.group(1).strip()
    # 明示マーカーが無い場合:
    # (1) 全文がDB/内部のみの主張(画面動詞なし)なら丸ごと内部へ寄せる。
    # (2) それ以外(融合文/純画面)は保守的に全文を画面側へ残す（機械分割で意味を壊さない）。
    db_only = re.search(r"(dtb_|行数・値が不変|テーブルも行数|COUNT[^。]*不変|update_date|レコードが追加|に格納|永続化)", text)
    screen_verb = re.search(r"(表示|非表示|遷移|リダイレクト先|メッセージ|画面|含まれ|一覧に|ボタン|欄|プレビュー|チェック)", text)
    if db_only and not screen_verb:
        return "（画面上の目立った変化なし。DB/内部の検証のみ）", text
    return text, "—"


def load_all_it(fid: str):
    """母集合の <fid> 行を テストID末尾NNN→(11列list) で返す。"""
    pref = f"IT-{fid.upper()}-"
    out = {}
    with ALL_IT.open(encoding="utf-8", newline="") as fh:
        r = csv.reader(fh, delimiter="\t")
        header = next(r)
        idx = {c: i for i, c in enumerate(header)}
        for row in r:
            tid = row[idx["テストID"]]
            if tid.startswith(pref):
                m = re.search(r"-(\d{3})$", tid)
                if m:
                    out[m.group(1)] = [row[idx[c]] if idx.get(c) is not None and idx[c] < len(row) else "" for c in COLS]
    return out


def _norm_cell(s: str) -> str:
    return s.replace("*", "").strip()


def _expand_nums(text: str) -> list[str]:
    """'-019〜-032' や '-073,-074' や '-078' 混在から NNN リストを展開。"""
    out = set()
    # 範囲 -NNN〜-MMM / -NNN～-MMM
    for a, b in re.findall(r"-(\d{3})\s*[〜～]\s*-?(\d{3})", text):
        for i in range(int(a), int(b) + 1):
            out.add(f"{i:03d}")
    # 単体 -NNN（範囲で消費済みも含め全部拾って良い）
    for n in re.findall(r"-(\d{3})\b", text):
        out.add(n)
    return sorted(out)


def parse_section8(dtext: str):
    """§8: 会計サマリ(範囲/列挙のTBD・excluded)＋対応表(per-row bound)を統合。
    NNN → (disposition, cref, 要旨)。per-rowを優先。"""
    disp = {}
    # 1) サマリ行: | **TBD** | 3 | -073,-074（…）／-078（…） |  等
    for line in dtext.splitlines():
        m = re.match(r"^\|\s*\**\s*(TBD|excluded|DELEG)\s*\**\s*\|\s*\**\d+\**\s*\|\s*(.*?)\s*\|\s*$", line)
        if m:
            d, body = m.group(1), m.group(2)
            for nnn in _expand_nums(body):
                disp.setdefault(nnn, (d, "", body[:80]))
    # 2) per-row対応表: | NNN | 要旨 | 会計(bold可) | C-ref |
    for line in dtext.splitlines():
        m = re.match(r"^\|\s*(\d{3})\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*$", line)
        if not m:
            continue
        nnn, yoshi, dcell, cref = m.group(1), m.group(2), _norm_cell(m.group(3)), m.group(4)
        dm = re.match(r"(bound|TBD|excluded|DELEG|要ソース確認)", dcell)
        if not dm:
            continue
        cm = re.search(r"C-(\d{3}[A-Z]?)", cref)
        disp[nnn] = (dm.group(1), cm.group(1) if cm else "", yoshi)  # per-row優先
    return disp


def parse_viewpoint_corrections(dtext: str) -> dict:
    """§『観点補正』表: | 母集合末尾NNN | 正しい観点 | 根拠 | → NNN→正しい観点。
    母集合の観点ラベル誤り(例 認証テストが更新内容, メッセージ表示が非同期更新)を派生ビューで是正する。
    母集合(all_it_cases)自体は不変。"""
    corr = {}
    in_sec = False
    for line in dtext.splitlines():
        if line.startswith("## ") and "観点補正" in line:
            in_sec = True
            continue
        if in_sec and line.startswith("## "):
            break
        if in_sec:
            m = re.match(r"^\|\s*(\d{3})\s*\|\s*([^|]+?)\s*\|", line)
            if m and m.group(2) not in ("正しい観点", "観点"):
                corr[m.group(1)] = m.group(2).strip()
    return corr


def parse_seed_map(dtext: str) -> dict:
    """§2 SEED三段参照表: | SEED-XXX | 内容 | 用途 | → SEED-XXX→短い人間向けラベル。"""
    m = {}
    for line in dtext.splitlines():
        row = re.match(r"^\|\s*(SEED-[A-Z0-9\-]+)\s*\|\s*(.+?)\s*\|", line)
        if row:
            code, desc = row.group(1), row.group(2)
            # 内容の先頭句（最初の「・」「。」まで・括弧のidは残す）を短ラベルに
            short = re.split(r"[・。]", desc)[0].strip().strip("`")
            m[code] = short or code
    # 汎用（内部注記の付いた§2記述より優先）
    m["SEED-M01-ADMIN"] = "管理者でログイン済み"
    return m


def humanize(text: str, seed: dict) -> str:
    """機械タグ・内部コードを人間可読の自然文へ。内容(意味)は変えない。"""
    if not text or text == "—":
        return text
    t = text
    # 追跡タグ除去（L1・fixture・候補§参照は正本md/oracle側に保持）
    t = re.sub(r"\s*\[L1:[^\]]*\]", "", t)
    t = re.sub(r"\s*\[候補§4対応[^\]]*\]", "", t)
    t = re.sub(r"\s*\(?（?候補§[0-9.．/／ ]*参照）?\)?", "", t)
    t = t.replace("@TBD-D5", "")
    t = re.sub(r"\s*fixture\s*:\s*", "", t)
    # SEEDコード→人間向けラベル
    for code, label in sorted(seed.items(), key=lambda x: -len(x[0])):
        t = t.replace(code, label)
    t = re.sub(r"SEED-[A-Z0-9\-]+", "所定の前提データ", t)  # 未定義SEEDの保険
    # URL/技術トークンの緩和
    t = t.replace("%eccube_admin_route%", "管理画面ルート").replace("/%eccube_admin_route%", "/管理画面ルート")
    t = re.sub(r"GET\s+", "", t)  # 「GET …/edit を開く」→「…/edit を開く」
    t = t.replace("…/", "管理画面の /").replace("…", "")  # 省略記号を可読化
    # 「要実機」注記の括弧を除去（セレクタ具体/失敗再現手段等は正本md §6/§9に保持）
    t = re.sub(r"\s*[（(][^（）()]*要実機[^（）()]*[)）]", "", t)
    # 内部注記の除去（パイロット共通 等）と冗長表現の圧縮
    t = re.sub(r"[（(]\s*パイロット共通\s*[)）]", "", t)
    t = re.sub(r"ログイン済\s*[（(]\s*管理者でログイン済み\s*[)）]", "管理者でログイン済み", t)
    t = re.sub(r"[（(]\s*[)）]", "", t)  # 空括弧
    # 手順の「1. … 2. …」区切りを読点/改行で自然に
    t = re.sub(r"\s*/\s*(?=\d\.)", "／", t)
    t = re.sub(r"\s{2,}", " ", t).strip("／ ").strip()
    return t or "—"


def clean_operation_steps(text: str) -> str:
    """操作手順を純粋なユーザー(UI)操作のみにする: db.ts/afterEach等の検証・後始末を除去し再採番。
    DB検証は『自動検証（内部）』列にあるので手順には書かない。"""
    if not text or text == "—":
        return text
    # db.ts/afterEach を含む括弧注記を除去
    text = re.sub(r"[（(][^（）()]*(db\.ts|afterEach|db\.ts照会|fs\.ts)[^（）()]*[)）]", "", text)
    # 番号ステップに分解し、db.ts/afterEach専用ステップを落として再採番
    parts = re.split(r"(?:^|\s)(\d+)\.\s*", text)
    # parts = ['pre', '1', 'c1', '2', 'c2', ...]
    steps = []
    for i in range(1, len(parts) - 1, 2):
        content = parts[i + 1].strip().rstrip("、。 ")
        if not content:
            continue
        if re.match(r"^(db\.ts|afterEach|fs\.ts)", content):
            continue  # 検証・後始末専用ステップは手順から除外
        # ステップ内の「〜し、db.tsで…」の末尾検証句も削る
        content = re.sub(r"[、,]?\s*(db\.ts|afterEach|fs\.ts)[^。]*", "", content).strip("、。 ")
        if content:
            steps.append(content)
    if not steps:
        # 番号形式でない場合は素の db.ts 句だけ削る
        s = re.sub(r"[、,]?\s*(db\.ts|afterEach|fs\.ts)[^。]*", "", text).strip()
        return s or text
    return " ".join(f"{i}. {c}" for i, c in enumerate(steps, 1))


def tbd_reason(text: str) -> str:
    """TBD期待テキストから人の対応カテゴリを推定。"""
    if "観測" in text or "計装" in text or "通知" in text or "ログ" in text:
        return "観測手段が未整備（外部通知・ログ等）。計装/モック追加の要否を判断、または手動確認"
    if "実機" in text:
        return "稼働環境で実挙動を観測して期待値を確定"
    return "設計/発注者判断で仕様を確定（一次資料に一意な記載なし）"


def parse_section4(dtext: str, fid: str):
    """§4 14列TSV: E2E-<...>C-NNN → dict(前提/入力/手順/期待/観点/優先/項目/実行方法推定)。"""
    slug_key = f"{fid.lower()}_"
    cases = {}
    for line in dtext.splitlines():
        if not line.lstrip().startswith(slug_key):
            continue
        f = line.split("\t")
        if len(f) < 10:
            continue
        m = re.search(r"C-(\d{3}[A-Z]?)$", f[1].strip())
        if not m:
            continue
        pre, inp, ope, exp = f[6], f[7], f[8], f[9]
        # 実行方法推定
        blob = (inp + ope + exp).lower()
        if "db.ts" in blob or "dbで" in ope or "db.tsで" in ope:
            method = "Playwright+DB確認"
        elif "非ui" in blob or "直post" in blob or "request契約" in blob or "curl" in blob:
            method = "非UI"
        else:
            method = "Playwright"
        cases[m.group(1)] = {"前提": pre, "入力": inp, "操作": ope, "期待": exp, "method": method}
    return cases


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--fid", required=True)
    args = ap.parse_args()
    fid = args.fid

    dr = sorted(DRAFT_DIR.glob(f"{fid.lower()}_*_executable_draft.md"))
    if not dr:
        print(f"NG: draft 未検出 ({fid})")
        return 1
    draft = dr[0]
    dtext = draft.read_text(encoding="utf-8")
    slug = draft.name[:-len("_executable_draft.md")]  # <fid>_<...>

    pop = load_all_it(fid)
    disp = parse_section8(dtext)
    cases = parse_section4(dtext, fid)
    if not pop:
        print(f"NG: 母集合行なし (IT-{fid.upper()}-...)")
        return 1

    seedmap = parse_seed_map(dtext)
    vp_corr = parse_viewpoint_corrections(dtext)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    n_bound = n_tbd = n_excl = n_raw = n_needlive = 0
    all_rows = []       # 全数(母集合1:1)
    exec_rows = []      # bound(実行可能)のみ
    for nnn in sorted(pop):
        row = list(pop[nnn])  # 11列(母集合原本)
        if nnn in vp_corr:    # 母集合の観点ラベル誤りを派生ビューで是正（母集合自体は不変）
            row[3] = vp_corr[nnn]
        d = disp.get(nnn)
        is_exec = False
        internal = "—"
        if d is None:
            n_raw += 1
        else:
            dstat, cref, yoshi = d
            yoshi_h = humanize(yoshi, seedmap)
            if dstat == "bound":
                n_bound += 1
                if cref in cases and "要実機" in cases[cref]["操作"]:
                    # 操作の手段自体が要実機＝人間が机上でテストできない → tsv非出力
                    n_needlive += 1
                elif cref in cases:
                    c = cases[cref]
                    row[6] = humanize(c["前提"], seedmap)
                    row[7] = humanize(c["入力"], seedmap)
                    row[8] = clean_operation_steps(humanize(c["操作"], seedmap))
                    obs, internal = split_expectation(humanize(c["期待"], seedmap))
                    row[9] = obs
                    row[10] = c["method"]
                    is_exec = True
                else:
                    row[9] = yoshi_h  # §4対応が引けない(shared) → 要旨
                    is_exec = True
            elif dstat in ("TBD", "要ソース確認"):
                row[6] = "—"
                row[7] = "—"
                row[8] = "自動判定はできない。下記の理由に従い、人が仕様確認または実機確認で期待値を確定する。"
                row[9] = f"【要確認】期待する挙動: {yoshi_h}。／ 人の対応: {tbd_reason(yoshi)}"
                row[10] = "保留(TBD)"; n_tbd += 1
            elif dstat in ("excluded", "DELEG"):
                if dstat == "DELEG":
                    tag, act = "対象外（別導線に委譲）", "実際の処理・DB更新は別機能の担当。当機能では画面側の表示のみ扱う。"
                else:
                    tag, act = "対象外（この機能に該当なし）", "母集合が観点テンプレートから機械生成した行で、当機能には該当機能がない。試験不要。"
                row[6] = "—"
                row[7] = "—"
                row[8] = "—"
                row[9] = f"【{tag}】{act}（該当観点: {row[3]}）"
                row[10] = "対象外"; n_excl += 1
        # TSVは bound(実行可能)行のみ出力。TBD/excludedはcandidate md §8/§9で管理し、tsvには出さない。
        if is_exec:
            out_row = row[:10] + [internal] + [row[10]]
            exec_rows.append(out_row)

    # ★会計完全性(ハードゲート): 母集合の全行が bound/TBD/excluded のいずれかに分類され取りこぼしゼロ。
    N = len(pop)
    if n_raw != 0 or (n_bound + n_tbd + n_excl) != N:
        print("NG 会計不整合: 母集合", N, "に対し bound", n_bound, "+TBD", n_tbd,
              "+excluded", n_excl, "+未分類", n_raw, "＝", n_bound + n_tbd + n_excl + n_raw)
        return 1
    if len(exec_rows) != n_bound - n_needlive:
        print("NG 出力行数不一致:", len(exec_rows), "vs bound", n_bound, "-要実機", n_needlive)
        return 1

    full = OUT_DIR / f"{slug}_concretized.tsv"
    with full.open("w", encoding="utf-8", newline="") as fh:
        w = csv.writer(fh, delimiter="\t", lineterminator="\n")
        w.writerow(OUT_COLS)
        w.writerows(exec_rows)
    # 旧・全数版/別名executable.tsvが残っていれば除去（bound-only一本化）
    old = OUT_DIR / f"{slug}_executable.tsv"
    if old.exists():
        old.unlink()
    print(f"出力(人間が机上でテスト可能な行のみ): {full.relative_to(ROOT)}  {len(exec_rows)}行")
    print(f"  会計: 母集合{N} = bound{n_bound}(内 要実機で非出力{n_needlive}) / TBD{n_tbd} / excluded・DELEG{n_excl}")
    print(f"  tsv非出力: TBD{n_tbd}・excluded{n_excl}・要実機手段{n_needlive}（いずれもmd §8/§9で管理）")
    print("  会計完全性: PASS（取りこぼし0）")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
