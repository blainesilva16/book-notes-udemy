import express from "express"
import pg from "pg"
import dotenv from "dotenv"

dotenv.config()

const app = express()
const port = 3000
const password = process.env.BOOKNOTESP_PASSWORD

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "booknotesp",
    password: password,
    port: 5432
})

db.connect()

app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))

// Starting some variables to run the app
let sortId = "1"
let notes = []
let sorting = [
    { id: 1, name: "RECENT" },
    { id: 2, name: "BEST RATED" },
    { id: 3, name: "WORST RATED" },
    { id: 4, name: "A-Z"}
]
let API_URL = "https://covers.openlibrary.org/b/id/"
let errorMessage = ""

// Function to retrieve data based on the sorting
async function getNotes() {
    let result = []
    switch (sortId) {
        case "1":
            result = await db.query("SELECT * FROM notes ORDER BY id DESC")
            break;
        case "2":
            result = await db.query("SELECT * FROM notes ORDER BY rating DESC")
            break;
        case "3":
            result = await db.query("SELECT * FROM notes ORDER BY rating ASC")
            break;
        case "4":
            result = await db.query("SELECT * FROM notes ORDER BY book_name ASC");
            break;
        default:
            result = await db.query("SELECT * FROM notes")
    }
    notes = []
    if (result.rows.length > 0) {
        result.rows.forEach(row => {
            notes.push({ 
                id: row.id, 
                bookName: row.book_name, 
                author: row.author, 
                rating: row.rating, 
                review: row.review, 
                coverLink: API_URL + row.cover_id + "-M.jpg",
                amazonUrl: "https://www.amazon.com/s?k=" + row.book_name.replace(/[' ']/g, '-')
            })
        })
        errorMessage = ""
    }
    else {
        errorMessage = "No results found"
    }
}

// Main route, it calls the getNotes function and renders the notes
app.get("/", async (req,res) => {
    try {
        await getNotes()
    } catch (error) {
        console.log("Error fetching data",error.stack)
    }
    res.render("index.ejs", { listNotes: notes, listSorting: sorting, sortId: sortId, errorMessage: errorMessage })
})

// Sorting route, it updates the sortId variable and renders the notes based on the user's chosen sorting method
app.post("/sort", (req,res) => {
    sortId = req.body.sortId
    res.redirect("/#notes-container")
})

// Same as main route but directing to the notes container
app.get("/#notes-container", async (req,res) => {
    try {
        await getNotes()
    } catch (error) {
        console.log("Error fetching data",error.stack)
    }
    res.render("index.ejs", { listNotes: notes, listSorting: sorting, sortId: sortId, errorMessage: errorMessage })
})

// For the user to search if there is a review of a specific book
app.post("/searcher", async (req,res) => {
    const search = req.body.searcher

    try {
        const result = await db.query("SELECT * FROM notes WHERE LOWER(book_name) LIKE '%' || $1 || '%' ", [search.toLowerCase()])
        notes = []
        if(result.rows.length > 0) {
            result.rows.forEach(row => {
                notes.push({ id: row.id, bookName: row.book_name, author: row.author, rating: row.rating, review: row.review, coverLink: API_URL + row.cover_id + "-M.jpg" })
            }) 
            errorMessage = ""        
        }
        else {
            errorMessage = "No results found"
        }
    } catch (error) {
        console.log("Error searching book", error.stack)
    }
    res.render("index.ejs", { listNotes: notes, listSorting: sorting, sortId: sortId, errorMessage: errorMessage })   
})

// Adding a new review
app.post("/new", async (req,res) => {
    const newBookName = req.body.newBookTitle
    const newBookAuthor = req.body.newBookAuthor
    const newBookRating = req.body.newBookRating
    const newBookReview = req.body.newBookReview
    const newBookCoverId = req.body.newBookCoverId
    try {
        await db.query("INSERT INTO notes (book_name, author, rating, review, cover_id) VALUES ($1, $2, $3, $4, $5)", [newBookName,newBookAuthor,newBookRating,newBookReview,newBookCoverId])
    } catch (error) {
        console.log("Error adding new book note", error.stack)
    }
    sortId = "1"
    res.redirect("/#notes-container")
})

// Editing a review
app.post("/edit", async (req,res) => {
    const id = req.body.noteId
    const rating = req.body.updatedNoteRating
    const review = req.body.updatedNoteReview
    try {
        await db.query("UPDATE notes SET rating = $1, review = $2 WHERE id = $3", [rating, review, id])
    } catch (error) {
        console.log("Error updating note", error.stack)
    }
    res.redirect("/#notes-container")
})

// Deleting a review
app.post("/delete", async (req,res) => {
    const id = req.body.deleteId
    try {
        await db.query("DELETE FROM notes WHERE id = $1", [id])
    } catch (error) {
        console.log("Error deleting note", error.stack)
    }
    res.redirect("/#notes-container")
})

app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})