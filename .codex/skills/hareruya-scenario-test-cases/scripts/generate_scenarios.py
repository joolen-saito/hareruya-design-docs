#!/usr/bin/env python3
from __future__ import annotations

import argparse
import html
import re
from collections import Counter
from dataclasses import dataclass
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


@dataclass(frozen=True)
class BusinessRoute:
    route_id: str
    kind: str
    title: str
    condition: str
    final_state: str
    rows: tuple[str, ...]
    edge_cases: tuple["EdgeCase", ...]


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
    for path in sorted((repo / "functions").glob("**/*.md")):
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
            candidates.append(Pattern(number, name, []))
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
        if int(number) < 10 or number in existing_numbers or number not in child_prefixes:
            continue
        candidates.append(Pattern(number, name, []))
        existing_numbers.add(number)
    if not candidates:
        for line in text.splitlines():
            m = re.search(r"- \*\*R\d+\*\*:\s*([0-9]+)\s*｜\s*(.+)$", line)
            if m:
                candidates.append(Pattern(m.group(1), clean_cell(m.group(2)), []))
    seen: set[tuple[str, str]] = set()
    patterns: list[Pattern] = []
    for p in candidates:
        key = (p.number, normalize_name(p.name))
        if key not in seen:
            seen.add(key)
            patterns.append(p)
    if not patterns:
        title = title_from_markdown(text, "業務フロー")
        patterns.append(Pattern("1", title, []))
    assign_rows(text, patterns)
    renumber_duplicate_patterns(patterns)
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


def reset_generation_state() -> None:
    """生成状態を初期化する。同一プロセスで generate() を複数回呼ぶと、前回の分類や警告が
    残って結果が呼び出し順に依存するため、開始時に必ずクリアする。"""
    ROW_WORK_KIND.clear()
    ROW_SUMMARY.clear()
    MISSING_PATTERNS.clear()
    FLOW_TEXT_BY_PATH.clear()
    FLOW_GRAPH_BY_PATH.clear()


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
    lane: str
    kind: str
    text: str


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
        number, lane, kind, node_text = cells[0], cells[2], cells[3], cells[4]
        if not number.isdigit() or not node_text or node_text == "—":
            continue
        nodes.setdefault(number, FlowNode(number, lane, kind, node_text))
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
            if last_rnum is not None and rnum is not None and rnum - last_rnum > MERGE_GAP:
                continue
            cont = re.sub(r"^-?\s*R\d+:\s*", "", clean_cell(line)).strip()
            if cont:
                p, idx = current  # type: ignore[misc]
                if cont not in p.rows[idx]:
                    sep = ROW_SEP if ROW_SEP not in p.rows[idx] else " "
                    p.rows[idx] = f"{p.rows[idx]}{sep}{cont}"
                    last_rnum = rnum

    # 作業種別の判定は継続行の連結後に行う。作業内容が複数行に分かれている場合、
    # 「CSVを作成する」等のシステム操作の記述が継続行側にあり、1行目だけでは物理作業と
    # 誤判定するため（例:「セール品リスト作成…この際にCSVを作成する」）。
    for p in patterns:
        for row in p.rows:
            key = primary_text(row)
            summary = ROW_SUMMARY.get(key, "")
            if summary:
                ROW_WORK_KIND[key] = classify_work(summary, classification_text(row), nodes)


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
    # 「〜有無」「〜分岐」のみの判断ノード（作業内容を伴わない短い見出し）
    return bool(re.fullmatch(r".{0,10}(有無|分岐)", concept))


def row_leading_number(row: str) -> str:
    m = re.search(r"^-?\s*R\d+:\s*(\d+(?:[-－][\d０-９①-⑳]+)?)", primary_text(row))
    return m.group(1) if m else ""


def is_pattern_header_row(row: str, pattern: Pattern) -> bool:
    # パターン見出し行（＃番号がパターン番号そのもの＝作業概要がパターン名）は
    # 業務行動ではないため、下位ステップ（N-M）がある場合は正常系ステップの先頭に置かない。
    return bool(pattern.number) and row_leading_number(row) == pattern.number


