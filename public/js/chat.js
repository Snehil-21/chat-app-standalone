const socket = io()

const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $locationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

const {username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoScroll = () => {
    // new message element
    const $newMessage = $messages.lastElementChild

    // height of new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // scrolled value
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('locationMessage', (url) => {
    const location = Mustache.render(locationTemplate, {
        username: url.username,
        location: url.url,
        sentAt: moment(url.createdAt).format('h:mm a')
    })

    $messages.insertAdjacentHTML('beforeend', location)
    autoScroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })

    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    $messageFormButton.setAttribute('disabled', 'disbaled')

    const message = e.target.elements.message.value
    
    socket.emit('send-message', message, (error) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if(error) {
            console.log('Error')
        }
        else {
            console.log('Message delivered!')
        }
    })
})

$locationButton.addEventListener('click', () => {
    $locationButton.setAttribute('disabled', 'disabled')

    if(!navigator.geolocation) {
        return alert('Your browser does not support location services.')
    }

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('send-location', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, (message) => {
            $locationButton.removeAttribute('disabled')
            console.log(message)
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if(error) {
        alert(error)
        location.href = '/'
    }
})