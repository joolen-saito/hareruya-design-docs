/**
 * M03-20 部門CSV入力（部門登録CSVアップロード画面）の画面シード。正本: cases/M03-20_seed_data.tsv
 *
 * 正本の作り方は、ほとんどが次の形をしている。
 * 1. 部門登録/編集画面の部門一覧で、シード表が挙げた部門名・部門コード（・ID）の行を、削除ボタンと確認ダイアログで消す（無くなるまで）。
 * 2. 既存の部門が要るものは、準備用のファイル（見出し行の下に、ID列を空にした行）を部門登録CSVアップロード画面で取り込み、
 *    登録完了のメッセージを確かめてから、部門一覧の部門名の行のID欄の番号を控える。
 * 3. ケースが選ぶファイルを、試験用端末（e2e/.state/m03-20/）に作る。控えた番号を書くファイルは、ID列に控えた番号を書く。
 * 作るファイルは UTF-8（026 だけ Shift_JIS）、改行は LF、末尾に改行1個、先頭の印（BOM）なし。準備用のファイルの名前は正本に無いので
 * 「prep-<シードの番号>.csv」とした（解釈）。
 * 正本が中身を書いたファイル（0バイトの2件・no_id_header.csv・linkm0320-002.csv）は e2e/fixtures/m03-20/ のものを使い、中身をここでも照合する。
 *
 * 正本が値を書いていない行（008・034・035・040）は、下の「解釈で入れた値」のとおりに決めた。
 * 解釈で足した行の部門コードは数字だけにした。アプリは数字だけの部門コードしか受け付けないので、足した値のせいで取込が止まり、
 * 期待結果「更新されない・追加されない」が別の理由で満たされてしまうのを避けるため。
 *
 * 作らないシード（使うケースも実装しない）:
 * - S-M03-20-CASE-011・012: DBシードで部門を11桁・12桁のIDに置く。
 * - S-M03-20-CASE-021: DBシードで同範囲の部門コードの部門を削除する。
 * - S-M03-20-CASE-023: 画像ファイル（PNG）を置く。
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
import { BuySummarySearchPage } from "../pages/admin/m03_18_buy_summary";
import { DepartmentPage, DepartmentRow } from "../pages/admin/m03_18_department";
import { DepartmentCsvImportPage, importAndExpectComplete, 取込ファイル } from "../pages/admin/m03_20_department_csv";
import { ensureMember } from "../pages/admin/member";

export const M0320_ADMIN: Account = { loginId: "m0320_admin", password: "Passw0rd!M0320" };
export const M0320L_ADMIN: Account = { loginId: "linkm0320admin", password: "LinkM0320Adm!1" };

/** 正本の取込ファイルの見出し行（部門登録CSVファイルフォーマットの5項目） */
const STD_HEADER = "ID,部門名,部門コード,免税区分,MTGBuyer表示フラグ";
/** ファイルサイズ上限（シード表 S-M03-20-CONFIG の 5MB）。「正確に5MB」は 5×1024×1024 バイトと読んだ（解釈） */
export const 上限のバイト数 = 5 * 1024 * 1024;

/** 正本が値を書いていない行に、解釈で入れた値（ケースの確かめにも使う） */
export const 解釈の値 = {
  "008": {
    更新行: { 部門名: "必須空欄確認更新部門-008", 部門コード: "93200801", 免税区分: "1", MTGBuyer表示フラグ: "1" },
    部門名空欄行: { 部門名: "", 部門コード: "93200802", 免税区分: "0", MTGBuyer表示フラグ: "0" },
    部門コード空欄行: { 部門名: "必須空欄確認部門B-008", 部門コード: "", 免税区分: "0", MTGBuyer表示フラグ: "0" },
    免税区分空欄行: { 部門名: "必須空欄確認部門C-008", 部門コード: "93200804", 免税区分: "", MTGBuyer表示フラグ: "0" },
  },
  "034": { 列数正常部門の免税区分と表示フラグ: ["0", "0"], 列数不足部門の免税区分: "0" },
  "035": {
    一行目: { 部門名: "ID重複更新部門A-035", 部門コード: "93203501", 免税区分: "1", MTGBuyer表示フラグ: "1" },
    二行目: { 部門名: "ID重複更新部門B-035", 部門コード: "93203502", 免税区分: "2", MTGBuyer表示フラグ: "0" },
  },
  "040": {
    更新行: { 部門名: "原子性更新部門-040", 部門コード: "93204001", 免税区分: "1", MTGBuyer表示フラグ: "1" },
    免税区分空欄行: { 部門名: "原子性免税空欄部門-040", 部門コード: "93204003", 免税区分: "", MTGBuyer表示フラグ: "0" },
  },
} as const;

type 行の値 = { 部門名: string; 部門コード: string; 免税区分: string; MTGBuyer表示フラグ: string };
const line = (id: string, v: 行の値) => [id, v.部門名, v.部門コード, v.免税区分, v.MTGBuyer表示フラグ].join(",");

// ---- ファイル ----

const FIXTURE_DIR = path.join(REPO_ROOT, "e2e", "fixtures", "m03-20");
const RUNTIME_DIR = path.join(STATE_DIR, "m03-20");
/** e2e/fixtures/m03-20/ にあるファイル（正本が中身を書いたもの） */
const FIXTURES = new Set(["empty-028.csv", "empty-M0320-029.csv", "no_id_header.csv", "linkm0320-002.csv"]);

/** 送るときの形式種別（ブラウザがファイルの拡張子から決めるものと同じ） */
const MIME: Record<string, string> = {
  csv: "text/csv", tsv: "text/tab-separated-values", txt: "text/plain", xls: "application/vnd.ms-excel",
};