def normal_flow_rows(pattern: Pattern) -> list[str]:
    rows = [
        row
        for row in pattern.rows
        if not is_branch_row(row, pattern.name) and not is_structural_row(row)
    ]
    # 下位ステップがあるなら、見出し行（パターン名の繰り返し）は除外して実作業を先頭にする。
    detailed = [row for row in rows if not is_pattern_header_row(row, pattern)]
    if detailed:
        rows = detailed
    if not rows:
        rows = [row for row in pattern.rows if not is_structural_row(row)] or pattern.rows or [pattern.name]
    return rows


def branch_flow_rows(pattern: Pattern) -> list[str]:
    return [row for row in pattern.rows if is_branch_row(row, pattern.name)]


NON_ECCUBE_SCREEN = "非EC-CUBE作業（メール/電話/Thunderbird・外部アプリ／EC-CUBE参照のみ）"
NON_ECCUBE_EXPECT = "メール/電話/外部アプリ側で対応が記録され、EC-CUBEの受注・在庫は更新されないこと。"
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
            if keyword in concept and feature in by_feature and feature not in EXCLUDED_FEATURE_IDS:
                doc = by_feature[feature]
                if doc.path not in used:
                    result[i] = doc
                    used.add(doc.path)
                    break
    # 2nd pass: 未割当行に、設計書名との部分文字列一致が最大の未使用docを割り当てる
    # （日本語は tokenize では語分割できないため、2〜4文字の部分列一致で近さを測る）。
    # 例:「注文完了…」行に「カテゴリ一覧」画面が位置順で当たる誤りを防ぐ（Claude Codeレビュー指摘）。
    remaining = [d for d in docs if d.path not in used]
    for i in assignable:
        if result[i] is not None:
            continue
        row_text = full_text(rows[i])
        best, best_score = None, 0
        for d in remaining:
            score = title_row_affinity(row_text, d.title)
            if score > best_score:
                best, best_score = d, score
        # 類似度ゼロなら割り当てない。「余っている設計書の先頭」を機械的に埋めると、
        # 根拠のない機能Noが付き（貼替作業に「セール用価格変更CSV出力」等）、その画面で
        # 観測できない期待結果を生む。未特定は黙って埋めず、要確認として可視化する。
        if best is None:
            continue
        result[i] = best
        remaining.remove(best)
    return result


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
        actor = infer_actor(row, main_actor)
        action = business_action_from_row(row, pattern.name)
        doc = step_docs[idx - 1]
        feature = doc.feature_no if doc else "-"
        work = row_work_kind(row)
        if non_eccube:
            screen = NON_ECCUBE_SCREEN
            expect = NON_ECCUBE_EXPECT
            observation = NON_ECCUBE_OBSERVATION
        elif work == WORK_PHYSICAL:
            screen = PHYSICAL_SCREEN
            expect = expected_assertion(row)
            observation = PHYSICAL_OBSERVATION
        elif work == WORK_EXTERNAL:
            screen = EXTERNAL_SCREEN
            expect = expected_assertion(row)
            observation = EXTERNAL_OBSERVATION
        elif work == WORK_AMBIGUOUS and doc is None:
            # キーワード辞書が発火していれば EC-CUBE 工程と確定でき、下の通常分岐で描画される。
            screen = AMBIGUOUS_SCREEN
            expect = expected_assertion(row)
            observation = AMBIGUOUS_OBSERVATION
        elif doc is None:
            # EC-CUBE 工程だが設計書を特定できない。埋めずに要確認として出す。
            screen = UNRESOLVED_SCREEN
            expect = expected_assertion(row)
            observation = expected_observation(row)
        else:
            screen = doc.title
            expect = expected_assertion(row)
            observation = expected_observation(row)
        result.append((actor, action, screen, feature, expect, observation))
    return result


