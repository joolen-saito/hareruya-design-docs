/**
 * M03-18 部門登録/編集の画面シード。正本: cases/M03-18_seed_data.tsv
 *
 * 正本の作り方はほとんどが同じ形をしている。
 * 部門登録/編集画面を新規登録の入力欄で開き、部門名・部門コード・免税区分を入れ、MTGBuyer表示フラグにチェックを入れて
 * 登録ボタンを押し、移った部門の一覧で部門名の行のID列の番号を控える。
 * - 正本は「登録時にスマレジへ部門が連携されるため、スマレジ試験環境へ接続できる状態で行う」と書く。手元の環境（local）では、
 *   スマレジの接続先が設定されていないとき、アプリに組み込みの模擬の応答が連携に答える（アプリの設定は書き換えない）。
 * - 正本が「…の行があれば削除して」と書いたシードだけ、一覧から削除してから作る。それ以外のケース専用のシードは、
 *   同じ部門名・部門コードの部門が残っていたら作らずに止める（正本に清掃の手順が無い。前の実行の残りなら、流し直す前に判断が要る）。
 *
 * 作らないシード（使うケースも実装しない）:
 * - S-M03-18-SMAREGI: スマレジの接続設定の書き換えと、スマレジ試験環境の管理画面での操作が要る。
 * - S-M03-18-LIST-001・COUNT-016・BUY-REF-039・INDIVIDUAL-REF-040: DBシードで部門などを置き換える。
 * - S-M03-18-BASE-013・015・019・021・034・DELETE-035・036・STALE-037: スマレジ連携先部門IDをDBへ直接設定する。
 * - S-M03-18-PRODUCT-REF-038: 固定の商品IDの商品をDBへ直接設定する。
 * - S-M03-18-SUMMARY-REF-048・049: 買取依頼サマリをDBへ直接設定する。
 * - S-M03-18-CSV-052: 同範囲の部門コードの部門をDBで削除する。
 * - S-M03-18-NEW-010・011・012・014: 使うケースがスマレジのシードも使う（ケースを実装しない）。
 */
import { expect, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { 部門コードの部門, 部門名の部門 } from "../db/m03_18_department";
import { CSV入出力設定 } from "../lib/app_config";
import { available as dbAvailable } from "../lib/db";
import { Notes } from "../lib/notes";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { BuySummarySearchPage } from "../pages/admin/m03_18_buy_summary";
import { DepartmentInput, DepartmentPage, DepartmentRow, 行数確認ファイル } from "../pages/admin/m03_18_department";
import { ensureMember } from "../pages/admin/member";

export const M0318_ADMIN: Account = { loginId: "m0318_admin", password: "Passw0rd!M0318" };
export const M0318L_ADMIN: Account = { loginId: "linkm0318admin", password: "LinkM0318Adm!1" };

/** メンバー登録画面のデフォルト検索表示店舗の、未選択の選択肢の名前 */
const 未選択 = "選択してください";

/**
 * 正本は所属店舗を指定しない。管理画面で利用可能な店舗を1つ選び、商品管理を操作できるシステム管理者の権限を付ける
 * （M03-14 と同じ作り方）。デフォルト検索表示店舗を「全店」と定めたときは、未選択にする（店舗で絞らない）。
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

/** ログインでき（ロックされていない）、部門登録/編集画面を開けることを、ケースとは別のセッションで確かめる */
async function expectCanOpenDepartment(page: Page, who: string): Promise<void> {
  const s = new DepartmentPage(page);
  await s.openNew();
  await expect(s.登録ボタン, `${who}で部門登録/編集画面を開けない`).toBeVisible();
}

defineSeed("S-M03-18-ADM", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, (page) => createAdmin(page, "M03-18試験管理者", M0318_ADMIN, "m0318_admin@example.test", "所属店舗"));
  await withAdminSession(browser, M0318_ADMIN, (page) => expectCanOpenDepartment(page, "M03-18試験管理者"));
});

defineSeed("S-M03-18-L-ADM", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, (page) => createAdmin(page, "M03-18連携試験管理者", M0318L_ADMIN, "linkm0318admin@example.test", "全店"));
  await withAdminSession(browser, M0318L_ADMIN, async (page) => {
    await expectCanOpenDepartment(page, "M03-18連携試験管理者");
    await new BuySummarySearchPage(page).open();
  });
});

/** シードを作る管理者のセッションで、正本の作り方の操作をする */
class SeedOps {
  readonly s: DepartmentPage;

  constructor(readonly page: Page, readonly seedId: string, readonly notes: Notes) {
    this.s = new DepartmentPage(page);
  }

  readonly warn = (w: string) => reportSeedIssue(this.seedId, w);

  async open(): Promise<void> {
    await this.s.openNew();
  }