/** ケースが取込ファイルに選ぶファイル（シードが用意したもの） */
export function m0320File(name: string): 取込ファイル {
  const file = FIXTURES.has(name) ? path.join(FIXTURE_DIR, name) : path.join(RUNTIME_DIR, name);
  if (!fs.existsSync(file)) throw new Error(`${name} が無い（${file}）。そのファイルを作るシードを先に流す`);
  const ext = name.split(".").pop() ?? "";
  const mimeType = MIME[ext];
  if (!mimeType) throw new Error(`${name}: 拡張子 ${ext} の形式種別を決めていない`);
  return { name, mimeType, buffer: fs.readFileSync(file) };
}

let sjisTable: Map<string, number[]> | null = null;
/**
 * 文字列を Shift_JIS のバイト列にする（026）。Node には Shift_JIS への変換が無いので、
 * Shift_JIS の読み取り（TextDecoder）で2バイトの組をすべて読み、逆引きの表を作る。最後に読み戻して一致を確かめる。
 */
function toShiftJis(text: string): Buffer {
  const dec = new TextDecoder("shift_jis");
  if (!sjisTable) {
    sjisTable = new Map();
    for (let b = 0x20; b <= 0x7e; b++) sjisTable.set(String.fromCharCode(b), [b]);
    const leads = [...Array.from({ length: 0x9f - 0x81 + 1 }, (_, i) => 0x81 + i), ...Array.from({ length: 0xfc - 0xe0 + 1 }, (_, i) => 0xe0 + i)];
    for (const lead of leads) {
      for (let trail = 0x40; trail <= 0xfc; trail++) {
        if (trail === 0x7f) continue;
        const ch = dec.decode(Uint8Array.of(lead, trail));
        if (ch.length === 1 && ch !== "\uFFFD" && !sjisTable.has(ch)) sjisTable.set(ch, [lead, trail]);
      }
    }
  }
  const bytes: number[] = [];
  for (const ch of text) {
    if (ch === "\n") { bytes.push(0x0a); continue; }
    const b = sjisTable.get(ch);
    if (!b) throw new Error(`「${ch}」を Shift_JIS にできない`);
    bytes.push(...b);
  }
  const buf = Buffer.from(bytes);
  if (dec.decode(buf) !== text) throw new Error("Shift_JIS にしたバイト列を読み戻すと元の文字列にならない");
  return buf;
}

type FileSpec = {
  /** ファイル名（シード表の名前） */
  name: string;
  /** 行（見出しを含む）。〔…〕は控えた番号に置き換える。区切りは拡張子が tsv ならタブ、ほかはカンマで書いておく */
  lines: string[];
  encoding?: "shift_jis";
  /** 末尾まで含めた大きさ（バイト）。指定したときは末尾を改行で埋めて合わせる */
  sizeBytes?: number;
  /** シード表（状態・属性と投入方法）にそのまま書かれているはずの語（書き写しの誤りを止める） */
  正本の語: string[];
};

/** シード表の文に、ファイル名と正本の語が書かれていること */
function expectSpecInSeed(seedId: string, spec: { name: string; 正本の語: string[] }): void {
  const s = getSeed(seedId);
  const text = s["状態・属性"] + s.投入方法;
  for (const w of [spec.name, ...spec.正本の語]) if (!text.includes(w)) throw new Error(`${seedId}: シード表に「${w}」が無い（書き写しの誤り）`);
}

function contentOf(spec: FileSpec, notes: Notes): Buffer {
  let text = spec.lines.map((l) => l.replace(/〔[^〕]+〕/g, (label) => notes.get(label))).join("\n") + "\n";
  if (spec.sizeBytes !== undefined) {
    const now = Buffer.byteLength(text, "utf-8");
    if (now > spec.sizeBytes) throw new Error(`${spec.name}: 中身だけで ${now} バイトあり、${spec.sizeBytes} バイトに合わせられない`);
    text += "\n".repeat(spec.sizeBytes - now);
  }
  return spec.encoding === "shift_jis" ? toShiftJis(text) : Buffer.from(text, "utf-8");
}

/** ケースが選ぶファイルを試験用端末に作り（e2e/fixtures にあるものは中身を照合し）、書いた中身と同じかを読み戻して確かめる */
function prepareFile(seedId: string, spec: FileSpec, notes: Notes): void {
  expectSpecInSeed(seedId, spec);
  const want = contentOf(spec, notes);
  const file = FIXTURES.has(spec.name) ? path.join(FIXTURE_DIR, spec.name) : path.join(RUNTIME_DIR, spec.name);
  if (!FIXTURES.has(spec.name)) {
    fs.mkdirSync(RUNTIME_DIR, { recursive: true });
    fs.writeFileSync(file, want);
  }
  if (!fs.existsSync(file)) throw new Error(`${seedId}: ファイル ${file} が無い`);
  const got = fs.readFileSync(file);
  if (!got.equals(want)) throw new Error(`${seedId}: ファイル ${file} の中身がシード表と違う`);
  if (spec.sizeBytes !== undefined && fs.statSync(file).size !== spec.sizeBytes) throw new Error(`${seedId}: ${spec.name} の大きさが ${spec.sizeBytes} バイトでない`);
}

/** 0バイトのファイル（e2e/fixtures にあるもの）が0バイトであること */
function expectEmptyFixture(seedId: string, name: string): void {
  expectSpecInSeed(seedId, { name, 正本の語: ["0バイト"] });
  const file = path.join(FIXTURE_DIR, name);
  if (!fs.existsSync(file) || fs.statSync(file).size !== 0) throw new Error(`${seedId}: ${file} が0バイトのファイルとして無い`);
}

