import axios from "axios";


const DEEPL_URL = "https://api-free.deepl.com/v2/translate";


export const translateProduct = async (data) => {
    console.log("DEEPL KEY:", process.env.DEEPL_API_KEY);

  const texts = [
    data.name_en || "",
    data.shortDescription_en || "",
    data.longDescription_en || ""
  ];

  const translate = async (targetLang) => {

    const response = await axios.post(
  DEEPL_URL,
  {
    text: texts,
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
    console.log("DEEPL RESPONSE:", response.data);

    return response.data.translations.map(t => t.text);
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
