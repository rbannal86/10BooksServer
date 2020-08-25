const express = require("express");
const BooksRouter = express.Router();
const BooksService = require("./BooksService");

BooksRouter.route("/:search_term").get(async (req, res) => {
  let search = req.params.search_term;
  search = search.toLowerCase();
  search = search.replace(/\s+/g, "");
  let resultsObject = {};
  const firestoreResults = await BooksService.checkFsdb(search);
  if (!firestoreResults) {
    const googleResults = await BooksService.checkGoogle(search);
    resultsObject.status = googleResults.status;
    resultsObject.data = await BooksService.parseData(googleResults.data.items);
    BooksService.addToFirestore(resultsObject.data, search);
  } else if (firestoreResults) {
    resultsObject.status = 200;
    resultsObject.data = firestoreResults;
  } else {
    return res.status(400).json({ error: "Nothing Was Found!" });
  }
  return res.status(resultsObject.status).json(resultsObject.data);
});

module.exports = BooksRouter;
