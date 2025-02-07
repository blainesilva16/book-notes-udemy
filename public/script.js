// Both handler(id) and handler(id, name) are for toggling the visibility of the elements on editing a review
function handler(id) {
    document.getElementById("currentData" + id).setAttribute("hidden", true)
    document.getElementById("editingData" + id).removeAttribute("hidden")
    document.getElementById("cancel" + id).removeAttribute("hidden")
    document.getElementById("delete" + id).setAttribute("hidden", true)
    document.getElementById("edit" + id).setAttribute("hidden", true)
    document.getElementById("notes" + id).setAttribute("hidden", true)
}
function handler2(id) {
    document.getElementById("currentData" + id).removeAttribute("hidden")
    document.getElementById("editingData" + id).setAttribute("hidden", true)
    document.getElementById("cancel" + id).setAttribute("hidden", true)
    document.getElementById("delete" + id).removeAttribute("hidden")
    document.getElementById("edit" + id).removeAttribute("hidden")
    document.getElementById("notes" + id).removeAttribute("hidden")
}

// Highlighting the selected form of sorting
var currentActiveSort = document.getElementById('currentActiveSort').textContent;
["1","2","3","4"].forEach(id => {
    if (id == currentActiveSort){
        document.getElementById(id).classList.add('active');
    }
    else {
        document.getElementById(id).classList.remove('active');
    }
})

// If the search for data retrieves no results, it will display a message on the notes container
if (document.getElementById("error").textContent.length > 1){
    document.getElementById("error").style.display = "flex";
    document.getElementById("back").style.display = "flex"
    document.getElementById("notes-container").style.display = "flex"
    document.getElementById("notes-container").style.justifyContent = "center"
} else {
    document.getElementById("error").style.display = "none";
    document.getElementById("back").style.display = "none";
    document.getElementById("notes-container").style.display = "grid";
}

// Opening and closing the modals
const openModalButtons = document.querySelectorAll('[data-modal-target]')
const overlay = document.getElementById('overlay')

openModalButtons.forEach(button => {
  button.addEventListener('click', () => {
      const modal = document.querySelector(button.dataset.modalTarget)
      openModal(modal)
  })
})

overlay.addEventListener('click', () => {
  const modals = document.querySelectorAll('.modal')
  const modalSure = document.querySelectorAll('.modal-sure')
  modals.forEach(modal => {
    closeModal(modal)
  })
  modalSure.forEach(modal => {
    closeModal(modal)
  })
})

document.getElementById("cancel-btn").addEventListener('click', () => {
    const modalSure = document.querySelectorAll('.modal-sure')
    modalSure.forEach(modal => {
        closeModal(modal)
    })
})

function openModal(modal) {
  if (modal == null) return
  modal.classList.add('active')
  overlay.classList.add('active')
}

function closeModal(modal) {
  if (modal == null) return
  modal.classList.remove('active')
  overlay.classList.remove('active')
}

// Retrieving data from the OpenLibraryAPI
document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('searchInput');
    const dropdownList = document.getElementById('dropdownList');

    // Debounce function used to prevent a lot of fetch request per input.
    const debounce = (func, delay) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func(...args);
            }, delay);
        };
    };

    // Function to handle the debounced input event
    const handleDebouncedInput = async function () {
        const searchTerm = searchInput.value.trim();
        console.log("Search Term: ", searchTerm);

        try {
            const { bookTitle, bookAuthor, coverId } = await fetchData(searchTerm);            
            
            console.log("Searched Book: ", bookTitle);
            console.log("Cover Id: ", coverId);
            console.log("Book Author: ", bookAuthor);
            // Update the dropdown list
            await updateDropdown(bookTitle, coverId, bookAuthor, dropdownList);
        } catch (error) {
            console.error('Error updating dropdown:', error);
        }
    };

    // Attach the debounced input event handler
    searchInput.addEventListener('input', debounce(handleDebouncedInput, 300));

    document.addEventListener('click', function (event) {
        // Close dropdown when clicking outside the search container
        if (!event.target.closest('.dropdown')) {
            dropdownList.style.display = 'none';
        }
    });
    const label = $("label");
    const labelArray = document.querySelectorAll("label");
    //Add checked (orange color) class clicked labels.    
    label.on("click", function(event) {          
        label.removeClass("checked");        
        const labelValue = $(this).attr("for");
        for (let i = 0; i < labelValue; i++) {            
            $(labelArray[i]).addClass("checked");            
        }       
    })   
    
});

