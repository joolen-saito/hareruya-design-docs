#!/usr/bin/env python3
from __future__ import annotations

import os as _os
import sys as _sys

if __name__ == "__main__" and _os.environ.get("PYTHONHASHSEED") != "0":
    # 集合の並びが実行ごとに変わると出力の順序が揺れるため、ハッシュの種を固定して起動し直す。
    _os.environ["PYTHONHASHSEED"] = "0"
    _os.execv(_sys.executable, [_sys.executable, *_sys.argv])

import argparse
import csv
import re
import sys
from dataclasses import dataclass, field, replace
from functools import lru_cache
from io import StringIO
from pathlib import Path

from business_assertions import assertions_for, named_location, resolve_link_identity, STOCK, ORDER
from source_contract_lookup import reviewed_contract, execution_repairs
from lineage_gaps import unresolved_lineage_evidence
import viewpoint_items


GENERATED_MARKER = "<!-- generated-by: hareruya-scenario-test-items -->"
SCENARIO_MARKER = "<!-- generated-by: hareruya-scenario-test-cases -->"
# 結合試験テストケースの列に確認対象を加えた11列固定フォーマット（テストレベル列なし）。
# I/FID には、そのステップが行使する機能No（メインフローの「利用画面・機能」）を入れる。
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
    "確認対象",
]
# 集約TSV/索引の並び順＝業務（画面/機能）の実施順。ユーザ指定の機能No順（初出優先で重複排除）。
# シナリオ単位でまとめ、各シナリオを「最初に触れる機能No」の業務順位で並べる。
BUSINESS_ORDER = [
    "M11", "M10", "M16", "M14", "M03", "M04", "M09", "F06", "M08", "F03",
    "F04", "M05", "F08", "M06", "O01", "F05", "M07", "F01", "F02", "M13",
    "F07", "M15", "M12",
]
BUSINESS_RANK = {prefix: index for index, prefix in enumerate(BUSINESS_ORDER)}
UNRANKED = len(BUSINESS_ORDER) + 1

# ec-cube-enterprise の Symfony Route 属性と既定環境変数を照合した実行先。
# 設計書だけでは HTTP メソッド/パスが省略される機能に限って補う。
API_ENDPOINTS = {
    "A01-01": "POST http://localhost:8080/smaregi/webhook",
    "A05-03": "GET http://localhost:8080/waiting_api/get_waiting_number/{base_info_id}",
    "A05-04": "POST http://localhost:8080/smaregi/webhook",
    "A06-06": "GET http://localhost:8080/api/v1/buying/{cardDetailId}.json",
    "A15-10": "PUT http://localhost:8080/api/deck/{id}",
    "A17-03": "POST http://localhost:8080/admin_api/point_granter",
}

# ec-cube-enterprise の AsCommand 属性で確認した実行コマンド。
BATCH_COMMANDS = {
    "B05-05": "docker compose exec ec-cube bin/console eccube:smaregi:otc:delete",
    "B06-01": "docker compose exec ec-cube bin/console eccube:buy-order:auto-stock",
}

# 元シナリオが「手作業か EC-CUBE 操作か判定できない」工程を明示する要確認ラベルは、推測で
# 画面・機能Noを creating するより正しい。許可ラベルは通し、それ以外の `要確認` は従来どおり禁止。
ALLOWED_UNRESOLVED_LABELS: tuple[str, ...] = ()
FORBIDDEN = (
    "UI標準",
    "設計書に記載のとおり",
    "設計どおり",
    "UNRESOLVED",
    "何らか",
    "必要に応じ",
    "適宜",
    "記載順に実行する",
    "元シナリオの正常系実行手順",
    "...",
)

EXPECTED_ALLOWED_ENDING_RE = re.compile(r"(される|されない|できる|である)こと。$")

EXPECTED_CLAUSE_REPLACEMENTS = (
    ("処理を開始させず、", "処理が開始されず、"),
    ("処理を完了扱いにせず、", "処理が完了扱いでなく、"),
    ("受注を完了扱いにせず、", "受注が完了扱いでなく、"),
    ("出荷完了にせず、", "出荷完了でなく、"),
    ("出荷を確定せず、", "出荷が確定されず、"),
    ("出荷確定へ進めず、", "出荷確定へ進めない状態で、"),
    ("支払完了にせず、", "支払完了でなく、"),
    ("受付完了にせず、", "受付完了でなく、"),
    ("参加確定にせず、", "参加確定でなく、"),
    ("公開または販売可能状態にせず、", "公開または販売可能状態でなく、"),
    ("公開せず、", "公開されず、"),
    ("引渡し完了にせず、", "引渡し完了でなく、"),
    ("保存または公開を止め、", "保存または公開が停止され、"),
    ("価格更新を止め、", "価格更新が停止され、"),
    ("振込または成立処理へ進めず、", "振込または成立処理へ進めない状態で、"),
    ("買取成立に進めず、", "買取成立に進めない状態で、"),
    ("仕入れ確定にせず、", "仕入れ確定でなく、"),
    ("対象外商品を更新せず、", "対象外商品が更新されず、"),
    ("対象外店舗/期間の在庫を更新せず、", "対象外店舗/期間の在庫が更新されず、"),
    ("対象データをキャンセル状態にし、", "対象データがキャンセル状態であり、"),
    ("対象金額と戻し処理を記録し、", "対象金額と戻し処理が記録され、"),
    ("返金対象、返金額、返金ステータスを記録し、", "返金対象、返金額、返金ステータスが記録され、"),
    ("二重登録・二重更新を防止し、", "二重登録・二重更新が防止され、"),
    ("二重在庫計上を防止し、", "二重在庫計上が防止され、"),
    ("差異を表示し、", "差異が表示され、"),
    ("差異内容を表示し、", "差異内容が表示され、"),
    ("不足内容を表示し、", "不足内容が表示され、"),
    ("エラー内容を表示し、", "エラー内容が表示され、"),
    ("0件結果を表示し、", "0件結果が表示され、"),
    ("権限エラーを表示して", "権限エラーが表示され、"),
    ("処理結果で", "処理結果で"),
)

EXPECTED_TERMINAL_REPLACEMENTS = (
    ("確認できる状態にすること。", "確認できる状態であること。"),
    ("再実行可能な保留状態にすること。", "再実行可能な保留状態であること。"),
    ("保留または欠品状態として記録すること。", "保留または欠品状態として記録されること。"),
    ("状態として記録すること。", "状態として記録されること。"),
    ("状態にすること。", "状態であること。"),
    ("更新しないこと。", "更新されないこと。"),
    ("変更しないこと。", "変更されないこと。"),
    ("登録しないこと。", "登録されないこと。"),
    ("削除しないこと。", "削除されないこと。"),
    ("確定しないこと。", "確定されないこと。"),
    ("開始させないこと。", "開始されないこと。"),
    ("発生させないこと。", "発生しない状態であること。"),
    ("進ませないこと。", "進めない状態であること。"),
    ("含めないこと。", "含まれない状態であること。"),
    ("登録すること。", "登録されること。"),
    ("作成すること。", "作成されること。"),
    ("更新すること。", "更新されること。"),
    ("変更すること。", "変更されること。"),
    ("削除すること。", "削除されること。"),
    ("表示すること。", "表示されること。"),
    ("記録すること。", "記録されること。"),
    ("保存すること。", "保存されること。"),
    ("公開すること。", "公開されること。"),
    ("設定すること。", "設定されること。"),
    ("送付すること。", "送付されること。"),
    ("送信すること。", "送信されること。"),
    ("出力すること。", "出力されること。"),
    ("印刷すること。", "印刷されること。"),
    ("発行すること。", "発行されること。"),
    ("実施すること。", "実施されること。"),
    ("完了すること。", "完了されること。"),
    ("開始すること。", "開始されること。"),
    ("反映させること。", "反映されること。"),
    ("生成すること。", "生成されること。"),
    ("保管すること。", "保管されること。"),
    ("陳列すること。", "陳列されること。"),
    ("発送すること。", "発送されること。"),
    ("出金すること。", "出金されること。"),
    ("受領すること。", "受領できること。"),
    ("確認すること。", "確認できること。"),
    ("検索すること。", "検索できること。"),
    ("ダウンロードすること。", "ダウンロードできること。"),
    ("アップロードすること。", "アップロードされること。"),
    ("インポートすること。", "インポートされること。"),
    ("投入すること。", "投入されること。"),
    ("入力すること。", "入力されること。"),
    ("取得すること。", "取得できること。"),
    ("整理すること。", "整理されること。"),
    ("用意すること。", "用意されること。"),
    ("共有すること。", "共有されること。"),
    ("管理すること。", "管理されること。"),
    ("対応すること。", "対応されること。"),
    ("ピッキングすること。", "ピッキングされること。"),
    ("チェックすること。", "チェックできること。"),
    ("Wチェックすること。", "Wチェックできること。"),
    ("ダブルチェックすること。", "ダブルチェックできること。"),
    ("突合確認すること。", "突合確認できること。"),
    ("紐づけること。", "紐づけされること。"),
    ("戻すこと。", "戻されること。"),
    ("貼ること。", "貼付されること。"),
    ("取り込むこと。", "取り込みできること。"),
    ("流れること。", "連携されること。"),
    ("移ること。", "移行できること。"),
    ("行うこと。", "実行されること。"),
    ("用意こと。", "用意されること。"),
    ("登録こと。", "登録されること。"),
    ("作成こと。", "作成されること。"),
    ("更新こと。", "更新されること。"),
    ("確認こと。", "確認できること。"),
    ("実行こと。", "実行されること。"),
    ("ダウンロードこと。", "ダウンロードできること。"),
    ("アップロードこと。", "アップロードされること。"),
    ("インポートこと。", "インポートされること。"),
    ("出力こと。", "出力されること。"),
    ("対応こと。", "対応されること。"),
    ("保管こと。", "保管されること。"),
    ("陳列こと。", "陳列されること。"),
    ("発行こと。", "発行されること。"),
    ("投入しこと。", "投入されること。"),
    ("不一致こと。", "不一致であること。"),
)

EXPECTED_PASSIVE_TERMS = (
    "登録",
    "作成",
    "更新",
    "変更",
    "削除",
    "表示",
    "記録",
    "保存",
    "公開",
    "設定",
    "送付",
    "送信",
    "出力",
    "印刷",
    "発行",
    "実施",
    "完了",
    "開始",
    "反映",
    "生成",
    "保管",
    "陳列",
    "発送",
    "出金",
    "整理",
    "用意",
    "共有",
    "管理",
    "対応",
    "ピッキング",
    "アップロード",
    "インポート",
    "投入",
    "入力",
    "貼付",
    "紐づけ",
    "戻",
)


@dataclass(frozen=True)
class DataPattern:
    pattern_id: str
    kind: str
    target: str
    purpose: str
    precondition_delta: str
    input_data: str
    observation: str


@dataclass(frozen=True)
class ScenarioDoc:
    repo: Path
    path: Path
    sid: str
    title: str
    business: str
    classification: str
    route_id: str
    route_kind: str
    route_condition: str
    final_state: str
    priority: str
    business_trigger: str
    main_actor: str
    systems: str
    trace_source: str
    seed: dict[str, str]
    normal_rows: list[dict[str, str]]
    branch_rows: list[dict[str, str]]
    normal_features: list[str]
    screen_features: dict[str, str]
    data_patterns: list[DataPattern]
    expected_features: list[str]
    linked_features: list[str]
    data_links: list[dict[str, str]] = field(default_factory=list)


@dataclass(frozen=True)
class TestItem:
    function_name: str
    test_id: str
    ifid: str
    viewpoint: str
    priority: str
    item_name: str
    precondition: str
    input_data: str
    steps: str
    expected: str
    observation: str
    flow_type: str
    scenario_id: str


@dataclass(frozen=True)
class FeatureGuide:
    ifid: str
    title: str
    source_path: str
    required_fields: tuple[str, ...]
    success_messages: tuple[str, ...]
    input_summary: str
    success_summary: str


@dataclass(frozen=True)
class Feasibility:
    verdict: str
    reason: str
    blocker: str = "—"


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def cell(value: str) -> str:
    value = value.replace("<br>", "\n")
    value = re.sub(r"<[^>]+>", "", value)
    value = value.replace("`", "")
    return re.sub(r"[ \t]+", " ", value).strip()


def has_allowed_expected_ending(value: str) -> bool:
    return bool(EXPECTED_ALLOWED_ENDING_RE.search(value.rstrip()))


def _as_expected_sentence(value: str) -> str:
    value = cell(value)
    value = re.sub(r"\s+", " ", value).strip()
    value = re.sub(r"[。．]+$", "", value).strip()
    if value.endswith("こと"):
        value = value[:-2].strip()
    return f"{value}こと。" if value else ""


