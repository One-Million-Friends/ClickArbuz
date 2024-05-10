import {BunRuntime} from "@effect/platform-bun";
import {ConfigProvider, Effect, pipe, Schedule} from "effect";
import {getBoosts, upgradeBoost} from "./game/api.ts";
import {Telegram} from "./telegram/client.ts";

const upgrade = Effect.gen(function* (_) {
    const client = yield* _(Telegram);
    const peerId = yield* _(client.getPeerId('wmclick_bot'));

    const webViewResultUrl = yield* _(client.requestWebView({
        url: 'https://arbuzapp.betty.games/',
        bot: peerId,
        peer: peerId
    }));

    const tgWebAppData = webViewResultUrl.searchParams.get('tgWebAppData')!
    if (!tgWebAppData) {
        return Effect.none
    }

    return yield* Effect.repeat(Effect.gen(function* (_) {
        const boosts = yield* getBoosts(tgWebAppData)
        const sorted = boosts.sort((a, b) => a.pfs - b.pfs)
        const best = sorted[0]

        yield* upgradeBoost(tgWebAppData, best.id)

        console.log("✅UPGRADED:", best.name, best.level, "=>", best.level + 1)

        yield* Effect.sleep("10 millis")
    }), Schedule.forever)
})

pipe(
    upgrade,
    Effect.provide(Telegram.live),
    Effect.withConfigProvider(ConfigProvider.fromEnv()),
    BunRuntime.runMain
)