// ---- 管理者・設定 ----

/** メンバー登録画面のデフォルト検索表示店舗の、未選択の選択肢の名前 */
const 未選択 = "選択してください";

/**
 * 正本は所属店舗を指定しない。管理画面で利用可能な店舗を1つ選び、商品管理を操作できるシステム管理者の権限を付ける
 * （M03-14 と同じ作り方）。デフォルト検索表示店舗を「全店」と定めたときは、未選択にする（店舗で絞らない。M03-18 と同じ）。
 */
async function createAdmin(page: Page, 名前: string, account: Account, email: string, 検索表示店舗: "所属店舗" | "全店"): Promise<void> {
  await page.goto(adminUrl("/setting/system/member/new"));
  const stores = await page.locator('[name="admin_member[baseInfo]"] option').evaluateAll((options) => options
    .map((option) => option as HTMLOptionElement)
    .filter((option) => option.value !== "")
    .map((option) => option.textContent?.trim() ?? "")
    .filter(Boolean));
  if (stores.length === 0) throw new Error(`${名前}: メンバーに割り当てられる店舗が画面に無い`);
  const store = stores[0];
  await ensureMember(page, {
    名前, 所属店舗: store, ログインID: account.loginId, メールアドレス: email,
    パスワード: account.password, 権限: "システム管理者", デフォルト検索表示店舗: 検索表示店舗 === "全店" ? 未選択 : store, 編集可能店舗: [store],
  });
}

/** ログインでき（ロックされていない）、部門登録/編集画面と部門登録CSVアップロード画面を開けることを、ケースとは別のセッションで確かめる */
async function expectCanOpen(page: Page, who: string): Promise<void> {
  const s = new DepartmentPage(page);
  await s.openNew();
  await expect(s.登録ボタン, `${who}で部門登録/編集画面を開けない`).toBeVisible();
  await new DepartmentCsvImportPage(page).open();
}

defineSeed("S-M03-20-ADM", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, (page) => createAdmin(page, "M03-20試験管理者", M0320_ADMIN, "m0320_admin@example.test", "所属店舗"));
  await withAdminSession(browser, M0320_ADMIN, (page) => expectCanOpen(page, "M03-20試験管理者"));
});

defineSeed("S-M03-20-L-ADM", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, (page) => createAdmin(page, "M03-20連携試験管理者", M0320L_ADMIN, "linkm0320admin@example.test", "全店"));
  await withAdminSession(browser, M0320L_ADMIN, async (page) => {
    await expectCanOpen(page, "M03-20連携試験管理者");
    await new BuySummarySearchPage(page).open();
  });
});

defineSeed("S-M03-20-CONFIG", async () => {
  // 管理画面に設定項目が無い。設定を書き換えず、値がシード表の状態（アプリの既定値）であることだけを確かめる（違えば止める）。
  const c = CSV入出力設定();
  if (c.アップロード上限MB !== 5 || c.取込区切り文字 !== ",") {
    throw new Error(`S-M03-20-CONFIG: CSVアップロードのファイルサイズ上限が ${c.アップロード上限MB}MB、CSV取込の区切り文字が「${c.取込区切り文字}」`
      + "（シード表は 5MB・カンマ）。設定を直してアプリのキャッシュを作り直してから流す");
  }
});

// ---- 部門と取込ファイル ----

/** シードを作る管理者のセッションで、正本の作り方の操作をする */
class SeedOps {
  readonly s: DepartmentPage;

  constructor(readonly page: Page, readonly seedId: string, readonly notes: Notes) {
    this.s = new DepartmentPage(page);
  }

  readonly warn = (w: string) => reportSeedIssue(this.seedId, w);

  /** 部門一覧で、部門名・部門コード・IDのどれかが当たる行を、削除ボタンと確認ダイアログで無くなるまで削除する */
  async remove(t: { 部門名?: string[]; 部門コード?: string[]; ID?: string[] }): Promise<void> {
    await this.s.openNew();
    const hit = (r: DepartmentRow) => (t.部門名 ?? []).includes(r.部門名) || (t.部門コード ?? []).includes(r.部門コード) || (t.ID ?? []).includes(r.ID);
    for (;;) {
      const row = (await this.s.allRows()).find(hit);
      if (!row) break;
      await this.s.deleteRow(this.s.rowById(row.ID), `${this.seedId}: 部門（ID ${row.ID}・部門名「${row.部門名}」・部門コード ${row.部門コード}）の削除`);
    }
    if ((await this.s.allRows()).some(hit)) throw new Error(`${this.seedId}: 削除したはずの部門が一覧に残っている`);
  }

  /**
   * 準備用のファイル（見出し行の下に、ID列を空にした行）を作って部門登録CSVアップロード画面で取り込み、登録完了のメッセージを確かめる。
   * そのあと部門登録/編集画面の部門一覧で、各行の部門名の行のID欄の番号を控える。
   */
  async prepare(rows: [label: string, line: string][]): Promise<void> {
    const s = getSeed(this.seedId);
    for (const [, l] of rows) if (!s.投入方法.includes(`「${l}」`)) throw new Error(`${this.seedId}: シード表の投入方法に準備用の行「${l}」が無い（書き写しの誤り）`);
    const name = `prep-${this.seedId.replace(/^S-M03-20-(CASE|DP)-/, "")}.csv`;
    const buffer = Buffer.from([STD_HEADER, ...rows.map(([, l]) => l)].join("\n") + "\n", "utf-8");
    fs.mkdirSync(RUNTIME_DIR, { recursive: true });
    fs.writeFileSync(path.join(RUNTIME_DIR, name), buffer);
    await importAndExpectComplete(this.page, m0320File(name), `${this.seedId}: 準備用のファイル ${name} の取込`);
    await this.s.openNew();
    for (const [label, l] of rows) this.notes.set(label, await this.s.idOfName(l.split(",")[1]));
  }

