# M13-15 画像設定の入力ファイル

正本: `integration_test/casegen/cases/M13-15_seed_data.tsv` の S-M13-15-UPLOAD-FILES（形式と大きさ）と S-M13-15-QK-IMAGE-037（QK-1315-001.png）。
シード表は形式と大きさだけを決め、寸法や絵柄を決めないので、どれも 382×130 の色の帯の絵にした（大会特設ページのバナーの枠と同じ寸法）。
シード（`seeds/m13-15.ts`）が、使う前に大きさと先頭の数バイトの種別を確かめる。

| ファイル | シード表の条件 | 中身 |
| --- | --- | --- |
| valid.png | 520000バイト以下のPNG画像 | PNG（約65KB） |
| valid.gif | 520000バイト以下のGIF画像 | valid.png を macOS の sips で GIF にしたもの |
| valid.jpg | 520000バイト以下のJPEG画像 | valid.png を macOS の sips で JPEG にしたもの |
| original-name.JPG | 520000バイト以下で内容がPNG画像 | PNG（拡張子だけ大文字の JPG） |
| size-520000.png | 520000バイトのPNG画像 | valid.png と同じ絵に、注記の塊（tEXt）を足してちょうど520000バイトにしたもの |
| size-520001.png | 520001バイトのPNG画像 | 同じ作りでちょうど520001バイト（いまテストのあるケースでは使わない） |
| not-image.png | 520000バイト以下のテキストデータ | 1行の英文（いまテストのあるケースでは使わない） |
| QK-1315-001.png | PNG形式、520000バイト以下、中身は任意の絵 | PNG（約33KB） |

PNG は Python の標準ライブラリ（zlib・struct）だけで書いた（色は位置で変わる帯）。
