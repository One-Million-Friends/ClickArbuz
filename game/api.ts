import * as Http from "@effect/platform/HttpClient";
import {Effect} from "effect";
import {ActiveBoosts, AllBoosts, type BoostMeta, type BoostActive, Click, Profile, type Boost} from "./models.ts";

export const getProfile = (tgWebAppData: string) => Http.request.get("https://arbuz.betty.games/api/users/me").pipe(
    Http.request.setHeader("User-Agent", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148"),
    Http.request.setHeader("X-Telegram-Init-Data", tgWebAppData),
    Http.client.fetchOk,
    Effect.andThen(Http.response.schemaBodyJson(Profile)),
    Effect.scoped,
)

export const getActiveBoosts = (tgWebAppData: string) => Http.request.get("https://arbuz.betty.games/api/boosts/active").pipe(
    Http.request.setHeader("User-Agent", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148"),
    Http.request.setHeader("X-Telegram-Init-Data", tgWebAppData),
    Http.client.fetchOk,
    Effect.andThen(Http.response.schemaBodyJson(ActiveBoosts)),
    Effect.map(r => r.items),
    Effect.scoped,
)

export const getAllBoosts = (tgWebAppData: string) => Http.request.get("https://arbuz.betty.games/api/boosts/metas").pipe(
    Http.request.setHeader("User-Agent", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148"),
    Http.request.setHeader("X-Telegram-Init-Data", tgWebAppData),
    Http.client.fetchOk,
    Effect.andThen(Http.response.schemaBodyJson(AllBoosts)),
    Effect.map(r => r.items),
    Effect.scoped,
)

export const getBoosts = (tgWebAppData: string) => Effect.all([
    getActiveBoosts(tgWebAppData),
    getAllBoosts(tgWebAppData)
])
    .pipe(Effect.map(([levels, metas]) => {
        type BoostMetaId = number

        const levelsMap = new Map<BoostMetaId, BoostActive>()
        for (const item of levels) {
            levelsMap.set(item.metaId, item)
        }

        const metasMap = new Map<BoostMetaId, BoostMeta>()
        for (const item of metas) {
            metasMap.set(item.id, item)
        }

        const boosts: Array<Boost> = []

        for (const [, {id, metaId, level}] of levelsMap) {
            const meta = metasMap.get(metaId)!

            let eps = 0
            let eph = 0

            const grow = meta.price * meta.priceModifier
            const price = level * meta.price * meta.priceModifier

            switch (meta.type) {
                case "ENERGY_RECOVERY":
                    continue
                case "CLICK_POWER":
                    // power = earn per click
                    // for clicks: 20 clicks per second
                    eps = meta.power * 20
                    eph = eps * 60 * 60
                    break
                case "MINER":
                    // power = earn per second
                    eps = meta.power
                    eph = eps * 60 * 60
                    break
            }

            // The price for 1 second of mining
            const pfs = (price + grow) / eps

            // The price for 1 hour of mining
            const pfh = (price + grow) / eph

            boosts.push({
                id,
                name: meta.name,
                icon: meta.iconEmoji,
                type: meta.type,
                price,
                level,
                grow,
                eps,
                eph,
                pfs,
                pfh
            })
        }

        return boosts
    }))

export const purchaseBoost = (tgWebAppData: string, metaId: number) => Http.request.post("https://arbuz.betty.games/api/boosts/purchase").pipe(
    Http.request.setHeader("User-Agent", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148"),
    Http.request.setHeader("X-Telegram-Init-Data", tgWebAppData),
    Http.request.jsonBody({
        "metaId": metaId
    }),
    Effect.andThen(Http.client.fetchOk),
    Effect.scoped,
)

export const upgradeBoost = (tgWebAppData: string, boostId: number) => Http.request.post("https://arbuz.betty.games/api/boosts/upgrade").pipe(
    Http.request.setHeader("User-Agent", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148"),
    Http.request.setHeader("X-Telegram-Init-Data", tgWebAppData),
    Http.request.jsonBody({
        "boostId": boostId
    }),
    Effect.andThen(Http.client.fetchOk),
    Effect.scoped,
)

export const click = (tgWebAppData: string, count: number, hash: string) => Http.request.post("https://arbuz.betty.games/api/click/apply").pipe(
    Http.request.setHeader("Content-Type", "application/json"),
    Http.request.setHeader("X-Telegram-Init-Data", tgWebAppData),
    Http.request.jsonBody({
        "count": count,
        "hash": hash
    }),
    Effect.andThen(Http.client.fetchOk),
    Effect.andThen(Http.response.schemaBodyJson(Click)),
    Effect.scoped,
)