  file(spec: FileSpec): void {
    prepareFile(this.seedId, spec, this.notes);
  }
}

/** 部門一覧を使うシード（シードを作る管理者のセッションで操作する） */
function defineDepartmentSeed(seedId: string, build: (o: SeedOps) => Promise<void>): void {
  defineSeed(seedId, async ({ browser, notes, seed }) => {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      await build(new SeedOps(page, seed.シードID, notes));
    });
  });
}

/** 部門一覧で消してから、ケースが選ぶファイルを作る形（既存の部門を使わない） */
function cleanAndFile(t: { 部門名?: string[]; 部門コード?: string[]; ID?: string[] }, spec: FileSpec) {
  return async (o: SeedOps) => {
    await o.remove(t);
    o.file(spec);
  };
}

const L = (n: string) => `〔部門ID-M0320-${n}〕`;

defineDepartmentSeed("S-M03-20-CASE-001", cleanAndFile(
  { 部門名: ["CSV新規部門A", "CSV新規部門B", "CSV新規部門C"], 部門コード: ["M0320-NEW-A-001", "M0320-NEW-B-001", "M0320-NEW-C-001"] },
  {
    name: "bulk_new.csv",
    lines: [STD_HEADER, ",CSV新規部門A,M0320-NEW-A-001,0,0", ",CSV新規部門B,M0320-NEW-B-001,1,1", ",CSV新規部門C,M0320-NEW-C-001,2,1"],
    正本の語: ["「CSV新規部門A」・M0320-NEW-A-001・免税区分0・MTGBuyer表示フラグ0", "「CSV新規部門B」・M0320-NEW-B-001・免税区分1・MTGBuyer表示フラグ1", "「CSV新規部門C」・M0320-NEW-C-001・免税区分2・MTGBuyer表示フラグ1"],
  },
));

defineDepartmentSeed("S-M03-20-CASE-002", async (o) => {
  await o.remove({ 部門名: ["既存部門A-M03-20-002", "CSV更新部門"], 部門コード: ["DPT-OLD-002", "DPT-020"] });
  await o.prepare([[L("002"), ",既存部門A-M03-20-002,DPT-OLD-002,0,0"]]);
  o.file({ name: "update-002.csv", lines: [STD_HEADER, `${L("002")},CSV更新部門,DPT-020,2,1`], 正本の語: ["CSV更新部門・DPT-020・免税区分2・MTGBuyer表示フラグ1"] });
});

defineDepartmentSeed("S-M03-20-CASE-003", async (o) => {
  await o.remove({ 部門名: ["既存部門B-M03-20-003", "混在更新部門", "混在新規部門"], 部門コード: ["DPT-OLD-003", "MIX-UPD-003", "MIX-NEW-003"] });
  await o.prepare([[L("003"), ",既存部門B-M03-20-003,DPT-OLD-003,1,1"]]);
  o.file({
    name: "mixed.csv",
    lines: [STD_HEADER, `${L("003")},混在更新部門,MIX-UPD-003,2,0`, ",混在新規部門,MIX-NEW-003,0,1"],
    正本の語: ["「混在更新部門」・MIX-UPD-003・免税区分2・表示フラグ0", "「混在新規部門」・MIX-NEW-003・免税区分0・表示フラグ1"],
  });
});

defineDepartmentSeed("S-M03-20-CASE-004", cleanAndFile(
  { 部門名: ["未登録ID部門"], 部門コード: ["UNKNOWN-M03-20-004"], ID: ["999999"] },
  { name: "unknown_id.csv", lines: [STD_HEADER, "999999,未登録ID部門,UNKNOWN-M03-20-004,0,0"], 正本の語: ["ID 999999・未登録ID部門・UNKNOWN-M03-20-004・免税区分0・MTGBuyer表示フラグ0"] },
));

defineDepartmentSeed("S-M03-20-CASE-005", cleanAndFile(
  { 部門名: ["ID列なし部門"], 部門コード: ["NOID-005"] },
  { name: "no_id_header.csv", lines: ["部門名,部門コード,免税区分,MTGBuyer表示フラグ", "ID列なし部門,NOID-005,0,0"], 正本の語: ["見出し「部門名・部門コード・免税区分・MTGBuyer表示フラグ」、データ「ID列なし部門」・NOID-005・0・0"] },
));

defineDepartmentSeed("S-M03-20-CASE-006", cleanAndFile(
  { 部門名: ["空ID部門A", "空ID部門B"], 部門コード: ["BLANK-A-006", "BLANK-B-006"] },
  { name: "blank_ids.csv", lines: [STD_HEADER, ",空ID部門A,BLANK-A-006,0,0", ",空ID部門B,BLANK-B-006,1,1"], 正本の語: ["空ID・空ID部門A・BLANK-A-006・0・0", "空ID・空ID部門B・BLANK-B-006・1・1"] },
));

