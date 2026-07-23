#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import re
from dataclasses import dataclass, replace
from io import StringIO
from pathlib import Path


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
    m = re.search(rf"^{re.escape(heading)}\n(?P<body>(?:\|.*\|\n)+)", text, re.M)
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
    """「画面名（機能No）」の末尾の機能Noを取り出す。無ければ '-'。"""
    m = re.search(r"（([A-Za-z0-9\-]+)）\s*$", value)
    return m.group(1) if m else "-"


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
    )


def function_display_name(s: ScenarioDoc) -> str:
    if s.business and s.business not in ("-", ""):
        return f"{s.business} — {s.title}"
    return s.title


def primary_seed(seed: dict[str, str]) -> str:
    for key in ("受注番号", "商品コード", "買取受付番号", "ネット買取申込番号", "仕入番号", "イベントID", "デッキID", "価格変更CSV"):
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
    # 貪欲マッチ。操作文の外側「{action}」内に入れ子の「」（例:「商品CSV出力」）があっても、
    # 最初の「から最後の」まで取り、作業内容の後半を取りこぼさない。
    m = re.search(r"「(.+)」", operation)
    if m:
        return cell(m.group(1))
    return cell(operation)


def normalize_action(action: str, s: ScenarioDoc) -> str:
    action = action.strip(" 。")
    action = re.sub(r"^[\-－]+", "", action)
    action = action.replace("必要に応じて", "対象条件に一致する場合は")
    action = action.replace("適宜", "対象条件に一致する場合は")
    if "何らかのトリガー" in action or not action:
        trigger = s.business_trigger.strip(" 。")
        trigger = trigger.replace("が必要になったとき", "の実施要求")
        return f"{trigger}を契機に対象データを確定する"
    return action


def function_from_operation(operation: str) -> str:
    """操作文（{画面}で「{action}」…）から画面・機能名を取り出す。特定不可なら空（創作しない）。"""
    for sep in ("で「", "で 条件", "を開き"):
        if sep in operation:
            return cell(operation.split(sep, 1)[0])
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


def _numbered(actor: str, function: str, target_line: str, last_line: str) -> str:
    steps = [f"担当者: {actor}"]
    n = 1
    if function:
        steps.append(f"{n}. {function} を開く")
        n += 1
    steps.append(f"{n}. {target_line}")
    n += 1
    steps.append(f"{n}. {last_line}")
    return "\n".join(steps)


def normal_steps(row: dict[str, str], s: ScenarioDoc, pattern: DataPattern | None = None) -> str:
    actor = row.get("担当者") or s.main_actor
    operation = row.get("操作", "")
    action = normalize_action(action_from_operation(operation), s)
    function = function_from_operation(operation)
    input_data = pattern.input_data if pattern and pattern.input_data else row.get("入力/対象", "") or primary_seed(s.seed)
    return _numbered(actor, function, f"対象: {input_data}", f"「{action}」を行う")


def branch_steps(row: dict[str, str], s: ScenarioDoc, pattern: DataPattern | None = None) -> str:
    actor = row.get("担当者") or s.main_actor
    operation = row.get("操作", "")
    condition = "分岐条件"
    # 貪欲マッチ。条件文に入れ子の「」があっても後半を取りこぼさない。
    m = re.search(r"条件「(.+)」となる", operation) or re.search(r"条件「(.+)」", operation)
    if m:
        condition = normalize_action(m.group(1), s)
    function = function_from_operation(operation)
    input_data = pattern.input_data if pattern and pattern.input_data else row.get("入力/対象", "") or primary_seed(s.seed)
    return _numbered(actor, function, f"入力: {input_data}", f"条件「{condition}」となる状態で実行する")


def title_result(value: str) -> str:
    text = normalize_expected_result(value)
    text = re.sub(r"[。．]+$", "", text).strip()
    text = re.sub(r"こと$", "", text).strip()
    return text or "最終業務状態"


def route_steps(s: ScenarioDoc, pattern: DataPattern | None = None) -> str:
    target = pattern.input_data if pattern and pattern.input_data else primary_seed(s.seed)
    route_condition = s.route_condition if s.route_condition and s.route_condition != "-" else s.business_trigger
    lines = [
        f"担当者: {s.main_actor}",
        f"1. 経路ID {s.route_id}（{s.route_kind}）の条件「{route_condition}」を満たす入力データを確認する",
        f"2. 経路代表データ: {target}",
    ]
    step_no = 3
    if s.normal_rows:
        for row in s.normal_rows:
            actor = row.get("担当者") or s.main_actor
            row_no = row.get("#", str(step_no - 2))
            operation = row.get("操作", "")
            action = normalize_action(action_from_operation(operation), s)
            function = function_from_operation(operation)
            input_data = row.get("入力/対象", "") or target
            location = f"{function}で" if function else ""
            lines.append(f"{step_no}. 正常系#{row_no}: {actor}が{location}「{action}」を行う")
            lines.append(f"   対象: {input_data}")
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
            lines.append(f"{step_no}. 分岐{branch_id}: {actor}が{location}「{action}」を行う")
            lines.append(f"   対象: {input_data}")
            step_no += 1
    lines.append(f"{step_no}. 最終業務状態「{s.final_state}」を確認する")
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