  /** 一覧で条件に合う行をすべて削除する（正本が「…の行があれば削除して」と書いたシード） */
  async removeWhere(what: string, match: (r: DepartmentRow) => boolean): Promise<void> {
    for (;;) {
      const hit = (await this.s.allRows()).find(match);
      if (!hit) break;
      await this.s.deleteRow(this.s.rowById(hit.ID), `${this.seedId}: ${what}の部門（ID ${hit.ID}・部門名「${hit.部門名}」・部門コード ${hit.部門コード}）の削除`);
    }
    if ((await this.s.allRows()).some(match)) throw new Error(`${this.seedId}: ${what}の部門が一覧に残っている`);
  }

  /** 同じ部門名・部門コードの部門が無いこと。正本に清掃の手順が無いので、残っていたら作らずに止める */
  async expectAbsent(v: DepartmentInput): Promise<void> {
    const left = (await this.s.allRows()).filter((r) => r.部門名 === v.部門名 || r.部門コード === v.部門コード);
    if (left.length) {
      throw new Error(`${this.seedId}: 部門名「${v.部門名}」または部門コード ${v.部門コード} の部門が残っている（${left.map((r) => `ID ${r.ID}・「${r.部門名}」・${r.部門コード}`).join(" / ")}）。`
        + "正本に清掃の手順が無いので作り直さない。前の実行の残りなら、流し直すかどうかの判断が要る");
    }
  }

  /** 登録して、一覧の部門名の行のID列の番号を控える */
  async create(label: string, v: DepartmentInput): Promise<string> {
    await this.expectAbsent(v);
    const id = await this.s.register(v, `${this.seedId}: 部門名「${v.部門名}」の登録`);
    this.notes.set(label, id);
    return id;
  }
}

function defineDepartmentSeed(seedId: string, build: (o: SeedOps) => Promise<void>, needs: string[] = []): void {
  defineSeed(seedId, { needs }, async ({ browser, notes, seed }) => {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      const o = new SeedOps(page, seed.シードID, notes);
      await o.open();
      await build(o);
    });
  });
}

const 対象外 = (部門名: string, 部門コード: string): DepartmentInput => ({ 部門名, 部門コード, 免税区分: "対象外", MTGBuyer表示フラグ: true });
const 一般品 = (部門名: string, 部門コード: string): DepartmentInput => ({ 部門名, 部門コード, 免税区分: "一般品", MTGBuyer表示フラグ: true });
const label = (suffix: string) => `〔部門ID-M0318-${suffix}〕`;

// ---- 1件だけ登録する形 ----

const one = (n: string, v: DepartmentInput) => async (o: SeedOps) => { await o.create(label(n), v); };
defineDepartmentSeed("S-M03-18-BASE-002", one("002", 対象外("編集前部門-002", "61")));
defineDepartmentSeed("S-M03-18-BASE-003", one("003", 対象外("編集前部門-003", "62")));
defineDepartmentSeed("S-M03-18-BASE-004", one("004", 対象外("編集前部門-004", "63")));
defineDepartmentSeed("S-M03-18-BASE-005", one("005", 対象外("編集前部門-005", "64")));
defineDepartmentSeed("S-M03-18-VIEW-006", one("006", 対象外("初期値確認部門-006", "65")));
defineDepartmentSeed("S-M03-18-CSV-007", one("007", 一般品("CSV確認部門-007", "66")));
defineDepartmentSeed("S-M03-18-CSV-008", one("008", 一般品("CSV確認部門-008", "67")));
defineDepartmentSeed("S-M03-18-VIEW-009", one("009", 対象外("CSV入力遷移確認部門-009", "68")));
defineDepartmentSeed("S-M03-18-BASE-017", one("017", 対象外("編集前部門-017", "76")));
defineDepartmentSeed("S-M03-18-FORM-018", one("018", 対象外("入力エラー確認部門-018", "77")));
defineDepartmentSeed("S-M03-18-BASE-020", one("020", 対象外("編集前部門-020", "79")));
defineDepartmentSeed("S-M03-18-BASE-022", one("022", 対象外("編集前部門-022", "81")));
defineDepartmentSeed("S-M03-18-BASE-023", one("023", 対象外("編集前部門-023", "82")));
defineDepartmentSeed("S-M03-18-BASE-024", one("024", 対象外("編集前部門-024", "83")));
defineDepartmentSeed("S-M03-18-BASE-027", one("027", 対象外("編集前部門-027", "86")));
defineDepartmentSeed("S-M03-18-BASE-028", one("028", 対象外("編集前部門-028", "87")));
defineDepartmentSeed("S-M03-18-DUPCHECK-029", one("029", 対象外("重複エラー確認部門-029", "88")));
defineDepartmentSeed("S-M03-18-BASE-030", one("030", 対象外("編集前部門-030", "89")));
defineDepartmentSeed("S-M03-18-BASE-031", one("031", 対象外("編集前部門-031", "90")));
defineDepartmentSeed("S-M03-18-BASE-032", one("032", 対象外("編集前部門-032", "91")));
defineDepartmentSeed("S-M03-18-BASE-033", one("033", 対象外("編集前部門-033", "92")));
defineDepartmentSeed("S-M03-18-NEWMODE-047", one("047", 対象外("新規モード確認部門M0318-047", "31804701")));
// 登録したばかりの部門なので、この部門を使う商品規格・買取依頼・個別入力商品・買取依頼サマリは作らない（正本どおり）
defineDepartmentSeed("S-M03-18-L-DEL-046", one("046", 一般品("リンク削除部門002", "9031802")));

