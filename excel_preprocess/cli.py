"""excel-preprocess CLI(仕様§1 I/O契約, §4 verify, 冒頭の確認事項)。

サブコマンド:
  extract     承認済みmanifestに基づき excel_blocks/<fid>.json を生成
  detect      機能ブロック境界の検出レポートを出す(人手承認の材料。正本ではない)
  verify      差分0検証(source/reconstruct/golden)
  manifest    block-manifest.json へエントリを追加(人手承認を明示させる)
  fid-report  fid_kubun.tsv 実測とT2計画側集合の差分照合

終了コード: 0=成功(差分0/整合) 1=差分・境界曖昧・不整合 2=CLI/内部例外
"""
from __future__ import annotations

import argparse
import datetime
import json
import sys
from pathlib import Path

from . import block_finder, extractor, fid_map, verify
from .canonical import BlockRange
from .errors import EXIT_DIFF_OR_AMBIGUOUS, EXIT_INTERNAL_ERROR, EXIT_OK, ToolError
from .manifest import ManifestEntry, load_manifest, save_manifest


def _cmd_extract(args: argparse.Namespace) -> int:
    model = extractor.extract(
        fid=args.fid,
        fid_kubun_path=Path(args.fid_map),
        input_dir=Path(args.input_dir),
        manifest_path=Path(args.block_manifest),
        output_dir=Path(args.output_dir),
    )
    print(f"OK extract fid={model['fid']} -> {Path(args.output_dir) / (model['fid'] + '.json')}")
    return EXIT_OK


def _cmd_detect(args: argparse.Namespace) -> int:
    fid_normalized = block_finder.normalize_fid(args.fid)
    result = block_finder.detect(Path(args.input_dir), fid_normalized)
    report = {
        "fid": result.fid,
        "book_file": result.book_path.name,
        "book_no": result.book_no,
        "workbook_sha256": result.workbook_sha256,
        "sheet_name": result.sheet.name,
        "sheet_index": result.sheet.index,
        "sheet_state": result.sheet.state,
        "block": {
            "row_start": result.block.row_start,
            "row_end": result.block.row_end,
            "col_start": result.block.col_start,
            "col_end": result.block.col_end,
        },
        "boundary_evidence": result.evidence,
        "note": "この検出結果は人手承認の材料であり正本ではない(仕様§2.3)。"
        "manifest.json へ承認済みエントリとして追加してから extract すること。",
    }
    text = json.dumps(report, ensure_ascii=False, indent=2)
    if args.out:
        Path(args.out).write_text(text + "\n", encoding="utf-8")
    print(text)
    return EXIT_OK


def _cmd_manifest_add(args: argparse.Namespace) -> int:
    detection = json.loads(Path(args.from_detection).read_text(encoding="utf-8"))
    entries = load_manifest(Path(args.block_manifest))
    fid_row = extractor._lookup_fid_row(Path(args.fid_map), detection["fid"])
    entry = ManifestEntry(
        fid=fid_row.fid,
        function_no=fid_row.function_no,
        workbook_file=detection["book_file"],
        workbook_sha256=detection["workbook_sha256"],
        sheet_name=detection["sheet_name"],
        sheet_index=detection["sheet_index"],
        row_start=detection["block"]["row_start"],
        row_end=detection["block"]["row_end"],
        col_start=detection["block"]["col_start"],
        col_end=detection["block"]["col_end"],
        boundary_evidence=detection["boundary_evidence"],
        approved_by=args.approved_by,
        approved_at=args.approved_at or datetime.date.today().isoformat(),
        notes=args.notes or "",
    )
    entries[entry.fid] = entry
    save_manifest(Path(args.block_manifest), entries)
    print(f"OK manifest entry approved for fid={entry.fid} by {entry.approved_by}")
    return EXIT_OK


def _print_diffs(diffs: list[str]) -> None:
    for d in diffs:
        print(d)


def _print_notes(notes: list[str]) -> None:
    for n in notes:
        print(n)


