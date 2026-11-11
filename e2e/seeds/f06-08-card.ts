/**
 * F06-08 入荷待ち商品一覧の画面シード（カード商品・まとめて入荷通知・複数商品を使うもの）。正本: cases/F06-08_seed_data.tsv
 * 定義（データ）は seeds/f06-08-defs.ts。会員の作り方・DBの参照でのプレイヤーID・通知IDの控えは seeds/f06-08.ts（既存）と同じ。
 *
 * 作り方（シード表の投入方法の順）:
 * 1. 会員: フロントの会員情報登録 → 管理画面の会員一覧で会員IDを控える（seeds/f06-member.ts の 本会員を作る）。
 * 2. カード（カード商品だけ）: カード新規登録画面で、このシード専用の名前（印つき）のカードを登録する。
 * 3. 商品: グッズ商品CSV登録（全行に共通の列は、シード表のとおり。商品コード・商品名は印つき）→ 商品マスターで商品IDを控える →
 *    カード商品は「カード指定」でカード詳細を決定し商品名を入れ直して登録 → 取り込みで作られた規格（状態NM）を公開で登録（状態別称があれば入れる）→
 *    追加の規格は商品規格一覧の「新規作成」で足す。
 * 4. 入荷通知: フロントに会員でログインし、商品詳細の規格の「入荷通知」・「まとめて入荷通知」を押す。通知IDは画面に出ないので、DBの参照で読んで控える。
 * 5. 高額商品コード: 高額商品コードのある規格には通知ボタンが出ないので、通知を登録したあとに商品規格登録編集画面で入れる。
 *
 * 正本の外で補ったこと・代えたこと（ケースの注記にも出る）:
 * - 入荷通知登録上限数（共有の設定）は書き換えない。S-F06-08-LIMIT がいまの値が20であることを読んで確かめる（seeds/f06-08.ts）。
 * - カード詳細の詳細情報のカードセットは、既に登録されている先頭のものを使い、共有のマスタには足さない。
 * - 商品カテゴリの「サプライ・グッズ」→「単体カード」の付け替えは行わない（ケースはカテゴリを見ない。F06-09 と同じ）。
 * - 007・008 は、シード表では19商品それぞれにカード詳細を指定するが、まとめて入荷通知を押す先頭の商品だけをカード商品にし、残りはグッズ商品にした
 *   （一覧の件数・上限の確かめに、カード指定は要らない）。006 も、まとめて入荷通知を押す20商品目だけをカード商品にした。005 は3商品目だけ。
 * - 013・015・016・020 の高額商品コードは実行の印を付けた値にし、013 の3つ目の規格は最初の登録のとき（通知の前）に足し、高額商品コードは3規格まとめて通知のあとに入れた。
 * - 商品画像（019・020）は商品登録編集画面の追加欄へ画像ファイルを渡す。この環境では追加欄が動かないことがあり、追加できなかったときは画像なしで登録した（注記に残る）。
 * - 「Foilあり」は、カード詳細の Foil の選択肢の「通常」を選んだ（F06-09 と同じ）。
 */
import { Browser } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { 商品単位の依頼ID, 規格の依頼ID } from "../db/f03_07";
import { getSeed } from "../lib/catalog";
import { available } from "../lib/db";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { 既存のカードセットのID, 規格の値を入れて公開する, 規格を足す } from "../pages/admin/f06_08_setup";
import { imageFile } from "../pages/admin/f03_06_products";
import { downloadGoodsCsvTemplate } from "../pages/admin/m03_01_goods_csv";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { classRowsFromProductEdit, openProductEditByCode, readGoodsRootCategoryId, readLanguageIds, registerCard } from "../pages/admin/m03_23_seed_products";
import { assignCardOnProductEdit } from "../pages/admin/product_card_assign";
import { 詳細画面 } from "../pages/front/f06_08_notifylist";
import { 会員 } from "./f06-08";
import { シード一覧, シードの定義 } from "./f06-08-defs";

type Issue = (m: string) => void;
type 作った商品 = { productId: string; classIds: string[]; cardId?: string; cardDetailId?: string };

