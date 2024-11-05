import { convertReadableStreamToUint8Array, isCard } from "./utils";

/**
 * Trading card manager class that wraps KV, R2, and Workers AI. Handles all of our "business" logic
 */
export class CardManagerR2 implements CardManager {
  constructor(private env: Env) {}

  async generateAndSaveCard(
    card: Pick<Card, "title" | "description">
  ): Promise<string> {
    const key = crypto.randomUUID();

    const cardData = await this.generateCardImage(card);

    // we don't know the length of the readable stream returned from ai.run(),
    // so we need to read it all into a buffer so we can use it in env.R2.put()
    const arrayBuffer = await convertReadableStreamToUint8Array(cardData);

    await Promise.all([
      this.env.R2.put(key, arrayBuffer),
      this.env.KV.put(key, JSON.stringify(card)),
    ]);

    return key;
  }

  async generateCardImage(
    card: Pick<Card, "title" | "description">
  ): Promise<ReadableStream<Uint8Array>> {
    // create prompt
    const input = {
      prompt: [
        `Based on the following title and description, generate card artwork for a trading card`,
        `title: ${card.title}`,
        `description: ${card.description}`,
      ].join("\n"),
    };

    // generate image data from aiBinding
    const imageData = await this.env.AI.run(
      "@cf/stabilityai/stable-diffusion-xl-base-1.0",
      input
    );

    return imageData;
  }

  async getCard(cardId: string): Promise<Card | null> {
    const partialCard = await this.env.KV.get<Omit<Card, "imageUrl">>(
      cardId,
      "json"
    );

    if (!partialCard) {
      // key not found
      return null;
    }

    const card = {
      ...partialCard,
      imageUrl: `/image/${cardId}`,
    };

    if (!isCard(card)) {
      throw new Error("Invalid card returned from KV");
    }

    return card;
  }

  async getCardImage(
    cardId: string
  ): Promise<ReadableStream<Uint8Array> | null> {
    const r2Obj = await this.env.R2.get(cardId);
    return r2Obj?.body ?? null;
  }
}
