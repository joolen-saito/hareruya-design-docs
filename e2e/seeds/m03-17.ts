/**
 * M03-17 売上分析タグ登録/編集の画面シード。正本: cases/M03-17_seed_data.tsv
 *
 * 正本の作り方はほとんどが同じ形をしている。
 * 売上分析タグ登録/編集画面を編集対象を指定せずに開き、一覧の表示件数を12000件に切り替えて全件を見て、
 * 同じ名称・並び順の行が残っていれば削除ボタンで削除してから、入力欄に名称・並び順を入れて登録し、
 * 一覧の名称・並び順の行のID欄から売上分析タグIDを控える。
 * 登録すると画面はその売上分析タグの編集の入力欄へ移るので、続けて登録するときは「新規登録へ戻る」を押して新規登録の入力欄へ戻る。
 *
 * 作らないシード（DBでの準備が要る。ケース 003・027・028・032 も実装しない）:
 * S-M03-17-SORT-003・S-M03-17-PAGING-032（売上分析タグを退避してDBシードの固定IDの行だけに置き換える）、
 * S-M03-17-ORDER-LINKED-027・028（DBシードで受注・注文明細を登録して売上分析タグを紐付ける）。
 */
import { expect, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { Notes } from "../lib/notes";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { readGoodsProductId } from "../pages/admin/m03_01_goods_list_seed";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { productIdsByCode, saveFromSearchResult } from "../pages/admin/m03_17_product";
import { SalesAnalysisTagInput, SalesAnalysisTagPage } from "../pages/admin/m03_17_sales_analysis_tag";
import { ensureMember } from "../pages/admin/member";

export const M0317_ADMIN: Account = { loginId: "m0317_admin", password: "Passw0rd!M0317" };
export const M0317L_ADMIN: Account = { loginId: "m0317l-admin", password: "Passw0rd!M0317L" };

/** 正本は所属店舗を指定しない。管理画面で利用可能な店舗を1つ選び、商品管理を操作できるシステム管理者の権限を付ける（M03-14 と同じ作り方） */
async function createAdmin(page: Page, 名前: string, account: Account, email: string): Promise<void> {
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
    パスワード: account.password, 権限: "システム管理者", デフォルト検索表示店舗: store, 編集可能店舗: [store],
  });
}

/** ログインでき（ロックされていない）、売上分析タグ登録/編集画面を開けることを、ケースとは別のセッションで確かめる */
async function expectCanOpen(page: Page, who: string): Promise<void> {
  const tag = new SalesAnalysisTagPage(page);
  await tag.openNew();
  await expect(tag.登録ボタン, `${who}で売上分析タグ登録/編集画面を開けない`).toBeVisible();
}

defineSeed("S-M03-17-ADM", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, (page) => createAdmin(page, "M03-17試験管理者", M0317_ADMIN, "m0317_admin@example.test"));
  await withAdminSession(browser, M0317_ADMIN, (page) => expectCanOpen(page, "M03-17試験管理者"));
});

defineSeed("S-M03-17-L-ADM", async ({ browser }) => {
  // 商品管理と分析・集計管理機能は、システム管理者の権限で操作できる
  await withAdminSession(browser, SETUP_ADMIN, (page) => createAdmin(page, "M03-17連携試験管理者", M0317L_ADMIN, "m0317l-admin@example.test"));
  await withAdminSession(browser, M0317L_ADMIN, (page) => expectCanOpen(page, "M03-17連携試験管理者"));
});

defineSeed("S-M03-17-SESSION", { needs: ["S-M03-17-ADM"] }, async ({ browser }) => {
  // 一覧の表示ページと表示件数は、ログイン中のセッションが覚える。ケースのセッションへの設定は、正本の用途
  // 「各ケースが開始時に必要な値を自分で設定する」のとおり、ケースの開始時に行う（spec/m03/m03-17.spec.ts の signIn）。
  // ここでは、新しいセッションで売上分析タグ一覧をページ番号1・表示件数10にできることを確かめる。
  await withAdminSession(browser, M0317_ADMIN, async (page) => {
    await new SalesAnalysisTagPage(page).showFirstPageWith("10");
  });
});

/** シードを作る管理者のセッションで、正本の作り方の操作をする */
class SeedOps {
  readonly tag: SalesAnalysisTagPage;