def _normalize_expected_particle(value: str) -> str:
    passive_terms = "|".join(re.escape(term) for term in EXPECTED_PASSIVE_TERMS)
    value = re.sub(
        rf"を([^、。]*?(?:{passive_terms})(?:される|されない)こと。)$",
        r"が\1",
        value,
    )
    value = re.sub(
        rf"を([^、。]*?(?:{passive_terms})され、)",
        r"が\1",
        value,
    )
    value = re.sub(r"を実行されること。$", "が実行されること。", value)
    value = re.sub(r"を確認できること。$", "を確認できること。", value)
    return value


def normalize_expected_result(value: str) -> str:
    """期待結果を、システムを主語にした受け身・状態・可能表現へ寄せる。"""
    value = value.replace("など？", "").replace("？", "")
    text = _as_expected_sentence(value)
    if not text:
        return "期待結果を確認できること。"
    if has_allowed_expected_ending(text):
        return text

    for old, new in EXPECTED_CLAUSE_REPLACEMENTS:
        text = text.replace(old, new)

    # 接続節に残りやすい「〜し、」を、期待結果として読める受け身表現へ寄せる。
    text = re.sub(
        r"(登録|作成|更新|変更|削除|表示|記録|保存|公開|設定|送付|送信|出力|印刷|発行|実施|完了|開始|反映|生成|保管|陳列|発送|出金|整理|用意|共有|管理|対応|アップロード|インポート|投入|入力)し、",
        r"\1され、",
        text,
    )
    text = text.replace("確認し、", "確認でき、")
    text = text.replace("検索し、", "検索でき、")
    text = re.sub(r"([^、。]+?)を更新せず、", r"\1が更新されず、", text)
    text = re.sub(r"([^、。]+?)を保留し、", r"\1が保留され、", text)
    text = text.replace("行い、", "実行され、")
    text = text.replace("行って", "実行されて")

    for old, new in EXPECTED_TERMINAL_REPLACEMENTS:
        if text.endswith(old):
            text = f"{text[:-len(old)]}{new}"
            break

    text = _normalize_expected_particle(text)
    if has_allowed_expected_ending(text):
        return text

    # 上の辞書にないサ変動詞の末尾を最後に広く拾う。
    text = re.sub(r"を([^、。]*?)すること。$", r"が\1されること。", text)
    text = re.sub(r"すること。$", "されること。", text)
    text = re.sub(r"しこと。$", "されること。", text)
    text = _normalize_expected_particle(text)
    if has_allowed_expected_ending(text):
        return text

    if text.endswith("ていること。"):
        return f"{text[:-len('こと。')]}状態であること。"
    if text.endswith("ないこと。"):
        return f"{text[:-len('こと。')]}状態であること。"
    if text.endswith("あること。"):
        return f"{text[:-len('こと。')]}状態であること。"
    if text.endswith("こと。"):
        return f"{text[:-len('こと。')]}状態であること。"
    return f"{text}状態であること。"


def split_md_row(line: str) -> list[str]:
    return [cell(part) for part in line.strip().strip("|").split("|")]


def table_after(text: str, heading: str) -> list[dict[str, str]]:
    m = re.search(rf"^{re.escape(heading)}\n(?:[ \t]*\n)*(?P<body>(?:\|.*\|\n)+)", text, re.M)
    if not m:
        return []
    lines = [line for line in m.group("body").splitlines() if line.startswith("|")]
    if len(lines) < 2:
        return []
    header = split_md_row(lines[0])
    rows: list[dict[str, str]] = []
    for line in lines[2:]:
        parts = split_md_row(line)
        if len(parts) != len(header):
            continue
        rows.append(dict(zip(header, parts)))
    return rows


def section_text(text: str, heading_re: str) -> str:
    """見出しから次の同格以上の見出しまでを返す。"""
    m = re.search(rf"^(?P<marks>#+)\s+{heading_re}\s*$", text, re.M)
    if not m:
        return ""
    level = len(m.group("marks"))
    tail = text[m.end():]
    end = re.search(rf"^#{{1,{level}}}\s+", tail, re.M)
    return tail[:end.start()] if end else tail


def first_table(text: str) -> list[dict[str, str]]:
    m = re.search(r"(?P<body>(?:^\|.*\|\n)+)", text, re.M)
    if not m:
        return []
    lines = m.group("body").splitlines()
    if len(lines) < 2:
        return []
    header = split_md_row(lines[0])
    result: list[dict[str, str]] = []
    for line in lines[2:]:
        parts = split_md_row(line)
        if len(parts) == len(header):
            result.append(dict(zip(header, parts)))
    return result


def _function_doc(repo: Path, ifid: str, archived: bool = False) -> Path | None:
    root = repo / "functions" / ("_archive" if archived else "")
    candidates = [
        path for path in root.glob(f"*/{ifid.lower()}_*.md")
        if "_archive" not in path.relative_to(root).parts
    ]
    preferred = {
        "M05-26": "m05-26_admin_order_order_shipping_result_csv_import.md",
    }.get(ifid)
    if preferred:
        exact = next((path for path in candidates if path.name == preferred), None)
        if exact:
            return exact
    return sorted(candidates)[0] if candidates else None


def _row_value(row: dict[str, str], names: tuple[str, ...]) -> str:
    for name in names:
        if row.get(name):
            return row[name]
    return ""


@lru_cache(maxsize=None)
def feature_guide(repo_text: str, ifid: str) -> FeatureGuide | None:
    if not re.fullmatch(r"[A-Z]\d{2}-\d{2}", ifid):
        return None
    repo = Path(repo_text)
    active = _function_doc(repo, ifid)
    if not active:
        return None
    active_text = read_text(active)
    archive = _function_doc(repo, ifid, archived=True)
    archive_text = read_text(archive) if archive else ""
    h = re.search(r"^#\s+(.+)$", active_text, re.M)
    title = cell(h.group(1)) if h else ifid

    input_rows: list[dict[str, str]] = []
    for source in (active_text, archive_text):
        part = section_text(source, r"(?:入力項目|フォーム項目)(?:（.*?）)?")
        input_rows = first_table(part)
        if input_rows:
            break
    required: list[str] = []
    for row in input_rows:
        name = _row_value(row, ("項目名", "項目", "画面項目"))
        required_mark = _row_value(row, ("必須／任意", "必須/任意", "必須"))
        if name and ("必須" in required_mark or required_mark in {"○", "〇", "必須"}):
            required.append(name)

    messages: list[str] = []
    for row in first_table(section_text(active_text, r"表示メッセージ")):
        message = _row_value(row, ("画面上の文言", "表示文言", "メッセージ", "文言"))
        condition = _row_value(row, ("表示条件", "条件"))
        joined = f"{message} {condition}"
        positive = re.search(r"(?:保存|登録|更新|変更|削除|出力|送信|完了|成功).*ました", message)
        if message and positive and not any(word in joined for word in ("失敗", "エラー", "不正", "できません", "見つかりません", "タイムアウト", "拒否", "ありません", "上限", "選択してください", "？", "...")):
            messages.append(message)

    io_rows = first_table(section_text(active_text, r"入出力"))
    input_summary = ""
    success_summary = ""
    for row in io_rows:
        kind = _row_value(row, ("種類", "区分", "操作"))
        content = _row_value(row, ("内容", "契機", "結果"))
        if kind == "入力" and content:
            input_summary = content
        if kind == "成功時出力" and content:
            success_summary = content
    return FeatureGuide(
        ifid=ifid,
        title=title,
        source_path=str(active.relative_to(repo)),
        required_fields=tuple(dict.fromkeys(required)),
        success_messages=tuple(dict.fromkeys(messages[:4])),
        input_summary=input_summary,
        success_summary=success_summary,
    )


@lru_cache(maxsize=None)
def feasibility_maps(repo_text: str) -> tuple[dict[tuple[str, str], Feasibility], dict[str, Feasibility]]:
    repo = Path(repo_text)
    step_path = repo / "scenario_test/exec/feasibility/feasibility_by_step.tsv"
    scenario_path = repo / "scenario_test/exec/feasibility/feasibility_by_scenario.tsv"
    steps: dict[tuple[str, str], Feasibility] = {}
    scenarios: dict[str, Feasibility] = {}
    if step_path.exists():
        with step_path.open(encoding="utf-8", newline="") as fh:
            for row in csv.DictReader(fh, delimiter="\t"):
                steps[(row["シナリオID"], row["工程#"])] = Feasibility(
                    row["判定"], row["根拠"], row.get("機能No", "—")
                )
    if scenario_path.exists():
        with scenario_path.open(encoding="utf-8", newline="") as fh:
            for row in csv.DictReader(fh, delimiter="\t"):
                counts = [
                    f"{label}={row[label]}"
                    for label in ("実行不能", "判定不能", "未実装指摘あり", "実装違い指摘あり")
                    if row.get(label, "0") not in {"", "0"}
                ]
                blocker = row.get("ブロッカー", "—") or "—"
                detail = "; ".join([f"ブロッカー={blocker}", *counts])
                scenarios[row["シナリオID"]] = Feasibility(
                    row["判定"], f"{detail}（feasibility_by_scenario.tsv）", blocker
                )
    return steps, scenarios


def bullet_value(text: str, label: str, default: str = "-") -> str:
    m = re.search(rf"- \*\*{re.escape(label)}\*\*:\s*(.+)", text)
    return cell(m.group(1)) if m else default


def list_value(text: str, label: str, default: str = "-") -> str:
    m = re.search(rf"-\s+{re.escape(label)}:\s*(.+)", text)
    return cell(m.group(1)) if m else default


def feature_list_value(text: str, label: str) -> list[str]:
    value = bullet_value(text, label, "-")
    if value == "-":
        return []
    return [part.strip().upper() for part in value.split(",") if re.match(r"^[A-Z]\d{2}-\d{2}$", part.strip(), re.I)]


def feature_from_cell(value: str) -> str:
    """Preserve all explicitly listed interfaces in their source order."""
    m = re.search(r"（([^（）]+)）\s*$", value)
    return ",".join(interface_ids(m.group(1))) if m and interface_ids(m.group(1)) else "-"


def interface_ids(value: str) -> list[str]:
    return list(dict.fromkeys(re.findall(r"\b[A-Z]\d{2}-\d{2}\b", value.upper())))


def mainflow_features(text: str) -> list[str]:
    """メインフロー（正常系）の各行の「利用画面・機能」から機能Noを抽出する。"""
    rows = table_after(text, "## メインフロー（正常系）")
    return [feature_from_cell(row.get("利用画面・機能", "")) for row in rows]


def screen_feature_map(text: str) -> dict[str, str]:
    """トレーサビリティ表の画面名から、分岐行で使う機能Noを引けるようにする。"""
    m = re.search(r"^- \*\*触れる画面と既存ケース\*\*:\n(?P<body>(?:[ \t]*\|.*\|\n)+)", text, re.M)
    if not m:
        return {}
    lines = [line.strip() for line in m.group("body").splitlines() if line.strip().startswith("|")]
    if len(lines) < 2:
        return {}
    header = split_md_row(lines[0])
    result: dict[str, str] = {}
    for line in lines[2:]:
        parts = split_md_row(line)
        if len(parts) != len(header):
            continue
        row = dict(zip(header, parts))
        screen = row.get("画面", "")
        feature = row.get("機能No", "").upper()
        if screen and re.match(r"^[A-Z]\d{2}-\d{2}$", feature, re.I):
            result[screen] = feature
    return result


def parse_data_patterns(text: str) -> list[DataPattern]:
    rows = table_after(text, "## データパターン")
    patterns: list[DataPattern] = []
    for row in rows:
        pattern_id = row.get("パターンID", "")
        if not pattern_id:
            continue
        patterns.append(
            DataPattern(
                pattern_id=pattern_id,
                kind=row.get("種別", ""),
                target=row.get("対象ステップ/分岐ID", ""),
                purpose=row.get("目的", ""),
                precondition_delta=row.get("前提差分", ""),
                input_data=row.get("入力データ", ""),
                observation=row.get("期待観測点", ""),
            )
        )
    return patterns


def parse_scenario(path: Path, repo: Path) -> ScenarioDoc | None:
    text = read_text(path)
    if SCENARIO_MARKER not in text:
        return None
    h = re.search(r"^#\s+(SCN-[^\s]+)\s+(.+)$", text, re.M)
    if not h:
        return None
    sid = h.group(1)
    title = cell(h.group(2))
    trace = list_value(text, "業務フロー番号")
    business = trace.split("/", 1)[0].strip() if "/" in trace else trace
    seed_rows = table_after(text, "## 実行用テストデータ")
    seed = {row.get("項目", ""): row.get("値", "") for row in seed_rows if row.get("項目")}
    return ScenarioDoc(
        repo=repo,
        path=path.relative_to(repo),
        sid=sid,
        title=title,
        business=business,
        classification=bullet_value(text, "分類", "正常系"),
        route_id=bullet_value(text, "経路ID", "-"),
        route_kind=bullet_value(text, "経路種別", "-"),
        route_condition=bullet_value(text, "業務経路条件", "-"),
        final_state=bullet_value(text, "最終業務状態", "-"),
        priority=bullet_value(text, "優先度", "P2"),
        business_trigger=bullet_value(text, "業務トリガー", f"{title}を開始する"),
        main_actor=bullet_value(text, "主アクター", "業務担当者"),
        systems=bullet_value(text, "関連システム", "-"),
        trace_source=bullet_value(text, "カバーする業務フロー番号", trace),
        seed=seed,
        normal_rows=table_after(text, "## 実行手順（正常系）"),
        # 業務分岐0件の経路はプレースホルダ行（分岐ID=`-`）を持つ。実分岐だけをテスト項目にする。
        branch_rows=[
            row for row in table_after(text, "## 実行手順（代替系・異常系）")
            if re.fullmatch(r"[AE]\d+", row.get("分岐ID", "").strip())
        ],
        normal_features=mainflow_features(text),
        screen_features=screen_feature_map(text),
        data_patterns=parse_data_patterns(text),
        expected_features=feature_list_value(text, "期待する主要機能No"),
        linked_features=feature_list_value(text, "シナリオに紐づく機能No"),
        data_links=[row for row in first_table(section_text(text, r"データ連鎖.*")) if row.get("連鎖ID", "-") != "-"],
    )


