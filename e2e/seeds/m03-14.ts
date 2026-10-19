/**
 * M03-14 略称タグ登録/編集の画面シード。正本: cases/M03-14_seed_data.tsv
 *
 * 正本の作り方はほとんどが同じ形をしている。
 * 略称タグ登録/編集画面を開いて一覧の表示件数を12000件にし、同じ名称の行が残っていれば削除ボタンで削除してから、
 * 新規入力欄で名称・並び順・アルファベット順ソートフラグを入れて登録し、一覧の名称の行のID列から略称タグIDを控える。
 * 登録すると画面はその略称タグの編集欄へ移るので、続けて登録するときは「新規登録へ戻る」を押して新規入力欄へ戻る。
 * S-M03-14-SORT-045（並び順45010・45020をDBへ直接設定）と S-M03-14-L-044（ほかの略称タグをDBで全件削除）は、
 * DBでの準備が要るので作らない（ケース 045・044 も実装しない）。
 */
import { expect, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { CSV入出力設定 } from "../lib/app_config";
import { Notes } from "../lib/notes";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { readGoodsProductIdByName, countGoodsByName } from "../pages/admin/m03_01_goods_list_seed";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { ensureMember } from "../pages/admin/member";
import { openProductEdit, saveWithDiscount, selectedShortTagId } from "../pages/admin/product_edit";
import { ShortTagInput, ShortTagPage } from "../pages/admin/short_tag";

export const M0314_ADMIN: Account = { loginId: "m0314_admin", password: "Passw0rd!M0314" };
export const M0314L_ADMIN: Account = { loginId: "m0314l-admin", password: "Passw0rd!M0314L" };

/** 正本は所属店舗を指定しない。管理画面で利用可能な店舗を1つ選び、商品管理を操作できるシステム管理者の権限を付ける（M03-11 と同じ作り方） */
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

/** ログインでき（ロックされていない）、略称タグ登録/編集画面を開けることを、ケースとは別のセッションで確かめる */
async function expectCanOpen(page: Page, who: string): Promise<void> {
  const tag = new ShortTagPage(page);
  await tag.openNew();
  await expect(tag.登録ボタン, `${who}で略称タグ登録/編集画面を開けない`).toBeVisible();
}

defineSeed("S-M03-14-ADM", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, (page) => createAdmin(page, "M03-14試験管理者", M0314_ADMIN, "m0314_admin@example.test"));
  await withAdminSession(browser, M0314_ADMIN, (page) => expectCanOpen(page, "M03-14試験管理者"));
});

defineSeed("S-M03-14-L-ADM", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, (page) => createAdmin(page, "M03-14連携試験管理者", M0314L_ADMIN, "m0314l-admin@example.test"));
  await withAdminSession(browser, M0314L_ADMIN, (page) => expectCanOpen(page, "M03-14連携試験管理者"));
});

defineSeed("S-M03-14-L-CONFIG", async () => {
  // 管理画面に設定項目が無い。設定を書き換えず、値がシード表の状態（アプリの既定値）であることだけを確かめる（違えば止める）。
  const c = CSV入出力設定();
  const want = { 出力区切り文字: ",", 取込区切り文字: ",", 取込囲み文字: '"', アップロード上限MB: 5 };
  if (JSON.stringify(c) !== JSON.stringify(want)) {
    throw new Error(`S-M03-14-L-CONFIG: CSVの入出力の設定が ${JSON.stringify(c)}（シード表は ${JSON.stringify(want)}）。設定を直してアプリのキャッシュを作り直してから流す`);
  }
});

/** シードを作る管理者のセッションで、正本の作り方の操作をする */
class SeedOps {
  readonly tag: ShortTagPage;

  constructor(readonly page: Page, readonly seedId: string, readonly notes: Notes) {
    this.tag = new ShortTagPage(page);
  }

  readonly warn = (w: string) => reportSeedIssue(this.seedId, w);

  /** 略称タグ登録/編集画面を開き、一覧の表示件数を12000件にする */
  async open(): Promise<void> {
    await this.tag.showFirstPageWith("12000");
  }

