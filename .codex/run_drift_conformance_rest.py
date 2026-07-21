#!/usr/bin/env python3
"""Run the rest design->implementation conformance audit with Codex CLI.

This is a local substitute for the unavailable wf runner. It keeps the same
source of truth and output contract:
- input manifest: design_impl_drift_report/conformance_findings/_manifest_rest.json
- deltas: design_impl_drift_report/conformance_findings/_deltas/<functionId>.json
- tickets: design_impl_drift_report/conformance_findings/<functionId>.md
"""

from __future__ import annotations

import argparse
import concurrent.futures
import json
import os
import pathlib
import re
import subprocess
import sys
import tempfile
import time
from typing import Any


REPO = pathlib.Path("/home/y-saito/Developments/hareruya-design-docs")
EE = pathlib.Path("/home/y-saito/Developments/ec-cube-enterprise")
DRIFT = REPO / "design_impl_drift_report"
FINDINGS_DIR = DRIFT / "findings"
OUT_DIR = DRIFT / "conformance_findings"
DELTA_DIR = OUT_DIR / "_deltas"
MANIFEST = OUT_DIR / "_manifest_rest.json"
SCHEMA = REPO / ".codex" / "drift_conformance_exec_schema.json"
WORK_DIR = OUT_DIR / "_runs"
PROGRESS_JSONL = WORK_DIR / "progress.jsonl"


DOMAIN_LABEL = {
    "f": "フロント",
    "m": "管理",
    "a": "API",
    "b": "バッチ",
}


def load_manifest() -> list[dict[str, Any]]:
    data = json.loads(MANIFEST.read_text(encoding="utf-8"))
    functions = data.get("functions", [])
    if not isinstance(functions, list):
        raise RuntimeError(f"invalid manifest functions: {MANIFEST}")
    return functions


def output_stem(item: dict[str, Any]) -> str:
    return item.get("functionId") or f"{item.get('featureNo', 'unknown').lower()}_unknown"


def delta_path(item: dict[str, Any]) -> pathlib.Path:
    return DELTA_DIR / f"{output_stem(item)}.json"


def ticket_path(item: dict[str, Any]) -> pathlib.Path:
    return OUT_DIR / f"{output_stem(item)}.md"


def log_path(item: dict[str, Any]) -> pathlib.Path:
    return WORK_DIR / f"{output_stem(item)}.log"


def result_path(item: dict[str, Any]) -> pathlib.Path:
    return WORK_DIR / f"{output_stem(item)}.result.json"


def prompt_for(item: dict[str, Any]) -> str:
    function_id = item["functionId"]
    feature_no = item["featureNo"]
    title = item["title"]
    domain = item.get("domain", "")
    design_html = item["designHtml"]
    findings_json = f"design_impl_drift_report/findings/{function_id}.json"
    ticket = f"design_impl_drift_report/conformance_findings/{function_id}.md"
    delta = f"design_impl_drift_report/conformance_findings/_deltas/{function_id}.json"
    return f"""あなたは Hareruya の「設計書→実装」網羅監査官兼 Codex 反証レビュアです。
機能 {feature_no}（{title}, functionId={function_id}, domain={domain}）について、HTML設計書に書かれた個別要求が ec-cube-enterprise 実装に存在するかを監査してください。設計書が正、実装が被監査対象です。

## 入力
- ハーネス判定: {REPO}/{findings_json}
  - requirementConformanceAudit.materialGapRows を一次候補キューとして読むこと。
- 設計HTML（正）: {REPO}/{design_html}
- 実装（被監査）: {EE}/src/Eccube と {EE}/html
- 出力予定:
  - 指摘票: {REPO}/{ticket}
  - デルタ: {REPO}/{delta}

## 手順
1. findings JSON の requirementConformanceAudit.materialGapRows を読み、designRequirement/designRef/elementLevel/candidateRefs を確認する。
2. 設計HTML本文も読み、利用者が直接目にする要素・文言・画面遷移・入力・ボタン/リンク・バリデーション・CSV項目・バッチ/APIの外部契約などの material 要求を独立に再列挙する。ハーネス候補に無い要求を extractorMissed として数える。
3. 各要求について実装を直接 grep/read し、実装済み / 未実装 / 実装違い / 要実機確認に分類する。
   - 実装済み: file:line 根拠を確認し、findings には入れない。
   - 未実装: 探索した Controller/Twig/Service/Repository/FormType/Command/JS/ルート/翻訳キー/CSV定義等を mismatchReason に列挙し、不在の根拠を示す。
   - 実装違い: 設計値・実装値・差異・実装 file:line を示す。
   - 要実機確認: 根拠不足なら summary にだけ残し、findings には入れない。
4. 反証フェーズとして、未実装/実装違い候補ごとに別キーワード・ルート名・翻訳キー・Twigパス・クラス名へ翻案して再検索する。実装が見つかった候補は refutedCount に数えて findings から外す。

## 厳守事項
- 外部サブエージェントや別プロセスを起動しない。あなた自身が読み取って判断する。
- 弱いキーワード一致だけで未実装と断定しない。
- 設計の現行仕様をオラクルにする。実装の現挙動を仕様に格上げしない。
- 指摘は file:line または「不在（探索範囲: ...）」で根拠を持つものだけ。
- 確定0件でも findings=[] を返す。

## JSON 出力
最終回答は指定スキーマに一致する JSON だけにしてください。Markdownや説明文を混ぜないでください。
functionId は "{function_id}"、featureNo は "{feature_no}" を返してください。
findings の各 item:
- category: "未実装" または "実装違い"
- designRequirement: 設計要求文
- designRef: 設計HTMLの path#sheet:line 等
- implRef: 実装 file:line、または "不在（探索範囲: ...）"
- implementationActual: 実装の状態
- mismatchReason: 不在/差異の根拠
- comparisonRows: item/design/implementation/mismatch の配列
"""


