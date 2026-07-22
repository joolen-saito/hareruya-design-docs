#!/usr/bin/env python3
"""Generate Hareruya integration test case Markdown from HTML design docs.

The generator is intentionally deterministic: it extracts coarse behavior cues
from each HTML design document, maps them to integration-test viewpoints, and
writes a Markdown file with a 10-column TSV block.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import html
import re
from collections import Counter, OrderedDict
from dataclasses import dataclass
from html.parser import HTMLParser
from io import StringIO
from pathlib import Path


HEADER = [
    "機能名",
    "テストID",
    "I/FID",
    "テスト観点",
    "優先度",
    "テスト項目名",
    "前提条件",
    "入力データ/リクエスト内容",
    "操作手順/実行方法",
    "期待結果／レスポンス",
]

COL_FEATURE = 0
COL_TEST_ID = 1
COL_IFID = 2
COL_TEST_VIEWPOINT = 3
COL_PRIORITY = 4
COL_ITEM_NAME = 5
COL_PREMISE = 6
COL_INPUT = 7
COL_STEPS = 8
COL_EXPECT = 9

FORBIDDEN_PATTERNS = [
    r"UI標準",
    r"\.cursor/docs/テスト観点",
    r"設計書に記載のとおり",
    r"設計どおり",
    r"［システム機能設計書/共通コンポーネント設計書の記載通り(?:の挙動)?］",
    r"［システム機能設計書の記載通り］",
]

EXCLUDED_OUTPUT_STEMS = {
    "b16_01_batch_infra_wordpress_to_s3_sync",
    "b16_02_batch_infra_s3_to_wp_admin_sync",
    "b16_03_batch_infra_s3_to_wp_article1_sync",
    "b16_04_batch_infra_s3_to_wp_article2_sync",
    "b16_05_batch_infra_waf_access_log_summary",
    "b16_07_batch_infra_redash_database_create",
    "b16_08_batch_infra_ec_cube_sync_directory",
    "b16_12_batch_infra_database_deadlock_detect",
    # Ph2（フェーズ2以降で対応）機能。Excel基本設計書の図形注記
    # 「…はPh2で対応するため、Ph1では実装しない」等を根拠に、機能全体が
    # Ph2のものを結合テスト生成・集約から除外する。
    "m03_43_admin_product_product_simple_low_price_csv_export",
    "m04_06_admin_stock_stock_shortage_csv_export",
    "m04_07_admin_stock_stock_warning_csv_export",
    "m06_13_admin_store_purchase_purchase_store_product_cancel_csv_export",
    "m08_11_admin_customer_customer_analysis_tag_master",
    "m08_15_admin_customer_customer_analysis_tag_csv_export",
    "m08_16_admin_customer_customer_analysis_tag_csv_import",
    "a06_14_api_store_purchase_otc_buy_order_partial_cancel_sync",
    "b01_02_batch_data_stock_shortage",
    "b01_03_batch_data_stock_warning",
    "f02_05_front_global_nav_global_nav_notification",
}


@dataclass(frozen=True)
class Viewpoint:
    no: str
    it_id: str
    category: str
    large: str
    middle: str
    small: str
    text: str
    layer: str = "結合"

    @property
    def label(self) -> str:
        return self.small if self.small and self.small != "-" else self.middle

    @property
    def search_text(self) -> str:
        return "\t".join(
            [self.it_id, self.category, self.large, self.middle, self.small, self.text]
        )


@dataclass
class HtmlDoc:
    path: Path
    title: str
    text: str
    headings: list[str]
    labels: list[str]
    cues: list[tuple[str, str]]


class TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self._skip_depth = 0
        self._current_heading: str | None = None
        self._current_label: str | None = None
        self._current_cell: str | None = None
        self._buf: list[str] = []
        self._cell_buf: list[str] = []
        self._row_cells: list[str] = []
        self.title_parts: list[str] = []
        self.headings: list[str] = []
        self.labels: list[str] = []
        self.rows: list[list[str]] = []
        self.text_parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in {"script", "style", "noscript"}:
            self._skip_depth += 1
            return
        if self._skip_depth:
            return
        if tag == "title":
            self._current_label = "title"
            self._buf = []
        elif tag in {"h1", "h2", "h3"}:
            self._current_heading = tag
            self._buf = []
        elif tag in {"th", "dt"}:
            self._current_label = tag
            self._buf = []
        elif tag == "td":
            self._current_cell = tag
            self._cell_buf = []
        elif tag in {"p", "div", "section", "article", "tr", "li", "br"}:
            self.text_parts.append("\n")

    def handle_endtag(self, tag: str) -> None:
        if tag in {"script", "style", "noscript"} and self._skip_depth:
            self._skip_depth -= 1
            return
        if self._skip_depth:
            return
        if tag == "title" and self._current_label == "title":
            val = clean_space("".join(self._buf))
            if val:
                self.title_parts.append(val)
            self._current_label = None
            self._buf = []
        elif tag in {"h1", "h2", "h3"} and self._current_heading == tag:
            val = clean_space("".join(self._buf))
            if val:
                self.headings.append(val)
                self.text_parts.append(f"\n{val}\n")
            self._current_heading = None
            self._buf = []
        elif tag in {"th", "dt"} and self._current_label == tag:
            val = clean_space("".join(self._buf))
            if val:
                self.labels.append(val)
                self.text_parts.append(f"\n{val}\n")
            self._current_label = None
            self._buf = []
        elif tag == "td" and self._current_cell == tag:
            val = clean_space("".join(self._cell_buf))
            if val:
                self._row_cells.append(val)
            self._current_cell = None
            self._cell_buf = []
        elif tag == "tr":
            if len(self._row_cells) >= 2:
                self.rows.append(self._row_cells)
            self._row_cells = []

    def handle_data(self, data: str) -> None:
        if self._skip_depth:
            return
        if self._current_heading or self._current_label:
            self._buf.append(data)
        if self._current_cell:
            self._cell_buf.append(data)
        self.text_parts.append(data)


def clean_space(value: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


def row_execution_key(row: list[str]) -> tuple[str, str, str, str]:
    return (
        clean_space(row[COL_PREMISE]),
        clean_space(row[COL_INPUT]),
        clean_space(row[COL_STEPS]),
        clean_space(row[COL_EXPECT]),
    )


def dedupe_execution_rows(rows: list[list[str]]) -> list[list[str]]:
    out: list[list[str]] = []
    seen: set[tuple[str, str, str]] = set()
    for row in rows:
        key = row_execution_key(row)
        if key in seen:
            continue
        seen.add(key)
        out.append(row)
    return out


def single_line_cell(value: str) -> str:
    return re.sub(r"\s*\r?\n\s*", " / ", value).strip()


def single_line_rows(rows: list[list[str]]) -> list[list[str]]:
    return [[single_line_cell(cell) for cell in row] for row in rows]


def scoped_target(vp: Viewpoint) -> str:
    return clean_space(vp.label or vp.middle or vp.it_id)


def feature_scoped_input(feature_name: str, value: str) -> str:
    value = clean_space(value)
    if value.startswith(feature_name):
        return value
    return f"{feature_name}で{value}"


def sanitize_sentence(value: str) -> str:
    result = value
    for pattern in FORBIDDEN_PATTERNS:
        result = re.sub(pattern, "期待される結果", result)
    result = result.replace("または", "もしくは")
    return clean_space(result)


# テスト層: 結合層のみを機能×観点のクロス積対象とする。他層は各行き先で担保。
ALLOWED_LAYER_VALUES = {"結合", "UT", "委譲", "e2e", "非機能", "対象外", "統合"}
DEFAULT_XPROD_LAYERS = {"結合"}


def filter_viewpoints(viewpoints: list["Viewpoint"], allowed: set[str]) -> list["Viewpoint"]:
    """クロス積対象をテスト層で絞る唯一の入口。make_rows がこれを通す。"""
    return [vp for vp in viewpoints if vp.layer in allowed]


def read_viewpoints(path: Path) -> list[Viewpoint]:
    rows = list(csv.DictReader(path.read_text(encoding="utf-8").splitlines(), delimiter="\t"))
    viewpoints: list[Viewpoint] = []
    for row in rows:
        if not row.get("No") or not row.get("IT-ID"):
            continue
        viewpoints.append(
            Viewpoint(
                no=row.get("No", ""),
                it_id=row.get("IT-ID", ""),
                category=row.get("分類", ""),
                large=row.get("大項目", ""),
                middle=row.get("中項目", ""),
                small=row.get("小項目", ""),
                text=sanitize_sentence(row.get("観点", "")),
                layer=(row.get("テスト層") or "結合").strip() or "結合",
            )
        )
    return viewpoints


def read_html(path: Path) -> HtmlDoc:
    parser = TextExtractor()
    parser.feed(path.read_text(encoding="utf-8", errors="ignore"))
    text = clean_space("\n".join(parser.text_parts))
    title = ""
    if parser.title_parts:
        title = parser.title_parts[0]
    elif parser.headings:
        title = parser.headings[0]
    if not title:
        title = path.stem
    title = normalize_title(title, path)
    return HtmlDoc(
        path=path,
        title=title,
        text=text,
        headings=parser.headings,
        labels=parser.labels,
        cues=extract_cues(parser.rows),
    )


def extract_cues(rows: list[list[str]]) -> list[tuple[str, str]]:
    cues: list[tuple[str, str]] = []
    skip_first = {
        "用語",
        "項目名",
        "テーブル",
        "列",
        "種類",
        "レイアウト",
        "ブロック",
        "ブロック配置",
        "セクション",
        "未使用ブロック",
        "端末種別",
        "ページ割り当て",
        "既定レイアウト",
    }
    for row in rows:
        cells = [clean_space(c) for c in row if clean_space(c)]
        if len(cells) < 2:
            continue
        subject = cells[0]
        if subject in skip_first or subject.endswith("ラベル"):
            continue
        if re.fullmatch(r"[0-9０-９]+(?:[-ー][0-9０-９]+)?", subject) or len(subject) <= 1:
            continue
        expected = cells[-1]
        if len(expected) < 6:
            continue
        combined = f"{subject} {expected}"
        if not has_any(combined, ["表示", "開く", "押下", "保存", "登録", "更新", "削除", "遷移", "エラー", "警告", "返す", "出力", "取得", "送信", "確認", "利用"]):
            continue
        cues.append((shorten(subject, 40), shorten(sanitize_sentence(expected), 110)))
    deduped: list[tuple[str, str]] = []
    seen: set[tuple[str, str]] = set()
    for cue in cues:
        if cue in seen:
            continue
        seen.add(cue)
        deduped.append(cue)
    return deduped[:40]


def shorten(value: str, max_len: int) -> str:
    value = clean_space(value).strip("。")
    for sep in ["。", "；", ";"]:
        if sep in value:
            value = value.split(sep, 1)[0]
            break
    return value[: max_len - 1] + "…" if len(value) > max_len else value


def cue_step(subject: str) -> str:
    if has_any(subject, ["押下", "開く", "保存", "削除", "送信", "入力", "実行", "選択", "検索", "ダウンロード", "アップロード"]):
        return subject
    return f"{subject}を確認する"


def cue_judgment(expected: str) -> str:
    expected = clean_space(expected).rstrip("。")
    if expected.endswith("こと"):
        return f"{expected}。"
    verb_endings = (
        "する",
        "できる",
        "できない",
        "なる",
        "ならない",
        "ない",
        "いる",
        "いない",
        "ある",
        "返す",
        "返却する",
        "表示する",
        "表示しない",
        "開く",
        "扱う",
        "行う",
        "含む",
        "用いる",
        "持つ",
        "使う",
        "並ぶ",
        "戻る",
        "誘導する",
        "記録する",
        "保存する",
        "更新する",
        "削除する",
        "取得する",
        "送信する",
        "起きない",
    )
    if expected.endswith(verb_endings):
        return f"{expected}こと。"
    return f"{expected}であること。"


def normalize_title(title: str, path: Path) -> str:
    title = re.sub(r"\s*[-|｜]\s*(機能仕様書|基本設計仕様書|HTMLプレビュー).*$", "", title)
    title = re.sub(r"(機能仕様書|基本設計仕様書)$", "", title).strip(" _-　")
    if not title or title.lower() in {"untitled", "index"}:
        return path.stem
    return title


def output_stem(path: Path) -> str:
    stem = path.stem.lower()
    stem = re.sub(r"^[0-9]+_", "", stem)
    stem = re.sub(r"[^a-z0-9_]+", "_", stem)
    stem = re.sub(r"_+", "_", stem).strip("_")
    if not stem:
        digest = hashlib.sha1(str(path).encode("utf-8")).hexdigest()[:8]
        stem = f"case_{digest}"
    return stem


def is_excluded_output_stem(stem: str) -> bool:
    return stem in EXCLUDED_OUTPUT_STEMS


def test_prefix(stem: str) -> str:
    safe = stem.upper().replace("_", "-")
    safe = re.sub(r"[^A-Z0-9-]+", "-", safe).strip("-")
    return f"IT-{safe}"


def has_any(text: str, words: list[str]) -> bool:
    lower = text.lower()
    return any(word.lower() in lower for word in words)


def context_flags(doc: HtmlDoc) -> dict[str, bool]:
    path_blob = f"{doc.path.as_posix()} {doc.title}".lower()
    text_blob = f"{doc.title} {doc.text}"
    heading_blob = " ".join(doc.headings)
    cue_subject_blob = " ".join(subject for subject, _ in doc.cues)
    batch_by_path = bool(re.search(r"(^|/)(b\d+[-_]|batch)|[_/-]batch[_/-]?", path_blob))
    api_by_path = bool(re.search(r"(^|/)(a\d+[-_]|api)|[_/-]api[_/-]?", path_blob))
    file_by_path = has_any(
        path_blob,
        ["csv", "file", "s3", "pdf", "import", "export", "upload", "download", "print", "slip", "delivery_slips", "帳票", "ファイル"],
    )
    report_by_path = has_any(path_blob, ["pdf", "report", "帳票", "印刷", "print", "slip", "delivery_slips"])
    telegram_by_path = has_any(path_blob, ["telegram", "message", "socket", "tcp", "電文", "固定長"])
    messaging_by_path = has_any(path_blob, ["mq", "queue", "sqs", "messaging", "message_queue", "メッセージング", "キュー"])
    mail_by_path = has_any(path_blob, ["mail", "メール"])
    screen_by_path = has_any(path_blob, ["admin", "front", "画面", "管理画面", "フロント"])
    screen_doc = screen_by_path and not batch_by_path and not api_by_path
    search = has_any(path_blob, ["search", "list", "検索", "一覧"]) or (screen_doc and has_any(cue_subject_blob, ["検索", "一覧"]))
    create = has_any(path_blob, ["register", "add", "create", "entry"]) or (
        screen_doc
        and (
            has_any(cue_subject_blob, ["登録", "作成", "新規"])
            # 設計書本文・DB操作節からの検出（パス名に register 等が無くても永続化を拾う）
            or has_any(text_blob, ["履歴を登録", "履歴に残る", "履歴を記録", "記録する", "1件登録", "を登録する", "INSERT"])
        )
    )
    update = has_any(path_blob, ["edit", "update", "change", "bulk", "status"]) or (
        screen_doc
        and (
            has_any(cue_subject_blob, ["更新", "編集", "変更", "保存"])
            or has_any(text_blob, ["最終ログイン日時", "login_date", "日時を更新", "を更新する", "UPDATE"])
        )
    )
    delete = has_any(path_blob, ["delete", "cancel", "remove"]) or (screen_doc and has_any(cue_subject_blob, ["削除", "取消"]))
    realtime = has_any(text_blob, ["websocket", "web socket", "socket.io", "mercure", "リアルタイム通知", "プッシュ通知"]) or has_any(
        path_blob, ["websocket", "socket", "realtime", "notification", "push"]
    )
    return {
        "screen": screen_doc or (not batch_by_path and not api_by_path and not file_by_path),
        "validation": screen_doc
        and (
            has_any(text_blob, ["バリデーション", "入力項目", "必須", "最大", "最小", "桁", "validation"])
            or has_any(cue_subject_blob, ["入力", "送信", "保存", "登録", "更新", "検索"])
        ),
        "search": search,
        "create": create,
        "update": update,
        "delete": delete,
        "db": (screen_doc and (search or create or update or delete)) or (batch_by_path and has_any(text_blob, ["DB", "テーブル", "レコード"])),
        "api": api_by_path,
        "batch": batch_by_path,
        "file": file_by_path,
        "mail": mail_by_path or has_any(text_blob, ["メール送信", "送信メール"]),
        "security": has_any(text_blob, ["認証", "ログイン", "権限", "CSRF", "XSS", "Cookie", "セッション", "パスワード", "access"]),
        "operation": screen_doc and (screen_by_path or has_any(text_blob, ["ボタン", "押下", "クリック", "遷移", "ポップアップ", "ダイアログ", "閉じる", "戻る", "submit"])),
        "external": api_by_path or has_any(path_blob, ["external", "webhook", "s3", "smaregi", "スマレジ", "連携"]),
        "report": report_by_path,
        "telegram": telegram_by_path or has_any(text_blob, ["固定長電文", "電文長", "ソケット", "TCP"]),
        "messaging": messaging_by_path or bool(re.search(r"(メッセージキュー|\\bMQ\\b|\\bSQS\\b|message queue)", text_blob, re.IGNORECASE)),
    }


def match_rule(vp: Viewpoint, flags: dict[str, bool]) -> str | None:
    """観点を本機能へ紐付けた「適用ルールID」を返す。非該当なら None。

    viewpoint_matches の真偽だけでは、なぜ紐付いた/紐付かなかったかが成果物に残らず、
    過剰捺印(No.109/111が無関係画面へ)やゼロ生成(RISK観点8件)の原因追跡ができない。
    ルールIDをトレーサビリティ台帳へ出力し、適用根拠を監査可能にする。

    分岐の順序・条件は従来の viewpoint_matches と完全に同一(挙動不変)。
    """
    s = vp.search_text
    # 通知(WebSocket等)はリアルタイム通知機能のみ対象。通常の画面・認証機能では選択しない。
    if vp.category == "ウェブアプリケーション" and vp.large == "通知":
        return "R01-REALTIME-NOTIFY" if flags.get("realtime", False) else None
    if flags["validation"] and vp.category == "バリデーション":
        return "R02-VALIDATION"
    if flags["screen"] and vp.category == "ウェブアプリケーション":
        if vp.large in {"画面表示", "画面操作", "認証・認可", "エラー表示", "フロント", "管理画面", "管理画面-公開側"}:
            return "R03-SCREEN-WEBAPP-LARGE"
        if flags["security"] and any(k in s for k in ["認証", "権限", "CSRF", "XSS", "Cookie", "セッション"]):
            return "R04-SCREEN-WEBAPP-SECURITY"
        # ここで打ち切るため、許可リストに無い大項目(在庫引当/状態遷移/販売価格等)は
        # 一切紐付かない。RISK観点8件がゼロ生成した箇所。是正はP0bで行う。
        return None
    if flags["screen"] and vp.category == "ログ出力" and flags["security"]:
        return "R06-SCREEN-LOG-SECURITY"
    if (
        flags["operation"]
        and vp.category == "ウェブアプリケーション"
        and vp.large == "画面操作"
        and any(k in s for k in ["操作起点", "ボタン", "押下", "遷移", "ポップアップ", "ダイアログ"])
    ):
        return "R07-OPERATION-SCREEN"
    if flags["db"] and vp.category == "データベースアクセス" and vp.large == "DB操作":
        if "検索" in s:
            return "R08-DB-SEARCH" if flags["search"] else None
        if "登録" in s:
            return "R08-DB-CREATE" if flags["create"] else None
        if "更新" in s:
            return "R08-DB-UPDATE" if flags["update"] else None
        if "削除" in s:
            return "R08-DB-DELETE" if flags["delete"] else None
        return "R08-DB-OTHER"
    if flags["db"] and vp.category == "データベースアクセス" and vp.large == "DB制御" and (flags["create"] or flags["update"] or flags["delete"]):
        return "R09-DB-CONTROL"
    if flags["api"] and vp.category == "ウェブサービス":
        return "R10-API-WEBSERVICE"
    if flags["telegram"] and vp.category == "電文処理":
        return "R11-TELEGRAM"
    if flags["batch"] and vp.category == "バッチアプリケーション":
        return "R12-BATCH"
    if flags["file"] and vp.category == "ファイル処理":
        report_only = vp.it_id == "IT-18" or any(k in s for k in ["帳票", "PDF", "フォント", "余白", "見切れ", "印刷"])
        if report_only and not flags["report"]:
            return None
        return "R13-FILE"
    if flags["mail"] and vp.category == "メール処理":
        return "R14-MAIL"
    if flags["messaging"] and vp.category == "メッセージング":
        return "R15-MESSAGING"
    if flags["external"] and vp.category == "ウェブサービス" and "外部連携" in s:
        return "R16-EXTERNAL-WEBSERVICE"
    return None


def viewpoint_matches(vp: Viewpoint, flags: dict[str, bool]) -> bool:
    return match_rule(vp, flags) is not None


# --- 適用述語(applicability)オーバーライド ---------------------------------
# 一部の観点は(分類,大項目)の粗いマッチでは過剰捺印/ゼロ生成になる。
# 設計書証拠でのLLM3値判定(該当/非該当/適用未確定)を viewpoint_applicability.tsv に
# 持ち、制御対象観点は「該当」の機能にのみ生成する(証拠駆動)。
# - No.109/110/111(楽観/悲観ロック/ロールバック): 過剰捺印を是正(非該当を落とす)
# - No.517-527のRISK観点: ゼロ生成を是正(該当を追加。粗いマッチはNoneでも生成)
CONTROLLED_VIEWPOINTS: set[int] = set()
_APPLICABILITY: dict[tuple[str, str], str] = {}


def load_applicability(repo: Path) -> None:
    global _APPLICABILITY, CONTROLLED_VIEWPOINTS
    path = repo / "integration_test" / "viewpoint_applicability.tsv"
    if not path.exists():
        return
    table: dict[tuple[str, str], str] = {}
    controlled: set[int] = set()
    with path.open(encoding="utf-8") as f:
        reader = csv.reader(f, delimiter="\t")
        next(reader, None)
        for row in reader:
            if len(row) < 3:
                continue
            no, fid, verdict = row[0].strip(), row[1].strip(), row[2].strip()
            table[(no, fid)] = verdict
            try:
                controlled.add(int(no))
            except ValueError:
                pass
    _APPLICABILITY = table
    CONTROLLED_VIEWPOINTS = controlled


def func_id(stem: str) -> str | None:
    """output_stem(例 f01_01_front_...) → 機能ID(f01-01)。適用述語テーブルの結合キー。"""
    m = re.match(r"([a-zA-Z])(\d{2})[-_](\d{2})", stem)
    return f"{m.group(1).lower()}{m.group(2)}-{m.group(3)}" if m else None


def applicability_decision(vp: Viewpoint, func: str | None) -> bool | None:
    """True=生成する / False=生成しない / None=適用述語の管轄外(粗いマッチに委ねる)。

    制御対象観点は「該当」のみ生成。非該当・適用未確定・判定なしは生成しない
    (適用未確定は要判定=シナリオ/人手裁定へ委譲し、結合母集合には入れない)。
    """
    try:
        no = int(vp.no)
    except (TypeError, ValueError):
        return None
    if no not in CONTROLLED_VIEWPOINTS:
        return None
    return _APPLICABILITY.get((vp.no, func or "")) == "該当"


def limit_viewpoints(selected: list[Viewpoint], flags: dict[str, bool], max_cases: int) -> list[Viewpoint]:
    def score(vp: Viewpoint) -> tuple[int, int]:
        s = vp.search_text
        value = 0
        if flags["operation"] and vp.category == "ウェブアプリケーション" and any(k in s for k in ["操作起点", "ボタン", "押下", "遷移", "ポップアップ", "ダイアログ"]):
            value += 80
        if flags["validation"] and vp.category == "バリデーション":
            value += 70
        if flags["db"] and vp.category == "データベースアクセス" and vp.large == "DB操作":
            value += 65
        if flags["api"] and vp.category == "ウェブサービス":
            value += 60
        if flags["telegram"] and vp.category == "電文処理":
            value += 60
        if flags["file"] and vp.category == "ファイル処理":
            value += 60
        if flags["report"] and vp.it_id == "IT-18":
            value += 85
        if flags["batch"] and vp.category == "バッチアプリケーション":
            value += 60
        if flags["messaging"] and vp.category == "メッセージング":
            value += 60
        if flags["security"] and any(k in s for k in ["認証", "権限", "CSRF", "XSS", "Cookie", "監査"]):
            value += 55
        # セキュリティ機能では、ログ出力・管理画面セキュリティ・認証認可の観点が
        # DB操作の条件付き観点に押し出されないよう底上げする。
        if flags["security"] and vp.category == "ログ出力":
            value += 58
        if flags["security"] and vp.category == "ウェブアプリケーション" and vp.large in {"管理画面", "認証・認可"}:
            value += 58
        return (-value, int(vp.no))

    return sorted(selected, key=score)[:max_cases]


def priority(vp: Viewpoint, flags: dict[str, bool]) -> str:
    s = vp.search_text
    if any(k in s for k in ["削除", "登録", "更新", "認証", "権限", "決済", "在庫", "ポイント", "外部連携", "バッチ", "セキュリティ"]):
        return "P1"
    if any(k in s for k in ["検索", "表示", "遷移", "バリデーション", "CSV", "ファイル", "メール"]):
        return "P2"
    return "P3"


def test_item_name(vp: Viewpoint, flags: dict[str, bool]) -> str:
    label = vp.label
    action = vp.middle
    if "DB操作" in vp.search_text:
        return f"{action}時の{label}確認"
    if "バリデーション" in vp.search_text:
        return f"{label}の入力検証"
    if any(k in vp.search_text for k in ["操作起点", "ボタン", "押下", "遷移", "ポップアップ", "ダイアログ"]):
        return f"{label}の操作結果確認"
    if flags["api"] and any(k in vp.search_text for k in ["API", "HTTP", "電文"]):
        return f"{label}のレスポンス確認"
    return f"{label}の結合確認"


def input_data(vp: Viewpoint, flags: dict[str, bool], cue: tuple[str, str] | None = None) -> str:
    s = vp.text
    target = scoped_target(vp)
    if "未入力" in s:
        return f"{target}の対象項目を未入力にする"
    if "最大長＋1" in s or "最大長+1" in s:
        return f"{target}の対象項目に最大長+1の値を指定する"
    if "最大長" in s:
        return f"{target}の対象項目に最大長の値を指定する"
    if "最小長－1" in s or "最小長-1" in s:
        return f"{target}の対象項目に最小長-1の値を指定する"
    if "最小長" in s:
        return f"{target}の対象項目に最小長の値を指定する"
    if "無効" in s or "存在しない" in s or "前方一致しない" in s or "完全一致しない" in s:
        return f"{target}で対象条件に該当しない値を指定する"
    if "有効" in s or "存在する" in s or "前方一致する" in s or "完全一致する" in s:
        return f"{target}で対象条件に該当する値を指定する"
    if flags["file"]:
        return f"{target}の対象ファイルと処理条件を指定する"
    if flags["api"]:
        return f"{target}の対象リクエストパラメータを指定する"
    if cue:
        return f"{cue[0]}の確認に必要な条件を指定する"
    return f"{target}を確認できる正常系データを指定する"


def steps(vp: Viewpoint, flags: dict[str, bool], cue: tuple[str, str] | None = None) -> str:
    s = vp.search_text
    target = scoped_target(vp)
    if flags["batch"] and "バッチ" in s:
        return f"1. {target}の対象ジョブを実行する\n2. 実行結果と副作用を確認する"
    if flags["api"] and any(k in s for k in ["API", "HTTP", "電文"]):
        return f"1. {target}の対象エンドポイントへリクエストを送信する\n2. レスポンスと後続状態を確認する"
    if flags["file"] and any(k in s for k in ["CSV", "帳票", "ファイル", "アップロード", "ダウンロード"]):
        return f"1. 対象画面で{target}のファイル処理を実行する\n2. 出力ファイルまたは取り込み結果を確認する"
    if vp.category == "データベースアクセス":
        return f"1. {target}の対象レコードと前提状態を用意する\n2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる\n3. 対象テーブルのレコード（区分・件数・更新値）を確認する"
    if flags["security"] and any(k in s for k in ["認証", "権限", "CSRF", "Cookie", "セッション", "試行", "監査", "ログイン"]):
        return f"1. {target}の認証・Cookie・セッション・試行制限など前提条件を設定する\n2. 対象の認証操作を実行する\n3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"
    if cue and flags["screen"]:
        return f"1. 対象画面を表示する\n2. {cue_step(cue[0])}\n3. 画面表示と後続状態を確認する"
    if flags["screen"]:
        return f"1. 対象画面を表示する\n2. {target}を確認する条件を入力して対象操作を実行する\n3. 画面表示と後続状態を確認する"
    return f"1. {target}の対象機能を実行する\n2. 実行結果を確認する"


def expected_result(vp: Viewpoint, flags: dict[str, bool], cue: tuple[str, str] | None = None) -> str:
    s = vp.text
    target = scoped_target(vp)
    if "エラーとならない" in s:
        return f"{target}でエラーが表示されず、対象処理を継続できること。"
    if "エラーとなる" in s:
        return f"{target}でエラーが表示され、対象処理が完了しないこと。"
    if "取得されない" in s or "取得できない" in s:
        return f"{target}の該当レコードが取得結果に含まれないこと。"
    if "取得される" in s or "取得できる" in s:
        return f"{target}の該当レコードが取得結果に含まれること。"
    if "登録されない" in s:
        return f"{target}の対象レコードが追加されないこと。"
    if "登録される" in s or "追加される" in s:
        return f"{target}の対象レコードが追加されること。"
    if "更新されない" in s:
        return f"{target}の対象レコードの値が変更されないこと。"
    if "更新される" in s:
        return f"{target}の対象レコードの値が変更されること。"
    if "削除されない" in s:
        return f"{target}の対象レコードが削除状態にならないこと。"
    if "削除される" in s:
        return f"{target}の対象レコードが削除状態になること。"
    if "遷移" in s:
        return cue_judgment(cue[1]) if cue else f"{target}の操作後に想定する画面へ遷移すること。"
    if any(k in s for k in ["ポップアップ", "ダイアログ", "確認"]):
        return cue_judgment(cue[1]) if cue else f"{target}の操作後に確認表示が表示されること。"
    if flags["api"] and any(k in vp.search_text for k in ["API", "HTTP", "電文"]):
        return f"HTTPステータスとレスポンス本文が{target}の処理結果と一致すること。"
    if flags["batch"] and "バッチ" in vp.search_text:
        return f"{target}のジョブ終了状態と処理件数が実行結果に記録されること。"
    if flags["file"] and any(k in vp.search_text for k in ["CSV", "帳票", "ファイル"]):
        return f"{target}のファイル出力内容または取り込み結果が対象データと一致すること。"
    if cue and flags["screen"]:
        return cue_judgment(cue[1])
    return sanitize_sentence(s)


def make_rows(
    doc: HtmlDoc,
    viewpoints: list[Viewpoint],
    max_cases: int,
    allowed_layers: set[str] | None = None,
) -> tuple[list[list[str]], list[Viewpoint], dict[str, bool]]:
    # テスト層フィルタの唯一のチョークポイント。make_rows を直接呼ぶ全スクリプト
    # (promote_it_cases_by_rules / promote_drift / export_unexpanded) もここで結合層に絞られる。
    allowed = allowed_layers if allowed_layers is not None else DEFAULT_XPROD_LAYERS
    viewpoints = filter_viewpoints(viewpoints, allowed)
    flags = context_flags(doc)
    func = func_id(output_stem(doc.path))
    matched = []
    for vp in viewpoints:
        decision = applicability_decision(vp, func)  # 制御対象観点は証拠駆動
        if decision is True:
            matched.append(vp)
        elif decision is False:
            continue  # 制御対象かつ非該当/適用未確定 → 生成しない
        elif viewpoint_matches(vp, flags):  # 管轄外は粗いマッチ
            matched.append(vp)
    ordered = limit_viewpoints(matched, flags, len(matched))
    prefix = test_prefix(output_stem(doc.path))
    rows: list[list[str]] = []
    selected: list[Viewpoint] = []
    seen_execution_keys: set[tuple[str, str, str, str]] = set()
    for candidate_idx, vp in enumerate(ordered, start=1):
        cue = doc.cues[(candidate_idx - 1) % len(doc.cues)] if doc.cues else None
        row = [
            doc.title,
            f"{prefix}-{len(rows) + 1:03d}",
            vp.it_id,
            vp.label,
            priority(vp, flags),
            test_item_name(vp, flags),
            f"{cue[0]}を試験できる状態である" if cue else "対象設計の機能が利用できる状態である",
            feature_scoped_input(f"{doc.title}（{output_stem(doc.path)}）", input_data(vp, flags, cue)),
            steps(vp, flags, cue),
            expected_result(vp, flags, cue),
        ]
        execution_key = row_execution_key(row)
        if execution_key in seen_execution_keys:
            continue
        seen_execution_keys.add(execution_key)
        rows.append(row)
        selected.append(vp)
        if len(rows) >= max_cases:
            break
    return rows, selected, flags


def write_tsv(rows: list[list[str]]) -> str:
    buf = StringIO()
    writer = csv.writer(buf, delimiter="\t", lineterminator="\n", quoting=csv.QUOTE_MINIMAL)
    writer.writerow(HEADER)
    writer.writerows(rows)
    return buf.getvalue().rstrip("\n")


def related_summary(selected: list[Viewpoint]) -> str:
    grouped: OrderedDict[str, set[str]] = OrderedDict()
    for vp in selected:
        grouped.setdefault(vp.it_id, set()).add(vp.label)
    lines = ["| 関連ID | 本機能での主な確認範囲 |", "|--------|------------------------|"]
    for it_id, labels in grouped.items():
        lines.append(f"| {it_id} | {'、'.join(sorted(labels))} |")
    return "\n".join(lines)


def out_of_scope(viewpoints: list[Viewpoint], selected: list[Viewpoint], flags: dict[str, bool]) -> str:
    selected_nos = {vp.no for vp in selected}
    groups: OrderedDict[str, tuple[str, set[str]]] = OrderedDict()
    capped: list[Viewpoint] = []  # viewpoint_matches=True だが上限/重複でTSV未収載（＝「非該当」ではない）
    for vp in viewpoints:
        if vp.no in selected_nos:
            continue
        if viewpoint_matches(vp, flags):
            # 本機能に該当するが、max_cases上限または実行キー重複で今回は収載されなかった観点。
            # これを「非該当」と報告すると事実と異なる（捏造）ため分離する。
            capped.append(vp)
            continue
        key = f"{vp.category} / {vp.large} / {vp.middle}"
        reason = reason_for(vp, flags)
        if key not in groups:
            groups[key] = (reason, set())
        groups[key][1].add(vp.it_id)
    lines = ["| 分類・範囲 | 理由 |", "|-----------|------|"]
    for key, (reason, ids) in list(groups.items())[:80]:
        lines.append(f"| {key}（{', '.join(sorted(ids))}） | {reason} |")
    if len(groups) > 80:
        lines.append(f"| その他 | 同種の対象外観点 {len(groups) - 80} 件は上記分類と同じ理由で対象外 |")
    if capped:
        nos = ", ".join(f"No.{vp.no}" for vp in sorted(capped, key=lambda v: int(v.no)))
        lines.append("")
        lines.append(
            f"> 別枠（非該当ではない）: 本機能に該当するが上限（max_cases）または実行キー重複で"
            f"今回未収載の結合観点 {len(capped)}件 — {nos}。上限緩和または個別ケース化で収載可能。"
        )
    return "\n".join(lines)


def reason_for(vp: Viewpoint, flags: dict[str, bool]) -> str:
    s = vp.search_text
    if "バッチ" in s and not flags["batch"]:
        return "本機能はバッチ処理を起動しないため"
    if any(k in s for k in ["API", "電文", "外部連携"]) and not flags["api"] and not flags["external"]:
        return "本機能は対象の外部I/Fを扱わないため"
    if any(k in s for k in ["CSV", "帳票", "ファイル", "S3"]) and not flags["file"]:
        return "本機能はファイル入出力を扱わないため"
    if "メール" in s and not flags["mail"]:
        return "本機能はメール送信を扱わないため"
    if "DB操作" in s:
        if "検索" in s and not flags["search"]:
            return "本機能に検索処理がないため"
        if "登録" in s and not flags["create"]:
            return "本機能に登録処理がないため"
        if "更新" in s and not flags["update"]:
            return "本機能に更新処理がないため"
        if "削除" in s and not flags["delete"]:
            return "本機能に削除処理がないため"
    if "バリデーション" in s and not flags["validation"]:
        return "本機能に入力検証対象がないため"
    if any(k in s for k in ["操作起点", "ボタン", "押下", "遷移", "ポップアップ"]) and not flags["operation"]:
        return "本機能に該当する画面操作起点がないため"
    return "元設計HTMLに該当する処理・I/Fがないため"


LAYER_DEST = {
    "結合": "結合テスト母集合（機能×観点のクロス積対象）。",
    "UT": "単体テスト粒度（単項目境界値・単機能ロジック）→単体テストで担保。表内に保持しマーク。",
    "委譲": "期待値を設計書へ委譲（「記載通り」）→機能別チェックリストへ降格。per機能で設計書の具体値を引用してケース化。",
    "e2e": "見た目／ブラウザ挙動→e2e（Playwright）＋手動で担保。",
    "非機能": "方式／性能／基盤（ロック方式・リトライ間隔・MQクラスタ・レート制限等）→非機能・障害試験へ分離。",
    "対象外": "合否オラクルを持たない管理・スコーピング指示→テスト観点ではないため除外。",
    "統合": "他観点に統合吸収済み（冗長削除）。統合先が同一バグクラスを検出するため重複クロス積を回避。行は監査用に保持しクロス積からのみ除外（codex+fable5承認）。",
}


def layer_exclusion(viewpoints: list[Viewpoint], allowed: set[str]) -> str:
    counts: Counter[str] = Counter(vp.layer for vp in viewpoints if vp.layer not in allowed)
    if not counts:
        return "（テスト層による母集合除外なし）"
    lines = ["| テスト層 | 除外観点数 | 行き先 |", "|---|---:|---|"]
    # 既知層を定義順で先に、未知層（typo等）も必ず表示する＝暗黙の切り捨てを作らない。
    known = ["結合", "UT", "委譲", "e2e", "非機能", "対象外", "統合"]
    for layer in known + sorted(set(counts) - set(known)):
        if counts.get(layer):
            dest = LAYER_DEST.get(layer, "⚠ 未知のテスト層。観点マスタの値を確認すること。")
            lines.append(f"| {layer} | {counts[layer]} | {dest} |")
    return "\n".join(lines)


def render_markdown(
    repo: Path,
    doc: HtmlDoc,
    viewpoints: list[Viewpoint],
    max_cases: int,
    allowed_layers: set[str] | None = None,
    trace: list[list[str]] | None = None,
) -> tuple[str, list[list[str]]]:
    allowed = allowed_layers or DEFAULT_XPROD_LAYERS
    # make_rows がテスト層フィルタのチョークポイント。ここでも xprod_vps を作るのは out_of_scope 報告用。
    rows, selected, flags = make_rows(doc, viewpoints, max_cases, allowed)
    xprod_vps = filter_viewpoints(viewpoints, allowed)
    if trace is not None:
        # rows と selected は make_rows 内で対に append される(1ケース=1由来観点)。
        # 逆引き(IT-ID+小項目)は一意でないため、由来はここで確定させて台帳に残す。
        stem = output_stem(doc.path)
        for row, vp in zip(rows, selected):
            trace.append([
                row[1], stem, doc.title, vp.no, vp.it_id, vp.layer,
                vp.large, vp.middle, vp.small,
                match_rule(vp, flags) or "", doc.path.as_posix(),
            ])
    layer_label = "結合層" if allowed == {"結合"} else "／".join(sorted(allowed)) + "層"
    rel_doc = doc.path.relative_to(repo).as_posix()
    tsv = write_tsv(rows)
    body = f"""# {doc.title} 結合試験テストケース

