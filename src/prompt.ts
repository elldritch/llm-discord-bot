import {
  Message,
  MessageReferenceType,
  OmitPartialGroupDMChannel,
  TextChannel,
} from "discord.js";

export async function constructPromptContext(
  channel: TextChannel,
  message: Message<true>
) {
  let before = (
    await channel.messages.fetch({ before: message.id, limit: 25 })
  ).reverse();
  before.set(message.id, message);

  const messages: string[] = [];
  for (const [_, m] of before) {
    const replyingTo = m.reference ? await m.fetchReference() : undefined;
    const o = {
      messageId: m.id,
      authorId: m.author.id,
      timestamp: m.createdTimestamp,
      content: m.content,
      replyingTo: replyingTo
        ? {
            messageId: replyingTo.id,
            authorId: replyingTo.author.id,
            timestamp: replyingTo.createdTimestamp,
            content: replyingTo.content,
          }
        : undefined,
    };
    messages.push(JSON.stringify(o));
  }
  return messages.join("\n");
}