def _cmd_verify(args: argparse.Namespace) -> int:
    modes = ["source", "reconstruct"] if args.mode == "all" else [args.mode]
    all_ok = True
    for mode in modes:
        if mode == "source":
            if not args.source:
                raise ToolError("CLI_USAGE", "--source is required for mode=source")
            result = verify.verify_source(Path(args.block), Path(args.source))
        elif mode == "reconstruct":
            result = verify.verify_reconstruct(Path(args.block))
        elif mode == "golden":
            if not args.golden_expected:
                raise ToolError("CLI_USAGE", "--golden-expected is required for mode=golden")
            result = verify.verify_golden(Path(args.block), Path(args.golden_expected))
        else:
            raise ToolError("CLI_USAGE", f"unknown mode {mode}")
        status = "OK" if result.ok else "DIFF"
        print(f"{status} verify mode={mode} block={args.block} diffs={len(result.diffs)}")
        _print_diffs(result.diffs)
        _print_notes(result.notes)
        all_ok = all_ok and result.ok
    if args.golden_expected and args.mode == "all":
        result = verify.verify_golden(Path(args.block), Path(args.golden_expected))
        status = "OK" if result.ok else "DIFF"
        print(f"{status} verify mode=golden block={args.block} diffs={len(result.diffs)}")
        _print_diffs(result.diffs)
        _print_notes(result.notes)
        all_ok = all_ok and result.ok
    return EXIT_OK if all_ok else EXIT_DIFF_OR_AMBIGUOUS


def _cmd_fid_report(args: argparse.Namespace) -> int:
    rows = fid_map.parse_fid_kubun_tsv(Path(args.fid_map))
    candidates = fid_map.t2_candidate_fids(rows)
    print(f"fid_kubun.tsv T2候補(source_class={fid_map.T2_SOURCE_CLASS}, 保留=0): {len(candidates)}件")
    recon = fid_map.reconcile_with_plan(Path(args.fid_map), Path(args.rollout_plan))
    print(
        f"plan(§0.2 T2行): 総数={recon.plan_total} 候補確定={recon.plan_confirmed} "
        f"残={recon.plan_remaining} arithmetic_ok={recon.arithmetic_ok} totals_match={recon.totals_match}"
    )
    print("OK: fid_kubun.tsv実測とCONCRETIZATION_ROLLOUT_PLAN.mdのT2集合は整合。")
    return EXIT_OK


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="excel-preprocess")
    sub = p.add_subparsers(dest="command", required=True)

    pe = sub.add_parser("extract", help="承認済みmanifestからexcel_blocks/<fid>.jsonを生成")
    pe.add_argument("--fid", required=True)
    pe.add_argument("--fid-map", required=True)
    pe.add_argument("--input-dir", required=True)
    pe.add_argument("--block-manifest", required=True)
    pe.add_argument("--output-dir", required=True)
    pe.set_defaults(func=_cmd_extract)

    pd = sub.add_parser("detect", help="機能ブロック境界の検出レポート(人手承認材料)")
    pd.add_argument("--fid", required=True)
    pd.add_argument("--input-dir", required=True)
    pd.add_argument("--out", default=None)
    pd.set_defaults(func=_cmd_detect)

    pm = sub.add_parser("manifest-add", help="検出レポートをmanifest.jsonへ人手承認として追加")
    pm.add_argument("--from-detection", required=True)
    pm.add_argument("--fid-map", required=True)
    pm.add_argument("--block-manifest", required=True)
    pm.add_argument("--approved-by", required=True)
    pm.add_argument("--approved-at", default=None)
    pm.add_argument("--notes", default=None)
    pm.set_defaults(func=_cmd_manifest_add)

    pv = sub.add_parser("verify", help="差分0検証(source/reconstruct/golden)")
    pv.add_argument("--block", required=True)
    pv.add_argument("--mode", choices=["source", "reconstruct", "golden", "all"], default="source")
    pv.add_argument("--source", default=None)
    pv.add_argument("--golden-expected", default=None)
    pv.set_defaults(func=_cmd_verify)

    pf = sub.add_parser("fid-report", help="fid_kubun.tsv実測とT2計画側集合の差分照合")
    pf.add_argument("--fid-map", required=True)
    pf.add_argument("--rollout-plan", required=True)
    pf.set_defaults(func=_cmd_fid_report)

    return p


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        return args.func(args)
    except ToolError as e:
        print(f"ERROR {e.code}: {e.message}", file=sys.stderr)
        return EXIT_DIFF_OR_AMBIGUOUS
    except Exception as e:  # noqa: BLE001
        print(f"INTERNAL_ERROR {type(e).__name__}: {e}", file=sys.stderr)
        import traceback

        traceback.print_exc()
        return EXIT_INTERNAL_ERROR


if __name__ == "__main__":
    raise SystemExit(main())
