import axios from "axios";
import { TranslationCache } from "../models/index.js";

const DEEPL_URL = "https://api-free.deepl.com/v2/translate";

export const translateProduct = async (data) => {
  console.log("DEEPL KEY:", process.env.DEEPL_API_KEY);

  // ❗ УБРАЛИ name отсюда
  const texts = [
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

      // CACHE
      const cached = await TranslationCache.findOne({
        where: { text, lang: targetLang }
      });

      if (cached) {
        console.log("CACHE HIT:", text, targetLang);
        results.push(cached.translation);
        continue;
      }

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
    // ❌ УБРАЛИ name_ru и name_bg
    shortDescription_ru: ru[0],
    longDescription_ru: ru[1],

    shortDescription_bg: bg[0],
    longDescription_bg: bg[1]
  };
};