def build_precondition(s: ScenarioDoc, pattern: DataPattern | None = None) -> str:
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
    return "\n".join(parts)


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
        deduped.append(replace(item, test_id=f"STI-{base}-{len(deduped) + 1:03d}"))
    return deduped


def test_items_for(s: ScenarioDoc) -> list[TestItem]:
    items: list[TestItem] = []
    base = scenario_suffix(s.sid)
    function_name = function_display_name(s)
    counter = 1
    normal_pattern = normal_representative_pattern(s)
    main_flow_type = primary_flow_type(s)
    if normal_pattern or s.normal_rows or s.branch_rows:
        expected = normalize_expected_result(s.final_state)
        observation = (normal_pattern.observation if normal_pattern else "") or "完了条件・業務状態・処理履歴"
        items.append(
            TestItem(
                function_name,
                f"STI-{base}-{counter:03d}",
                "-",
                "業務経路",
                s.priority,
                route_item_title(main_flow_type, s),
                build_precondition(s, normal_pattern),
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
        observation = row.get("確認対象", "") or (normal_pattern.observation if normal_pattern else "") or "画面表示・処理ステータス・処理履歴"
        fallback_input = row.get("入力/対象", "") or primary_seed(s.seed)
        input_data = pattern_input(normal_pattern, fallback_input)
        actor = row.get("担当者") or s.main_actor
        row_no = row.get("#", str(counter))
        viewpoint = infer_viewpoint(main_flow_type, operation, expected_source)
        ifid = s.normal_features[idx] if idx < len(s.normal_features) else "-"
        if ifid == "-":
            ifid = feature_for_operation(operation, s)
        items.append(
            TestItem(
                function_name,
                f"STI-{base}-{counter:03d}",
                ifid or "-",
                viewpoint,
                s.priority,
                item_title(main_flow_type, row_no, actor, operation, s, expected_source),
                build_precondition(s, normal_pattern),
                input_data,
                normal_steps(row, s, normal_pattern),
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
        observation = pattern.observation or row.get("確認対象", "") or "画面表示・処理ステータス・処理履歴"
        actor = row.get("担当者") or s.main_actor
        row_no = row.get("#", str(step_idx + 1))
        ifid = s.normal_features[step_idx] if step_idx < len(s.normal_features) else "-"
        if ifid == "-":
            ifid = feature_for_operation(operation, s)
        boundary_flow_type = "正常系 境界" if main_flow_type == "正常系" else f"{main_flow_type} 境界"
        items.append(
            TestItem(
                function_name,
                f"STI-{base}-{counter:03d}",
                ifid or "-",
                "境界値",
                s.priority,
                item_title(f"{boundary_flow_type} {pattern.pattern_id}", row_no, actor, operation, s, expected_source),
                build_precondition(s, pattern),
                pattern_input(pattern, row.get("入力/対象", "") or primary_seed(s.seed)),
                normal_steps(row, s, pattern),
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
        observation = (pattern.observation if pattern else "") or row.get("確認対象", "") or "画面表示・処理ステータス・処理履歴"
        fallback_input = row.get("入力/対象", "") or primary_seed(s.seed)
        input_data = pattern_input(pattern, fallback_input, branch_id)
        actor = row.get("担当者") or s.main_actor
        row_no = row.get("#", str(counter))
        viewpoint = infer_viewpoint(flow_type, operation, expected_source)
        priority = "P1" if flow_type == "異常系" else s.priority
        ifid = feature_for_operation(operation, s)
        items.append(
            TestItem(
                function_name,
                f"STI-{base}-{counter:03d}",
                ifid or "-",
                viewpoint,
                priority,
                item_title(f"{flow_type} {branch_id}", row_no, actor, operation, s, expected_source),
                build_precondition(s, pattern),
                input_data,
                branch_steps(row, s, pattern),
                expected,
                observation,
                flow_type,
                s.sid,
            )
        )
        counter += 1
    return dedupe_items(items, base)


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
        scope.setdefault(item.ifid, [])
        if item.viewpoint not in scope[item.ifid]:
            scope[item.ifid].append(item.viewpoint)
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
        "| シナリオID | 業務 | テスト項目書 | 項目数 | 正常系 | 代替系 | 異常系 |",
        "|---|---|---|---|---|---|---|",
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
        index_rows.append(f"| {s.sid} | {s.business} | `{rel}` | {len(items)} | {normal} | {alt} | {err} |")
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
