'use strict'

const gQueryOptions = {
    filterBy: { txt: '', rating: 60 },
    sortBy: {},
    page: { idx: 0, size: 2 }
}

var gKeywordSearchCountMap = {'funny': 12,'cat': 16, 'baby': 2} 

var gMemeToEdit = null
var isEditing = false

function onInit() {
    renderCategories()
    readQueryParams()
    renderMemes()
}

function getMeme() {
    return gMeme
}

function renderMemes() {
    var memes = getFilteredMemes(gQueryOptions, 18)
    var strHtmls = memes.map(meme => `
        <article class="card">
            
        <!--
            <h2>${meme.category}</h2>
            <p>Rating: <span>${meme.rating}</span></p>
            
            <button class="meme-btn" onclick="onReadMeme('${meme.url}')">Info</button>
            <button class="meme-btn" onclick="onUpdateMeme('${meme.id}')">Update</button>
            <button class="meme-btn" title="Delete meme" class="btn-remove" onclick="onRemoveMeme('${meme.id}')">Delete</button>
            -->
            <img title="Photo of ${meme.category}" 
                src="${meme.url}" 
                alt="Meme category: ${meme.category}"
                onerror="this.src='${meme.url}'" 
                onclick="onClickImg('${meme.url}')">
        </article> 
    `)
    document.querySelector('.memes-container').innerHTML = strHtmls.join('')
}


function renderCategories() {
    const categories = getCategories()
    
    const strHtml = categories.map(category => `
        <option>${category}</option>
    `).join('')

    const elLists = document.querySelectorAll('.categories-list')
    elLists.forEach(list => list.innerHTML += strHtml)
}

function renderMeme(imageUrl, text) {
    const canvas = document.getElementById('memeCanvas')
    const ctx = canvas.getContext('2d')

    const image = new Image()
    image.onload = function() {
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
        ctx.fillStyle = 'white'
        ctx.font = 'bold 24px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(text, canvas.width / 2, 30)
    }
    image.src = imageUrl
}


// CRUD

function onRemoveMeme(memeId) {
    removeMeme(memeId)
    renderMemes()
    flashMsg(`Meme Deleted`)
}

function onAddMeme() {
    const elModal = document.querySelector('.meme-edit-modal')
    elModal.querySelector('h2').innerText = 'Add Meme'
    elModal.showModal()
}

function onUpdateMeme(memeId) {
    gMemeToEdit = getMemeById(memeId)

    const elModal = document.querySelector('.meme-edit-modal')
    
    const elHeading = elModal.querySelector('h2').innerText = 'Edit Meme'
    const elImg = elModal.querySelector('img').src=`${gMemeToEdit.url}`
    const elCategories = elModal.querySelector('select').value = gMemeToEdit.category
    const elRating = elModal.querySelector('input').value = gMemeToEdit.rating
    
    elModal.showModal()
}

function onSaveMeme() {
    const elForm = document.querySelector('.meme-edit-modal form')

    const elCategory = elForm.querySelector('select')
    const elRating = elForm.querySelector('input')
    
    const category = elCategory.value
    const rating = elRating.value

    if(gMemeToEdit) {
        var meme = updateMeme(gMemeToEdit.id, category, rating)
        gMemeToEdit = null
    } else {
        var meme = addMeme(category, rating)
    }
    elForm.reset()

    renderMemes()
    flashMsg(`Meme Saved (id: ${meme.id})`)
}

// Meme Edit Dialog
function onClickImg(URL) {
    var meme = getMemeByURL(URL)

    if (meme) {
        renderMeme(meme.url, meme.desc)
        toggleEditor()
    } else {
        console.error("Meme not found for id:", id)
    }
}


function toggleEditor() {

    if (isEditing) {
        hideMemesContainer()
        showMemeEditor()
    } else {
        hideMemeEditor()
        showMemesContainer()
    }    

    isEditing = !isEditing
}

function showMemeEditor() {
    const editor = document.getElementById('memeEditor')
    editor.style.display = 'block'
}

function hideMemeEditor() {
    const editor = document.getElementById('memeEditor')
    editor.style.display = 'none'
}

