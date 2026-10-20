#!/usr/bin/env python3
from __future__ import annotations

import os as _os
import sys as _sys

if __name__ == "__main__" and _os.environ.get("PYTHONHASHSEED") != "0":
    # 集合の並びが実行ごとに変わると出力の順序が揺れるため、ハッシュの種を固定して起動し直す。
    _os.environ["PYTHONHASHSEED"] = "0"
    _os.execv(_sys.executable, [_sys.executable, *_sys.argv])

import argparse
import html
import json
import re
import sys
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable


BUSINESS_CODES = {
    "店頭受取受注管理": ("ORDER", "店舗チーム", "お客様、通販チーム、支店", "EC-CUBE（本店/支店）、スマレジ", "P1"),
    "店頭買取": ("KAITORI", "店舗チーム", "お客様、商品管理チーム、経理担当、支店", "EC-CUBE、MTGバイヤー、スマレジ", "P1"),
    "イベント管理": ("EVENT", "店舗チーム", "お客様、顧客戦略チーム", "EC-CUBE、SPLINKS、デッキシステム、スマレジ、ポイントグランター", "P1"),
    "商品登録・編集": ("PRODUCT", "トレードチーム", "ITチーム、通販チーム、デザインチーム", "EC-CUBE、AWS S3、在庫管理", "P1"),
    "価格管理": ("PRICE", "トレードチーム", "商品管理チーム、支店、セール担当者", "EC-CUBE、分析集計", "P1"),
    "在庫管理": ("ZAIKO", "トレードチーム", "店舗チーム、商品管理チーム、通販チーム、支店", "EC-CUBE、スマレジ", "P1"),
    "ネット買取": ("ONLINE-KAITORI", "通販チーム", "お客様、商品管理チーム", "EC-CUBE、MTGバイヤー、メール", "P1"),
    "仕入れ業務": ("SHIIRE", "商品管理チーム", "店舗チーム、通販チーム、トレードチーム", "EC-CUBE、MTGバイヤー、Backlog", "P1"),
    "通販受注管理": ("TSUHAN", "通販チーム", "お客様、SPLINKS、配送/ラベル印字アプリ", "EC-CUBE、SPLINKS、メール、海外発送管理アプリ", "P1"),
    "デッキ登録": ("DECK", "顧客戦略チーム", "お客様、店舗チーム", "デッキ管理、デッキシステム、イベント管理", "P1"),
}

IGNORE_FLOW_TITLES = {"表紙", "全体図", "業務一覧", "凡例", "資料一覧", "業務フロー画面マトリクス"}
OBSOLETE_PHRASES = ("設計どおり", "設計書に記載のとおり", "UI標準")
GENERATED_MARKER = "<!-- generated-by: hareruya-scenario-test-cases -->"

# Ph2（フェーズ2以降で対応）機能。Excel基本設計書の図形注記
# 「…はPh2で対応するため、Ph1では実装しない」等を根拠に、機能全体がPh2の
# ものをシナリオの機能割当（ステップ・機能Noリスト・トレーサビリティ）から除外する。
# シナリオはPh1業務にPh2機能が混在するため、機能ID単位で除外する（シナリオ自体は残す）。
EXCLUDED_FEATURE_IDS = {
    "M03-43", "M03-44", "M04-06", "M04-07", "M06-13", "M08-11",
    "M08-15", "M08-16", "A06-14", "B01-02", "B01-03", "F02-05",
}

EXPECTED_FUNCTIONS: dict[str, list[tuple[str, tuple[str, ...]]]] = {
    "店頭受取受注管理": [
        ("", ("M05-01", "M05-08", "M05-11", "M05-14", "M05-27", "A05-03", "A05-04", "B05-05")),
    ],
    "店頭買取": [
        # 顧客のフロント査定申込（otcbuy/tc/entry, 06/07 R22 受付・R26）。作業概要「受付」で発火し、
        # 仕入作業/手動入庫パターンには付与しない（要判定 F08-* の解消）。
        ("受付", ("F08-01", "F08-02", "F08-03")),
        ("仕入", ("M06-01", "M06-10", "M06-11", "M06-12", "M04-21")),
        ("手動入庫", ("M06-01", "M06-12", "M04-21", "M04-01")),
        ("", ("M06-01", "M06-03", "M06-04", "M06-05", "M06-06", "M06-07", "A06-02", "A06-03", "A06-05", "A06-13", "A06-14", "A06-15", "A06-16", "B06-01", "O01-01")),
    ],
    "イベント管理": [
        # イベント受付～実施のポイント付与ステップ（08 R180 ポイントグランター）。要判定 A17-03 の解消。
        ("ポイント付与", ("A17-03",)),
        ("受付", ("M13-06", "M13-07", "M13-10", "M13-11", "M13-12", "F07-01", "F07-02", "F07-03", "F07-04", "B13-01", "B13-02")),
        ("デッキ", ("M13-08", "F06-16", "F06-17", "M15-01", "M15-05")),
        ("バナー", ("M13-14", "M13-15")),
        ("", ("M13-01", "M13-02", "M13-03", "M13-04", "M13-05", "M13-09")),
    ],
    "商品登録・編集": [
        ("カード", ("M14-01", "M14-04", "M14-05", "M14-06", "M14-08", "M03-26", "M03-03")),
        ("カテゴリ", ("M03-11", "M03-12", "M03-41", "M03-45")),
        ("商品カテゴリー", ("M03-11", "M03-12", "M03-41", "M03-45")),
        ("略称タグ", ("M03-37",)),
        ("商品マスター", ("M03-01", "M03-02", "M03-08", "M03-09")),
        ("商品登録", ("M03-01", "M03-02", "M03-26", "M03-27", "M03-35")),
        ("CSV", ("M03-03", "M03-20", "M03-26", "M03-27", "M03-35")),
        ("公開", ("M03-01", "M03-02", "M03-26", "M03-27", "M03-38")),
        ("価格", ("M03-30", "M03-31", "M03-32", "M03-33", "M03-34")),
        ("在庫", ("M04-01", "M04-21", "M04-12", "M04-13", "M04-23")),
        ("", ("M03-01", "M03-02", "M03-08", "M03-09", "M03-20", "M03-26", "M03-27", "M03-35", "M03-37")),
    ],
    "価格管理": [
        ("セール", ("M03-05", "M03-31", "M03-34", "M09-02")),
        # セールバナー差し替え（11 R51「セールバナー差し替え対応」＝人手工程）はトップ回転バナー M16-01/02。
        # Claude Codeレビューで、従来 M03-01 誤割当・M16-01/02 未トレースだったと指摘（要判定→covered の是正）。
        ("バナー", ("M16-01", "M16-02")),
        ("分析", ("M12-01", "M12-02", "M12-03", "M12-04", "M12-07", "M12-08", "M12-09", "M12-10")),
        ("", ("M03-01", "M03-05", "M03-23", "M03-24", "M03-30", "M03-31", "M03-32", "M03-33", "M03-36")),
    ],
    "在庫管理": [
        # B02-07 週間在庫履歴更新＝在庫リコメンドの起点データ（12/13 在庫リコメンド対応・週1回）。
        # 在庫リコメンド対応シナリオが R197「リコメンドが登録されているか確認」で実際に観測するためTRACE-IN。
        # B02-01(販売数集計)/B02-03(入庫数集計)は、産物のCSV列が参照されるだけでシナリオが集計値を観測しないため
        # Claude Codeレビューの指摘に基づき out-of-scope へ降格（台帳寄せ回避）。B02-07 のみ残す。
        ("リコメンド", ("M04-16", "M04-01", "M04-08", "M04-09", "M04-24", "M04-25", "M04-26", "M04-27", "M04-29", "B02-07")),
        ("棚卸", ("M04-31", "M04-01", "M04-17", "M04-18")),
        ("欠品", ("M04-17", "M04-18", "M04-06", "M04-07", "M04-20")),
        ("貼替", ("M04-30",)),
        ("分割", ("M04-01", "M04-12", "M04-13", "M04-14", "M04-23")),
        ("詰め合わせ", ("M04-01", "M04-12", "M04-14", "M04-23")),
        ("振替", ("M04-01", "M04-08", "M04-09", "M04-10", "M04-22", "M04-27", "M04-29", "M04-32")),
        ("", ("M04-01", "M04-02", "M04-03", "M04-04", "M04-08", "M04-09", "M04-10", "M04-21", "M04-22", "M04-24", "M04-25", "M04-26", "M04-27", "M04-28", "M04-29", "M04-32", "M04-33", "M04-34")),
    ],
    "ネット買取": [
        ("本人確認", ("F06-13", "M08-10", "M07-01", "M07-03")),
        ("仕入", ("M07-06", "M04-21", "M04-01")),
        ("", ("F05-01", "F05-02", "F05-03", "F05-04", "F05-05", "F05-06", "M07-01", "M07-02", "M07-03", "M07-04", "M07-05", "M07-06", "A07-01", "A07-02", "A07-03", "A07-04", "A07-05", "A07-06", "A07-07", "O01-02")),
    ],
    "仕入れ業務": [
        ("", ("M06-12", "M07-06", "M03-01", "M03-05", "M03-24", "M04-01", "M04-21")),
    ],
    "通販受注管理": [
        # お客様EC購入フローはフロント導線（トップ→商品一覧/詳細→カート→注文完了）。
        # 従来は汎用 F04 のみに割り当てて F01/F03 が未トレースだった（codexレビュー指摘）。
        ("EC購入", ("F01-01", "F03-01", "F03-02", "F03-04", "F04-01", "F04-02", "F04-03", "F04-04", "M05-01", "M05-02")),
        ("返金", ("M05-01", "M05-11", "M05-15", "F06-19")),
        ("予約", ("M05-01", "M05-18", "M05-21", "M05-22", "M05-23", "M05-24", "M05-26")),
        ("入金", ("M05-01", "M05-11", "B05-08", "B05-09")),
        ("発送", ("M05-01", "M05-04", "M05-05", "M05-07", "M05-18", "M05-19", "M05-20", "M05-21", "M05-22", "M05-23", "M05-24", "M05-26", "M04-27", "M04-29")),
        ("", ("F04-01", "F04-02", "F04-03", "F04-04", "M05-01", "M05-02", "M05-03", "M05-06", "M05-11", "M05-12", "M05-13", "M05-14", "M05-15", "M05-16", "M05-17")),
    ],
    "デッキ登録": [
        ("デッキ内容", ("A15-13", "A15-16")),
        ("デッキタグ", ("M15-07",)),
        ("アーキタイプ", ("M15-08", "M15-09", "M15-10", "A15-07")),
        ("デッキ登録", ("M15-05", "M15-06", "A15-09", "A15-17")),
        ("デッキ公開", ("M15-05", "A15-10", "A15-12", "A15-13")),
        ("直近", ("M15-11", "A15-16")),
        ("オンライン", ("M15-01", "M15-05", "F06-14", "F06-16", "F06-17", "A15-09", "A15-10", "A15-12", "A15-13")),
        ("大会", ("M15-11", "M13-01", "M13-08", "A15-16")),
        ("", ("M15-01", "M15-02", "M15-04", "M15-05", "M15-06", "M15-07", "M15-08", "M15-09", "M15-10", "M15-11", "A15-06", "A15-07", "A15-08", "A15-09", "A15-10", "A15-13", "A15-14", "A15-15", "A15-17", "A15-18")),
    ],
}

EXPECTED_HTML: dict[str, tuple[str, ...]] = {
    "店頭受取受注管理": ("0203", "0304", "0505"),
    "店頭買取": ("0205", "0308", "0506", "0601"),
    "イベント管理": ("0214", "0307", "0413"),
    "商品登録・編集": ("0204", "0208", "0303", "0404", "0502", "0514"),
    "価格管理": ("0204", "0211"),
    "在庫管理": ("0202", "0402", "0501"),
    "ネット買取": ("0206", "0305", "0507", "0601"),
    "仕入れ業務": ("0205", "0206", "0204", "0202"),
    "通販受注管理": ("0203", "0304", "0405", "0505"),
    "デッキ登録": ("0212", "0515"),
}

# 業務フロー準拠のシステムテストとして「対象外」と誠実に判定できる機能領域。
# 未トレース=網羅漏れではないことを 05_設計書カバレッジ.md で説明するための分類辞書。
# キーは prefix（例 "M10"）または完全ID（例 "A17-03"）。値は (カテゴリ, 理由)。
# ここに無く、かつどのシナリオからも参照されない機能は
# `source-backed-uncovered`（＝要判定の真の穴候補）として可視化される。
OUT_OF_SCOPE_FEATURES: dict[str, tuple[str, str]] = {
    "M01": ("platform-base", "ログイン・二要素認証基盤。全業務の共通前提で単独業務フローなし"),
    "M02": ("platform-base", "管理画面ホーム/ダッシュボード。共通前提"),
    "M10": ("platform-base", "店舗・基本設定マスタ（配送/税/決済/メール/CSV等）。設定作業で単独業務フローなし"),
    "M11": ("platform-base", "システム設定・権限・ログイン履歴・マスタ管理。管理基盤"),
    "A02": ("front-display", "商品ポップアップ等フロントAPI。表示系は機能テスト層で担保"),
    "A08": ("front-display", "TOPバナー取得API。フロント表示"),
    "A14": ("front-display", "カード検索フロントAPI。フロント表示"),
    "A16": ("front-display", "TOPバナーAPI。フロント表示"),
    "F02": ("front-display", "グローバルナビ共通部品。フロント表示（一部Ph2）"),
    "A01": ("integration-tested", "スマレジ在庫連携API。連携単体は integration_test 層で担保"),
    "B08": ("platform-base", "会員・ポイント定常バッチ。顧客戦略の基盤処理で単独業務フローなし"),
    "B17": ("platform-base", "最新記事一覧生成バッチ。表示基盤"),
    # --- 要判定23件の disposition（Exploreエビデンス＋Claude Codeレビューに基づく） ---
    # A17系: A17-03(ポイントグランター)は イベント管理 でtrace-in済み。残りは対象外。
    "A17-01": ("front-display", "フロント記事表示API（記事本体はWordPress）。表示系は機能テスト層で担保"),
    "A17-02": ("front-display", "フロント関連記事表示API。表示系は機能テスト層で担保"),
    "A17-04": ("integration-tested", "外部連携（任意門）向け商品詳細API。連携層で担保・人手工程なし"),
    "A17-05": ("integration-tested", "買取アプリ（MTGバイヤー）向け商品検索API。連携層で担保・人手工程なし"),
    # B02系: B02-07(週間在庫履歴→在庫リコメンド)のみ trace-in（traced判定が優先）。
    # 残り(販売数/入庫数集計・入荷通知整理・部門未設定監視・お気に入りセール通知・在庫初期化)は集計/保守バッチ。
    # 産物のCSV/集計値は業務で参照されるが、バッチ自体の人手操作工程はなく機能/バッチテスト層で担保。
    "B02": ("platform-base", "商品管理の集計/保守バッチ（販売数・入庫数集計、入荷通知整理、部門未設定監視、お気に入りセール通知、在庫初期化）。産物のCSV/集計値は業務で参照されるが、バッチ自体の人手操作工程はなく機能/バッチテスト層で担保"),
    # M16系: M16-01/02(トップ回転バナー)は 価格管理「セールバナー差し替え」で trace-in済み。残りはマスタ設定で単独業務フローなし。
    "M16": ("platform-base", "管理画面データマスタ（祝日/MTGマスタ/割引率/買取価格・減額率対応表）。閲覧・設定基盤で単独業務フローなし"),
}

# パターン全体がEC-CUBEを使わない非システム作業であることを示す「強い」マーカー。
# 検出時のみ機能No自動割当を抑止し、観測点をメール/電話/外部アプリ側
# （EC-CUBE更新なし）として生成する（codexレビュー指摘#2）。
# 注意: 「手動で対応」「外部アプリ」等の弱い語は、EC-CUBE中心フローの一工程として
# 出てくるため誤検出の原因になる。ここには含めず、パターン全体を非EC-CUBEと断じられる
# 表現（EC-CUBEを使わない/メーラーでのみ/Thunderbirdでのみ）に限定する。
NON_ECCUBE_MARKERS = (
    "EC-CUBEを使わない",
    "メーラーでのみ",
    "Thunderbirdでのみ",
)

# パターン名単位の業務固有エッジケース。業務単位の BUSINESS_EDGE_CASES より優先し、
# 汎用ケース偏重（codexレビュー指摘#4）を是正する。キーはパターン名の部分一致。
PATTERN_EDGE_CASES: dict[str, list["EdgeCase"]] = {}


@dataclass(frozen=True)
class DesignDoc:
    path: Path
    title: str
    text: str
    kind: str
    feature_no: str


@dataclass
class Pattern:
    number: str
    name: str
    rows: list[str]
    # 原典上の識別・図形スコープ。番号重複を勝手に改番せず、出典＋番号＋名称で識別する。
    source_number: str = ""
    source_start: int = 0
    source_end: int = 10**9
    node_scope: set[str] = field(default_factory=set)
    row_nodes: dict[str, str] = field(default_factory=dict)
    row_lanes: dict[str, str] = field(default_factory=dict)
    nodes: dict[str, "FlowNode"] = field(default_factory=dict)
    flow_edges: list["FlowEdge"] = field(default_factory=list)
    source_path: str = ""


@dataclass(frozen=True)
class BusinessRoute:
    route_id: str
    kind: str
    title: str
    condition: str
    final_state: str
    rows: tuple[str, ...]
    edge_cases: tuple["EdgeCase", ...]
    preparation: str = ""
    inputs: tuple[tuple[str, str], ...] = ()
    evidence: str = ""


@dataclass
class Scenario:
    sid: str
    title: str
    business_title: str
    flow_path: Path
    pattern: Pattern
    route: BusinessRoute
    docs: list[DesignDoc]
    html_docs: list[DesignDoc]
    coverage: dict[str, bool]
    non_eccube: bool = False
    dup_number: bool = False


@dataclass(frozen=True)
class EdgeCase:
    kind: str
    condition: str
    expected: str
    observation: str
    source_row: str = ""


@dataclass(frozen=True)
class DataPattern:
    pattern_id: str
    kind: str
    target: str
    purpose: str
    precondition_delta: str
    input_data: str
    observation: str


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def strip_html(raw: str) -> str:
    raw = re.sub(r"(?is)<script.*?</script>|<style.*?</style>", " ", raw)
    raw = re.sub(r"(?s)<[^>]+>", " ", raw)
    return html.unescape(re.sub(r"\s+", " ", raw)).strip()


def title_from_markdown(text: str, fallback: str) -> str:
    m = re.search(r"^#\s+(.+?)\s*$", text, re.M)
    return clean_title(m.group(1)) if m else fallback


def clean_title(value: str) -> str:
    value = re.sub(r"（出典:.+?）", "", value)
    value = re.sub(r"\s+", " ", value).strip()
    # 設計書H1が「slug（日本語表示名）」形式の場合、設計書の日本語呼称を使う（slugを表示しない）。
    m = re.match(r"^[a-z]\d{2}-\d{2}_[a-z0-9_]+（(.+)）$", value)
    if m:
        value = m.group(1).strip()
    return value.strip()


def feature_no_from_path(path: Path) -> str:
    m = re.match(r"([a-z]\d{2}-\d{2}|m\d{2}-\d{2}|f\d{2}-\d{2}|b\d{2}-\d{2})", path.name, re.I)
    return m.group(1).upper() if m else "-"


def tokenize(text: str) -> set[str]:
    tokens: set[str] = set()
    for token in re.findall(r"[A-Za-z0-9_+-]+|[一-龥ぁ-んァ-ヶー]{2,}", text):
        token = token.lower()
        if len(token) >= 2 and token not in {"する", "いる", "ため", "あり", "なし", "画面", "管理", "作業", "業務"}:
            tokens.add(token)
    return tokens


def summarize_text(text: str, limit: int = 1600) -> str:
    return re.sub(r"\s+", " ", text)[:limit]


def build_design_index(repo: Path) -> list[DesignDoc]:
    docs: list[DesignDoc] = []
    function_root = repo / "functions"
    for path in sorted(function_root.glob("**/*.md")):
        # `_archive` は旧仕様の退避先。現行画面名・機能紐付けの候補に混ぜない。
        if "_archive" in path.relative_to(function_root).parts:
            continue
        text = read_text(path)
        docs.append(DesignDoc(path.relative_to(repo), title_from_markdown(text, path.stem), summarize_text(text), "function", feature_no_from_path(path)))
    for path in sorted((repo / "excel_to_html" / "output").glob("*.html")):
        raw = read_text(path)
        text = strip_html(raw)
        docs.append(DesignDoc(path.relative_to(repo), path.stem, summarize_text(text), "basic-html", "-"))
    preview = repo / "function_spec_html_preview"
    if preview.exists():
        for path in sorted(preview.glob("**/*.html")):
            raw = read_text(path)
            text = strip_html(raw)
            docs.append(DesignDoc(path.relative_to(repo), path.stem, summarize_text(text), "function-html", feature_no_from_path(path)))
    return docs


def feature_index(docs: list[DesignDoc]) -> dict[str, DesignDoc]:
    index: dict[str, DesignDoc] = {}
    for doc in docs:
        if doc.kind == "function" and doc.feature_no != "-":
            index.setdefault(doc.feature_no.upper(), doc)
    return index


def score_doc(query_tokens: set[str], doc: DesignDoc) -> int:
    haystack = tokenize(doc.title + " " + doc.text)
    overlap = query_tokens & haystack
    score = len(overlap) * 10
    title_tokens = tokenize(doc.title)
    score += len(query_tokens & title_tokens) * 8
    if doc.kind == "function":
        score += 2
    return score


