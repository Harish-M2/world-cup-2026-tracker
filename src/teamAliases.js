export const TEAM_ALIASES = {
  "usa": "United States",
  "united states of america": "United States",
  "cote d'ivoire": "Ivory Coast",
  "ivory coast": "Ivory Coast",
  "korea republic": "South Korea",
  "south korea": "South Korea",
  "republic of korea": "South Korea",
  "congo": "Republic of the Congo",
  "congo republic": "Republic of the Congo",
  "bosnia-herzegovina": "Bosnia and Herzegovina",
  "cape verde islands": "Cape Verde",
  "iran ir": "Iran",
  "czechia": "Czech Republic",
  "czech republic": "Czech Republic"
};

export function normalizeTeamName(input) {
  if (!input) {
    return "";
  }

  const basic = input.trim().toLowerCase();
  return TEAM_ALIASES[basic] || toTitleCase(input.trim());
}

function toTitleCase(value) {
  const SMALL_WORDS = new Set(["and", "or", "the", "of", "a", "an", "in", "on", "at", "to", "from"]);
  
  return value
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      // First word is always capitalized, small words are lowercase (except first)
      if (index === 0 || !SMALL_WORDS.has(word)) {
        if (word.length <= 2) {
          return word.toUpperCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word;
    })
    .join(" ");
}
