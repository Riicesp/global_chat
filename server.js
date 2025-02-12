const express = require("express");
const axios = require("axios");
const { Client, GatewayIntentBits } = require("discord.js");

const app = express();
const port = 6000;

app.use(express.json());


let chats = {
  "Servidor_1": [],
  "Servidor_2": [],
  "Servidor_3": [],
  "Discord": []  
};

let messageId = 1;  


const DISCORD_TOKEN = "REPLACE_WITH_BOT_TOKEN";
const DISCORD_CHANNEL_ID = "REPLACE_WITH_CHANNEL_ID";

const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

discordClient.once("ready", () => {
  console.log(`Discord Bot conectado como ${discordClient.user.tag}`);
});


discordClient.on("messageCreate", async (message) => {
  
  if (message.channel.id !== DISCORD_CHANNEL_ID || message.author.bot) return;

  
  const newMessage = {
    id: messageId++,
    player: message.author.username,
    text: message.content,
    server: "Discord"
  };

  console.log(`[Chat Global] Mensaje recibido en Discord: ${message.author.username}: ${message.content}`);

  
  for (let serv in chats) {
    if (serv !== "Discord") {
      chats[serv].push(newMessage);
    }
  }
});

discordClient.login(DISCORD_TOKEN);


app.post("/chat", (req, res) => {
  const { player, text, server } = req.body;

  if (!chats[server]) {
    return res.status(400).json({ error: "Servidor no reconocido" });
  }

  const newMessage = { id: messageId++, player, text };

  console.log(`[Chat Global] Mensaje recibido en ${server}: ${player}: ${text}`);

  
  for (let serv in chats) {
    if (serv !== server) {
      chats[serv].push(newMessage);

      
      if (serv === "Discord") {
        const channel = discordClient.channels.cache.get(DISCORD_CHANNEL_ID);
        if (channel) {
          channel.send(`[Chat Global] ${newMessage.player}: ${newMessage.text}`);
        } else {
          console.error("No se encontró el canal de Discord.");
        }
      }
    }
  }

  res.json({ success: true });
});


app.get("/messages", (req, res) => {
  const { server, last_id } = req.query;
  if (!chats[server]) {
    return res.status(400).json({ error: "Servidor no reconocido" });
  }

  const lastId = parseInt(last_id) || 0;
  const newMessages = chats[server].filter(msg => msg.id > lastId);

  res.json(newMessages);
});


app.listen(port, () => {
  console.log(`Servidor HTTP escuchando en http://localhost:${port}`);
});
