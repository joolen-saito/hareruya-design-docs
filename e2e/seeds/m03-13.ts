/**
 * M03-13 タグ登録/編集の画面シード。正本: cases/M03-13_seed_data.tsv
 *
 * 正本の作り方の多くは同じ形をしている。タグ登録/編集画面を編集対象を指定せずに開き、名称(日)・名称(英)・並び順を入れ、
 * 「その他の設定」の各項目は空のまま登録ボタンを押し、登録後に開いたそのタグの編集画面のアドレスの末尾からタグIDを控える。
 * タグを削除する画面は無いので、同じ名称のタグは実行のたびに増える（ケースはタグIDで引くので、名称が重なっても取り違えない）。
 *
 * 作らないシード（DBでの準備・外部の検索サービス・画像が要る。使うケースも実装しない）:
 * - 既存のタグをDBで退避して一覧を記載のタグだけにする形（LIST-002・BASE-005・BASE-006・LIST-034・PAGING-035・PAGING-036・FREEJp-045・FREEEn-046・ORDER-047）
 * - 規格の削除済みの状態・規格の削除をDBで行う形（PRIORITY-CODES）と、それを使う優先表示の形（PRIORITY-020〜028・042・051・053・055）
 * - タグ全体をDBで入れ替える形（MAXID-030・EMPTY-031）、検索サービスへの反映が要る形（PUBLIC-032・033、QD-）
 *
 * 「名称…のタグが0件」の形（REGISTER-018・019・029、L-TAG-044）は、正本の作り方が「DBでのクリーンアップで削除して0件を確かめる」。
 * DBを書き換えないので、一覧で0件であることを確かめるだけにし、残っていればそこで止める（削除しない）。
 * これは、確かめるだけにしてよいと依頼者が認めた形（設定が既定値であることの確認）の外にある。依頼者の承認（記録の裁定案B）を待つ間は、
 * このシードを使ったケースの結果に、その旨を「シード作成時の問題」として毎回出す。承認されなければ、使うケースを実装しない側へ移す。
 */
import { expect, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { Notes } from "../lib/notes";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { downloadGoodsCsvTemplate } from "../pages/admin/m03_01_goods_csv";
import { readGoodsProductId } from "../pages/admin/m03_01_goods_list_seed";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { ensureMember } from "../pages/admin/member";
import { expectSaved } from "../pages/admin/common";
import {
  assignedTagNames, findProductsByCode, findProductsByName, openProductFromResult, selectedDiscount,
  販売制限数を規格一覧で読む, saveChoosingDiscount, 公開状態の値,
} from "../pages/admin/m03_13_product";
import { TagInput, TagPage } from "../pages/admin/m03_13_tag";
import { openProductEdit } from "../pages/admin/product_edit";

export const M0313_ADMIN: Account = { loginId: "m0313_admin", password: "Passw0rd!M0313" };
export const M0313L_ADMIN: Account = { loginId: "m0313l_admin", password: "Passw0rd!M0313L" };

/** 一覧の全件を1ページに出す表示件数（画面の件数欄の最大） */
const ALL = "12000";

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

/** ログインでき（ロックされていない）、タグ登録/編集画面を開けることを、ケースとは別のセッションで確かめる */
async function expectCanOpen(page: Page, who: string): Promise<void> {
  const tag = new TagPage(page);
  await tag.openNew();
  await expect(tag.登録ボタン, `${who}でタグ登録/編集画面を開けない`).toBeVisible();
}

defineSeed("S-M03-13-ADM", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, (page) => createAdmin(page, "M03-13試験管理者", M0313_ADMIN, "m0313_admin@example.test"));
  await withAdminSession(browser, M0313_ADMIN, (page) => expectCanOpen(page, "M03-13試験管理者"));
});

