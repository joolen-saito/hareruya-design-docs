#!/usr/bin/env python3
from __future__ import annotations

import argparse
import html
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


BUSINESS_CODES = {
    "店頭受取受注管理": ("ORDER", "店舗チーム", "お客様、通販チーム、支店", "EC-CUBE（本店/支店）、スマレジ", "P1"),
    "店頭買取": ("KAITORI", "店舗チーム", "お客様、商品管理チーム、経理担当、支店", "EC-CUBE、MTGバイヤー、スマレジ", "P1"),
    "イベント管理": ("EVENT", "店舗チーム", "お客様、顧客戦略チーム", "EC-CUBE、GMO、デッキシステム、スマレジ、ポイントグランター", "P1"),
    "商品登録・編集": ("PRODUCT", "トレードチーム", "ITチーム、通販チーム、デザインチーム", "EC-CUBE、AWS S3、在庫管理", "P1"),
    "価格管理": ("PRICE", "トレードチーム", "商品管理チーム、支店、セール担当者", "EC-CUBE、分析集計", "P1"),
    "在庫管理": ("ZAIKO", "トレードチーム", "店舗チーム、商品管理チーム、通販チーム、支店", "EC-CUBE、スマレジ", "P1"),
    "ネット買取": ("ONLINE-KAITORI", "通販チーム", "お客様、商品管理チーム", "EC-CUBE、MTGバイヤー、メール", "P1"),
    "仕入れ業務": ("SHIIRE", "商品管理チーム", "店舗チーム、通販チーム、トレードチーム", "EC-CUBE、MTGバイヤー、Backlog", "P1"),
    "通販受注管理": ("TSUHAN", "通販チーム", "お客様、GMO、配送/ラベル印字アプリ", "EC-CUBE、GMO、メール、海外発送管理アプリ", "P1"),
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
    "M03-43", "M04-06", "M04-07", "M06-13", "M08-11",
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


@dataclass
class Scenario:
    sid: str
    title: str
    business_title: str
    flow_path: Path
    pattern: Pattern
    docs: list[DesignDoc]
    html_docs: list[DesignDoc]
    coverage: dict[str, bool]
    edge_cases: list["EdgeCase"]
    non_eccube: bool = False
    dup_number: bool = False


@dataclass(frozen=True)
class EdgeCase:
    kind: str
    condition: str
    expected: str
    observation: str
    source_row: str = ""


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
    value = re.sub(r"\s+", " ", value)
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
    query = tokenize(flow_text[:2000] + " " + pattern.name + " " + " ".join(pattern.rows))
    ranked = sorted(((score_doc(query, d), d) for d in docs), key=lambda x: (-x[0], str(x[1].path)))
    selected = [d for score, d in ranked if score > 0 and d.kind == "function"][:max_docs]
    html_selected = [d for score, d in ranked if score > 0 and d.kind in {"basic-html", "function-html"}][:max(2, max_docs // 2)]
    return selected, html_selected


def is_non_eccube_pattern(pattern: Pattern) -> bool:
    """メール/電話/外部アプリ等、EC-CUBE画面を割り当てるべきでない非システム作業か。"""
    # パターン名が「メーラーでのみ」等を含む、または本文に強いマーカーがある場合のみ。
    if "メーラー" in pattern.name:
        return True
    haystack = pattern.name + " " + " ".join(pattern.rows)
    return any(marker in haystack for marker in NON_ECCUBE_MARKERS)


def expected_features(business_title: str, pattern: Pattern) -> list[str]:
    # 非EC-CUBE作業（メーラーのみ等）はEC-CUBE機能を自動割当せず、参照のみ M05-01 に限定する
    # （codexレビュー指摘#2：キーワード類似でEC-CUBE画面を誤割当しない）。
    if is_non_eccube_pattern(pattern):
        return ["M05-01"] if any(m in (business_title) for m in ("通販", "受注")) else []
    rules = EXPECTED_FUNCTIONS.get(business_title, [])
    selected: list[str] = []
    haystack = pattern.name + " " + " ".join(pattern.rows)
    for keyword, features in rules:
        if keyword and keyword in haystack:
            selected.extend(features)
    for keyword, features in rules:
        if keyword == "":
            selected.extend(features)
            break
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
        if len(selected) >= max(len(expected), max_docs):
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
    return patterns


def clean_cell(value: str) -> str:
    value = re.sub(r"\*\*\[[^]]+\]\*\*", "", value)
    value = re.sub(r"\*\*", "", value)
    value = value.replace("｜", " ")
    return re.sub(r"\s+", " ", value).strip(" /　")


def assign_rows(text: str, patterns: list[Pattern]) -> None:
    by_prefix = {p.number: p for p in patterns}
    for line in text.splitlines():
        m = re.search(r"\*\*\[＃\]\*\*\s*([0-9]+(?:-[0-9]+)?)", line)
        if not m:
            continue
        prefix = m.group(1).split("-")[0]
        p = by_prefix.get(prefix)
        if p:
            row = clean_cell(line)
            if row and row not in p.rows:
                p.rows.append(row)


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
    if not any(word in row for word in BRANCH_KEYWORDS):
        return False
    # If the scenario itself is about the exceptional business, keep it in the
    # normal route. Example: GMO返金処理 and 欠品対応 are primary flows.
    return not any(word in pattern_name for word in BRANCH_KEYWORDS)


# 業務フロー図の判断ノード/継続断片で、正常系ステップとして意味を持たない作業概要。
# 例: 「キャンペーン対象」「有無」「次へ」は分岐/継続の見出しであり操作ではない
# （codexレビュー中程度指摘：正常系に意味不明な行が残る）。
STRUCTURAL_CONCEPTS = {"有無", "次へ", "連絡", "分岐", "キャンペーン対象", "キャンペーン対象 有無"}


def row_concept(row: str) -> str:
    value = re.sub(r"^-?\s*R\d+:\s*", "", row).strip()
    value = re.sub(r"^\d+(?:-\d+)?\s*", "", value).strip()
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


def normal_flow_rows(pattern: Pattern) -> list[str]:
    rows = [
        row
        for row in pattern.rows
        if not is_branch_row(row, pattern.name) and not is_structural_row(row)
    ]
    if not rows:
        rows = [row for row in pattern.rows if not is_structural_row(row)] or pattern.rows or [pattern.name]
    return rows


def branch_flow_rows(pattern: Pattern) -> list[str]:
    return [row for row in pattern.rows if is_branch_row(row, pattern.name)]


NON_ECCUBE_SCREEN = "非EC-CUBE作業（メール/電話/Thunderbird・外部アプリ／EC-CUBE参照のみ）"
NON_ECCUBE_EXPECT = "メール/電話/外部アプリ側で対応が記録され、EC-CUBEの受注・在庫は更新されない（更新が要る場合は別業務フローへ）"


def triggered_keyword_features(business_title: str, pattern: Pattern) -> list[tuple[str, str]]:
    """パターンで実際に発火したキーワードと機能Noの (keyword, feature) 一覧。
    キーワードが業務フロー本文（作業概要/パターン名）に実在するもののみ返す。"""
    haystack = pattern.name + " " + " ".join(pattern.rows)
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
    # 1st pass: キーワード発火機能を、その語を含む行へ束ねる
    for i, row in enumerate(rows):
        concept = row_concept(row)
        for keyword, feature in kw_feats:
            if keyword in concept and feature in by_feature and feature not in EXCLUDED_FEATURE_IDS:
                doc = by_feature[feature]
                if doc.path not in used:
                    result[i] = doc
                    used.add(doc.path)
                    break
    # 2nd pass: 残り行を未使用doc→全docの位置順で埋める（全docが必ずどこかに出るように）
    fill = [d for d in docs if d.path not in used] + [d for d in docs if d.path in used]
    fi = 0
    for i in range(len(rows)):
        if result[i] is None:
            result[i] = fill[min(fi, len(fill) - 1)]
            fi += 1
    return result


def step_rows(business_title: str, pattern: Pattern, docs: list[DesignDoc]) -> list[tuple[str, str, str, str, str]]:
    rows = normal_flow_rows(pattern)
    result: list[tuple[str, str, str, str, str]] = []
    main_actor = actor_meta(business_title)[0]
    non_eccube = is_non_eccube_pattern(pattern)
    step_docs = assign_step_docs(business_title, pattern, docs)
    for idx, row in enumerate(rows, 1):
        actor = infer_actor(row, main_actor)
        action = business_action_from_row(row, pattern.name)
        doc = step_docs[idx - 1]
        feature = doc.feature_no if doc else "-"
        if non_eccube:
            screen = NON_ECCUBE_SCREEN
            expect = NON_ECCUBE_EXPECT
        else:
            screen = doc.title if doc else "業務フロー該当画面"
            expect = expected_from_operation(action)
        result.append((actor, action, screen, feature, expect))
    return result


def infer_actor(text: str, default_actor: str) -> str:
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
    value = re.sub(r"^-?\s*R\d+:\s*", "", row).strip()
    value = re.sub(r"^\d+(?:-\d+)?\s*", "", value).strip()
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


def normalize_business_sentence(value: str, append_action: bool = False) -> str:
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


def seed_suffix(s: Scenario) -> str:
    code = BUSINESS_CODES.get(s.business_title, ("FLOW", "", "", "", ""))[0]
    number = re.sub(r"\D", "", s.pattern.number) or "1"
    return f"{code}-{int(number):03d}"


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


def render_execution_steps(s: Scenario, seed: dict[str, str]) -> str:
    rows = []
    for idx, (actor, action, screen, feature, expect) in enumerate(step_rows(s.business_title, s.pattern, s.docs), 1):
        target = primary_target(seed)
        if s.non_eccube:
            operation = f"メール/電話/外部アプリ（Thunderbird等）で {target} の顧客に「{action}」を実施する（EC-CUBEは参照のみ）"
            confirmation = expect
        else:
            operation = f"{screen}を開き、{target} を検索して「{action}」を実行する"
            confirmation = concrete_confirmation(expect, seed)
        rows.append(f"| {idx} | {actor} | {operation} | {target} | {confirmation} |")
    return "\n".join(rows)


def render_alternative_execution_steps(s: Scenario, seed: dict[str, str]) -> str:
    rows: list[str] = []
    docs = s.docs or []
    for idx, (branch_id, case) in enumerate(edge_case_branch_ids(s.edge_cases), 1):
        actor = actor_meta(s.business_title)[0]
        source = case.source_row or case.condition
        if case.source_row:
            actor = infer_actor(source, actor)
        screen = docs[min(idx - 1, len(docs) - 1)].title if docs else "業務フロー該当画面"
        target = primary_target(seed)
        operation = f"{screen}で {target} を対象に、条件「{case.condition}」となるデータまたは操作を実行する"
        expected = f"{case.expected}。確認対象: {case.observation}"
        rows.append(f"| {idx} | {branch_id} | {actor} | {operation} | {target} | {expected} |")
    return "\n".join(rows)


def render_scenario(s: Scenario, repo: Path) -> str:
    main, sub, systems, priority = actor_meta(s.business_title)
    seed = execution_seed(s)
    related_doc_lines = "\n".join(f"  - `{d.path}`" for d in s.html_docs) or "  - `UNRESOLVED_HTML_DESIGN_DOC`"
    trace_rows = []
    for d in s.docs:
        e2e = f"integration_test/e2e/{d.path.stem.replace('-', '_')}_e2e_cases.md"
        trace_rows.append(f"  | {d.title} | {d.feature_no} | `{d.path}` | `{e2e}` |")
    if not trace_rows:
        trace_rows.append("  | UNRESOLVED_FUNCTION_SPEC | - | - | - |")
    step_lines = []
    for idx, (actor, action, screen, feature, expect) in enumerate(step_rows(s.business_title, s.pattern, s.docs), 1):
        step_lines.append(f"| {idx} | {actor} | {action} | {screen}（{feature}） | {expect} |")
    alt_lines = render_edge_case_rows(s.edge_cases)
    coverage_lines = "\n".join(
        f"| {name} | {coverage_mark(value)} |" for name, value in s.coverage.items()
    )
    seed_table = render_seed_table(seed)
    execution_steps = render_execution_steps(s, seed)
    alt_execution_steps = render_alternative_execution_steps(s, seed)
    expected_feature_numbers = ", ".join(expected_features(s.business_title, s.pattern)) or "-"
    actual_feature_numbers = ", ".join(d.feature_no for d in s.docs if d.feature_no != "-") or "-"
    edge_summary = (
        f"| {len(s.edge_cases)} | {html_escape_br(case.condition for case in s.edge_cases[:4])} | "
        f"{html_escape_br(case.observation for case in s.edge_cases[:4])} |"
    )
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
- **目的**: {s.pattern.name}を、関連画面・外部システムを横断して業務完了状態まで確認する。
- **分類**: 正常系 / 代替系 / 異常系
- **優先度**: {priority}{non_eccube_note}{dup_note}
- **業務トリガー**: {s.pattern.name}が必要になったとき。
- **トレース元要件**:
  - 業務フロー番号: {s.business_title} / パターン{s.pattern.number}
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

## メインフロー（正常系）
| # | 担当者 | 業務行動 | 利用画面・機能 | 確認する業務結果 |
|---|---|---|---|---|
{chr(10).join(step_lines)}

## 実行手順（正常系）
| # | 担当者 | 操作 | 入力/対象 | 期待結果 |
|---|---|---|---|---|
{execution_steps}

## 代替フロー / 異常系分岐
| 分岐ID | 起点# | 条件 | 期待挙動 | 確認対象 |
|---|---|---|---|---|
{alt_lines}

## 実行手順（代替系・異常系）
| # | 分岐ID | 担当者 | 操作 | 入力/対象 | 期待結果 |
|---|---|---|---|---|---|
{alt_execution_steps}

## 完了条件（業務的ゴール／データ状態の最終確認）
- {s.pattern.name}の対象データが、業務フロー上の次工程または完了状態として追跡できる。
- 画面、CSV/帳票、メール、外部システムのいずれかで、処理結果が確認できる。

## システムテストカバレッジ
| 観点 | カバー |
|---|---|
{coverage_lines}

## エッジケース要約
| 件数 | 主なエッジケース | 確認対象 |
|---|---|---|
{edge_summary}

## トレーサビリティ
- **カバーする業務フロー番号**: {s.business_title} / パターン{s.pattern.number}
- **期待する主要機能No**: {expected_feature_numbers}
- **シナリオに紐づく機能No**: {actual_feature_numbers}
- **触れる画面と既存ケース**:
  | 画面 | 機能No | 機能仕様 | 既存ケース |
  |---|---|---|---|
{chr(10).join(trace_rows)}
- **関連HTML設計書**:
{related_doc_lines}
- **関連テスト観点**: 業務フロー、画面遷移、ステータス更新、CSV/帳票、メール、外部連携、DB更新。
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
    return "\n".join(rows)


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
        kind = "A" if any(word in row for word in ("キャンセル", "返金", "差戻", "棄却", "却下", "期限超過")) else "E"
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
        EdgeCase("E", "GMO決済またはポイント付与に失敗する", "参加確定にせず、決済・付与結果を確認できる状態にする", "決済状態、ポイント付与結果、受付状態"),
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


def edge_case_matches(case: EdgeCase, text: str, systems: str) -> bool:
    haystack = text + " " + systems
    keyword_groups = {
        "権限": ("権限", "担当者", "社員", "アルバイト"),
        "検索": ("検索", "一覧", "対象", "確認"),
        "重複": ("重複", "二重", "入庫", "登録", "更新", "取込"),
        "入力": ("入力", "登録", "CSV", "コード", "フォーム", "変更"),
        "在庫": ("在庫", "入庫", "出庫", "棚卸", "移動", "欠品", "ピック"),
        "決済": ("決済", "入金", "支払", "GMO", "返金"),
        "返金": ("返金", "キャンセル", "取消"),
        "CSV": ("CSV", "インポート", "取込", "出力"),
        "本人確認": ("本人確認", "書留", "買取"),
        "配送": ("発送", "配送", "送り状", "海外"),
        "公開": ("公開", "非公開", "発売", "商品"),
        "価格": ("価格", "セール", "金額"),
        "定員": ("イベント", "受付", "定員", "申込"),
        "デッキ": ("デッキ", "大会", "カード"),
    }
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
    text = pattern.name + " " + " ".join(pattern.rows)
    systems = actor_meta(business_title)[2]
    # 業務フロー本文由来の分岐 → パターン固有 → 業務単位 → 共通、の優先順で採用する。
    selected: list[EdgeCase] = edge_cases_from_branch_rows(pattern)
    selected.extend(pattern_specific_edge_cases(pattern))
    for case in BUSINESS_EDGE_CASES.get(business_title, []):
        if edge_case_matches(case, text, systems) or len(selected) < 2:
            selected.append(case)
    for case in COMMON_EDGE_CASES:
        if edge_case_matches(case, text, systems) or len(selected) < 4:
            selected.append(case)
    deduped: list[EdgeCase] = []
    seen: set[tuple[str, str]] = set()
    for case in selected:
        key = (case.kind, case.condition)
        if key not in seen:
            seen.add(key)
            deduped.append(case)
    return deduped[:6]


def coverage_for(business_title: str, pattern: Pattern, docs: list[DesignDoc]) -> dict[str, bool]:
    text = business_title + " " + pattern.name + " " + " ".join(pattern.rows) + " " + " ".join(d.title for d in docs)
    systems = actor_meta(business_title)[2]
    return {
        "正常系": True,
        "代替系": True,
        "異常系": True,
        "外部連携": any(word in text + systems for word in ("スマレジ", "GMO", "MTG", "Wordpress", "ポイント", "AWS", "Backlog", "メール", "海外発送", "S3")),
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
    docs = build_design_index(repo)
    candidates: list[tuple[Path, str, str, str, Pattern]] = []
    for flow_path, flow_title, business_title, text in discover_flows(repo, only):
        for pattern in parse_patterns(text):
            candidates.append((flow_path, flow_title, business_title, text, pattern))
    candidates = dedupe_patterns(candidates)
    # 同一業務フローファイル内で「同じ番号だが別名」のパターンを検出（在庫管理 #7 等）。
    # codexレビュー指摘#5：番号の欠落/重複で追跡が曖昧になる問題を可視化する。
    number_names: dict[tuple[Path, str], set[str]] = {}
    for flow_path, _flow_title, _business_title, _text, pattern in candidates:
        number_names.setdefault((flow_path, pattern.number), set()).add(normalize_name(pattern.name))
    scenarios: list[Scenario] = []
    counters: dict[str, int] = {}
    for flow_path, _flow_title, business_title, text, pattern in candidates:
        code = BUSINESS_CODES.get(business_title, ("FLOW", "", "", "", ""))[0]
        counters[code] = counters.get(code, 0) + 1
        sid = scenario_id(business_title, pattern, counters[code])
        title = pattern.name
        rel_docs, html_docs = related_docs_with_dictionary(business_title, text, pattern, docs, max_docs)
        coverage = coverage_for(business_title, pattern, rel_docs)
        edge_cases = edge_cases_for(business_title, pattern)
        non_eccube = is_non_eccube_pattern(pattern)
        dup_number = len(number_names.get((flow_path, pattern.number), set())) > 1
        scenarios.append(Scenario(sid, title, business_title, flow_path, pattern, rel_docs, html_docs, coverage, edge_cases, non_eccube, dup_number))
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
    rows = ["# シナリオ一覧（自動生成）", "", "| シナリオID | 業務 | 業務フローキー | 概要 | 主アクター | 主要設計書 | 優先度 |", "|---|---|---|---|---|---|---|"]
    for s in scenarios:
        main, _, _, priority = actor_meta(s.business_title)
        docs = ", ".join(d.feature_no for d in s.docs[:4]) or "-"
        flow_key = f"{s.flow_path}#{s.pattern.number}:{s.title}"
        rows.append(f"| {s.sid} | {s.business_title} | `{flow_key}` | {s.title} | {main} | {docs} | {priority} |")
    trace = ["# トレーサビリティ（自動生成）", "", "| 業務 | シナリオID | 業務フロー出典 | 期待機能No | 紐づけ機能No | 関連機能仕様 | 関連HTML設計書 |", "|---|---|---|---|---|---|---|"]
    for s in scenarios:
        expected = ", ".join(expected_features(s.business_title, s.pattern)) or "-"
        actual = ", ".join(d.feature_no for d in s.docs if d.feature_no != "-") or "-"
        fdocs = "<br>".join(f"`{d.path}`" for d in s.docs) or "`UNRESOLVED_FUNCTION_SPEC`"
        hdocs = "<br>".join(f"`{d.path}`" for d in s.html_docs) or "`UNRESOLVED_HTML_DESIGN_DOC`"
        flow_key = f"{s.flow_path}#{s.pattern.number}:{s.title}"
        trace.append(f"| {s.business_title} | {s.sid} | `{flow_key}` | {expected} | {actual} | {fdocs} | {hdocs} |")
    coverage = [
        "# システムテストカバレッジ表（自動生成）",
        "",
        "| 業務 | 業務フローキー | シナリオID | 正常系 | 代替系 | 異常系 | 外部連携 | データ更新 | CSV/帳票 | メール/通知 | 正常系手順数 | 代替/異常手順数 | 期待機能不足 | HTML不足 | エッジケース数 | 主なエッジケース | 確認対象 | 非EC-CUBE作業 | 番号重複警告 |",
        "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|",
    ]
    for s in scenarios:
        c = s.coverage
        expected_features_set = set(expected_features(s.business_title, s.pattern))
        actual_features_set = {d.feature_no for d in s.docs if d.feature_no != "-"}
        feature_gap = ", ".join(sorted(expected_features_set - actual_features_set)) or "-"
        expected_html_set = set(EXPECTED_HTML.get(s.business_title, ()))
        actual_html_set = {d.path.name[:4] for d in s.html_docs}
        html_gap = ", ".join(sorted(expected_html_set - actual_html_set)) or "-"
        flow_key = f"{s.flow_path}#{s.pattern.number}:{s.title}"
        coverage.append(
            f"| {s.business_title} | `{flow_key}` | {s.sid} | "
            f"{coverage_mark(c['正常系'])} | {coverage_mark(c['代替系'])} | {coverage_mark(c['異常系'])} | "
            f"{coverage_mark(c['外部連携'])} | {coverage_mark(c['データ更新'])} | "
            f"{coverage_mark(c['CSV/帳票'])} | {coverage_mark(c['メール/通知'])} | "
            f"{len(step_rows(s.business_title, s.pattern, s.docs))} | {len(s.edge_cases)} | "
            f"{feature_gap} | {html_gap} | "
            f"{len(s.edge_cases)} | {html_escape_br(case.condition for case in s.edge_cases[:3])} | "
            f"{html_escape_br(case.observation for case in s.edge_cases[:3])} | "
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
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
