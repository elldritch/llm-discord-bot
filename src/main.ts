import { ChannelType, Client, Events, GatewayIntentBits } from "discord.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.once(Events.ClientReady, async (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
  const channels = [...client.channels.cache.entries()];
  // console.log(channels);

  const general = client.channels.cache.get("1308247073124126842");
  if (!general) {
    throw new Error("Could not find #general channel");
  }
  if (general.type !== ChannelType.GuildText) {
    throw new Error("#general channel is not a text channel");
  }
  // console.log(general.messages)
  // // general.send("test test test");

  const messages = await general.messages.fetch({
    limit: 100
  })
  console.log(messages);
});

await client.login(process.env.DISCORD_BOT_TOKEN);