def parse_json_message(path: pathlib.Path) -> dict[str, Any]:
    raw = path.read_text(encoding="utf-8").strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
    return json.loads(raw)


def normalize_result(item: dict[str, Any], data: dict[str, Any]) -> dict[str, Any]:
    if data.get("functionId") != item["functionId"]:
        raise RuntimeError(f"functionId mismatch: expected {item['functionId']} got {data.get('functionId')}")
    if data.get("featureNo") != item["featureNo"]:
        raise RuntimeError(f"featureNo mismatch: expected {item['featureNo']} got {data.get('featureNo')}")
    normalized_findings: list[dict[str, Any]] = []
    for finding in data.get("findings", []):
        category = finding["category"]
        dimension = "⑦要求網羅・未実装" if category == "未実装" else "⑦要求網羅・実装違い"
        rows = finding.get("comparisonRows") or []
        normalized_findings.append(
            {
                "category": category,
                "dimension": dimension,
                "severity": "med",
                "designRef": finding["designRef"],
                "designExpectation": finding["designRequirement"],
                "implRef": finding["implRef"],
                "implementationActual": finding["implementationActual"],
                "mismatchReason": finding["mismatchReason"],
                "comparisonRows": rows,
            }
        )
    return {
        "functionId": item["functionId"],
        "featureNo": item["featureNo"],
        "findings": normalized_findings,
    }


def build_ticket(item: dict[str, Any], delta: dict[str, Any]) -> str:
    label = DOMAIN_LABEL.get((item.get("domain") or "")[:1], "機能")
    heading = f"■{label}-{item.get('title', item['featureNo'])}"
    if not delta["findings"]:
        return f"{heading}\n本機能で確定した未実装/実装違いなし（網羅照合済）\n"

    blocks = []
    for finding in delta["findings"]:
        actual = finding["implementationActual"].rstrip("。.")
        blocks.append(
            "\n".join(
                [
                    heading,
                    "【指摘カテゴリ】",
                    f"　{finding['category']}",
                    "【指摘内容】",
                    f"　（仕様）{finding['designExpectation']}",
                    f"　{actual}。確認お願いします。（設計根拠: {finding['designRef']} ／ 実装: {finding['implRef']}）",
                ]
            )
        )
    return "\n\n".join(blocks) + "\n"


def atomic_write(path: pathlib.Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=str(path.parent), delete=False) as fh:
        fh.write(text)
        tmp_name = fh.name
    os.replace(tmp_name, path)


def append_progress(entry: dict[str, Any]) -> None:
    WORK_DIR.mkdir(parents=True, exist_ok=True)
    with PROGRESS_JSONL.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(entry, ensure_ascii=False, sort_keys=True) + "\n")


