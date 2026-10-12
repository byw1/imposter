# Getting Imposter onto your iPhone

The same three ways as Charades, from "five minutes, free" to the App Store.
You need [Node.js](https://nodejs.org) 22 or newer. Then, once, in this folder:

```sh
npm install
```

## 1. Try it now: free, no Apple account

1. Install **Expo Go** on your iPhone.
2. Run `npm start` on your computer.
3. Point the iPhone's camera at the QR code and tap the banner.

Phone and computer need to be on the same Wi-Fi (or use `npx expo start --tunnel`).
Everything in Imposter works in Expo Go.

## 2. Your own iPhone

Needs the Apple Developer Program ($99/year).

```sh
npx eas-cli@latest login
npx eas-cli@latest init      # links the project to your Expo account
npm run phone:add            # registers your iPhone
npm run phone                # builds an installable app
```

Open the link EAS gives you on the iPhone to install it. The real app never
needs the internet.

## 3. The App Store

```sh
npm run store
```

This builds for production and uploads to App Store Connect (app ID
`6821578816`, listed as **Imposter: Game Night**; the home screen just says
Imposter). Each upload lands in TestFlight first: add testers there, then fill
in the listing and submit for review when you're ready. Before launch, run a clearance search for
the name (see the design system's Legal guardrails): "imposter" is a common
word in this category, so pair it with a distinctive subtitle and Shade.

### The product page

The listing (name, subtitle, promotional text, description, keywords, URLs,
category and age rating) lives in [`store.config.json`](./store.config.json).
Push it to App Store Connect instead of typing it in:

```sh
npx eas-cli@latest metadata:push
```

Screenshots aren't part of that file: `npm run store-art` renders them to
`scripts/store-art/out/`. Upload the seven `appstore-*.png` under the 6.9"
iPhone display; Apple scales them for smaller phones.

Change `ios.bundleIdentifier` and `android.package` in `app.json` if you're
shipping your own copy.