  /** 新規入力欄にいなければ「新規登録へ戻る」を押す（登録の後は、その略称タグの編集欄にいる） */
  async toNew(): Promise<void> {
    if (await this.tag.新規登録へ戻る.count()) {
      await Promise.all([this.page.waitForURL((u) => u.pathname.endsWith("/product/storage")), this.tag.新規登録へ戻る.click()]);
      await this.tag.ready();
    }
  }

  /** 一覧に名称の行が残っていれば削除する */
  async removeNamed(名称: string): Promise<void> {
    await this.tag.deleteAllNamed(名称);
  }

  /** 一覧にIDの行があれば削除する */
  async removeId(id: string): Promise<void> {
    if (await this.tag.rowById(id).count()) await this.tag.deleteRow(this.tag.rowById(id), `${this.seedId}: 略称タグID ${id} の削除`);
  }

  /** 新規入力欄で登録し、一覧の名称の行のID列から略称タグIDを読む（登録後に移った編集欄のIDと同じであること） */
  async register(v: ShortTagInput): Promise<string> {
    await this.toNew();
    const fromUrl = await this.tag.register(v, `${this.seedId}: 名称「${v.名称}」の登録`);
    const id = await this.tag.idOfName(v.名称);
    if (id !== fromUrl) throw new Error(`${this.seedId}: 一覧の名称「${v.名称}」の行のID ${id} が、登録後の編集欄のID ${fromUrl} と違う`);
    return id;
  }

