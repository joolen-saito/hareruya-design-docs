/**
 * M03-22 購入グループ管理の画面シード。正本: cases/M03-22_seed_data.tsv
 *
 * 正本の作り方はほとんどが同じ形をしている。
 * 購入グループ管理画面を新規登録の状態で開き、名称（日）・名称（英）・予約商品フラグ・メモを入れ、支払方法・配送方法は選ばずに登録し、
 * 登録後に開いた編集の状態の画面のアドレス末尾の購入グループIDを控える。正本はほかの行の片付けを書いていないので、消さずに登録する
 * （同じ名称の行が増えていくが、ケースは控えた購入グループIDで行を探す）。
 *
 * 作らないシード（実装しないケースだけが使う）:
 * - DBでの準備が要る: S-M03-22-METHODS（支払方法・配送方法を固定のIDで登録）、作成日時・更新日時・削除日時をDBへ直接設定する
 *   INIT-001・BASE-002・BASE-003・CHOICE-004・CHOICE-005・LIST-006・BASE-008〜013・BASE-016・BASE-017・DELETED-019、
 *   行をDBで削除する NEW-014・NOTFOUND-018、S-M03-22-QD-GOODSMASTER（カテゴリ・部門を固定のIDで登録）
 * - 外部サービス（検索サービスの試験環境への反映）が要る: FRONT-030・QD-RESERVE-033・DP-MIX-034・QD-ADM
 * - 実装しないケースだけが使う: LIST-007（ケース 007 は METHODS を使う）・NEW-015（ケース 015 は METHODS を使う）
 */
import { expect, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { Notes } from "../lib/notes";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { readGoodsProductId, readGoodsProductIdByName } from "../pages/admin/m03_01_goods_list_seed";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { productIdsByCode } from "../pages/admin/m03_17_product";
import { ensureMember } from "../pages/admin/member";
import { openProductEdit } from "../pages/admin/product_edit";
import { goodsCsvCategoryId, saveFromSearchResult, selectedPurchaseGroup } from "../pages/admin/m03_22_product";
import { PurchaseGroupInput, PurchaseGroupPage } from "../pages/admin/m03_22_purchase_group";

export const M0322_ADMIN: Account = { loginId: "m0322_admin", password: "Passw0rd!M0322" };
export const M0322L_ADMIN: Account = { loginId: "m0322l-admin", password: "Passw0rd!M0322L" };

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

/** ログインでき（ロックされていない）、購入グループ管理画面を開けることを、ケースとは別のセッションで確かめる */
async function expectCanOpen(page: Page, who: string): Promise<void> {
  const grp = new PurchaseGroupPage(page);
  await grp.openNew();
  await expect(grp.登録ボタン, `${who}で購入グループ管理画面を開けない`).toBeVisible();
}

defineSeed("S-M03-22-ADM", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, (page) => createAdmin(page, "M03-22試験管理者", M0322_ADMIN, "m0322_admin@example.test"));
  await withAdminSession(browser, M0322_ADMIN, (page) => expectCanOpen(page, "M03-22試験管理者"));
});

defineSeed("S-M03-22-L-ADM", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, (page) => createAdmin(page, "M03-22連携試験管理者", M0322L_ADMIN, "m0322l-admin@example.test"));
  await withAdminSession(browser, M0322L_ADMIN, (page) => expectCanOpen(page, "M03-22連携試験管理者"));
});

/** シードを作る管理者のセッションで、正本の作り方の操作をする */
class SeedOps {
  readonly grp: PurchaseGroupPage;

  constructor(readonly page: Page, readonly seedId: string, readonly notes: Notes) {
    this.grp = new PurchaseGroupPage(page);
  }

  readonly warn = (w: string) => reportSeedIssue(this.seedId, w);

  /** 新規登録の状態で登録し、登録後の編集の状態の画面のアドレス末尾の購入グループIDを返す */
  async register(v: PurchaseGroupInput): Promise<string> {
    return this.grp.register(v, `${this.seedId}: 購入グループ「${v.名称日}」の登録`);
  }

  /** 登録して、購入グループIDを控える */
  async registerAndNote(label: string, v: PurchaseGroupInput): Promise<string> {
    const id = await this.register(v);
    this.notes.set(label, id);
    return id;
  }

  /** 一覧に名称（日）の行が残っていないこと。正本に片付けの手順が無いので、残っていれば消さずに止める（判断を返す） */
  async expectNoRowNamed(名称日: string, why: string): Promise<void> {
    await this.grp.openNew();
    const left = await this.grp.idsOfName(名称日);
    if (left.length) {
      throw new Error(`${this.seedId}: 名称（日）「${名称日}」の購入グループ（購入グループID ${left.join("、")}）が前の実行から残っている。${why}`);
    }
  }
}