defineDepartmentSeed("S-M03-20-CASE-007", async (o) => {
  await o.remove({ 部門名: ["既存部門A-M03-20-007"], 部門コード: ["DPT-020-007"] });
  await o.prepare([[L("007"), ",既存部門A-M03-20-007,DPT-020-007,0,0"]]);
  o.file({ name: "same_master_values.csv", lines: [STD_HEADER, `${L("007")},既存部門A-M03-20-007,DPT-020-007,2,1`], 正本の語: ["同じID・部門名・部門コード、免税区分2・表示フラグ1"] });
});

defineDepartmentSeed("S-M03-20-CASE-008", async (o) => {
  const v = 解釈の値["008"];
  await o.remove({
    部門名: ["既存部門A-M03-20-008", v.更新行.部門名, v.部門コード空欄行.部門名, v.免税区分空欄行.部門名],
    部門コード: ["DPT-020-008", v.更新行.部門コード, v.部門名空欄行.部門コード, v.免税区分空欄行.部門コード],
  });
  await o.prepare([[L("008"), ",既存部門A-M03-20-008,DPT-020-008,0,0"]]);
  o.file({
    name: "required_empty.csv",
    lines: [STD_HEADER, line(L("008"), v.更新行), line("", v.部門名空欄行), line("", v.部門コード空欄行), line("", v.免税区分空欄行)],
    正本の語: ["先頭にID 〔部門ID-M0320-008〕を更新する正常行、後続に部門名空欄、部門コード空欄、免税区分空欄の各行"],
  });
});

const name128 = "名".repeat(128), code128 = "C".repeat(128), name129 = "名".repeat(129), code129 = "C".repeat(129);
/** 作ったファイルの部門名・部門コードの文字数を数えて確かめる（シード表の投入方法） */
function expectLengths(seedId: string, file: string, n: number): void {
  const [, row] = m0320File(file).buffer.toString("utf-8").split("\n");
  const [, 部門名, 部門コード] = row.split(",");
  if ([...部門名].length !== n || [...部門コード].length !== n) throw new Error(`${seedId}: ${file} の部門名が ${[...部門名].length} 文字、部門コードが ${[...部門コード].length} 文字（${n} 文字のはず）`);
}

defineDepartmentSeed("S-M03-20-CASE-009", async (o) => {
  await o.remove({ 部門名: [name128], 部門コード: [code128] });
  o.file({ name: "text_length_128.csv", lines: [STD_HEADER, `,${name128},${code128},0,0`], 正本の語: ["空ID・部門名「名」128文字・部門コード「C」128文字・免税区分0・表示フラグ0"] });
  expectLengths(o.seedId, "text_length_128.csv", 128);
});

defineDepartmentSeed("S-M03-20-CASE-010", async (o) => {
  await o.remove({ 部門名: [name129], 部門コード: [code129] });
  o.file({ name: "text_length_129.csv", lines: [STD_HEADER, `,${name129},${code129},0,0`], 正本の語: ["空ID・部門名「名」129文字・部門コード「C」129文字・免税区分0・表示フラグ0"] });
  expectLengths(o.seedId, "text_length_129.csv", 129);
});

defineDepartmentSeed("S-M03-20-CASE-013", cleanAndFile(
  { 部門名: ["文字ID部門"], 部門コード: ["IDTEXT-013"] },
  { name: "id_text.csv", lines: [STD_HEADER, "ABC,文字ID部門,IDTEXT-013,0,0"], 正本の語: ["ID ABC・文字ID部門・IDTEXT-013・免税区分0・表示フラグ0"] },
));

defineDepartmentSeed("S-M03-20-CASE-014", cleanAndFile(
  { 部門名: ["免税区分0部門", "免税区分1部門", "免税区分2部門"], 部門コード: ["TAX0-014", "TAX1-014", "TAX2-014"] },
  {
    name: "tax_values.csv",
    lines: [STD_HEADER, ",免税区分0部門,TAX0-014,0,0", ",免税区分1部門,TAX1-014,1,0", ",免税区分2部門,TAX2-014,2,0"],
    正本の語: ["「免税区分0部門」・TAX0-014・0・0", "「免税区分1部門」・TAX1-014・1・0", "「免税区分2部門」・TAX2-014・2・0"],
  },
));

defineDepartmentSeed("S-M03-20-CASE-015", cleanAndFile(
  { 部門名: ["免税区分3部門"], 部門コード: ["TAX3-015"] },
  { name: "tax_value_3.csv", lines: [STD_HEADER, ",免税区分3部門,TAX3-015,3,0"], 正本の語: ["空ID・免税区分3部門・TAX3-015・免税区分3・表示フラグ0"] },
));

defineDepartmentSeed("S-M03-20-CASE-016", cleanAndFile(
  { 部門名: ["免税区分文字部門"], 部門コード: ["TAXTEXT-016"] },
  { name: "tax_text.csv", lines: [STD_HEADER, ",免税区分文字部門,TAXTEXT-016,A,0"], 正本の語: ["空ID・免税区分文字部門・TAXTEXT-016・免税区分A・表示フラグ0"] },
));

defineDepartmentSeed("S-M03-20-CASE-017", cleanAndFile(
  { 部門名: ["Buyer非表示部門", "Buyer表示部門"], 部門コード: ["BUYER0-017", "BUYER1-017"] },
  {
    name: "buyer_flags.csv",
    lines: [STD_HEADER, ",Buyer非表示部門,BUYER0-017,0,0", ",Buyer表示部門,BUYER1-017,0,1"],
    正本の語: ["「Buyer非表示部門」・BUYER0-017・0・表示フラグ0", "「Buyer表示部門」・BUYER1-017・0・表示フラグ1"],
  },
));