# 物理作業・外部システム作業・機能No未特定の表示。EC-CUBE 画面での観測を主張しない。
PHYSICAL_SCREEN = "該当なし（物理作業。EC-CUBE操作なし）"
PHYSICAL_OBSERVATION = "現物・現品、チェック票/帳票の記入、数量、サイン（EC-CUBE の更新は発生しない）"
EXTERNAL_SCREEN = "該当なし（外部システム/ツール操作。EC-CUBE操作なし）"
EXTERNAL_OBSERVATION = "外部システム/ツール側の登録・記録内容（EC-CUBE の更新は発生しない）"
UNRESOLVED_SCREEN = "要確認（EC-CUBE工程だが機能Noを特定できない）"
AMBIGUOUS_SCREEN = "要確認（業務フロー上は手作業だが、CSV/インポート等のシステム操作を含む）"
AMBIGUOUS_OBSERVATION = "要確認（EC-CUBE操作か外部ツール作業かを業務側で確定させること）"


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
    if append_action and not re.search(r"(する|行う|確認する|報告する|更新する|登録する|出力する|依頼する|発送する|受け取る)$", value):
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
    verb_end = re.compile(r"(する|した|される|できる|れる|られる|行う|なる|[うくぐすつぬぶむる])$")
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
    detail = re.sub(r"\s+", " ", detail).strip(" 、。")
    detail = first_verb_clause(detail)
    if len(detail) > 90:
        head = detail[:90]
        detail = head[: head.rindex("、")] if "、" in head else head
    return detail


# サ変名詞（する を付けて動詞化できる語）の末尾。「完了」→「完了すること」等の整合に使う。
SAHEN_SUFFIX = re.compile(
    r"(完了|受領|報告|登録|出力|送付|送信|更新|変更|確認|作成|削除|実施|反映|付与|通知|委譲|移動|"
    r"入庫|出庫|承認|差戻|却下|決済|返金|公開|取込|集計|申込|受付|査定|仕入|発送|配送|引渡|振込|"
    r"出金|入金|抽出|印刷|統合|補充|廃棄|貸出|借用|依頼|連携|同期|保存|検索|選択|指定|入力|参照)$"
)


def koto_form(detail: str) -> str:
    """作業内容を「〜こと」で終わる主張形にする（語尾整合をとる）。"""
    d = detail.rstrip(" 、。")
    if not d:
        return "所定の業務結果が得られる"
    if d.endswith("する"):
        return d + "こと"
    if re.search(r"(される|できる|れる|られる)$", d):
        return d + "こと"
    if re.search(r"[うくぐすつぬぶむる]$", d):
        return d + "こと"
    if SAHEN_SUFFIX.search(d):
        return d + "すること"
    return d + "こと"


def expected_assertion(row: str) -> str:
    """期待結果／レスポンス。作業内容にリンクし、「〜こと。」で終える。"""
    detail = clean_detail(row)
    if not detail:
        return "所定の業務結果が得られること。"
    return koto_form(detail) + "。"


def expected_observation(row: str) -> str:
    """確認対象（観測点）。期待結果とは別列で提示する。"""
    return observation_point(row_title(row) + " " + clean_detail(row))


def seed_suffix(s: Scenario) -> str:
    code = BUSINESS_CODES.get(s.business_title, ("FLOW", "", "", "", ""))[0]
    number = re.sub(r"\D", "", s.pattern.number) or "1"
    route = route_number(s.route.route_id)
    return f"{code}-{int(number):03d}-R{route:02d}"


