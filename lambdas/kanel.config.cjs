// kanel.config.cjs
const path = require("path");

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
  keepCamelCase: true,
  customTypeMap: {
    "hometest.order_status.order_uid": "string",
  },
  disableNominalTyping: true,
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