元設計: `{rel_doc}`

テスト観点: `integration_test/integration-test-viewpoints.md`

期待結果は画面表示、遷移、DB状態、ファイル、レスポンス、ログなど試験で観測できる結果で判定する。TSV は 10 列固定で、`テストレベル` 列は含めない。

## 関連ID対応概要

{related_summary(selected)}

## テストケースTSV

以下はタブ区切りで、実質はExcelのCSVと同様に、改行や`"`を含むセルはダブルクォートで囲む。

**1行目**が列見出し（先頭列は `機能名`、**テストレベル列なし**）。**2行目以降**がケース（各10列）。`機能名` 列に元設計の表示名を入れる。`テストID`で一意に識別する。優先度は **P1／P2／P3**。

Excel／Googleスプレッドシートへはコードフェンス内を A1 に貼り付ける。

前提条件・入力データ・操作手順など、**期待結果以外**の列で複数項目がある場合は、同一セル内でLF改行する。

**期待結果／レスポンスは1行1判定**とする。複数の期待がある場合は行を分割し、**テスト項目名は当該行の判定内容が分かるよう具体化**する。

`前提条件`、`入力データ/リクエスト内容`、`操作手順/実行方法`、`期待結果／レスポンス` が同一になる行は重複テストとして出力しない。

