# Business Logic Exercise - R2

In this exercise, we'll be using the Workers AI, Workers KV, and Workers R2 bindings to implement our card generation logic. This version of the exercise uses the free plan, but requires inputting your payment information to use the free tier of R2. Although we recommend the R2 version of the exercise, if you prefer to avoid inputting your payment information, see the KV-only version of this exercise at `02-business-logic/kv/README.md`.

## Running our tests

Currently, we have a few sample tests for a worker that reads and writes from KV. Let's try running these tests:

```sh
npm run test
```

You should see a passing test result, which looks like this:

```
 Test Files  1 passed (1)
      Tests  6 passed (6)
```

## Exercise: implementing the CardManager class

### `CardManager`

We're going to abstract our card manager into a class to wrap our card generation & management functionality. This allows us to dependency inject our test bindings for easier testing. To do this, let's open `card-manager-r2.ts`, which has the following interface:

```ts
export class CardManagerR2 implements CardManager {
  async generateAndSaveCard(
    card: Pick<Card, "title" | "description">
  ): Promise<string> {
    // TODO
    throw new Error("Unimplemented");
  }

  async generateCardImage(
    card: Pick<Card, "title" | "description">
  ): Promise<ReadableStream<Uint8Array>> {
    // TODO
    throw new Error("Unimplemented");
  }

  async getCard(cardId: string): Promise<Card | null> {
    // TODO
    throw new Error("Unimplemented");
  }

  async getCardImage(
    cardId: string
  ): Promise<ReadableStream<Uint8Array> | null> {
    // TODO
    throw new Error("Unimplemented");
  }
}
```

### `CardManager` tests

We can also see `card-manager-r2.test.ts`, which has stubbed out tests for each method in our `CardManager`. Let's implement the tests & functionality for each method. You can implement these in any order you like, but we suggest starting with tests and then implementing the functionality, both marked with `TODO` comments.

```ts
afterEach(() => {
  vi.spyOn(env.AI, "run").mockRestore();
});

describe("test CardManagerR2 class", () => {
  const cardManager = new CardManagerR2(env);

  it("generateAndSaveCard()", async () => {
    // TODO
  });

  it("generateCardImage()", async () => {
    // TODO
  });

  it("getCard(): null card", async () => {
    // TODO
  });

  it("getCard(): non-null card", async () => {
    // TODO
  });

  it("getCardImage(): null card", async () => {
    // TODO
  });

  it("getCardImage(): non-null card", async () => {
    // TODO
  });
});
```

We've already done the necessary configuration setting up your vitest config. We've added the following bindings for testing purposes:

- `kvNamespaces` and `r2Buckets` attributes create new test bindings for KV and R2
- `wrappedBindings` defines a mocked version of Workers AI because there isn't local support for Workers AI. In our tests, we'll be able to use `vi.spyOn(...)` to mock the return values of the AI binding

### Step 1 - Implement and test `generateCardImage`

- Implement `generateCardImage`
  - You'll need to use the [Workers AI binding to generate an image](https://developers.cloudflare.com/workers-ai/models/stable-diffusion-xl-base-1.0)
  - You might need to do a bit of prompt engineering. We used the following prompt:

```
Based on the following title and description, generate card artwork for a trading card
title: ...
description: ...
```

- Test `generateCardImage`
  - You can use `vi.spyOn(env.AI, 'run').mockImplementation(...)` to mock the implementation of the AI binding. You can use this to mock returning some sample data

### Step 2 - Implement and test `generateAndSaveCard`

- Implement `generateAndSaveCard`
  - Writing the card metadata as a key value pair [using the KV API](https://developers.cloudflare.com/kv/api/write-key-value-pairs/) We stored it as JSON in KV like so:

```json
{
  "title": "...",
  "description": "...",
  "imageUrl": "/image/<CARD_ID>"
}
```

- Write the card image data [using the R2 API](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/). We stored it as an `arrayBuffer`
  - You'll need to convert the `ReadableStream<Uint8Array>` from the generateCardImage function to a statically sized `Uint8Array`. You can use the helper function `convertReadableStreamToUint8Array` in `utils.ts` to do this for you.

### Step 3 - Implement and test `getCard`

- Implement `getCard`
  - Here's some useful documentation on [reading data from KV](https://developers.cloudflare.com/kv/api/read-key-value-pairs/)
- Test `getCard`
  - You'll need to put some sample data into KV, either using the sample functions above, or manually writing the data into KV

### Step 4 - Implement and test `getCardImage`

- Implement `getCardImage`
  - Here's some useful documentation on [reading data from R2](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/)
- Test `getCardImage`
  - You'll need to put some sample image data into R2, either using the sample functions above, or manually writing the data into R2
