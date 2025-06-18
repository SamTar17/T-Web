

class SocketController {
    constructor(io,connectionManager,roomServices,messageServices,uniqueTimestampGenerator){
        this.io = io,
        this.connectionManager = connectionManager,
        this.roomServices = roomServices,
        this.messageServices = messageServices
        this.uniqueTimestampGenerator = uniqueTimestampGenerator
    }




    async function processMessages(messageData) {
        
        const { socketId, username, roomName, message } = messageData
        const uniqueTimestamp = this.uniqueTimestampGenerator.generateTimestamp()

            const formattedMessage = {
                uniqueTimestamp: uniqueTimestamp,
                userName: username,
                message: message,
                roomName: roomName,
                };

                this.io.to(roomName).emit('message_received', formattedMessage)

                setImmediate(async () =>{
                    await this.messageServices.saveMessage(formattedMessage)
                })



    }




    async function handleCreateRoom(params) {
        pass
    }
}