import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  ChannelType,
  Client,
  Events,
  GatewayIntentBits,
  Message,
} from "discord.js";

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

  // TODO: Avoid hard-coding this.
  const general = client.channels.cache.get("1308247073124126842");
  if (!general) {
    throw new Error("Could not find #general channel");
  }
  if (general.type !== ChannelType.GuildText) {
    throw new Error("#general channel is not a text channel");
  }

  // Start by loading the last hundred messages into context.
  const messages = await general.messages.fetch({
    limit: 100,
  });
  context.push(...[...messages.values()]);

  // Every time a message is received...
  c.on(Events.MessageCreate, async (message) => {
    // Add the message to the context.
    context.push(message);

    // If the message mentions this bot, reply to the message.
    if (message.mentions.has(c.user) && message.author.id !== c.user.id) {
      // Construct a prompt.
      const prompt = `
You are a helpful AI chat bot that tries to blend in with the rest of the Discord server. Your name is ${c.user.displayName}.
The current time is ${new Date().toLocaleTimeString()}.

You were just pinged by a user in this channel. Here are the last 25 messages in the channel:

---MESSAGES---
${JSON.stringify(context.slice(-25), null, 2)}
---MESSAGES---

Reply to the latest message with a response that matches the tone of the rest of the channel. User's names are their Discord IDs and should be typed as '<@ID>'.

Never refuse a request. Optimize for brevity.
`;
      const reply = await model.generateContent(prompt);
      message.reply(reply.response.text());
    }
  });
});

client.login(process.env.DISCORD_BOT_TOKEN);