defineDepartmentSeed("S-M03-20-CASE-018", cleanAndFile(
  { 部門名: ["Buyerフラグ2部門"], 部門コード: ["BUYER2-018"] },
  { name: "buyer_flag_2.csv", lines: [STD_HEADER, ",Buyerフラグ2部門,BUYER2-018,0,2"], 正本の語: ["空ID・Buyerフラグ2部門・BUYER2-018・免税区分0・表示フラグ2"] },
));

defineDepartmentSeed("S-M03-20-CASE-019", cleanAndFile(
  { 部門名: ["Buyerフラグ文字部門"], 部門コード: ["BUYERTEXT-019"] },
  { name: "buyer_flag_text.csv", lines: [STD_HEADER, ",Buyerフラグ文字部門,BUYERTEXT-019,0,A"], 正本の語: ["空ID・Buyerフラグ文字部門・BUYERTEXT-019・免税区分0・表示フラグA"] },
));

defineSeed("S-M03-20-CASE-020", async () => {
  // 投入不要。ケースの開始時に、ファイル選択欄を空のままにする（ケースは新しく開いた画面でファイルを選ばない）。
});

defineDepartmentSeed("S-M03-20-CASE-022", cleanAndFile(
  { 部門名: ["ファイル上限超過部門"], 部門コード: ["OVER-SIZE-001"] },
  {
    name: "configured_limit_plus_1.csv",
    // 「末尾の充填文字」は改行とした（解釈。データ行の値は変えない）
    lines: [STD_HEADER, ",ファイル上限超過部門,OVER-SIZE-001,0,0"],
    sizeBytes: 上限のバイト数 + 1,
    正本の語: ["正確に5MB+1バイト、空ID・ファイル上限超過部門・OVER-SIZE-001・免税区分0・表示フラグ0"],
  },
));

defineDepartmentSeed("S-M03-20-CASE-024", cleanAndFile(
  { 部門名: ["テキスト形式部門"], 部門コード: ["TEXT-024"] },
  { name: "comma_text.txt", lines: [STD_HEADER, ",テキスト形式部門,TEXT-024,0,0"], 正本の語: ["空ID・テキスト形式部門・TEXT-024・免税区分0・表示フラグ0"] },
));

defineDepartmentSeed("S-M03-20-CASE-025", cleanAndFile(
  { 部門名: ["タブ区切り部門"], 部門コード: ["TSV-025"] },
  {
    name: "tab_file.tsv",
    lines: [STD_HEADER.split(",").join("\t"), ["", "タブ区切り部門", "TSV-025", "0", "0"].join("\t")],
    正本の語: ["タブ区切り、空ID・タブ区切り部門・TSV-025・免税区分0・表示フラグ0"],
  },
));

defineDepartmentSeed("S-M03-20-CASE-026", cleanAndFile(
  { 部門名: ["文字コード変換部門"], 部門コード: ["SJIS-026"] },
  {
    name: "shift_jis.csv", encoding: "shift_jis",
    lines: [STD_HEADER, ",文字コード変換部門,SJIS-026,0,0"],
    正本の語: ["Shift_JIS・カンマ区切り、空ID・文字コード変換部門・SJIS-026・免税区分0・表示フラグ0"],
  },
));

/** 027 の部門名・部門コード（ゼロ幅スペース・ゼロ幅ノーブレークスペースを含む） */
export const ゼロ幅を含む部門名 = "ゼロ\u200B幅部門";
export const ゼロ幅を含む部門コード = "ZERO\uFEFFWIDTH";
defineDepartmentSeed("S-M03-20-CASE-027", cleanAndFile(
  { 部門名: ["ゼロ幅部門", ゼロ幅を含む部門名], 部門コード: ["ZEROWIDTH", ゼロ幅を含む部門コード] },
  {
    name: "zero_width.csv",
    lines: [STD_HEADER, `,${ゼロ幅を含む部門名},${ゼロ幅を含む部門コード},0,0`],
    正本の語: [`部門名「${ゼロ幅を含む部門名}」にゼロ幅スペース、部門コード「${ゼロ幅を含む部門コード}」にゼロ幅ノーブレークスペース、免税区分0、表示フラグ0`],
  },
));

defineSeed("S-M03-20-CASE-028", async ({ seed }) => { expectEmptyFixture(seed.シードID, "empty-028.csv"); });

defineDepartmentSeed("S-M03-20-CASE-029", async (o) => {
  await o.remove({
    部門名: ["既存部門A-029", "既存部門B-029", "重複既存名-029", "既存部門C-029"],
    部門コード: ["DPT-020-029", "DPT-021-029", "DPT-022-029", "DUP-CODE-029"],
  });
  await o.prepare([
    [L("029A"), ",既存部門A-029,DPT-020-029,0,0"],
    [L("029B"), ",既存部門B-029,DPT-021-029,1,1"],
    [L("029C"), ",重複既存名-029,DPT-022-029,0,0"],
    [L("029D"), ",既存部門C-029,DUP-CODE-029,0,0"],
  ]);
  expectEmptyFixture(o.seedId, "empty-M0320-029.csv");
});

defineSeed("S-M03-20-CASE-030", async ({ seed, notes }) => {
  // シード表のとおり、部門の登録・削除は行わない（ファイルを作るだけ）
  prepareFile(seed.シードID, {
    name: "missing_code_header-030.csv",
    lines: ["ID,部門名,免税区分,MTGBuyer表示フラグ", ",見出し不足部門-030,0,0"],
    正本の語: ["部門コード見出しなし、データ行は見出し不足部門-030・免税区分0・表示フラグ0"],
  }, notes);
});

