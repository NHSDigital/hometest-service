// kanel.config.cjs
const path = require("path");

function snakeToCamel(str) {
  return str.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

/** @type {import('kanel').Config} */
module.exports = {
  connection: {
    host: "localhost",
    port: 5432,
    user: "admin",
    password: "admin",
    database: "local_hometest_db",
  },
  preDeleteOutputFolder: true,
  outputPath: path.join(__dirname, "src/lib/db/types/__generated__"),
  type: "ts",
  namespace: "DB",
  module: "esm",
  disableNominalTyping: true,
  // Convert DB column names → camelCase
  getPropertyMetadata: (property) => ({
    name: snakeToCamel(property.name),
    comment: [],
  }),
  generateIdentifierType: (c, d) => {
    return {
      declarationType: "typeDeclaration",
      name: c.name,
      exportAs: "named",
      typeDefinition: ["string"],
      comment: [`Identifier type for ${d.name}`],
    };
  },
};
