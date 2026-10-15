


require('dotenv').config();
const app = require('./src/app');
const { createServer } = require('http');
const { Server } = require('socket.io');
const generateResponse = require("./src/service/ai.service");
const { text } = require('stream/consumers');




const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  },
});

const chatHistory = [
]




io.on('connection', (socket) => {
  console.log("A user connected")


  socket.on("disconnect", () => {
    console.log("A user disconnected")
  })

  // ai-message

  socket.on('ai-message', async (data) => {
    console.log("Ai message received:", data);

    chatHistory.push({
      role: "user",
      parts: [{ text: data }]
    })

    try {
      const response = await generateResponse(chatHistory)

      chatHistory.push({
        role: "model",
        parts: [{ text: response }]
      })

      socket.emit("ai-message-response", response);
    } catch (error) {
      console.error("AI response failed:", error);
      socket.emit("ai-message-error");
    }

  });


})




const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});