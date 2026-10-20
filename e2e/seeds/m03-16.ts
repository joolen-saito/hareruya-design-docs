/**
 * M03-16 略称タグCSV入力の画面シード。正本: cases/M03-16_seed_data.tsv
 *
 * ケース専用のシードは、ほとんどが次の形をしている。
 * 1. 略称タグ登録/編集画面を開き（一覧の表示件数を12000件にして全件を出す）、一覧に正本が挙げた名称の行があれば、削除ボタンで削除する。
 * 2. 既存の略称タグが要るシードは、新規追加の入力欄で名称・並び順・アルファベット順ソートフラグを入れて登録し、
 *    一覧の名称の行のID列から略称タグIDを控える。登録すると画面はその略称タグの編集欄へ移るので、
 *    続けて登録するときは「新規登録へ戻る」を押して新規追加の入力欄へ戻る（M03-14 のシードと同じ作り方）。
 * 3. 取込ファイルを試験端末で作る。
 *
 * 取込ファイルについて:
 * - 正本の値で確定できる8件（001・003・005・012・020・029・039・040）は e2e/fixtures/m03-16/ のファイルを使い、
 *   中身がここに書いた明細と1バイトも違わないことを確かめる（置き場のファイルは変えない）。
 * - それ以外（控えた略称タグIDを書くもの、置き場に無いもの）は、シードの実行中に e2e/.state/m03-16/ へ作る。
 * - 正本が見出し行を書いていないファイルは、設計書の略称タグCSVフォーマット（ID・名称・並び順の順）の見出しにし、
 *   ID の値を書いていないデータ行は ID を空にした。文字コード・改行・区切り文字を書いていないファイルは、
 *   UTF-8・LF・カンマ区切りにした（正本の多くのファイルと同じ）。
 * - 026・027 の見出し不一致のファイルは、正本に並び順の値が無い。見出し以外の理由で取り込みが止まらないよう、
 *   ほかの行と重ならない並び順（72・73・74）を入れた。
 * - 011 の名称には、ゼロ幅スペースを「ゼロ」と「幅」の間に、ゼロ幅ノーブレークスペースを「幅」と「略称」の間に入れた（位置は正本に無い）。
 *
 * 作らないシード:
 * - S-M03-16-CASE-013・S-M03-16-CASE-028（固定の略称タグIDの2件だけにする、DBでの準備と退避・復元）。
 * - S-M03-16-L-ADM・S-M03-16-L-CONFIG・S-M03-16-L-CASE-037（使うケース037は、商品をDBへ直接設定し、
 *   設定ファイルの書き換えとアプリのキャッシュの作り直しを要るので実装しない）。
 */
import fs from "node:fs";
import path from "node:path";
import { expect, Page } from "@playwright/test";
import { REPO_ROOT, SETUP_ADMIN, STATE_DIR } from "../config/env";
import { CSV入出力設定 } from "../lib/app_config";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { ensureMember } from "../pages/admin/member";
import { ShortTagCsvUploadPage } from "../pages/admin/m03_16_short_tag_csv";
import { ShortTagInput, ShortTagPage } from "../pages/admin/short_tag";

export const M0316_ADMIN: Account = { loginId: "m0316_admin", password: "Passw0rd!M0316" };

// ---- 管理者・設定 ----

/** 正本は所属店舗を指定しない。管理画面で利用可能な店舗を1つ選び、商品管理を操作できるシステム管理者の権限を付ける（M03-14 と同じ作り方） */
async function createAdmin(page: Page): Promise<void> {
  await page.goto(adminUrl("/setting/system/member/new"));
  const stores = await page.locator('[name="admin_member[baseInfo]"] option').evaluateAll((options) => options
    .map((option) => option as HTMLOptionElement)
    .filter((option) => option.value !== "")
    .map((option) => option.textContent?.trim() ?? "")
    .filter(Boolean));
  if (stores.length === 0) throw new Error("S-M03-16-ADM: メンバーに割り当てられる店舗が画面に無い");
  const store = stores[0];
  await ensureMember(page, {
    名前: "M03-16試験管理者", 所属店舗: store, ログインID: M0316_ADMIN.loginId, メールアドレス: "m0316_admin@example.test",
    パスワード: M0316_ADMIN.password, 権限: "システム管理者", デフォルト検索表示店舗: store, 編集可能店舗: [store],
  });
}