def function_display_name(s: ScenarioDoc) -> str:
    if s.business and s.business not in ("-", ""):
        return f"{s.business} — {s.title}"
    return s.title


def primary_seed(seed: dict[str, str]) -> str:
    for key in ("受注番号", "ネット買取申込番号", "買取受付番号", "仕入番号", "イベントID", "デッキID", "商品コード", "価格変更CSV"):
        if seed.get(key):
            return f"{key}={seed[key]}"
    if seed:
        k = next(iter(seed))
        return f"{k}={seed[k]}"
    return "-"


def infer_viewpoint(flow_type: str, operation: str, expected: str) -> str:
    text = operation + " " + expected
    if flow_type == "異常系":
        # `権限` / `バリデーション` は結合テスト層の観点（IT-15 / IT-22）。シナリオテスト項目の
        # 観点はあくまで業務判断・最終業務状態なので、業務側の語で分類する。
        if "在庫" in text or "欠品" in text or "棚卸" in text:
            return "在庫整合"
        if "返金" in text or "決済" in text or "入金" in text or "金額" in text or "振込" in text:
            return "金額整合"
        if "承認" in text or "差戻" in text or "棄却" in text or "却下" in text:
            return "業務承認"
        if "連携" in text or "外部" in text or "取込" in text or "インポート" in text:
            return "外部連携"
        if "不一致" in text or "差異" in text or "不備" in text or "不正" in text:
            return "業務データ整合"
        return "業務異常制御"
    if flow_type == "代替系":
        if "返金" in text or "キャンセル" in text:
            return "代替業務"
        return "代替フロー"
    if "CSV" in text or "帳票" in text or "PDF" in text or "印刷" in text:
        return "CSV/帳票"
    if "メール" in text or "通知" in text:
        return "メール/通知"
    if "SPLINKS" in text or "スマレジ" in text or "MTG" in text or "Backlog" in text:
        return "外部連携"
    if "登録" in text or "更新" in text or "ステータス" in text or "履歴" in text or "金額" in text:
        return "データ更新"
    if "照合" in text or "一致" in text:
        return "照合"
    return "業務操作"


def action_from_operation(operation: str) -> str:
    # 引用符はファイル名・ボタン名にも使う。生成器の外側ラッパーだけを外す。
    m = re.fullmatch(r".+?(?:で|として)「(.+)」を(?:行う|実施する)(?:（[^\n]*）)?", operation, re.S)
    if m:
        return cell(m.group(1))
    return cell(operation)


def normalize_action(action: str, s: ScenarioDoc) -> str:
    action = action.strip(" 。")
    action = re.sub(r"^[\-－]+", "", action)
    action = action.replace("必要に応じて", "対象条件に一致する場合は")
    action = action.replace("適宜", "対象条件に一致する場合は")
    action = action.replace("など？", "").replace("？", "")
    if "何らかのトリガー" in action or not action:
        trigger = s.business_trigger.strip(" 。")
        trigger = trigger.replace("が必要になったとき", "の実施要求")
        return f"{trigger}を契機に対象データを確定する"
    return action


def function_from_operation(operation: str) -> str:
    """操作文（{画面}で「{action}」…）から画面・機能名を取り出す。特定不可なら空（創作しない）。"""
    for sep in ("で「", "で 条件", "を開き"):
        if sep in operation:
            value = cell(operation.split(sep, 1)[0])
            if value in {"外部システム/ツール上", "現場作業として", "業務判断として"}:
                return ""
            return value
    return ""


def feature_for_operation(operation: str, s: ScenarioDoc) -> str:
    """操作文に含まれる画面・機能名から、経路内で実際に触る機能Noだけを割り当てる。"""
    explicit = re.search(r"（([A-Z]\d{2}-\d{2})）", operation, re.I)
    if explicit:
        return explicit.group(1).upper()
    screen = function_from_operation(operation)
    if not screen:
        return "-"
    if screen in s.screen_features:
        return s.screen_features[screen]
    for known_screen, feature in s.screen_features.items():
        if screen in known_screen or known_screen in screen:
            return feature
    return "-"


def guide_for(s: ScenarioDoc, ifid: str) -> FeatureGuide | None:
    ids = interface_ids(ifid)
    return feature_guide(str(s.repo), ids[0]) if ids else None


def interface_kind(ifid: str, operation: str) -> str:
    if "EC-CUBE操作なし" in operation or not ifid or ifid == "-":
        if any(word in operation for word in ("現場作業", "現物", "ピック", "梱包", "発送", "入庫")):
            return "現場作業"
        return "外部・業務作業"
    return {"M": "管理画面", "F": "フロント画面", "A": "API", "B": "バッチ", "O": "外部連携"}.get(ifid[0], "システム操作")


def feasibility_for(s: ScenarioDoc, row_no: str | None = None, route: bool = False) -> Feasibility:
    steps, scenarios = feasibility_maps(str(s.repo))
    if route:
        return scenarios.get(s.sid, Feasibility("台帳未収載", "実施可否台帳にシナリオ行が無い"))
    if row_no:
        return steps.get((s.sid, row_no), scenarios.get(s.sid, Feasibility("台帳未収載", "実施可否台帳に工程行が無い")))
    return scenarios.get(s.sid, Feasibility("台帳未収載", "実施可否台帳にシナリオ行が無い"))


def feasibility_label(f: Feasibility, kind: str) -> tuple[str, str]:
    verdict = f.verdict
    if verdict.startswith("実行不能"):
        return "実施不可（設計確定待ち）", f"解除条件: {f.reason}を解消し、操作画面または実行機能を確定する"
    if verdict.startswith("判定不能"):
        return "実施保留（実行手段未特定）", f"解除条件: {f.reason}に対する機能Noと操作手段を確定する"
    if verdict.startswith("要確認"):
        return "条件付き実施（未実装指摘の影響判定が前提）", f"開始条件: {f.reason.replace('要確認', '影響判定')}を工程に照合し、対象外または対応済みと記録する"
    if verdict.startswith("要注意"):
        return "条件付き実施（既知の実装差あり）", f"開始条件: {f.reason}の影響する工程を照合する。期待値は業務フロー・HTML設計書に固定し、実装差は不合格または阻害として記録する"
    if verdict == "台帳未収載":
        return "実施保留（実施可否の判定待ち）", "解除条件: 対象経路・工程の操作先と実行手段を実施可否台帳に記録する"
    if kind in {"外部・業務作業", "現場作業", "外部連携"}:
        return "業務担当環境で実施", "開始条件: 記載された外部サービス、帳票、現物および担当者権限を利用できる"
    return "準備確認後に実施（環境・データ確認が前提）", f"文書上の判定根拠: {f.reason}。実アカウント・開始データ・操作先の利用可否を確認してから開始する"


def first_created_keys(s: ScenarioDoc) -> dict[str, str]:
    """Distinguish output identities from records required before the route.

    Explicit seed timing is authoritative. An actual purchase also produces an
    order even when the seed lists its logical test name instead of timing prose.
    """
    result = {}
    for key, value in s.seed.items():
        if not key.endswith(("ID", "番号", "コード")):
            continue
        if re.search(r"未採番|採番され|採番した|初回|登録後|購入完了で|実行時に記録", value):
            token = {"受注番号": r"注文|購入", "在庫移動ID": r"移動", "移動ID": r"移動",
                     "移動指示ID": r"指示", "在庫移動指示ID": r"指示", "査定ID": r"受付|査定開始"}.get(key, re.escape(key.removesuffix("ID")))
            first = next((row.get("#", "1") for row in s.normal_rows
                          if re.search(token, row.get("操作", "")) and re.search(r"登録|作成|確定|受付|採番|開始", row.get("操作", ""))), None)
            if first is not None:
                result[key] = first
    for idx, row in enumerate(s.normal_rows):
        ids = interface_ids(s.normal_features[idx]) if idx < len(s.normal_features) else []
        if "受注番号" in s.seed and set(ids) & {"F04-02", "F04-04"}:
            result.setdefault("受注番号", row.get("#", str(idx + 1)))
        contract = reviewed_contract(s, row.get("操作", ""))
        if contract and contract.get("kind") == "subflow" and any(
            target.get("scenario_id", "").startswith("SCN-PRODUCT-") for target in contract.get("subflow_targets", [])
        ):
            result.setdefault("商品コード", row.get("#", str(idx + 1)))
    return result


def target_state(operation: str, kind: str, s: ScenarioDoc | None = None, row_no: str | None = None, route: bool = False) -> str:
    created = first_created_keys(s) if s else {}
    if created:
        before, after = [], []
        for key, first in created.items():
            if route or not row_no or not row_no.isdigit() or int(row_no) <= int(first):
                before.append(f"{key}は未採番/未作成として開始し、工程#{first}の初回採番・登録結果を論理IDへ対応付ける")
            else:
                after.append(f"先行工程#{first}で取得した{key}の実値を使う。対応が無い場合はその先行工程から実行し、別レコードを作り直さない")
        return " / ".join(before + after) + "。開始前の検索・存在確認は入力側の会員・既存商品・店舗マスタに限定し、今回作成する対象を除く"
    action = action_from_operation(operation)
    if kind in {"外部・業務作業", "現場作業", "外部連携"}:
        return "操作文に記載されたサービス、帳票または現物を用意し、対象キーと入力値を記録する"
    if any(word in action for word in ("新規登録", "登録する", "作成する", "追加する")) and not any(word in action for word in ("検索", "更新", "変更")):
        return "登録前の重複確認で対象キーが存在しないことを確認する"
    return "操作前に対象キーで対象データを開き、入力データ記載の初期状態と一致することを確認する"


def fixture_lines(s: ScenarioDoc, row_no: str | None = None, route: bool = True) -> list[str]:
    """業務ごとの確定した準備手順を使い、ランダムfixtureでは開始条件を代用しない。"""
    lines = execution_repairs.preparation(s, row_no=row_no, route=route)
    if not lines:
        raise ValueError(f"具体的な準備手順が未登録: {s.sid}")
    return lines