async function fetchData(searchTerm) {
    try {
        const response = await fetch(`https://openlibrary.org/search.json?q=${searchTerm}&limit=10`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        console.log(data);
        const result = data.docs;
        const bookTitle = result.map((book) => book.title);
        const bookAuthor = result.map((book) => book.author_name ? book.author_name[0] : 'Unknown');
        const coverId = result.map((book) => book.cover_i);        

        return {
            bookTitle: bookTitle,
            bookAuthor: bookAuthor,
            coverId: coverId,
        };
    } catch (error) {
        console.error("Error fetching data: ", error);
    }
}

async function updateDropdown(items, coverId, bookAuthor, dropdownList) {
    //create list items based on the fetch results. 
    
    const html = items.map((item, index) =>
        
        `<button style="cursor:pointer;background-color:transparent;border:none; color:#000;width:100%" onclick="fill('${item.replace(/[']/g, '')}','${bookAuthor[index]}',${coverId[index]})">
        <li style="list-style:none">
        
        <div>
        <p style="font-size:0.9rem"><strong>${item}</strong></p>
        <p style="font-size:0.7rem;margin:0;font-style:italic">By ${bookAuthor[index]}</p>
        </div>
        </li>
        </button>`).join('');
    dropdownList.innerHTML = html;    
    
    //href="/book?title=${item}&author=${bookAuthor[index]}&coverId=${coverId[index]? coverId[index]: 0}"
    //<img src="https://covers.openlibrary.org/b/id/${coverId[index]}-S.jpg?default=https://openlibrary.org/static/images/icons/avatar_book-sm.png"  height="30" alt="book picture">

    // Show/hide dropdown
    if (items.length > 0) {
        dropdownList.style.display = 'block';
    } else {
        dropdownList.style.display = 'none';
    }

}

// If user selects a book from the dropdown list, this functions fills the input fields with the selected book's details
// It also stores the book cover id
function fill(item, bookAuthor, coverId) {
    document.getElementById("newBookTitle").textContent = item
    document.getElementById("newBookAuthor").textContent = bookAuthor
    document.getElementById("inputTitle").value = item
    document.getElementById("inputAuthor").value = bookAuthor
    document.getElementById("newBookCoverId").value = coverId
}

// Function that adds star rating to the new book review. Called when clicking on a star
function newBookRate(rate) {
    var rateValue = Number(rate)
    for(var i=1;i<=rateValue;i++){
        document.getElementById("starNew"+i).classList.add("checked")        
    }  
    for(var l=rateValue+1;l<=10;l++) {
        document.getElementById("starNew"+l).classList.remove("checked") 
    }
    document.getElementById("newBookRating").value = rateValue
}

// Function that modifies the star rating of the existing book review. Called when clicking on a star
function edit(newRate, id) {
    var rateNew = Number(newRate)
    for(var i=1;i<=rateNew;i++){
        document.getElementById("starEdit"+i+id).classList.add("checked")        
    }  
    for(var l=rateNew+1;l<=10;l++) {
        document.getElementById("starEdit"+l+id).classList.remove("checked") 
    }
    
    document.getElementById("rating" + id).value = rateNew
}

// Function that passes the id of the review to be deleted
function passingId(id){
    document.getElementById("deletingNote").value = Number(id)
}

// Function that passes the data fot the upcoming notes modal
function passingData(id,title){
    document.getElementById("bookIdNotes").value = Number(id)
    document.getElementById("bookNameNotes").textContent = title
}