defineSeed("S-M03-16-ADM", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, (page) => createAdmin(page));
  // ログインでき（稼働中）、商品管理の略称タグCSVアップロード画面を開けることを、ケースとは別のセッションで確かめる
  await withAdminSession(browser, M0316_ADMIN, async (page) => {
    const upload = new ShortTagCsvUploadPage(page);
    await upload.open();
    await expect(upload.アップロードボタン, "M03-16試験管理者で略称タグCSVアップロード画面を開けない").toBeVisible();
  });
});

defineSeed("S-M03-16-CONFIG", async () => {
  // 管理画面に設定項目が無い。設定を書き換えず、値がシード表の状態（区切り文字はカンマ、囲み文字は二重引用符）であることだけを確かめる（違えば止める）。
  const c = CSV入出力設定();
  const got = { 取込区切り文字: c.取込区切り文字, 取込囲み文字: c.取込囲み文字 };
  const want = { 取込区切り文字: ",", 取込囲み文字: '"' };
  if (JSON.stringify(got) !== JSON.stringify(want)) {
    throw new Error(`S-M03-16-CONFIG: CSV取込の設定が ${JSON.stringify(got)}（シード表は ${JSON.stringify(want)}）。設定を直してアプリのキャッシュを作り直してから流す`);
  }
});

// ---- 取込ファイル ----

type 符号化 = "UTF-8" | "UTF-8（バイト順序記号つき）" | "Shift_JIS";

type CsvSpec = {
  /** ファイル名（取込ファイルに指定する名前。アプリは拡張子で区切り文字を決める） */
  file: string;
  /** 見出し行とデータ行の列の値。呼び名〔…〕は控えた番号に置き換える */
  rows: string[][];
  区切り?: "," | "\t";
  改行?: "\n" | "\r\n" | "\r";
  /** 各行の末尾に区切り文字を付ける（014） */
  行末に区切り?: boolean;
  符号?: 符号化;
  /** シード表の状態・属性か投入方法に、そのまま書かれているはずの語（書き写しの誤りを止める） */
  正本の語: string[];
};

const STD = ["ID", "名称", "並び順"];
const FIXTURE_DIR = path.join(REPO_ROOT, "e2e", "fixtures", "m03-16");
const RUNTIME_DIR = path.join(STATE_DIR, "m03-16");
/** e2e/fixtures/m03-16/ に置いてあるファイル（中身は照合するだけで変えない） */
const FIXTURE_FILES = new Set([
  "new_rows-001.csv", "no_id_header-003.csv", "id_middle-005.csv", "empty-012.csv",
  "order_empty-020.csv", "header_only-029.csv", "m0316-039-quoted.csv", "m0316-040-ok.csv",
]);
/** シードが用意したファイルの名前（ケースが取込ファイルに指定してよいもの） */
const PREPARED = new Set<string>();

/** ケースが取込ファイルに指定するファイルの場所（シードが用意したもの） */
export function m0316CsvPath(file: string): string {
  if (!PREPARED.has(file)) throw new Error(`${file} は M03-16 のシードが用意する取込ファイルでない（シードを作っていないか、名前の誤り）`);
  return FIXTURE_FILES.has(file) ? path.join(FIXTURE_DIR, file) : path.join(RUNTIME_DIR, file);
}

let sjisTable: Map<string, number[]> | null = null;

/**
 * Shift_JIS のバイト列にする（2バイトの文字は、復号の表を逆に引く）。
 * 読み戻して同じ文になること、UTF-8 として厳しく読むと失敗すること（UTF-8 でないファイルであること）も確かめる。
 */