defineSeed("S-M03-13-L-ADM", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, (page) => createAdmin(page, "M03-13連携試験管理者", M0313L_ADMIN, "m0313l_admin@example.test"));
  await withAdminSession(browser, M0313L_ADMIN, (page) => expectCanOpen(page, "M03-13連携試験管理者"));
});

/** シードを作る管理者のセッションで、正本の作り方の操作をする */
class SeedOps {
  readonly tag: TagPage;

  constructor(readonly page: Page, readonly seedId: string, readonly notes: Notes) {
    this.tag = new TagPage(page);
  }

  readonly warn = (w: string) => reportSeedIssue(this.seedId, w);

  /** 編集対象を指定せずに開き、名称(日)・名称(英)・並び順を入れ、「その他の設定」は空のまま登録する。登録後の編集画面のアドレスの末尾のタグIDを返す */
  async registerNew(v: TagInput): Promise<string> {
    await this.tag.openNew();
    return this.tag.register(v, `${this.seedId}: 名称(日)「${v.名称日}」のタグの登録`);
  }

  /** 登録して、タグIDを控える */
  async fresh(label: string, v: TagInput): Promise<string> {
    const id = await this.registerNew(v);
    this.notes.set(label, id);
    return id;
  }

  /**
   * 名称(日)・名称(英)のどちらかが一致するタグが、一覧に1件も無いことを確かめる（一覧の全件を1ページに出して見る）。
   * あればここで止める。タグを削除する画面は無く、正本の作り方はDBでの削除なので、DBを書き換えずに判断を返す。
   */
  async expectAbsent(名称日: string, 名称英: string): Promise<void> {
    await this.tag.showFirstPageWith(ALL);
    const rows = await this.tag.allRows();
    if (rows.length >= Number(ALL)) throw new Error(`${this.seedId}: タグが${ALL}件以上あり、一覧の1ページで全件を見られない`);
    const hit = rows.filter((r) => r.名称日 === 名称日 || r.名称英 === 名称英);
    if (hit.length) {
      throw new Error(`${this.seedId}: 名称(日)「${名称日}」または名称(英)「${名称英}」のタグが${hit.length}件ある（タグID ${hit.map((r) => r.ID).join("、")}）。`
        + "タグを削除する画面が無く、正本の作り方はDBでの削除なので、ここで止める（DBを書き換えない）。流し直すかどうかの判断が要る");
    }
  }

  /** 一覧の全件を1ページに出して、タグIDの行の編集ボタンを押し、「その他の設定」を開いて優先表示商品を入れて登録する */
  async setPriority(タグID: string, 優先表示商品: string): Promise<void> {
    await this.tag.showFirstPageWith(ALL);
    await this.tag.pressEdit(タグID);
    await this.tag.openOtherSettings();
    await this.tag.fill({ 優先表示商品 });
    const r = await this.tag.pressRegister();
    if (!r.sent) throw new Error(`${this.seedId}: 優先表示商品の登録が、ブラウザの入力チェックで止まった（${r.止めた項目.join(" / ")}）`);
    for (const w of await expectSaved(this.page, `${this.seedId}: タグID ${タグID} の優先表示商品「${優先表示商品}」の登録`)) this.warn(w);
  }
}

function defineTagSeed(seedId: string, build: (o: SeedOps) => Promise<void>, needs: string[] = []): void {
  defineSeed(seedId, { needs }, async ({ browser, notes, seed }) => {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      await build(new SeedOps(page, seed.シードID, notes));
    });
  });
}

const label = (suffix: string) => `〔タグID-M0313-${suffix}〕`;

// ---- 編集前の値のタグを1件登録する形 ----