def preparation_lines(
    s: ScenarioDoc,
    ifid: str,
    operation: str,
    row_no: str | None = None,
    route: bool = False,
) -> list[str]:
    kind = "経路" if route else interface_kind(ifid, operation)
    f = feasibility_for(s, row_no, route)
    status, condition = feasibility_label(f, kind)
    guide = guide_for(s, ifid)
    lines = [f"実施区分: {status}", condition]
    lines.append("実施モード: 同じ案件を継続する場合は実ID・現在状態・前工程の証跡を引き継ぐ。以下の初期データ作成と先行操作は、単独実施で開始状態がない場合に一度だけ行い、継続中には再投入しない")
    if kind in {"管理画面", "フロント画面", "API", "バッチ", "システム操作"} or route:
        lines.extend([
            "環境確認: http://localhost:8080/admin/login と http://localhost:8080/ja が開くことを確認する。ローカル環境が停止中なら ../ec-cube-enterprise で docker compose -f docker-compose.yml -f docker-compose.pgsql.yml -f docker-compose.dev.yml up -d --wait を一度実行する",
            "基準データの保持: カード・商品・店舗の既存マスタを確認する。経路開始後に基準シードを再実行せず、実行用テストデータと同じ商品・店舗・会員・受注を保持する",
        ])
    setup = fixture_lines(s, row_no=row_no, route=route)
    if any("実施保留" in line for line in setup):
        lines[0] = "実施区分: 実施保留（準備資料・実行手段の確定待ち）"
        lines.append("解除条件: 下記の実施保留条件をすべて満たしてから開始する。保留を合格として記録しない")
    lines.extend(setup)
    if row_no and row_no.isdigit() and int(row_no) > 1:
        prior_numbers = set(range(1, int(row_no)))
        for module in execution_repairs.modules():
            method = getattr(module, "prerequisite_steps", None)
            selected = method(s, row_no) if method else None
            if selected is not None:
                prior_numbers = set(selected)
        for previous in s.normal_rows:
            number = previous.get("#", "")
            if number.isdigit() and int(number) in prior_numbers:
                previous_operation = previous.get('操作', '')
                if "外部システム/ツール上" in previous_operation:
                    action = normalize_action(action_from_operation(previous_operation), s)
                    previous_operation = f"{named_location(action, previous.get('確認対象', ''))}で「{action}」を実施する"
                lines.append(f"単独実施時の先行操作#{number}: {previous.get('担当者') or s.main_actor}が、{previous_operation}。対象={previous.get('入力/対象', '')}。開始状態の照合={previous.get('期待結果', '')}")
                expansion, blockers, _ = expand_subflow(s, previous.get('操作', ''))
                for text in (previous.get('操作', ''), previous.get('期待結果', '')):
                    if "実施保留条件:" in text:
                        blockers.append(text.split("実施保留条件:", 1)[1].rstrip("）"))
                lines.extend(expansion)
                if blockers:
                    lines[0] = "実施区分: 実施保留（先行工程の開始条件未成立）"
                    lines.append("解除条件: " + " / ".join(blockers))
    if route:
        features = [feature for group in s.normal_features for feature in interface_ids(group)]
        if any(f.startswith("M") for f in features):
            lines.append("認証（管理画面）: http://localhost:8080/admin/login に、準備で確認した各工程の担当者の実アカウントでログインする。承認工程は登録担当者とは別の承認権限を持つアカウントへ切り替える")
        if any(f.startswith("F") for f in features) and s.seed.get("会員番号"):
            lines.append("認証（フロント）: http://localhost:8080/ja を開き、準備で作成した同じ会員のメールアドレスとパスワードでログインする。非会員・未登録の条件ではログアウト状態を保持する")
        elif any(f.startswith("F") for f in features):
            lines.append("フロント開始: http://localhost:8080/ja を開き、当該ケースで指定された会員/非会員条件と顧客情報で購入手続きへ進む")
        if any(f.startswith("A") for f in features):
            lines.append("認証（API）: 各API設計書で定義された認証情報をテスト環境の管理者から払い出す")
        lines.append(f"業務環境: {s.systems} のうち経路で使用する外部サービス、帳票または現物を利用できる")
    elif kind == "管理画面":
        lines.append("認証: http://localhost:8080/admin/login に、当該工程の担当者権限を持つ準備済みの実アカウントでログインする。承認工程では登録担当者と異なる承認者を使う")
    elif kind == "フロント画面":
        lines.append("認証: http://localhost:8080/ja を開き、準備で作成した同じ会員のメールアドレスとパスワードでログインする。非会員・未登録の条件ではログアウト状態を保持する" if s.seed.get("会員番号") else
                     "フロント開始: http://localhost:8080/ja を開き、当該ケースに指定された顧客情報で購入手続きへ進む")
    elif kind == "API":
        lines.append("認証: 対象APIの設計書で定義された認証情報をテスト環境の管理者から払い出し、値は証跡へ記載せず保管する")
    elif kind == "バッチ":
        lines.append("実行権限: ec-cubeコンテナ内で対象バッチを起動でき、開始・終了ログを取得できる")
    elif kind in {"外部・業務作業", "現場作業", "外部連携"}:
        lines.append(f"業務環境: {s.systems} のうち操作文で名指しされたサービス、帳票または現物を利用できる")
    if s.seed.get("担当者アカウント"):
        lines.append(f"担当者識別子: {s.seed['担当者アカウント']} は証跡用の実施者IDとし、EC-CUBEのログインIDには使用しない")
    lines.append(f"対象状態: {target_state(operation, kind, s, row_no, route)}")
    if guide:
        lines.append(f"設計根拠: {guide.source_path}（{guide.title}）")
        if guide.required_fields:
            lines.append("必須入力欄: " + " / ".join(guide.required_fields))
    if len(interface_ids(ifid)) > 1:
        lines.append("この工程で通過する機能: " + " → ".join(
            f"{feature} {feature_guide(str(s.repo), feature).title}" if feature_guide(str(s.repo), feature) else feature
            for feature in interface_ids(ifid)))
    return lines


def messages_for_action(guide: FeatureGuide | None, action: str) -> tuple[str, ...]:
    if not guide:
        return ()
    if "削除" in action:
        selected = tuple(m for m in guide.success_messages if "削除" in m)
    elif any(word in action for word in ("登録", "作成", "追加")):
        selected = tuple(m for m in guide.success_messages if any(word in m for word in ("登録", "保存", "追加")))
    elif any(word in action for word in ("更新", "変更", "保存")):
        selected = tuple(m for m in guide.success_messages if any(word in m for word in ("更新", "変更", "保存")))
    elif "複製" in action:
        selected = tuple(m for m in guide.success_messages if "複製" in m)
    else:
        selected = ()
    return selected


def observable_expected(s: ScenarioDoc, ifid: str, operation: str, source: str) -> str:
    """担当者の行為で終わる原文を、同じ対象キーを使う観測可能な判定へ寄せる。"""
    action = normalize_action(action_from_operation(operation), s)
    guide = guide_for(s, ifid)
    target = primary_seed(s.seed)
    source_result = normalize_expected_result(source)
    if reviewed_contract(s, operation):
        return source_result
    generic_execution = any(word in source_result for word in (
        "実行されること。", "実施されること。", "対応されること。", "作業されること。"
    ))
    # A source-derived assertion must not be replaced by a universal success claim.
    # Separate numeric/state contracts are appended as independent assertions below.
    if ifid == "-":
        return source_result
    concrete_words = ("表示", "ステータス", "状態", "履歴", "件数", "金額", "在庫数", "メール", "通知", "HTTP", "応答", "一覧", "詳細", "一致", "照合", "数量", "原価", "送り状", "CSV", "帳票")
    concrete_state = any(word in source for word in concrete_words) or bool(
        re.search(r"「[^」]+」.*(?:更新|変更|表示|登録|保存|出力|取得)", source)
    )
    if concrete_state and not generic_execution:
        return source_result
    if any(word in action for word in ("出力", "ダウンロード", "印刷", "発行")):
        return normalize_expected_result(f"{target} を含む出力物を取得できること。")
    if any(word in action for word in ("登録", "作成", "追加", "保存", "複製")):
        location = guide.title if guide else function_from_operation(operation) or "業務記録"
        return normalize_expected_result(f"{target} の処理結果が {location} に登録されること。")
    if any(word in action for word in ("更新", "変更", "反映", "確定", "キャンセル")):
        location = guide.title if guide else function_from_operation(operation) or "業務記録"
        return normalize_expected_result(f"{target} の処理後の値が {location} に更新されること。")
    if any(word in action for word in ("検索", "確認", "照合", "取得")):
        location = guide.title if guide else function_from_operation(operation) or "業務記録"
        return normalize_expected_result(f"{target} の処理結果を {location} で確認できること。")
    if generic_execution:
        location = guide.title if guide else function_from_operation(operation) or ifid
        return normalize_expected_result(
            f"{target} の処理後状態を {location} で確認でき、「{action}」の完了を対象キーで追跡できること。"
        )
    return source_result


def subflow_seed(s: ScenarioDoc, contract: dict) -> dict[str, str]:
    effective = {**contract.get("parameter_values", {}), **s.seed}
    for target_key, source_key in contract.get("parameter_aliases", {}).items():
        if s.seed.get(source_key):
            effective[target_key] = s.seed[source_key]
    effective.update(contract.get("parameter_overrides", {}))
    for key, timing in contract.get("runtime_keys", {}).items():
        effective.setdefault(key, f"実行時に記録（{timing}）")
    return effective


def rebind_values(text: str, old_seed: dict[str, str], new_seed: dict[str, str]) -> str:
    """キー付き試験値と一意な論理IDを置換し、数字1文字や原典行番号を壊さない。"""
    changes = {key: str(new_seed[key]) for key, value in old_seed.items()
               if key in new_seed and str(value) != str(new_seed[key])}
    # Apply labelled and bare replacements together. A second pass would also
    # replace an old ID embedded in its new value (ST-001 -> ST-001-A-A).
    values = {f"{key}={old_seed[key]}": f"{key}={value}" for key, value in changes.items()}
    for key, new in changes.items():
        old = str(old_seed[key])
        identity = key.endswith(("ID", "番号", "コード")) and len(old) > 3
        if identity or old.startswith("ST-") or re.fullmatch(r"\d{4}[-/]\d{2}[-/]\d{2}(?: .*)?", old) or re.fullmatch(r"[\d,]+円", old):
            targets = {str(new_seed.get(k, v)) for k, v in old_seed.items() if str(v) == old}
            if len(targets) == 1:
                values[old] = new
    if values:
        pattern = "|".join(re.escape(old) for old in sorted(values, key=len, reverse=True))
        text = re.sub(pattern, lambda match: values[match.group()], text)
    return text


def bind_pattern(s: ScenarioDoc, pattern: DataPattern | None) -> ScenarioDoc:
    if not pattern:
        return s
    updates = {}
    for part in re.split(r"\s+/\s+|\n", pattern.input_data):
        match = re.fullmatch(r"([^=\n]+)=([^\n]+)", part.strip())
        if match and match[1].strip() in s.seed:
            updates[match[1].strip()] = match[2].strip()
    if not updates:
        return s
    values = {**s.seed, **updates}
    bind = lambda value: rebind_values(value, s.seed, values)
    return replace(s, seed=values,
                   normal_rows=[{key: bind(value) for key, value in row.items()} for row in s.normal_rows],
                   branch_rows=[{key: bind(value) for key, value in row.items()} for row in s.branch_rows],
                   route_condition=bind(s.route_condition), final_state=bind(s.final_state))


def expand_subflow(s: ScenarioDoc, operation: str, stack: tuple[str, ...] = ()) -> tuple[list[str], list[str], list[str]]:
    """Inline only reviewed target steps, reusing the parent's actual records.

    The explicit target list prevents silently selecting a successful branch, and
    the recursion guard makes a circular business-flow reference visible.
    """
    contract = reviewed_contract(s, operation)
    if not contract or contract.get("kind") != "subflow":
        return [], [], []
    cid = contract["contract_id"]
    refs = [f"{contract.get('contract_file', 'scenario_test/coverage/source_contracts.json')} {cid}"]
    if cid in stack:
        return [], [f"{cid}の別業務参照が循環している。有限の実行範囲を確定する"], refs
    targets = contract.get("subflow_targets", [])
    if not targets:
        return [], [f"{cid}: {contract.get('reason') or '参照先シナリオと実行範囲を確定する'}"], refs
    keys = contract.get("matching_keys", []) or list(dict.fromkeys(key for target in targets for key in target.get("matching_keys", [])))
    if not keys:
        return [], [f"{cid}の親子間照合キーを確定する"], refs
    effective_seed = subflow_seed(s, contract)
    absent = [key for key in keys if not effective_seed.get(key)]
    if absent:
        return [], [f"{cid}の引き継ぎキー {','.join(absent)} を親シナリオの実行用テストデータへ追加する"], refs
    shared = " / ".join(f"{key}={effective_seed[key]}" for key in keys)
    lines = [f"【別業務展開 {cid}】", f"引き継ぎデータ: {shared}",
             "開始前: 親工程で取得した実ID・値を再利用する。子シナリオのfixtureで同じ案件を新規作成しない。未採番のキーは初回採番工程で実IDを記録し、それ以降の全工程で同じ値を使用する。"]
    if contract.get("parameter_values"):
        lines.append("補助データ（親の具体値を優先）: " + " / ".join(f"{key}={effective_seed[key]}" for key in contract["parameter_values"]))
    for key, timing in contract.get("runtime_keys", {}).items():
        if key in keys:
            lines.append(f"実ID記録契機 {key}: {timing}")
    conditional = contract.get("subflow_selection") == "evaluate_condition_per_target"
    if conditional:
        lines.append("【条件選択】対象商品の適用条件を先に確定する。同じ条件の参照先だけを以下の順序で実行する。新弾と新弾以外は排他であり、一つの案件で両方を直列実行しない。両条件の試験は別案件・別実行証跡で行う。")
    overrides = contract.get("parameter_overrides", {})
    if overrides:
        lines.append("呼出し元の移動条件: " + " / ".join(f"{key}={value}" for key, value in overrides.items()))
    blockers = []
    for target in targets:
        sid = target.get("scenario_id", "")
        paths = sorted((s.repo / "scenario_test/scenario").glob(f"{sid}_*.md")) if sid else []
        child = parse_scenario(paths[0], s.repo) if len(paths) == 1 else None
        if child is None or child.sid != sid:
            blockers.append(f"{cid}の参照先 {sid or '未指定'} を一意に特定する")
            continue
        refs.append(str(child.path))
        step_numbers = target.get("target_steps")
        if step_numbers is None:
            first, last = target.get("first_step"), target.get("last_step")
            if first is None or last is None:
                blockers.append(f"{cid}/{sid}の開始工程と終了工程を確定する")
                continue
            step_numbers = list(range(int(first), int(last) + 1))
        rows_by_number = {int(row["#"]): (idx, row) for idx, row in enumerate(child.normal_rows) if row.get("#", "").isdigit()}
        if not step_numbers or any(int(number) not in rows_by_number for number in step_numbers):
            blockers.append(f"{cid}/{sid}の指定工程 {step_numbers} が生成された実行手順に存在しない")
            continue
        semantic_keys = set(keys) | {key for key in child.seed if key in effective_seed and key not in {"担当者アカウント"}}
        bound_seed = {**child.seed, **{key: effective_seed[key] for key in semantic_keys if key in effective_seed}}
        replacements = {}
        # The reviewed recommendation subflow runs from branch to trade. Rebind
        # both locations and actors atomically; chained replacements swap twice.
        if overrides and "在庫リコメンド" in sid:
            replacements.update({"支店": overrides.get("移動元", "支店"), "トレード": overrides.get("移動先", "トレード")})

        def rebind(text: str) -> str:
            text = rebind_values(text, child.seed, bound_seed)
            if not replacements:
                return text
            pattern = "|".join(re.escape(old) for old in sorted(replacements, key=len, reverse=True))
            return re.sub(pattern, lambda match: replacements[match.group()], text)

        child_bound = replace(child, seed=bound_seed)
        condition = target.get("condition", "この参照先を実行する")
        if conditional:
            lines.append(f"【条件付き範囲開始】「{condition}」を満たす案件だけで次の参照先を実行する。満たさない場合は対象外として根拠を記録する。")
        lines.append(f"参照先 {sid} / 選択条件: {condition} / 指定工程: {','.join(map(str, step_numbers))}")
        refs.append(f"{target.get('source_file', '')} {','.join(target.get('source_rows', []))}")
        for number in step_numbers:
            idx, row = rows_by_number[int(number)]
            actor = rebind(row.get("担当者") or child.main_actor)
            op = rebind(row.get("操作", ""))
            if "外部システム/ツール上" in op:
                action = normalize_action(action_from_operation(op), child_bound)
                op = f"{named_location(action, row.get('確認対象', ''))}で「{action}」を実施する"
            expected = rebind(row.get("期待結果", ""))
            lines.append(f"  {sid} #{number}: {actor} / 操作: {op} / 対象: {rebind(row.get('入力/対象', ''))} / 引き継ぎキー: {shared}")
            lines.append(f"  操作後判定 #{number}: {expected} / 確認場所: {rebind(row.get('確認対象', ''))}")
            nested, nested_blockers, nested_refs = expand_subflow(child_bound, row.get("操作", ""), stack + (cid,))
            lines.extend(rebind(line) for line in nested)
            blockers.extend(nested_blockers)
            refs.extend(nested_refs)
            if "実施保留条件:" in op or "実施保留条件:" in expected:
                blockers.append(f"{sid} #{number} の実施保留条件を解除する")
        lines.append(f"完了後: {sid}の開始時と終了時の{shared}を同じ実IDで突合し、子工程の操作証跡を親テストIDの証跡フォルダへ保存する。")
        if conditional:
            lines.append("【条件付き範囲終了】")
    return lines, list(dict.fromkeys(blockers)), list(dict.fromkeys(refs))


