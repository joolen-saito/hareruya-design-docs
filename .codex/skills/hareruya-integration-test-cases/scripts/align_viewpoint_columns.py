#!/usr/bin/env python3
"""Align I/FID and テスト観点 columns in integration test TSV to テスト観点.md."""
from __future__ import annotations

import re
import sys
from pathlib import Path

# (test_id_suffix, 関連ID, 観点) — 観点は .cursor/docs/テスト観点.md の「観点」列と一致
MAPPING: dict[str, tuple[str, str]] = {
    "001": ("IT-44", "表示制御"),
    "002": ("IT-04", "ログイン状態判定"),
    "003": ("IT-18", "ディープリンク・前提欠如"),
    "004": ("IT-04", "ログイン状態判定"),
    "005": ("IT-01", "入力値の受け渡し"),
    "006": ("IT-06", "INSERT結果"),
    "007": ("IT-04", "セッション維持"),
    "008": ("IT-17", "タイムアウト時挙動"),
    "009": ("IT-10", "ステータス変更"),
    "010": ("IT-32", "アイドル時間"),
    "011": ("IT-32", "アイドル時間"),
    "012": ("IT-41", "バリデーションエラー"),
    "013": ("IT-16", "エラーメッセージ"),
    "014": ("IT-16", "エラーメッセージ"),
    "015": ("IT-16", "エラーメッセージ"),
    "016": ("IT-06", "INSERT結果"),
    "017": ("IT-45", "SELECT結果"),
    "018": ("IT-20", "CSRF"),
    "019": ("IT-20", "パラメータ・コード値"),
    "020": ("IT-10", "実行可能条件"),
    "021": ("IT-16", "エラーメッセージ"),
    "022": ("IT-12", "正常応答"),
    "023": ("IT-12", "正常応答"),
    "024": ("IT-31", "必須/任意"),
    "025": ("IT-31", "必須/任意"),
    "026": ("IT-31", "必須/任意"),
    "027": ("IT-20", "Cookie属性"),
    "028": ("IT-20", "Cookie属性"),
    "029": ("IT-20", "パラメータ・コード値"),
    "030": ("IT-20", "XSS"),
    "031": ("IT-41", "max/max+1"),
    "032": ("IT-41", "max/max+1"),
    "033": ("IT-41", "許可文字/禁止文字"),
    "034": ("IT-03", "ブラウザバック"),
    "035": ("IT-03", "リロード耐性"),
    "036": ("IT-11", "同一要求再送"),
    "037": ("IT-36", "重要操作"),
    "038": ("IT-16", "予期せぬ障害"),
    "039": ("IT-16", "一部成功時処理"),
    "040": ("IT-16", "予期せぬ障害"),
    "041": ("IT-44", "主要ブラウザ対応"),
    "042": ("IT-44", "JS/CSS"),
    "043": ("IT-44", "ステータス"),
    "044": ("IT-20", "Cookie属性"),
    "045": ("IT-18", "ディープリンク・前提欠如"),
    "046": ("IT-05", "スコープ・改ざん防止"),
    "047": ("IT-13", "HTTP異常"),
    "048": ("IT-33", "許可IP外拒否"),
    "049": ("IT-39", "環境依存値"),
    "050": ("IT-41", "長・パターン・入口一貫"),
    "051": ("IT-02", "コード・日付・数値"),
    "052": ("IT-01", "入力値の受け渡し"),
    "053": ("IT-03", "前後画面連携"),
    "054": ("IT-41", "max/max+1"),
    "055": ("IT-41", "max/max+1"),
    "056": ("IT-44", "制御"),
    "057": ("IT-44", "表示制御"),
    "058": ("IT-45", "型・桁・サニタイズ"),
    "059": ("IT-20", "Cookie属性"),
    "060": ("IT-36", "重要操作"),
    "061": ("IT-12", "接続"),
}

OVERVIEW = """## 関連ID対応概要

`.cursor/docs/テスト観点.md` の **関連ID** と **観点** に合わせる。TSV の **I/FID** 列＝関連ID、**テスト観点** 列＝テスト観点.md の観点（同一関連IDで複数観点がある場合は当該ケースの主観点を記載）。

| 関連ID | 本機能での主な確認範囲 |
|--------|------------------------|
| IT-01 | ログインフォームの入力値受け渡し |
| IT-02 | 認証結果・試行制限などの画面表示反映 |
| IT-03 | 画面遷移、バック、リロード、値引き継ぎ |
| IT-04 | ログイン状態判定、セッション維持 |
| IT-05 | セッション固定・改ざん防止 |
| IT-06 | ログイン履歴の登録 |
| IT-07 | 最終ログイン日時の更新（006 等で併せ確認） |
| IT-10 | 認証状態の遷移、前提不足時の拒否 |
| IT-11 | ログイン送信の冪等性 |
| IT-12 | Redis 試行制限・外部連携 |
| IT-13 | Redis 障害時の HTTP 異常応答 |
| IT-16 | 認証・システムエラー、秘匿、再実行 |
| IT-17 | セッション失効・タイムアウト |
| IT-18 | 直リンク・未認証時の制御 |
| IT-20 | CSRF、XSS、Cookie、パラメータ改ざん |
| IT-31 | 二段階認証 |
| IT-32 | 自動ログアウト（アイドル） |
| IT-33 | IP 制限 |
| IT-36 | 監査ログ・秘匿 |
| IT-39 | メンテナンス等の環境依存 |
| IT-41 | 入力境界・パスワード強度 |
| IT-44 | ブラウザ・HTTP・UI 表示 |
| IT-45 | DB 参照・永続化の店舗文脈 |
"""

ROW_RE = re.compile(
    r"^((?:[^\t]+\t)?IT-ADMIN-LOGIN-(\d{3}))\t[^\t]+\t[^\t]+\t"
)


def patch_file(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    # overview
    text = re.sub(
        r"## (?:I/FID対応概要|関連ID対応概要)\n\n.*?(?=\n## テストケースTSV)",
        OVERVIEW + "\n",
        text,
        count=1,
        flags=re.DOTALL,
    )
    lines = text.splitlines(keepends=True)
    out: list[str] = []
    for line in lines:
        m = ROW_RE.match(line)
        if m:
            suffix = m.group(2)
            if suffix not in MAPPING:
                raise KeyError(f"no mapping for IT-ADMIN-LOGIN-{suffix}")
            rel_id, viewpoint = MAPPING[suffix]
            rest = line[m.end() :]
            line = f"{m.group(1)}\t{rel_id}\t{viewpoint}\t{rest}"
        out.append(line)
    path.write_text("".join(out), encoding="utf-8")


if __name__ == "__main__":
    target = (
        Path(sys.argv[1])
        if len(sys.argv) > 1
        else Path(__file__).resolve().parents[3]
        / "design/integration_test/m01-01_admin_login_login_it_cases.md"
    )
    patch_file(target)
    print(f"patched {target}")
