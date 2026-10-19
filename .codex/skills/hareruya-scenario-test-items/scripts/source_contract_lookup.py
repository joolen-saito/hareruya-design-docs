"""Share reviewed source contracts without coupling the two generators."""
import json
import re
import sys
from functools import lru_cache
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "hareruya-scenario-test-cases/scripts"))
import execution_repairs


@lru_cache(maxsize=4)
def _load(path_text: str, mtimes: tuple):
    return execution_repairs.contracts(Path(path_text).resolve().parents[2])


def reviewed_contract(s, operation: str):
    path = s.repo / "scenario_test/coverage/source_contracts.json"
    if not path.is_file():
        return None
    compact = lambda value: re.sub(r"\s+", " ", value).strip()
    candidate = compact(operation)
    matches = []
    inputs = [path, *sorted((path.parent / "execution_repairs").glob("*_contracts.json"))]
    stamp = tuple((str(p), p.stat().st_mtime_ns) for p in inputs)
    for contract in _load(str(path), stamp):
        if contract.get("business") != s.business:
            continue
        adopted_operation = compact(contract.get("operation", ""))
        source_action = compact(contract.get("source_action", ""))
        if adopted_operation and candidate.startswith(adopted_operation):
            matches.append(contract)
        elif source_action and (f"「{source_action}」" in candidate or candidate == source_action):
            matches.append(contract)
    # Repeated calls can use identical wording but a different direction or
    # source range. Prefer the reviewed occurrence for this exact scenario.
    for contract in matches:
        if any(occurrence.get("scenario_id") == s.sid for occurrence in contract.get("occurrences", [])):
            return contract
    return matches[0] if matches else None