/** 商品・カード・規格を管理画面で作り、商品ID・商品規格IDを返す */
async function 商品を作る(browser: Browser, seedId: string, d: シードの定義, issue: Issue): Promise<作った商品[]> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const made: 作った商品[] = d.商品.map(() => ({ productId: "", classIds: [] }));
    // カード（カード商品だけ）
    const withCard = d.商品.map((p, i) => [p, i] as const).filter(([p]) => p.カード);
    if (withCard.length) {
      const cardsetId = await 既存のカードセットのID(page);
      issue(`${seedId}: カード詳細のカードセットは、既に登録されている先頭のもの（ID ${cardsetId}）を使った（共有のマスタには足していない）`);
      for (const [p, i] of withCard) {
        const 名 = rc(`F0608-CARD-${p.商品ID}`);
        const c = await registerCard(page, {
          カード名日: 名, カード名英: 名, 点数で見たマナ: "1", コスト: "{1}", カードセットID: cardsetId, Foil: p.カード!.Foil,
        }, `${seedId}: ${p.code} のカード`, issue);
        made[i].cardId = c.カードID;
        made[i].cardDetailId = c.カード詳細ID;
      }
    }
    // グッズ商品CSV登録
    const categoryId = await readGoodsRootCategoryId(page);
    const template = await downloadGoodsCsvTemplate(page);
    const region = Object.fromEntries(template.headers.filter((h) => h.includes("地域")).map((h) => [h, "0"]));
    const en = d.商品.some((p) => p.取込言語 === "英語") ? (await readLanguageIds(page)).英語 : "";
    await registerGoodsCsv(page, {
      what: `${seedId} のグッズ商品CSV登録`, fileName: `${seedId.toLowerCase()}-${Date.now()}.csv`, categoryId,
      common: { ...region, "スマレジ連携フラグ": "0", "原価単価": "10" },
      lines: d.商品.map((p) => ({
        code: rc(p.code), nameJp: rc(p.code), nameEn: rc(p.code),
        values: {
          "基準価格": p.価格 ?? "100", "販売価格": p.価格 ?? "100", "買取価格": "10",
          ...(p.取込言語 === "英語" ? { "言語(ID)": en } : {}),
        },
      })),
      onWarning: (w) => issue(`${seedId}: グッズ商品CSV登録の警告「${w}」`),
      uploadWaitMs: 120_000,
    });
    // 商品ごとに: 商品ID・カード指定・取り込みの規格の公開・追加の規格
    for (const [i, p] of d.商品.entries()) {
      const code = rc(p.code);
      const what = `${seedId}: ${code}`;
      const productId = await openProductEditByCode(page, code);
      made[i].productId = productId;
      if (p.カード) {
        await assignCardOnProductEdit(page, {
          productId, cardNameJp: rc(`F0608-CARD-${p.商品ID}`), cardDetailId: made[i].cardDetailId!, productNameJp: code, productNameEn: code,
          ...(p.画像 ? { images: [imageFile(p.画像)] } : {}),
        }, (m) => issue(`${what}: ${m}`));
      }
      const rows = await classRowsFromProductEdit(page, productId);
      if (rows.length !== 1 || rows[0].商品コード !== code) throw new Error(`${what}: 取込直後の商品規格が1件でない: ${JSON.stringify(rows)}`);
      made[i].classIds.push(rows[0].商品規格ID);
      await 規格の値を入れて公開する(page, { productId, classId: rows[0].商品規格ID, ...(p.メモ !== undefined ? { 個別メモ: p.メモ } : {}) }, what, issue);
      for (const a of p.追加 ?? []) {
        made[i].classIds.push(await 規格を足す(page, productId, { 言語: a.言語, 状態: a.状態, 商品コード: code, 価格: a.価格 }, `${what} の規格（${a.言語}・${a.状態}・${a.価格}円）`, issue));
      }
    }
    return made;
  });
}

