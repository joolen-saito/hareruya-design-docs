#!/usr/bin/env python3
"""現行ソース比較で挙がった「表示文言」の指摘を除外リストにする。

対象の絞り込みは2段。

  1) 機械: 確定根拠区分 = LEGACY_BACKED（Excel正本に記述が無く、旧実装 pf-eccube3
     にだけ根拠がある＝現行ソースとの比較で挙がった指摘）
     かつ 確定改修区分名 = 画面表示（直す対象＝文言・ラベル・表示項目・並び・活性制御）
     → 66件
  2) 目視: そのうち「利用者に見える文字列そのもの」の相違を選ぶ → 33件
     スピナー・CSS・DOM id・リッチエディタ・JS挙動・初期値など、文言ではない
     画面まわりの指摘は残す。

Excel設計書に裏付けのある SPEC_BACKED は根拠区分の時点で対象外。

入力: drift_findings_list_effort.tsv
出力: drift_findings_excluded_wording_legacy.tsv
      WORDING_LEGACY_EXCLUSION.md
最終リストの組み立ては build_remaining_list.py が行う。
"""
import csv
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent
CLASS = "LEGACY_BACKED"
FIX = "画面表示"

# drift行番号 -> 何が文言として食い違っているか（1件ずつ読んで付けた）
WORDING = {
    367: "更新成功フラッシュの文言相違",
    406: "取込成功フラッシュの文言・翻訳キー相違",
    429: "ナビゲーション表示名の文言相違",
    501: "0件時見出しの設計文言に到達しない",
    514: "取込完了メッセージの文言相違",
    576: "0件時の固定文言の相違",
    640: "保存成功メッセージの文言相違",
    673: "保存完了メッセージの翻訳キー相違",
    679: "確認済へ変更した際のフラッシュ文言相違",
    685: "登録完了メッセージのキー相違による文言差",
    694: "削除確認ダイアログの文言相違",
    696: "URL重複時のインラインエラー文言相違",
    700: "削除確認ダイアログの文言相違",
    717: "送信ボタン文言の相違（登録／保存）",
    742: "画面上部タイトル帯の文言相違",
    744: "保存成功メッセージの文言相違",
    749: "保存成功フラッシュの文言・キー相違",
    757: "保存成功メッセージの翻訳キー相違",
    762: "保存成功メッセージの文言相違",
    826: "削除確認文言に埋め込む値の相違（イベント名／共通ラベル）",
    827: "削除不可メッセージの翻訳キー相違で設計文言が出ない",
    828: "日程削除不可メッセージの翻訳キー相違で設計文言が出ない",
    834: "保存失敗・支払方法未設定メッセージのキー相違",
    855: "0件時の検索結果なしメッセージの表示有無",
    857: "更新成功・失敗フラッシュの文言相違",
    874: "CSV登録成功フラッシュの文言相違",
    906: "画面タイトルとサブタイトルの表示順",
    948: "登録・削除・検証失敗フラッシュのキー相違による文言差",
    996: "登録成功フラッシュのキー相違による文言差",
    997: "削除確認文言のキーと受け渡し方式の相違",
    1009: "遷移時のフラッシュメッセージの表示有無",
    1017: "日付重複エラーメッセージのキー相違",
    1034: "交差情報が無いセルの固定文言相違（未定義／ハイフン）",
}


def hours(rs):
    s = 0.0
    for r in rs:
        try:
            s += float(r["codex工数"])
        except (TypeError, ValueError):
            pass
    return s


def main() -> int:
    rows = list(csv.DictReader((BASE / "drift_findings_list_effort.tsv").open(encoding="utf-8"),
                               delimiter="\t"))
    idx = {i + 2: r for i, r in enumerate(rows)}

    prior = {}
    for name in ("duplicate", "entrypoint", "front_legacy"):
        p = BASE / f"drift_findings_excluded_{name}.tsv"
        if p.exists():
            for r in csv.DictReader(p.open(encoding="utf-8"), delimiter="\t"):
                prior[int(r["drift行番号"])] = name

    pool = [ln for ln, r in idx.items()
            if ln not in prior and r["確定根拠区分"] == CLASS and r["確定改修区分名"] == FIX]

    stray = sorted(set(WORDING) - set(pool))
    if stray:
        print(f"WORDING に母集合外の行がある: {stray}", file=sys.stderr)
        return 1

    excluded = []
    for ln in sorted(WORDING):
        r = dict(idx[ln])
        r["除外理由"] = "現行ソース比較で挙がった表示文言の指摘"
        r["除外根拠"] = (f"確定根拠区分={CLASS} かつ 確定改修区分名={FIX} の{len(pool)}件から、"
                     "利用者に見える文字列そのものの相違を目視で選別")
        r["文言の食い違い"] = WORDING[ln]
        r["drift行番号"] = ln
        excluded.append(r)

    fields = list(rows[0].keys()) + ["除外理由", "除外根拠", "文言の食い違い", "drift行番号"]
    with (BASE / "drift_findings_excluded_wording_legacy.tsv").open("w", encoding="utf-8",
                                                                    newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=fields, delimiter="\t", lineterminator="\n",
                           extrasaction="ignore")
        w.writeheader()
        for r in excluded:
            w.writerow({k: (v.replace("\t", " ").replace("\n", " ") if isinstance(v, str) else v)
                        for k, v in r.items()})

    kept = [ln for ln in pool if ln not in WORDING]
    lines = [
        "# 現行ソース比較 × 表示文言の指摘 除外",
        "",
        "期待挙動の裏付けが Excel正本ではなく旧実装 pf-eccube3 にしかない指摘",
        f"（`確定根拠区分={CLASS}`）のうち、利用者に見える文字列そのものの相違を除外した。",
        "Excel設計書との比較で挙がった指摘（`SPEC_BACKED`）は根拠区分の時点で対象外。",
        "",
        "| | 件数 | codex工数 |",
        "|---|---:|---:|",
        f"| 現行ソース比較 × 改修区分「{FIX}」 | {len(pool)} | {hours([idx[l] for l in pool]):.2f}人日 |",
        f"| **うち表示文言 → 除外** | **{len(excluded)}** | **{hours(excluded):.2f}人日** |",
        f"| 文言ではないので残す | {len(kept)} | {hours([idx[l] for l in kept]):.2f}人日 |",
        "",
        f"除外リスト: `drift_findings_excluded_wording_legacy.tsv`（{len(excluded)}件）",
        "",
        "## 除外した指摘",
        "",
        "| drift行 | 機能No | 機能名 | 優先度 | 工数 | 文言の食い違い |",
        "|---:|---|---|---|---:|---|",
    ]
    for r in excluded:
        lines.append(f"| {r['drift行番号']} | {r['機能No']} | {r['機能名']} | {r['優先度']} | "
                     f"{r['codex工数']} | {r['文言の食い違い']} |")

    lines += [
        "", "## 同じ母集合で残したもの", "",
        "文言ではなく、スピナー・CSS・DOM id・JS挙動・エディタ種別・初期値・"
        "表示条件などの指摘。",
        "",
        "| drift行 | 機能No | 内容 |", "|---:|---|---|",
    ]
    for ln in kept:
        lines.append(f"| {ln} | {idx[ln]['機能No']} | "
                     f"{idx[ln]['設計期待値'].replace(chr(10), ' ')[:70]} |")
    lines.append("")
    (BASE / "WORDING_LEGACY_EXCLUSION.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(f"母集合={len(pool)} 除外={len(excluded)} 残す={len(kept)} "
          f"除外工数={hours(excluded):.2f}人日")
    return 0


if __name__ == "__main__":
    sys.exit(main())