function encodeShiftJis(text: string): Buffer {
  if (!sjisTable) {
    const table = new Map<string, number[]>();
    const decoder = new TextDecoder("shift_jis", { fatal: true });
    for (let lead = 0x81; lead <= 0xfc; lead++) {
      if (lead >= 0xa0 && lead <= 0xdf) continue;
      for (let trail = 0x40; trail <= 0xfc; trail++) {
        if (trail === 0x7f) continue;
        let ch: string;
        try { ch = decoder.decode(Uint8Array.of(lead, trail)); } catch { continue; }
        if (ch.length === 1 && !table.has(ch)) table.set(ch, [lead, trail]);
      }
    }
    sjisTable = table;
  }
  const out: number[] = [];
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    if (code < 0x80) { out.push(code); continue; }
    const bytes = sjisTable.get(ch);
    if (!bytes) throw new Error(`Shift_JIS で表せない文字がある: ${ch}`);
    out.push(...bytes);
  }
  const buf = Buffer.from(out);
  if (new TextDecoder("shift_jis").decode(buf) !== text) throw new Error("Shift_JIS にしたバイト列を読み戻すと、元の文と違う");
  // 正本の前提「UTF-8ではないファイル」: UTF-8 として厳しく読むと失敗することを確かめる（読めてしまえば、アプリは文字コードを直さずに取り込むので、試したいことにならない）
  let utf8Readable = true;
  try { new TextDecoder("utf-8", { fatal: true }).decode(buf); } catch { utf8Readable = false; }
  if (utf8Readable) throw new Error("Shift_JIS にしたバイト列が UTF-8 としても読める（UTF-8 でないファイルにならない）");
  return buf;
}

function csvBytes(spec: CsvSpec, notes: Notes): Buffer {
  const sep = spec.区切り ?? ",";
  const eol = spec.改行 ?? "\n";
  const cell = (v: string) => {
    const value = v.replace(/〔[^〕]+〕/g, (l) => notes.get(l));
    return value.includes(sep) || value.includes('"') || /[\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  };
  const text = spec.rows.map((r) => r.map(cell).join(sep) + (spec.行末に区切り ? sep : "")).join(eol) + (spec.rows.length ? eol : "");
  switch (spec.符号 ?? "UTF-8") {
    case "UTF-8": return Buffer.from(text, "utf-8");
    case "UTF-8（バイト順序記号つき）": return Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(text, "utf-8")]);
    case "Shift_JIS": return encodeShiftJis(text);
  }
}

/** 取込ファイルを用意する。置き場にあるものは中身を照合し、無いものはここで作る */
function prepareCsv(seedId: string, spec: CsvSpec, notes: Notes): void {
  const s = getSeed(seedId);
  const text = s["状態・属性"] + s.投入方法;
  for (const w of [spec.file, ...spec.正本の語]) {
    if (!text.includes(w)) throw new Error(`${seedId}: シード表に「${w}」が無い（取込ファイルの明細の書き写しの誤り）`);
  }
  const want = csvBytes(spec, notes);
  const fixture = FIXTURE_FILES.has(spec.file);
  const file = fixture ? path.join(FIXTURE_DIR, spec.file) : path.join(RUNTIME_DIR, spec.file);
  if (!fixture) {
    fs.mkdirSync(RUNTIME_DIR, { recursive: true });
    fs.writeFileSync(file, want);
  }
  if (!fs.existsSync(file)) throw new Error(`${seedId}: 取込ファイル ${file} が無い`);
  if (!fs.readFileSync(file).equals(want)) throw new Error(`${seedId}: 取込ファイル ${file} の中身が、シード表から作った明細と違う`);
  PREPARED.add(spec.file);
}

// ---- 略称タグ登録/編集画面の操作 ----

/** シードを作る管理者のセッションで、正本の作り方の操作をする */
class TagOps {
  readonly tag: ShortTagPage;

  constructor(readonly page: Page, readonly seedId: string, readonly notes: Notes) {
    this.tag = new ShortTagPage(page);
  }