function onSelectCategory(elCategory) {
    const elMemeImg = document.querySelector('.meme-edit-modal img')
    elMemeImg.src = `${elCategory.url}`
}

// Details modal

function onReadMeme(memeURL) {
    const meme = getMemeByURL(memeURL)
    const elModal = document.querySelector('.modal')

    elModal.querySelector('h3').innerText = meme.category
    elModal.querySelector('h4 span').innerText = ' ' + meme.rating
    elModal.querySelector('p').innerText = meme.desc
    elModal.querySelector('img').src = `${meme.url}`

    elModal.showModal()
}

function onCloseModal() {
    document.querySelector('.modal').close()
}

// Filter, Sort & Pagination

function onSetFilterBy() {
    const elText = document.querySelector('.search')
    const elRating = document.querySelector('.filter-by input')

    gQueryOptions.filterBy.txt = elText.value
    gQueryOptions.filterBy.rating = elRating.value

    setQueryParams()
    renderMemes()
}

function onSetSortBy() {
    const elSortBy = document.querySelector('.sort-by select')
    const elDir = document.querySelector('.sort-by input')

    const sortBy = elSortBy.value
    const dir = elDir.checked ? -1 : 1

    if(sortBy === 'category'){
        gQueryOptions.sortBy = { category: dir }
    } else if (sortBy === 'rating'){
        gQueryOptions.sortBy = { rating: dir }
    }

    setQueryParams()
    renderMemes()
}

function onNextPage() {
    const memeCount = getMemeCount(gQueryOptions.filterBy)
    
    if(memeCount > (gQueryOptions.page.idx + 1) * gQueryOptions.page.size) {
        gQueryOptions.page.idx++
    } else {
        gQueryOptions.page.idx = 0
    }
    setQueryParams()
    renderMemes()
}

// Query Params

function readQueryParams() {
    const queryParams = new URLSearchParams(window.location.search)
    
    gQueryOptions.filterBy = {
        txt: queryParams.get('search') || '',
        rating: +queryParams.get('rating') || 0
    }

    if(queryParams.get('sortBy')) {
        const prop = queryParams.get('sortBy')
        const dir = queryParams.get('sortDir')
        gQueryOptions.sortBy[prop] = dir
    }

    if(queryParams.get('pageIdx')) {
        gQueryOptions.page.idx = +queryParams.get('pageIdx')
        gQueryOptions.page.size = +queryParams.get('pageSize')
    }
    renderQueryParams()
}

function renderQueryParams() {
    document.querySelector('.filter-by select').value = gQueryOptions.filterBy.txt
    document.querySelector('.filter-by input').value = gQueryOptions.filterBy.rating
    
    const sortKeys = Object.keys(gQueryOptions.sortBy)
    const sortBy = sortKeys[0]
    const dir = +gQueryOptions.sortBy[sortKeys[0]]

    document.querySelector('.sort-by select').value = sortBy || ''
    document.querySelector('.sort-by input').checked = (dir === -1) ? true : false
}

function setQueryParams() {
    const queryParams = new URLSearchParams()

    queryParams.set('search', gQueryOptions.filterBy.txt)
    queryParams.set('rating', gQueryOptions.filterBy.rating)

    const sortKeys = Object.keys(gQueryOptions.sortBy)
    if(sortKeys.length) {
        queryParams.set('sortBy', sortKeys[0])
        queryParams.set('sortDir', gQueryOptions.sortBy[sortKeys[0]])
    }

    if(gQueryOptions.page) {
        queryParams.set('pageIdx', gQueryOptions.page.idx)
        queryParams.set('pageSize', gQueryOptions.page.size)
    }

    const newUrl = 
        window.location.protocol + "//" + 
        window.location.host + 
        window.location.pathname + '?' + queryParams.toString()

    window.history.pushState({ path: newUrl }, '', newUrl)
}

// UI

function flashMsg(msg) {
    const el = document.querySelector('.user-msg')

    el.innerText = msg
    el.classList.add('open')
    setTimeout(() => el.classList.remove('open'), 3000)
}