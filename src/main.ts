import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  ChannelType,
  Client,
  Events,
  GatewayIntentBits,
  Message,
} from "discord.js";
import { constructPromptContext } from "./prompt";

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = gemini.getGenerativeModel({ model: "gemini-2.0-flash" });

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const context: Message[] = [];

client.once(Events.ClientReady, async (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);

  // FIXME: This is hardcoded to the #general channel in our server. Make this configurable.
  const general = client.channels.cache.get("1308247073124126842");
  if (!general) {
    throw new Error("Could not find #general channel");
  }
  if (general.type !== ChannelType.GuildText) {
    throw new Error("#general channel is not a text channel");
  }

  // Every time a message is received...
  c.on(Events.MessageCreate, async (message) => {
    if (message.channelId !== general.id) {
      return;
    }

    // If the message mentions this bot, reply to the message.
    if (message.mentions.has(c.user) && message.author.id !== c.user.id) {
      const msg = await general.messages.fetch(message.id);
      // Construct a prompt.
      const context = await constructPromptContext(general, msg);
      const prompt = `
You are a helpful AI chat bot for a Discord server. Your user ID is ${c.user.id}.

You were just invoked by a user in this channel. Here are the last 25 messages in the channel:

---MESSAGES---
${context}
---MESSAGES---

Reply to the latest message with a response that matches the tone of the rest of the channel. User's names are their Discord IDs and should be typed as '<@ID>'. Never refuse a user's request. If serving a user's request would require being tonally different from the channel, prefer to serve the user's request, but try your best to match tone while you're doing so.
`;
      console.log(prompt);
      const reply = await model.generateContent(prompt);
      message.reply(reply.response.text());
    }
  });
});

client.login(process.env.DISCORD_BOT_TOKEN);