const 編集前: TagInput = { 名称日: "編集前タグ", 名称英: "BeforeTag", 並び順: "10" };
const one = (n: string, v: TagInput) => async (o: SeedOps) => { await o.fresh(label(n), v); };
defineTagSeed("S-M03-13-BASE-007", one("007", 編集前));
defineTagSeed("S-M03-13-BASE-008", one("008", 編集前));
defineTagSeed("S-M03-13-BASE-009", one("009", 編集前));
defineTagSeed("S-M03-13-BASE-010", one("010", 編集前));
defineTagSeed("S-M03-13-BASE-011", one("011", 編集前));
defineTagSeed("S-M03-13-BASE-012", one("012", 編集前));
defineTagSeed("S-M03-13-BASE-013", one("013", 編集前));
defineTagSeed("S-M03-13-BASE-014", one("014", 編集前));
defineTagSeed("S-M03-13-BASE-015", one("015", 編集前));
defineTagSeed("S-M03-13-BASE-016", one("016", 編集前));
defineTagSeed("S-M03-13-BASE-017", one("017", 編集前));
defineTagSeed("S-M03-13-BASE-037", one("037", 編集前));
defineTagSeed("S-M03-13-BASE-038", one("038", 編集前));

defineTagSeed("S-M03-13-REGISTER-054", one("054", { 名称日: "更新後遷移前タグ-M0313-054", 名称英: "UpdateMove-M0313-054", 並び順: "30" }));

// ---- 手順で登録する名称のタグが0件の状態（確かめるだけ） ----

const absent = (名称日: string, 名称英: string) => async (o: SeedOps) => {
  await o.expectAbsent(名称日, 名称英);
  o.warn("正本の作り方はDBでの削除。DBを書き換えず、一覧で0件を確かめるだけにした（確かめるだけにしてよい形の外。記録の裁定案B の承認待ち）。"
    + "このシードを使ったケースは、承認が得られるまで条件付きの結果として扱う");
};
defineTagSeed("S-M03-13-REGISTER-018", absent("任意空タグ", "OptionalEmptyTag"));
defineTagSeed("S-M03-13-REGISTER-019", absent("優先空タグ", "NoPriorityTag"));
defineTagSeed("S-M03-13-REGISTER-029", absent("遷移確認タグ", "TransitionTag"));
defineTagSeed("S-M03-13-L-TAG-044", absent("LinkTagL001", "LinkTagL001"));

// ---- 商品と紐づける形 ----

defineTagSeed("S-M03-13-PRIORITY-052", async (o) => {
  const code = "OLD-M0313-052";
  const productName = "優先表示解除確認商品-M0313-052";
  // 商品コードは正本が決めた固定の値で、清掃の手順が正本に無い。前の実行の商品が残っていたら作り直さずに止める
  const left = await findProductsByCode(o.page, code, ["公開", "非公開"]);
  if (left.length) {
    throw new Error(`${o.seedId}: 商品コード ${code} の商品が残っている（商品ID ${left.map((p) => p.商品ID).join("、")}）。`
      + "清掃の手順が正本に無い固定の値なので、作り直さずに止める。流し直すかどうかの判断が要る");
  }
  // ① タグを登録し、登録後の編集画面のアドレスの末尾のタグIDを控える
  const tagId = await o.fresh(label("052"), { 名称日: "優先表示解除前タグ-M0313-052", 名称英: "PriorityClear-M0313-052", 並び順: "20" });
  // ② グッズ商品CSVで、タグ(ID)に①のタグIDを入れた商品を1件登録する（商品公開ステータスは任意の値として公開にした）
  await registerGoodsCsv(o.page, {
    what: `${o.seedId} のグッズ商品CSV登録`, fileName: `${o.seedId}-goods.csv`, categoryId: "2",
    lines: [{ code, nameJp: productName, nameEn: "M0313 priority clear product 052" }],
    common: { "タグ(ID)": tagId }, onWarning: o.warn,
  });
  // 商品マスターでコードを入れて検索し（公開状態の条件はCSVに入れた公開に合わせる。初期の条件が公開）、商品ID列の値を控える
  o.notes.set("〔商品ID-M0313-052〕", await readGoodsProductId(o.page, code, productName));
  // ③ 一覧の編集ボタンで開き、「その他の設定」の優先表示商品に規格コードを入れて登録する
  await o.setPriority(tagId, code);
});

