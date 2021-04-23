const socket = io()

const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')


const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessage = document.querySelector('#location-template').innerHTML


const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true})

socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        message:message.text,
        createdAt:moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
})

socket.on('sendLocation', (url) => {
    const html = Mustache.render(locationMessage, {
        location:url.url,
        createdAt:moment(url.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    console.log(url)
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    $messageFormButton.setAttribute('disabled', 'disabled')
    
    const message = e.target.elements.message.value

    socket.emit('sendMessage', message, (error) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()
        if(error) {
            return console.log(error)
        }

        console.log('Message delivered')
    })
})

$sendLocationButton.addEventListener('click', ()=>{
    if(!navigator.geolocation) return alert('Geolocation not supported by your browser')

    $sendLocationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position)=>{
        const { latitude , longitude } = position.coords
        
        const coords = {
            latitude,
            longitude
        } 

        socket.emit('sendLocation', coords, (error) => {
            $sendLocationButton.removeAttribute('disabled')
            if(error) return console.log(error)
            console.log('Location Shared')
        })
    })

})

socket.emit('join', {username, room})