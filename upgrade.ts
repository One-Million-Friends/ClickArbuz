import {BunRuntime} from "@effect/platform-bun";
import {ConfigProvider, Effect, pipe, Schedule} from "effect";
import {constVoid} from "effect/Function";
import {getBoosts, getProfile, upgradeBoost} from "./game/api.ts";
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

    const profile = yield* getProfile(tgWebAppData)
    if (profile.banned) {
        console.log("🛑 BANNED!!!")
        return Effect.none;
    }

    console.log("🤠PROFILE:", profile.fullName, "💎", profile.clicks)

    return yield* Effect.repeat(Effect.gen(function* (_) {
        const boosts = yield* getBoosts(tgWebAppData)
        const sorted = boosts
            // .filter((boost) => boost.type === "MINER")
            .sort((a, b) => a.pfs - b.pfs)
        const best = sorted[0]

        yield* upgradeBoost(tgWebAppData, best.id)
        console.log("✅UPGRADED:", best.name, best.level, "=>", best.level + 1)
    }), Schedule.forever)
})

const policy = Schedule.addDelay(Schedule.forever, () => "5 minutes")

const program = Effect.match(upgrade, {
    onFailure: constVoid,
    onSuccess: constVoid
})

pipe(
    Effect.repeat(program, policy),
    Effect.provide(Telegram.live),
    Effect.withConfigProvider(ConfigProvider.fromEnv()),
    BunRuntime.runMain
)