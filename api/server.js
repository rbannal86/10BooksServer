/* eslint-disable quotes */

const app = require("./app");
const { PORT } = require("./config");
require("dotenv").config();

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});