defineTagSeed("S-M03-13-L-PRODUCT", async (o) => {
  const name = "連携タグ確認商品";
  const code = "M0313LINK001";
  const all = await findProductsByName(o.page, name, ["公開", "非公開"]);
  if (all.length > 1) throw new Error(`${o.seedId}: 商品名「${name}」の商品が${all.length}件ある。どれを使うか決められない`);
  const made = all.length === 0;
  if (made) {
    // 商品コードは正本の「ほかの規格と重複しない任意のコード」。使われていないことを確かめる
    const used = await findProductsByCode(o.page, code, ["公開", "非公開"]);
    if (used.length) throw new Error(`${o.seedId}: 商品コード ${code} がほかの商品（商品ID ${used.map((p) => p.商品ID).join("、")}）で使われている`);
    const template = await downloadGoodsCsvTemplate(o.page);
    const hidden = 公開状態の値(template, "商品公開ステータス", "非公開");
    // ① グッズ商品CSV登録（商品付加情報も併せて登録される）
    await registerGoodsCsv(o.page, {
      what: `${o.seedId} のグッズ商品CSV登録`, fileName: `${o.seedId}-goods.csv`, categoryId: "2",
      lines: [{ code, nameJp: name, nameEn: "LinkTagProduct" }],
      common: { "商品公開ステータス": hidden, "サイズ": "10", "重量": "20", "販売制限数": "5", "タグ(ID)": "" },
      onWarning: o.warn,
    });
  }
  // ② 商品マスターで商品名を入れ、公開状態を非公開にして検索し、商品ID列の値を控える
  const found = await findProductsByName(o.page, name, ["非公開"]);
  if (found.length !== 1) throw new Error(`${o.seedId}: 公開状態を非公開にして商品名「${name}」で検索した結果が${found.length}件（1件のはず）`);
  if (found[0].商品コード !== code) throw new Error(`${o.seedId}: 商品名「${name}」の商品の商品コードが ${found[0].商品コード}（このシードが作るのは ${code}）。作り方の違う商品は使わない`);
  const productId = found[0].商品ID;
  o.notes.set("〔商品ID-M0313-連携共有〕", productId);
  // ③ 検索結果の商品名のリンクから商品登録編集画面を開き、販売制限が5であることを確かめ、割引率を選んでタグは選ばずに「商品を登録」を押す。
  // 商品登録編集画面の「販売制限」は地域の選択（制限なし・日本国内のみ・海外のみ）で、5の値は無い。
  // CSVの「販売制限数」（5）は規格一覧の「販売制限数」の列に出るので、そこで確かめる（解釈）。
  await openProductFromResult(o.page, productId);
  const limit = await 販売制限数を規格一覧で読む(o.page, productId, code);
  if (limit !== "5") throw new Error(`${o.seedId}: 規格一覧の販売制限数が「${limit}」（シード表は5）`);
  if (made) {
    await saveChoosingDiscount(o.page, productId, o.warn);
    return;
  }
  // 前の実行で作った商品を使うときは、タグの紐付けが無く、割引率が選ばれていることを画面で確かめる
  await openProductEdit(o.page, productId);
  const tags = await assignedTagNames(o.page);
  if (tags.length) throw new Error(`${o.seedId}: 残っている商品「${name}」にタグが付いている（${tags.join("、")}）。シード表はタグの紐付け0件`);
  if (!(await selectedDiscount(o.page))) {
    // 前の実行が③の保存で止まった商品（割引率が未選択）は、③をやり直す（2026-10-17、販売制限が未選択で保存できずに止まった）
    o.warn(`残っている商品「${name}」（商品ID ${productId}）の割引率が選ばれていないので、③の保存をやり直す`);
    await saveChoosingDiscount(o.page, productId, o.warn);
  }
});