def operation_steps(
    row: dict[str, str],
    s: ScenarioDoc,
    ifid: str,
    pattern: DataPattern | None = None,
    branch: bool = False,
) -> str:
    original = s
    s = bind_pattern(s, pattern)
    row = {key: rebind_values(value, original.seed, s.seed) for key, value in row.items()}
    actor = row.get("担当者") or s.main_actor
    operation = row.get("操作", "")
    action = normalize_action(action_from_operation(operation), s)
    function = function_from_operation(operation)
    row_no = row.get("#", "")
    kind = interface_kind(ifid, operation)
    guide = guide_for(s, ifid)
    target = pattern.input_data if pattern and pattern.input_data else row.get("入力/対象", "") or primary_seed(s.seed)
    lines = [f"担当者: {actor}", "【準備確認】"]
    lines.extend(f"{i}. {line}" for i, line in enumerate(preparation_lines(s, ifid, operation, row_no), 1))
    lines.append("【操作】")
    n = 1
    if kind == "管理画面":
        lines.append(f"{n}. 管理画面で {function or (guide.title if guide else ifid)} を開く")
        n += 1
    elif kind == "フロント画面":
        lines.append(f"{n}. フロント画面で {function or (guide.title if guide else ifid)} を開く")
        n += 1
    elif kind == "API":
        endpoint = API_ENDPOINTS.get(ifid, f"{guide.title if guide else ifid} の設計書に定義された実行先")
        lines.append(f"{n}. APIクライアントで {endpoint} のリクエストを作成する")
        n += 1
        if guide and guide.input_summary:
            lines.append(f"{n}. リクエスト入力: {guide.input_summary}")
            n += 1
    elif kind == "バッチ":
        command = BATCH_COMMANDS.get(ifid)
        if command:
            lines.append(f"{n}. 実行開始時刻を記録し、`{command}` を実行する")
        else:
            lines.append(f"{n}. {guide.title if guide else function or ifid} の実行開始時刻を記録して起動する")
        n += 1
    lines.append(f"{n}. 対象データ: {target}")
    n += 1
    if len(interface_ids(ifid)) > 1:
        lines.append(f"{n}. 通過する機能: " + " → ".join(interface_ids(ifid)) + "。最初の機能から操作して後続画面へ進み、同じ対象データを使う")
        n += 1
    if branch:
        condition = pattern.precondition_delta if pattern and pattern.precondition_delta else action
        lines.append(f"{n}. 分岐条件「{condition}」を成立させる")
        n += 1
    lines.append(f"{n}. 「{action}」を実施する")
    expansion, blockers, _ = expand_subflow(s, operation)
    lines.extend(expansion)
    if blockers:
        lines.append("別業務の実施保留条件: " + " / ".join(blockers))
    n += 1
    lines.append("【操作後確認】")
    if kind == "API" and guide and guide.success_summary:
        lines.append(f"{n}. HTTPステータスと応答本文を保存する: {guide.success_summary}")
    elif kind in {"外部・業務作業", "現場作業", "外部連携"}:
        location = named_location(action, row.get("確認対象", ""))
        lines.append(f"{n}. {location}で、{row.get('期待結果', '')}の実値と対象データ {target} の対応を記録する")
    else:
        selected_messages = messages_for_action(guide, action)
        messages = " / ".join(selected_messages) if selected_messages else "処理後の画面表示"
        lines.append(f"{n}. {function or (guide.title if guide else ifid)} で対象キーと {messages} を記録する")
    return "\n".join(lines)


def normal_steps(row: dict[str, str], s: ScenarioDoc, ifid: str, pattern: DataPattern | None = None) -> str:
    return operation_steps(row, s, ifid, pattern, branch=False)


def branch_steps(row: dict[str, str], s: ScenarioDoc, ifid: str, pattern: DataPattern | None = None) -> str:
    bound = bind_pattern(s, pattern)
    for module in execution_repairs.modules():
        method = getattr(module, "branch_operations", None)
        operations = method(bound, row.get("分岐ID", ""), pattern) if method else None
        if operations:
            prepared = preparation_lines(bound, ifid, row.get("操作", ""), route=True)
            return "\n".join([f"担当者: {row.get('担当者') or bound.main_actor}", "【準備確認】", *prepared,
                              f"分岐条件: {pattern.precondition_delta if pattern else row.get('入力/対象', '')}",
                              "【操作】", *[f"{i}. {op}" for i, op in enumerate(operations, 1)],
                              "【操作後確認】", row.get("期待結果", ""), row.get("確認対象", "")])
    return operation_steps(row, s, ifid, pattern, branch=True)


def title_result(value: str) -> str:
    text = normalize_expected_result(value)
    text = re.sub(r"[。．]+$", "", text).strip()
    text = re.sub(r"こと$", "", text).strip()
    return text or "最終業務状態"


def route_steps(s: ScenarioDoc, pattern: DataPattern | None = None) -> str:
    s = bind_pattern(s, pattern)
    target = pattern.input_data if pattern and pattern.input_data else primary_seed(s.seed)
    route_condition = s.route_condition if s.route_condition and s.route_condition != "-" else s.business_trigger
    lines = [
        f"担当者: {s.main_actor}",
        "【準備確認】",
    ]
    operation_text = " ".join(row.get("操作", "") for row in (s.normal_rows or s.branch_rows))
    lines.extend(f"{i}. {line}" for i, line in enumerate(preparation_lines(s, "-", operation_text, route=True), 1))
    lines.extend([
        "【操作】",
        f"1. 経路ID {s.route_id}（{s.route_kind}）の条件「{route_condition}」を満たすことを確認する",
        f"2. 経路代表データ: {target}",
    ])
    step_no = 3
    variation = bool(pattern and "業務データ差分" in pattern.kind)
    variation_steps = set(re.findall(r"#(\d+)", pattern.target)) if variation else set()
    if s.normal_rows:
        step_label = "正常系" if s.route_kind == "正常代表" else ("代替系" if s.route_kind == "主要代替" else "異常系")
        for idx, row in enumerate(s.normal_rows):
            actor = row.get("担当者") or s.main_actor
            row_no = row.get("#", str(step_no - 2))
            operation = row.get("操作", "")
            action = normalize_action(action_from_operation(operation), s)
            function = function_from_operation(operation)
            ifid = s.normal_features[idx] if idx < len(s.normal_features) else feature_for_operation(operation, s)
            guide = guide_for(s, ifid)
            input_data = row.get("入力/対象", "") or target
            if variation and row_no in variation_steps:
                lines.append(f"   差分条件を適用: {pattern.precondition_delta}")
                input_data = f"{pattern.input_data}（代表シードの同名項目をこの値に差し替え、後続工程も同じ実データを使う）"
            location = function or (guide.title if guide else "")
            prefix = f"{location}で" if location else ""
            lines.append(f"{step_no}. {step_label}#{row_no}: {actor}が{prefix}「{action}」を実施する")
            lines.append(f"   対象: {input_data}")
            expansion, blockers, _ = expand_subflow(s, operation)
            lines.extend("   " + line for line in expansion)
            if blockers:
                lines.append("   別業務の実施保留条件: " + " / ".join(blockers))
            step_no += 1
    else:
        for row in s.branch_rows:
            actor = row.get("担当者") or s.main_actor
            branch_id = row.get("分岐ID", "-")
            operation = row.get("操作", "")
            action = normalize_action(action_from_operation(operation), s)
            function = function_from_operation(operation)
            input_data = row.get("入力/対象", "") or target
            location = f"{function}で" if function else ""
            lines.append(f"{step_no}. 分岐{branch_id}: {actor}が{location}「{action}」を実施する")
            lines.append(f"   対象: {input_data}")
            step_no += 1
    lines.append("【操作後確認】")
    lines.append(f"{step_no}. 最終業務状態「{s.final_state}」を対象キーで確認し、各工程の証跡を同じテストIDの証跡フォルダへ保存する")
    return "\n".join(lines)


def route_item_title(flow_type: str, s: ScenarioDoc) -> str:
    return f"{flow_type} 経路全体 {s.route_id}: {s.route_kind}として「{title_result(s.final_state)}」を確認する"


def item_title(flow_type: str, row_no: str, actor: str, operation: str, s: ScenarioDoc, expected_source: str = "") -> str:
    action = normalize_action(action_from_operation(operation), s)
    result = title_result(expected_source or s.final_state)
    return f"{flow_type} #{row_no}: {actor}が「{action}」を行い「{result}」を確認する"


def scenario_suffix(sid: str) -> str:
    return re.sub(r"[^A-Z0-9]+", "-", sid.replace("SCN-", "").upper()).strip("-")


def flow_type_from_branch(branch_id: str) -> str:
    return "代替系" if branch_id.startswith("A") else "異常系"


def primary_flow_type(s: ScenarioDoc) -> str:
    if s.classification in {"正常系", "代替系", "異常系"}:
        return s.classification
    if s.route_kind == "主要代替":
        return "代替系"
    if s.route_kind == "業務異常":
        return "異常系"
    return "正常系"


def build_precondition(
    s: ScenarioDoc,
    pattern: DataPattern | None = None,
    ifid: str = "-",
    operation: str = "",
    row_no: str | None = None,
    route: bool = False,
) -> str:
    s = bind_pattern(s, pattern)
    parts = [
        f"元シナリオ: {s.sid} {s.title}",
        f"業務: {s.business}",
        f"経路ID: {s.route_id}",
        f"経路種別: {s.route_kind}",
        f"業務経路条件: {s.route_condition}",
        f"最終業務状態: {s.final_state}",
        f"主アクター: {s.main_actor}",
        f"関連システム: {s.systems}",
    ]
    if pattern:
        parts.append(f"データパターンID: {pattern.pattern_id}")
        parts.append(f"データパターン種別: {pattern.kind}")
        if pattern.precondition_delta:
            parts.append(f"前提差分: {pattern.precondition_delta}")
    if s.seed:
        parts.append("シードデータ: " + " / ".join(f"{k}={v}" for k, v in s.seed.items()))
    parts.append("準備手順:")
    parts.extend(f"- {line}" for line in preparation_lines(s, ifid, operation, row_no, route))
    text = "\n".join(parts)
    operations = [row.get("操作", "") for row in s.normal_rows] if route else [operation]
    blockers = [blocker for op in operations for blocker in expand_subflow(s, op)[1]]
    blockers.extend(op.split("実施保留条件:", 1)[1].rstrip("）") for op in operations if "実施保留条件:" in op)
    if blockers:
        text = blocked_precondition(text, " / ".join(dict.fromkeys(blockers)))
    return text