// ---- 手順で使う部門名・部門コードの部門が無い状態を含む形 ----

defineDepartmentSeed("S-M03-18-DUPCHECK-025", async (o) => {
  await o.removeWhere("部門コード 55", (r) => r.部門コード === "55");
  await o.create(label("025"), 対象外("重複確認補助部門-025", "84"));
});

defineDepartmentSeed("S-M03-18-DUPCHECK-026", async (o) => {
  await o.removeWhere("部門名「新規重複コード部門」", (r) => r.部門名 === "新規重複コード部門");
  await o.create(label("026"), 対象外("重複確認補助部門-026", "85"));
});

defineDepartmentSeed("S-M03-18-L-NEW-045", async (o) => {
  const name = "リンク新設部門001";
  const code = "9031801";
  await o.removeWhere(`部門名「${name}」または部門コード ${code}`, (r) => r.部門名 === name || r.部門コード === code);
  // ケースの事前準備は「DBで両方の部門が0件であることを確認する」と書く（参照だけ）
  if (dbAvailable) {
    const left = { 部門名: 部門名の部門(name).length, 部門コード: 部門コードの部門(code).length };
    if (left.部門名 !== 0 || left.部門コード !== 0) throw new Error(`${o.seedId}: DBに部門名「${name}」が ${left.部門名} 件、部門コード ${code} が ${left.部門コード} 件ある（0件のはず）`);
  } else {
    o.warn("DB確認の接続先が無いので、部門名・部門コードの部門が0件であることは画面の一覧だけで確かめた");
  }
});

defineDepartmentSeed("S-M03-18-NOTFOUND", async (o) => {
  await o.removeWhere("ID 999999", (r) => r.ID === "999999");
});

// ---- 共有の重複確認部門（あれば使い、無ければ作る） ----

/** 部門名の部門が1件だけあり、部門コードも同じ行なら、その部門の入力欄でシード表と同じ値かを確かめて使う。無ければ作る */
async function ensureShared(o: SeedOps, l: string, v: DepartmentInput): Promise<void> {
  await o.open();
  const rows = await o.s.allRows();
  const byName = rows.filter((r) => r.部門名 === v.部門名);
  const byCode = rows.filter((r) => r.部門コード === v.部門コード);
  if (byName.length === 0 && byCode.length === 0) {
    o.notes.set(l, await o.s.register(v, `${o.seedId}: 部門名「${v.部門名}」の登録`));
    return;
  }
  if (byName.length !== 1 || byCode.length !== 1 || byName[0].ID !== byCode[0].ID) {
    throw new Error(`${o.seedId}: 部門名「${v.部門名}」が ${byName.length} 件、部門コード ${v.部門コード} が ${byCode.length} 件あり、シード表の1件の形でない。どれを使うか決められない`);
  }
  const id = byName[0].ID;
  await o.s.pressEdit(id);
  const got = await o.s.inputValues();
  const want = { 部門名: v.部門名, 部門コード: v.部門コード, 免税区分: v.免税区分, MTGBuyer表示フラグ: v.MTGBuyer表示フラグ };
  if (JSON.stringify(got) !== JSON.stringify(want)) {
    throw new Error(`${o.seedId}: 残っている部門（ID ${id}）の内容が ${JSON.stringify(got)}（シード表は ${JSON.stringify(want)}）。作り直してよいかの判断が要る`);
  }
  o.notes.set(l, id);
}

defineDepartmentSeed("S-M03-18-DUPLICATE", async (o) => {
  await ensureShared(o, label("共有A"), 対象外("重複部門", "30"));
  await ensureShared(o, label("共有B"), 対象外("重複コード元部門", "40"));
});

// ---- 行数確認ファイル（CSV取込の行数の上限） ----

const csvRows = (n: string, データ行数: number) => async (o: SeedOps) => {
  // スクリプトで作るファイルの中身（ケースは同じ関数で同じ中身を作ってアップロードする）
  const file = 行数確認ファイル(n, データ行数);
  if (file.行数 !== データ行数 + 1) throw new Error(`${o.seedId}: ${file.name} の行数が ${file.行数}（${データ行数 + 1} のはず）`);
  const codes = new Set(file.部門コード);
  await o.removeWhere(`部門コード M0318-${n}-0001〜${file.部門コード[file.部門コード.length - 1]}`, (r) => codes.has(r.部門コード));
  // CSV取込の区切り文字は管理画面に項目が無い。設定を書き換えず、カンマであることだけを確かめる（違えば止める）
  const c = CSV入出力設定();
  if (c.取込区切り文字 !== ",") throw new Error(`${o.seedId}: CSV取込の区切り文字が「${c.取込区切り文字}」（シード表はカンマ）。設定を直してアプリのキャッシュを作り直してから流す`);
};
defineDepartmentSeed("S-M03-18-CSV-050", csvRows("050", 5009));
defineDepartmentSeed("S-M03-18-CSV-051", csvRows("051", 5009));
