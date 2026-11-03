import { exportedPhoto, browserPhoto } from './export-materials.mjs';
import { wordPhoto,wordFocus } from './photo.mjs';
/*!
Source: https://github.com/open-dict-data/ipa-dict
Data: data/en_US.txt (General American)
Retrieved: 2026-09-08
Upstream SHA256: 2af6f154a5c363275f052d1f85acedef38ed185ca9745aa4314be77f6b70de67
Local change: lowercase and sort lookup keys. Pronunciations unchanged.

The MIT License (MIT)

Copyright (c) 2016 dohliam

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
// Pronunciations reuse PicLex/Resources/EnglishPronunciations.txt (see its adjacent LICENSE).
// Original everyday examples; used when no eligible current-deck words exist.
export const starterWords = [
  ['potato','土豆','A potato grows under the ground.','土豆生长在地下。',"/pəˈteɪˌtoʊ/"],
  ['garden','花园','We plant flowers in the garden.','我们在花园里种花。',"/ˈɡɑɹdən/"],
  ['shield','盾牌','The shield keeps the hero safe.','盾牌保护英雄。',"/ˈʃiɫd/"],
  ['harvest','收获','The farmers harvest vegetables in autumn.','农民在秋天收获蔬菜。',"/ˈhɑɹvəst/"],
  ['brave','勇敢的','The brave child helps a friend.','勇敢的孩子帮助朋友。',"/ˈbɹeɪv/"],
  ['swift','迅速的','A swift bird flies over the field.','一只迅捷的鸟飞过田野。',"/ˈswɪft/"],
  ['forest','森林','We walk through the forest.','我们穿过森林。',"/ˈfɔɹəst/, /ˈfɔɹɪst/"],
  ['energy','能量；精力','A good breakfast gives you energy.','一顿好的早餐给你能量。',"/ˈɛnɝdʒi/"],
  ['protect','保护','These gloves protect your hands.','这些手套保护你的双手。',"/pɹəˈtɛkt/"],
  ['strong','强壮的','The strong athlete lifts the box.','强壮的运动员举起箱子。',"/ˈstɹɔŋ/"],
  ['treasure','宝藏','They find treasure inside the cave.','他们在洞穴里找到宝藏。',"/ˈtɹɛʒɝ/"],
  ['journey','旅程','Our journey starts this morning.','我们的旅程从今天早晨开始。',"/ˈdʒɝni/"],
  ['improve','改进；提升','Practice can improve your skills.','练习可以提升你的技能。',"/ˌɪmˈpɹuv/"],
  ['collect','收集','We collect fallen leaves.','我们收集落叶。',"/kəˈɫɛkt/"],
  ['survive','生存','Plants need water to survive.','植物需要水才能生存。',"/sɝˈvaɪv/"],
  ['weapon','武器','The hero carries a wooden weapon.','英雄拿着一件木制武器。',"/ˈwɛpən/"],
  ['recover','恢复','Rest helps you recover after exercise.','休息帮助你在运动后恢复。',"/ɹɪˈkəvɝ/"],
  ['careful','小心的','Be careful near the river.','在河边要小心。',"/ˈkɛɹfəɫ/"],
  ['attack','攻击','The monsters attack at night.','怪物在夜里发动攻击。',"/əˈtæk/"],
  ['victory','胜利','The team celebrates its victory.','队伍庆祝胜利。',"/ˈvɪktɝi/, /ˈvɪktɹi/"],
  ['pocket','口袋','There is a coin in my pocket.','我的口袋里有一枚硬币。',"/ˈpɑkət/"],
  ['magnet','磁铁','A magnet can pick up iron nails.','磁铁可以吸起铁钉。',"/ˈmæɡnət/"],
  ['basket','篮子','Put the apples in the basket.','把苹果放进篮子。',"/ˈbæskət/"],
  ['carrot','胡萝卜','The rabbit eats a carrot.','兔子吃一根胡萝卜。',"/ˈkæɹət/, /ˈkɛɹət/"],
  ['tomato','番茄','A ripe tomato is red.','熟透的番茄是红色的。',"/təˈmɑˌtoʊ/, /təˈmeɪˌtoʊ/"],
  ['glove','手套','He wears a glove on each hand.','他每只手都戴着一只手套。',"/ˈɡɫəv/"],
  ['courage','勇气','It takes courage to try again.','再次尝试需要勇气。',"/ˈkɝədʒ/, /ˈkɝɪdʒ/"],
  ['peaceful','宁静的','The village is peaceful at dawn.','村庄在黎明时很宁静。',"/ˈpisfəɫ/"],
  ['rainbow','彩虹','A rainbow appears after the rain.','雨后出现一道彩虹。',"/ˈɹeɪnˌboʊ/"],
  ['backpack','背包','She puts a notebook in her backpack.','她把笔记本放进背包。',"/ˈbækˌpæk/"],
].map(([english,chinese,example,exampleChinese,pronunciation]) => ({english,chinese,example,exampleChinese,pronunciation}));

export function eligibleWords(words) {
  const seen = new Set();
  return (Array.isArray(words) ? words : []).filter(w => {
    if (!w || typeof w.english !== 'string' || typeof w.chinese !== 'string' || typeof w.example !== 'string') return false;
    const key = w.english.trim().toLowerCase();
    if (!/^[a-z][a-z '\-]{0,39}$/i.test(key) || !w.chinese.trim() || !w.example.trim() || seen.has(key)) return false;
    seen.add(key); return true;
  }).map(w => ({english:w.english.trim(),chinese:w.chinese,example:w.example,exampleChinese:typeof w.exampleChinese === 'string' ? w.exampleChinese : '',photo:(exportedPhoto(w.photo)||browserPhoto(w.photo))||(wordPhoto(w).startsWith('/api/')?wordPhoto(w):''),photoID:wordPhoto(w).startsWith('piclex-lab-photo:')?w.photoID:undefined,focus:wordFocus(w.focus),pronunciation:typeof w.pronunciation === 'string' ? w.pronunciation : ''}));
}
