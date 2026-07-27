"""終了コードと例外の定義。

仕様(T2_EXCEL_PREPROCESS_SPEC.md §2.3, §4):
  exit 0 = 成功(差分0)
  exit 1 = 差分あり・読み取り不能・境界曖昧(AMBIGUOUS_BLOCK_BOUNDARY 等)
  exit 2 = CLI/内部例外
"""
from __future__ import annotations


EXIT_OK = 0
EXIT_DIFF_OR_AMBIGUOUS = 1
EXIT_INTERNAL_ERROR = 2


class ToolError(Exception):
    """exit 1 として扱う、ツールが自ら検出した業務エラー(境界曖昧・読取不能・差分)。"""

    def __init__(self, code: str, message: str) -> None:
        super().__init__(f"{code}: {message}")
        self.code = code
        self.message = message


class AmbiguousBlockBoundaryError(ToolError):
    """機能ブロック境界が一意に決定できない(仕様§2.3)。"""

    def __init__(self, message: str) -> None:
        super().__init__("AMBIGUOUS_BLOCK_BOUNDARY", message)


class ManifestApprovalError(ToolError):
    """block-manifest.json に承認済みエントリが無い、またはSHA不一致。"""

    def __init__(self, message: str) -> None:
        super().__init__("MANIFEST_NOT_APPROVED", message)


class MergeBoundaryCrossedError(ToolError):
    """結合範囲がブロック境界を跨いでいる(仕様§1: 自動抽出を失敗させる)。"""

    def __init__(self, message: str) -> None:
        super().__init__("MERGE_BOUNDARY_CROSSED", message)


class SourceReadError(ToolError):
    """原本 .xlsx / 各パートが読み取れない。"""

    def __init__(self, message: str) -> None:
        super().__init__("SOURCE_READ_ERROR", message)


class DiffFoundError(ToolError):
    """検証器が差分を検出した(source/reconstruct/golden いずれか)。"""

    def __init__(self, message: str, diffs: list[str] | None = None) -> None:
        super().__init__("DIFF_FOUND", message)
        self.diffs = diffs or []


class FidSetMismatchError(ToolError):
    """fid_kubun.tsv 実測集合と計画側T2集合の差分(仕様冒頭「確認事項」)。"""

    def __init__(self, message: str) -> None:
        super().__init__("FID_SET_MISMATCH", message)
