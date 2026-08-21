/**
 * ハーネス自己検査: 論理名規約（物理名を書かない）と論理名対応表の整合。
 *
 * 規約は .cursor/skills/logical-naming/SKILL.md を正本とする。
 * 稼働中アプリを必要としない（page フィクスチャを使わない）ため、
 * 資格情報・シード・接続先が無い状態でも常に実行できる。
 *
 * 対応表（config/logical-names.tsv）の壊れと、テスト資産・ハーネスへの
 * 物理名の新規混入を、監査スクリプトと同じ判定で止める。
 */
import { test, expect } from "@playwright/test";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

const REPO_ROOT = path.resolve(__dirname, "../../..");
const LEDGER_PATH = path.resolve(__dirname, "../../config/logical-names.tsv");
const AUDIT_SCRIPT = path.join(
  REPO_ROOT,
  ".cursor/skills/logical-naming/scripts/audit_logical_naming.py"
);
const HEADER = ["物理名", "種別", "論理名", "機能ID", "出典", "状態"];
const KNOWN_KINDS = [
  "メッセージキー",
  "セッションキー",
  "フラッシュキー",
  "ルート名",
  "DBテーブル",
  "DBカラム",
  "イベント名",
];

type LedgerRow = {
  physical: string;
  kind: string;
  logical: string;
  fid: string;
  evidence: string;
  status: string;
  line: number;
};

function loadLedger(): { header: string[]; rows: LedgerRow[] } {
  const lines = readFileSync(LEDGER_PATH, "utf-8").split("\n");
  const rows: LedgerRow[] = [];
  let header: string[] = [];
  lines.forEach((raw, index) => {
    if (!raw || raw.startsWith("#")) return;
    const cells = raw.split("\t");
    if (header.length === 0) {
      header = cells;
      return;
    }
    rows.push({
      physical: cells[0],
      kind: cells[1],
      logical: cells[2],
      fid: cells[3],
      evidence: cells[4],
      status: cells[5],
      line: index + 1,
    });
  });
  return { header, rows };
}

function runAudit(args: string[]) {
  const result = spawnSync("python3", [AUDIT_SCRIPT, ...args], {
    cwd: REPO_ROOT,
    encoding: "utf-8",
  });
  expect(result.error, `監査スクリプトを実行できない: ${result.error?.message}`).toBeUndefined();
  return result;
}

test.describe("harness: 論理名対応表", () => {
  test("対応表が読め、列が規約どおりである", () => {
    const { header, rows } = loadLedger();
    expect(header).toEqual(HEADER);
    expect(rows.length).toBeGreaterThan(0);
  });

  test("全行が既知の種別・論理名・出典・状態を持つ", () => {
    for (const row of loadLedger().rows) {
      expect(KNOWN_KINDS, `未知の種別: ${LEDGER_PATH}:${row.line} ${row.kind}`).toContain(row.kind);
      expect(row.physical, `物理名が空: ${row.line}`).not.toBe("");
      expect(row.logical, `論理名が空: ${row.line} ${row.physical}`).not.toBe("");
      expect(row.evidence, `出典が空: ${row.line} ${row.physical}`).not.toBe("");
      expect(["確定", "要確認"], `状態は 確定/要確認 のみ: ${row.line}`).toContain(row.status);
    }
  });

  test("論理名に物理名を混ぜていない（併記禁止）", () => {
    // 論理名側へ翻訳キー・テーブル名が漏れると、置き換えたつもりで物理名が残る。
    // 「」で囲んだ画面上の表示文言は、ホスト名などを含み得るので判定から外す。
    const leak = /(?:^|[^0-9A-Za-z_.\-/])(?:eccube|admin|front|api)(?:\.[a-z0-9_]+){2,}|(?:dtb|mtb|plg)_[a-z0-9_]+/;
    for (const row of loadLedger().rows) {
      const outsideDisplayText = row.logical.replace(/「[^」]*」/g, "");
      expect(
        leak.test(outsideDisplayText),
        `論理名に物理名が残っている: ${row.line} ${row.logical}`
      ).toBe(false);
    }
  });
});

test.describe("harness: 論理名規約の監査", () => {
  test("検出器のセルフテストが通る（セレクタ・file:line・SQLを誤検出しない）", () => {
    const result = runAudit(["--selftest"]);
    expect(result.stdout, result.stdout + result.stderr).toContain("SELFTEST OK");
    expect(result.status, result.stdout + result.stderr).toBe(0);
  });

  test("テスト資産・ハーネスに物理名が新規混入していない", () => {
    const result = runAudit(["--repo", REPO_ROOT]);
    expect(result.status, result.stdout + result.stderr).toBe(0);
  });
});