def normal_representative_pattern(s: ScenarioDoc) -> DataPattern | None:
    for pattern in s.data_patterns:
        if pattern.pattern_id.startswith("DP-N") or pattern.kind == "正常系 代表":
            return pattern
    return s.data_patterns[0] if s.data_patterns else None


def normal_boundary_patterns(s: ScenarioDoc) -> list[DataPattern]:
    return [pattern for pattern in s.data_patterns if "境界" in pattern.kind or pattern.pattern_id.startswith("DP-B")]


def target_step_index(pattern: DataPattern, fallback: int, max_index: int) -> int:
    nums = [int(n) for n in re.findall(r"#(\d+)", pattern.target)]
    if not nums:
        return min(max(1, fallback), max(1, max_index))
    return min(max(1, nums[-1]), max(1, max_index))


def pattern_for_branch(s: ScenarioDoc, branch_id: str) -> DataPattern | None:
    numeric = int(re.sub(r"\D", "", branch_id) or "1")
    expected_id = f"DP-{branch_id[0]}{numeric:03d}"
    for pattern in s.data_patterns:
        if pattern.pattern_id == expected_id:
            return pattern
    for pattern in s.data_patterns:
        if branch_id in pattern.target:
            return pattern
    return None


def pattern_input(pattern: DataPattern | None, fallback: str, branch_id: str | None = None) -> str:
    if not pattern:
        return fallback
    parts = [f"データパターンID={pattern.pattern_id}", f"種別={pattern.kind}"]
    if branch_id:
        parts.append(f"分岐ID={branch_id}")
    if pattern.purpose:
        parts.append(f"目的={pattern.purpose}")
    parts.append(f"入力={pattern.input_data or fallback}")
    return "\n".join(parts)


def build_observation(
    s: ScenarioDoc,
    test_id: str,
    ifid: str,
    expected: str,
    source_observation: str,
    route: bool = False,
    operation: str = "",
) -> str:
    guide = guide_for(s, ifid)
    target = primary_seed(s.seed)
    locations: list[str] = []
    if guide:
        locations.append(f"{guide.title}（{ifid}）")
    for line in source_observation.splitlines():
        value = cell(line)
        if value and value not in locations:
            locations.append(value)
    if route:
        locations.append("経路内の各画面・API応答・外部サービス・帳票・現物と最終業務状態")
    if not locations:
        locations.append("操作後の画面表示・応答・出力物・業務記録")
    lines = [
        "確認場所: " + " / ".join(locations),
        f"照合キー: {target}",
        f"合格条件: {expected}",
        f"不合格条件: 照合キーが一致しない、期待した状態を観測できない、または処理エラーが残る場合は不合格とする。",
    ]
    selected_messages = messages_for_action(guide, normalize_action(action_from_operation(operation), s)) if operation else ()
    if selected_messages:
        lines.append("成功表示候補（設計書）: " + " / ".join(selected_messages))
    lines.extend([
        f"証跡保存先: scenario_test/exec/evidence/{test_id}/",
        "必須証跡: before.png / after.png / result.txt（API・CSV・メール・ログ・現物は該当する原本または写真）",
        f"判定記録: scenario_test/exec/test_result_template.tsv に {test_id}、実施日時、実施者、実値、合否、証跡パスを記録する",
    ])
    if guide:
        lines.append(f"判定根拠: {guide.source_path}")
    lines.append(f"業務結果根拠: {s.path} / {s.trace_source}")
    return "\n".join(lines)


def execution_key(item: TestItem) -> tuple[str, str, str, str]:
    return tuple(
        re.sub(r"\s+", " ", value).strip()
        for value in (item.precondition, item.input_data, item.steps, item.expected)
    )


def dedupe_items(items: list[TestItem], base: str) -> list[TestItem]:
    seen: set[tuple[str, str, str, str]] = set()
    deduped: list[TestItem] = []
    for item in items:
        key = execution_key(item)
        if key in seen:
            continue
        seen.add(key)
        new_id = f"STI-{base}-{len(deduped) + 1:03d}"
        deduped.append(replace(item, test_id=new_id, observation=item.observation.replace(item.test_id, new_id)))
    return deduped


def blocked_precondition(value: str, reason: str) -> str:
    value = re.sub(r"(?m)^- 実施区分:.*$", "- 実施区分: 実施保留（判定根拠確定待ち）", value)
    return value + f"\n- 解除条件: {reason}\n- 判定制約: 解除条件が満たされるまで未実施・保留と記録し、合格にしない。"


def data_link_items(s: ScenarioDoc, start: int) -> list[TestItem]:
    """Make lineage observable without treating an open end as a proven handoff.

    Original diagram IDs (#103 etc.) are not scenario execution step numbers.
    We therefore inline the route, and label those IDs as original-flow nodes.
    """
    result = []
    pattern = normal_representative_pattern(s)
    flow = primary_flow_type(s)
    for link in s.data_links:
        lid = link["連鎖ID"]
        producer = link.get("産出工程", "-")
        consumer = link.get("消費工程", "-")
        artifact = link.get("産出データ/帳票", "-")
        key = link.get("照合キー", "-")
        verdict = link.get("判定", "")
        unknown_key = key in {"", "-"} or any(x in key for x in ("未定義", "自由端", "不明"))
        terminal = "終端" in verdict or "消費先" in consumer
        origin = "起点" in verdict or "産出元" in producer
        key_note = ""
        ref = f"{s.path} データ連鎖 {lid} / {s.trace_source}"
        # The transfer-result CSV has no product-code column. Its true identity is
        # the generated transfer instruction ID, linked back to the seeded stock.
        if "在庫移動実績" in artifact:
            key = "移動指示ID（当該シードの在庫移動IDに紐づく実ID）"
            unknown_key = False
            fields = "移動指示ID・送り状No."
            key_note = "産出CSVの移動指示IDを記録し、その行の送り状No.に1234-5678を入力する。CSVに商品コード列を追加しない。"
            ref += f" / {STOCK}#sheet-32"
        elif "受注" in artifact:
            fields = "受注番号・商品コード・数量"
            key_note = "注文時の商品コードと数量を記録し、受注番号の実IDとの対応を保存する。"
            ref += f" / {ORDER}#sheet-15"
        else:
            fields = "原本にある全項目の項目名・値（更新対象列は更新前後を別々に記録）"
        recovered = (execution_repairs.resolve_link_identity(artifact, producer, s.business)
                     or resolve_link_identity(artifact, producer, s.business))
        if recovered:
            key, fields, key_note, key_source = recovered
            unknown_key = False
            ref += f" / {key_source}"
        explicit_comparison = re.search(r"同一であり、(.+?)を工程間の実行記録で照合", link.get("期待（データのつながり）", ""))
        if explicit_comparison:
            fields = explicit_comparison.group(1)
            key_note += " 各比較項目を初めて記録した工程の原本と、それ以後に参照した原本を保存する。受注/移動の初回登録時にまだ存在しない入金日・出荷日・送り状番号は、その生成工程以降で比較する。"
            ref += " / " + link["期待（データのつながり）"].split("出典:", 1)[-1]
        blocked = ""
        origin_evidence = execution_repairs.resolve_link_origin(artifact, producer, s.business) if origin else None
        if origin_evidence:
            key_note += " 起点の取得方法: " + origin_evidence
            ref += " / 起点補完根拠: " + origin_evidence
        if unknown_key:
            blocked = f"{artifact}の照合キーを原典またはHTML設計書の項目に対応付け、産出値を消費値と識別できる根拠を記録する。単一シードであることだけでは代用しない。"
        if origin and not origin_evidence:
            blocked += f" 原典上で未記載の産出元と{artifact}の取得方法を確定する。"
        gap_reason = ""
        if blocked:
            gap_reason, investigated, decision = unresolved_lineage_evidence(s, link, unknown_key, origin)
            blocked += f" 未確定理由: {gap_reason} 必要な判断: {decision}"
            ref += " / 調査済出典: " + " / ".join(investigated)
        if terminal:
            expected = f"産出工程 {producer} の成果物 {artifact} の{fields}が、照合キー {key} に対応する作業元の確定値と一致する状態であること。"
            scope = "終端の成果物確認（後続工程への受け渡しは未判定）"
            compare = f"産出原本から {fields} を読み取り、対象シードに対応付けた作業元の確定値（入力原本・出力対象の元明細・送信前プレビュー）と項目ごとに比較する。消費先の同一性を合格扱いしない。"
        else:
            expected = f"{producer}で産出した{artifact}の{fields}が、{consumer}が参照した値と照合キー {key} で一致する状態であること。"
            scope = "産出値と消費値の照合"
            compare = f"{consumer}で実際に参照した原本をconsumer原本として保存し、{fields}をproducer原本と同じ照合キーで比較する。工程間で変更した列は原典に明記された変換だけを許容し、その計算過程を別記する。"
            if explicit_comparison:
                expected = link["期待（データのつながり）"].split("出典:", 1)[0].strip()
                compare = f"{consumer}の実行記録で{fields}を照合する。各値はそれを初めて記録した工程の原本に対応付け、同一の実受注番号/在庫移動IDで引き継ぐ。作成前の項目には存在や一致を要求せず、初回記録後の値を比較する。"
        # A preparation gap must not replace the business requirement with
        # "record a hold". Keep the intended comparison and block execution in
        # the prerequisite, so resolving the gap cannot accidentally pass it.
        tid = f"STI-{scenario_suffix(s.sid)}-{start + len(result):03d}"
        precondition = build_precondition(s, pattern, route=True)
        precondition += f"\n- 連鎖ID: {lid}\n- 対象範囲: {scope}\n- 原典判定: {verdict}\n- 判定根拠: {ref}"
        if blocked:
            precondition = blocked_precondition(precondition, blocked)
            precondition += f"\n- 未確定理由: {gap_reason}"
        steps = route_steps(s, pattern)
        steps += (f"\n【準備確認】\n連鎖ID={lid}。以下の#番号は原典ノード番号。産出={producer}、消費={consumer}。\n"
                  f"照合キー={key}。{key_note}\n【操作】\n産出工程の完了直後に{artifact}をproducer原本として保存する。\n"
                  f"{compare}\n【操作後確認】\n照合表に項目名、産出値、消費値または対象シード値、差分、原本パスを記録する。")
        if blocked:
            steps = (f"【準備確認】\n{lid}: {blocked}\n【操作】\n根拠未確定の間は経路を実行せず、未定義箇所と参照した原典を記録する。\n"
                     "【操作後確認】\n結果台帳に保留を記録する。解除条件の確定後に産出原本と消費原本の比較手順を確定して実施する。")
        observation = build_observation(s, tid, "-", expected, artifact)
        observation = re.sub(r"(?m)^照合キー:.*$", f"照合キー: {key}", observation)
        observation += f"\n判定根拠: {ref}\n連鎖判定: {verdict}\n必須照合証跡: producer原本 / consumer原本（連鎖ありの場合） / comparison.tsv"
        if blocked:
            observation += "\n判定制約: 保留は合格件数・網羅済み件数に算入しない。"
        result.append(TestItem(function_display_name(s), tid, "-", "データ連鎖", s.priority,
                               f"{flow} {lid}: {scope} — {artifact}", precondition,
                               pattern_input(pattern, primary_seed(s.seed)) + f"\n連鎖ID={lid}\n照合キー={key}",
                               steps, normalize_expected_result(expected), observation, flow, s.sid))
    return result


def concrete_assertion_items(s: ScenarioDoc, start: int) -> list[TestItem]:
    result = []
    pattern = normal_representative_pattern(s)
    flow = primary_flow_type(s)
    for idx, row in enumerate(s.normal_rows):
        operation = row.get("操作", "")
        ifid = s.normal_features[idx] if idx < len(s.normal_features) else "-"
        row_no = row.get("#", str(idx + 1))
        contract = reviewed_contract(s, operation)
        assertion_operation = f"「{contract.get('source_action_original', contract['source_action'])}」" if contract else operation
        for assertion in assertions_for(s, assertion_operation, ifid):
            tid = f"STI-{scenario_suffix(s.sid)}-{start + len(result):03d}"
            expected = normalize_expected_result(assertion.expected)
            precondition = build_precondition(s, pattern, ifid, operation, row_no)
            precondition += f"\n- 判定用準備: {assertion.preparation}\n- 判定根拠: {assertion.source}"
            if assertion.blocked:
                precondition = blocked_precondition(precondition, assertion.blocked)
            observation = build_observation(s, tid, ifid, expected, assertion.location, operation=operation)
            observation += f"\n判定根拠: {assertion.source}\n比較規則: {assertion.check}"
            steps = normal_steps(row, s, ifid, pattern)
            steps = steps.replace("【準備確認】", f"【準備確認】\n判定用準備: {assertion.preparation}", 1)
            steps += f"\n具体照合: {assertion.check}"
            result.append(TestItem(function_display_name(s), tid, ifid, assertion.viewpoint, s.priority,
                                   f"{flow} 工程#{row_no} 判定: {assertion.name}", precondition,
                                   pattern_input(pattern, primary_seed(s.seed)) + f"\n判定用具体値: {assertion.preparation}",
                                   steps, expected, observation, flow, s.sid))
    return result


