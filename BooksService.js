const dotenv = require("dotenv");
const axios = require("axios");
const fsdb = require("./firebase");
const firebase = require("firebase");

dotenv.config();

const BooksService = {
  async parseData(data) {
    let booksArray = [];
    if (!data) return booksArray;
    else {
      data.map((book) => {
        let newBook = {
          id: book.id,
          title: book.volumeInfo.title || null,
          subtitle: book.volumeInfo.subtitle || null,
          authors: book.volumeInfo.authors || null,
          description: book.volumeInfo.description || null,
          categories: book.volumeInfo.categories || null,
          publisher: book.volumeInfo.publisher || null,
          publishedDate: book.volumeInfo.publishedDate || null,
          previewLink: book.volumeInfo.previewLink || null,
          coverImage: !book.volumeInfo.imageLinks
            ? null
            : book.volumeInfo.imageLinks.thumbnail,
        };
        if (newBook.description && newBook.description.length > 140)
          newBook.description = newBook.description.slice(0, 140) + "...";
        booksArray.push(newBook);
      });
      return booksArray;
    }
  },
  async checkGoogle(search) {
    let url = "https://www.googleapis.com/books/v1/volumes";
    const options = {
      method: "get",
      url: url,
      params: {
        q: search,
        printType: "books",
        maxResults: 10,
        key: process.env.GOOGLE_API_KEY,
      },
    };
    return await axios(options);
  },
  async checkFsdb(search) {
    const doc = await fsdb.doc(`searches/${search}`).get();
    let results = [];
    const fsData = doc.data();
    if (!fsData) return null;
    else {
      await fsData.results.map((book) => {
        let bookData = this.getBookData(book);
        results.push(bookData);
      });
      return Promise.all(results).then((results) => {
        return results;
      });
    }
  },
  async getBookData(book) {
    let bookData;
    let bookRef = fsdb.collection("books").doc(book);
    const doc = await bookRef.get();
    if (!doc.exists) {
      console.log("Book does not exist");
    } else {
      bookData = doc.data();
      return bookData;
    }
  },
  async checkBookIds(data) {
    let bookIds = [];
    data.map((book) => {
      const booksRef = fsdb.collection("books").doc(book.id);
      bookIds.push(book.id);
      booksRef.get().then((snapshot) => {
        if (!snapshot.exists) {
          booksRef.set({
            ...book,
          });
        }
      });
    });
    return bookIds;
  },
  async createSearchDoc(search, bookIds) {
    await fsdb
      .collection("searches")
      .doc(search)
      .set({
        created: firebase.firestore.Timestamp.now(),
        results: bookIds,
      })
      .catch((error) => console.log(error));
  },
  async addToFirestore(data, search) {
    let bookIds = await this.checkBookIds(data);
    await this.createSearchDoc(search, bookIds);
  },
};

module.exports = BooksService;