  /** 略称タグ登録/編集画面を開き、一覧の表示件数を12000件にする（全件を出す） */
  async open(): Promise<void> {
    await this.tag.showFirstPageWith("12000");
  }

  /** 新規追加の入力欄にいなければ「新規登録へ戻る」を押す（登録の後は、その略称タグの編集欄にいる） */
  async toNew(): Promise<void> {
    if (await this.tag.新規登録へ戻る.count()) await this.tag.pressBackToNew();
  }

  /** 一覧に名称の行が残っていれば削除する */
  async removeNamed(名称: string): Promise<void> {
    await this.tag.deleteAllNamed(名称);
  }

  /** 一覧にIDの行があれば削除する */
  async removeId(id: string): Promise<void> {
    if (await this.tag.rowById(id).count()) await this.tag.deleteRow(this.tag.rowById(id), `${this.seedId}: 略称タグID ${id} の削除`);
  }

  /**
   * 一覧に並び順の行があれば、すべて削除する。名称を問わず消すので（初期データの行も消える）、消した行は報告に出す。
   * 2026-10-20 00:00 ごろに空から作ったDBにも、09:27 にダンプへ戻したDBにも、並び順62の行（名称「MSH=Sf」。ダンプでは略称タグID 2632）があった（DBの参照で確かめた）。
   * ダンプに戻したDBのその行は、2026-10-20 17:08 ごろに 019 のシードがこの処理で削除した（記録 e2e/review/M03-16_progress_2026-10-20.md）。DBをまたダンプへ戻すと、019 を流せば同じ行をまた消す。
   */
  async 並び順の行を削除(並び順: string): Promise<void> {
    for (;;) {
      const row = (await this.tag.allRows()).find((r) => r.並び順 === 並び順);
      if (!row) break;
      reportSeedIssue(this.seedId, `正本の投入方法どおり、一覧の並び順${並び順}の行（略称タグID ${row.ID}・名称「${row.名称}」・ソート「${row.ソート}」）を削除した`);
      await this.tag.deleteRow(this.tag.rowById(row.ID), `${this.seedId}: 並び順${並び順}の略称タグ（ID ${row.ID}）の削除`);
    }
  }

  /**
   * 新規追加の入力欄で登録し、一覧の名称の行のID列から略称タグIDを読んで控える。
   * 登録後に移った編集欄のIDと同じであること、一覧の名称・並び順と、編集欄に読み込まれたアルファベット順ソートフラグが入れた値であることも確かめる。
   */
  async register(呼び名: string, v: ShortTagInput): Promise<void> {
    await this.toNew();
    const fromUrl = await this.tag.register(v, `${this.seedId}: 名称「${v.名称}」の登録`);
    const id = await this.tag.idOfName(v.名称);
    if (id !== fromUrl) throw new Error(`${this.seedId}: 一覧の名称「${v.名称}」の行のID ${id} が、登録後の編集欄のID ${fromUrl} と違う`);
    const row = await this.tag.readRow(this.tag.rowById(id));
    if (row.名称 !== v.名称 || row.並び順 !== v.並び順) {
      throw new Error(`${this.seedId}: 一覧のID ${id} の行が、名称「${row.名称}」・並び順 ${row.並び順}（入れたのは「${v.名称}」・${v.並び順}）`);
    }
    const loaded = await this.tag.inputValues();
    if (loaded.アルファベット順 !== v.アルファベット順) {
      throw new Error(`${this.seedId}: 登録した名称「${v.名称}」の編集欄のアルファベット順ソートフラグが${loaded.アルファベット順 ? "オン" : "オフ"}（入れたのは${v.アルファベット順 ? "オン" : "オフ"}）`);
    }
    this.notes.set(呼び名, id);
  }
}

type CasePlan = {
  /** 一覧にあれば削除する略称タグID */
  removeIds?: string[];
  /** 一覧にあれば削除する並び順 */
  削除する並び順?: string[];
  /** 一覧にあれば削除する名称 */
  remove?: string[];
  /** 登録する略称タグ（控える呼び名と値。上から順に登録する） */
  register?: [string, ShortTagInput][];
  /** 試験端末で作る取込ファイル */
  files: CsvSpec[];
};

