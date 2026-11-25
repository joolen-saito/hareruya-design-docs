/**
 * M08-09 配送先一覧表示/編集の「公開側（ブラウザA）と管理画面（ブラウザB）のつながり」のシード。正本: cases/M08-09_seed_data.tsv
 * 作ったシード: QH-ADM・QH-MEMBER-037・QH-MEMBER-039（商品をカートに入れる 038・040 のシードは作っていない）。
 *
 * 作り方: 会員はフロントの新規会員登録で作って本会員にし（seeds/f06-member.ts の 本会員を作る）、管理画面の会員検索で会員IDを控える。
 * 追加の配送先は、管理画面の会員のお届け先登録画面（DeliveryEditPage）で登録し、登録後のアドレスの配送先IDを控える。
 *
 * シードでの解釈（正本の外の補い）:
 * - 会員のメールアドレスの前半に実行の印を付けた（正本は qh0809-001 など）。
 * - 追加の配送先は、正本ではフロントのマイページから登録するが、会社名を入れる欄がフロントの部品に無いので、管理画面のお届け先登録画面で同じ値を入れて登録した。
 * - 会員の登録時の項目のうち、MTG Campaign 登録名・性別・会社名・職業は入れていない（フロントの会員登録の部品が持たない項目。配送先の表示には関わらない）。
 * - 管理者の権限は、会員管理を操作できる「システム管理者」にした。
 */
import { Browser } from "@playwright/test";
import { Account } from "../lib/session";
import { Notes } from "../lib/notes";
import { DeliveryEditPage } from "../pages/admin/m08_09_delivery";
import { ensureM08Admin } from "../pages/admin/m08_common";
import { expectSaved } from "../pages/admin/common";
import { SETUP_ADMIN } from "../config/env";
import { withAdminSession } from "../lib/session";
import { defineSeed, reportCurrentSeedIssue } from "./current_seed";
import { 本会員を作る } from "./f06-member";

export const M0809_QH_ADMIN: Account = { loginId: "m0809qh_admin", password: "Passw0rd-M0809QH" };

defineSeed("S-M08-09-QH-ADM", async ({ browser }) => {
  await ensureM08Admin(browser, "M08-09QH試験管理者", M0809_QH_ADMIN);
  reportCurrentSeedIssue("権限は、会員管理を操作できる「システム管理者」にした（シード表は「会員管理の操作権限」とだけ書く）");
});

type 追加配送先 = { 名称: string; 姓: string; 名: string; 住所1: string; 住所2: string; 会社名: string };
export const QH会員のパスワード = (n: string): string => `Passw0rd-QH0809-${n}`;

async function 会員と追加の配送先(browser: Browser, notes: Notes, seed: { 状態・属性: string; 投入方法: string }, n: string, 配送先: 追加配送先): Promise<void> {
  const 会員ID = await 本会員を作る(browser, { 姓: `配送姓${n}`, 名: `配送名${n}`, セイ: "ハイソウセイ", メイ: "ハイソウメイ", 前半: `qh0809-${n}`, パスワード: QH会員のパスワード(n) });
  const 呼び名 = `QH${n}`;
  let 配送先ID = "";
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const edit = new DeliveryEditPage(page);
    await edit.openNew(会員ID);
    await edit.fill({
      配送先名称: 配送先.名称, 国: "Japan", 姓: 配送先.姓, 名: 配送先.名, セイ: "キュウセイ", メイ: "キュウメイ", 電話: ["03", "1111", "0001"],
      郵便番号: ["150", "0001"], 都道府県: "東京都", 住所1: 配送先.住所1, 住所2: 配送先.住所2, 会社名: 配送先.会社名,
    });
    await edit.pressRegister();
    await expectSaved(page, `S-M08-09-QH-MEMBER: 配送先「${配送先.名称}」の登録`);
    配送先ID = edit.配送先ID();
  });
  for (const l of Notes.labelsIn(seed["状態・属性"] + seed.投入方法)) {
    if (l === `〔会員ID-M0809-${呼び名}〕`) notes.set(l, 会員ID);
    else if (l === `〔配送先ID-M0809-${呼び名}〕`) notes.set(l, 配送先ID);
  }
}

defineSeed("S-M08-09-QH-MEMBER-037", async ({ browser, notes, seed }) => {
  await 会員と追加の配送先(browser, notes, seed, "001", { 名称: "旧配送先M0809-001", 姓: "旧姓A001", 名: "旧名B001", 住所1: "渋谷区旧町001", 住所2: "旧ビル001", 会社名: "旧会社M0809-001" });
  reportCurrentSeedIssue("追加の配送先は、フロントのマイページでなく管理画面のお届け先登録画面で登録した（会社名の欄がフロントの部品に無い）。会員のメールアドレスの前半に実行の印を付けた。スマレジ試験環境への接続は確かめていない");
});
defineSeed("S-M08-09-QH-MEMBER-039", async ({ browser, notes, seed }) => {
  await 会員と追加の配送先(browser, notes, seed, "003", { 名称: "削除対象003", 姓: "削除姓A003", 名: "削除名B003", 住所1: "千代田区削除対象003", 住所2: "削除ビル003", 会社名: "削除会社M0809-003" });
  reportCurrentSeedIssue("追加の配送先は、フロントのマイページでなく管理画面のお届け先登録画面で登録した（会社名の欄がフロントの部品に無い）。会員のメールアドレスの前半に実行の印を付けた。スマレジ試験環境への接続は確かめていない");
});