defineDepartmentSeed("S-M03-20-CASE-031", cleanAndFile(
  { 部門名: ["見出し不足部門"] },
  { name: "missing_code_header-031.csv", lines: ["ID,部門名,免税区分,MTGBuyer表示フラグ", ",見出し不足部門,0,0"], 正本の語: ["部門コード見出しなし、データ行は「見出し不足部門」・免税区分0・表示フラグ0"] },
));

defineSeed("S-M03-20-CASE-032", async ({ seed, notes }) => {
  // シード表のとおり、部門の登録・削除は行わない（ファイルを作るだけ）
  prepareFile(seed.シードID, { name: "header_only.csv", lines: [STD_HEADER], 正本の語: ["定義済みの5見出しだけでデータ行なし"] }, notes);
});

defineDepartmentSeed("S-M03-20-CASE-033", cleanAndFile(
  { 部門名: ["旧表示フラグ部門"], 部門コード: ["OLDFLAG-033"] },
  {
    name: "old_display_header.csv",
    lines: ["ID,部門名,部門コード,免税区分,表示フラグ", ",旧表示フラグ部門,OLDFLAG-033,0,0"],
    正本の語: ["MTGBuyer表示フラグの代わりに「表示フラグ」を使用し、空ID・旧表示フラグ部門・OLDFLAG-033・免税区分0・表示フラグ0"],
  },
));

defineDepartmentSeed("S-M03-20-CASE-034", async (o) => {
  const v = 解釈の値["034"];
  await o.remove({ 部門名: ["列数正常部門", "列数不足部門"], 部門コード: ["COL-OK-034", "COL-NG-034"] });
  o.file({
    name: "column_count_mismatch.csv",
    lines: [STD_HEADER, `,列数正常部門,COL-OK-034,${v.列数正常部門の免税区分と表示フラグ.join(",")}`, `,列数不足部門,COL-NG-034,${v.列数不足部門の免税区分}`],
    正本の語: ["5列の正常行「列数正常部門」・COL-OK-034と、表示フラグ列を欠く4列の「列数不足部門」・COL-NG-034"],
  });
});

defineDepartmentSeed("S-M03-20-CASE-035", async (o) => {
  const v = 解釈の値["035"];
  await o.remove({ 部門名: ["既存部門A", v.一行目.部門名, v.二行目.部門名], 部門コード: ["DPT-020-035", v.一行目.部門コード, v.二行目.部門コード] });
  await o.prepare([[L("035"), ",既存部門A,DPT-020-035,0,0"]]);
  o.file({ name: "duplicate_id.csv", lines: [STD_HEADER, line(L("035"), v.一行目), line(L("035"), v.二行目)], 正本の語: ["ID 〔部門ID-M0320-035〕を異なる更新内容で2行使用"] });
});

defineDepartmentSeed("S-M03-20-CASE-036", cleanAndFile(
  { 部門名: ["ファイル内重複名"], 部門コード: ["FILE-NAME-A-036", "FILE-NAME-B-036"] },
  {
    name: "duplicate_name.csv",
    lines: [STD_HEADER, ",ファイル内重複名,FILE-NAME-A-036,0,0", ",ファイル内重複名,FILE-NAME-B-036,1,1"],
    正本の語: ["空ID・ファイル内重複名・FILE-NAME-A-036・0・0と、空ID・ファイル内重複名・FILE-NAME-B-036・1・1"],
  },
));

defineDepartmentSeed("S-M03-20-CASE-037", cleanAndFile(
  { 部門名: ["ファイル内コード重複部門A", "ファイル内コード重複部門B"], 部門コード: ["FILE-DUP-CODE"] },
  {
    name: "duplicate_code.csv",
    lines: [STD_HEADER, ",ファイル内コード重複部門A,FILE-DUP-CODE,0,0", ",ファイル内コード重複部門B,FILE-DUP-CODE,1,1"],
    正本の語: ["空ID・ファイル内コード重複部門A・FILE-DUP-CODE・0・0と、空ID・ファイル内コード重複部門B・FILE-DUP-CODE・1・1"],
  },
));

defineDepartmentSeed("S-M03-20-CASE-038", async (o) => {
  await o.remove({ 部門名: ["重複既存名"], 部門コード: ["DPT-038", "NEW-CODE-038"] });
  await o.prepare([[L("038"), ",重複既存名,DPT-038,0,0"]]);
  o.file({ name: "duplicate_master_name.csv", lines: [STD_HEADER, ",重複既存名,NEW-CODE-038,0,0"], 正本の語: ["空ID・重複既存名・NEW-CODE-038・免税区分0・表示フラグ0"] });
});

defineDepartmentSeed("S-M03-20-CASE-039", async (o) => {
  await o.remove({ 部門名: ["既存部門C-039", "新規部門名-039"], 部門コード: ["DUP-CODE"] });
  await o.prepare([[L("039"), ",既存部門C-039,DUP-CODE,0,0"]]);
  o.file({ name: "duplicate_master_code.csv", lines: [STD_HEADER, ",新規部門名-039,DUP-CODE,0,0"], 正本の語: ["空ID・新規部門名-039・DUP-CODE・免税区分0・表示フラグ0"] });
});