function defineCaseSeed(seedId: string, plan: CasePlan): void {
  defineSeed(seedId, async ({ browser, notes }) => {
    if (plan.removeIds?.length || plan.削除する並び順?.length || plan.remove?.length || plan.register?.length) {
      await withAdminSession(browser, SETUP_ADMIN, async (page) => {
        const o = new TagOps(page, seedId, notes);
        await o.open();
        for (const id of plan.removeIds ?? []) await o.removeId(id);
        for (const r of plan.削除する並び順 ?? []) await o.並び順の行を削除(r);
        for (const n of plan.remove ?? []) await o.removeNamed(n);
        for (const [label, v] of plan.register ?? []) await o.register(label, v);
      });
    }
    for (const f of plan.files) prepareCsv(seedId, f, notes);
  });
}

const on = (名称: string, 並び順: string): ShortTagInput => ({ 名称, 並び順, アルファベット順: true });
const off = (名称: string, 並び順: string): ShortTagInput => ({ 名称, 並び順, アルファベット順: false });
const label = (suffix: string) => `〔略称タグID-M0316-${suffix}〕`;

// ---- 新規登録・更新が通るもの ----

defineCaseSeed("S-M03-16-CASE-001", {
  remove: ["CSV新規略称M0316-A-001", "CSV新規略称M0316-B-001"],
  files: [{
    file: "new_rows-001.csv", rows: [STD, ["", "CSV新規略称M0316-A-001", "30"], ["", "CSV新規略称M0316-B-001", "31"]],
    正本の語: ["見出し「ID・名称・並び順」", "空IDの「CSV新規略称M0316-A-001」並び順30", "「CSV新規略称M0316-B-001」並び順31"],
  }],
});

defineCaseSeed("S-M03-16-CASE-002", {
  remove: ["既存略称M0316-A-002", "CSV更新略称-002"],
  register: [[label("002"), on("既存略称M0316-A-002", "10")]],
  files: [{
    file: "m0316-update-002.csv", rows: [STD, [label("002"), "CSV更新略称-002", "20"]],
    正本の語: ["IDに〔略称タグID-M0316-002〕、名称に「CSV更新略称-002」、並び順に20"],
  }],
});

defineCaseSeed("S-M03-16-CASE-003", {
  remove: ["ID列なし略称-003"],
  files: [{ file: "no_id_header-003.csv", rows: [["名称", "並び順"], ["ID列なし略称-003", "40"]], 正本の語: ["見出し「名称・並び順」", "名称「ID列なし略称-003」・並び順40"] }],
});

defineCaseSeed("S-M03-16-CASE-004", {
  removeIds: ["999999004"],
  remove: ["空ID略称-004", "IDゼロ略称-004", "未登録ID略称-004"],
  files: [{
    file: "id_variants-004.csv",
    rows: [STD, ["", "空ID略称-004", "41"], ["0", "IDゼロ略称-004", "42"], ["999999004", "未登録ID略称-004", "43"]],
    正本の語: ["ID空、0、999999004の3行", "名称「空ID略称-004」「IDゼロ略称-004」「未登録ID略称-004」", "並び順41、42、43"],
  }],
});

defineCaseSeed("S-M03-16-CASE-005", {
  remove: ["ID中間略称-005"],
  files: [{ file: "id_middle-005.csv", rows: [["名称", "ID", "並び順"], ["ID中間略称-005", "", "44"]], 正本の語: ["見出し「名称・ID・並び順」", "名称「ID中間略称-005」・ID空・並び順44"] }],
});

defineCaseSeed("S-M03-16-CASE-006", {
  remove: ["既存略称M0316-A-006"],
  register: [[label("006"), on("既存略称M0316-A-006", "10")]],
  files: [{
    file: "same_id_name-006.csv", rows: [STD, [label("006"), "既存略称M0316-A-006", "12"]],
    正本の語: ["IDに〔略称タグID-M0316-006〕、名称に「既存略称M0316-A-006」、並び順に12"],
  }],
});