def run_one(item: dict[str, Any], timeout: int) -> dict[str, Any]:
    stem = output_stem(item)
    if delta_path(item).exists():
        return {"functionId": item["functionId"], "featureNo": item["featureNo"], "status": "skipped"}

    WORK_DIR.mkdir(parents=True, exist_ok=True)
    cmd = [
        "codex",
        "exec",
        "--ephemeral",
        "-C",
        str(REPO),
        "--add-dir",
        str(EE),
        "-s",
        "read-only",
        "--output-schema",
        str(SCHEMA),
        "-o",
        str(result_path(item)),
        "-",
    ]
    started = time.time()
    with log_path(item).open("w", encoding="utf-8") as log:
        proc = subprocess.run(
            cmd,
            input=prompt_for(item),
            text=True,
            stdout=log,
            stderr=subprocess.STDOUT,
            timeout=timeout,
            cwd=str(REPO),
        )
    elapsed = round(time.time() - started, 1)
    if proc.returncode != 0:
        log_text = log_path(item).read_text(encoding="utf-8", errors="replace")
        error_kind = "out_of_credits" if "out of credits" in log_text else "codex_exec_failed"
        return {
            "functionId": item["functionId"],
            "featureNo": item["featureNo"],
            "status": "failed",
            "errorKind": error_kind,
            "returncode": proc.returncode,
            "elapsed": elapsed,
            "log": str(log_path(item)),
        }

    data = parse_json_message(result_path(item))
    delta = normalize_result(item, data)
    atomic_write(delta_path(item), json.dumps(delta, ensure_ascii=False, indent=2) + "\n")
    atomic_write(ticket_path(item), build_ticket(item, delta))

    result = {
        "functionId": item["functionId"],
        "featureNo": item["featureNo"],
        "status": "done",
        "elapsed": elapsed,
        "findings": len(delta["findings"]),
        "requirementsChecked": data.get("requirementsChecked", 0),
        "extractorMissed": data.get("extractorMissed", 0),
        "refutedCount": data.get("refutedCount", 0),
        "delta": str(delta_path(item)),
        "ticket": str(ticket_path(item)),
    }
    append_progress(result)
    return result


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--jobs", type=int, default=4)
    parser.add_argument("--limit", type=int)
    parser.add_argument("--timeout", type=int, default=2400)
    parser.add_argument("--only", nargs="*")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    functions = load_manifest()
    if args.only:
        only = set(args.only)
        functions = [f for f in functions if f["functionId"] in only or f["featureNo"] in only]

    pending = [f for f in functions if not delta_path(f).exists()]
    if args.limit is not None:
        pending = pending[: args.limit]

    print(
        json.dumps(
            {
                "manifest_functions": len(functions),
                "pending": len(pending),
                "existing_deltas_in_scope": len(functions) - len([f for f in functions if not delta_path(f).exists()]),
                "jobs": args.jobs,
                "limit": args.limit,
            },
            ensure_ascii=False,
        ),
        flush=True,
    )
    if args.dry_run:
        for item in pending[:20]:
            print(f"{item['functionId']}\t{item['featureNo']}\t{item['title']}")
        return 0

    failure_path = WORK_DIR / "failures.json"
    if failure_path.exists():
        failure_path.unlink()

    failures: list[dict[str, Any]] = []
    completed = 0
    stop_reason: str | None = None
    iterator = iter(pending)
    future_map: dict[concurrent.futures.Future[dict[str, Any]], dict[str, Any]] = {}
    pool = concurrent.futures.ThreadPoolExecutor(max_workers=max(args.jobs, 1))

    def submit_until_full() -> None:
        while stop_reason is None and len(future_map) < max(args.jobs, 1):
            try:
                item = next(iterator)
            except StopIteration:
                return
            future_map[pool.submit(run_one, item, args.timeout)] = item

    try:
        submit_until_full()
        while future_map:
            done, _ = concurrent.futures.wait(
                future_map,
                return_when=concurrent.futures.FIRST_COMPLETED,
            )
            for future in done:
                item = future_map.pop(future)
                try:
                    result = future.result()
                except Exception as exc:  # noqa: BLE001
                    result = {
                        "functionId": item["functionId"],
                        "featureNo": item["featureNo"],
                        "status": "failed",
                        "errorKind": "runner_exception",
                        "error": str(exc),
                        "log": str(log_path(item)),
                    }
                completed += 1
                if result.get("status") == "failed":
                    failures.append(result)
                    if result.get("errorKind") == "out_of_credits":
                        stop_reason = "out_of_credits"
                print(json.dumps({"completed": completed, "total": len(pending), **result}, ensure_ascii=False), flush=True)
            submit_until_full()
            if stop_reason == "out_of_credits":
                break
    except KeyboardInterrupt:
        stop_reason = "interrupted"
        raise
    finally:
        pool.shutdown(wait=stop_reason is None, cancel_futures=True)

    if failures:
        atomic_write(failure_path, json.dumps(failures, ensure_ascii=False, indent=2) + "\n")
        print(f"failures: {len(failures)} ({failure_path})", file=sys.stderr)
        if stop_reason:
            print(f"stopped: {stop_reason}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
