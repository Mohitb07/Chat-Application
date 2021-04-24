const path = require('path')
const express = require('express')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessages, generateLocationMessages } = require('./utils/messages')
const { getUser, removeUser, getUserInRoom, addUser} = require('./utils/users')

const app = express();
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')



app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {
    console.log('New websocket connection')


    socket.on('join', ({username, room}, callback) => {
        const {error, user} = addUser({ id: socket.id, username, room})

        if(error) {
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('message', generateMessages('Welcome'))
        socket.broadcast.to(user.room).emit('message',generateMessages(`${user.username} has joined!`))

        callback()
    })

    // socket.emit('message', generateMessages('Welcome'))
    // socket.broadcast.emit('message',generateMessages('A new user has joined!'))

    socket.on('sendMessage', (message, callback)=>{
        const filter = new Filter()

        if(filter.isProfane(message)) {
            return callback('Profanity is not allowed')
        }

        io.emit('message', generateMessages(message))
        callback()
    })
    
    socket.on('sendLocation', ({latitude, longitude}, callback)=>{
        const message = `https://google.com/maps?q=${latitude},${longitude}`
        io.emit('sendLocation', generateLocationMessages(message))
        callback()
    })


    socket.on('disconnect', ()=>{
        const user = removeUser(socket.id)
        if(user) {
            io.to(user.room).emit('message', generateMessages(`${user.username} has left`))
        }
    })

})

server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
})

