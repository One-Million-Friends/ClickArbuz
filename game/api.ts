import * as Http from "@effect/platform/HttpClient";
import {Effect} from "effect";
import {Click, Profile} from "./models.ts";

export const getProfile = (tgWebAppData: string) => Http.request.get("https://arbuz.betty.games/api/users/me").pipe(
    Http.request.setHeader("User-Agent", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148"),
    Http.request.setHeader("X-Telegram-Init-Data", tgWebAppData),
    Http.client.fetchOk,
    Effect.andThen(Http.response.schemaBodyJson(Profile)),
    Effect.scoped,
)

export const click = (tgWebAppData: string, count: number, hash: string) => Http.request.post("https://arbuz.betty.games/api/click/apply").pipe(
    Http.request.setHeader("Content-Type", "application/json"),
    Http.request.setHeader("X-Telegram-Init-Data", tgWebAppData),
    Http.request.jsonBody({
        "count": count,
        "hash": hash
    }),
    Effect.andThen(Http.client.fetch),
    Effect.tap(r => {
        if (r.status >= 400) {
            return r.text.pipe(Effect.map(t => console.log(t)))
        }

        return Effect.none
    }),
    Effect.andThen(Http.response.schemaBodyJson(Click)),
    Effect.scoped,
)
