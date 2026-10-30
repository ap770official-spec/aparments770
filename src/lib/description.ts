/**
 * A listing's description is written once, in Hebrew or English, and
 * saved into the matching column (description_he / description_en) with
 * description_source_lang. Shared by the owner's publish wizard and the
 * admin edit form so both detect the language the same way.
 */
export type DescriptionLang = "he" | "en";

/** Hebrew if Hebrew letters outnumber Latin ones, English otherwise. */
export function detectDescriptionLang(text: string): DescriptionLang {
  const hebrew = text.match(/[֐-׿]/g)?.length ?? 0;
  const latin = text.match(/[A-Za-z]/g)?.length ?? 0;
  return hebrew >= latin ? "he" : "en";
}

/** The text to show in the single description box when editing. */
export function primaryDescription(property: {
  description_he: string | null;
  description_en: string | null;
  description_source_lang?: DescriptionLang | null;
}): string {
  const source =
    property.description_source_lang === "en"
      ? property.description_en
      : property.description_he;
  return source ?? property.description_he ?? property.description_en ?? "";
}