  constructor(readonly page: Page, readonly seedId: string, readonly notes: Notes) {
    this.tag = new SalesAnalysisTagPage(page);
  }

  readonly warn = (w: string) => reportSeedIssue(this.seedId, w);

  /** 売上分析タグ登録/編集画面を編集対象を指定せずに開き、一覧の表示件数を12000件に切り替えて全件を見る */
  async open(): Promise<void> {
    await this.tag.showFirstPageWith("12000");
    await this.tag.openNew();
    await this.tag.showAllRows();
  }

  /** 新規登録の入力欄にいなければ「新規登録へ戻る」を押す（登録の後は、その売上分析タグの編集の入力欄にいる） */
  async toNew(): Promise<void> {
    if (await this.tag.新規登録へ戻る.count()) await this.tag.pressBackToNew();
  }

  /** 一覧に名称・並び順の行が残っていれば、すべて削除する（並び順を省くと、名称の行すべて） */
  async removeNamed(名称: string, 並び順?: string): Promise<void> {
    const rows = () => (並び順 === undefined ? this.tag.rowsByName(名称) : this.tag.rowsByNameAndRank(名称, 並び順));
    while ((await rows().count()) > 0) {
      await this.tag.deleteRow(rows().first(), `${this.seedId}: 残っていた名称「${名称}」${並び順 === undefined ? "" : `・並び順${並び順}`}の売上分析タグの削除`);
    }
  }

  /** 一覧にIDの行があれば削除する */
  async removeId(id: string): Promise<void> {
    if (await this.tag.rowById(id).count()) await this.tag.deleteRow(this.tag.rowById(id), `${this.seedId}: 売上分析タグID ${id} の削除`);
  }

  /** 新規登録の入力欄で登録し、一覧の名称・並び順の行のID欄から売上分析タグIDを読む（登録後に移った編集の入力欄のIDと同じであること） */
  async register(v: SalesAnalysisTagInput): Promise<string> {
    await this.toNew();
    const fromUrl = await this.tag.register(v, `${this.seedId}: 名称「${v.名称}」・並び順${v.並び順}の登録`);
    await this.tag.showAllRows();
    const id = await this.tag.idOfNameAndRank(v.名称, v.並び順);
    if (id !== fromUrl) throw new Error(`${this.seedId}: 一覧の名称「${v.名称}」の行のID ${id} が、登録後の編集の入力欄のID ${fromUrl} と違う`);
    return id;
  }

  /** 名称・並び順の行が残っていれば削除し、登録して、IDを控える */
  async fresh(label: string, v: SalesAnalysisTagInput): Promise<string> {
    await this.removeNamed(v.名称, v.並び順);
    const id = await this.register(v);
    this.notes.set(label, id);
    return id;
  }
}

function defineTagSeed(seedId: string, build: (o: SeedOps) => Promise<void>, needs: string[] = []): void {
  defineSeed(seedId, { needs }, async ({ browser, notes, seed }) => {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      const o = new SeedOps(page, seed.シードID, notes);
      await o.open();
      await build(o);
    });
  });
}

const tag = (名称: string, 並び順: string): SalesAnalysisTagInput => ({ 名称, 並び順 });
const label = (suffix: string) => `〔売上分析タグID-M0317-${suffix}〕`;

// ---- 1件だけ登録する形 ----

const one = (n: string, v: SalesAnalysisTagInput) => async (o: SeedOps) => { await o.fresh(label(n), v); };
const before = (n: string) => one(n, tag(`編集前売上分析タグ-${n}`, "10"));
defineTagSeed("S-M03-17-VIEW-001", before("001"));
defineTagSeed("S-M03-17-BASE-002", before("002"));
defineTagSeed("S-M03-17-BASE-004", before("004"));
defineTagSeed("S-M03-17-BASE-005", before("005"));
defineTagSeed("S-M03-17-BASE-009", before("009"));
defineTagSeed("S-M03-17-BASE-010", before("010"));
defineTagSeed("S-M03-17-BASE-012", before("012"));
defineTagSeed("S-M03-17-BASE-013", before("013"));
/**
 * 前の実行で、ケースの手順が入れた範囲の境目の並び順のまま保存されて残った行があれば、作らずに止める（判断を返す）。
 * シード表の作り方は並び順10の行しか消さない。手順の並び順（014 は0、017・018 は32768）と同じ名称・並び順の行が残ったまま流すと、
 * 手順の保存がアプリの重複の判定に当たって保存されず、範囲の実装差異が残っていても 017・018 は合格になり（偽の合格）、
 * アプリが直ったあとの 014 は不合格になる。シード表に清掃の手順が無いので消さない。消すかは依頼者が決める。
 */
