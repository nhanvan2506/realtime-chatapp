import {ENV} from "./env.js";
import arcjet, { shield, detectBot, slidingWindow } from "@arcjet/node";

const isDev = ENV.NODE_ENV === "development";

const aj = arcjet({
  key: ENV.ARCJET_KEY,
  rules: [
    shield({ mode: isDev ? "DRY_RUN" : "LIVE" }),
    detectBot({
      mode: isDev ? "DRY_RUN" : "LIVE",
      allow: [
        "CATEGORY:SEARCH_ENGINE",
      ],
    }),
    slidingWindow({
        mode: isDev ? "DRY_RUN" : "LIVE",
        max: 100,
        interval: 2,
    }),
  ],
});

export default aj;