def normal_variation_items(s: ScenarioDoc, start: int) -> list[TestItem]:
    """Every extra normal data pattern must execute its distinct business input."""
    items = []
    representative = normal_representative_pattern(s)
    for pattern in s.data_patterns:
        if not pattern.pattern_id.startswith("DP-N") or pattern == representative or "境界" in pattern.kind:
            continue
        numbers = [int(n) for n in re.findall(r"#(\d+)", pattern.target)]
        valid = bool(numbers) and all(1 <= n <= len(s.normal_rows) for n in numbers)
        tid = f"STI-{scenario_suffix(s.sid)}-{start + len(items):03d}"
        flow = primary_flow_type(s)
        precondition = build_precondition(s, pattern, route=True)
        precondition += f"\n- 差分設定: {pattern.precondition_delta}\n- 判定根拠: {pattern.purpose}"
        expected = normalize_expected_result(pattern.observation)
        if not valid or not pattern.observation or not pattern.precondition_delta:
            reason = f"{pattern.pattern_id}の実在する対象工程・条件設定・差分固有の期待結果を確定する"
            precondition = blocked_precondition(precondition, reason)
            expected = "業務データ差分の実行範囲または期待結果が未確定のため、判定が保留として記録されること。"
        steps = route_steps(s, pattern)
        steps = steps.replace("【準備確認】", f"【準備確認】\n差分実行ID: {pattern.pattern_id}\n条件設定: {pattern.precondition_delta}\n試験ごとに独立した案件を準備する。", 1)
        steps += f"\n【操作後確認】\n差分対象工程: {pattern.target}\n差分固有判定: {pattern.observation}\n条件・入力値・対象工程の実測値をvariation-comparison.tsvへ記録する。"
        observation = build_observation(s, tid, "-", expected, pattern.observation, route=True)
        observation += f"\n差分判定根拠: {pattern.purpose}\n必須照合証跡: variation-comparison.tsv（条件・入力値・期待値・実測値・差分）"
        items.append(TestItem(function_display_name(s), tid, "-", "業務データ差分", s.priority,
                              f"{flow} {pattern.pattern_id}: {pattern.purpose.split('原典本文', 1)[0].strip()}",
                              precondition, pattern_input(pattern, primary_seed(s.seed)), steps, expected, observation, flow, s.sid))
    return items


def subflow_items(s: ScenarioDoc, start: int) -> list[TestItem]:
    items = []
    pattern = normal_representative_pattern(s)
    flow = primary_flow_type(s)
    for row in s.normal_rows:
        operation = row.get("操作", "")
        contract = reviewed_contract(s, operation)
        if not contract or contract.get("kind") != "subflow":
            continue
        cid = contract["contract_id"]
        expansion, blockers, refs = expand_subflow(s, operation)
        keys = contract.get("matching_keys", []) or list(dict.fromkeys(key for target in contract.get("subflow_targets", []) for key in target.get("matching_keys", [])))
        effective_seed = subflow_seed(s, contract)
        shared = " / ".join(f"{key}={effective_seed.get(key, '実行用テストデータ未定義')}" for key in keys)
        tid = f"STI-{scenario_suffix(s.sid)}-{start + len(items):03d}"
        expected = (normalize_expected_result(row.get("期待結果", "") or contract.get("expected_result", "")) if blockers else
                    f"別業務 {cid} の適用条件を満たす指定工程が完了し、引き継ぎキー {shared} が初回記録時から完了時まで同じ案件の実IDを示す状態であること。")
        precondition = build_precondition(s, pattern, "-", operation, row.get("#"))
        if blockers:
            precondition = blocked_precondition(precondition, " / ".join(blockers))
        steps = ("【準備確認】\n" + " / ".join(blockers) + "\n【操作】\n未定義箇所を確定するまで別業務の実行を保留する。\n【操作後確認】\n結果を保留と記録する。" if blockers else
                 "【準備確認】\n" + f"親工程の実ID対応: {shared}\n【操作】\n" + "\n".join(expansion) + "\n【操作後確認】\n開始時と終了時のキー・実ID対応を比較し、差分を記録する。")
        observation = build_observation(s, tid, "-", expected, "別業務の各工程に展開された確認場所")
        observation += "\n別業務判定根拠: " + " / ".join(refs)
        observation += "\n必須照合証跡: subflow-identity.tsv（親キー・親実ID・子開始時実ID・子完了時実ID・差分）"
        if blockers:
            observation += "\n判定制約: 保留を合格として扱わない。"
        items.append(TestItem(function_display_name(s), tid, "-", "別業務引き継ぎ", s.priority,
                              f"{flow} 別業務 {cid}: {contract.get('screen', '')}の対象同一性と指定工程の完了",
                              precondition, pattern_input(pattern, primary_seed(s.seed)) + f"\n引き継ぎキー={shared or '根拠未定義'}",
                              steps, expected, observation, flow, s.sid))
    return items


def test_items_for(s: ScenarioDoc) -> list[TestItem]:
    items: list[TestItem] = []
    base = scenario_suffix(s.sid)
    function_name = function_display_name(s)
    counter = 1
    normal_pattern = normal_representative_pattern(s)
    main_flow_type = primary_flow_type(s)
    if normal_pattern or s.normal_rows or s.branch_rows:
        expected = normalize_expected_result(s.final_state)
        tid = f"STI-{base}-{counter:03d}"
        source_observation = (normal_pattern.observation if normal_pattern else "") or "完了条件・業務状態・処理履歴"
        observation = build_observation(s, tid, "-", expected, source_observation, route=True)
        items.append(
            TestItem(
                function_name,
                tid,
                "-",
                "業務経路",
                s.priority,
                route_item_title(main_flow_type, s),
                build_precondition(s, normal_pattern, route=True),
                pattern_input(normal_pattern, primary_seed(s.seed)),
                route_steps(s, normal_pattern),
                expected,
                observation,
                main_flow_type,
                s.sid,
            )
        )
        counter += 1
    for idx, row in enumerate(s.normal_rows):
        operation = row.get("操作", "")
        expected_source = row.get("期待結果", "")
        expected = normalize_expected_result(expected_source)
        fallback_input = row.get("入力/対象", "") or primary_seed(s.seed)
        input_data = pattern_input(normal_pattern, fallback_input)
        actor = row.get("担当者") or s.main_actor
        row_no = row.get("#", str(counter))
        viewpoint = infer_viewpoint(main_flow_type, operation, expected_source)
        ifid = s.normal_features[idx] if idx < len(s.normal_features) else "-"
        if ifid == "-":
            ifid = feature_for_operation(operation, s)
        expected = observable_expected(s, ifid or "-", operation, expected_source)
        tid = f"STI-{base}-{counter:03d}"
        source_observation = row.get("確認対象", "") or (normal_pattern.observation if normal_pattern else "") or "画面表示・処理ステータス・処理履歴"
        observation = build_observation(s, tid, ifid or "-", expected, source_observation, operation=operation)
        items.append(
            TestItem(
                function_name,
                tid,
                ifid or "-",
                viewpoint,
                s.priority,
                item_title(main_flow_type, row_no, actor, operation, s, expected),
                build_precondition(s, normal_pattern, ifid or "-", operation, row_no),
                input_data,
                normal_steps(row, s, ifid or "-", normal_pattern),
                expected,
                observation,
                main_flow_type,
                s.sid,
            )
        )
        counter += 1
    for pattern in normal_boundary_patterns(s):
        if not s.normal_rows:
            continue
        step_idx = target_step_index(pattern, len(s.normal_rows), len(s.normal_rows)) - 1
        row = s.normal_rows[step_idx]
        operation = row.get("操作", "")
        expected_source = row.get("期待結果", "")
        expected = normalize_expected_result(expected_source)
        actor = row.get("担当者") or s.main_actor
        row_no = row.get("#", str(step_idx + 1))
        ifid = s.normal_features[step_idx] if step_idx < len(s.normal_features) else "-"
        if ifid == "-":
            ifid = feature_for_operation(operation, s)
        expected = observable_expected(s, ifid or "-", operation, expected_source)
        boundary_flow_type = "正常系 境界" if main_flow_type == "正常系" else f"{main_flow_type} 境界"
        tid = f"STI-{base}-{counter:03d}"
        source_observation = pattern.observation or row.get("確認対象", "") or "画面表示・処理ステータス・処理履歴"
        observation = build_observation(s, tid, ifid or "-", expected, source_observation, operation=operation)
        items.append(
            TestItem(
                function_name,
                tid,
                ifid or "-",
                "境界値",
                s.priority,
                item_title(f"{boundary_flow_type} {pattern.pattern_id}", row_no, actor, operation, s, expected),
                build_precondition(s, pattern, ifid or "-", operation, row_no),
                pattern_input(pattern, row.get("入力/対象", "") or primary_seed(s.seed)),
                normal_steps(row, s, ifid or "-", pattern),
                expected,
                observation,
                main_flow_type,
                s.sid,
            )
        )
        counter += 1
    for row in s.branch_rows:
        branch_id = row.get("分岐ID", "")
        flow_type = flow_type_from_branch(branch_id)
        pattern = pattern_for_branch(s, branch_id)
        operation = row.get("操作", "")
        expected_source = row.get("期待結果", "")
        expected = normalize_expected_result(expected_source)
        fallback_input = row.get("入力/対象", "") or primary_seed(s.seed)
        input_data = pattern_input(pattern, fallback_input, branch_id)
        actor = row.get("担当者") or s.main_actor
        row_no = row.get("#", str(counter))
        viewpoint = infer_viewpoint(flow_type, operation, expected_source)
        priority = "P1" if flow_type == "異常系" else s.priority
        ifid = feature_for_operation(operation, s)
        expected = observable_expected(s, ifid or "-", operation, expected_source)
        tid = f"STI-{base}-{counter:03d}"
        source_observation = (pattern.observation if pattern else "") or row.get("確認対象", "") or "画面表示・処理ステータス・処理履歴"
        observation = build_observation(s, tid, ifid or "-", expected, source_observation, operation=operation)
        items.append(
            TestItem(
                function_name,
                tid,
                ifid or "-",
                viewpoint,
                priority,
                item_title(f"{flow_type} {branch_id}", row_no, actor, operation, s, expected),
                build_precondition(s, pattern, ifid or "-", operation, row_no),
                input_data,
                branch_steps(row, s, ifid or "-", pattern),
                expected,
                observation,
                flow_type,
                s.sid,
            )
        )
        counter += 1
    # Append new coverage to avoid renumbering the existing scenario/step rows.
    items = dedupe_items(items, base)
    items.extend(data_link_items(s, len(items) + 1))
    items.extend(concrete_assertion_items(s, len(items) + 1))
    items.extend(subflow_items(s, len(items) + 1))
    items.extend(normal_variation_items(s, len(items) + 1))
    # 観点の当てはめ契約（scenario_test/coverage/viewpoint_contracts.json）の項目は最後に足す。
    items.extend(viewpoint_items.items_for(s, len(items) + 1, sys.modules[__name__]))
    return apply_route_acceptance(s, items)


def route_required_items(items: list[TestItem]) -> list[TestItem]:
    """Assertions exercised by this route's representative execution.

    Alternative branches and data variations have separate executions. Requiring
    them to pass on the representative record would combine exclusive states.
    """
    return [item for item in items if re.match(
        r"^(?:正常系|代替系|異常系) (?:#\d+:|工程#\d+ 判定:|DL-|別業務 )", item.item_name
    )]


def apply_route_acceptance(s: ScenarioDoc, items: list[TestItem]) -> list[TestItem]:
    """Judge completion from every required result, not only the final action."""
    required = route_required_items(items)
    updated = []
    for item in items:
        if item.viewpoint != "業務経路":
            updated.append(item)
            continue
        ids = " / ".join(child.test_id for child in required)
        expected = normalize_expected_result(
            f"同じ案件・代表データの必須判定{len(required)}件がすべて合格し、"
            f"最終業務状態「{s.final_state}」を原本と実測値で確認できること。"
        )
        criteria = ["【経路成立の必須判定】",
                    "以下の判定を各工程の完了直後に行い、同じ案件の実ID・実行識別子で証跡を対応付ける。登録・承認・決済等を判定件数分繰り返さない。"]
        for child in required:
            location = re.search(r"(?m)^確認場所: (.+)$", child.observation)
            criteria.append(f"{child.test_id}: {child.expected}")
            if location:
                criteria.append(f"  確認場所: {location[1]}")
        criteria.extend([
            "経路判定: 必須判定の不合格は経路不合格。未実施・保留・証跡不足が一件でも残る場合は経路を合格にしない。",
            "別のデータパターン・代替分岐は別案件で実施し、当該経路の代表案件へ混在させない。",
        ])
        precondition = item.precondition + f"\n- 経路成立の必須判定: {ids}"
        held = [child for child in required if execution_class(child) in {"保留", "不可"}]
        if held and execution_class(item) not in {"保留", "不可"}:
            precondition = blocked_precondition(precondition,
                "必須判定 " + " / ".join(child.test_id for child in held) +
                " の準備・解除条件を確定し、同じ案件で実施できることを確認する。")
        observation = re.sub(r"(?m)^合格条件:.*$", f"合格条件: {expected}", item.observation)
        observation += f"\n必須判定ID: {ids}\n経路成立の判定記録: 各必須判定の合否・実測値・証跡パスと経路全体の結果を同じ実行識別子で記録する。"
        updated.append(replace(item, expected=expected, precondition=precondition,
                               steps=item.steps + "\n" + "\n".join(criteria), observation=observation))
    return updated