function defineGroupSeed(seedId: string, build: (o: SeedOps) => Promise<void>): void {
  defineSeed(seedId, async ({ browser, notes, seed }) => {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      await build(new SeedOps(page, seed.シードID, notes));
    });
  });
}

const group = (名称日: string, 名称英: string, 予約商品フラグ = false, メモ = ""): PurchaseGroupInput => ({ 名称日, 名称英, 予約商品フラグ, メモ });
const label = (suffix: string) => `〔購入グループID-M0322-${suffix}〕`;

// ---- 1件だけ登録する形（どの商品にも設定しない） ----

const one = (n: string, v: PurchaseGroupInput) => async (o: SeedOps) => { await o.registerAndNote(label(n), v); };
defineGroupSeed("S-M03-22-RACE-020", one("020", group("競合確認購入グループ-020", "RaceGroup-020")));
defineGroupSeed("S-M03-22-RACE-021", one("021", group("競合確認購入グループ-021", "RaceGroup-021")));
defineGroupSeed("S-M03-22-BASE-022", one("022", group("編集前購入グループ-022", "BeforeGroup-022", true, "編集前メモ")));
defineGroupSeed("S-M03-22-DELETE-023", one("023", group("未使用購入グループ-023", "UnusedGroup-023")));
defineGroupSeed("S-M03-22-DELETE-024", one("024", group("未使用購入グループ-024", "UnusedGroup-024")));
defineGroupSeed("S-M03-22-DELETE-025", one("025", group("未使用購入グループ-025", "UnusedGroup-025")));
defineGroupSeed("S-M03-22-DELETE-026", one("026", group("未使用購入グループ-026", "UnusedGroup-026")));
defineGroupSeed("S-M03-22-RACE-029", one("029", group("競合確認購入グループ-029", "RaceGroup-029")));

// ---- 商品に使用させる形 ----

/**
 * 商品が使う購入グループの名称を、グッズ商品CSVの購入グループ名称の列に入れる。商品カテゴリ(ID)は「サプライ・グッズ」のカテゴリID
 * （シードの最初に goodsCsvCategoryId で読み、グッズ商品CSVが受け付けるIDであることを確かめたもの）
 */
async function registerGoodsWithGroup(o: SeedOps, categoryId: string, line: { code: string; nameJp: string; nameEn: string }, 購入グループ名: string): Promise<void> {
  await registerGoodsCsv(o.page, {
    what: `${o.seedId} のグッズ商品CSV登録`, fileName: `${o.seedId}-goods.csv`, categoryId,
    lines: [line], common: { "購入グループ名称": 購入グループ名 }, onWarning: o.warn,
  });
  // 正本の作り方は「CSVファイルをアップロード」ボタンを押すだけ（アップロード後の確認モーダルは書いていない）。
  // いまの画面はアップロード後に確認モーダルを出さず、そのまま取り込む（M03-01 の uploadGoodsCsv と同じ。記録に注記した）
}

/** 商品の購入グループ欄が、控えた購入グループIDの購入グループであること（グッズ商品CSVは購入グループを名称で引くので、名称の重複で別の行に付かないことを画面で確かめる） */
async function expectProductUsesGroup(o: SeedOps, 商品ID: string, 購入グループID: string, 名称: string): Promise<void> {
  await openProductEdit(o.page, 商品ID);
  const got = await selectedPurchaseGroup(o.page);
  if (got.購入グループID !== 購入グループID || got.名称 !== 名称) {
    throw new Error(`${o.seedId}: 商品ID ${商品ID} の購入グループ欄が ${got.購入グループID}「${got.名称}」（${購入グループID}「${名称}」のはず）`);
  }
}