defineCaseSeed("S-M03-16-CASE-007", {
  remove: ["カンマ区切り略称-007"],
  files: [{ file: "comma_text.txt", rows: [STD, ["", "カンマ区切り略称-007", "45"]], 正本の語: ["カンマ区切り", "名称「カンマ区切り略称-007」・並び順45"] }],
});

defineCaseSeed("S-M03-16-CASE-008", {
  remove: ["タブ区切り略称-008"],
  files: [{ file: "tab_file.tsv", 区切り: "\t", rows: [STD, ["", "タブ区切り略称-008", "46"]], 正本の語: ["タブ区切り", "名称「タブ区切り略称-008」・並び順46"] }],
});

defineCaseSeed("S-M03-16-CASE-009", {
  remove: ["文字コード略称-009"],
  files: [{ file: "shift_jis-009.csv", 符号: "Shift_JIS", rows: [STD, ["", "文字コード略称-009", "47"]], 正本の語: ["Shift_JIS・LF・カンマ区切り", "名称「文字コード略称-009」・並び順47"] }],
});

defineCaseSeed("S-M03-16-CASE-010", {
  remove: ["CRLF改行略称-010", "CR改行略称-010"],
  files: [
    { file: "newline_crlf-010.csv", 改行: "\r\n", rows: [STD, ["", "CRLF改行略称-010", "48"]], 正本の語: ["UTF－8・CRLF・名称「CRLF改行略称-010」・並び順48"] },
    { file: "newline_cr-010.csv", 改行: "\r", rows: [STD, ["", "CR改行略称-010", "49"]], 正本の語: ["UTF－8・CR・名称「CR改行略称-010」・並び順49"] },
  ],
});

defineCaseSeed("S-M03-16-CASE-011", {
  remove: ["ゼロ幅略称-011"],
  files: [{
    file: "bom_zero_width-011.csv", 符号: "UTF-8（バイト順序記号つき）", rows: [STD, ["", "ゼロ​幅﻿略称-011", "53"]],
    正本の語: ["UTF－8のバイト順序記号付き", "ゼロ幅スペースとゼロ幅ノーブレークスペース", "正規化後の名称が「ゼロ幅略称-011」・並び順53"],
  }],
});

defineCaseSeed("S-M03-16-CASE-014", {
  remove: ["行末区切り略称-014"],
  files: [{
    file: "trailing_delimiter-014.csv", 行末に区切り: true, rows: [STD, ["", "行末区切り略称-014", "54"]],
    正本の語: ["見出し行とデータ行の末尾に区切り文字あり", "名称「行末区切り略称-014」・並び順54"],
  }],
});

defineCaseSeed("S-M03-16-CASE-031", {
  remove: ["CSV新規略称M0316-A-031", "CSV新規略称M0316-B-031"],
  files: [{
    file: "new_rows-031.csv", rows: [STD, ["", "CSV新規略称M0316-A-031", "30"], ["", "CSV新規略称M0316-B-031", "31"]],
    正本の語: ["空IDの「CSV新規略称M0316-A-031」並び順30", "「CSV新規略称M0316-B-031」並び順31"],
  }],
});

defineCaseSeed("S-M03-16-CASE-039", {
  remove: ["囲み区切り略称M0316-039-A,M0316-039-B"],
  files: [{
    file: "m0316-039-quoted.csv", rows: [STD, ["", "囲み区切り略称M0316-039-A,M0316-039-B", "90"]],
    正本の語: ["見出し「ID,名称,並び順」", "名称は二重引用符で囲んだ「囲み区切り略称M0316-039-A,M0316-039-B」・並び順90"],
  }],
});

defineCaseSeed("S-M03-16-CASE-040", {
  remove: ["CSV完了表示略称M0316-040-A", "CSV完了表示略称M0316-040-B"],
  files: [{
    file: "m0316-040-ok.csv", rows: [STD, ["", "CSV完了表示略称M0316-040-A", "95"], ["", "CSV完了表示略称M0316-040-B", "96"]],
    正本の語: ["見出し「ID,名称,並び順」", "ID空の「CSV完了表示略称M0316-040-A」並び順95", "ID空の「CSV完了表示略称M0316-040-B」並び順96"],
  }],
});

