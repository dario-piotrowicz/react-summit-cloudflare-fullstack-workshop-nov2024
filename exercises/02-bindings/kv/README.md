# Bindings & Deployment

In this exercise, we'll configuring some bindings and deploying our worker

## Bindings

Before starting our code, we need to do some setup to configure the Workers bindings we're using. In Workers, bindings combine the permissions and API of the worker into one piece, like an environment variable which has the API of a service embedded into it. Create a binding for your Worker, grants it a specific capability (i.e. R2, KV, Workers AI).

### Benefits of bindings

There are multiple benefits to this model:

- Lower security risks because you can't accidentally leak an API token
- No boilerplate needed to initialize your API client
- Easier to understand what resources are being used

> [!NOTE]
> For more reading check out [this blog on why bindings are live objects](https://blog.cloudflare.com/workers-environment-live-object-bindings/)

## AI Binding

Our AI binding is already set up for you:

```toml
[ai]
binding = "AI"
```

This just automatically instantiates an API on the Worker's `env` variable, with no setup code or API tokens needed.

### Creating a KV namespace

Let's create a namespace with wrangler (the CLI for the CF dev plat) and add it to our wrangler.toml

```sh
# make sure you've logged in using `npx wrangler login`
npx wrangler kv namespace create trading-cards
```

```toml
[[kv_namespaces]]
binding = "KV"
id = "<NAMESPACE_ID>"
```

We'll be using this KV namespace binding later to store our trading card metadata and image data. We won't be using R2 in this example, so keep the `[[r2_buckets]]` section commented out.

### Generating types from bindings

To automatically generate Typescript types from the bindings you just added, run:

```sh
npm run build
npm run cf-typegen
```

The final types generated should show up in `worker-configuration.d.ts`

## Deployment

Now lets try deploying our worker with these bindings. To do that, lets run

```sh
# this runs our build command and `wrangler deploy`
npm run deploy
```

You should see an output like this:

```
[...]
Total Upload: 2202.50 KiB / gzip: 365.43 KiB
Worker Startup Time: 27 ms
Your worker has access to the following bindings:
- KV Namespaces:
  - KV: 33b04eede7b04caf81257b09f3bbf53a
- AI:
  - Name: AI
Uploaded react-summit-cloudflare-fullstack-workshop-nov2024 (7.48 sec)
Deployed react-summit-cloudflare-fullstack-workshop-nov2024 triggers (0.19 sec)
  https://react-summit-cloudflare-fullstack-workshop-nov2024.cmsparks.workers.dev
Current Version ID: 93a5fee6-8c84-46db-950e-010d311c3988
```

You can click the link to navigate to your live site. Let's also look in the Cloudflare Dashboard to verify that we deployed with our correct bindings. If you go to this link `https://dash.cloudflare.com/<YOUR_ACCOUNT_ID>/workers-and-pages`, you should see a new entry in the top of the list. Navigate to: `<WORKER_NAME> > Settings > Bindings` and you should see the bindings we just created via Wrangler.