def tsv_text(rows: list[list[str]]) -> str:
    out = StringIO()
    writer = csv.writer(out, delimiter="\t", lineterminator="\n")
    writer.writerows(rows)
    return out.getvalue().rstrip("\n")


# 操作手順/実行方法（0始まりで8列目）は、スプレッドシート貼り付け時に手順を
# 行ごとに読めるよう改行を保持する。集約TSVでも他列は1行に畳むが、この列だけは
# 引用付きの複数行セルとして残す（csv/tsvの引用仕様でスプレッドシートが正しく解釈する）。
STEPS_COLUMN = 8


def rows_for_items(items: list[TestItem], collapse_newlines: bool = False) -> list[list[str]]:
    rows = [HEADER]
    for item in items:
        row = [
            item.function_name,
            item.test_id,
            item.ifid,
            item.viewpoint,
            item.priority,
            item.item_name,
            item.precondition,
            item.input_data,
            item.steps,
            item.expected,
            item.observation,
        ]
        if collapse_newlines:
            row = [
                value if i == STEPS_COLUMN else re.sub(r"\s*\n\s*", " / ", value).strip()
                for i, value in enumerate(row)
            ]
        rows.append(row)
    return rows


def scenario_business_rank(items: list[TestItem]) -> int:
    """シナリオが最初に触れる（業務順リストにある）機能Noの業務順位。無ければ末尾。"""
    for item in items:
        if item.ifid == "-":
            continue
        prefix = item.ifid.split("-")[0]
        if prefix in BUSINESS_RANK:
            return BUSINESS_RANK[prefix]
    return UNRANKED


def scenario_ordinal(s: ScenarioDoc) -> int:
    """シナリオID末尾の連番（SCN-…-009 → 9）。同一ランク内はこの番号順に並べる。"""
    m = re.search(r"-(\d+)$", s.sid)
    return int(m.group(1)) if m else 999


def scenario_sort_key(s: ScenarioDoc, items: list[TestItem]) -> tuple[int, str, int]:
    # 業務順(機能Noランク) → 業務でまとめる → シナリオ番号順
    return (scenario_business_rank(items), s.business, scenario_ordinal(s))


def output_name(s: ScenarioDoc) -> str:
    return s.path.name.replace("SCN-", "STI-", 1).replace(".md", "_test_items.md")


def execution_class(item: TestItem) -> str:
    m = re.search(r"(?:^|\n)- 実施区分: (.+)", item.precondition)
    value = m.group(1) if m else ""
    if value.startswith("実施可能"):
        return "実施可能"
    if value.startswith("条件付き"):
        return "条件付き"
    if value.startswith("準備確認後"):
        return "条件付き"
    if value.startswith("業務担当環境"):
        return "業務担当環境"
    if value.startswith("実施保留"):
        return "保留"
    if value.startswith("実施不可"):
        return "不可"
    return "未分類"


TSV_PREAMBLE = """以下はタブ区切りで、実質はExcelのCSVと同様に、改行や`"`を含むセルはダブルクォートで囲む。

**1行目**が列見出し。**2行目以降**がケース（各11列）。`機能名` 列に業務名とシナリオ名を入れ、`I/FID` 列に当該ステップが行使する機能No（メインフローの利用画面・機能）を入れる。`期待結果／レスポンス` はシステム結果として読める受け身・状態・可能表現にし、「〜されること。」「〜されないこと。」「〜できること。」「〜であること。」のいずれかで終える。`確認対象` は観測点を別列で持つ。`テストID`で一意に識別する。優先度は **P1／P2／P3**。

Excel／Googleスプレッドシートへはコードフェンス内を A1 に貼り付ける。

前提条件・入力データ・操作手順など、**期待結果以外**の列で複数項目がある場合は、同一セル内でLF改行する。

**期待結果／レスポンスは1行1判定**とする。複数の期待がある場合は行を分割し、**テスト項目名は当該行の判定内容が分かるよう具体化**する。

`前提条件`、`入力データ/リクエスト内容`、`操作手順/実行方法`、`期待結果／レスポンス` が同一になる行は重複テストとして出力しない。"""


def ordered_unique(values: list[str]) -> list[str]:
    result: list[str] = []
    seen: set[str] = set()
    for value in values:
        if value and value != "-" and value not in seen:
            seen.add(value)
            result.append(value)
    return result


def related_ifid_table(s: ScenarioDoc, items: list[TestItem]) -> str:
    scope: dict[str, list[str]] = {}
    for item in items:
        if item.ifid == "-":
            continue
        for feature in interface_ids(item.ifid):
            scope.setdefault(feature, [])
            if item.viewpoint not in scope[feature]:
                scope[feature].append(item.viewpoint)
    all_features = ordered_unique(s.expected_features + s.linked_features + sorted(scope))
    lines = [
        "| 機能No | 状態 | I/FID出力 | 本シナリオでの主な確認範囲 / 理由 |",
        "|--------|------|------------|------------------------------------|",
    ]
    if all_features:
        for ifid in all_features:
            if ifid in scope:
                lines.append(f"| {ifid} | テスト項目化 | あり | {'、'.join(scope[ifid])} |")
            elif ifid in s.linked_features:
                lines.append(f"| {ifid} | 参照のみ | なし | 関連機能仕様として紐づくが、このシナリオの実行手順では直接操作/観測しない。 |")
            else:
                lines.append(f"| {ifid} | 参照のみ | なし | 期待機能Noとして関連するが、このシナリオのI/FIDには割り当てない。期待機能不足はシナリオカバレッジ表で可視化する。 |")
    else:
        lines.append("| - | 対象外 | なし | 業務フロー全体（画面横断の業務完遂）を確認し、個別機能Noは割り当てない。 |")
    return "\n".join(lines)


def render_sheet(s: ScenarioDoc, items: list[TestItem]) -> str:
    function_name = function_display_name(s)
    return f"""{GENERATED_MARKER}
# {function_name} シナリオ試験テストケース

元シナリオ: `{s.path}`

テスト観点: 業務フロー準拠のシステムテスト観点（正常系／代替系／異常系、データ更新・外部連携・CSV/帳票・メール/通知・権限・バリデーション等）

期待結果は画面表示、遷移、ステータス、履歴、件数、金額、CSV/帳票、メール/通知、外部連携結果、操作履歴など、試験で観測できる結果で判定する。TSV は 11 列固定で、`テストレベル` 列は含めない。`期待結果／レスポンス` は受け身・状態・可能表現で記載する。

## 実施方式

- 各行は `前提条件` の `準備手順`、`操作手順/実行方法` の `【準備確認】→【操作】→【操作後確認】`、`確認対象` の `合格条件/不合格条件` の順に実施する。
- `st-user-*`、`ST-*` はシナリオ上の論理IDである。登録・購入・承認など各工程で得た実ID・受注番号・メールアドレスとの対応を `scenario_test/exec/test_result_template.tsv` に記録する。
- `実施不可（設計確定待ち）` と `実施保留（実行手段未特定）` は、記載された解除条件が満たされるまで実行開始しない。`条件付き実施` は既知指摘の影響判定を記録してから開始する。
- 実行証跡は `scenario_test/exec/evidence/<テストID>/` に保存する。

## 関連機能No対応概要

{related_ifid_table(s, items)}

## テストケースTSV

{TSV_PREAMBLE}

```tsv
{tsv_text(rows_for_items(items))}
```
"""


def discover_scenarios(repo: Path, only: str | None) -> list[ScenarioDoc]:
    result: list[ScenarioDoc] = []
    for path in sorted((repo / "scenario_test" / "scenario").glob("SCN-*.md")):
        if only and only not in path.name and only not in read_text(path):
            continue
        parsed = parse_scenario(path, repo)
        if parsed:
            result.append(parsed)
    return result


def is_generated(path: Path) -> bool:
    return GENERATED_MARKER in read_text(path)


def write_outputs(repo: Path, scenarios: list[ScenarioDoc], overwrite: bool, dry_run: bool, prune_obsolete: bool) -> None:
    out_dir = repo / "scenario_test" / "test_items"
    out_dir.mkdir(parents=True, exist_ok=True)
    all_items: list[TestItem] = []
    keep: set[Path] = set()
    index_rows = [
        "# シナリオテスト項目一覧（自動生成）",
        "",
        "業務（画面/機能）の実施順に業務を並べ、各業務のシナリオはシナリオ番号順に連続させている。",
        "",
        "| シナリオID | 業務 | テスト項目書 | 項目数 | 正常系 | 代替系 | 異常系 | 実施可能 | 条件付き | 業務担当環境 | 保留 | 不可 |",
        "|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
    ]
    # 並び順: 業務を「その業務が最初に触れる機能Noの最小ランク」で業務順に並べ、
    # 各業務のシナリオは連続させたままシナリオ番号順にする（同一業務が分断されない）。
    prepared = [(s, test_items_for(s)) for s in scenarios]
    business_min_rank: dict[str, int] = {}
    for s, items in prepared:
        r = scenario_business_rank(items)
        business_min_rank[s.business] = min(business_min_rank.get(s.business, UNRANKED), r)
    prepared.sort(key=lambda pair: (business_min_rank[pair[0].business], pair[0].business, scenario_ordinal(pair[0])))
    for s, items in prepared:
        all_items.extend(items)
        rel = Path("scenario_test") / "test_items" / output_name(s)
        keep.add(rel)
        normal = sum(1 for item in items if item.flow_type == "正常系")
        alt = sum(1 for item in items if item.flow_type == "代替系")
        err = sum(1 for item in items if item.flow_type == "異常系")
        classes = {name: sum(1 for item in items if execution_class(item) == name) for name in ("実施可能", "条件付き", "業務担当環境", "保留", "不可")}
        index_rows.append(
            f"| {s.sid} | {s.business} | `{rel}` | {len(items)} | {normal} | {alt} | {err} | "
            f"{classes['実施可能']} | {classes['条件付き']} | {classes['業務担当環境']} | {classes['保留']} | {classes['不可']} |"
        )
        path = repo / rel
        if path.exists() and not overwrite:
            print(f"skip existing {rel}")
            continue
        content = render_sheet(s, items)
        if any(phrase in content for phrase in FORBIDDEN):
            raise SystemExit(f"forbidden phrase generated for {s.sid}")
        residual = content
        for label in ALLOWED_UNRESOLVED_LABELS:
            residual = residual.replace(label, "")
        if "要確認" in residual:
            raise SystemExit(f"unapproved 要確認 phrase generated for {s.sid}")
        if dry_run:
            print(f"would write {rel}")
        else:
            path.write_text(content, encoding="utf-8")
            print(f"wrote {rel}")
    all_tsv = tsv_text(rows_for_items(all_items, collapse_newlines=True)) + "\n"
    index = "\n".join(index_rows) + "\n"
    if dry_run:
        print(f"would write {out_dir.relative_to(repo) / 'all_scenario_test_items.tsv'}")
        print(f"would write {out_dir.relative_to(repo) / '00_テスト項目一覧.md'}")
    else:
        (out_dir / "all_scenario_test_items.tsv").write_text(all_tsv, encoding="utf-8")
        (out_dir / "00_テスト項目一覧.md").write_text(index, encoding="utf-8")
    if prune_obsolete:
        for path in sorted(out_dir.glob("STI-*.md")):
            rel = path.relative_to(repo)
            if rel in keep or not is_generated(path):
                continue
            if dry_run:
                print(f"would remove obsolete {rel}")
            else:
                path.unlink()
                print(f"removed obsolete {rel}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", default=".")
    parser.add_argument("--only")
    parser.add_argument("--overwrite", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--prune-obsolete", action="store_true")
    args = parser.parse_args()
    repo = Path(args.repo).resolve()
    scenarios = discover_scenarios(repo, args.only)
    if not scenarios:
        print("no generated scenario files found")
        return 1
    write_outputs(repo, scenarios, args.overwrite, args.dry_run, args.prune_obsolete)
    print(f"scenarios={len(scenarios)}")
    print(f"items={sum(len(test_items_for(s)) for s in scenarios)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
