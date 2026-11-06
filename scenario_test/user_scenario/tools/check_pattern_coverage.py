"""業務フローの全パターンが、各業務のシナリオ一覧の「業務フローパターンの網羅」表に入っているかを確かめる。

使い方: python check_pattern_coverage.py [業務名 ...]
  業務名を省くと全業務を確かめる。

確かめること
- 業務フロー（scenario_test/markdown/NN_*.md）の「業務フローパターン」の表にある全パターンが、表に1行ずつあること
- 表の各行に、シナリオID（シナリオ一覧の表にあるもの）か「対象外」と理由があること
- 表に、業務フローに無いパターンが載っていないこと
- 表の「パターン」欄は業務フローのパターン名をそのまま写す（空白の違いは無視する。12_在庫管理は番号7が2つある）
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]  # scenario_test
MD = ROOT / "markdown"
US = ROOT / "user_scenario"

# 業務 → 業務フローのファイル番号（現状版と tobe 版）
SOURCES = {
    "通販": ["16", "17"],
    "店頭受取受注管理": ["05"],
    "店頭買取": ["06", "07"],
    "イベント管理": ["08"],
    "商品登録・編集": ["09", "10"],
    "価格管理": ["11"],
    "在庫管理": ["12", "13"],
    "ネット買取": ["14"],
    "仕入れ業務": ["15"],
    "デッキ登録": ["18"],
    # 通しシナリオ（シート全体を通すもの）
    "通しシナリオ/UTH-02_ネット買取": ["14"],
    "通しシナリオ/UTH-03_店頭買取": ["06", "07"],
    "通しシナリオ/UTH-04_デッキ登録からイベント開催まで": ["08", "18"],
    "通しシナリオ/UTH-05_フロント注文から出荷まで": ["16", "17"],
}

PAT_LINE = re.compile(r"^- \*\*R\d+\*\*: (\d+)　｜　(.+)$")


def patterns(fileno):
    f = next(MD.glob(f"{fileno}_*.md"))
    out, on = [], False
    for line in f.read_text(encoding="utf-8").splitlines():
        if "業務フローパターン" in line:
            on = True
            continue
        if on and ("参考マニュアル" in line or "アクター" in line):
            break
        m = PAT_LINE.match(line) if on else None
        if m:
            out.append((fileno, m.group(1), m.group(2).strip()))
    return out


def norm(s):
    return re.sub(r"\s+", "", s)


def table_rows(text, heading):
    if heading not in text:
        return None
    body = text.split(heading, 1)[1]
    body = body.split("\n## ", 1)[0]
    rows = []
    for line in body.splitlines():
        if not line.startswith("|") or line.startswith("|---") or line.startswith("| 業務フロー |"):
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        rows.append(cells)
    return rows


def check(biz):
    errors = []
    f = US / biz / "scenario_list.md"
    if not f.exists():
        return [f"{biz}: scenario_list.md が無い"], 0
    text = f.read_text(encoding="utf-8")
    ids = set(re.findall(r"^\| (U[A-Z]{2}-\d+) \|", text, flags=re.M))
    rows = table_rows(text, "## 業務フローパターンの網羅")
    if rows is None:
        return [f"{biz}: 「## 業務フローパターンの網羅」の表が無い"], 0
    # 同じファイルに同じ番号が2つある（12の7）ので、番号とパターン名の組で見る
    need = {(a, b, norm(c)): c for a, b, c in sum((patterns(n) for n in SOURCES[biz]), [])}
    seen = {}
    for cells in rows:
        if len(cells) < 5:
            errors.append(f"{biz}: 列が足りない行: {cells}")
            continue
        key = (cells[0], cells[1], norm(cells[2]))
        if key in seen:
            errors.append(f"{biz}: 同じパターンが2行ある: {key}")
        seen[key] = cells
        if key not in need:
            errors.append(f"{biz}: 業務フローに無いパターン: {key} {cells[2]}")
            continue
        refs = re.findall(r"U[A-Z]{2}-\d+", cells[3])
        if refs:
            bad = [r for r in refs if r not in ids]
            if bad:
                errors.append(f"{biz}: シナリオ一覧に無いID {bad}: {key}")
        elif "対象外" not in cells[3] or not cells[4] or cells[4] in ("-", "—"):
            errors.append(f"{biz}: シナリオも対象外の理由も無い: {key} {cells[2]}")
    for key, name in need.items():
        if key not in seen:
            errors.append(f"{biz}: 表に無いパターン: {key} {name}")
    return errors, len(need)


def main():
    targets = sys.argv[1:] or list(SOURCES)
    total_err, total_pat = 0, 0
    for biz in targets:
        errs, n = check(biz)
        total_pat += n
        total_err += len(errs)
        print(f"{biz}: パターン{n}件 {'OK' if not errs else 'NG ' + str(len(errs)) + '件'}")
        for e in errs:
            print("  " + e)
    print(f"合計: パターン{total_pat}件・問題{total_err}件")
    sys.exit(1 if total_err else 0)


if __name__ == "__main__":
    main()