defineCaseSeed("S-M03-16-CASE-041", {
  remove: ["更新前略称M0316-A-041", "更新前略称M0316-B-041", "更新後略称M0316-A-041", "更新後略称M0316-B-041"],
  // 正本の投入方法は、1件目を登録したあと「続けて」2件目を入れると書く。登録の後は1件目の編集欄にいるので、
  // 「新規登録へ戻る」を押して新規追加の入力欄へ戻ってから入れる（戻らずに入れると1件目を書き換えてしまう）
  register: [[label("041A"), on("更新前略称M0316-A-041", "10")], [label("041B"), off("更新前略称M0316-B-041", "11")]],
  files: [{
    file: "m0316-041-update.csv",
    rows: [STD, [label("041A"), "更新後略称M0316-A-041", "20"], [label("041B"), "更新後略称M0316-B-041", "21"]],
    正本の語: ["見出し「ID,名称,並び順」", "IDに〔略称タグID-M0316-041A〕、名称に「更新後略称M0316-A-041」、並び順に20", "IDに〔略称タグID-M0316-041B〕、名称に「更新後略称M0316-B-041」、並び順に21"],
  }],
});

defineCaseSeed("S-M03-16-CASE-042", {
  remove: ["再取込略称-M0316-042"],
  files: [{
    file: "m0316-042-dup.csv", rows: [STD, ["", "再取込略称-M0316-042", "97"]],
    正本の語: ["見出し「ID,名称,並び順」", "ID空の「再取込略称-M0316-042」並び順97"],
  }],
});

// ---- 取り込みが止まるもの ----

defineCaseSeed("S-M03-16-CASE-012", {
  files: [{ file: "empty-012.csv", rows: [], 正本の語: ["empty-012.csv=0バイト"] }],
});

defineCaseSeed("S-M03-16-CASE-015", {
  remove: ["末尾空略称-015"],
  files: [{ file: "trailing_required_empty-015.csv", rows: [STD, ["", "末尾空略称-015", ""]], 正本の語: ["名称「末尾空略称-015」・末尾の並び順が空"] }],
});

defineCaseSeed("S-M03-16-CASE-016", {
  files: [{ file: "trailing_required_empty-016.csv", rows: [STD, ["", "末尾空略称-016", ""]], 正本の語: ["ファイル上の2行目が名称「末尾空略称-016」・末尾の並び順が空"] }],
});

defineCaseSeed("S-M03-16-CASE-017", {
  remove: ["列数正常略称-017", "列数不足略称-017"],
  files: [{
    file: "column_count_mismatch-017.csv", rows: [STD, ["", "列数正常略称-017", "60"], ["", "列数不足略称-017"]],
    正本の語: ["2行目は3列で名称「列数正常略称-017」・並び順60", "3行目は名称「列数不足略称-017」までの2列"],
  }],
});

defineCaseSeed("S-M03-16-CASE-018", {
  files: [{
    file: "column_count_mismatch-018.csv", rows: [STD, ["", "列数正常略称-018", "60"], ["", "列数不足略称-018"]],
    正本の語: ["2行目は3列で名称「列数正常略称-018」・並び順60", "3行目は名称「列数不足略称-018」までの2列"],
  }],
});

defineCaseSeed("S-M03-16-CASE-019", {
  削除する並び順: ["62"],
  files: [{ file: "name_empty-019.csv", rows: [STD, ["", "", "62"]], 正本の語: ["名称空・並び順62"] }],
});

defineCaseSeed("S-M03-16-CASE-020", {
  remove: ["並び順空略称-020"],
  files: [{ file: "order_empty-020.csv", rows: [["名称", "並び順", "ID"], ["並び順空略称-020", "", "0"]], 正本の語: ["見出し「名称・並び順・ID」・名称「並び順空略称-020」・並び順空・ID 0"] }],
});

