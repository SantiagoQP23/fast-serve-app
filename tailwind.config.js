// The theme's Tailwind config now lives in @intenli/ui. Kept for editor
// Tailwind autocomplete.
const { buildTailwindConfig } = require("@intenli/ui/theme");

module.exports = buildTailwindConfig("light");
module.exports.buildTailwindConfig = buildTailwindConfig;