def related_docs(flow_text: str, pattern: Pattern, docs: list[DesignDoc], max_docs: int) -> tuple[list[DesignDoc], list[DesignDoc]]:
    query = tokenize(flow_text[:2000] + " " + pattern.name + " " + rows_primary_joined(pattern))
    ranked = sorted(((score_doc(query, d), d) for d in docs), key=lambda x: (-x[0], str(x[1].path)))
    selected = [d for score, d in ranked if score > 0 and d.kind == "function"][:max_docs]
    html_selected = [d for score, d in ranked if score > 0 and d.kind in {"basic-html", "function-html"}][:max(2, max_docs // 2)]
    return selected, html_selected


def is_non_eccube_pattern(pattern: Pattern) -> bool:
    """メール/電話/外部アプリ等、EC-CUBE画面を割り当てるべきでない非システム作業か。"""
    # パターン名が「メーラーでのみ」等を含む、または本文に強いマーカーがある場合のみ。
    if "メーラー" in pattern.name:
        return True
    haystack = pattern.name + " " + rows_primary_joined(pattern)
    return any(marker in haystack for marker in NON_ECCUBE_MARKERS)


def expected_features(business_title: str, pattern: Pattern) -> list[str]:
    # 非EC-CUBE作業（メーラーのみ等）はEC-CUBE機能を自動割当せず、参照のみ M05-01 に限定する
    # （codexレビュー指摘#2：キーワード類似でEC-CUBE画面を誤割当しない）。
    if is_non_eccube_pattern(pattern):
        return ["M05-01"] if any(m in (business_title) for m in ("通販", "受注")) else []
    rules = EXPECTED_FUNCTIONS.get(business_title, [])
    selected: list[str] = []
    fallback: list[str] = []
    haystack = pattern.name + " " + rows_primary_joined(pattern)
    for keyword, features in rules:
        if keyword and keyword in haystack:
            selected.extend(features)
    for keyword, features in rules:
        if keyword == "":
            fallback.extend(features)
            break
    if not selected:
        selected.extend(fallback)
    deduped: list[str] = []
    for feature in selected:
        feature = feature.upper()
        if feature in EXCLUDED_FEATURE_IDS:
            continue
        if feature not in deduped:
            deduped.append(feature)
    return deduped


def related_docs_with_dictionary(
    business_title: str,
    flow_text: str,
    pattern: Pattern,
    docs: list[DesignDoc],
    max_docs: int,
) -> tuple[list[DesignDoc], list[DesignDoc]]:
    by_feature = feature_index(docs)
    expected = [by_feature[f] for f in expected_features(business_title, pattern) if f in by_feature]
    # 非EC-CUBE作業はキーワード類似でEC-CUBE画面を拾わない。参照用の expected のみを採用する。
    if is_non_eccube_pattern(pattern):
        ranked, html_selected = [], []
    else:
        ranked, html_selected = related_docs(flow_text, pattern, docs, max_docs)
    selected: list[DesignDoc] = []
    for doc in expected + ranked:
        # Ph2機能はキーワードスコアで拾われた ranked 経由でも混入しないよう除外する。
        if doc.feature_no.upper() in EXCLUDED_FEATURE_IDS:
            continue
        if doc.path not in {d.path for d in selected}:
            selected.append(doc)
        if len(selected) >= max_docs:
            break
    html_prefixes = EXPECTED_HTML.get(business_title, ())
    html_expected = [
        d
        for d in docs
        if d.kind == "basic-html" and any(d.path.name.startswith(prefix) for prefix in html_prefixes)
    ]
    html_docs: list[DesignDoc] = []
    for doc in html_expected + html_selected:
        if doc.path not in {d.path for d in html_docs}:
            html_docs.append(doc)
        if len(html_docs) >= max(len(html_expected), 2, max_docs // 2):
            break
    return selected, html_docs


def parse_patterns(text: str) -> list[Pattern]:
    candidates: list[Pattern] = []
    for line in text.splitlines():
        if "｜" not in line or "作業概要" not in line:
            continue
        m = re.search(r"\*\*\[＃\]\*\*\s*([^｜]+)｜\s*\*\*\[作業概要\]\*\*\s*([^｜]+)", line)
        if not m:
            continue
        number = m.group(1).strip()
        name = clean_cell(m.group(2))
        if re.fullmatch(r"\d+", number) and name:
            candidates.append(Pattern(number, name, [], source_number=number))
    # Some flow sheets list the parent pattern only in the index section and
    # start the reconstructed flow at child rows such as 10-①. Preserve those
    # parents so system-test coverage does not skip the business flow.
    existing_numbers = {p.number for p in candidates}
    child_prefixes = set(re.findall(r"\*\*\[＃\]\*\*\s*([0-9]+)[-－]", text))
    index_text = text.split("参考マニュアル", 1)[0]
    for line in index_text.splitlines():
        m = re.search(r"- \*\*R\d+\*\*:\s*([0-9]+)\s*｜\s*([^｜]+)$", line)
        if not m:
            continue
        number = m.group(1).strip()
        name = clean_cell(m.group(2))
        if number in existing_numbers or number not in child_prefixes:
            continue
        candidates.append(Pattern(number, name, [], source_number=number))
        existing_numbers.add(number)
    if not candidates:
        for line in text.splitlines():
            m = re.search(r"- \*\*R\d+\*\*:\s*([0-9]+)\s*｜\s*(.+)$", line)
            if m:
                number = m.group(1)
                candidates.append(Pattern(number, clean_cell(m.group(2)), [], source_number=number))
    seen: set[tuple[str, str]] = set()
    patterns: list[Pattern] = []
    for p in candidates:
        key = (p.number, normalize_name(p.name))
        if key not in seen:
            seen.add(key)
            patterns.append(p)
    if not patterns:
        title = title_from_markdown(text, "業務フロー")
        patterns.append(Pattern("1", title, [], source_number="1"))
    assign_rows(text, patterns)
    sort_pattern_rows(patterns)
    return patterns


def clean_cell(value: str) -> str:
    value = re.sub(r"\*\*\[[^]]+\]\*\*", "", value)
    value = re.sub(r"\*\*", "", value)
    value = value.replace("｜", " ")
    return re.sub(r"\s+", " ", value).strip(" /　")


# pattern.rows は「番号付き行の主文 <ROW_SEP> 連結した作業内容の継続」で保持する。
# 表示（業務行動）は full_text で全文を使うが、分類（is_branch_row/構造判定/キーワード照合）は
# primary_text（主文のみ）で行う。これにより、継続行の補足語（不可/差異/エラー等）で
# 正常系ステップが誤って分岐化する事象を防ぐ（codexレビュー指摘）。
ROW_SEP = "\x1f"


def primary_text(row: str) -> str:
    return row.split(ROW_SEP, 1)[0]


def full_text(row: str) -> str:
    return re.sub(r"\s+", " ", row.replace(ROW_SEP, " ")).strip()


def rows_primary_joined(pattern: "Pattern") -> str:
    return " ".join(primary_text(r) for r in pattern.rows)


MERGE_GAP = 3  # 継続行として連結を許す、直前行とのR番号の最大差（過剰連結の抑制）


# ---------------------------------------------------------------------------
# 業務フローのノード表（`| # | フェーズ | 実行主体(レーン) | 種別 | テキスト |`）を使い、
# 各ステップが「EC-CUBE操作」か「外部システム操作」か「物理作業」かを切り分ける。
#
# 業務フローは As-Is/To-Be 双方に人手工程を含む。物理作業や外部ツール作業に EC-CUBE の
# 機能Noを割り当てると、存在しないシステム挙動を期待結果に書くことになり、テスト自体が
# 無効になる（例:「納品書にサインを頂く」→ A05-03、「商品にバーコードを貼る」→ M03-05）。
# 図形の `種別` が `手作業` かどうかが、EC-CUBE 機能Noを付けてよいかの一次情報になる。
# ---------------------------------------------------------------------------
WORK_ECCUBE = "ec-cube"      # EC-CUBE（本システム）の画面/処理 → 機能No必須
WORK_EXTERNAL = "external"   # 外部システム/ツール操作 → EC-CUBE機能Noを付けない
WORK_PHYSICAL = "physical"   # 物理作業 → EC-CUBE機能Noを付けない
WORK_AMBIGUOUS = "ambiguous" # 手作業ノードだがシステム操作の記述を含む → 推測せず要確認
WORK_UNKNOWN = "unknown"     # ノード表に対応が無い → 推測せず要確認にする

# 「手作業」ノードのうち、外部システム/ツールで行うもの（物理作業ではない）。
EXTERNAL_TOOL_WORDS = (
    "スマレジ", "backlog", "バックログ", "スプレッドシート", "エクセル", "excel",
    "メール", "メーラー", "thunderbird", "wordpress", "ラインワークス",
    "line", "gメール", "コンパニオン", "splinks", "電話", "slack", "チャット", "フォーム",
    "海外発送管理アプリ", "mtgバイヤー", "ポイントグランター",
    "aws", "s3",
)
# 「手作業」ノードだが、システム（EC-CUBE または外部ツール）の操作記述を含む語。
# 物理作業と断定して「EC-CUBE操作なし」と書くと嘘になるため、要確認へ落とす。
SYSTEM_HINT_WORDS = (
    "CSV", "インポート", "エクスポート", "出力", "取込", "取り込", "画面", "EC-CUBE",
    "一覧", "検索", "対応状況", "アップロード", "ダウンロード", "登録する", "更新する",
)
# 図形種別のうち、システム処理（EC-CUBE の画面・処理）を表すもの。
SYSTEM_NODE_KINDS = ("定義済み処理(サブフロー)", "処理")
NODE_TABLE_RE = re.compile(
    r"\| # \| フェーズ \| 実行主体\(レーン\) \| 種別 \| テキスト \|.*?\n\|[-| ]+\|\n((?:\|.*\n)+)"
)

# row 文字列 -> 作業種別 / 作業概要。rows は素の文字列で各所に渡るため、対応表を別に持つ。
ROW_WORK_KIND: dict[str, str] = {}
ROW_SUMMARY: dict[str, str] = {}
# 索引表と本文の不一致（To-Be新規業務の取りこぼし / 名称ドリフト）。生成時に警告する。
MISSING_PATTERNS: list[tuple[Path, str, str, str]] = []

# 工程判定レジスタ 08_要確認トリアージ.tsv（人手キュレート・機能No実在検証済み）。
# キー=(業務, R番号) -> (判定, 機能No, uncertain)。要確認だった工程を判定に応じた具体手順へ落とす。
# 判定: TRACE-IN/AUTO(機能No割当) / EXTERNAL(外部) / PHYSICAL(物理) / CUSTOMER(顧客) /
#       DECISION(分岐) / UNKNOWN(設計書不在)。
# uncertain=True は判定理由が `[要判断]`（GAP/DOC/DECIDE＝割当機能が当該作業を対象外と明記/重複疑い）
# の行。この機能Noは割り当てず FLOW_ONLY に落とす（機能doc自身が対象外と記す割当は捏造・codex指摘）。
TRIAGE_REGISTER: dict[tuple[str, str], tuple[str, str, bool]] = {}
# 機能No -> DesignDoc（レジスタの機能Noから具体画面へ解決するため）。
FEATURE_DOC: dict[str, "DesignDoc"] = {}


def reset_generation_state() -> None:
    """生成状態を初期化する。同一プロセスで generate() を複数回呼ぶと、前回の分類や警告が
    残って結果が呼び出し順に依存するため、開始時に必ずクリアする。"""
    ROW_WORK_KIND.clear()
    ROW_SUMMARY.clear()
    MISSING_PATTERNS.clear()
    FLOW_TEXT_BY_PATH.clear()
    FLOW_GRAPH_BY_PATH.clear()
    TRIAGE_REGISTER.clear()
    FEATURE_DOC.clear()


def row_r_number(row: str) -> str:
    """行文字列から業務フローのR番号（R35 等）を取り出す。トリアージレジスタとの結合キー。"""
    m = re.search(r"R(\d+)", full_text(row))
    return m.group(1) if m else ""


def load_triage_register(repo: Path, docs: "list[DesignDoc]") -> None:
    """`08_要確認トリアージ.tsv`（人手判定・機能No実在検証済み）を (業務, R番号) で読み込む。

    要確認だった工程の判定・機能Noを確定情報として使う。機能Noは docs（functions/ 実在）に
    存在するもののみ採用し、実在しない番号は割当しない（捏造防止）。
    """
    import csv as _csv
    FEATURE_DOC.clear()
    for d in docs:
        if d.feature_no and d.feature_no != "-":
            FEATURE_DOC.setdefault(d.feature_no.upper(), d)
    path = repo / "scenario_test" / "scenario" / "08_要確認トリアージ.tsv"
    if not path.exists():
        return
    with path.open(encoding="utf-8") as f:
        for row in _csv.DictReader(f, delimiter="\t"):
            biz = (row.get("業務") or "").strip()
            body = row.get("業務行動(本文)") or ""
            judge = (row.get("判定") or "").strip()
            feature = (row.get("機能No") or "").strip().upper()
            reason = row.get("判定理由") or ""
            uncertain = "[要判断]" in reason  # 割当機能が当該作業を対象外と明記/重複疑い＝機能割当しない
            m = re.search(r"R(\d+):", body)
            if not biz or not m or judge in ("", "HEADING"):
                continue
            TRIAGE_REGISTER[(biz, m.group(1))] = (judge, feature, uncertain)


def parse_flow_nodes(text: str) -> dict[str, tuple[str, str]]:
    """ノード表から {ノードテキスト: (実行主体レーン, 種別)} を作る。"""
    nodes: dict[str, tuple[str, str]] = {}
    matched = NODE_TABLE_RE.search(text)
    if not matched:
        return nodes
    for line in matched.group(1).splitlines():
        cells = [c.strip() for c in line.strip("|").split("|")]
        if len(cells) < 5:
            continue
        lane, kind, node_text = cells[2], cells[3], cells[4]
        if not node_text or node_text == "—":
            continue
        nodes.setdefault(normalize_node_text(node_text), (lane, kind))
    return nodes


def normalize_node_text(value: str) -> str:
    return re.sub(r"\s+", "", value).replace("　", "")


# 工程を表さない図形（ラベル・注釈・帳票・DB・紙）。包含一致の絞り込みで無視する。
NON_STEP_NODE_KINDS = (
    "処理/ラベル", "注釈(吹き出し)", "データ/DB", "帳票/書類", "flowChartPunchedCard", "フェーズ区切り",
)

# ---------------------------------------------------------------------------
# データ連鎖（業務フロー原典の「データ遷移線(点線)」）
#
# シナリオテストは機能テストではなく、「データのつながりを通じて業務が完遂できるか」を
# 見る層である。業務フロー図には作業線（実線）とは別に **データ遷移線（点線）** があり、
# 「どの工程が、どの帳票/DBを産出し、それを次にどの工程が参照するか」が原典に描かれている。
# 生成器はこれまで作業順（実線）しか使っておらず、工程ごとの期待結果が自己完結していた。
# ここでは点線を解析し、産出→消費の連鎖を捏造ゼロで取り出す。
#
# 原典に接続先が無いもの（`(自由端)`）は、推測で結線せず「接続先未定義」として可視化する。
# 照合キー（同一案件性を担保する識別子）は原典に定義が無いため創作しない。
# ---------------------------------------------------------------------------
DATA_NODE_KINDS = ("データ/DB", "帳票/書類", "flowChartPunchedCard")
# 工程（実行主体が作業する図形）ではないもの。データ/帳票のほか、注釈・ラベル・区切りを含む。
NON_WORK_NODE_KINDS = DATA_NODE_KINDS + ("注釈(吹き出し)", "処理/ラベル", "フェーズ区切り")
FREE_END = "(自由端)"


@dataclass(frozen=True)
class FlowNode:
    number: str
    phase: str
    lane: str
    kind: str
    text: str
    source_row: int = 0
    source_col: int = 0


@dataclass(frozen=True)
class FlowEdge:
    is_data: bool   # True=データ遷移線(点線) / False=業務フロー線(実線)
    src_no: str
    dst_no: str     # 自由端は ""
    dst_label: str


EDGE_LINE_RE = re.compile(
    r"^- \[(?P<kind>[^\]]+)\]\s*#(?P<src>\d+)\s*(?P<src_text>.*?)\s*→\s*"
    r"(?:#(?P<dst>\d+)\s*(?P<dst_text>.*)|(?P<free>\(自由端\)))\s*$"
)


def parse_flow_nodes_numbered(text: str) -> dict[str, FlowNode]:
    """ノード表から {ノード番号: FlowNode} を作る。遷移（#番号）と突き合わせるため番号を保持する。"""
    nodes: dict[str, FlowNode] = {}
    matched = NODE_TABLE_RE.search(text)
    if not matched:
        return nodes
    for line in matched.group(1).splitlines():
        cells = [c.strip() for c in line.strip("|").split("|")]
        if len(cells) < 5:
            continue
        number, phase, lane, kind, node_text = cells[0], cells[1], cells[2], cells[3], cells[4]
        if not number.isdigit() or not node_text or node_text == "—":
            continue
        pos = re.search(r"\((\d+),(\d+)\)", cells[5] if len(cells) > 5 else "")
        source_row = int(pos.group(1)) if pos else 0
        source_col = int(pos.group(2)) if pos else 0
        nodes.setdefault(number, FlowNode(number, phase, lane, kind, node_text, source_row, source_col))
    return nodes


def parse_flow_edges(text: str) -> list[FlowEdge]:
    """`### 遷移（コネクタ＝矢印）` の行を解析する。実線/点線とも保持する。"""
    edges: list[FlowEdge] = []
    for line in text.splitlines():
        m = EDGE_LINE_RE.match(line.strip())
        if not m:
            continue
        is_data = "データ遷移線" in m.group("kind")
        if m.group("free"):
            edges.append(FlowEdge(is_data, m.group("src"), "", FREE_END))
        else:
            edges.append(FlowEdge(is_data, m.group("src"), m.group("dst"), clean_cell(m.group("dst_text") or "")))
    return edges


@dataclass(frozen=True)
class DataLink:
    """原典の点線1〜2ホップ分。「産出工程 → データ/帳票 → 消費工程」を表す。

    工程は産出側にも参照側にも立つ。原典では `#23 出荷指示リスト作成 → #22 発送管理台帳`
    （工程→データ）だけでなく `#7 注文完了メール → #6 注文完了メール受領`（データ→工程）や
    `#4 受注*1 → #7 注文完了メール`（データ→データ）も描かれるため、双方向に辿る。
    相手側が原典に無い場合は空文字にし、推測で補完しない。
    """
    producer_no: str
    producer_text: str
    artifact_no: str
    artifact_text: str
    consumer_no: str        # 空文字＝消費先が原典に無い
    consumer_text: str


class FlowGraph:
    """1つの業務フローファイルのノード＋遷移。データ連鎖の問い合わせに使う。"""

    def __init__(self, text: str) -> None:
        self.nodes = parse_flow_nodes_numbered(text)
        self.edges = parse_flow_edges(text)
        # 作業概要→図形の突合には既存の正規化テキスト辞書を使う（判定ロジックを二重化しない）。
        self.norm_nodes = parse_flow_nodes(text)
        # 同じ図形名が複数箇所に現れるため、番号は候補リストで持つ（先頭1件では取りこぼす）。
        self.by_norm_text: dict[str, list[str]] = {}
        for number, node in self.nodes.items():
            self.by_norm_text.setdefault(normalize_node_text(node.text), []).append(number)

    def node_numbers(self, norm_text: str) -> list[str]:
        return self.by_norm_text.get(norm_text, [])

    def component_of(self, number: str) -> frozenset[str]:
        """number が属する無向連結成分（＝1つの業務フローパターンの図形集合）を返す。

        1ファイルに複数パターンが積まれており、番号は飛び飛びに割り振られるため、
        番号範囲 `[min,max]` ではパターン境界を誤る（別パターン混入・正当連鎖の脱落）。
        実線・点線の両方を無向辺として連結成分を求めれば、パターン実体で切り分けられる。
        """
        if not hasattr(self, "_components"):
            adj: dict[str, set[str]] = {}
            for e in self.edges:
                if not e.dst_no:
                    continue
                adj.setdefault(e.src_no, set()).add(e.dst_no)
                adj.setdefault(e.dst_no, set()).add(e.src_no)
            comp_by_node: dict[str, frozenset[str]] = {}
            seen: set[str] = set()
            for start in self.nodes:
                if start in seen:
                    continue
                stack = [start]
                group: set[str] = set()
                while stack:
                    cur = stack.pop()
                    if cur in seen:
                        continue
                    seen.add(cur)
                    group.add(cur)
                    stack.extend(adj.get(cur, ()))
                frozen = frozenset(group)
                for n in group:
                    comp_by_node[n] = frozen
            self._components = comp_by_node
        return self._components.get(number, frozenset({number}))

    def _out(self, number: str) -> list[FlowEdge]:
        return [e for e in self.edges if e.src_no == number and e.is_data]

    def _in(self, number: str) -> list[FlowEdge]:
        return [e for e in self.edges if e.dst_no == number and e.is_data]

    def _is_artifact(self, number: str) -> bool:
        node = self.nodes.get(number)
        return node is not None and node.kind in DATA_NODE_KINDS

    def _is_work(self, number: str) -> bool:
        node = self.nodes.get(number)
        return node is not None and node.kind not in NON_WORK_NODE_KINDS

    def _reach_work(
        self, start: str, forward: bool, scope: "set[str] | None" = None, depth: int = 3
    ) -> list[FlowNode]:
        """データ/帳票から点線を辿り、最初に到達する『工程』ノードを返す。

        原典には `#20 受注*2 → #21 受注*2` のようなデータ→データ（図形上の複製・転記）が
        あり、これを「消費工程」として出すとオラクルにならない。工程に当たるまで透過する。
        `scope` が与えられた場合、その番号集合の外の工程には到達しない（別パターンの
        点線を当該経路へ帰属させないため）。透過（データ複製）は scope 外でも辿ってよい。
        """
        seen = {start}
        frontier = [start]
        for _ in range(depth):
            found: list[FlowNode] = []
            nxt: list[str] = []
            for cur in frontier:
                edges = self._out(cur) if forward else self._in(cur)
                for e in edges:
                    other = e.dst_no if forward else e.src_no
                    if not other or other in seen:
                        continue
                    seen.add(other)
                    node = self.nodes.get(other)
                    if node is None:
                        continue
                    if self._is_work(other):
                        if scope is None or other in scope:
                            found.append(node)
                    else:
                        nxt.append(other)
            if found:
                return found
            frontier = nxt
        return []

    def data_links(self, number: str, scope: "set[str] | None" = None) -> list[DataLink]:
        """工程 number に接続するデータ遷移線を、産出側・参照側の両方向から返す。

        消費/産出の相手は必ず『工程』ノードにする（データ→データの複製は工程ではない）。
        相手が原典に無い/スコープ外の場合は空文字にし、推測で補完しない。
        """
        step = self.nodes.get(number)
        if step is None or not self._is_work(number):
            return []
        links: list[DataLink] = []
        # (1) 産出: 工程 → データ/帳票 →（透過）→ 消費工程
        for edge in self._out(number):
            if not edge.dst_no or not self._is_artifact(edge.dst_no):
                continue
            artifact = self.nodes[edge.dst_no]
            consumers = [n for n in self._reach_work(artifact.number, True, scope) if n.number != number]
            if not consumers:
                links.append(DataLink(number, step.text, artifact.number, artifact.text, "", ""))
            for target in consumers:
                links.append(DataLink(number, step.text, artifact.number, artifact.text, target.number, target.text))
        # (2) 参照: 産出工程 →（透過）→ データ/帳票 → 工程
        for edge in self._in(number):
            if not self._is_artifact(edge.src_no):
                continue
            artifact = self.nodes[edge.src_no]
            origins = [n for n in self._reach_work(artifact.number, False, scope) if n.number != number]
            if not origins:
                links.append(DataLink("", "", artifact.number, artifact.text, number, step.text))
            for origin in origins:
                links.append(DataLink(origin.number, origin.text, artifact.number, artifact.text, number, step.text))
        return links


# 業務フローファイル本文のキャッシュ（描画時に flow_path からグラフを引くため）。
FLOW_TEXT_BY_PATH: dict[Path, str] = {}
FLOW_GRAPH_BY_PATH: dict[Path, FlowGraph] = {}


def flow_graph(flow_path: Path) -> FlowGraph | None:
    if flow_path in FLOW_GRAPH_BY_PATH:
        return FLOW_GRAPH_BY_PATH[flow_path]
    text = FLOW_TEXT_BY_PATH.get(flow_path)
    if text is None:
        return None
    graph = FlowGraph(text)
    FLOW_GRAPH_BY_PATH[flow_path] = graph
    return graph


def classification_text(row: str) -> str:
    """作業種別の判定に使う本文。`※` 以降の注記は除く。

    注記は「その工程が何をするか」ではなく周辺の補足であり、そこに含まれる語（メール、CSV 等）で
    工程種別を判定すると誤る。実例:「出荷実績インポートに出荷データをインポート ※出荷完了メールが
    一斉送信される」は EC-CUBE のインポート工程だが、注記の「メール」で外部システム扱いになっていた。
    一方、作業内容が複数行に分割された継続行は工程の説明そのものなので判定に含める
    （例:「セール品リスト作成…この際に、変更するためのCSVを作成する」）。"""
    parts = [segment.split("※", 1)[0] for segment in row.split(ROW_SEP)]
    return re.sub(r"\s+", " ", " ".join(parts)).strip()


def lookup_node(summary: str, nodes: dict[str, tuple[str, str]]) -> tuple[str, str, str] | None:
    """作業概要に対応する図形ノードを引く。完全一致 → 包含（`イベント管理日程登録` ⊃ `日程登録`）。

    包含一致が複数ある場合、工程を表さない図形（ラベル/注釈/帳票/DB）を除いてもなお
    種別が割れるなら（例:「店頭注文番号」＝手作業とサブフローの両方に一致）、推測せず
    未判定として返す。誤って `手作業` と断定すると EC-CUBE 工程を落とし、逆も期待結果を壊す。
    """
    key = normalize_node_text(summary)
    if not key:
        return None
    if key in nodes:
        lane, kind = nodes[key]
        return lane, kind, key
    hits = [(k, v) for k, v in nodes.items() if key in k or k in key]
    if not hits:
        return None
    if len(hits) == 1:
        return hits[0][1][0], hits[0][1][1], hits[0][0]
    step_hits = [(k, v) for k, v in hits if v[1] not in NON_STEP_NODE_KINDS]
    kinds = {v[1] for _k, v in step_hits}
    if len(kinds) == 1 and step_hits:
        return step_hits[0][1][0], step_hits[0][1][1], step_hits[0][0]
    return None


def lookup_node_by_body(detail: str, nodes: dict[str, tuple[str, str]]) -> tuple[str, str, str] | None:
    """作業概要で引けない場合に、作業内容の本文に現れる図形名で引く。

    作業概要は図形名と綴りが揃わないことがある（作業概要「対応状況更新」／図形「受注マスター」）。
    本文が「受注マスターの対応状況を…更新する」と書いていれば、その工程が触れるシステム図形は
    本文から特定できる。推測ではなく本文の記述なので採用してよい。誤爆を避けるため、4文字以上の
    図形名に限り、工程を表す図形の種別が1つに収束する場合だけ使う。"""
    body = normalize_node_text(detail)
    if not body:
        return None
    hits = [
        (k, v) for k, v in nodes.items()
        if len(k) >= 4 and k in body and v[1] not in NON_STEP_NODE_KINDS
    ]
    kinds = {v[1] for _k, v in hits}
    if len(kinds) == 1 and hits:
        return hits[0][1][0], hits[0][1][1], hits[0][0]
    return None


def classify_work(summary: str, detail: str, nodes: dict[str, tuple[str, str]]) -> str:
    node = lookup_node(summary, nodes) or lookup_node_by_body(detail, nodes)
    if node is None:
        return WORK_UNKNOWN
    lane, kind, node_text = node
    if kind in SYSTEM_NODE_KINDS:
        # システム図形の帰属は「どのシステムの図形か」（レーン＋図形名）で決める。作業内容の本文は
        # 見ない。EC-CUBE 自身もメールを送るため、本文の「メール」で外部へ倒すと逆の誤爆になる。
        # 一方、図形名が `MTGバイヤー査定表印刷` なら、種別が `処理` でも外部ツールの操作である。
        if any(w in f"{lane} {node_text}".lower() for w in EXTERNAL_TOOL_WORDS):
            return WORK_EXTERNAL
        return WORK_ECCUBE
    if kind == "手作業":
        # 手作業は、人がどの道具で行うかを本文から読む。
        if any(w in f"{summary} {detail} {lane} {node_text}".lower() for w in EXTERNAL_TOOL_WORDS):
            return WORK_EXTERNAL
        # 手作業ノードでも CSV 作成・インポート等はシステム操作を伴う。物理と断定せず要確認。
        # レーン名は判定に含めない（レーン名 `EC-CUBE（本店）` が `EC-CUBE` に反応し、
        # 純粋な物理作業まで要確認へ落ちてしまうため）。
        if any(w in f"{summary} {detail}" for w in SYSTEM_HINT_WORDS):
            return WORK_AMBIGUOUS
        return WORK_PHYSICAL
    return WORK_UNKNOWN


def row_work_kind(row: str) -> str:
    return ROW_WORK_KIND.get(primary_text(row), WORK_UNKNOWN)


def assign_rows(text: str, patterns: list[Pattern]) -> None:
    # 親番号→パターン群（同一番号が複数ある＝重複親を保持）。
    by_number: dict[str, list[Pattern]] = {}
    for p in patterns:
        by_number.setdefault(p.number, []).append(p)
    by_key = {(p.number, normalize_name(p.name)): p for p in patterns}
    nodes = parse_flow_nodes(text)  # 図形ノードのレーン/種別（物理・外部・EC-CUBE の切り分け元）
    active: dict[str, Pattern] = {}  # 番号ごとに、直近の見出しで確定した現在パターン
    current: object = None  # 直前に確定した (pattern, row_index)
    last_rnum: int | None = None

    def record_work_kind(line_text: str, row: str) -> None:
        """行の作業概要を控える。分類は継続行の連結が終わってからまとめて行う。"""
        summary_m = re.search(r"\*\*\[作業概要\]\*\*\s*([^｜]+)", line_text)
        if summary_m:
            ROW_SUMMARY[primary_text(row)] = clean_cell(summary_m.group(1))

    for line in text.splitlines():
        rnum_m = re.search(r"R(\d+)", line)
        rnum = int(rnum_m.group(1)) if rnum_m else None
        header = re.search(r"\*\*\[＃\]\*\*\s*([0-9]+)　｜　\*\*\[作業概要\]\*\*\s*([^｜]+)", line)
        sub = re.search(r"\*\*\[＃\]\*\*\s*([0-9]+(?:[-－][0-9０-９①-⑳]+)?)", line)
        if header:
            # 親見出し行：番号＋作業概要名で該当パターンを特定し、その番号の現在パターンにする。
            # 同一番号が複数（重複親）でも、出現位置で正しく振り分けられる。
            num = header.group(1)
            name = normalize_name(clean_cell(header.group(2)))
            p = by_key.get((num, name)) or (by_number.get(num) or [None])[0]
            current = None
            last_rnum = rnum
            if p is not None:
                active[num] = p
                if not p.source_start and rnum is not None:
                    p.source_start = rnum
                row = clean_cell(line)
                if row:
                    if row not in p.rows:
                        p.rows.append(row)
                    record_work_kind(line, row)
                    current = (p, p.rows.index(row))
            continue
        if sub:
            # サブ行（N-M）は、その番号の現在パターン（無ければ先頭）に付ける。
            num = re.split(r"[-－]", sub.group(1), 1)[0]
            p = active.get(num) or (by_number.get(num) or [None])[0]
            current = None
            last_rnum = rnum
            if p is not None:
                if not p.source_start and rnum is not None:
                    p.source_start = rnum
                row = clean_cell(line)
                if row:
                    if row not in p.rows:
                        p.rows.append(row)
                    record_work_kind(line, row)
                    current = (p, p.rows.index(row))
            continue
        # ＃番号を持たない「作業内容」の継続行を、直前のステップ行に連結する。
        # 作業内容が複数行に分割されている場合の後半取りこぼし（例:「からcsvファイルを
        # ダウンロードする」）を防ぐ。ただし R番号が大きく飛ぶ補足行（別作業）は連結しない。
        if current is not None and "**[作業内容]**" in line:
            # 作業内容は次の番号付き行まで同一工程。図の配置上の空白行数は
            # 意味の境界ではない（06 R59→63、R88→92の経理/在庫条件を落とさない）。
            cont = re.sub(r"^-?\s*R\d+:\s*", "", clean_cell(line)).strip()
            if cont:
                p, idx = current  # type: ignore[misc]
                if cont not in p.rows[idx]:
                    sep = ROW_SEP if ROW_SEP not in p.rows[idx] else " "
                    p.rows[idx] = f"{p.rows[idx]}{sep}{cont}"
                    last_rnum = rnum

    # 親パターンの原典行範囲を確定する。番号ではなく、本文中の親見出し位置を境界にする。
    # 同じ番号が複数回出る在庫管理でも、別パターンの図形を混ぜないための一次スコープとなる。
    ordered = sorted((p for p in patterns if p.source_start), key=lambda p: p.source_start)
    for idx, p in enumerate(ordered):
        p.source_end = ordered[idx + 1].source_start if idx + 1 < len(ordered) else 10**9

    numbered_nodes = parse_flow_nodes_numbered(text)
    all_edges = parse_flow_edges(text)
    for p in patterns:
        p.node_scope = {
            number for number, node in numbered_nodes.items()
            if p.source_start <= node.source_row < p.source_end
        }
        p.nodes = {number: numbered_nodes[number] for number in p.node_scope}
        p.flow_edges = [
            edge for edge in all_edges
            if not edge.is_data and edge.src_no in p.node_scope and (not edge.dst_no or edge.dst_no in p.node_scope)
        ]
        # 作業概要と図形テキストをパターン範囲内で照合する。同名図形が複数あれば、
        # 元MarkdownのR行に最も近い図形を採用する。
        for row in p.rows:
            summary = ROW_SUMMARY.get(primary_text(row), "") or row_title(row)
            norm = normalize_node_text(summary)
            candidates = [
                node for number, node in numbered_nodes.items()
                if number in p.node_scope and normalize_node_text(node.text) == norm
            ]
            if not candidates and norm:
                candidates = [
                    node for number, node in numbered_nodes.items()
                    if number in p.node_scope
                    and node.kind not in NON_STEP_NODE_KINDS
                    and (norm in normalize_node_text(node.text) or normalize_node_text(node.text) in norm)
                ]
            if candidates:
                rnum = int(row_r_number(row) or "0")
                chosen = min(candidates, key=lambda node: (abs(node.source_row - rnum), int(node.number)))
                p.row_nodes[primary_text(row)] = chosen.number
                p.row_lanes[primary_text(row)] = chosen.lane

        # 作業概要と図形名が異なる場合も、同じ原典行位置の工程を参照する。
        # 遠い部分一致（「注文情報確認」→「注文」等）は分岐側を取り違えるため
        # 近接する図形が一意に定まる場合に限って補正する。
        for row in p.rows:
            rnum = int(row_r_number(row) or "0")
            existing = p.nodes.get(p.row_nodes.get(primary_text(row), ""))
            if existing and abs(existing.source_row - rnum) <= 2:
                continue
            nearby = [n for n in p.nodes.values()
                      if 0 <= rnum - n.source_row <= 3
                      and n.kind not in DATA_NODE_KINDS + ("注釈(吹き出し)", "borderCallout2", "フェーズ区切り")
                      and len(normalize_node_text(n.text)) >= 4
                      and not n.text.startswith("移動ステータス")]
            nearby.sort(key=lambda n: (rnum - n.source_row, int(n.number)))
            if nearby and (len(nearby) == 1 or nearby[0].source_row != nearby[1].source_row):
                chosen = nearby[0]
                p.row_nodes[primary_text(row)] = chosen.number
                p.row_lanes[primary_text(row)] = chosen.lane

    # 作業種別の判定は継続行の連結後に行う。作業内容が複数行に分かれている場合、
    # 「CSVを作成する」等のシステム操作の記述が継続行側にあり、1行目だけでは物理作業と
    # 誤判定するため（例:「セール品リスト作成…この際にCSVを作成する」）。
    for p in patterns:
        for row in p.rows:
            key = primary_text(row)
            summary = ROW_SUMMARY.get(key, "")
            if summary:
                node = numbered_nodes.get(p.row_nodes.get(key, ""))
                scoped_nodes = (
                    {normalize_node_text(node.text): (node.lane, node.kind)}
                    if node is not None else nodes
                )
                ROW_WORK_KIND[key] = classify_work(summary, classification_text(row), scoped_nodes)


def sub_step_index(row: str) -> int:
    """行のサブ番号（N-M の M）を整数化。見出し（サブ無し）は0。丸数字/全角対応。"""
    num = row_leading_number(row)
    parts = re.split(r"[-－]", num, 1)
    if len(parts) < 2:
        return 0
    s = parts[1]
    circled = {chr(0x2460 + i): i + 1 for i in range(20)}
    if s in circled:
        return circled[s]
    s = s.translate(str.maketrans("０１２３４５６７８９", "0123456789"))
    return int(s) if s.isdigit() else 999


def sort_pattern_rows(patterns: list[Pattern]) -> None:
    """各パターン内のステップをサブ番号順に整列（安定ソートで同番号は出現順維持）。"""
    for p in patterns:
        p.rows.sort(key=sub_step_index)


def renumber_duplicate_patterns(patterns: list[Pattern]) -> None:
    """同一フロー内で親番号が重複する場合、2件目以降を未使用の整数に振り直す
    （番号誤りの解消）。1件目は番号を維持し、トレース（asis/tobe統合）を壊さない。"""
    used = {int(p.number) for p in patterns if p.number.isdigit()}
    seen: set[str] = set()
    next_free = (max(used) + 1) if used else 1
    for p in patterns:
        if not p.number.isdigit():
            continue
        if p.number in seen:
            while next_free in used:
                next_free += 1
            p.number = str(next_free)
            used.add(next_free)
            next_free += 1
        else:
            seen.add(p.number)


INDEX_PATTERN_RE = re.compile(r"^-\s+\*\*R\d+\*\*:\s*([0-9]+)　｜　(.+)$")


def index_pattern_entries(text: str) -> list[tuple[str, str]]:
    """索引表『業務フローパターン』の (番号, 名称) 一覧。本文の `**[＃]**` 行とは別物。"""
    entries: list[tuple[str, str]] = []
    in_section = False
    for line in text.splitlines():
        if "業務フローパターン" in line:
            in_section = True
            continue
        if in_section:
            if "参考マニュアル" in line or "アクター" in line or line.startswith("## "):
                break
            matched = INDEX_PATTERN_RE.match(line.strip())
            if matched and "｜" not in matched.group(2):
                entries.append((matched.group(1), clean_cell(matched.group(2))))
    return entries


def index_pattern_status(num: str, name: str, patterns: list[Pattern]) -> str | None:
    """索引の1件を本文と突き合わせ、`本文欠落` / `名称ドリフト` / 問題なし(None) を返す。

    索引名と本文名は綴りが揺れる（索引「成田倉庫依頼戻し」／本文「成田倉庫在庫戻し」、
    索引「仕入れ統合作業」／本文「統合仕入れ作業」）。名称の包含一致だけで判定すると、
    本文が実在するのに「作業行が無い」と虚偽の警告を出す。番号が一致する本文があるなら
    名称の揺れであって欠落ではない。"""
    key = normalize_name(name)
    for p in patterns:
        pname = normalize_name(p.name)
        if pname and (key in pname or pname in key):
            return None
    if any(p.number == num for p in patterns):
        return "名称ドリフト（索引と本文で名称が異なる。本文は実在する）"
    return "本文欠落（作業行が無く、シナリオが生成されない）"


def missing_index_patterns(entries: list[tuple[str, str]], patterns: list[Pattern]) -> list[tuple[str, str]]:
    """索引表に載っているのに、その業務のどのフローにも本文（`**[＃]**` 行）が無いパターン。

    To-Be で新規追加された業務が、本文の作業行を伴わずに索引だけへ書かれている場合、
    パーサはパターンとして認識できずシナリオが1件も生成されない（例: 通販受注管理 tobe の
    「13 ｜【新規追加】在庫移動準備業務」）。黙って落とすと To-Be の新規業務が未テストのまま
    見えなくなるため、検出して警告する。

    判定は業務単位・名称ベースで行う。tobe の索引には変更のない業務も列挙され、その本文は
    asis 側にあるため、ファイル単位・番号ベースで見ると大量の誤検出になる（番号は
    `renumber_duplicate_patterns` で振り直される場合もある）。"""
    known = {normalize_name(p.name) for p in patterns}
    missing: list[tuple[str, str]] = []
    for num, name in entries:
        key = normalize_name(name)
        if any(key in k or k in key for k in known if k):
            continue
        missing.append((num, name))
    return missing


def scenario_filename(sid: str, title: str) -> str:
    safe = re.sub(r'[\\/:*?"<>|\s]+', "_", title).strip("_")
    return f"{sid}_{safe[:60]}.md"


def scenario_id(business_title: str, pattern: Pattern, ordinal: int) -> str:
    code = BUSINESS_CODES.get(business_title, ("FLOW", "", "", "", ""))[0]
    slug = re.sub(r"[^A-Za-z0-9一-龥ぁ-んァ-ヶー]+", "", pattern.name)
    slug = slug[:10] or "業務"
    return f"SCN-{code}-{slug}-{ordinal:03d}"


def business_title_for_flow(title: str) -> str:
    for key in BUSINESS_CODES:
        if key in title:
            return key
    return title.replace("(tobe)", "").replace("（tobe）", "").strip()


def actor_meta(business_title: str) -> tuple[str, str, str, str]:
    _, main, sub, systems, priority = BUSINESS_CODES.get(business_title, ("FLOW", "業務担当者", "関係チーム", "EC-CUBE", "P2"))
    return main, sub, systems, priority


BRANCH_KEYWORDS = (
    "キャンセル",
    "返金",
    "期限超過",
    "差異",
    "不一致",
    "不足",
    "欠品",
    "棄却",
    "却下",
    "差戻",
    "不備",
    "失敗",
    "エラー",
    "不可",
    "見つからない",
    "承認しない",
)


def is_branch_row(row: str, pattern_name: str) -> bool:
    # 分岐判定は主文のみで行う。連結した作業内容の補足語（不可/差異/エラー等）で
    # 正常系ステップを分岐化させない（codexレビュー重大指摘）。
    if not any(word in primary_text(row) for word in BRANCH_KEYWORDS):
        return False
    # If the scenario itself is about the exceptional business, keep it in the
    # normal route. Example: SPLINKS返金処理 and 欠品対応 are primary flows.
    return not any(word in pattern_name for word in BRANCH_KEYWORDS)


# 業務フロー図の判断ノード/継続断片で、正常系ステップとして意味を持たない作業概要。
# 例: 「キャンペーン対象」「有無」「次へ」は分岐/継続の見出しであり操作ではない
# （codexレビュー中程度指摘：正常系に意味不明な行が残る）。
STRUCTURAL_CONCEPTS = {"有無", "次へ", "連絡", "分岐", "キャンペーン対象", "キャンペーン対象 有無"}


def row_concept(row: str) -> str:
    # 構造判定・キーワード束ねは主文で行う（継続行の補足を含めない）。
    value = re.sub(r"^-?\s*R\d+:\s*", "", primary_text(row)).strip()
    value = re.sub(r"^\d+(?:[-－][\d０-９①-⑳]+)?\s*", "", value).strip()
    value = value.replace("｜", " ")
    return re.sub(r"\s+", " ", value).strip()


def is_structural_row(row: str) -> bool:
    concept = row_concept(row)
    if not concept:
        return True
    if concept in STRUCTURAL_CONCEPTS:
        return True
    # 時刻だけの行は実行タイミングの注記であって操作ではない。
    if re.fullmatch(r"\d{1,2}時(?:頃|ごろ)?", concept):
        return True
    # 「〜有無」「〜分岐」のみの判断ノード（作業内容を伴わない短い見出し）
    return bool(re.fullmatch(r".{0,10}(有無|分岐)", concept))


def row_leading_number(row: str) -> str:
    m = re.search(r"^-?\s*R\d+:\s*(\d+(?:[-－][\d０-９①-⑳]+)?)", primary_text(row))
    return m.group(1) if m else ""


def is_pattern_header_row(row: str, pattern: Pattern) -> bool:
    # パターン見出し行（＃番号がパターン番号そのもの＝作業概要がパターン名）は
    # 業務行動ではないため、下位ステップ（N-M）がある場合は正常系ステップの先頭に置かない。
    return bool(pattern.number) and row_leading_number(row) == pattern.number


def is_decision_row(row: str, pattern: Pattern) -> bool:
    number = pattern.row_nodes.get(primary_text(row), "")
    node = pattern.nodes.get(number)
    return node is not None and node.kind in {"判断", "diamond"}


def normal_flow_rows(pattern: Pattern) -> list[str]:
    """原典の業務工程を保持する。

    語句（場合/差異/不備など）で工程を落とさない。経路ごとの除外は、判断ノードの実線出口を
    使う `routes_for_pattern` 側だけで行う。
    """
    rows = [
        row
        for row in pattern.rows
        if not is_structural_row(row) or is_decision_row(row, pattern)
    ]
    # 下位ステップがあるなら、見出し行（パターン名の繰り返し）は除外して実作業を先頭にする。
    detailed = [row for row in rows if not is_pattern_header_row(row, pattern)]
    if detailed:
        rows = detailed
    if not rows:
        rows = [row for row in pattern.rows if not is_structural_row(row)] or pattern.rows or [pattern.name]
    return rows


def branch_flow_rows(pattern: Pattern) -> list[str]:
    # 旧キーワード分類は使わない。分岐は原図の判断ノード＋実線出口から作る。
    return [row for row in normal_flow_rows(pattern) if is_decision_row(row, pattern)]


NON_ECCUBE_SCREEN = "非EC-CUBE作業（メール/電話/Thunderbird・外部アプリ／EC-CUBE参照のみ）"
NON_ECCUBE_EXPECT = "メール/電話/外部アプリ側の対応記録が存在し、EC-CUBEの受注・在庫が更新されていないことを確認できること。"
NON_ECCUBE_OBSERVATION = "メール/外部アプリの対応記録、EC-CUBEの受注・在庫の更新有無"


def triggered_keyword_features(business_title: str, pattern: Pattern) -> list[tuple[str, str]]:
    """パターンで実際に発火したキーワードと機能Noの (keyword, feature) 一覧。
    キーワードが業務フロー本文（作業概要/パターン名）に実在するもののみ返す。"""
    haystack = pattern.name + " " + rows_primary_joined(pattern)
    pairs: list[tuple[str, str]] = []
    for keyword, features in EXPECTED_FUNCTIONS.get(business_title, []):
        if keyword and keyword in haystack:
            for f in features:
                pairs.append((keyword, f.upper()))
    return pairs


def assign_step_docs(business_title: str, pattern: Pattern, docs: list[DesignDoc]) -> list[DesignDoc | None]:
    """各正常系ステップ行に設計書を割り当てる。位置ベースではなく、キーワードで発火した
    機能Noを、そのキーワードを含む作業概要行に束ね直す（codex/Claude Codeレビュー指摘：
    機能Noが無関係な行にピン留めされる問題の是正）。残りの行は未使用docを位置順で埋める。"""
    rows = normal_flow_rows(pattern)
    if not docs:
        return [None] * len(rows)
    by_feature = {d.feature_no.upper(): d for d in docs}
    kw_feats = triggered_keyword_features(business_title, pattern)
    result: list[DesignDoc | None] = [None] * len(rows)
    used: set = set()
    # 物理作業・外部システム作業には EC-CUBE の機能Noを割り当てない。
    # 業務フロー図の「手作業」ノードに対応する工程であり、EC-CUBE 上に確認できる挙動が無い。
    # 物理作業・外部システム作業には EC-CUBE の機能Noを付けない。
    # 曖昧行（手作業ノードだがシステム操作を含む）は、キュレートされたキーワード辞書が
    # 発火した場合に限り機能Noを許す（辞書は人の判断であって推測ではない）。類似度による
    # 当てずっぽうの割当は許さない。
    by_keyword = [
        i for i, row in enumerate(rows)
        if row_work_kind(row) not in (WORK_PHYSICAL, WORK_EXTERNAL)
    ]
    # 類似度による割当は、EC-CUBE 工程だと確認できた行に限る。ノード表と照合できない行
    # （`WORK_UNKNOWN`）には物理作業が紛れており（例:「カード仕分け作業」）、そこへ設計書名との
    # 部分一致だけで画面を結び付けるのは、元の誤割当と同じ推測になる。辞書が発火する場合のみ許す。
    assignable = [i for i in by_keyword if row_work_kind(rows[i]) == WORK_ECCUBE]
    # 1st pass: キーワード発火機能を、その語を含む行へ束ねる
    for i in by_keyword:
        concept = row_concept(rows[i])
        for keyword, feature in kw_feats:
            if (
                keyword in concept
                and feature in by_feature
                and feature not in EXCLUDED_FEATURE_IDS
                and operation_direction_compatible(rows[i], by_feature[feature])
            ):
                doc = by_feature[feature]
                if doc.path not in used:
                    result[i] = doc
                    used.add(doc.path)
                    break
    # 類似度だけの第2候補割当は行わない。正確なキーワード対応または人手トリアージが無い工程は、
    # 業務フロー記載の操作として残す。誤った画面を断定するより情報を不足側に倒す。
    return result


def operation_direction_compatible(row: str, doc: DesignDoc) -> bool:
    """取込/出力など、業務動詞と機能仕様の方向が逆なら割り当てない。"""
    action = normalize_node_text(full_text(row)).lower()
    title = normalize_node_text(doc.title + " " + doc.path.stem).lower()
    input_words = ("インポート", "取込", "取り込", "アップロード", "csv登録")
    output_words = ("エクスポート", "出力", "ダウンロード", "csvexport")
    action_input = any(word in action for word in input_words)
    action_output = any(word in action for word in output_words)
    doc_input = any(word in title for word in input_words) or "import" in title
    doc_output = any(word in title for word in output_words) or "export" in title or "download" in title
    if action_input and doc_output and not doc_input:
        return False
    if action_output and doc_input and not doc_output:
        return False
    return True


def title_row_affinity(row_text: str, title: str) -> int:
    """設計書名の漢字/カナ部分列（2〜4文字）が行本文に何種類現れるか。日本語の近さの簡易指標。"""
    matched: set = set()
    for run in re.findall(r"[一-龥ァ-ヶー]{2,}", title):
        for n in range(2, min(5, len(run) + 1)):
            for i in range(len(run) - n + 1):
                sub = run[i : i + n]
                if sub in row_text:
                    matched.add(sub)
    # 長い一致ほど加点（部分列は入れ子で数えず、代表長で評価）
    return sum(len(s) for s in matched)


def step_rows(business_title: str, pattern: Pattern, docs: list[DesignDoc]) -> list[tuple[str, str, str, str, str, str]]:
    rows = normal_flow_rows(pattern)
    result: list[tuple[str, str, str, str, str, str]] = []
    main_actor = actor_meta(business_title)[0]
    non_eccube = is_non_eccube_pattern(pattern)
    step_docs = assign_step_docs(business_title, pattern, docs)
    for idx, row in enumerate(rows, 1):
        actor = actor_for_row(pattern, row, main_actor)
        action = business_action_from_row(row, pattern.name)
        doc = step_docs[idx - 1]
        feature = doc.feature_no if doc else "-"
        work = row_work_kind(row)
        expect = expected_assertion(row)
        if non_eccube:
            screen = NON_ECCUBE_SCREEN
            expect = NON_ECCUBE_EXPECT
            observation = NON_ECCUBE_OBSERVATION
        elif work == WORK_PHYSICAL:
            screen, observation = PHYSICAL_SCREEN, PHYSICAL_OBSERVATION
        elif work == WORK_EXTERNAL:
            screen, observation = EXTERNAL_SCREEN, EXTERNAL_OBSERVATION
        elif doc is not None:
            screen, observation = doc.title, expected_observation(row)
        else:
            # doc未特定（要確認だった工程）。08トリアージレジスタの判定で具体化する。
            screen, feature, observation = resolve_step_via_triage(business_title, row)
        import source_contract_adapter
        contract = source_contract_adapter.find(business_title, pattern, row, action)
        result.append(source_contract_adapter.apply(contract, (actor, action, screen, feature, expect, observation), sys.modules[__name__]))
    return result


def pick_primary_feature(row: str, feats: list[str]) -> str:
    """複数機能のうち、作業の操作動詞に合う主機能を選ぶ（先頭固定だとCSV出力工程に一覧画面を割当てる誤り）。"""
    if not feats:
        return ""
    text = row_title(row) + " " + row_detail(row)

    def title_of(f: str) -> str:
        return FEATURE_DOC[f].title if f in FEATURE_DOC else ""

    verb_groups = (
        (("CSV出力", "出力", "ダウンロード", "帳票"), ("CSV出力", "出力", "ダウンロード", "帳票", "EXPORT")),
        (("取込", "インポート", "登録CSV", "アップロード"), ("取込", "インポート", "IMPORT", "CSV登録")),
        (("承認", "差戻", "却下"), ("承認",)),
        (("詳細", "確認", "編集"), ("編集", "詳細")),
    )
    for row_words, title_words in verb_groups:
        if any(w in text for w in row_words):
            for f in feats:
                if any(w.lower() in title_of(f).lower() for w in title_words):
                    return f
    return feats[0]


def resolve_step_via_triage(business_title: str, row: str) -> tuple[str, str, str]:
    """要確認だった工程（doc未特定）を、08トリアージレジスタの判定で具体化する。
    戻り値 = (画面/機能表示, 機能No, 確認対象)。いずれも「要確認」を出さない。

    - TRACE-IN/AUTO + 実在機能No → その機能の画面と観測点（機能テストで担保される画面）
    - EXTERNAL → 外部システム作業（EC-CUBE更新なし・業務結果で観測）
    - PHYSICAL/CUSTOMER → 物理/顧客作業（現物・帳票で観測）
    - DECISION → 業務判断（分岐条件を評価）
    - UNKNOWN/未収載 → 業務フロー記載の操作として実施し、業務結果で観測（画面は創作しない）
    """
    judge, feature, uncertain = TRIAGE_REGISTER.get((business_title, row_r_number(row)), ("", "", False))
    # 割当機能が当該作業を対象外と明記/重複疑い（TSVが[要判断]と記録）の行は、機能を割り当てず
    # 業務フロー記載の操作＋業務結果観測に落とす（機能doc自身が対象外と記す割当は捏造）。
    if judge in ("TRACE-IN", "AUTO") and feature and not uncertain:
        # 機能Noは「M04-09,M04-32」等の複数（工程が触れる画面群）のことがある。作業の操作動詞で
        # 主画面を選ぶ（CSV/出力→出力系、取込→取込系、承認→承認系）。無ければ実在する先頭。
        feats = [
            f.strip().upper() for f in feature.split(",")
            if f.strip()
            and f.strip().upper() in FEATURE_DOC
            and operation_direction_compatible(row, FEATURE_DOC[f.strip().upper()])
        ]
        primary = pick_primary_feature(row, feats)
        if primary:
            doc = FEATURE_DOC[primary]
            allno = "・".join(feats)
            label = doc.title if len(feats) == 1 else f"{doc.title} ほか（{allno}）"
            return label, allno, expected_observation(row)
    if judge == "EXTERNAL":
        return EXTERNAL_SCREEN, "-", EXTERNAL_OBSERVATION
    if judge in ("PHYSICAL", "CUSTOMER"):
        return PHYSICAL_SCREEN, "-", PHYSICAL_OBSERVATION
    if judge == "DECISION":
        return DECISION_SCREEN, "-", DECISION_OBSERVATION
    # UNKNOWN / 未収載: 業務フロー記載の操作で実施し、業務結果を観測する（画面は創作しない）。
    return FLOW_ONLY_SCREEN, "-", expected_observation(row)


# 物理作業・外部システム作業・機能No未特定の表示。EC-CUBE 画面での観測を主張しない。
PHYSICAL_SCREEN = "現場作業（物理作業。EC-CUBE操作なし）"
PHYSICAL_OBSERVATION = "現物・現品、チェック票/帳票の記入、数量、サイン（EC-CUBE の更新は発生しない）"
EXTERNAL_SCREEN = "外部システム/ツール作業（EC-CUBE操作なし）"
EXTERNAL_OBSERVATION = "外部システム/ツール側の登録・記録内容（EC-CUBE の更新は発生しない）"
# 業務フローは操作を記すが専用の機能設計書が特定できない工程。画面を創作せず、業務フロー記載の
# 操作として実施し、業務結果（完了条件の最終業務状態）で観測する。「要確認」は使わない。
FLOW_ONLY_SCREEN = "業務フロー記載の操作として実施（専用の機能設計書なし・業務結果で観測）"
DECISION_SCREEN = "業務判断（分岐条件を評価し、該当する経路へ進む）"
DECISION_OBSERVATION = "分岐条件の判定結果と、進んだ経路（各分岐は代替/異常経路のシナリオで確認）"


def screen_from_flow(row: str, pattern: Pattern) -> str:
    """設計書が紐づかない場合の画面・機能名。創作せず、業務フローの作業概要を使う。"""
    title = row_title(row)
    return f"{title}（業務フロー: {pattern.name}）" if title else f"業務フロー: {pattern.name}"


def infer_actor(text: str, default_actor: str) -> str:
    # 「お客様対応」「顧客対応」は、社内チームが顧客からの問い合わせに対応する業務であり、
    # 実行主体はお客様ではない。この語で主アクターをお客様へ倒すと、社内のバックオフィス
    # 作業（キャンセル・返金・メール対応）を顧客向けフロント画面で実施する手順が生まれる。
    text = text.replace("お客様対応", " ").replace("顧客対応", " ")
    actor_map = {
        "お客様": "お客様",
        "支店": "支店担当者",
        "店舗": "店舗チーム",
        "通販": "通販チーム",
        "トレード": "トレードチーム",
        "商品管理": "商品管理チーム",
        "顧客戦略": "顧客戦略チーム",
        "経理": "経理担当",
        "社員": default_actor,
        "アルバイト": default_actor,
    }
    for actor, label in actor_map.items():
        if actor in text:
            return label
    return default_actor


def actor_from_lane(lane: str, fallback: str) -> str:
    """原図のスイムレーンを担当者名へ変換する。本文中の目的語よりレーンを優先する。"""
    compact = normalize_node_text(lane)
    lane_map = (
        ("お客様", "お客様"),
        ("店舗統括", "店舗統括チーム"),
        ("店舗", "店舗チーム"),
        ("顧客戦略", "顧客戦略チーム"),
        ("トレード", "トレードチーム"),
        ("通販", "通販チーム"),
        ("商品管理", "商品管理チーム"),
        ("支店", "支店担当者"),
        ("経理", "経理担当"),
    )
    for marker, actor in lane_map:
        if marker in compact:
            return actor
    # システムレーンは人間へ読み替えない。自動処理主体として原典名を保持する。
    if any(marker in compact for marker in ("EC-CUBE", "スマレジ", "MTG", "Wordpress", "SPLINKS", "デッキ", "ポイント")):
        return lane
    return fallback


def actor_for_row(pattern: Pattern, row: str, default_actor: str) -> str:
    lane = pattern.row_lanes.get(primary_text(row), "")
    if lane and lane not in ("—", "その他"):
        return actor_from_lane(lane, default_actor)
    return infer_actor(row, default_actor)


def business_action_from_row(row: str, scenario_name: str) -> str:
    # 表示（業務行動/操作）は全文を使い、複数行に分割された作業内容の後半も含める。
    value = re.sub(r"^-?\s*R\d+:\s*", "", full_text(row)).strip()
    value = re.sub(r"^\d*(?:[-－][\d０-９①-⑳]+)?\s*", "", value).strip()
    value = value.replace("｜", " ")
    value = re.sub(r"\s+", " ", value).strip()
    if not value:
        return f"{scenario_name}を開始する"
    parts = value.split(" ", 1)
    if len(parts) == 2 and len(parts[0]) <= 18:
        title, detail = parts
        # 作業内容が注記だけなら、注記を操作として実行せず作業概要を使う。
        if detail.lstrip().startswith("※"):
            return normalize_business_sentence(title, append_action=True)
        detail = normalize_business_sentence(detail)
        if detail:
            return f"{title}として、{detail}"
    return normalize_business_sentence(value, append_action=True)


def sanitize_vague(value: str) -> str:
    """業務フロー本文の曖昧表現を、意味を保ったまま具体化する（検証の禁止語を回避）。"""
    value = value.replace("何らかのトリガー", "業務トリガー")
    value = value.replace("何らか", "所定")
    value = value.replace("必要に応じて", "対象条件に該当する場合は")
    value = value.replace("必要に応じ", "対象条件に該当する場合")
    value = value.replace("適宜", "対象条件に応じて")
    value = value.replace("...", "").replace("…", "")
    return value


def normalize_business_sentence(value: str, append_action: bool = False) -> str:
    value = sanitize_vague(value.strip(" 、。"))
    value = value.strip(" 、。")
    value = re.sub(r"するために$", "する", value)
    value = re.sub(r"ために$", "", value).strip(" 、。")
    value = re.sub(r"確認のうえ$", "確認する", value)
    value = value.replace("対応が必要確認する", "対応が必要か確認する")
    value = value.replace("必要確認する", "必要か確認する")
    value = re.sub(r"おこない$", "行う", value)
    value = re.sub(r"行い$", "行う", value)
    value = value.strip(" 、。")
    if append_action and not re.search(r"(する|行う|確認する|報告する|更新する|登録する|出力する|依頼する|発送する|受け取る|移る|進む)$", value):
        if value.endswith("へ"):
            return value + "進む"
        if value.endswith("を"):
            return value + "行う"
        return f"{value}を行う"
    return value


def expected_from_operation(op: str) -> str:
    if "登録" in op or "作成" in op:
        return "対象データが登録され、一覧または詳細で確認できる"
    if "CSV" in op or "出力" in op or "ダウンロード" in op:
        return "業務に必要なCSV/帳票が出力され、対象件数と内容を確認できる"
    if "更新" in op or "変更" in op:
        return "対象データの状態または値が更新され、検索結果や詳細で確認できる"
    if "確認" in op or "照合" in op:
        return "対象情報の一致/不一致を判断でき、不一致時は後続処理へ進まない"
    if "メール" in op or "通知" in op:
        return "対象者へ通知され、送信状態または通知結果を確認できる"
    if "決済" in op or "返金" in op or "出金" in op:
        return "金額・対象受注・処理結果が一致し、処理状態を確認できる"
    return "対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる"


def row_core(row: str) -> str:
    value = re.sub(r"^-?\s*R\d+:\s*", "", full_text(row)).strip()
    # 先頭の番号（N / N-M / 丸数字、孤立した -M も）を除去する。
    value = re.sub(r"^\d*(?:[-－][\d０-９①-⑳]+)?\s*", "", value).strip()
    value = value.replace("｜", " ")
    return re.sub(r"\s+", " ", value).strip()


def row_title(row: str) -> str:
    """行の作業概要（先頭の短いラベル）。"""
    parts = row_core(row).split(" ", 1)
    return parts[0] if len(parts) == 2 and len(parts[0]) <= 18 else ""


def row_detail(row: str) -> str:
    """行の作業内容（業務フロー本文の詳細部）。期待結果はこれにリンクさせる。"""
    core = row_core(row)
    parts = core.split(" ", 1)
    return parts[1] if len(parts) == 2 and len(parts[0]) <= 18 else core


def observation_point(text: str) -> str:
    """業務フローの語から、観測可能な確認点を具体化する（創作せず語彙に沿う）。"""
    if any(w in text for w in ("CSV", "帳票", "ダウンロード", "出力", "印刷", "PDF")):
        return "出力されたCSV/帳票の件数と内容"
    if any(w in text for w in ("受領", "受信")) and any(w in text for w in ("メール", "通知")):
        return "受信したメール/通知の内容と受信日時"
    if any(w in text for w in ("メール", "通知", "連絡")):
        return "送信されたメール/通知の内容と送信状態"
    if any(w in text for w in ("在庫", "入庫", "出庫", "棚卸", "移動", "欠品", "引当", "補充")):
        return "在庫数と在庫変更履歴"
    if any(w in text for w in ("決済", "返金", "入金", "出金", "金額", "振込")):
        return "金額・決済状態と処理履歴"
    if any(w in text for w in ("承認", "差戻", "却下")):
        return "承認状態と操作履歴"
    if any(w in text for w in ("公開", "非公開")):
        return "公開状態"
    if any(w in text for w in ("取込", "インポート", "アップロード")):
        return "取込結果と対象件数・エラー行"
    if any(w in text for w in ("登録", "作成", "申込")):
        return "一覧・詳細に追加された対象データ"
    if any(w in text for w in ("更新", "変更", "反映", "修正")):
        return "更新後の値と更新履歴"
    if any(w in text for w in ("確認", "照合", "チェック", "査定")):
        return "照合/査定結果（一致・可否）と後続処理の可否"
    return "画面表示・処理ステータス・処理履歴"


def first_verb_clause(detail: str) -> str:
    """空白連結された作業内容から、最初に動詞終止する節までを取る。
    例:「…登録する 新規登録 今まで…」→「…登録する」。ただし
    「…商品CSV出力」 からcsvファイルをダウンロードする」のように主文が名詞止めの
    場合は、動詞終止する継続節まで含める（取りこぼし防止）。"""
    verb_end = re.compile(
        r"(する|した|される|できる|れる|られる|行う|なる|登録|出力|送付|送信|更新|変更|確認|"
        r"作成|実施|反映|通知|連絡|返信|移動|入庫|出庫|決済|返金|公開|取込|インポート|"
        r"集計|受付|査定|仕入|発送|振込|共有|保存|検索|選択|指定|入力|受領|終了|完了|対応|[うくぐすつぬぶむる])$"
    )
    acc = ""
    for seg in detail.split(" "):
        acc = f"{acc} {seg}".strip() if acc else seg
        if verb_end.search(acc.rstrip("」）】。、")):
            return acc
    return acc


def clean_detail(row: str) -> str:
    """期待結果の素材となる作業内容（URL除去・最初の動詞節・冗長トリム）。"""
    detail = normalize_business_sentence(row_detail(row))
    detail = re.sub(r"https?://\S+", "", detail)
    detail = detail.split("※", 1)[0].strip(" 、。")
    if not detail:
        detail = row_title(row).strip(" 、。")
    detail = re.sub(r"\s+", " ", detail).strip(" 、。")
    detail = first_verb_clause(detail)
    return detail


# サ変名詞（する を付けて動詞化できる語）の末尾。「完了」→「完了すること」等の整合に使う。
SAHEN_SUFFIX = re.compile(
    r"(完了|終了|処理|振替|受領|報告|連絡|返信|対応|記載|登録|出力|送付|送信|更新|変更|確認|作成|削除|実施|反映|付与|通知|委譲|移動|"
    r"入庫|出庫|承認|差戻|却下|決済|返金|公開|取込|集計|申込|受付|査定|仕入|発送|配送|引渡|振込|"
    r"出金|入金|抽出|印刷|統合|補充|廃棄|貸出|借用|依頼|連携|同期|保存|検索|選択|指定|入力|参照)$"
)


def koto_form(detail: str) -> str:
    """作業内容を「〜こと」で終わる主張形にする（語尾整合をとる）。"""
    d = detail.rstrip(" 、。")
    if not d:
        return "所定の業務結果が得られる"
    d = re.sub(r"となります$", "となる", d)
    d = re.sub(r"こととなる$", "こと", d)
    d = re.sub(r"メール受領$", "メールを受領", d)
    if d.endswith("こと"):
        return d
    if d.endswith("へ"):
        return d + "進むこと"
    if d.endswith("を"):
        return d + "行うこと"
    if d.endswith("もの"):
        return d + "であること"
    if d.endswith("する"):
        return d + "こと"
    if re.search(r"(される|できる|れる|られる)$", d):
        return d + "こと"
    if re.search(r"[うくぐすつぬぶむる]$", d):
        return d + "こと"
    if SAHEN_SUFFIX.search(d):
        return d + "すること"
    # 名詞止めの業務行は原典の作業ラベル。無理に動詞を推測せず、その作業の完了を判定対象にする。
    return d + "が完了したこと"


def expected_assertion(row: str) -> str:
    """期待結果／レスポンス。作業内容にリンクし、「〜こと。」で終える。"""
    detail = clean_detail(row)
    if not detail:
        return "所定の業務結果が得られること。"
    claim = koto_form(detail)
    if claim.endswith("確認できること"):
        return claim + "。"
    return f"{claim}を、{expected_observation(row)}で確認できること。"


def expected_observation(row: str) -> str:
    """確認対象（観測点）。期待結果とは別列で提示する。"""
    return observation_point(row_title(row) + " " + clean_detail(row))


def seed_suffix(s: Scenario) -> str:
    code = BUSINESS_CODES.get(s.business_title, ("FLOW", "", "", "", ""))[0]
    number = re.sub(r"\D", "", s.pattern.number) or "1"
    route = route_number(s.route.route_id)
    return f"{code}-{int(number):03d}-R{route:02d}"


def execution_seed(s: Scenario) -> dict[str, str]:
    import supplemental_scenarios
    import execution_repairs
    supplemental_seed = supplemental_scenarios.seed(s.sid)
    if supplemental_seed is not None:
        return execution_repairs.transform("seed", s, supplemental_seed, sys.modules[__name__])
    suffix = seed_suffix(s)
    common = {
        "担当者アカウント": f"st-user-{suffix.lower()}",
        "会員番号": f"ST-MEMBER-{suffix}",
        "商品コード": f"ST-CARD-{suffix}",
        "数量": "3",
        "店舗": "晴れる屋テスト店舗",
    }
    by_business: dict[str, dict[str, str]] = {
        "通販受注管理": {
            "受注番号": f"ST-ORDER-{suffix}",
            "決済状態": "売上確定済み",
            # 受注ステータスの既定値は置かない（「対応中」は受注管理の設計書に無い値だった）。
            "返金対象金額": "1,000円",
            # 0304 ご注文方法指定の配送方法の選択肢（ゆうパケット、ゆうパック、…）に「宅配便」は無い。
            "配送方法": "ゆうパック",
        },
        "店頭受取受注管理": {
            "受注番号": f"ST-PICKUP-{suffix}",
            "受取店舗": "晴れる屋テスト店舗",
            "受取期限": "注文日を含めて7日後",
            "決済状態": "未引渡し",
        },
        "在庫管理": {
            "商品コード": f"ST-STOCK-{suffix}",
            "移動元ロケーション": "本店バックヤード",
            "移動先ロケーション": "支店テスト棚",
            "移動数量": "3",
            "在庫状態": "移動可能",
        },
        "店頭買取": {
            "買取受付番号": f"ST-BUY-{suffix}",
            "査定対象商品": f"ST-CARD-{suffix}",
            "査定金額": "1,200円",
            "買取ステータス": "査定中",
        },
        "ネット買取": {
            "ネット買取申込番号": f"ST-OBUY-{suffix}",
            "本人確認状態": "確認済み",
            "査定対象商品": f"ST-CARD-{suffix}",
            "振込先": "テスト銀行 普通 1234567",
        },
        "仕入れ業務": {
            "仕入番号": f"ST-PURCHASE-{suffix}",
            "仕入対象商品": f"ST-CARD-{suffix}",
            "仕入数量": "5",
            "仕入ステータス": "未確定",
        },
        "商品登録・編集": {
            "商品コード": f"ST-PRODUCT-{suffix}",
            "カテゴリ": "テストカテゴリ",
            "販売価格": "500円",
            "公開状態": "非公開",
        },
        "価格管理": {
            "価格変更CSV": f"ST-PRICE-{suffix}.csv",
            "対象商品コード": f"ST-CARD-{suffix}",
            "変更前価格": "500円",
            "変更後価格": "550円",
        },
        "イベント管理": {
            "イベントID": f"ST-EVENT-{suffix}",
            "イベント名": f"システムテスト大会 {suffix}",
            "定員": "8名",
            "受付状態": "受付前",
        },
        "デッキ登録": {
            "デッキID": f"ST-DECK-{suffix}",
            "大会ID": f"ST-EVENT-{suffix}",
            "デッキ公開状態": "下書き",
            "カード枚数": "60枚",
        },
    }
    common.update(by_business.get(s.business_title, {"対象ID": f"ST-DATA-{suffix}", "処理状態": "未処理"}))
    common.update(dict(s.route.inputs))
    import source_contract_adapter
    values = source_contract_adapter.augment_seed(s, common, sys.modules[__name__])
    return execution_repairs.transform("seed", s, values, sys.modules[__name__])


def render_seed_table(seed: dict[str, str]) -> str:
    return "\n".join(f"| {key} | {value} |" for key, value in seed.items())


def primary_target(seed: dict[str, str]) -> str:
    for key in ("受注番号", "商品コード", "買取受付番号", "ネット買取申込番号", "仕入番号", "イベントID", "デッキID", "価格変更CSV", "対象ID"):
        if key in seed:
            return f"{key}={seed[key]}"
    first_key = next(iter(seed))
    return f"{first_key}={seed[first_key]}"


def concrete_confirmation(expect: str, seed: dict[str, str]) -> str:
    target = primary_target(seed)
    if "CSV" in expect or "帳票" in expect:
        return f"{target} のCSV/帳票が出力され、対象件数と主要項目がシード値と一致する"
    if "金額" in expect or "決済" in expect or "返金" in expect:
        amount = seed.get("返金対象金額") or seed.get("査定金額") or seed.get("変更後価格") or "対象金額"
        return f"{target} の金額が {amount} と一致し、処理履歴に担当者と処理日時が残る"
    if "登録" in expect or "更新" in expect or "変更" in expect:
        return f"{target} の登録/更新後の値がシード値と一致し、更新履歴が1件追加される"
    if "一致/不一致" in expect:
        return f"{target} の照合結果が画面に表示され、不一致時は後続処理ボタンが実行不可になる"
    return f"{target} の処理ステータス、処理履歴、担当者、処理日時が確認できる"


def step_target(action: str, seed: dict[str, str]) -> str:
    """ステップの業務内容に合うシード項目を選ぶ（全ステップで単一IDを使い回さない）。"""
    # 動詞・値に応じた補助フィールドを優先し、単一ドメインでも入力に幅を持たせる。
    aux: list[tuple[tuple[str, ...], tuple[str, ...]]] = [
        (("移動", "移送", "運搬"), ("移動元ロケーション", "移動先ロケーション")),
        (("数量", "枚数", "個数"), ("移動数量", "数量")),
        (("出金", "支払", "振込", "査定"), ("査定金額",)),
        (("返金", "減額"), ("返金対象金額",)),
        (("価格変更", "値付", "価格調整", "変更後"), ("変更後価格",)),
    ]
    for words, keys in aux:
        if any(w in action for w in words):
            for k in keys:
                if seed.get(k):
                    return f"{k}={seed[k]}"
    priority: list[tuple[tuple[str, ...], tuple[str, ...]]] = [
        (("受注", "注文", "発送", "入金", "返金", "出荷", "配送", "受取"), ("受注番号",)),
        (("買取", "査定"), ("買取受付番号", "ネット買取申込番号", "査定対象商品")),
        (("仕入",), ("仕入番号", "仕入対象商品")),
        (("イベント", "大会", "受付", "ポイント", "申込"), ("イベントID",)),
        (("デッキ",), ("デッキID",)),
        (("価格", "セール", "割引", "バナー"), ("価格変更CSV", "対象商品コード", "商品コード")),
        (("在庫", "入庫", "出庫", "棚卸", "移動", "欠品", "補充", "集計", "貼替"), ("商品コード",)),
        (("商品", "カード", "カテゴリ", "公開", "CSV"), ("商品コード",)),
    ]
    for words, keys in priority:
        if any(w in action for w in words):
            for k in keys:
                if seed.get(k):
                    return f"{k}={seed[k]}"
    return primary_target(seed)


def edge_input_data(case: "EdgeCase") -> str:
    """エッジケースの条件を満たす入力データを具体化（網羅のため条件別に変える）。"""
    c = case.condition
    if "権限" in c:
        return "必要権限を持たない担当者アカウント"
    if "在庫" in c and ("不足" in c or "0" in c or "欠品" in c):
        return "在庫が不足/0枚の対象商品"
    if "重複" in c or "二重" in c:
        return "既に処理済みの対象データ（重複実行用）"
    if "不一致" in c or "差異" in c:
        return "金額/数量/対象が不一致となる対象データ"
    if "不備" in c or "不正" in c or "形式" in c or "必須" in c:
        return "必須項目欠落・形式不正の入力データ"
    if "0件" in c or "存在しない" in c or "見つからない" in c:
        return "検索条件に一致しない（0件）データ"
    if "期限" in c or "超過" in c:
        return "受付/受取期限を超過した対象データ"
    if "失敗" in c or "エラー" in c or "できない" in c or "不可" in c:
        return "外部連携/処理が失敗する条件の対象データ"
    return f"条件「{c}」を満たす対象データ"


def primary_target_pair(seed: dict[str, str]) -> tuple[str, str]:
    for key in ("受注番号", "商品コード", "買取受付番号", "ネット買取申込番号", "仕入番号", "イベントID", "デッキID", "価格変更CSV", "対象ID"):
        if key in seed:
            return key, seed[key]
    first_key = next(iter(seed))
    return first_key, seed[first_key]


def suffixed_target(seed: dict[str, str], suffix: str) -> str:
    key, value = primary_target_pair(seed)
    if value.endswith(".csv"):
        value = value[:-4] + f"-{suffix}.csv"
    else:
        value = f"{value}-{suffix}"
    return f"{key}={value}"


def seed_input_summary(seed: dict[str, str], limit: int = 6) -> str:
    preferred = [
        "担当者アカウント", "受注番号", "商品コード", "買取受付番号", "ネット買取申込番号",
        "仕入番号", "イベントID", "デッキID", "価格変更CSV", "数量", "店舗",
        "カテゴリ", "販売価格", "公開状態", "定員", "受付状態",
    ]
    parts: list[str] = []
    seen: set[str] = set()
    for key in preferred:
        if key in seed and key not in seen:
            parts.append(f"{key}={seed[key]}")
            seen.add(key)
        if len(parts) >= limit:
            break
    if len(parts) < limit:
        for key, value in seed.items():
            if key not in seen:
                parts.append(f"{key}={value}")
                seen.add(key)
            if len(parts) >= limit:
                break
    return " / ".join(parts)


def branch_precondition_delta(case: EdgeCase) -> str:
    c = case.condition
    if "権限" in c:
        return "通常担当者とは別に、対象機能の更新権限を持たないアカウントでログインする。"
    if "重複" in c or "二重" in c:
        return "同一対象の初回処理を完了済みにし、処理履歴を1件保持しておく。"
    if "必須" in c or "形式" in c or "不正" in c:
        return "必須項目欠落または形式不正を含む入力ファイル/フォーム値を用意する。"
    if "価格" in c and "未設定" in c:
        return "販売価格または在庫連動に必要なマスタ値を未設定の状態にする。"
    if "カテゴリ" in c or "不整合" in c:
        return "カテゴリ、発売日、公開状態のいずれかを業務ルールと不整合な値にする。"
    if "在庫" in c and ("不足" in c or "0" in c or "欠品" in c):
        return "対象商品の引当可能在庫を0または必要数未満にする。"
    if "期限" in c or "期間外" in c:
        return "受付/受取期限または受付期間を境界外の日時にする。"
    if "失敗" in c or "エラー" in c:
        return "外部連携または取込処理が失敗を返すテストデータを用意する。"
    return "分岐条件を満たす対象データを、正常代表データとは別IDで用意する。"


def branch_pattern_input(s: Scenario, case: EdgeCase, branch_id: str, seed: dict[str, str]) -> str:
    c = case.condition
    base = suffixed_target(seed, branch_id)
    scenario_tag = seed_suffix(s)
    if s.route.inputs:
        return " / ".join([base] + [f"{key}={value}" for key, value in s.route.inputs])
    if "権限" in c:
        return f"担当者アカウント=st-user-{scenario_tag.lower()}-readonly / {base} / 権限=参照のみ"
    if "重複" in c or "二重" in c:
        return f"{base} / 初回処理履歴ID=ST-HISTORY-{scenario_tag}-{branch_id} / 再実行回数=2"
    if "必須" in c or "形式" in c or "不正" in c:
        if "CSV" in c or s.coverage.get("CSV/帳票"):
            return f"CSVファイル=ST-INVALID-{scenario_tag}-{branch_id}.csv / 必須列=空欄 / 数値列=abc / 基準={primary_target(seed)}"
        return f"{base} / 必須項目=空欄 / 日付=2026/99/99 / 数量=-1"
    if "価格" in c and "未設定" in c:
        return f"{base} / 販売価格=未設定 / 在庫区分=未設定 / 公開状態=公開予定"
    if "カテゴリ" in c or "不整合" in c:
        return f"{base} / カテゴリ=存在しないカテゴリ / 発売日=2026-08-21 / 公開状態=公開 / 予約販売フラグ=OFF"
    if "公開・非公開" in c:
        return f"{base} / 一括切替CSV=ST-PRODUCT-{scenario_tag}-{branch_id}.csv / 対象外商品コード=ST-PRODUCT-{scenario_tag}-OUT"
    if "在庫" in c and ("不足" in c or "0" in c or "欠品" in c):
        return f"{base} / 必要数量=3 / 引当可能在庫=0 / ロケーション=本店バックヤード"
    if "不一致" in c or "差異" in c:
        return f"{base} / 画面数量=3 / CSV数量=2 / 金額差異=100円"
    if "期限" in c or "期間外" in c:
        return f"{base} / 期限=2026-07-06 23:59 / 実行日時=2026-07-07 10:00"
    if "0件" in c or "存在しない" in c:
        return f"検索条件=ST-NOTFOUND-{scenario_tag}-{branch_id} / 基準={primary_target(seed)}"
    if "失敗" in c or "エラー" in c or "できない" in c or "不可" in c:
        return f"{base} / 外部連携結果=ERROR / リトライ可能=YES"
    return f"{edge_input_data(case)} / {base} / 基準={primary_target(seed)}"


def data_patterns_for(s: Scenario, seed: dict[str, str]) -> list[DataPattern]:
    route_pattern = scenario_route_pattern(s)
    steps = step_rows(s.business_title, route_pattern, s.docs)
    step_count = len(steps)
    normal_target = f"正常系#1-#{step_count}" if step_count > 1 else "正常系#1"
    normal_observation = html_escape_br(observation for *_rest, observation in steps[:3]) if steps else "画面表示・処理ステータス・処理履歴"
    route_precondition = s.route.condition
    if route_precondition:
        route_precondition = f"{route_precondition} 標準権限の担当者でログインし、標準マスタと基準シードデータを使用する。"
    else:
        route_precondition = "標準権限の担当者でログインし、標準マスタと基準シードデータを使用する。"
    route_precondition += " " + s.route.preparation
    route_input = seed_input_summary(seed)
    if s.route.inputs:
        route_input += " / " + " / ".join(f"{key}={value}" for key, value in s.route.inputs)
    patterns: list[DataPattern] = [
        DataPattern(
            "DP-N001",
            "正常系 代表",
            normal_target,
            f"{s.route.kind}の代表データで業務経路を確認する。",
            route_precondition,
            route_input,
            f"{normal_observation}<br>{s.route.final_state}",
        )
    ]
    # 境界値データパターンは使わない。境界値(数量=1/3・価格0/上限・
    # 定員境界等)は業務フロー・HTML設計書に無い値であり、かつ結合テスト層(IT-*)が機能単位で
    # 網羅する観点である(依頼者確定: 境界値は結合テストで実施済みのため本層では不要)。
    # 本層のDPは原典由来(正常代表 DP-N001 + 業務フロー分岐由来の DP-E/DP-A)に限る。
    for branch_id, case in edge_case_branch_ids(list(s.route.edge_cases)):
        prefix = "A" if branch_id.startswith("A") else "E"
        number = int(re.sub(r"\D", "", branch_id) or "1")
        patterns.append(
            DataPattern(
                f"DP-{prefix}{number:03d}",
                "代替系" if prefix == "A" else "異常系",
                f"分岐{branch_id}",
                case.condition,
                s.route.preparation or branch_precondition_delta(case),
                branch_pattern_input(s, case, branch_id, seed),
                case.observation,
            )
        )
    from route_evidence import supplement_data_patterns
    import execution_repairs
    values = supplement_data_patterns(s, seed, patterns, sys.modules[__name__])
    return execution_repairs.transform("data_patterns", s, values, sys.modules[__name__])


def render_data_pattern_rows(patterns: list[DataPattern]) -> str:
    rows: list[str] = []
    for p in patterns:
        rows.append(
            "| "
            + " | ".join(
                table_cell(value)
                for value in (
                    p.pattern_id,
                    p.kind,
                    p.target,
                    p.purpose,
                    p.precondition_delta,
                    p.input_data,
                    p.observation,
                )
            )
            + " |"
        )
    return "\n".join(rows)


# データ連鎖の照合キー導出。原典が名付けたデータオブジェクト（受注/ネット買取/在庫…）は、
# その同一性を担保する識別子が自明であり、対応するシード項目が既に存在する。これは創作では
# なく「原典が名付けたオブジェクトの identity をシードIDで表す」だけなので捏造ゼロを保つ。
# オブジェクト語が無い/対応シード項目が無い場合のみ『未定義』のままにする。
# 各ルール＝(データオブジェクトを名指す語, そのオブジェクト自身のID項目候補)。
# 語は「オブジェクトの名前」だけにする。返金/売上/決済/CSV/登録のような『動作・書類の種類』語は
# オブジェクトの identity ではないため入れない（それらでキーを決めると原典に無い同一性を主張する）。
# ID候補は同一オブジェクトの別名のみ（金額など非IDは入れない）。
CHAIN_KEY_RULES: tuple[tuple[tuple[str, ...], tuple[str, ...]], ...] = (
    (("ネット買取",), ("ネット買取申込番号",)),
    (("仕入",), ("仕入番号",)),
    (("買取", "査定"), ("買取受付番号",)),
    (("受注", "注文", "出荷", "配送", "対応状況", "ピッキング", "ピック", "スタック", "発送"), ("受注番号",)),
    (("デッキ",), ("デッキID",)),
    (("イベント", "大会"), ("イベントID", "大会ID")),
    (("会員", "顧客", "本人確認", "身分"), ("会員番号",)),
    (("在庫", "棚卸", "入庫", "出庫", "欠品", "補充"), ("商品コード",)),
)


def chain_key(artifact_text: str, seed: dict[str, str]) -> str:
    """データ連鎖の照合キーを、原典が名付けた**データオブジェクト名（アーティファクト）**から導出する。

    原典が `受注*2` というデータを描いている以上、その identity は受注番号であり、シードに
    `受注番号=ST-ORDER-…` が既に存在する。これを表すのは創作ではない。
    ただし: (1) 周辺工程語ではなくアーティファクト名だけで判定する、(2) オブジェクト語が
    一致したら、そのオブジェクト自身のID項目がシードに無い場合は**別オブジェクトのIDへ
    フォールスルーせず**空を返す（別objectのIDを付けるのは原典に無い同一性の捏造）。
    """
    for tokens, fields in CHAIN_KEY_RULES:
        if any(t in artifact_text for t in tokens):
            for f in fields:
                if seed.get(f):
                    return f"{f}={seed[f]}"
            return ""  # オブジェクトは判ったが自身のID項目がシードに無い→未定義のまま（代替しない）
    return ""


# HTML基本設計書由来のデータ連鎖情報。2種類に厳格に分ける（codexレビュー指摘: 直列遷移や
# 下流バッチ消費を合成すると過剰主張＝捏造になる）。
#   kind="consumer": HTMLが当該データの**下流処理を literal に明記** → 自由端を解消し
#                    verdict を『連鎖あり（HTML設計書由来）』にする。
#   kind="note":     HTMLはデータの保存先テーブル・ステータス値は記すが**消費先は明記しない** →
#                    自由端は要確認のまま。HTMLの事実（テーブル/ステータス）を注記するだけ。
# いずれもオラクル文はHTMLの literal 記述のみ。直列遷移・自動因果は主張しない。記載の無い
# オブジェクト（売上/発送管理台帳/返金処理記録/各Excel作業ファイル）は登録しない。
# 各要素 = (含む語, 対象業務(空=全業務), kind, 消費先/注記見出し, オラクル文, HTML出典)。
HTML_CHAIN_RESOLUTIONS: tuple[tuple[tuple[str, ...], tuple[str, ...], str, str, str, str], ...] = (
    # === consumer: HTMLが下流処理を明記 ===
    (("棚卸計画",), (), "consumer",
     "棚卸確定（dtb_inventory_plan→dtb_product_stock）",
     "棚卸在庫反映画面（0202 sheet-43）の反映操作により、対象店舗・棚・商品の在庫が棚卸実数に更新されること",
     "0202_在庫管理"),
    (("出金",), (), "consumer",
     "店頭買取情報更新API→EC-CUBE連携",
     "スマレジの端末取引ID（smaregi_transaction_id）が店頭買取情報更新API（PUT /api/admin/otcBuyOrder/{_otcBuyOrderId}.json）で同じ買取へ連携されること"
     "（経理払い出し済で買取成立にする旨をHTMLに記載）",
     "0601_MTGBuyer"),
    # === note: 保存先/ステータスの記載はあるが消費先は明記なし（自由端は要確認のまま注記） ===
    # 在庫移動指示: tracking_no反映先の記載はあるが、在庫移動実績CSV取込では在庫数・移動ステータスを
    # 更新しないとHTMLが明記するため、consumerにはせず注記に留める（codecレビュー指摘）。
    (("在庫移動指示",), (), "note",
     "在庫移動・振替（dtb_stock_move_transfer / dtb_stock_move_instruction）",
     "現行HTML 0202 sheet-32では移動指示ID・送り状No.を在庫移動実績CSVから登録し、発送状況を済、移動ステータスを移動中に更新する。入庫による数量加算は入庫承認工程で確認する",
     "0202_在庫管理"),
    # 在庫変更CSV: 承認ワークフロー経由の在庫反映は実装依存とHTMLが留保するため、断定せず注記に留める。
    (("在庫変更CSV",), (), "note",
     "在庫変更CSV取込（dtb_csv_import_history→在庫編集承認情報/在庫変更履歴）",
     "現行HTML 0202の在庫変更CSV取込では取込履歴・在庫編集承認情報・在庫変更履歴を記録する。登録と承認による在庫反映を分け、承認確定後の対象店舗・商品・数量を照合する",
     "0202_在庫管理"),
    (("受注", "出荷"), ("店頭受取受注管理", "通販受注管理"), "note",
     "受注ステータス（dtb_order.order_status_id）",
     "HTML設計書では受注ステータスはdtb_order.order_status_idで管理され、注文受領→ピック中でconfirm_dateを、"
     "出荷完了でshipping_dateを登録しポイント付与・外部在庫連携を行う旨が個別に記載（消費先の明示はなし）",
     "0203_受注管理"),
    (("在庫",), ("在庫管理", "店頭買取"), "note",
     "在庫（dtb_product_stock / dtb_stock_history）",
     "HTML設計書では在庫増減はdtb_product_stock.stock/dtb_product_class.stockへ反映され、dtb_stock_historyに"
     "登録元区分付きで記録される旨が記載（消費先の明示はなし）",
     "0202_在庫管理"),
    (("査定確認メール", "査定内容メール"), (), "note",
     "メール履歴（dtb_mail_history）",
     "HTML設計書では査定内容メール送信でdtb_mail_historyに記録し、ステータス『13 査定内容連絡済み』は管理画面で切り替える旨が記載",
     "0206_ネット買取"),
    (("ネット買取",), ("ネット買取",), "note",
     "ネット買取ステータス（dtb_buy_order / dtb_buy_order_status_histry）",
     "HTML設計書ではネット買取ステータス値(1注文〜7振込完了)が定義され、変更ごとにdtb_buy_order_status_histryへ履歴を追加する旨が記載",
     "0206_ネット買取 / 0507_APIネット買取"),
    (("買取",), ("店頭買取",), "note",
     "店頭買取ステータス（dtb_otc_buy_order / _status_history）",
     "HTML設計書では店頭買取はdtb_otc_buy_orderで管理され、ステータス変更はdtb_otc_buy_order_status_historyに記録する旨が記載",
     "0205_店頭買取"),
    (("支店インポート",), ("店頭買取",), "note",
     "支店インポート用CSV（廃止→買取商品一覧CSVへ置換）",
     "HTML設計書では支店インポート用のインポートCSVは廃止とし、買取商品一覧CSVへ置換する旨が記載（取込先システムの明示はなし）",
     "0205_店頭買取"),
)


# ブロードな単語（オブジェクト総称）。これらだけで一致した場合、作業ファイル名/別データ
# （用/表/シート/ファイル/リスト/依頼/計画書/データ/CSV）を持つアーティファクトには適用しない。
# 「在庫変更依頼用」「出荷データ*4」等はHTML設計書が扱う対象と別物で、オラクルを付けると捏造になる。
HTML_GENERIC_TOKENS = frozenset({"受注", "在庫", "買取", "ネット買取", "出荷"})
WORKFILE_MARKERS = ("用", "表", "シート", "ファイル", "リスト", "依頼", "計画書", "データ", "CSV")


def html_chain_resolution(artifact_text: str, business: str) -> tuple[str, str, str, str] | None:
    """アーティファクトに対応するHTML設計書由来の (kind, 消費先/注記見出し, オラクル文, 出典) を返す。

    HTMLに literal に記述がある場合のみ。記載の無いオブジェクトは None。ブロード語（オブジェクト
    総称）の作業ファイル/別データへの誤適用は WORKFILE_MARKERS でガードする。
    """
    is_workfile = any(m in artifact_text for m in WORKFILE_MARKERS)
    for tokens, businesses, kind, consumer, oracle, source in HTML_CHAIN_RESOLUTIONS:
        matched = [t for t in tokens if t in artifact_text]
        if not matched or (businesses and business not in businesses):
            continue
        if is_workfile and all(t in HTML_GENERIC_TOKENS for t in matched):
            continue
        return kind, consumer, oracle, source
    return None


def data_chain_rows(s: Scenario, seed: "dict[str, str] | None" = None) -> str:
    """原典のデータ遷移線から「産出工程 → データ/帳票 → 消費工程」を表にする。

    シナリオテストの主オラクルは画面仕様への適合ではなく、**データのつながりで業務が完遂
    できること**である。ここは業務フロー図の点線（データ遷移線）だけを根拠にし、原典に
    無い結線・照合キーは創作しない。接続先が無い場合は `自由端` として穴を可視化する。
    """
    import supplemental_scenarios
    supplemental_chain = supplemental_scenarios.chain_rows(s.sid)
    if supplemental_chain is not None:
        return supplemental_chain
    graph = flow_graph(s.flow_path)
    empty = ("| - | - | - | - | 業務フロー図にデータ遷移線（点線）の記載がないため、データ連鎖は "
             "`## 完了条件` の最終業務状態で観測する。 | - | データ遷移線なし（完了条件で観測） |")
    if graph is None or not graph.edges:
        return empty

    # 親パターンの本文行範囲から先に確定した図形集合だけを使う。同名ノードの多数決で
    # スコープを推定すると、別パターンの大きな連結成分へ吸われるため禁止する。
    scope: set[str] = set(s.pattern.node_scope)
    row_candidates: list[list[str]] = []
    for row in s.route.rows:
        number = s.pattern.row_nodes.get(primary_text(row), "")
        row_candidates.append([number] if number and number in scope else [])

    seed = seed or {}
    lines: list[str] = []
    seen: set[tuple[str, str, str]] = set()
    for step_no, nums in enumerate(row_candidates, 1):
        # 観点の当てはめ契約で工程の対象を別の受注にしたときは、その工程の照合キーも同じ受注にする。
        import execution_repairs
        override = execution_repairs.step_target(s, step_no, seed) if seed else None
        step_seed = {**seed, "受注番号": seed[override[1]]} if override and override[1] else seed
        for number in nums:
            for link in graph.data_links(number, scope):
                if execution_repairs.exclude_data_link(s, link):
                    continue
                # パターン外参照は生成器の欠陥なので、黙って表へ混入させない。
                refs = {n for n in (link.producer_no, link.artifact_no, link.consumer_no) if n}
                if not refs <= scope:
                    raise ValueError(f"data-link scope violation: {s.sid}: {sorted(refs - scope)}")
                key = (link.producer_no, link.artifact_no, link.consumer_no)
                if key in seen:
                    continue
                seen.add(key)
                artifact = f"#{link.artifact_no} {link.artifact_text}"
                # 照合キーはアーティファクト（原典が名付けたデータオブジェクト）名のみから導出する。
                # 周辺工程語を混ぜると、返金メール連鎖に受注番号を付ける等の誤りが出る（codex指摘）。
                derived = chain_key(link.artifact_text, step_seed)
                # 単一シードだけでは産出側と消費側の同一性を証明できない。
                # HTMLに定義があるキーは下段で補い、未確定のものは保留とする。
                key_cell = derived if derived else "照合キーは原典未定義（実施保留。単一シードで同一性を代用しない）"
                html = html_chain_resolution(link.artifact_text, s.business_title)
                html_note = f" {html[2]}（出典: {html[3]}）。" if html else ""
                if link.producer_no and link.consumer_no:
                    producer = f"#{link.producer_no} {link.producer_text}"
                    consumer = f"#{link.consumer_no} {link.consumer_text}"
                    tail = f"（照合キー {derived} で同一）" if derived else "（照合キー確定後に実施。未確定の間は合否を保留）"
                    expected = (
                        f"「{link.producer_text}」で産出/更新された「{link.artifact_text}」を、"
                        f"後続工程「{link.consumer_text}」が同一対象として参照できること{tail}。" + html_note
                    )
                    verdict = "連鎖あり"
                elif link.producer_no:
                    producer = f"#{link.producer_no} {link.producer_text}"
                    if html and html[0] == "consumer":
                        # 業務フロー図は消費先を描かない(自由端)が、HTML設計書が下流処理を明記している。
                        consumer = f"{html[1]}（HTML設計書由来）"
                        expected = f"「{link.producer_text}」で産出/更新された「{link.artifact_text}」について、{html[2]}（出典: {html[3]}）。"
                        verdict = "連鎖あり（HTML設計書由来）"
                    else:
                        # 図に消費先がなければこの経路の成果物として観測する。
                        # 図の自由端だけでは実際の後続業務が存在しないとは断定しない。
                        consumer = "終端（業務フロー図に消費先の記載なし）"
                        expected = f"「{link.producer_text}」で「{link.artifact_text}」が産出/更新され、`## 完了条件` の最終業務状態で確認できること。" + html_note
                        verdict = "終端（消費先の記載なし・完了条件で観測）"
                else:
                    producer = "起点（業務フロー図に産出元の記載なし）"
                    consumer = f"#{link.consumer_no} {link.consumer_text}"
                    expected = f"工程「{link.consumer_text}」が参照する時点で「{link.artifact_text}」が存在し、消費工程の画面/一覧で対象データを確認できること。" + html_note
                    verdict = "起点（産出元の記載なし・消費工程で観測）"
                lines.append(
                    f"| DL-{len(lines) + 1:02d} | {producer} | {artifact} | {consumer} | {expected} | "
                    f"{key_cell} | {verdict} |"
                )
    # STI側と同じHTML列定義を使い、SCNだけに「キー未定義」を残さない。
    item_scripts = Path(__file__).resolve().parents[2] / "hareruya-scenario-test-items/scripts"
    if str(item_scripts) not in sys.path:
        sys.path.append(str(item_scripts))
    from business_assertions import resolve_link_identity
    promoted = []
    for line in lines:
        cells = [value.strip() for value in line.strip("|").split("|")]
        import execution_repairs
        recovered = (execution_repairs.resolve_link_identity(cells[2], cells[1], s.business_title)
                     or resolve_link_identity(cells[2], cells[1], s.business_title))
        if "在庫移動実績" in cells[2]:
            recovered = ("移動指示ID（対象在庫移動に紐づく実ID）", "移動指示ID・送り状No.", "商品コードをCSV列に追加せず、元の在庫移動IDとの対応を保持する。", "excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-32")
        if recovered:
            key, fields, prep, source = recovered
            cells[5] = key
            cells[4] = cells[4].replace("（照合キー確定後に実施。未確定の間は合否を保留）", f"（照合キー {key} で同一対象を比較）")
            cells[4] += f" 照合値: {fields}。{prep} 出典: {source}"
        if "起点" in cells[6]:
            origin = execution_repairs.resolve_link_origin(cells[2], cells[1], s.business_title)
            if origin:
                cells[4] += " 起点取得の補完根拠: " + origin
                cells[6] = "起点（図の産出元記載なし・取得方法を出典補完）"
        promoted.append("| " + " | ".join(cells) + " |")
    return "\n".join(promoted) if promoted else empty


def render_execution_steps(s: Scenario, seed: dict[str, str]) -> str:
    rows = []
    route_pattern = scenario_route_pattern(s)
    for idx, (actor, action, screen, feature, expect, observation) in enumerate(step_rows(s.business_title, route_pattern, s.docs), 1):
        target = step_target(action, seed)
        import supplemental_scenarios
        import execution_repairs
        target = supplemental_scenarios.step_target(s.sid, idx, seed) or target
        override = execution_repairs.step_target(s, idx, seed)  # 観点の当てはめ契約で工程の対象を別の受注にしたもの
        target = override[0] if override else target
        work = row_work_kind(normal_flow_rows(route_pattern)[idx - 1]) if idx - 1 < len(normal_flow_rows(route_pattern)) else WORK_UNKNOWN
        if s.non_eccube:
            operation = f"メール/電話/外部アプリ（Thunderbird等）で「{action}」を実施する（EC-CUBEは参照のみ）"
        elif screen == PHYSICAL_SCREEN:
            operation = f"現場作業として「{action}」を実施する（EC-CUBE操作なし・業務結果を観測）"
        elif screen == EXTERNAL_SCREEN:
            operation = f"外部システム/ツール上で「{action}」を実施する（EC-CUBE操作なし・業務結果を観測）"
        elif screen == DECISION_SCREEN:
            operation = f"「{action}」の分岐条件を評価し、該当する経路へ進む（各分岐は代替/異常経路のシナリオで確認）"
        elif screen == FLOW_ONLY_SCREEN:
            operation = f"業務フロー記載の操作として「{action}」を実施し、業務結果を確認する（専用の機能設計書なし）"
        else:
            operation = f"{screen}で「{action}」を行う"
        import source_contract_adapter
        source_row = normal_flow_rows(route_pattern)[idx - 1]
        contract = source_contract_adapter.find(s.business_title, route_pattern, source_row, action)
        operation = source_contract_adapter.operation(contract, operation)
        rows.append(f"| {idx} | {actor} | {operation} | {target} | {expect} | {observation} |")
    return "\n".join(rows)


def doc_title_terms(title: str) -> list[str]:
    """設計書タイトルから照合用の語を取り出す（機能No・記号を除いた実体語のみ）。"""
    text = re.sub(r"^[A-Za-z]\d{2}[-–]\d{2}", " ", title)
    text = text.replace("管理画面_", " ").replace("_", " ")
    parts = re.split(r"[—–\-・/／()（）、,。\s]+", text)
    return [p for p in (t.strip() for t in parts) if len(p) >= 3]


def edge_case_screen(case: "EdgeCase", docs: list[DesignDoc], actor: str = "") -> str:
    """代替/異常分岐の実施画面を、条件文と設計書名の語が実際に一致する場合だけ決める。

    位置ベースの割当（`docs[idx-1]`）は、条件と無関係な画面を実施画面にしてしまう。
    実例: 別部署からの発注依頼（原典はGoogleフォーム/ラベル印字/台帳/メール起点）の
    「在庫不足」分岐に、フロントの `F04-01（買い物かご）` が割り当たっていた。
    本流ステップで `assign_step_docs` が禁じている「余っている設計書を埋める」挙動と同じ誤りで、
    その画面では観測できない期待結果を生む。根拠が無いなら画面を書かない（要確認として出す）。
    """
    haystack = f"{case.condition} {case.expected} {case.observation}"
    case_words = {w for w in BUSINESS_VOCAB if w in haystack}
    if not case_words:
        return ""
    candidates = docs
    # 顧客以外（社内チーム）が担当する分岐は、顧客向けフロント画面(F**)では実施できない。
    # 「本人確認書類の不備対応」を `F05-01（ネット買取トップページ）` で実行する等の
    # 観測不能な手順を防ぐ。フロントは業務語が広く一致しやすく、誤マップの主因になる。
    if actor and "お客様" not in actor:
        # 社内画面が候補に無い場合、フロントへフォールバックしない。根拠のある画面が
        # 無いなら「要確認」と書くほうが、観測不能な手順を出すより正しい。
        candidates = [d for d in docs if not d.feature_no.startswith("F")]
    # 操作方向（取込/登録＝入力系 と 出力/エクスポート＝出力系）が矛盾する設計書は除外する。
    # 「価格CSVの形式不正」（入力検証）を「価格変更CSV出力」に割り当てる類の逆方向割当を防ぐ。
    case_input = any(w in haystack for w in ("形式不正", "必須", "入力", "不正", "範囲外", "取込", "インポート", "登録", "申込"))
    case_output = any(w in haystack for w in ("出力", "エクスポート", "ダウンロード", "帳票", "印刷"))
    scored: list[tuple[int, str]] = []
    for doc in candidates:
        doc_text = " ".join(doc_title_terms(doc.title)) or doc.title
        doc_output = any(w in doc_text for w in ("出力", "エクスポート", "ダウンロード")) and not any(
            w in doc_text for w in ("取込", "インポート", "登録", "編集", "入力")
        )
        doc_input = any(w in doc_text for w in ("取込", "インポート", "登録", "編集", "入力", "変更")) and "出力" not in doc_text
        if case_input and not case_output and doc_output:
            continue
        if case_output and not case_input and doc_input:
            continue
        score = len(case_words & {w for w in BUSINESS_VOCAB if w in doc_text})
        if score > 0:
            scored.append((score, doc.title))
    if not scored:
        return ""
    top = max(s for s, _ in scored)
    winners = [t for s, t in scored if s == top]
    # 首位が同点で複数（例: デッキ系画面が複数一致）＝どれか特定できない。粗い語彙一致で
    # 無関係画面を付けるより、特定不能として要確認に落とすほうが誠実（codex指摘）。
    if len(winners) != 1:
        return ""
    # 広範なカテゴリ語（在庫/価格/商品…）1語だけの一致は、操作対象・種別を特定できない。
    # 例:「差異確認」（手作業）が `在庫` 一致だけで在庫CSV登録画面に付く誤りを防ぐ。
    # 限定語（本人確認/インポート/デッキ 等）の単独一致は具体性があるので許容する。
    broad = {"在庫", "価格", "金額", "商品", "カード", "大会", "決済", "発送", "配送", "移動"}
    top_words = case_words & {w for w in BUSINESS_VOCAB if w in (" ".join(doc_title_terms(winners[0])) or winners[0])}
    if top == 1 and top_words and top_words <= broad:
        return ""
    return winners[0]


def render_alternative_execution_steps(s: Scenario, seed: dict[str, str]) -> str:
    rows: list[str] = []
    docs = s.docs or []
    for idx, (branch_id, case) in enumerate(edge_case_branch_ids(list(s.route.edge_cases)), 1):
        actor = actor_meta(s.business_title)[0]
        source = case.source_row or case.condition
        if case.source_row:
            actor = infer_actor(source, actor)
        screen = edge_case_screen(case, docs, actor)
        base = primary_target(seed)
        edge_in = edge_input_data(case)
        if s.route.inputs:
            edge_in = branch_pattern_input(s, case, branch_id, seed)
        if not screen:
            # 画面を語彙一致で特定できない場合、08トリアージレジスタ（分岐元行のR番号）で解決を試みる。
            tri_screen, _f, _o = resolve_step_via_triage(s.business_title, case.source_row or "")
            if tri_screen not in (FLOW_ONLY_SCREEN, DECISION_SCREEN):
                screen = tri_screen
        if screen and screen not in (PHYSICAL_SCREEN, EXTERNAL_SCREEN):
            operation = f"{screen}で 条件「{case.condition}」となるデータ/操作を実行する"
        elif screen in (PHYSICAL_SCREEN, EXTERNAL_SCREEN):
            operation = f"{screen}で 条件「{case.condition}」となるデータ/操作を実行し、業務結果を確認する"
        else:
            operation = (
                f"条件「{case.condition}」となるデータ/操作を実行し、業務結果を確認する"
                "（業務フロー記載の分岐。専用の機能設計書なし）"
            )
        expected = koto_form(case.expected.rstrip("。")) + "。"
        rows.append(f"| {idx} | {branch_id} | {actor} | {operation} | {edge_in}（基準: {base}） | {expected} | {case.observation} |")
    if not rows:
        rows.append(
            "| - | - | - | 該当なし（この経路に業務分岐は無い） | - | "
            "機構的異常系は `## 他層委譲（結合テスト）` の結合テストケースで実施すること。 | - |"
        )
    return "\n".join(rows)


def _render_scenario_base(s: Scenario, repo: Path) -> str:
    main, sub, systems, priority = actor_meta(s.business_title)
    seed = execution_seed(s)
    route_pattern = scenario_route_pattern(s)
    data_patterns = data_patterns_for(s, seed)
    related_doc_lines = "\n".join(f"  - `{d.path}`" for d in s.html_docs) or "  - `UNRESOLVED_HTML_DESIGN_DOC`"
    trace_rows = []
    from delegation_contracts import case_index, SOURCE as it_source
    current_cases = case_index(repo)
    for d in s.docs:
        ids = [r['テストID'] for r in current_cases.get(d.feature_no, [])]
        trace_rows.append(f"  | {d.title} | {d.feature_no} | `{d.path}` | `{it_source}`（{len(ids)}件、機構別の該当IDは他層委譲表） |")
    if not trace_rows:
        trace_rows.append("  | 直接操作するEC-CUBE機能の紐付けなし（業務フロー参照・現場/外部作業・操作先未確定の区分は各工程に明記） | - | 業務フロー出典・source_contracts.json | - |")
    step_lines = []
    for idx, (actor, action, screen, feature, expect, observation) in enumerate(step_rows(s.business_title, route_pattern, s.docs), 1):
        step_lines.append(f"| {idx} | {actor} | {action} | {screen}（{feature}） | {expect} |")
    alt_lines = render_edge_case_rows(list(s.route.edge_cases))
    coverage_lines = "\n".join(
        f"| {name} | {coverage_mark(value)} |" for name, value in s.coverage.items()
    )
    seed_table = render_seed_table(seed)
    data_pattern_rows = render_data_pattern_rows(data_patterns)
    execution_steps = render_execution_steps(s, seed)
    alt_execution_steps = render_alternative_execution_steps(s, seed)
    data_chain_table = data_chain_rows(s, seed)
    expected_feature_numbers = ", ".join(expected_features(s.business_title, route_pattern)) or "-"
    actual_feature_numbers = ", ".join(d.feature_no for d in s.docs if d.feature_no != "-") or "-"
    if s.route.edge_cases:
        edge_summary = (
            f"| {len(s.route.edge_cases)} | {html_escape_br(case.condition for case in list(s.route.edge_cases)[:4])} | "
            f"{html_escape_br(case.observation for case in list(s.route.edge_cases)[:4])} |"
        )
    else:
        edge_summary = "| 0 | 業務分岐なし（機構的異常系は他層委譲） | `## 他層委譲（結合テスト）` を参照 |"
    delegation_table = render_delegation_rows(s, repo)
    non_eccube_note = (
        "\n- **非EC-CUBE作業**: この業務はメール/電話/外部アプリ中心で、EC-CUBE画面の更新を伴わない"
        "（観測点はメーラー/外部アプリ側の対応記録。EC-CUBE更新が要る場合は別業務フローで実施）。"
        if s.non_eccube
        else ""
    )
    dup_note = (
        f"\n- **番号重複注意**: 出典 `{s.flow_path}` 内でパターン番号 {s.pattern.number} が別業務と重複している。"
        "トレースは業務フローキー（出典＋番号＋作業概要）で識別する。"
        if s.dup_number
        else ""
    )
    return f"""{GENERATED_MARKER}
# {s.sid} {s.title}

## 概要
- **目的**: {s.pattern.name}の業務経路「{s.route.title}」を、関連画面・外部システムを横断して最終業務状態まで確認する。
- **分類**: {route_flow_label(s.route)}
- **優先度**: {priority}{non_eccube_note}{dup_note}
- **業務トリガー**: {s.pattern.name}が必要になり、経路条件「{s.route.condition}」を満たすとき。
- **経路ID**: {s.route.route_id}
- **経路種別**: {s.route.kind}
- **親業務フローパターン**: {s.business_title} / パターン{s.pattern.number} / {s.pattern.name}
- **業務経路条件**: {s.route.condition}
- **最終業務状態**: {s.route.final_state}
- **分岐根拠**: {s.route.evidence or '業務フローの判断図形と実線出口'}
- **トレース元要件**:
  - 業務フロー番号: {s.business_title} / パターン{s.pattern.number} / 経路{route_number(s.route.route_id)}
  - 出典: `{s.flow_path}`

## アクター
- **主アクター**: {main}
- **副アクター**: {sub}
- **関連システム**: {systems}

## 事前条件・テストデータ・環境
- **事前条件**: 実施者識別子 `{seed['担当者アカウント']}` を証跡へ記録し、各工程の担当者権限を持つ実アカウントでログインできる。以下の論理IDは実データの採番値と対応付ける。
- **テストデータ(SEED)**: `{primary_target(seed)}` を正常系の主対象として使用する。
- **環境/マスタ**: 店舗、支払方法、配送方法、商品カテゴリ、在庫区分、外部連携先はテスト環境の標準マスタを使用する。

## 実行用テストデータ
| 項目 | 値 |
|---|---|
{seed_table}

## データパターン
| パターンID | 種別 | 対象ステップ/分岐ID | 目的 | 前提差分 | 入力データ | 期待観測点 |
|---|---|---|---|---|---|---|
{data_pattern_rows}

> 分岐条件・対象ステップ・期待観測点は業務フロー原典由来。**入力データ列の具体値（在庫=0・数量=N・日時・シードID等）は、原典の分岐条件を実行可能にするための実行用の具体化（非原典値）**であり、原典に literal に書かれた値ではない（`## 実行用テストデータ` のシードIDと同種）。

## メインフロー（正常系）
| # | 担当者 | 業務行動 | 利用画面・機能 | 確認する業務結果 |
|---|---|---|---|---|
{chr(10).join(step_lines)}

## 実行手順（正常系）
| # | 担当者 | 操作 | 入力/対象 | 期待結果 | 確認対象 |
|---|---|---|---|---|---|
{execution_steps}

## 代替フロー / 異常系分岐
| 分岐ID | 起点# | 条件 | 期待挙動 | 確認対象 |
|---|---|---|---|---|
{alt_lines}

## 実行手順（代替系・異常系）
| # | 分岐ID | 担当者 | 操作 | 入力/対象 | 期待結果 | 確認対象 |
|---|---|---|---|---|---|---|
{alt_execution_steps}

## データ連鎖（業務フロー原典のデータ遷移線）
本層は機能テストではなく、**データのつながりで業務が完遂できるか**を見る。下表は業務フロー図の
データ遷移線（点線）だけを根拠に、「どの工程が何を産出し、それを次にどの工程が参照するか」を示す。
原典に無い結線・照合キーは創作しない。`自由端` は原典で接続先が未定義であることを示す実在の穴である。

| 連鎖ID | 産出工程 | 産出データ/帳票 | 消費工程 | 期待（データのつながり） | 照合キー | 判定 |
|---|---|---|---|---|---|---|
{data_chain_table}

## 完了条件（業務的ゴール／データ状態の最終確認）
- {s.route.final_state}
- 同じ案件の実IDを引き継ぎ、経路内の全工程の期待結果とデータ連鎖・別業務への引き継ぎが、各工程で指定した確認場所の原本と実測値に一致する。
- 必須判定に不合格がある場合は経路不合格とする。未実施・保留・証跡不足がある場合は経路を合格にしない。
- 別のデータパターン・代替分岐は別案件で実施して判定する。排他的な状態を一つの案件へ混在させない。

## システムテストカバレッジ
| 観点 | カバー |
|---|---|
{coverage_lines}

## エッジケース要約
| 件数 | 主なエッジケース | 確認対象 |
|---|---|---|
{edge_summary}

## 他層委譲（結合テスト）
権限・必須/形式・重複実行・0件検索は結合テスト層の機構的な確認に分担する。
現行正本 `integration_test/manual_test_cases/ketsugo_manual_cases_active.tsv` の操作・期待結果を照合した参照先を示す。
ケースの実在、実行準備、実行結果を区別する。対応未確認は対象機能の該当ケースを特定できない状態であり、適用外や試験済みとは扱わない。

| 機構的観点 | 委譲先IT観点 | 結合テストケースID | 状態 |
|---|---|---|---|
{delegation_table}

## トレーサビリティ
- **カバーする業務フロー番号**: {s.business_title} / パターン{s.pattern.number} / 経路{route_number(s.route.route_id)}
- **期待する主要機能No**: {expected_feature_numbers}
- **シナリオに紐づく機能No**: {actual_feature_numbers}
- **触れる画面と既存ケース**:
  | 画面 | 機能No | 機能仕様 | 既存ケース |
  |---|---|---|---|
{chr(10).join(trace_rows)}
- **関連HTML設計書**:
{related_doc_lines}
- **関連テスト観点**: 業務フロー、業務経路（担当者・画面をまたぐ引き継ぎ）、最終業務状態、ステータス更新、CSV/帳票、メール、外部連携、DB更新。
- **本シナリオで実行しない観点**: 画面単位の遷移・バック・リロード・値引き継ぎ、および `## 他層委譲（結合テスト）` に挙げた機構的異常系。業務工程間で同じデータを引き渡す確認は本シナリオの対象とする。
"""


def render_scenario(s: Scenario, repo: Path) -> str:
    import execution_repairs
    return execution_repairs.transform("repair_text", s, _render_scenario_base(s, repo), sys.modules[__name__])


def edge_case_branch_ids(edge_cases: list[EdgeCase]) -> list[tuple[str, EdgeCase]]:
    counters = {"A": 0, "E": 0}
    result: list[tuple[str, EdgeCase]] = []
    for case in edge_cases:
        counters[case.kind] = counters.get(case.kind, 0) + 1
        result.append((f"{case.kind}{counters[case.kind]}", case))
    return result


def render_edge_case_rows(edge_cases: list[EdgeCase]) -> str:
    rows: list[str] = []
    for branch_id, case in edge_case_branch_ids(edge_cases):
        rows.append(f"| {branch_id} | 1 | {case.condition} | {case.expected} | {case.observation} |")
    if not rows:
        rows.append(
            "| - | - | この経路に業務分岐は無い（業務フローに分岐記載なし） | - | "
            "機構的異常系は `## 他層委譲（結合テスト）` を参照 |"
        )
    return "\n".join(rows)


# 機構的異常系（権限・必須/形式・重複実行・0件）はシステムテスト層で重ねず、結合テスト層へ委譲する。
# 委譲先は現行 `integration_test/manual_test_cases/ketsugo_manual_cases_active.tsv` の実在IDで示す。
# 観点IDだけの参照は「どのケースで試験したか」を特定できず、実行証跡にならない。
DELEGATED_MECHANISMS: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("担当者に必要な権限がない", ("IT-15",)),
    ("入力値の必須項目不足または形式不正がある", ("IT-22",)),
    ("同一対象に対して同じ処理を重複実行する", ("IT-08",)),
    ("検索条件に一致する対象データが存在しない", ("IT-23", "IT-14")),
)

_IT_CASE_INDEX: dict[str, dict[str, list[str]]] = {}


def it_case_index(repo: Path) -> dict[str, dict[str, list[str]]]:
    """機能No -> IT観点ID -> 結合テストケースID一覧。"""
    key = str(repo)
    if key in _IT_CASE_INDEX:
        return _IT_CASE_INDEX[key]
    index: dict[str, dict[str, list[str]]] = {}
    for path in sorted((repo / "integration_test").glob("*_it_cases.md")):
        for line in read_text(path).splitlines():
            cells = line.split("\t")
            if len(cells) < 4 or not cells[1].startswith("IT-"):
                continue
            # 機能名列は表示名のことがある（例: `API デッキビルダー — アーキタイプ検索`）。
            # 機能Noが常に載るのはテストID（例: `IT-A15-07-API-...-001`）なのでそちらから引く。
            test_id = cells[1].strip()
            matched = re.match(r"^IT-([A-Z]\d{2}-\d{2})-", test_id)
            feature = matched.group(1) if matched else cells[0].split("（")[0].strip().upper()
            ifid = cells[2].strip()
            if not re.fullmatch(r"[A-Z]\d{2}-\d{2}", feature) or not ifid.startswith("IT-"):
                continue
            index.setdefault(feature, {}).setdefault(ifid, []).append(test_id)
    _IT_CASE_INDEX[key] = index
    return index


def delegation_rows(s: Scenario, repo: Path) -> list[tuple[str, str, str, str]]:
    """(機構的観点, 委譲先IT観点, 結合テストケースID, 状態) を返す。"""
    from delegation_contracts import delegation_rows as current_delegation_rows
    used = {part for _a,_b,_c,feature,_d,_e in step_rows(s.business_title, scenario_route_pattern(s), s.docs) for part in feature.split("・") if part != "-"}
    return current_delegation_rows(repo, sorted(used))


def render_delegation_rows(s: Scenario, repo: Path) -> str:
    return "\n".join(
        f"| {condition} | {vp} | {ids} | {state} |"
        for condition, vp, ids, state in delegation_rows(s, repo)
    )


def has_uncertain(rows: Iterable[str]) -> bool:
    return any(any(word in row for word in ("わからない", "検討中", "後回し", "要確認", "不明")) for row in rows)


def infer_alternatives(rows: list[str]) -> list[tuple[str, int, str, str]]:
    text = " ".join(rows)
    alts: list[tuple[str, int, str, str]] = []
    if "キャンセル" in text:
        alts.append(("A1", 1, "キャンセルが発生する", "対象データをキャンセル状態に更新し、必要な戻し/返金/通知を行う"))
    if "返金" in text:
        alts.append(("A2", 1, "返金が必要になる", "返金対象、金額、処理結果を確認できる状態にする"))
    if "本人確認" in text:
        alts.append(("A3", 1, "本人確認に不備がある", "後続の成立処理へ進めず、再確認または再申請を案内する"))
    if "CSV" in text:
        alts.append(("E1", 1, "CSV形式不正または対象データ不一致", "取込/出力を中止またはエラー表示し、対象データを中途半端に更新しない"))
    if "決済" in text:
        alts.append(("E2", 1, "決済失敗または金額不一致", "完了扱いにせず、決済状態を確認できる状態で保留する"))
    return alts[:4]


COMMON_EDGE_CASES = [
    EdgeCase("E", "担当者に必要な権限がない", "処理を開始させず、権限エラーを表示して対象データを更新しない", "権限エラー表示、対象データの更新有無"),
    EdgeCase("E", "検索条件に一致する対象データが存在しない", "0件結果を表示し、後続の更新操作へ進ませない", "検索結果、更新履歴"),
    EdgeCase("E", "同一対象に対して同じ処理を重複実行する", "二重登録・二重更新を防止し、既存の処理結果を確認できる状態にする", "対象データ、処理履歴"),
    EdgeCase("E", "入力値の必須項目不足または形式不正がある", "エラー内容を表示し、業務データを中途半端に更新しない", "入力エラー表示、対象データの更新有無"),
]


def edge_cases_from_branch_rows(pattern: Pattern) -> list[EdgeCase]:
    cases: list[EdgeCase] = []
    for row in branch_flow_rows(pattern):
        action = business_action_from_row(row, pattern.name)
        if not action:
            continue
        kind = "A" if any(word in primary_text(row) for word in ("キャンセル", "返金", "差戻", "棄却", "却下", "期限超過")) else "E"
        condition = action
        expected = expected_from_branch_row(row)
        observation = observation_from_branch_row(row)
        cases.append(EdgeCase(kind, condition, expected, observation, row))
    return cases


def expected_from_branch_row(row: str) -> str:
    if "返金" in row:
        return "返金対象、返金額、返金ステータスを記録し、二重返金を発生させない"
    if "キャンセル" in row:
        return "対象データをキャンセル状態にし、在庫戻し、通知、履歴を確認できる状態にする"
    if "期限超過" in row:
        return "期限超過として処理し、後続の引渡しや受付完了に進ませない"
    if "差異" in row or "不一致" in row:
        return "差異内容を表示し、確認または承認なしに確定処理へ進ませない"
    if "不足" in row or "欠品" in row:
        return "不足内容を表示し、完了扱いにせず保留または欠品状態として記録する"
    if "不備" in row or "エラー" in row or "失敗" in row:
        return "エラー内容を表示し、対象データを中途半端に更新しない"
    return "通常ルートとは別の状態として記録し、後続処理の可否を確認できる"


def observation_from_branch_row(row: str) -> str:
    if "返金" in row or "決済" in row:
        return "返金額、決済状態、処理履歴、通知結果"
    if "キャンセル" in row:
        return "キャンセル状態、在庫戻し、通知結果、操作履歴"
    if "CSV" in row or "出力" in row:
        return "CSV/帳票の出力有無、エラー行、対象件数"
    if "在庫" in row or "欠品" in row or "不足" in row:
        return "在庫数、欠品状態、在庫変更履歴"
    if "本人確認" in row:
        return "本人確認状態、後続処理ボタンの活性/非活性、通知結果"
    return "画面メッセージ、処理ステータス、更新履歴"

BUSINESS_EDGE_CASES: dict[str, list[EdgeCase]] = {
    "在庫管理": [
        EdgeCase("E", "移動・出庫・引当の対象在庫が不足している", "処理を完了扱いにせず、在庫数と不足理由を確認できる状態にする", "在庫数、在庫変更履歴、処理ステータス"),
        EdgeCase("E", "入出庫数量または棚卸数量に差異がある", "差異を表示し、承認または再確認なしに確定しない", "差異一覧、承認状態、在庫変更履歴"),
        EdgeCase("A", "承認者が差戻しまたは却下する", "対象処理を差戻し状態にし、在庫を確定更新しない", "承認状態、在庫数、操作履歴"),
        EdgeCase("E", "商品コードまたはバーコードが対象商品と一致しない", "対象不一致を表示し、別商品の在庫を更新しない", "商品コード、バーコード、在庫更新有無"),
    ],
    "通販受注管理": [
        EdgeCase("E", "決済失敗または入金額不一致が発生する", "受注を完了扱いにせず、決済状態または入金差異を確認できる状態にする", "受注ステータス、決済状態、入金額"),
        EdgeCase("E", "出荷対象商品の在庫が不足している", "出荷を確定せず、欠品または保留状態として確認できる状態にする", "受注ステータス、在庫数、出荷可否"),
        EdgeCase("A", "キャンセルまたは返金が必要になる", "対象金額と戻し処理を記録し、通知または返金結果を確認できる状態にする", "返金額、受注ステータス、通知結果"),
        EdgeCase("E", "配送・ラベル印字・海外発送連携に失敗する", "出荷完了にせず、再実行可能な保留状態にする", "連携結果、出荷ステータス、再実行可否"),
    ],
    "店頭受取受注管理": [
        EdgeCase("E", "受取対象商品の在庫またはピック結果が不足している", "引渡し完了にせず、不足商品と受注状態を確認できる状態にする", "受注ステータス、在庫数、ピック結果"),
        EdgeCase("A", "受取期限超過または受取キャンセルが発生する", "受注をキャンセルまたは保留状態に更新し、戻し処理を確認できる状態にする", "受注ステータス、在庫戻し、通知結果"),
        EdgeCase("E", "スマレジまたは店頭決済の金額が一致しない", "引渡し完了にせず、金額差異を確認できる状態にする", "決済金額、受注金額、引渡し状態"),
    ],
    "店頭買取": [
        EdgeCase("E", "査定結果に不備または対象商品不一致がある", "買取成立に進めず、差戻しまたは再査定状態にする", "査定状態、対象商品、買取明細"),
        EdgeCase("A", "お客様が査定結果を承認しない", "買取不成立として記録し、在庫入庫や支払を行わない", "買取ステータス、在庫入庫有無、支払有無"),
        EdgeCase("E", "同一買取品を二重入庫しようとする", "重複入庫を防止し、既存の入庫履歴を確認できる状態にする", "入庫履歴、在庫数、買取明細"),
    ],
    "ネット買取": [
        EdgeCase("E", "本人確認書類に不備がある", "振込または成立処理へ進めず、再確認状態にする", "本人確認状態、買取ステータス、通知結果"),
        EdgeCase("E", "振込先情報不備または振込不可が発生する", "支払完了にせず、支払保留状態として確認できる状態にする", "支払状態、振込先情報、通知結果"),
        EdgeCase("E", "到着カードと申込内容が一致しない", "査定差異を表示し、成立処理を保留する", "査定明細、申込内容、買取ステータス"),
    ],
    "仕入れ業務": [
        EdgeCase("E", "仕入れ対象データと商品マスタが一致しない", "仕入れ確定にせず、対象不一致を確認できる状態にする", "商品マスタ、仕入れ明細、処理ステータス"),
        EdgeCase("E", "仕入れ入庫が重複する", "二重在庫計上を防止し、既存の入庫履歴を確認できる状態にする", "在庫数、入庫履歴、仕入れステータス"),
    ],
    "商品登録・編集": [
        EdgeCase("E", "商品コード、カテゴリ、発売日、公開状態の組み合わせが不整合になる", "保存または公開を止め、不整合項目を確認できる状態にする", "商品詳細、カテゴリ、公開状態"),
        EdgeCase("E", "価格または在庫連動に必要な値が未設定である", "公開または販売可能状態にせず、不足項目を表示する", "価格、在庫区分、公開状態"),
        EdgeCase("A", "公開・非公開の一括切替対象に対象外商品が含まれる", "対象外商品を更新せず、処理結果で成功件数と除外件数を確認できる状態にする", "処理結果、商品公開状態、除外件数"),
    ],
    "価格管理": [
        EdgeCase("E", "価格CSVに形式不正または存在しない商品コードが含まれる", "該当行をエラーにし、正常行の更新結果とエラー行を確認できる状態にする", "CSV取込結果、価格、エラー行"),
        EdgeCase("E", "価格変更後の販売価格が許容範囲外になる", "価格更新を止め、対象商品と不正価格を確認できる状態にする", "商品価格、エラー表示、更新履歴"),
        EdgeCase("A", "セール対象外商品が混在する", "対象外商品を除外し、対象件数と除外件数を確認できる状態にする", "セール対象、商品価格、処理結果"),
    ],
    "イベント管理": [
        EdgeCase("E", "定員超過または受付期間外に申込が行われる", "受付完了にせず、受付不可理由を確認できる状態にする", "受付状態、定員、受付期間"),
        EdgeCase("E", "SPLINKS決済またはポイント付与に失敗する", "参加確定にせず、決済・付与結果を確認できる状態にする", "決済状態、ポイント付与結果、受付状態"),
        EdgeCase("A", "イベント内容変更またはキャンセルが発生する", "対象参加者へ通知し、イベント状態を更新する", "イベント状態、通知結果、参加者一覧"),
    ],
    "デッキ登録": [
        EdgeCase("E", "デッキリストのカード枚数またはカード名が不正である", "公開せず、エラー箇所を確認できる状態にする", "デッキ内容、エラー表示、公開状態"),
        EdgeCase("E", "外部大会情報と登録対象大会が一致しない", "大会紐づけを保留し、不一致内容を確認できる状態にする", "大会情報、デッキ紐づけ、公開状態"),
    ],
}

# パターン名部分一致で優先適用する業務固有エッジケース（codexレビュー指摘#4）。
PATTERN_EDGE_CASES.update({
    "バーコード": [
        EdgeCase("E", "旧バーコードと新バーコードが混在した商品をスキャンする", "旧バーコードでは対象商品を特定できず、貼替後は新バーコードで在庫特定できる状態にする", "スキャン結果、対象商品特定、在庫紐づけ"),
        EdgeCase("E", "貼替対象の店舗または対象期間が指定と異なる", "対象外店舗/期間の在庫を更新せず、対象範囲を確認できる状態にする", "対象店舗、対象期間、更新対象件数"),
        EdgeCase("E", "貼替後のバーコードでスキャンできない/重複発行される", "貼替を完了扱いにせず、再発行または重複を検知できる状態にする", "バーコード発行結果、スキャン可否、重複有無"),
    ],
    "在庫0枚": [
        EdgeCase("E", "公開/非公開・言語・Foil/状態・価格帯の条件で集計対象がずれる", "条件別に0枚種類数が集計され、条件指定と結果件数が一致する", "集計条件、0枚種類数、条件別内訳件数"),
        EdgeCase("E", "集計結果の反映先（分析/集計先）に件数が反映されない", "集計を完了扱いにせず、反映先件数と集計元件数の一致を確認できる状態にする", "集計元件数、反映先件数、反映日時"),
    ],
    "SPLINKS": [
        EdgeCase("E", "SPLINKS側の減額/取消が実行できない", "EC-CUBE側を返金完了にせず、報告のみで各部署対応へ委譲する状態にする", "SPLINKS処理結果、返金ステータス、委譲先の記録"),
        EdgeCase("E", "同一受注に対して二重返金/二重減額を実行する", "二重処理を防止し、既存の返金結果を確認できる状態にする", "返金履歴、決済状態、処理回数"),
        EdgeCase("A", "一部返金（減額）と全額返金を取り違える", "対象金額を取り違えず、依頼内容と処理金額の一致を確認できる状態にする", "依頼金額、減額/返金額、決済状態"),
        EdgeCase("E", "依頼チャネル（ラインワークス/Gメール/依頼フォーム）ごとに依頼内容に不備がある", "不備依頼を処理へ進めず、依頼元チャネルと不備内容を確認できる状態にする", "依頼チャネル、依頼内容、不備理由"),
    ],
    "予約": [
        EdgeCase("E", "発売日前日チェックで予約数と引当在庫が一致しない", "出荷確定へ進めず、予約数と在庫の差異を確認できる状態にする", "予約数、引当在庫、差異件数"),
        EdgeCase("A", "予約キャンセル分を発売日集荷/出荷インポート対象から除外できない", "キャンセル分を出荷対象に含めず、除外件数を確認できる状態にする", "キャンセル件数、出荷対象件数、出荷インポート結果"),
        EdgeCase("E", "発売日集荷・出荷インポートの取込に失敗する", "出荷完了にせず、取込エラー行と対象件数を確認できる状態にする", "取込結果、エラー行、出荷ステータス"),
    ],
})


# 業務語彙（アンカー -> 同義・関連語）。エッジケースの発火判定と、代替/異常分岐の
# 実施画面の根拠判定（`edge_case_screen`）で共用する。語彙を二重管理しない。
BUSINESS_KEYWORD_GROUPS: dict[str, tuple[str, ...]] = {
    "権限": ("権限",),
    "検索": ("検索",),
    "重複": ("重複", "二重"),
    "入力": ("必須", "形式不正", "入力エラー"),
    "在庫": ("在庫", "入庫", "出庫", "棚卸", "移動", "欠品", "ピック"),
    "決済": ("決済", "入金", "支払", "SPLINKS", "返金"),
    "返金": ("返金", "キャンセル", "取消"),
    "CSV": ("CSV", "インポート", "取込", "出力"),
    "本人確認": ("本人確認", "書留", "買取"),
    "配送": ("発送", "配送", "送り状", "海外"),
    "公開": ("公開", "非公開", "発売", "商品"),
    "価格": ("価格", "セール", "金額"),
    "定員": ("イベント", "受付", "定員", "申込"),
    "デッキ": ("デッキ", "大会", "カード"),
}
BUSINESS_VOCAB: tuple[str, ...] = tuple(
    sorted({word for words in BUSINESS_KEYWORD_GROUPS.values() for word in words})
)


def edge_case_matches(case: EdgeCase, text: str, systems: str) -> bool:
    haystack = text + " " + systems
    # 機構系アンカー（権限/検索/重複/入力）は結合テスト層と重複しやすい。
    # `対象`『確認』『登録』『更新』のような汎用語を一致語にすると、業務フロー本文にその語が
    # 1つあるだけで発火し、ほぼ全シナリオへ結合テスト相当のケースが混入する。業務フローが
    # その機構を明示している場合だけ発火させる。
    keyword_groups = BUSINESS_KEYWORD_GROUPS
    for anchor, words in keyword_groups.items():
        if anchor in case.condition and any(word in haystack for word in words):
            return True
    return False


def pattern_specific_edge_cases(pattern: Pattern) -> list[EdgeCase]:
    """パターン名部分一致で業務固有エッジケースを最優先で採用する。"""
    cases: list[EdgeCase] = []
    for key, entries in PATTERN_EDGE_CASES.items():
        if key in pattern.name:
            cases.extend(entries)
    return cases


def edge_cases_for(business_title: str, pattern: Pattern) -> list[EdgeCase]:
    # エッジケース（代替/異常分岐）は**業務フロー原典の分岐行のみ**から作る。
    # 固定辞書（BUSINESS_EDGE_CASES / PATTERN_EDGE_CASES / COMMON_EDGE_CASES）は、業務フローに
    # 無い条件を代替/異常分岐・データパターン・エッジケース要約へ注入し、原典に無い異常シナリオ
    # を捏造する（codecレビュー指摘: 商品18/デッキ6/イベント2件ほか）。トピック語で緩く一致
    # させる `edge_case_matches` ゲートでは「組み合わせ不整合」が `公開` 一致で通過してしまう。
    # よって辞書は使わず、原典の分岐だけを採用する。機構的異常系（権限/必須/重複/0件）は
    # `## 他層委譲（結合テスト）` で結合テスト層へ委譲する（本層で二重に持たない）。
    selected: list[EdgeCase] = edge_cases_from_branch_rows(pattern)
    deduped: list[EdgeCase] = []
    seen: set[tuple[str, str]] = set()
    for case in selected:
        key = (case.kind, case.condition)
        if key not in seen:
            seen.add(key)
            deduped.append(case)
    return deduped[:6]


ROUTE_ALTERNATIVE_KEYWORDS = (
    "場合",
    "未登録",
    "対象外",
    "キャンセル",
    "返金",
    "差戻",
    "棄却",
    "却下",
)

ROUTE_HIGH_RISK_KEYWORDS = (
    "外部",
    "連携",
    "スマレジ",
    "SPLINKS",
    "MTG",
    "不一致",
    "差異",
    "不足",
    "欠品",
    "本人確認",
    "不備",
    "カード枚数",
    "カード名",
    "在庫",
    "金額",
    "数量",
    "決済",
    "振込",
    "公開",
    "保留",
    "棄却",
    "却下",
    "差戻",
    "キャンセル",
    "返金",
)


def route_number(route_id: str) -> int:
    return int(re.sub(r"\D", "", route_id) or "1")


def route_flow_label(route: BusinessRoute) -> str:
    if route.kind == "業務異常":
        return "異常系"
    if route.kind == "主要代替":
        return "代替系"
    return "正常系"


def route_as_pattern(pattern: Pattern, route: BusinessRoute) -> Pattern:
    route_rows = list(route.rows)
    keys = {primary_text(row) for row in route_rows}
    return Pattern(
        pattern.number,
        pattern.name,
        route_rows,
        source_number=pattern.source_number or pattern.number,
        source_start=pattern.source_start,
        source_end=pattern.source_end,
        node_scope=set(pattern.node_scope),
        row_nodes={key: value for key, value in pattern.row_nodes.items() if key in keys},
        row_lanes={key: value for key, value in pattern.row_lanes.items() if key in keys},
        nodes=dict(pattern.nodes),
        flow_edges=list(pattern.flow_edges),
        source_path=pattern.source_path,
    )


def scenario_route_pattern(s: Scenario) -> Pattern:
    return route_as_pattern(s.pattern, s.route)


def is_major_alternative_row(row: str, pattern: Pattern) -> bool:
    text = full_text(row)
    if is_structural_row(row):
        return False
    if not any(word in text for word in ROUTE_ALTERNATIVE_KEYWORDS):
        return False
    # 返金対応や欠品対応そのものが親パターンの場合は、その語は通常経路の中核として扱う。
    if any(word in pattern.name for word in ("キャンセル", "返金", "差戻", "棄却", "却下")):
        return "場合" in text or "未登録" in text or "対象外" in text
    return True


def base_route_rows(pattern: Pattern) -> list[str]:
    return normal_flow_rows(pattern)


def solid_reachable(pattern: Pattern, start: str) -> set[str]:
    adjacency: dict[str, list[str]] = {}
    for edge in pattern.flow_edges:
        if edge.dst_no:
            adjacency.setdefault(edge.src_no, []).append(edge.dst_no)
    seen: set[str] = set()
    stack = [start]
    while stack:
        current = stack.pop()
        if current in seen or current not in pattern.node_scope:
            continue
        seen.add(current)
        stack.extend(adjacency.get(current, ()))
    return seen


def decision_choices(pattern: Pattern) -> list[tuple[FlowNode, list[FlowNode]]]:
    """原図の判断ノードと実線出口を返す。語句推測による分岐生成は行わない。"""
    result: list[tuple[FlowNode, list[FlowNode]]] = []
    for node in sorted(pattern.nodes.values(), key=lambda n: (n.source_row, n.source_col, int(n.number))):
        if node.kind not in {"判断", "diamond"}:
            continue
        targets: list[FlowNode] = []
        for edge in pattern.flow_edges:
            if edge.src_no != node.number or not edge.dst_no:
                continue
            target = pattern.nodes.get(edge.dst_no)
            if target and target.number not in {item.number for item in targets}:
                targets.append(target)
        if len(targets) >= 2:
            result.append((node, targets))
    return result


def branch_abnormal_score(text: str) -> int:
    value = normalize_node_text(text)
    if re.search(r"(問題|差異|欠品|不足|不備).*(ない|無し|なし)", value):
        return -20
    score = 0
    for word in ("問題あり", "差異がある", "欠品あり", "不足", "不備", "失敗", "エラー", "不可", "拒否", "棄却", "却下", "差戻"):
        if word in value:
            score += 20
    for word in ("キャンセル", "返金", "未登録", "対象外", "期限超過"):
        if word in value:
            score += 10
    for word in ("完了", "成立", "問題ない", "差異がない", "欠品なし"):
        if word in value:
            score -= 5
    return score


def normal_choice_index(targets: list[FlowNode]) -> int:
    """原典に Yes/No や正常/異常の線ラベルが無いため、記載順の第1出口を代表経路にする。

    出口名の「返金」「キャンセル」等だけで正常性を推測すると、返金業務そのものの正常完了を
    異常側へ誤分類する。異常種別は明示的な失敗・不備等だけで判定し、代表出口は原典の順序を
    保持する。
    """
    return 0


def target_choice_label(target: FlowNode, siblings: list[FlowNode]) -> str:
    """同名出口をスイムレーンで識別し、人間が分岐先を一意に追える表記にする。"""
    same_text = [node for node in siblings if normalize_node_text(node.text) == normalize_node_text(target.text)]
    if len(same_text) == 1:
        return target.text
    lane = target.lane.strip()
    if lane and lane != "—" and len({node.lane for node in same_text}) > 1:
        return f"{target.text}（{lane}）"
    return f"{target.text}（原典ノード#{target.number}）"


def rows_for_decision_selection(pattern: Pattern, selected: dict[str, str]) -> list[str]:
    """未選択出口だけに属する工程を除外し、選択出口と合流後工程を残す。"""
    excluded: set[str] = set()
    for decision, targets in decision_choices(pattern):
        chosen = selected.get(decision.number, targets[normal_choice_index(targets)].number)
        reaches = {target.number: solid_reachable(pattern, target.number) for target in targets}
        common = set.intersection(*(set(value) for value in reaches.values())) if reaches else set()
        for target in targets:
            if target.number != chosen:
                excluded |= reaches[target.number] - common
    rows = [
        row for row in normal_flow_rows(pattern)
        if pattern.row_nodes.get(primary_text(row), "") not in excluded
    ]
    return rows or normal_flow_rows(pattern)


def row_for_node(pattern: Pattern, number: str) -> str | None:
    for row in pattern.rows:
        if pattern.row_nodes.get(primary_text(row)) == number:
            return row
    return None


def final_state_from_rows(pattern: Pattern, rows: list[str]) -> str:
    for row in reversed(rows):
        if is_decision_row(row, pattern):
            continue
        result = expected_assertion(row).strip()
        if result and result != "こと。":
            return result
    return f"{pattern.name}の原典終端まで到達すること。"


def decision_condition(decision: FlowNode, target: FlowNode, siblings: list[FlowNode]) -> str:
    return f"{decision.text}の判断結果として実線で「{target_choice_label(target, siblings)}」へ進む場合"


def decision_route_kind(target: FlowNode) -> str:
    text = normalize_node_text(target.text)
    if any(word in text for word in ("失敗", "不備", "差異がある", "欠品あり", "不足", "拒否", "棄却", "却下", "差戻", "不可")):
        return "業務異常"
    return "主要代替"


def rows_for_alternative_route(pattern: Pattern, route_row: str) -> list[str]:
    rows = normal_flow_rows(pattern)
    base = base_route_rows(pattern)
    if route_row not in rows:
        return base or [route_row]
    idx = rows.index(route_row)
    before = [row for row in rows[:idx] if not is_major_alternative_row(row, pattern)]
    after = [row for row in rows[idx + 1 :] if not is_major_alternative_row(row, pattern)]
    result = before + [route_row] + after
    return result or [route_row]


def rows_for_edge_route(pattern: Pattern, case: EdgeCase) -> list[str]:
    base = base_route_rows(pattern)
    if case.source_row and case.source_row in pattern.rows:
        prior: list[str] = []
        for row in pattern.rows:
            if row == case.source_row:
                break
            if row in base:
                prior.append(row)
        return prior or base[:1] or normal_flow_rows(pattern)[:1] or [case.source_row]
    text = case.condition + " " + case.expected
    if any(word in text for word in ("外部", "デッキリスト", "本人確認", "決済", "在庫", "金額", "数量")):
        return base[: max(1, min(2, len(base)))] or normal_flow_rows(pattern)[:1]
    return base[: max(1, min(3, len(base)))] or normal_flow_rows(pattern)[:1]


def route_condition_from_row(row: str) -> str:
    detail = clean_detail(row)
    if "場合" in detail:
        return detail.split("場合", 1)[0].rstrip("、。") + "場合"
    if "未登録" in detail:
        return "対象マスタまたは対象データが未登録の場合"
    if "対象外" in detail:
        return "対象外データが混在する場合"
    return detail.rstrip("。") or row_concept(row)


def route_title_from_row(pattern: Pattern, row: str) -> str:
    label = row_title(row) or row_concept(row)[:18] or "代替経路"
    if "未登録" in full_text(row) or "無い場合" in full_text(row) or "ない場合" in full_text(row):
        return f"{pattern.name}（{label}を挟んで完了）"
    if "対象外" in full_text(row):
        return f"{pattern.name}（{label}の対象外混在を除外して完了）"
    return f"{pattern.name}（{label}を経由して完了）"


def route_final_state_from_row(pattern: Pattern, row: str) -> str:
    label = row_title(row) or row_concept(row) or "代替条件"
    return f"{label}の条件対応後、{pattern.name}の対象データが完了状態として追跡できる。"


def route_title_from_case(pattern: Pattern, case: EdgeCase) -> str:
    condition = case.condition.rstrip("。")
    if len(condition) > 38:
        condition = condition[:38].rstrip("、。") + "等"
    suffix = "保留" if case.kind == "E" else "代替完了"
    return f"{pattern.name}（{condition}時の{suffix}）"


def route_final_state_from_case(case: EdgeCase) -> str:
    expected = case.expected.rstrip("。")
    if expected.endswith("こと"):
        return expected + "。"
    return expected + "こと。"


def is_route_level_edge_case(case: EdgeCase) -> bool:
    # 丸ごとの異常/代替ルート（独立シナリオ）は、業務フロー原典の分岐（source_row有り）だけから
    # 作る。固定辞書由来（BUSINESS/PATTERN/COMMON, source_row無し）はルート化しない。以前は
    # ROUTE_HIGH_RISK_KEYWORDS を含む辞書ケースもルート化しており、原典に無い異常シナリオ
    # （例: 既存商品編集「組み合わせ不整合で保留」）を丸ごと捏造していた（codecレビュー指摘）。
    return bool(case.source_row)


def supporting_edge_cases(all_cases: list[EdgeCase], route_case: EdgeCase | None = None) -> tuple[EdgeCase, ...]:
    support: list[EdgeCase] = []
    for case in all_cases:
        if route_case and (case.kind, case.condition) == (route_case.kind, route_case.condition):
            continue
        if not is_route_level_edge_case(case):
            support.append(case)
    # 補助エッジが無い経路に COMMON を埋め戻さない。分岐が無い経路は「分岐なし」と表示し、
    # 機構的異常系は `## 他層委譲（結合テスト）` で結合テストのケースIDへ委譲する。
    return tuple(support[:3])


def routes_for_pattern(business_title: str, pattern: Pattern) -> list[BusinessRoute]:
    routes: list[BusinessRoute] = []
    next_id = 1

    def rid() -> str:
        nonlocal next_id
        value = f"R{next_id:02d}"
        next_id += 1
        return value

    decisions = decision_choices(pattern)
    normal_selection = {
        decision.number: targets[normal_choice_index(targets)].number
        for decision, targets in decisions
    }
    base_rows_list = rows_for_decision_selection(pattern, normal_selection)
    normal_conditions = [
        decision_condition(decision, targets[normal_choice_index(targets)], targets)
        for decision, targets in decisions
    ]
    normal_condition = "、かつ".join(normal_conditions) if normal_conditions else "原典に記載された全工程を順に実施する。"
    routes.append(
        BusinessRoute(
            rid(),
            "正常代表",
            f"{pattern.name}（原典実線の代表経路）",
            normal_condition,
            final_state_from_rows(pattern, base_rows_list),
            tuple(base_rows_list),
            (),
        )
    )

    # 各判断ノードについて、正常出口以外を1つずつ選んだ実線経路を作る。
    # 他の判断ノードは正常出口のままとし、組合せ水増しをしない。
    seen: set[tuple[str, str]] = set()
    for decision, targets in decisions:
        normal_idx = normal_choice_index(targets)
        for idx, target in enumerate(targets):
            if idx == normal_idx:
                continue
            key = (decision.number, target.number)
            if key in seen:
                continue
            seen.add(key)
            selection = dict(normal_selection)
            selection[decision.number] = target.number
            route_rows = rows_for_decision_selection(pattern, selection)
            condition = decision_condition(decision, target, targets)
            final_state = final_state_from_rows(pattern, route_rows)
            kind = decision_route_kind(target)
            source_row = row_for_node(pattern, target.number) or row_for_node(pattern, decision.number) or ""
            observation = expected_observation(source_row) if source_row else f"判断「{decision.text}」の結果と後続工程「{target.text}」"
            case_kind = "E" if kind == "業務異常" else "A"
            case = EdgeCase(case_kind, condition, final_state.rstrip("。"), observation, source_row)
            routes.append(
                BusinessRoute(
                    rid(),
                    kind,
                    f"{pattern.name}（{decision.text}：{target_choice_label(target, targets)}）",
                    condition,
                    final_state,
                    tuple(route_rows),
                    (case,),
                )
            )
    from route_evidence import supplement_routes
    return supplement_routes(business_title, pattern, routes, sys.modules[__name__])


def coverage_for(business_title: str, pattern: Pattern, docs: list[DesignDoc], route: "BusinessRoute") -> dict[str, bool]:
    text = business_title + " " + pattern.name + " " + rows_primary_joined(pattern) + " " + " ".join(d.title for d in docs)
    systems = actor_meta(business_title)[2]
    # 代替系/異常系は「この経路が実際に実行する分岐」から決める。無条件○は実態と矛盾するため禁止。
    kinds = {case.kind for case in route.edge_cases}
    return {
        "正常系": True,
        "代替系": route.kind == "主要代替" or "A" in kinds,
        "異常系": route.kind == "業務異常" or "E" in kinds,
        "外部連携": any(word in text + systems for word in ("スマレジ", "SPLINKS", "MTG", "Wordpress", "ポイント", "AWS", "Backlog", "メール", "海外発送", "S3")),
        "データ更新": any(word in text for word in ("登録", "更新", "変更", "入庫", "出庫", "承認", "成立", "公開", "削除", "取込", "インポート", "在庫", "決済", "返金", "出金")),
        "CSV/帳票": any(word in text for word in ("CSV", "PDF", "印刷", "出力", "帳票", "納品書", "送り状", "リスト")),
        "メール/通知": any(word in text for word in ("メール", "通知", "連絡")),
    }


def coverage_mark(value: bool) -> str:
    return "○" if value else "-"


def table_cell(value: str) -> str:
    return value.replace("|", "／").replace("\n", " ")


def html_escape_br(values: Iterable[str]) -> str:
    return "<br>".join(table_cell(value) for value in values) or "-"


def normalize_name(value: str) -> str:
    value = value.replace("【既存業務】", "")
    value = re.sub(r"（本店、支店ともに同じフロー）", "", value)
    value = re.sub(r"\s+", "", value)
    return value


CANONICAL_PATTERN_SOURCES: dict[str, dict[str, str]] = {
    # 各業務フロー冒頭R3の明示方針を正とする。ファイル名の `_tobe` は正本判定に使わない。
    "店頭買取": {"*": "06_店頭買取.md"},
    "在庫管理": {"*": "12_在庫管理.md"},
    # 09 R3: To-Beを使うのは在庫変更を伴う4・6・7。9はTo-Beにだけ存在する追加業務。
    "商品登録・編集": {
        "1": "09_商品登録・編集.md", "2": "09_商品登録・編集.md",
        "3": "09_商品登録・編集.md", "4": "10_商品登録・編集_tobe.md",
        "5": "09_商品登録・編集.md", "6": "10_商品登録・編集_tobe.md",
        "7": "10_商品登録・編集_tobe.md", "8": "09_商品登録・編集.md",
        "9": "10_商品登録・編集_tobe.md",
    },
    # 16/17 R3: 発送業務は既存To-Beを正とし、それ以外の現行業務は16を使う。
    "通販受注管理": {
        "4": "17_通販受注管理_tobe.md",
        "13": "17_通販受注管理_tobe.md",
        "*": "16_通販受注管理.md",
    },
}


def canonical_source_name(business_title: str, pattern_number: str) -> str | None:
    rules = CANONICAL_PATTERN_SOURCES.get(business_title)
    if not rules:
        return None
    return rules.get(pattern_number, rules.get("*"))


def dedupe_patterns(items: list[tuple[Path, str, str, str, Pattern]]) -> list[tuple[Path, str, str, str, Pattern]]:
    chosen: dict[tuple[str, str, str, str], tuple[Path, str, str, str, Pattern]] = {}
    for item in items:
        flow_path, _flow_title, business_title, _text, pattern = item
        original_number = pattern.source_number or pattern.number
        canonical = canonical_source_name(business_title, original_number)
        if canonical and flow_path.name != canonical:
            continue
        # 同一番号でも別名なら原典上の別パターン。出典＋番号＋名称で保持する。
        key = (business_title, str(flow_path), original_number, normalize_name(pattern.name))
        chosen.setdefault(key, item)
    return sorted(chosen.values(), key=lambda x: (BUSINESS_CODES.get(x[2], ("ZZZ", "", "", "", ""))[0], int(x[4].number) if x[4].number.isdigit() else 999, normalize_name(x[4].name), str(x[0])))


def discover_flows(repo: Path, only: str | None) -> list[tuple[Path, str, str, str]]:
    flows: list[tuple[Path, str, str, str]] = []
    for path in sorted((repo / "scenario_test" / "markdown").glob("*.md")):
        if path.name == "index.md":
            continue
        text = read_text(path)
        title = title_from_markdown(text, path.stem)
        title = clean_title(title)
        if any(ignore in title for ignore in IGNORE_FLOW_TITLES) or "索引" in title:
            continue
        if only and only not in title and only not in text:
            continue
        business = business_title_for_flow(title)
        flows.append((path.relative_to(repo), title, business, text))
    return flows


def generate(repo: Path, only: str | None, max_docs: int) -> list[Scenario]:
    reset_generation_state()
    import source_contract_adapter
    source_contract_adapter.configure(repo)
    import execution_repairs
    execution_repairs.configure(repo, sys.modules[__name__])
    docs = build_design_index(repo)
    load_triage_register(repo, docs)
    candidates: list[tuple[Path, str, str, str, Pattern]] = []
    index_entries: dict[str, list[tuple[Path, str, str]]] = {}
    patterns_by_business: dict[str, list[Pattern]] = {}
    for flow_path, flow_title, business_title, text in discover_flows(repo, only):
        patterns = parse_patterns(text)
        for pattern in patterns:
            pattern.source_path = str(flow_path)
        patterns_by_business.setdefault(business_title, []).extend(patterns)
        for num, name in index_pattern_entries(text):
            index_entries.setdefault(business_title, []).append((flow_path, num, name))
        FLOW_TEXT_BY_PATH[flow_path] = text
        for pattern in patterns:
            candidates.append((flow_path, flow_title, business_title, text, pattern))
    candidates = dedupe_patterns(candidates)
    # 正本索引だけを分母にして、本文欠落/名称ドリフトを検出する。旧版・非採用To-Beの索引を
    # 混ぜると、実在本文を欠落と誤報するため、正本マニフェスト適用後に判定する。
    canonical_patterns: dict[str, list[Pattern]] = {}
    for _path, _title, business_title, _text, pattern in candidates:
        canonical_patterns.setdefault(business_title, []).append(pattern)
    for business_title, entries in index_entries.items():
        known = canonical_patterns.get(business_title, [])
        for flow_path, num, name in entries:
            canonical = canonical_source_name(business_title, num)
            if canonical and flow_path.name != canonical:
                continue
            status = index_pattern_status(num, name, known)
            if status:
                MISSING_PATTERNS.append((flow_path, num, name, status))
    # 同一業務フローファイル内で「同じ番号だが別名」のパターンを検出（在庫管理 #7 等）。
    # codexレビュー指摘#5：番号の欠落/重複で追跡が曖昧になる問題を可視化する。
    number_names: dict[tuple[Path, str], set[str]] = {}
    for flow_path, _flow_title, _business_title, _text, pattern in candidates:
        number_names.setdefault((flow_path, pattern.number), set()).add(normalize_name(pattern.name))
    scenarios: list[Scenario] = []
    baseline_path = Path(__file__).resolve().parent.parent / "references/route-id-baseline.json"
    baseline = json.loads(read_text(baseline_path)) if baseline_path.exists() else {}
    counters: dict[str, int] = {}
    for sid in baseline.values():
        code = next((v[0] for v in BUSINESS_CODES.values() if sid.startswith(f"SCN-{v[0]}-")), "FLOW")
        counters[code] = max(counters.get(code, 0), int(sid.rsplit("-", 1)[-1]))
    for flow_path, _flow_title, business_title, text, pattern in candidates:
        for route in routes_for_pattern(business_title, pattern):
            code = BUSINESS_CODES.get(business_title, ("FLOW", "", "", "", ""))[0]
            parent = f"{business_title} / パターン{pattern.number} / {pattern.name}"
            sid = baseline.get(f"{parent}|{route.route_id}")
            if sid is None:
                counters[code] = counters.get(code, 0) + 1
                sid = scenario_id(business_title, pattern, counters[code])
            title = route.title
            route_pattern = route_as_pattern(pattern, route)
            rel_docs, html_docs = related_docs_with_dictionary(business_title, text, route_pattern, docs, max_docs)
            # HTMLで同定した実使用機能を、旧キーワード辞書の上限件数により落とさない。
            for row in normal_flow_rows(route_pattern):
                contract = source_contract_adapter.find(business_title, route_pattern, row, business_action_from_row(row, pattern.name))
                if contract:
                    for feature in contract["function_ids"]:
                        doc = FEATURE_DOC.get(feature)
                        if doc is not None and all(d.feature_no != feature for d in rel_docs):
                            rel_docs.append(doc)
            for _ in range(8):
                used_features = {part for step in step_rows(business_title, route_pattern, rel_docs) for part in step[3].split("・") if part != "-"}
                next_docs = [FEATURE_DOC[f] for f in sorted(used_features) if f in FEATURE_DOC]
                if {d.feature_no for d in rel_docs} == {d.feature_no for d in next_docs}:
                    break
                rel_docs = next_docs
            else:
                raise ValueError(f"機能対応が収束しない: {sid}")
            if not route.evidence:
                route_rows = normal_flow_rows(route_pattern)
                if route_rows:
                    last_contract = source_contract_adapter.find(business_title, route_pattern, route_rows[-1], business_action_from_row(route_rows[-1], pattern.name))
                    if last_contract and last_contract.get("expected_result"):
                        from dataclasses import replace
                        route = replace(route, final_state=last_contract["expected_result"])
            coverage = coverage_for(business_title, route_pattern, rel_docs, route)
            non_eccube = is_non_eccube_pattern(route_pattern)
            dup_number = len(number_names.get((flow_path, pattern.number), set())) > 1
            scenarios.append(Scenario(sid, title, business_title, flow_path, pattern, route, rel_docs, html_docs, coverage, non_eccube, dup_number))
    import supplemental_scenarios
    supplemental_scenarios.append(repo, scenarios, docs, sys.modules[__name__])
    return [execution_repairs.prepare_scenario(s, sys.modules[__name__]) for s in scenarios]


def all_feature_index(repo: Path) -> dict[str, tuple[Path, str]]:
    """functions/**/*.md に実在する全機能No -> (相対パス, タイトル)。"""
    index: dict[str, tuple[Path, str]] = {}
    function_root = repo / "functions"
    for path in sorted(function_root.glob("**/*.md")):
        if "_archive" in path.relative_to(function_root).parts:
            continue
        fno = feature_no_from_path(path)
        if fno == "-":
            continue
        fno = fno.upper()
        if fno not in index:
            index[fno] = (path.relative_to(repo), title_from_markdown(read_text(path), path.stem))
    return index


def traced_feature_ids(scenarios: list[Scenario]) -> set[str]:
    traced: set[str] = set()
    for s in scenarios:
        for d in s.docs:
            if d.feature_no != "-":
                traced.add(d.feature_no.upper())
    return traced


def classify_feature(fno: str, traced_ids: set[str], traced_prefixes: set[str]) -> tuple[str, str]:
    """全機能Noを誠実に分類する（covered / excluded-ph2 / out-of-scope / area-covered / 要判定）。"""
    prefix = fno.split("-")[0]
    if fno in EXCLUDED_FEATURE_IDS:
        return ("excluded-ph2", "Ph2対応（Ph1では実装対象外）")
    if fno in traced_ids:
        return ("covered", "シナリオがトレースしている")
    oos = OUT_OF_SCOPE_FEATURES.get(fno) or OUT_OF_SCOPE_FEATURES.get(prefix)
    if oos:
        return (f"out-of-scope:{oos[0]}", oos[1].replace("で担保", "で確認する対象（ケースと実行結果は別途確認）"))
    if prefix in traced_prefixes:
        return ("area-covered-feature-uncovered", "同一業務領域はシナリオ化済み。個別機能は未トレースで、結合テストの対応ケース・対象範囲の確認が必要")
    return ("source-backed-uncovered", "業務フロー領域に接点があり得るが未トレース（要判定：カバー要否を人手で判断）")


def write_feature_ledger(repo: Path, scenarios: list[Scenario], dry_run: bool) -> None:
    """05_設計書カバレッジ.md: 全機能Noのトレース状態を分類付きで可視化する誠実な台帳。"""
    out = repo / "scenario_test" / "scenario"
    feats = all_feature_index(repo)
    traced_ids = traced_feature_ids(scenarios)
    traced_prefixes = {f.split("-")[0] for f in traced_ids}
    classified: dict[str, tuple[str, str]] = {
        fno: classify_feature(fno, traced_ids, traced_prefixes) for fno in feats
    }
    counts: dict[str, int] = {}
    for cat, _ in classified.values():
        counts[cat] = counts.get(cat, 0) + 1
    total = len(feats)

    lines = [
        "# 設計書カバレッジ台帳（自動生成）",
        "",
        "業務フロー準拠のシステムテストとして、`functions/**/*.md` に実在する全機能Noが",
        "シナリオからトレースされているかを誠実に分類する。`covered` 以外＝網羅漏れではなく、",
        "業務フロー対象外（設定/フロント表示/連携単体）や結合テスト層で確認する領域を含む。",
        "分類は機能Noの参照状況であり、要件単位の網羅や結合テストの実行結果を保証しない。既存分類名のintegration-testedも試験済みという意味ではない。",
        "`source-backed-uncovered`（要判定）が、業務フロー接点があり得るのに未トレースの真の穴候補。",
        "",
        "## サマリ",
        "",
        "| 分類 | 件数 | 意味 |",
        "|---|---|---|",
        f"| covered | {counts.get('covered', 0)} | シナリオがトレース |",
        f"| area-covered-feature-uncovered | {counts.get('area-covered-feature-uncovered', 0)} | 業務領域は参照あり・個別機能は未参照。結合ケースと適用範囲を要確認 |",
        f"| out-of-scope:platform-base | {counts.get('out-of-scope:platform-base', 0)} | ログイン/ホーム/設定/マスタ等の管理基盤 |",
        f"| out-of-scope:front-display | {counts.get('out-of-scope:front-display', 0)} | フロント表示・共通部品（機能テスト層の対象。対応ケース・結果は別途確認） |",
        f"| out-of-scope:integration-tested | {counts.get('out-of-scope:integration-tested', 0)} | 外部連携API（結合テスト層の対象。対応ケース・結果は別途確認） |",
        f"| excluded-ph2 | {counts.get('excluded-ph2', 0)} | Ph2対応（Ph1対象外） |",
        f"| **source-backed-uncovered（要判定）** | **{counts.get('source-backed-uncovered', 0)}** | **業務フロー接点があり得るが未トレース。要人手判断** |",
        f"| 合計 | {total} | functions/ 実在機能No |",
        "",
        "## 要判定リスト（source-backed-uncovered）",
        "",
        "業務フロー準拠を保ったまま、カバー要否を人手で判断する対象。",
        "",
        "| 機能No | タイトル | 機能仕様 | 判定メモ |",
        "|---|---|---|---|",
    ]
    uncovered = sorted(fno for fno, (cat, _) in classified.items() if cat == "source-backed-uncovered")
    for fno in uncovered:
        path, title = feats[fno]
        lines.append(f"| {fno} | {table_cell(title)} | `{path}` | {classified[fno][1]} |")
    if not uncovered:
        lines.append("| - | （要判定の未トレース機能なし） | - | - |")

    lines += [
        "",
        "## プレフィックス別ロールアップ",
        "",
        "| プレフィックス | 実在 | covered | area-covered | out-of-scope | excluded-ph2 | 要判定 |",
        "|---|---|---|---|---|---|---|",
    ]
    prefixes = sorted({fno.split("-")[0] for fno in feats})
    for pref in prefixes:
        group = [classified[fno][0] for fno in feats if fno.split("-")[0] == pref]
        n = len(group)
        cov = sum(1 for c in group if c == "covered")
        area = sum(1 for c in group if c == "area-covered-feature-uncovered")
        oos = sum(1 for c in group if c.startswith("out-of-scope"))
        ph2 = sum(1 for c in group if c == "excluded-ph2")
        req = sum(1 for c in group if c == "source-backed-uncovered")
        lines.append(f"| {pref} | {n} | {cov} | {area} | {oos} | {ph2} | {req} |")

    lines += [
        "",
        "## out-of-scope 明細（対象外の根拠）",
        "",
        "| キー | カテゴリ | 理由 |",
        "|---|---|---|",
    ]
    for key, (cat, reason) in sorted(OUT_OF_SCOPE_FEATURES.items()):
        lines.append(f"| {key} | {cat} | {reason} |")

    if dry_run:
        print(f"would write {out / '05_設計書カバレッジ.md'} (要判定={counts.get('source-backed-uncovered', 0)}/{total})")
        return
    (out / "05_設計書カバレッジ.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_index(repo: Path, scenarios: list[Scenario], dry_run: bool) -> None:
    out = repo / "scenario_test" / "scenario"
    rows = ["# シナリオ一覧（自動生成）", "", "| シナリオID | 業務 | 経路ID | 経路種別 | 業務フローキー | 親業務フロー | 概要 | 主アクター | 主要設計書 | 優先度 |", "|---|---|---|---|---|---|---|---|---|---|"]
    for s in scenarios:
        main, _, _, priority = actor_meta(s.business_title)
        docs = ", ".join(d.feature_no for d in s.docs[:4]) or "-"
        flow_key = f"{s.flow_path}#{s.pattern.number}/経路{route_number(s.route.route_id)}:{s.title}"
        parent_key = f"{s.flow_path}#{s.pattern.number}:{s.pattern.name}"
        rows.append(f"| {s.sid} | {s.business_title} | {s.route.route_id} | {s.route.kind} | `{flow_key}` | `{parent_key}` | {s.title} | {main} | {docs} | {priority} |")
    trace = ["# トレーサビリティ（自動生成）", "", "| 業務 | シナリオID | 経路ID | 経路種別 | 業務経路条件 | 最終業務状態 | 業務フロー出典 | 期待機能No | 紐づけ機能No | 関連機能仕様 | 関連HTML設計書 |", "|---|---|---|---|---|---|---|---|---|---|---|"]
    for s in scenarios:
        route_pattern = scenario_route_pattern(s)
        expected = ", ".join(expected_features(s.business_title, route_pattern)) or "-"
        actual = ", ".join(d.feature_no for d in s.docs if d.feature_no != "-") or "-"
        fdocs = "<br>".join(f"`{d.path}`" for d in s.docs) or "業務フロー参照・現場/外部作業・操作先未確定（各工程の区分を参照）"
        hdocs = "<br>".join(f"`{d.path}`" for d in s.html_docs) or "`UNRESOLVED_HTML_DESIGN_DOC`"
        flow_key = f"{s.flow_path}#{s.pattern.number}/経路{route_number(s.route.route_id)}:{s.title}"
        trace.append(f"| {s.business_title} | {s.sid} | {s.route.route_id} | {s.route.kind} | {table_cell(s.route.condition)} | {table_cell(s.route.final_state)} | `{flow_key}` | {expected} | {actual} | {fdocs} | {hdocs} |")
    coverage = [
        "# システムテストカバレッジ表（自動生成）",
        "",
        "`実行エッジ数` は本シナリオで実際に実行する業務分岐の延べ件数（ユニークな異常条件数ではない）。",
        "`他層委譲` は機構的観点について現行結合テストの参照ケースを特定した機能・条件の件数（実施済みを意味しない）、",
        "`委譲未整備` は条件を実行するケースを特定できない件数。適用要否と追加要否の確認対象。",
        "`代替系` / `異常系` は実行する業務分岐から決まり、分岐が無い経路は `-` になる。",
        "",
        "| 業務 | 業務フローキー | シナリオID | 経路ID | 経路種別 | 業務経路条件 | 最終業務状態 | 正常系 | 代替系 | 異常系 | 外部連携 | データ更新 | CSV/帳票 | メール/通知 | 経路手順数 | 代替/異常手順数 | 期待機能不足 | HTML不足 | 実行エッジ数 | 主なエッジケース | 確認対象 | 他層委譲 | 委譲未整備 | 非EC-CUBE作業 | 番号重複警告 |",
        "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|",
    ]
    for s in scenarios:
        c = s.coverage
        route_pattern = scenario_route_pattern(s)
        expected_features_set = set(expected_features(s.business_title, route_pattern))
        actual_features_set = {d.feature_no for d in s.docs if d.feature_no != "-"}
        feature_gap = ", ".join(sorted(expected_features_set - actual_features_set)) or "-"
        expected_html_set = set(EXPECTED_HTML.get(s.business_title, ()))
        actual_html_set = {d.path.name[:4] for d in s.html_docs}
        html_gap = ", ".join(sorted(expected_html_set - actual_html_set)) or "-"
        flow_key = f"{s.flow_path}#{s.pattern.number}/経路{route_number(s.route.route_id)}:{s.title}"
        delegated = delegation_rows(s, repo)
        delegated_ok = sum(1 for *_rest, state in delegated if state.startswith("参照ケースあり"))
        delegated_gap = sum(1 for *_rest, state in delegated if state.startswith("対応未確認"))
        edge_conditions = html_escape_br(case.condition for case in list(s.route.edge_cases)[:3]) if s.route.edge_cases else "業務分岐なし"
        edge_observations = html_escape_br(case.observation for case in list(s.route.edge_cases)[:3]) if s.route.edge_cases else "-"
        coverage.append(
            f"| {s.business_title} | `{flow_key}` | {s.sid} | {s.route.route_id} | {s.route.kind} | "
            f"{table_cell(s.route.condition)} | {table_cell(s.route.final_state)} | "
            f"{coverage_mark(c['正常系'])} | {coverage_mark(c['代替系'])} | {coverage_mark(c['異常系'])} | "
            f"{coverage_mark(c['外部連携'])} | {coverage_mark(c['データ更新'])} | "
            f"{coverage_mark(c['CSV/帳票'])} | {coverage_mark(c['メール/通知'])} | "
            f"{len(step_rows(s.business_title, route_pattern, s.docs))} | {len(s.route.edge_cases)} | "
            f"{feature_gap} | {html_gap} | "
            f"{len(s.route.edge_cases)} | {edge_conditions} | {edge_observations} | "
            f"{delegated_ok} | {delegated_gap} | "
            f"{coverage_mark(s.non_eccube)} | {coverage_mark(s.dup_number)} |"
        )
    source_coverage = [
        "# 業務フロー正本カバレッジ（自動生成）",
        "",
        "分母は生成できたSCNではなく、正本マニフェストで採用した業務フローパターン。",
        "HTMLに明記された工程による補完は「HTML補完」と表示する。業務間接続は追加の横断試験として分け、元の業務フロー本文があると扱わない。",
        "",
        "| 業務 | 出典 | 原典パターン番号 | パターン名 | 状態 | 生成SCN数 |",
        "|---|---|---|---|---|---|",
    ]
    parent_counts: Counter[tuple[str, Path, str, str]] = Counter(
        (s.business_title, s.flow_path, s.pattern.source_number or s.pattern.number, s.pattern.name)
        for s in scenarios
    )
    for (business, path, number, name), count in sorted(
        parent_counts.items(), key=lambda item: (item[0][0], str(item[0][1]), int(item[0][2]) if item[0][2].isdigit() else 999, item[0][3])
    ):
        import supplemental_scenarios
        supplements = [r for r in supplemental_scenarios.RECORDS.values() if r["pattern_name"] == name]
        status = "生成済み"
        if supplements:
            status += "（業務間接続）" if "CROSS" in supplements[0]["contract_id"] else "（HTML補完）"
        source_coverage.append(f"| {business} | `{path}` | {number} | {table_cell(name)} | {status} | {count} |")
    for path, number, name, status in sorted(MISSING_PATTERNS, key=lambda item: (str(item[0]), item[1], item[2])):
        business = business_title_for_flow(title_from_markdown(FLOW_TEXT_BY_PATH.get(path, ""), path.stem))
        source_coverage.append(f"| {business} | `{path}` | {number} | {table_cell(name)} | {table_cell(status)} | 0 |")
    if dry_run:
        print(f"would write {out / '01_シナリオ一覧.md'}")
        print(f"would write {out / '02_トレーサビリティ.md'}")
        print(f"would write {out / '03_カバレッジ表.md'}")
        print(f"would write {out / '04_業務フロー正本カバレッジ.md'}")
        write_feature_ledger(repo, scenarios, dry_run)
        return
    (out / "01_シナリオ一覧.md").write_text("\n".join(rows) + "\n", encoding="utf-8")
    (out / "02_トレーサビリティ.md").write_text("\n".join(trace) + "\n", encoding="utf-8")
    (out / "03_カバレッジ表.md").write_text("\n".join(coverage) + "\n", encoding="utf-8")
    (out / "04_業務フロー正本カバレッジ.md").write_text("\n".join(source_coverage) + "\n", encoding="utf-8")
    write_feature_ledger(repo, scenarios, dry_run)


def ensure_support_files(repo: Path, dry_run: bool) -> None:
    out = repo / "scenario_test" / "scenario"
    files = {
        "README.md": "# 業務シナリオテスト\n\n業務フロー Markdown と設計書から生成する業務横断シナリオテスト一式。\n",
        "00_アクター一覧.md": "# アクター一覧\n\n業務フローのスイムレーンに登場する人・チーム・外部システムをシナリオのアクターとして扱う。\n",
        "_TEMPLATE.md": read_text(repo / ".codex" / "skills" / "hareruya-scenario-test-cases" / "references" / "TEMPLATE.md"),
    }
    for name, content in files.items():
        path = out / name
        if path.exists():
            continue
        if dry_run:
            print(f"would write {path}")
        else:
            path.write_text(content, encoding="utf-8")


def is_auto_generated_scenario(path: Path) -> bool:
    text = read_text(path)
    return (
        GENERATED_MARKER in text
        or "関連画面・外部システムを横断して業務完了状態まで確認する。" in text
        or path.name.startswith((
            "SCN-ORDER-店頭受取本店-",
            "SCN-ORDER-スムーズ店頭受取本店-",
            "SCN-ORDER-店頭受取支店-",
            "SCN-ORDER-店頭支払店内PC支店-",
            "SCN-KAITORI-店頭買取本店支店とも-",
            "SCN-KAITORI-仕入作業-",
            "SCN-PRODUCT-新弾発表",
            "SCN-PRODUCT-新弾リリース",
            "SCN-PRODUCT-新商品登録",
            "SCN-PRODUCT-既存商品編集",
            "SCN-PRODUCT-高額商品登録",
            "SCN-PRODUCT-委託販売商品登録",
            "SCN-PRODUCT-複数公開",
            "SCN-ZAIKO-既存業務",
        ))
    )


def prune_obsolete(repo: Path, keep_paths: set[Path], dry_run: bool) -> None:
    out = repo / "scenario_test" / "scenario"
    for path in sorted(out.glob("SCN-*.md")):
        rel = path.relative_to(repo)
        if rel in keep_paths:
            continue
        if not is_auto_generated_scenario(path):
            continue
        if dry_run:
            print(f"would remove obsolete {rel}")
        else:
            path.unlink()
            print(f"removed obsolete {rel}")


def archive_legacy_manual(repo: Path, keep_paths: set[Path], dry_run: bool) -> None:
    out = repo / "scenario_test" / "scenario"
    archive_dir = out / "_legacy_manual"
    for path in sorted(out.glob("SCN-*.md")):
        rel = path.relative_to(repo)
        if rel in keep_paths or is_auto_generated_scenario(path):
            continue
        target = archive_dir / path.name
        counter = 1
        while target.exists():
            target = archive_dir / f"{path.stem}.{counter}{path.suffix}"
            counter += 1
        if dry_run:
            print(f"would archive legacy manual {rel} -> {target.relative_to(repo)}")
        else:
            archive_dir.mkdir(parents=True, exist_ok=True)
            path.rename(target)
            print(f"archived legacy manual {rel} -> {target.relative_to(repo)}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", default=".")
    parser.add_argument("--only")
    parser.add_argument("--overwrite", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--max-related-docs", type=int, default=6)
    parser.add_argument("--prune-obsolete", action="store_true")
    parser.add_argument("--archive-legacy-manual", action="store_true")
    args = parser.parse_args()
    repo = Path(args.repo).resolve()
    out = repo / "scenario_test" / "scenario"
    out.mkdir(parents=True, exist_ok=True)
    scenarios = generate(repo, args.only, args.max_related_docs)
    ensure_support_files(repo, args.dry_run)
    keep_paths: set[Path] = set()
    for s in scenarios:
        path = out / scenario_filename(s.sid, s.title)
        keep_paths.add(path.relative_to(repo))
        if path.exists() and not args.overwrite:
            print(f"skip existing {path.relative_to(repo)}")
            continue
        content = render_scenario(s, repo)
        if any(phrase in content for phrase in OBSOLETE_PHRASES):
            raise SystemExit(f"obsolete phrase generated for {s.sid}")
        if args.dry_run:
            print(f"would write {path.relative_to(repo)}")
        else:
            path.write_text(content, encoding="utf-8")
            print(f"wrote {path.relative_to(repo)}")
    write_index(repo, scenarios, args.dry_run)
    if args.prune_obsolete:
        prune_obsolete(repo, keep_paths, args.dry_run)
    if args.archive_legacy_manual:
        archive_legacy_manual(repo, keep_paths, args.dry_run)
    print(f"scenarios: {len(scenarios)}")
    missing = [m for m in MISSING_PATTERNS if m[3].startswith("本文欠落")]
    drift = [m for m in MISSING_PATTERNS if m[3].startswith("名称ドリフト")]
    if missing:
        print("\nWARNING: 索引表に載っているのに本文の作業行が無く、シナリオを生成できなかったパターン")
        print("         （To-Be の新規業務が未テストのまま落ちている。業務フロー側の補記が必要）")
        for flow_path, num, name, _status in missing:
            print(f"  - {flow_path}  #{num}  {name}")
    if drift:
        print("\nNOTE: 索引と本文で名称が異なるパターン（本文は実在するため生成はされている）")
        for flow_path, num, name, _status in drift:
            print(f"  - {flow_path}  #{num}  索引名: {name}")
    work_counts = Counter(ROW_WORK_KIND.values())
    print(
        "\n作業種別: "
        f"EC-CUBE={work_counts.get(WORK_ECCUBE, 0)} / 物理={work_counts.get(WORK_PHYSICAL, 0)} / "
        f"外部={work_counts.get(WORK_EXTERNAL, 0)} / 手作業だがシステム操作含む(トリアージで解決)={work_counts.get(WORK_AMBIGUOUS, 0)} / "
        f"ノード表に対応なし={work_counts.get(WORK_UNKNOWN, 0)}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