  /** 名称の行が残っていれば削除し、登録して、IDを控える */
  async fresh(label: string, v: ShortTagInput): Promise<string> {
    await this.removeNamed(v.名称);
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

const off = (名称: string, 並び順: string): ShortTagInput => ({ 名称, 並び順, アルファベット順: false });
const on = (名称: string, 並び順: string): ShortTagInput => ({ 名称, 並び順, アルファベット順: true });
const label = (suffix: string) => `〔略称タグID-M0314-${suffix}〕`;

// ---- 1件だけ登録する形 ----

const one = (n: string, v: ShortTagInput) => async (o: SeedOps) => { await o.fresh(label(n), v); };
defineTagSeed("S-M03-14-BASE-001", one("001", off("編集前略称-001", "10")));
defineTagSeed("S-M03-14-BASE-002", one("002", on("使用中略称-002", "20")));
defineTagSeed("S-M03-14-BASE-003", one("003", off("編集前略称-003", "10")));
defineTagSeed("S-M03-14-BASE-004", one("004", on("使用中略称-004", "20")));
defineTagSeed("S-M03-14-EDIT-015", one("015", off("編集前略称-015", "10")));
defineTagSeed("S-M03-14-INVALID-016", one("016", off("編集前略称-016", "10")));
defineTagSeed("S-M03-14-RANK-021", one("021", off("編集前略称-021", "10")));
defineTagSeed("S-M03-14-RANK-022", one("022", off("編集前略称-022", "10")));
defineTagSeed("S-M03-14-RANK-023", one("023", off("編集前略称-023", "10")));
defineTagSeed("S-M03-14-RANK-024", one("024", off("編集前略称-024", "10")));
defineTagSeed("S-M03-14-RANK-025", one("025", off("編集前略称-025", "10")));
defineTagSeed("S-M03-14-CSRF-028", one("028", off("編集前略称-028", "10")));
defineTagSeed("S-M03-14-CSRF-029", one("029", off("編集前略称-029", "10")));
defineTagSeed("S-M03-14-DELETE-030", one("030", off("編集前略称-030", "10")));
defineTagSeed("S-M03-14-DELETE-031", one("031", off("編集前略称-031", "10")));

// ---- ID 999999 が未登録の状態を含む形 ----

const notFound = (n: string) => async (o: SeedOps) => {
  await o.removeId("999999");
  await o.fresh(label(n), off(`編集前略称-${n}`, "10"));
};
defineTagSeed("S-M03-14-NOTFOUND-005", notFound("005"));
defineTagSeed("S-M03-14-NOTFOUND-034", notFound("034"));

// ---- 手順で使う名称の略称タグが0件の状態を含む形 ----

const absent = (n: string, gone: string, v: ShortTagInput) => async (o: SeedOps) => {
  await o.removeNamed(gone);
  await o.fresh(label(n), v);
};
defineTagSeed("S-M03-14-NEW-010", absent("010", "新規略称A", off("登録基準略称-010", "10")));
defineTagSeed("S-M03-14-NEW-011", absent("011", "遷移確認略称", off("登録基準略称-011", "10")));
defineTagSeed("S-M03-14-NEW-012", absent("012", "任意項目空略称", off("登録基準略称-012", "10")));
defineTagSeed("S-M03-14-EDIT-013", absent("013", "編集後略称", off("編集前略称-013", "10")));
defineTagSeed("S-M03-14-CSRF-026", absent("026", "トークン改ざん更新", off("編集前略称-026", "10")));
defineTagSeed("S-M03-14-CSRF-027", absent("027", "トークン改ざん更新", off("編集前略称-027", "10")));

defineTagSeed("S-M03-14-INVALID-014", async (o) => {
  // 名称が空の行、または並び順が空の行があれば削除する
  for (;;) {
    const blank = (await o.tag.allRows()).find((r) => r.名称 === "" || r.並び順 === "");
    if (!blank) break;
    await o.removeId(blank.ID);
  }
  await o.fresh(label("014"), off("検証基準略称-014", "10"));
});

// ---- 2件以上を登録する形 ----

defineTagSeed("S-M03-14-DISPLAY", async (o) => {
  await o.fresh(label("共有A"), off("編集前略称-006", "10"));
  await o.fresh(label("共有B"), on("使用中略称-006", "20"));
  await o.fresh(label("共有C"), off("重複先略称-006", "30"));
});

defineTagSeed("S-M03-14-PAGING-009", async (o) => {
  const names = Array.from({ length: 11 }, (_, i) => `ページ略称${String(i + 1).padStart(2, "0")}-009`);
  for (const name of names) await o.removeNamed(name);
  const ids: string[] = [];
  for (const [i, name] of names.entries()) ids.push(await o.register(off(name, String(i + 1))));
  // 名称の番号順に、一覧の名称の行のID列で確かめる。シード表の呼び名は範囲（〔…009A〕〜〔…009K〕）で書かれているので、
  // 呼び名として控えるのは両端だけ（M03-01 の 035A〜035K と同じ扱い）
  for (const [i, name] of names.entries()) {
    const id = await o.tag.idOfName(name);
    if (id !== ids[i]) throw new Error(`${o.seedId}: 名称「${name}」のIDが登録のときと違う`);
  }
  o.notes.set(label("009A"), ids[0]);
  o.notes.set(label("009K"), ids[10]);
});

defineTagSeed("S-M03-14-DUPLICATE-017", async (o) => {
  await o.fresh(label("017"), off("重複先略称", "30"));
});

const duplicate = (n: string) => async (o: SeedOps) => {
  await o.removeNamed("重複先略称");
  await o.fresh(label(`${n}A`), off(`編集前略称-${n}`, "10"));
  await o.fresh(label(`${n}B`), off("重複先略称", "30"));
};
defineTagSeed("S-M03-14-DUPLICATE-018", duplicate("018"));
defineTagSeed("S-M03-14-DUPLICATE-019", duplicate("019"));

defineTagSeed("S-M03-14-RANK-020", async (o) => {
  await o.fresh(label("020A"), off("編集前略称-020", "10"));
  await o.fresh(label("020B"), off("重複先略称-020", "30"));
});

defineTagSeed("S-M03-14-REVORDER-046", async (o) => {
  for (const n of ["30", "20", "10"]) await o.removeNamed(`逆順${n}-M0314-046`);
  o.notes.set(label("046-A"), await o.register(off("逆順30-M0314-046", "30")));
  o.notes.set(label("046-B"), await o.register(off("逆順20-M0314-046", "20")));
  o.notes.set(label("046-C"), await o.register(off("逆順10-M0314-046", "10")));
});

// ---- 商品と紐づける形 ----

/** グッズ商品CSVの、M03-14 のシードが定めた列の値（ほかの列は M03-01 の共通の値。原価単価10・部門IDは空） */
const goodsValues = (略称タグID: string): Record<string, string> => ({
  "商品公開ステータス": "1", "支店の商品公開ステータス": "0", "サイズ": "0", "重量": "0",
  "基準価格": "100", "販売価格": "100", "買取価格": "0", "地域別販売制限": "0", "スマレジ連携フラグ": "0", "略称タグ(ID)": 略称タグID,
});

const used = (n: string) => async (o: SeedOps) => {
  const tagName = `使用中略称-${n}`;
  const productName = `略称タグ使用商品-M0314-${n}`;
  const code = `M0314USED${n}`;
  const products = await countGoodsByName(o.page, productName);
  await o.open();
  if ((await o.tag.rowsByName(tagName).count()) === 1 && products === 1) {
    // 前回の実行で紐づいたまま残っているときは、作り直さずにそれぞれのIDを控えて使う
    const tagId = await o.tag.idOfName(tagName);
    const productId = await readGoodsProductIdByName(o.page, productName, code);
    await openProductEdit(o.page, productId);
    if ((await selectedShortTagId(o.page)) !== tagId) {
      throw new Error(`${o.seedId}: 残っている商品「${productName}」が略称タグ「${tagName}」に紐づいていない。作り直してよいかの判断が要る`);
    }
    o.notes.set(label(n), tagId);
    o.notes.set(`〔商品ID-M0314-${n}〕`, productId);
    return;
  }
  if (products > 0) throw new Error(`${o.seedId}: 商品「${productName}」が ${products} 件残っていて、略称タグと紐づいた1件の形でない。作り直してよいかの判断が要る`);
  const tagId = await o.fresh(label(n), on(tagName, "20"));
  await registerGoodsCsv(o.page, {
    what: `${o.seedId} のグッズ商品CSV登録`, fileName: `${o.seedId}-goods.csv`, categoryId: "2",
    lines: [{ code, nameJp: productName, nameEn: `M0314 used product ${n}` }], common: goodsValues(tagId), onWarning: o.warn,
  });
  o.notes.set(`〔商品ID-M0314-${n}〕`, await readGoodsProductIdByName(o.page, productName, code));
};
defineTagSeed("S-M03-14-USED-032", used("032"));
defineTagSeed("S-M03-14-USED-033", used("033"));

/** 略称タグ未設定の商品。前回の実行で残っていれば、その商品IDを控えて使う */
async function optionCheckProduct(o: SeedOps, n: string): Promise<void> {
  const productName = `略称タグ選択肢確認商品-M0314-${n}`;
  const code = `M0314LPRD${n}`;
  const products = await countGoodsByName(o.page, productName);
  if (products > 1) throw new Error(`${o.seedId}: 商品「${productName}」が ${products} 件ある。どれを使うか決められない`);
  if (products === 0) {
    await registerGoodsCsv(o.page, {
      what: `${o.seedId} のグッズ商品CSV登録`, fileName: `${o.seedId}-goods.csv`, categoryId: "2",
      lines: [{ code, nameJp: productName, nameEn: `M0314 option check product ${n}` }], common: goodsValues(""), onWarning: o.warn,
    });
  }
  const productId = await readGoodsProductIdByName(o.page, productName, code);
  o.notes.set(`〔商品ID-M0314-${n}〕`, productId);
  if (products === 0) await saveWithDiscount(o.page, productId, o.warn);
  await openProductEdit(o.page, productId);
  if ((await selectedShortTagId(o.page)) !== "") throw new Error(`${o.seedId}: 商品「${productName}」に略称タグが設定されている（シード表は未設定）`);
}

defineTagSeed("S-M03-14-L-PRD-041", async (o) => {
  await optionCheckProduct(o, "041");
  await o.open();
  await o.removeNamed("L001M0314n041連携略称タグ");
});

defineTagSeed("S-M03-14-L-PRD-042", async (o) => {
  await optionCheckProduct(o, "042");
});

defineTagSeed("S-M03-14-L-TAG-042", async (o) => {
  await o.removeNamed("L002M0314n042削除略称タグ");
  await o.register(off("L002M0314n042削除略称タグ", "10"));
});

defineTagSeed("S-M03-14-L-043", async (o) => {
  await o.removeNamed("連携登録略称-L001M0314n043");
});