const beforeUnlessLeft = (n: string, 手順の並び順: string) => async (o: SeedOps) => {
  const 名称 = `編集前売上分析タグ-${n}`;
  const left = await o.tag.rowsByNameAndRank(名称, 手順の並び順).all();
  if (left.length) {
    const ids = await Promise.all(left.map(async (row) => (await o.tag.readRow(row)).ID));
    throw new Error(`${o.seedId}: 前の実行で保存された名称「${名称}」・並び順${手順の並び順}の売上分析タグ（ID ${ids.join("、")}）が残っている。`
      + `残したまま流すと、手順の保存が重複の判定に当たって正しく判定できない。シード表に清掃の手順が無いので作らずに止める（画面から削除してよいかの判断が要る）`);
  }
  await before(n)(o);
};
defineTagSeed("S-M03-17-BASE-014", beforeUnlessLeft("014", "0"));
defineTagSeed("S-M03-17-BASE-016", before("016"));
defineTagSeed("S-M03-17-BASE-017", beforeUnlessLeft("017", "32768"));
defineTagSeed("S-M03-17-BASE-018", beforeUnlessLeft("018", "32768"));
defineTagSeed("S-M03-17-BASE-033", before("033"));
defineTagSeed("S-M03-17-BASE-034", before("034"));
defineTagSeed("S-M03-17-STALE-007", one("007", tag("削除後操作確認タグ-007", "40")));
defineTagSeed("S-M03-17-STALE-008", one("008", tag("削除後操作確認タグ-008", "40")));
defineTagSeed("S-M03-17-CHECK-023", one("023", tag("重複確認補助タグ-023", "230")));
defineTagSeed("S-M03-17-CHECK-024", one("024", tag("重複確認補助タグ-024", "240")));
defineTagSeed("S-M03-17-DELETE-029", one("029", tag("削除対象分析タグ-029", "70")));
defineTagSeed("S-M03-17-DELETE-030", one("030", tag("削除対象分析タグ-030", "70")));
defineTagSeed("S-M03-17-DELETE-031", one("031", tag("削除対象分析タグ-031", "70")));
defineTagSeed("S-M03-17-DELETE-035", one("035", tag("削除対象分析タグ-035", "70")));
defineTagSeed("S-M03-17-DELETE-036", one("036", tag("削除対象分析タグ-036", "70")));

// ---- 手順で使う値の行が無い状態を含む形 ----

defineTagSeed("S-M03-17-BASE-006", async (o) => {
  await o.removeNamed("編集前売上分析タグ-006", "10");
  await o.removeId("999999");
  await o.fresh(label("006"), tag("編集前売上分析タグ-006", "10"));
});

/** 名称・並び順の自分の行を消し、手順で使う名称・並び順の行も消してから、自分の行を登録する（正本の順） */
const absent = (n: string, mine: SalesAnalysisTagInput, gone: SalesAnalysisTagInput) => async (o: SeedOps) => {
  await o.removeNamed(mine.名称, mine.並び順);
  await o.removeNamed(gone.名称, gone.並び順);
  o.notes.set(label(n), await o.register(mine));
};
defineTagSeed("S-M03-17-BASE-011", absent("011", tag("編集前売上分析タグ-011", "10"), tag("あ".repeat(64), "10")));
defineTagSeed("S-M03-17-BASE-015", absent("015", tag("編集前売上分析タグ-015", "10"), tag("編集前売上分析タグ-015", "32767")));
defineTagSeed("S-M03-17-NEW-019", absent("019", tag("編集前売上分析タグ-019", "10"), tag("新規売上分析タグ", "30")));
defineTagSeed("S-M03-17-NEW-020", absent("020", tag("編集前売上分析タグ-020", "10"), tag("新規遷移分析タグ", "31")));
defineTagSeed("S-M03-17-BASE-021", absent("021", tag("編集前売上分析タグ-021", "10"), tag("編集後売上分析タグ", "11")));
defineTagSeed("S-M03-17-BASE-022", absent("022", tag("編集前売上分析タグ-022", "10"), tag("編集遷移分析タグ", "12")));