```tsv
{tsv}
```

## テスト層による母集合除外（結合テスト対象外）

結合テスト観点マスタは各観点に「テスト層」を付与し、**{layer_label}のみ**を機能×観点のクロス積対象とする。以下の層は本結合テストの母集合から除外し、それぞれの行き先で担保する（除外の根拠はマスタ `integration_test/integration-test-viewpoints.md` のテスト層列）。

{layer_exclusion(viewpoints, allowed)}

## 対象外観点（{layer_label}のうち本機能に非該当）

{out_of_scope(xprod_vps, selected, flags)}
"""
    return sanitize_markdown(body), rows


def sanitize_markdown(body: str) -> str:
    result = body
    for pattern in FORBIDDEN_PATTERNS:
        result = re.sub(pattern, "期待される結果", result)
    return result


def discover_html(repo: Path) -> list[Path]:
    todo = repo / "functions" / "todo-list.md"
    if todo.exists():
        files = discover_todo_html(repo, todo)
        if files:
            return [path for path in files if not is_excluded_output_stem(output_stem(path))]

    roots = [repo / "function_spec_html_preview"]
    files: list[Path] = []
    seen_stems: set[str] = set()
    for root in roots:
        if not root.exists():
            continue
        for path in sorted(root.rglob("*.html")):
            stem = output_stem(path)
            if is_excluded_output_stem(stem):
                continue
            if stem in seen_stems:
                continue
            seen_stems.add(stem)
            files.append(path)
    return files


def discover_todo_html(repo: Path, todo: Path) -> list[Path]:
    files: list[Path] = []
    seen: set[Path] = set()
    for line in todo.read_text(encoding="utf-8").splitlines():
        if not line.startswith("|") or line.startswith("| ---") or line.startswith("| TODO"):
            continue
        match = re.search(r"\[html\]\(([^)]+)\)", line)
        if not match:
            continue
        path = (todo.parent / match.group(1)).resolve()
        try:
            path.relative_to(repo)
        except ValueError:
            continue
        if path.exists() and path.suffix == ".html" and path not in seen:
            seen.add(path)
            files.append(path)
    return files


TRACE_HEADER = [
    "テストID", "機能stem", "機能名", "観点No", "IT-ID", "テスト層",
    "大項目", "中項目", "小項目", "適用ルールID", "根拠HTML",
]


def write_trace(output_dir: Path, trace: list[list[str]]) -> int:
    """ケースID×観点No×適用ルールID×根拠HTML のトレーサビリティ台帳。

    実行計画(実行区分・聖域の付与)はこの台帳を唯一の入力とすること。
    ケース側の (IT-ID, 小項目) からの逆引きは一意でなく(187キー中55キーが衝突・
    ケースの67%が該当)、行順依存の誤付与を生むため使用してはならない。
    """
    path = output_dir / "case_viewpoint_trace.tsv"
    buf = [TRACE_HEADER] + trace
    with path.open("w", encoding="utf-8", newline="") as f:
        csv.writer(f, delimiter="\t", lineterminator="\n").writerows(buf)
    return len(trace)


def write_aggregate(output_dir: Path, all_rows: list[list[str]]) -> int:
    path = output_dir / "all_it_cases.tsv"
    rows = single_line_rows(dedupe_execution_rows(all_rows))
    path.write_text(write_tsv(rows) + "\n", encoding="utf-8")
    return len(rows)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", type=Path, default=Path("."))
    parser.add_argument("--overwrite", action="store_true")
    parser.add_argument("--max-cases-per-file", type=int, default=90)
    parser.add_argument("--limit", type=int, default=0, help="Generate only first N HTML files.")
    parser.add_argument("--only", type=str, default="", help="Only process HTML files whose path contains this substring (e.g. m01-0).")
    parser.add_argument("--layers", type=str, default="結合", help=f"Comma-separated テスト層 to cross-product (default: 結合). Valid values: {'/'.join(sorted(ALLOWED_LAYER_VALUES))}. Non-結合 layers are normally excluded from the integration master.")
    args = parser.parse_args()

    allowed_layers = {s.strip() for s in args.layers.split(",") if s.strip()}
    unknown = allowed_layers - ALLOWED_LAYER_VALUES
    if unknown:
        parser.error(f"--layers に未知のテスト層: {', '.join(sorted(unknown))}（有効値: {'/'.join(sorted(ALLOWED_LAYER_VALUES))}）")
    if not allowed_layers:
        parser.error("--layers が空です。少なくとも1層（既定: 結合）を指定してください。")
    repo = args.repo.resolve()
    viewpoints_path = repo / "integration_test" / "integration-test-viewpoints.md"
    output_dir = repo / "integration_test"
    viewpoints = read_viewpoints(viewpoints_path)
    load_applicability(repo)
    if not filter_viewpoints(viewpoints, allowed_layers):
        parser.error(f"指定層 {sorted(allowed_layers)} に該当する観点が0件です。観点マスタのテスト層列を確認してください。")
    html_files = discover_html(repo)
    if args.only:
        needle = args.only.lower()
        html_files = [p for p in html_files if needle in p.as_posix().lower()]
    if args.limit:
        html_files = html_files[: args.limit]

    output_dir.mkdir(parents=True, exist_ok=True)
    all_rows: list[list[str]] = []
    trace: list[list[str]] = []
    generated = 0
    for html_path in html_files:
        doc = read_html(html_path)
        stem = output_stem(html_path)
        out_path = output_dir / f"{stem}_it_cases.md"
        if out_path.exists() and not args.overwrite:
            continue
        body, rows = render_markdown(
            repo, doc, viewpoints, args.max_cases_per_file, allowed_layers, trace
        )
        out_path.write_text(body, encoding="utf-8")
        all_rows.extend(rows)
        generated += 1

    # 部分実行（--only / --limit）では集約TSV・トレース台帳を上書きしない（全件集約を壊さないため）。
    if not args.only and not args.limit:
        aggregate_rows = write_aggregate(output_dir, all_rows)
        trace_rows = write_trace(output_dir, trace)
    else:
        aggregate_rows = len(all_rows)
        trace_rows = len(trace)
    print(f"generated={generated} rows={aggregate_rows} trace={trace_rows} output={output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