/** フロントに会員でログインし、定義の順に入荷通知を登録する */
async function 通知を登録する(browser: Browser, seedId: string, d: シードの定義, mail: string, made: 作った商品[], issue: Issue): Promise<void> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const front = new 詳細画面(await context.newPage());
    await front.login(mail, d.パスワード);
    for (const t of d.通知) {
      const p = d.商品[t.商品];
      const m = made[t.商品];
      if (t.まとめて) {
        await front.言語を指定して開く(m.productId, t.まとめて);
        if ((await front.bulkButton.count()) === 0) throw new Error(`${seedId}: ${p.code} の商品詳細に「まとめて入荷通知」のボタンが無い`);
        const r = await front.press(front.bulkButton);
        if (!r.通知が出た || !/設定/.test(r.通知の文)) throw new Error(`${seedId}: ${p.code} の「まとめて入荷通知」を押しても依頼の完了の通知が出ない（${JSON.stringify(r)}）`);
      } else {
        const k = t.規格 ?? 0;
        const 言語 = (k === 0 ? p.取込言語 : p.追加![k - 1].言語) === "英語" ? "EN" : "JP";
        await front.言語を指定して開く(m.productId, 言語);
        const r = await front.press(front.classButton(m.classIds[k]));
        if (!r.通知が出た || !/設定/.test(r.通知の文)) throw new Error(`${seedId}: ${p.code} の規格 ${m.classIds[k]} の「入荷通知」を押しても依頼の完了の通知が出ない（${JSON.stringify(r)}）`);
      }
    }
    issue(`${seedId}: 会員 ${mail} が入荷通知を ${d.通知.length} 件登録した（詳細画面のボタンを押した）`);
  } finally { await context.close(); }
}

function 控える(seedId: string, notes: Notes, values: Map<string, string>): void {
  const seed = getSeed(seedId);
  const promised = Notes.labelsIn(seed["状態・属性"] + seed.投入方法).filter((l) => !l.includes("…"));
  for (const l of promised) {
    if (notes.has(l)) continue;
    const m = /^〔(.+?)-F0608-(.+)〕$/.exec(l);
    const v = m ? values.get(`${m[1]}|${m[2]}`) : undefined;
    if (v === undefined) throw new Error(`${seedId}: 呼び名 ${l} の控え方が定義に無い`);
    notes.set(l, v);
  }
}

for (const [seedId, d] of Object.entries(シード一覧)) {
  defineSeed(seedId, async ({ browser, notes }) => {
    const issue: Issue = (m) => reportSeedIssue(seedId, m);
    const m = await 会員(browser, notes, d.n, d.前半, d.名, d.パスワード);
    const made = await 商品を作る(browser, seedId, d, issue);
    await 通知を登録する(browser, seedId, d, m.mail, made, issue);
    if (d.高額?.length) {
      await withAdminSession(browser, SETUP_ADMIN, async (page) => {
        page.setDefaultTimeout(60_000);
        for (const h of d.高額!) {
          const k = made[h.商品];
          await 規格の値を入れて公開する(page, { productId: k.productId, classId: k.classIds[h.規格], 高額商品コード: rc(h.コード) }, `${seedId}: ${d.商品[h.商品].code} の規格（${h.コード}）`, issue);
        }
      });
      issue(`${seedId}: 高額商品コードは通知を登録したあとに入れた（高額商品コードのある規格には通知ボタンが出ないため）`);
    }
    // 呼び名の値
    const v = new Map<string, string>();
    d.商品.forEach((p, i) => {
      v.set(`商品ID|${p.商品ID}`, made[i].productId);
      v.set(`商品規格ID|${p.規格}`, made[i].classIds[0]);
      (p.追加 ?? []).forEach((a, k) => v.set(`商品規格ID|${a.規格}`, made[i].classIds[k + 1]));
      if (p.カード) {
        v.set(`カード情報ID|${p.カード.カード情報ID}`, made[i].cardDetailId!);
        if (p.カード.カードID) v.set(`カードID|${p.カード.カードID}`, made[i].cardId!);
      }
    });
    for (const t of d.通知) {
      const k = made[t.商品];
      const id = !available ? "（DB確認なし）" : t.まとめて ? 商品単位の依頼ID(m.id, k.productId) : 規格の依頼ID(m.id, k.classIds[t.規格 ?? 0]);
      if (!id) throw new Error(`${seedId}: 通知を画面で登録したのに、DBの参照で通知 ${t.通知} が見つからない`);
      v.set(`通知ID|${t.通知}`, id);
    }
    控える(seedId, notes, v);
    issue("カードの登録・商品画像の追加・通知の登録は画面で行い、通知ID・プレイヤーIDだけ画面に出ないのでDBの参照で読んで控えた（書き込みなし）");
  });
}
