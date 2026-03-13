import axios from "axios";
import { TranslationCache } from "../models/index.js";


const DEEPL_URL = "https://api-free.deepl.com/v2/translate";


export const translateProduct = async (data) => {
    console.log("DEEPL KEY:", process.env.DEEPL_API_KEY);

  const texts = [
    data.name_en || "",
    data.shortDescription_en || "",
    data.longDescription_en || ""
  ];

const translate = async (targetLang) => {

  const results = [];

  for (const text of texts) {

    if (!text) {
      results.push("");
      continue;
    }

    // 1️⃣ Проверяем cache
    const cached = await TranslationCache.findOne({
      where: { text, lang: targetLang }
    });

    if (cached) {
      console.log("CACHE HIT:", text, targetLang);
      results.push(cached.translation);
      continue;
    }

    // 2️⃣ Если нет в cache → DeepL
    console.log("DEEPL REQUEST:", text, targetLang);

    const response = await axios.post(
      DEEPL_URL,
      {
        text: [text],
        source_lang: "EN",
        target_lang: targetLang
      },
      {
        headers: {
          Authorization: `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const translation = response.data.translations[0].text;

    // 3️⃣ Сохраняем в cache
    await TranslationCache.create({
      text,
      lang: targetLang,
      translation
    });

    results.push(translation);
  }

  return results;
};

  const ru = await translate("RU");
  const bg = await translate("BG");

  return {
    name_ru: ru[0],
    shortDescription_ru: ru[1],
    longDescription_ru: ru[2],

    name_bg: bg[0],
    shortDescription_bg: bg[1],
    longDescription_bg: bg[2]
  };
};