defineCaseSeed("S-M03-16-CASE-021", {
  files: [{ file: "name_empty-021.csv", rows: [STD, ["", "", "62"]], 正本の語: ["ファイル上の2行目が名称空・並び順62"] }],
});

defineCaseSeed("S-M03-16-CASE-022", {
  remove: ["並び順重複略称M0316-A-022", "並び順重複略称M0316-B-022"],
  files: [{
    file: "duplicate_order-022.csv", rows: [STD, ["", "並び順重複略称M0316-A-022", "70"], ["", "並び順重複略称M0316-B-022", "70"]],
    正本の語: ["名称「並び順重複略称M0316-A-022」「並び順重複略称M0316-B-022」の2行・両行の並び順70"],
  }],
});

defineCaseSeed("S-M03-16-CASE-023", {
  files: [{
    file: "duplicate_order-023.csv", rows: [STD, ["", "並び順重複略称M0316-A-023", "70"], ["", "並び順重複略称M0316-B-023", "70"]],
    正本の語: ["2行目は名称「並び順重複略称M0316-A-023」・並び順70", "3行目は名称「並び順重複略称M0316-B-023」・並び順70"],
  }],
});

const masterNameDuplicate = (n: string): CasePlan => ({
  remove: [`既存略称M0316-A-${n}`, `重複既存略称-${n}`],
  register: [[label(`${n}A`), on(`既存略称M0316-A-${n}`, "10")], [label(`${n}B`), off(`重複既存略称-${n}`, "11")]],
  files: [{
    file: `duplicate_master_name-${n}.csv`, rows: [STD, [label(`${n}A`), `重複既存略称-${n}`, "71"]],
    正本の語: [`IDに〔略称タグID-M0316-${n}A〕、名称に「重複既存略称-${n}」、並び順に71`],
  }],
});
defineCaseSeed("S-M03-16-CASE-024", masterNameDuplicate("024"));
defineCaseSeed("S-M03-16-CASE-025", masterNameDuplicate("025"));

defineCaseSeed("S-M03-16-CASE-026", {
  remove: ["見出し順序不一致略称-026", "見出し内容不一致略称-026"],
  files: [
    { file: "wrong_order_header-026.csv", rows: [["ID", "並び順", "名称"], ["", "72", "見出し順序不一致略称-026"]], 正本の語: ["見出し「ID・並び順・名称」・名称「見出し順序不一致略称-026」"] },
    { file: "wrong_name_header-026.csv", rows: [["ID", "略称名", "並び順"], ["", "見出し内容不一致略称-026", "73"]], 正本の語: ["名称見出しを「略称名」とした名称「見出し内容不一致略称-026」"] },
  ],
});

defineCaseSeed("S-M03-16-CASE-027", {
  files: [{ file: "wrong_order_header-027.csv", rows: [["ID", "並び順", "名称"], ["", "74", "見出し順序不一致略称-027"]], 正本の語: ["見出し「ID・並び順・名称」・名称「見出し順序不一致略称-027」"] }],
});

defineCaseSeed("S-M03-16-CASE-029", {
  files: [{ file: "header_only-029.csv", rows: [STD], 正本の語: ["見出し「ID・名称・並び順」のみでデータ行なし"] }],
});

defineCaseSeed("S-M03-16-CASE-030", {
  remove: ["既存略称M0316-A-030", "原子性更新略称-030", "原子性新規略称-030"],
  register: [[label("030"), on("既存略称M0316-A-030", "10")]],
  files: [{
    file: "atomic_error-030.csv",
    rows: [STD, [label("030"), "原子性更新略称-030", "80"], ["", "原子性新規略称-030", "81"], ["", "", "82"]],
    正本の語: ["2行目にID 〔略称タグID-M0316-030〕・名称「原子性更新略称-030」・並び順80", "3行目にID空・名称「原子性新規略称-030」・並び順81", "4行目に名称空・並び順82"],
  }],
});
