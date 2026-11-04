/**
 * F06-25 店頭モニターの画面シード。正本: cases/F06-25_seed_data.tsv
 * 店舗（SHOPS）: シード表は店舗ID 1 を「TC東京」・本店、店舗ID 5 を「大阪」・支店（支店URL osaka）に登録し直すと定める。
 * 手元の環境では店舗ID 1 は本店「Hareruya」、店舗ID 5 は「トーナメントセンター 大阪」で、支店URL osaka の画面が開く。店名はこのシードを使うケースの確かめに現れないので書き換えず、
 * 本店・支店の区別と支店URLが成り立つことをDBの参照と画面で確かめるだけにした（正本の外の補い。条件付き）。
 */
import { 店舗 } from "../db/f06_25";
import { BASE_URL } from "../config/env";
import { available } from "../lib/db";
import { defineSeed, reportSeedIssue } from "../lib/seeds";

defineSeed("S-F06-25-SHOPS", async () => {
  if (available) {
    const a = 店舗(1), b = 店舗(5);
    if (!a?.本店) throw new Error("店舗ID 1 が本店でない");
    if (!b || b.本店) throw new Error("店舗ID 5 が支店でない");
    reportSeedIssue("S-F06-25-SHOPS", `店名は書き換えていない（店舗ID 1「${a.店名}」・店舗ID 5「${b.店名}」。シード表は「TC東京」「大阪」）`);
  }
  const res = await fetch(`${BASE_URL}/ja/osaka/waiting_number`);
  if (res.status !== 200) throw new Error(`支店URL osaka の店頭モニター画面が開かない（${res.status}）`);
});