// ---- 共有の重複判定用タグ ----

defineTagSeed("S-M03-17-DUP", async (o) => {
  // 名称「重複試験タグ」・並び順20の行が無ければ登録し、1件あれば登録せずその行を使う
  const rows = o.tag.rowsByNameAndRank("重複試験タグ", "20");
  const n = await rows.count();
  if (n > 1) throw new Error(`${o.seedId}: 名称「重複試験タグ」・並び順20の行が ${n} 件ある（シード表は1件だけ）`);
  if (n === 0) await o.register(tag("重複試験タグ", "20"));
  o.notes.set(label("共有"), await o.tag.idOfNameAndRank("重複試験タグ", "20"));
});

// ---- 商品と紐づける形 ----

/** グッズ商品CSVの、M03-17 のシードが定めた列の値（ほかの必須列は M03-01 の共通の値。商品カテゴリ(ID)は M03-14 と同じ 2） */
const goodsValues = (売上分析タグID: string): Record<string, string> => ({ "スマレジ連携フラグ": "0", "売上分析タグ(ID)": 売上分析タグID });
const GOODS_CATEGORY_ID = "2";

const linked = (n: string) => async (o: SeedOps) => {
  const tagName = `商品使用中分析タグ-${n}`;
  const code = `M0317-P-${n}`;
  const productName = `分析対象商品A-${n}`;
  // 商品コードは固定の値で、正本に清掃の手順が無い。前の実行の商品が残っていれば、作り直さずに止める（判断を返す）
  const left = await productIdsByCode(o.page, code);
  if (left.length) {
    throw new Error(`${o.seedId}: 商品コード ${code} の商品（商品ID ${left.join("、")}）が前の実行から残っている。正本に清掃の手順が無いので、作り直してよいかの判断が要る`);
  }
  await o.open();
  const tagId = await o.fresh(label(n), tag(tagName, "50"));
  await registerGoodsCsv(o.page, {
    what: `${o.seedId} のグッズ商品CSV登録`, fileName: `${o.seedId}-goods.csv`, categoryId: GOODS_CATEGORY_ID,
    lines: [{ code, nameJp: productName, nameEn: `M0317 analysis product A ${n}` }], common: goodsValues(tagId), onWarning: o.warn,
  });
  o.notes.set(`〔商品ID-M0317-${n}〕`, await readGoodsProductId(o.page, code, productName));
};
defineTagSeed("S-M03-17-PRODUCT-LINKED-025", linked("025"));
defineTagSeed("S-M03-17-PRODUCT-LINKED-026", linked("026"));

/** 実行ごとに変わる文字（年月日時分秒）。正本の「登録済みの商品と重複しない任意の商品コード」「任意の商品名」に付ける */
function runStamp(): string {
  const d = new Date();
  const p = (v: number) => String(v).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

/** 売上分析タグを付けない商品をグッズ商品CSVで作り、商品IDを控え、商品登録編集画面で割引率と販売制限を選んで登録する */
async function optionCheckProduct(o: SeedOps, n: string): Promise<void> {
  const stamp = runStamp();
  const code = `M0317L${n}-${stamp}`;
  const productName = `売上分析タグ選択肢確認商品-M0317-${n}-${stamp}`;
  await registerGoodsCsv(o.page, {
    what: `${o.seedId} のグッズ商品CSV登録`, fileName: `${o.seedId}-goods.csv`, categoryId: GOODS_CATEGORY_ID,
    lines: [{ code, nameJp: productName, nameEn: `M0317 option check product ${n} ${stamp}` }], common: goodsValues(""), onWarning: o.warn,
  });
  const productId = await readGoodsProductId(o.page, code, productName);
  o.notes.set(`〔商品ID-M0317-${n}〕`, productId);
  await saveFromSearchResult(o.page, productId, o.warn);
}

defineTagSeed("S-M03-17-L-PRD-040", async (o) => {
  await optionCheckProduct(o, "040");
  await o.open();
  await o.removeNamed("L001M0317n040連携分析タグ");
});

defineTagSeed("S-M03-17-L-DEL-041", async (o) => {
  await optionCheckProduct(o, "041");
  await o.open();
  await o.fresh(label("041"), tag("L004M0317n041削除分析タグ", "10"));
});