def execution_seed(s: Scenario) -> dict[str, str]:
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
            "受注ステータス": "対応中",
            "返金対象金額": "1,000円",
            "配送方法": "宅配便",
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
    return common


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
    patterns: list[DataPattern] = [
        DataPattern(
            "DP-N001",
            "正常系 代表",
            normal_target,
            f"{s.route.kind}の代表データで業務経路を確認する。",
            route_precondition,
            seed_input_summary(seed),
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
                branch_precondition_delta(case),
                branch_pattern_input(s, case, branch_id, seed),
                case.observation,
            )
        )
    return patterns


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
     "棚卸計画(dtb_inventory_plan)の確定・実数反映時にdtb_product_stockの在庫が更新されること（反映時点は実装依存）",
     "0202_在庫管理"),
    (("出金",), (), "consumer",
     "店頭買取情報更新API→EC-CUBE連携",
     "スマレジの出金取引ID/出金コードが店頭買取情報更新API(PUT /admin/otcBuyOrder/{id}/status.json)でEC-CUBEへ連携されること"
     "（経理払い出し済で買取成立にする旨をHTMLに記載）",
     "0601_MTGBuyer"),
    # === note: 保存先/ステータスの記載はあるが消費先は明記なし（自由端は要確認のまま注記） ===
    # 在庫移動指示: tracking_no反映先の記載はあるが、在庫移動実績CSV取込では在庫数・移動ステータスを
    # 更新しないとHTMLが明記するため、consumerにはせず注記に留める（codecレビュー指摘）。
    (("在庫移動指示",), (), "note",
     "在庫移動・振替（dtb_stock_move_transfer / dtb_stock_move_instruction）",
     "HTML設計書では在庫移動指示は在庫移動・振替のtracking_noに反映される旨が記載（在庫移動実績CSV取込では在庫数・移動ステータスは更新しないと明記）",
     "0202_在庫管理"),
    # 在庫変更CSV: 承認ワークフロー経由の在庫反映は実装依存とHTMLが留保するため、断定せず注記に留める。
    (("在庫変更CSV",), (), "note",
     "在庫変更CSV取込（dtb_csv_import_history→在庫編集承認情報/在庫変更履歴）",
     "HTML設計書では在庫変更CSV取込がdtb_csv_import_historyを登録し在庫編集承認情報・在庫変更履歴を登録する旨が記載（承認後の在庫反映ワークフローは実装依存）",
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
    graph = flow_graph(s.flow_path)
    empty = "| - | - | - | - | 原典に該当するデータ遷移線が無い | - | 要確認（原典未記載） |"
    if graph is None or not graph.edges:
        return empty

    # 行→ノード候補を引く。同名図形は複数番号にマッチするため、まず一意に定まる行
    # （＝アンカー）だけでこのシナリオのノード番号スコープを推定し、同名の曖昧行は
    # その範囲内の出現に解決する。範囲外の別パターンの点線は当該シナリオへ帰属させない。
    row_candidates: list[list[str]] = []
    for row in s.route.rows:
        summary = ROW_SUMMARY.get(primary_text(row), "") or row_title(row)
        node = lookup_node(summary, graph.norm_nodes) or lookup_node_by_body(row_detail(row), graph.norm_nodes)
        row_candidates.append(graph.node_numbers(node[2]) if node else [])
    # スコープ＝アンカーが最も多く属する連結成分。番号範囲ではなくグラフの接続成分で
    # パターン境界を切る。1シナリオ＝1パターン＝1成分なので、同名図形が別成分へ誤マッチ
    # した単発アンカー（例:「注文情報確認」が別パターンの「注文」に一致）は多数決で捨てる。
    anchors = [nums[0] for nums in row_candidates if len(nums) == 1]
    scope: set[str] | None = None
    if anchors:
        comp_votes: dict[frozenset[str], int] = {}
        for a in anchors:
            comp = graph.component_of(a)
            comp_votes[comp] = comp_votes.get(comp, 0) + 1
        top = max(comp_votes.values())
        scope = set()
        for comp, votes in comp_votes.items():
            if votes == top:
                scope |= comp

    def resolve(nums: list[str]) -> list[str]:
        if scope is None:
            return nums if len(nums) == 1 else []  # アンカー無し→一意行のみ
        # 一意一致でもスコープ外なら捨てる（別成分へ誤マッチした少数派アンカーの除去）。
        return [n for n in nums if n in scope]

    seed = seed or {}
    lines: list[str] = []
    seen: set[tuple[str, str, str]] = set()
    for nums in row_candidates:
        for number in resolve(nums):
            for link in graph.data_links(number, scope):
                key = (link.producer_no, link.artifact_no, link.consumer_no)
                if key in seen:
                    continue
                seen.add(key)
                artifact = f"#{link.artifact_no} {link.artifact_text}"
                # 照合キーはアーティファクト（原典が名付けたデータオブジェクト）名のみから導出する。
                # 周辺工程語を混ぜると、返金メール連鎖に受注番号を付ける等の誤りが出る（codex指摘）。
                derived = chain_key(link.artifact_text, seed)
                key_cell = derived if derived else "原典上の照合キー未定義（要業務確認）"
                html = html_chain_resolution(link.artifact_text, s.business_title)
                html_note = f" {html[2]}（出典: {html[3]}）。" if html else ""
                if link.producer_no and link.consumer_no:
                    producer = f"#{link.producer_no} {link.producer_text}"
                    consumer = f"#{link.consumer_no} {link.consumer_text}"
                    tail = f"（照合キー {derived} で同一）" if derived else "（照合キーは要業務確認）"
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
                        # HTMLは保存先/ステータスのみ記す(note)か記載なし。消費先は原典未定義のまま。
                        consumer = "(自由端＝原典で接続先未定義)"
                        expected = f"「{link.producer_text}」で産出/更新された「{link.artifact_text}」が確認できること。" + html_note
                        verdict = "要確認（消費先が原典未定義）"
                else:
                    producer = "(産出元が原典未定義)"
                    consumer = f"#{link.consumer_no} {link.consumer_text}"
                    expected = f"「{link.artifact_text}」を、工程「{link.consumer_text}」が参照できること。" + html_note
                    verdict = "要確認（産出元が原典未定義）"
                lines.append(
                    f"| DL-{len(lines) + 1:02d} | {producer} | {artifact} | {consumer} | {expected} | "
                    f"{key_cell} | {verdict} |"
                )
    return "\n".join(lines) if lines else empty


def render_execution_steps(s: Scenario, seed: dict[str, str]) -> str:
    rows = []
    route_pattern = scenario_route_pattern(s)
    for idx, (actor, action, screen, feature, expect, observation) in enumerate(step_rows(s.business_title, route_pattern, s.docs), 1):
        target = step_target(action, seed)
        work = row_work_kind(normal_flow_rows(route_pattern)[idx - 1]) if idx - 1 < len(normal_flow_rows(route_pattern)) else WORK_UNKNOWN
        if s.non_eccube:
            operation = f"メール/電話/外部アプリ（Thunderbird等）で「{action}」を実施する（EC-CUBEは参照のみ）"
        elif work == WORK_PHYSICAL:
            operation = f"現場作業として「{action}」を実施する（EC-CUBE操作なし）"
        elif work == WORK_EXTERNAL:
            operation = f"外部システム/ツール上で「{action}」を実施する（EC-CUBE操作なし）"
        elif work == WORK_AMBIGUOUS and screen == AMBIGUOUS_SCREEN:
            operation = f"「{action}」を実施する（EC-CUBE操作か外部ツール作業かは要確認）"
        elif screen == UNRESOLVED_SCREEN:
            operation = f"「{action}」を行う（実施画面は要確認。機能Noを特定できていない）"
        else:
            operation = f"{screen}で「{action}」を行う"
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
        if screen:
            operation = f"{screen}で 条件「{case.condition}」となるデータ/操作を実行する"
        else:
            operation = (
                f"条件「{case.condition}」となるデータ/操作を実行する"
                "（実施画面は要確認。機能Noを特定できていない）"
            )
        expected = koto_form(case.expected.rstrip("。")) + "。"
        rows.append(f"| {idx} | {branch_id} | {actor} | {operation} | {edge_in}（基準: {base}） | {expected} | {case.observation} |")
    if not rows:
        rows.append(
            "| - | - | - | 該当なし（この経路に業務分岐は無い） | - | "
            "機構的異常系は `## 他層委譲（結合テスト）` の結合テストケースで実施すること。 | - |"
        )
    return "\n".join(rows)


def render_scenario(s: Scenario, repo: Path) -> str:
    main, sub, systems, priority = actor_meta(s.business_title)
    seed = execution_seed(s)
    route_pattern = scenario_route_pattern(s)
    data_patterns = data_patterns_for(s, seed)
    related_doc_lines = "\n".join(f"  - `{d.path}`" for d in s.html_docs) or "  - `UNRESOLVED_HTML_DESIGN_DOC`"
    trace_rows = []
    for d in s.docs:
        e2e = f"integration_test/e2e/{d.path.stem.replace('-', '_')}_e2e_cases.md"
        trace_rows.append(f"  | {d.title} | {d.feature_no} | `{d.path}` | `{e2e}` |")
    if not trace_rows:
        trace_rows.append("  | UNRESOLVED_FUNCTION_SPEC | - | - | - |")
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
- **トレース元要件**:
  - 業務フロー番号: {s.business_title} / パターン{s.pattern.number} / 経路{route_number(s.route.route_id)}
  - 出典: `{s.flow_path}`

## アクター
- **主アクター**: {main}
- **副アクター**: {sub}
- **関連システム**: {systems}

## 事前条件・テストデータ・環境
- **事前条件**: `{seed['担当者アカウント']}` でログインでき、以下のシードデータを検索・更新できる。
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
- 画面、CSV/帳票、メール、外部システムのいずれかで、処理結果が確認できる。

## システムテストカバレッジ
| 観点 | カバー |
|---|---|
{coverage_lines}

## エッジケース要約
| 件数 | 主なエッジケース | 確認対象 |
|---|---|---|
{edge_summary}

## 他層委譲（結合テスト）
権限・必須/形式・重複実行・0件検索は機構的な確認であり、結合テスト層（`integration-test-viewpoints.md`）が
機能単位で網羅する。本シナリオでは重複して実行せず、下表の結合テストケースで担保する。
`未整備` は結合テスト側に該当ケースが無いことを示す実在の穴であり、隠さずに出す。

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
- **本シナリオで実行しない観点**: 画面遷移・バック・リロード・値引き継ぎ（IT-03）、および `## 他層委譲（結合テスト）` に挙げた機構的異常系。
"""


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
# 委譲先は観点ID（IT-15 等）ではなく、`integration_test/*_it_cases.md` に実在するテストIDで示す。
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
    index = it_case_index(repo)
    features = [d.feature_no.upper() for d in s.docs if d.feature_no != "-"]
    rows: list[tuple[str, str, str, str]] = []
    for condition, viewpoints in DELEGATED_MECHANISMS:
        ids: list[str] = []
        for feature in features:
            for viewpoint in viewpoints:
                ids.extend(index.get(feature, {}).get(viewpoint, []))
        vp = " / ".join(viewpoints)
        if ids:
            shown = "<br>".join(f"`{i}`" for i in ids[:3])
            if len(ids) > 3:
                shown += f"<br>ほか {len(ids) - 3} 件"
            rows.append((condition, vp, shown, "委譲済"))
        else:
            rows.append((condition, vp, "-", "未整備（結合テスト側に該当ケースなし）"))
    return rows


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
    return Pattern(pattern.number, pattern.name, list(route.rows))


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
    rows = [row for row in normal_flow_rows(pattern) if not is_major_alternative_row(row, pattern)]
    if rows:
        return rows
    return normal_flow_rows(pattern)


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
    all_cases = edge_cases_for(business_title, pattern)
    routes: list[BusinessRoute] = []
    next_id = 1

    def rid() -> str:
        nonlocal next_id
        value = f"R{next_id:02d}"
        next_id += 1
        return value

    base_rows = tuple(base_route_rows(pattern))
    routes.append(
        BusinessRoute(
            rid(),
            "正常代表",
            f"{pattern.name}（必須業務ステップで完了）",
            "必須業務ステップのみを実施し、条件付き登録・保留・棄却を発生させない。",
            f"{pattern.name}の対象データが完了状態として追跡できる。",
            base_rows,
            supporting_edge_cases(all_cases),
        )
    )

    seen_route_rows: set[str] = set()
    for row in normal_flow_rows(pattern):
        if not is_major_alternative_row(row, pattern):
            continue
        key = row_concept(row)
        if key in seen_route_rows:
            continue
        seen_route_rows.add(key)
        routes.append(
            BusinessRoute(
                rid(),
                "主要代替",
                route_title_from_row(pattern, row),
                route_condition_from_row(row),
                route_final_state_from_row(pattern, row),
                tuple(rows_for_alternative_route(pattern, row)),
                supporting_edge_cases(all_cases),
            )
        )

    seen_cases: set[tuple[str, str]] = set()
    for case in all_cases:
        if not is_route_level_edge_case(case):
            continue
        key = (case.kind, case.condition)
        if key in seen_cases:
            continue
        seen_cases.add(key)
        routes.append(
            BusinessRoute(
                rid(),
                "業務異常" if case.kind == "E" else "主要代替",
                route_title_from_case(pattern, case),
                case.condition,
                route_final_state_from_case(case),
                tuple(rows_for_edge_route(pattern, case)),
                (case,) + supporting_edge_cases(all_cases, case)[:2],
            )
        )
    return routes


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


def source_priority(flow_path: Path) -> int:
    name = flow_path.name
    if "_tobe" in name or "tobe" in name:
        return 3
    if name.startswith("13_在庫管理_tobe") or name.startswith("10_商品登録・編集_tobe") or name.startswith("17_通販受注管理_tobe"):
        return 3
    return 1


def dedupe_patterns(items: list[tuple[Path, str, str, str, Pattern]]) -> list[tuple[Path, str, str, str, Pattern]]:
    chosen: dict[tuple[str, str, str], tuple[Path, str, str, str, Pattern]] = {}
    for item in items:
        flow_path, _flow_title, business_title, _text, pattern = item
        key = (business_title, pattern.number, normalize_name(pattern.name))
        current = chosen.get(key)
        if current is None or source_priority(flow_path) > source_priority(current[0]):
            chosen[key] = item
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
    docs = build_design_index(repo)
    candidates: list[tuple[Path, str, str, str, Pattern]] = []
    index_entries: dict[str, list[tuple[Path, str, str]]] = {}
    patterns_by_business: dict[str, list[Pattern]] = {}
    for flow_path, flow_title, business_title, text in discover_flows(repo, only):
        patterns = parse_patterns(text)
        patterns_by_business.setdefault(business_title, []).extend(patterns)
        for num, name in index_pattern_entries(text):
            index_entries.setdefault(business_title, []).append((flow_path, num, name))
        FLOW_TEXT_BY_PATH[flow_path] = text
        for pattern in patterns:
            candidates.append((flow_path, flow_title, business_title, text, pattern))
    # 索引にあるのに、その業務のどのフロー本文にも作業行が無いパターンを検出する。
    for business_title, entries in index_entries.items():
        known = patterns_by_business.get(business_title, [])
        for flow_path, num, name in entries:
            status = index_pattern_status(num, name, known)
            if status:
                MISSING_PATTERNS.append((flow_path, num, name, status))
    candidates = dedupe_patterns(candidates)
    # 同一業務フローファイル内で「同じ番号だが別名」のパターンを検出（在庫管理 #7 等）。
    # codexレビュー指摘#5：番号の欠落/重複で追跡が曖昧になる問題を可視化する。
    number_names: dict[tuple[Path, str], set[str]] = {}
    for flow_path, _flow_title, _business_title, _text, pattern in candidates:
        number_names.setdefault((flow_path, pattern.number), set()).add(normalize_name(pattern.name))
    scenarios: list[Scenario] = []
    counters: dict[str, int] = {}
    for flow_path, _flow_title, business_title, text, pattern in candidates:
        for route in routes_for_pattern(business_title, pattern):
            code = BUSINESS_CODES.get(business_title, ("FLOW", "", "", "", ""))[0]
            counters[code] = counters.get(code, 0) + 1
            sid = scenario_id(business_title, pattern, counters[code])
            title = route.title
            route_pattern = route_as_pattern(pattern, route)
            rel_docs, html_docs = related_docs_with_dictionary(business_title, text, route_pattern, docs, max_docs)
            coverage = coverage_for(business_title, route_pattern, rel_docs, route)
            non_eccube = is_non_eccube_pattern(route_pattern)
            dup_number = len(number_names.get((flow_path, pattern.number), set())) > 1
            scenarios.append(Scenario(sid, title, business_title, flow_path, pattern, route, rel_docs, html_docs, coverage, non_eccube, dup_number))
    return scenarios


def all_feature_index(repo: Path) -> dict[str, tuple[Path, str]]:
    """functions/**/*.md に実在する全機能No -> (相対パス, タイトル)。"""
    index: dict[str, tuple[Path, str]] = {}
    for path in sorted((repo / "functions").glob("**/*.md")):
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
        return (f"out-of-scope:{oos[0]}", oos[1])
    if prefix in traced_prefixes:
        return ("area-covered-feature-uncovered", "同一業務領域はシナリオ化済み。個別機能は機能テスト層(integration_test)で担保")
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
        "業務フロー対象外（設定/フロント表示/連携単体）や機能テスト層で担保する領域を含む。",
        "`source-backed-uncovered`（要判定）が、業務フロー接点があり得るのに未トレースの真の穴候補。",
        "",
        "## サマリ",
        "",
        "| 分類 | 件数 | 意味 |",
        "|---|---|---|",
        f"| covered | {counts.get('covered', 0)} | シナリオがトレース |",
        f"| area-covered-feature-uncovered | {counts.get('area-covered-feature-uncovered', 0)} | 業務領域はカバー済み・個別機能は機能テスト層で担保 |",
        f"| out-of-scope:platform-base | {counts.get('out-of-scope:platform-base', 0)} | ログイン/ホーム/設定/マスタ等の管理基盤 |",
        f"| out-of-scope:front-display | {counts.get('out-of-scope:front-display', 0)} | フロント表示・共通部品（機能テスト層で担保） |",
        f"| out-of-scope:integration-tested | {counts.get('out-of-scope:integration-tested', 0)} | 外部連携API（integration_test層で担保） |",
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
        fdocs = "<br>".join(f"`{d.path}`" for d in s.docs) or "`UNRESOLVED_FUNCTION_SPEC`"
        hdocs = "<br>".join(f"`{d.path}`" for d in s.html_docs) or "`UNRESOLVED_HTML_DESIGN_DOC`"
        flow_key = f"{s.flow_path}#{s.pattern.number}/経路{route_number(s.route.route_id)}:{s.title}"
        trace.append(f"| {s.business_title} | {s.sid} | {s.route.route_id} | {s.route.kind} | {table_cell(s.route.condition)} | {table_cell(s.route.final_state)} | `{flow_key}` | {expected} | {actual} | {fdocs} | {hdocs} |")
    coverage = [
        "# システムテストカバレッジ表（自動生成）",
        "",
        "`実行エッジ数` は本シナリオで実際に実行する業務分岐の延べ件数（ユニークな異常条件数ではない）。",
        "`他層委譲` は機構的異常系（権限/必須・形式/重複実行/0件検索）を結合テストのケースIDへ委譲した件数、",
        "`委譲未整備` は委譲先の結合テストケースが存在しない件数＝実在の穴。",
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
        delegated_ok = sum(1 for *_rest, state in delegated if state == "委譲済")
        delegated_gap = len(delegated) - delegated_ok
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
    if dry_run:
        print(f"would write {out / '01_シナリオ一覧.md'}")
        print(f"would write {out / '02_トレーサビリティ.md'}")
        print(f"would write {out / '03_カバレッジ表.md'}")
        write_feature_ledger(repo, scenarios, dry_run)
        return
    (out / "01_シナリオ一覧.md").write_text("\n".join(rows) + "\n", encoding="utf-8")
    (out / "02_トレーサビリティ.md").write_text("\n".join(trace) + "\n", encoding="utf-8")
    (out / "03_カバレッジ表.md").write_text("\n".join(coverage) + "\n", encoding="utf-8")
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
        f"外部={work_counts.get(WORK_EXTERNAL, 0)} / 要確認(手作業だがシステム操作)={work_counts.get(WORK_AMBIGUOUS, 0)} / "
        f"ノード表に対応なし={work_counts.get(WORK_UNKNOWN, 0)}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