defineDepartmentSeed("S-M03-20-CASE-040", async (o) => {
  const v = 解釈の値["040"];
  await o.remove({ 部門名: ["既存部門A-040", "原子性新規部門", v.更新行.部門名], 部門コード: ["DPT-020-040", "ATOMIC-NEW-040", v.更新行.部門コード] });
  await o.prepare([[L("040"), ",既存部門A-040,DPT-020-040,0,0"]]);
  o.file({
    name: "atomic_error.csv",
    lines: [STD_HEADER, line(L("040"), v.更新行), ",原子性新規部門,ATOMIC-NEW-040,0,0", line("", v.免税区分空欄行)],
    正本の語: ["先頭にID 〔部門ID-M0320-040〕の更新行、次に空ID・原子性新規部門・ATOMIC-NEW-040・0・0、最後に免税区分空欄の行"],
  });
});

defineDepartmentSeed("S-M03-20-CASE-041", async (o) => {
  await o.remove({ 部門名: ["既存部門A-041", "CSV更新部門-041"], 部門コード: ["DPT-OLD-041", "DPT-UPD-041"] });
  await o.prepare([[L("041"), ",既存部門A-041,DPT-OLD-041,0,0"]]);
  o.file({ name: "update-041.csv", lines: [STD_HEADER, `${L("041")},CSV更新部門-041,DPT-UPD-041,2,1`], 正本の語: ["同ID・CSV更新部門-041・DPT-UPD-041・免税区分2・表示フラグ1"] });
});

defineDepartmentSeed("S-M03-20-CASE-042", async (o) => {
  await o.remove({ 部門名: ["既存部門A-042", "CSV更新部門-042"], 部門コード: ["DPT-OLD-042", "DPT-UPD-042"] });
  await o.prepare([[L("042"), ",既存部門A-042,DPT-OLD-042,0,0"]]);
  o.file({ name: "update-042.csv", lines: [STD_HEADER, `${L("042")},CSV更新部門-042,DPT-UPD-042,2,1`], 正本の語: ["同ID・CSV更新部門-042・DPT-UPD-042・免税区分2・表示フラグ1"] });
});

defineDepartmentSeed("S-M03-20-CASE-043", cleanAndFile(
  { 部門名: ["成功遷移部門-043"], 部門コード: ["NEW-SINGLE-043"] },
  { name: "new_single.csv", lines: [STD_HEADER, ",成功遷移部門-043,NEW-SINGLE-043,0,0"], 正本の語: ["空ID・成功遷移部門-043・NEW-SINGLE-043・免税区分0・表示フラグ0"] },
));

defineDepartmentSeed("S-M03-20-CASE-045", cleanAndFile(
  { 部門名: ["表計算種別部門"], 部門コード: ["XLS-001"] },
  {
    name: "dept_text.xls",
    lines: [STD_HEADER, ",表計算種別部門,XLS-001,0,0"],
    正本の語: ["中身はUnicode変換形式の8ビット符号化・カンマ区切り、空ID・表計算種別部門・XLS-001・免税区分0・表示フラグ0", "送信時の形式種別=application/vnd.ms-excel"],
  },
));

defineDepartmentSeed("S-M03-20-L-DEPT-051", async (o) => {
  await o.remove({ 部門名: ["リンク出力部門-002"], 部門コード: ["9320022"] });
  o.file({
    name: "linkm0320-002.csv",
    lines: [STD_HEADER, ",リンク出力部門-002,9320022,2,0"],
    正本の語: ["見出し行ID,部門名,部門コード,免税区分,MTGBuyer表示フラグ／1行目(ID空),リンク出力部門-002,9320022,2,0"],
  });
  // 「ダウンロード先に部門CSVが残っていない」: ケースのダウンロードは、そのケースのブラウザが新しく作る置き場に保存されるので、取り除くものは無い
});

defineDepartmentSeed("S-M03-20-DP-052", async (o) => {
  await o.remove({
    部門名: ["M0320-052既存部門A", "M0320-052既存部門B", "M0320-052更新部門A", "M0320-052更新部門B"],
    部門コード: ["M0320-052-OLD-A", "M0320-052-OLD-B", "M0320-052-UPD-A", "M0320-052-UPD-B"],
  });
  await o.prepare([[L("052A"), ",M0320-052既存部門A,M0320-052-OLD-A,0,0"], [L("052B"), ",M0320-052既存部門B,M0320-052-OLD-B,1,1"]]);
  o.file({
    name: "update-052.csv",
    lines: [STD_HEADER, `${L("052A")},M0320-052更新部門A,M0320-052-UPD-A,2,1`, `${L("052B")},M0320-052更新部門B,M0320-052-UPD-B,0,0`],
    正本の語: ["M0320-052更新部門A・M0320-052-UPD-A・免税区分2・表示フラグ1", "M0320-052更新部門B・M0320-052-UPD-B・免税区分0・表示フラグ0"],
  });
});

defineDepartmentSeed("S-M03-20-DP-053", cleanAndFile(
  { 部門名: ["M0320-053再取込新規部門"], 部門コード: ["M0320-053-NEW"] },
  { name: "new-053.csv", lines: [STD_HEADER, ",M0320-053再取込新規部門,M0320-053-NEW,0,1"], 正本の語: ["「,M0320-053再取込新規部門,M0320-053-NEW,0,1」"] },
));

defineDepartmentSeed("S-M03-20-DP-054", async (o) => {
  await o.remove({ 部門名: ["M0320-054既存部門", "M0320-054更新部門"], 部門コード: ["M0320-054-OLD", "M0320-054-UPD"] });
  await o.prepare([[L("054"), ",M0320-054既存部門,M0320-054-OLD,0,0"]]);
  o.file({ name: "update-054.csv", lines: [STD_HEADER, `${L("054")},M0320-054更新部門,M0320-054-UPD,2,1`], 正本の語: ["M0320-054更新部門・M0320-054-UPD・免税区分2・表示フラグ1"] });
});