const used = (n: string) => async (o: SeedOps) => {
  const groupName = `使用中購入グループ-${n}`;
  const code = `USED-GROUP-001-${n}`;
  const productName = `使用確認商品-${n}`;
  // 何かを作る前に、グッズ商品CSVが「サプライ・グッズ」のカテゴリIDを受け付けるかを画面で確かめる（受け付けなければ止める）
  const categoryId = await goodsCsvCategoryId(o.page, o.warn);
  // 商品コードは正本が決めた固定の値で、清掃の手順が正本に無い。前の実行の商品が残っていれば、作り直さずに止める（判断を返す）
  const left = await productIdsByCode(o.page, code);
  if (left.length) {
    throw new Error(`${o.seedId}: 商品コード ${code} の商品（商品ID ${left.join("、")}）が前の実行から残っている。正本に清掃の手順が無いので、作り直してよいかの判断が要る`);
  }
  // グッズ商品CSVは購入グループを名称で引く。同じ名称の購入グループが残っていると、どれに付くか決まらないので止める
  await o.expectNoRowNamed(groupName, "グッズ商品CSVが購入グループを名称で引くので、どの行に付くか決まらない。消してよいかの判断が要る");
  const groupId = await o.registerAndNote(label(n), group(groupName, `UsedGroup-${n}`));
  await registerGoodsWithGroup(o, categoryId, { code, nameJp: productName, nameEn: `M0322 used group product ${n}` }, groupName);
  // 正本: 商品マスターを商品名で検索し、検索結果の行に表示された商品IDを控える
  const productId = await readGoodsProductIdByName(o.page, productName, code);
  o.notes.set(`〔商品ID-M0322-${n}〕`, productId);
  await expectProductUsesGroup(o, productId, groupId, groupName);
};
defineGroupSeed("S-M03-22-USED-027", used("027"));
defineGroupSeed("S-M03-22-USED-028", used("028"));

// ---- 連携（商品登録編集画面の購入グループ欄の選択肢） ----

/** 実行ごとに変わる文字（年月日時分秒）。正本の「他の商品と重ならない値」「有効な値」に付ける */
function runStamp(): string {
  const d = new Date();
  const p = (v: number) => String(v).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

/**
 * 基準の購入グループを使う商品をグッズ商品CSVで作り、商品コードで検索して商品IDを控え、
 * 検索結果の商品名から商品登録編集画面を開いて、割引率と販売制限を選んで「商品を登録」する。
 */
async function optionCheckProduct(o: SeedOps, categoryId: string, n: string, 基準購入グループ名: string): Promise<void> {
  const stamp = runStamp();
  const code = `M0322L${n}-${stamp}`;
  const productName = `購入グループ選択肢確認商品-M0322-${n}-${stamp}`;
  // 商品コードは「他の商品と重ならない値」。使われていないことを確かめる
  const usedBy = await productIdsByCode(o.page, code);
  if (usedBy.length) throw new Error(`${o.seedId}: 商品コード ${code} がほかの商品（商品ID ${usedBy.join("、")}）で使われている`);
  await registerGoodsWithGroup(o, categoryId, { code, nameJp: productName, nameEn: `M0322 purchase group option product ${n} ${stamp}` }, 基準購入グループ名);
  // 正本: 商品マスターを入れた商品コードで検索し、検索結果の行に表示された商品IDを控える
  const productId = await readGoodsProductId(o.page, code, productName);
  o.notes.set(`〔商品ID-M0322-${n}〕`, productId);
  await saveFromSearchResult(o.page, productId, 基準購入グループ名, o.warn);
}

defineGroupSeed("S-M03-22-L-PRD-031", async (o) => {
  const base = "L001M0322n031基準購入グループ";
  const linked = "L001M0322n031連携購入グループ";
  // 何かを作る前に、グッズ商品CSVが「サプライ・グッズ」のカテゴリIDを受け付けるかを画面で確かめる（受け付けなければ止める）
  const categoryId = await goodsCsvCategoryId(o.page, o.warn);
  await o.register(group(base, base));
  await optionCheckProduct(o, categoryId, "031", base);
  // 名称（日）または名称（英）が連携購入グループの行があれば、削除ボタンと削除確認モーダルの削除ボタンで削除する
  await o.grp.openNew();
  for (;;) {
    const row = o.grp.rowsByName(linked).or(o.grp.rowsByEnglishName(linked));
    if ((await row.count()) === 0) break;
    await o.grp.deleteRow(row.first(), `${o.seedId}: 残っていた「${linked}」の購入グループの削除`);
  }
});

defineGroupSeed("S-M03-22-L-DEL-032", async (o) => {
  const base = "L002M0322n032基準購入グループ";
  const target = "L002M0322n032削除購入グループ";
  // 何かを作る前に、グッズ商品CSVが「サプライ・グッズ」のカテゴリIDを受け付けるかを画面で確かめる（受け付けなければ止める）
  const categoryId = await goodsCsvCategoryId(o.page, o.warn);
  // 状態は「削除購入グループが1件存在し」。正本に片付けの手順が無いので、前の実行の行が残っていれば消さずに止める
  await o.expectNoRowNamed(target, "シード表の状態は1件だけ。正本に片付けの手順が無いので、消してよいかの判断が要る");
  await o.register(group(base, base));
  await o.registerAndNote(label("032"), group(target, target));
  await optionCheckProduct(o, categoryId, "032", base);
});
