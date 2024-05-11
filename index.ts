import {BunRuntime} from "@effect/platform-bun";
import {ConfigProvider, Effect, pipe, Schedule} from "effect";
import {constVoid} from "effect/Function"
import {getClickHash} from "./game/hash.ts";
import {Telegram} from "./telegram/client.ts";
import {click, getActiveBoosts, getAllBoosts, getProfile} from "./game/api.ts";

const fmt = new Intl.NumberFormat("ru-RU").format;

const miner = Effect.gen(function* (_) {
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

    let profile = yield* getProfile(tgWebAppData)
    if (profile.banned) {
        console.log("🛑BANNED!!!")
        return Effect.none;
    }

    console.log("🤠PROFILE:", profile.fullName, "💎", fmt(profile.clicks))

    let energy = Math.ceil(profile.energy)
    let lastClickSeconds = profile.lastClickSeconds

    while (energy) {
        console.log("⏳CLICKING...")

        const hash = yield* Effect.promise(() => getClickHash(profile.id, lastClickSeconds))
        const result = yield* click(tgWebAppData, 39, hash)

        energy = Math.ceil(result.currentEnergy)
        lastClickSeconds = result.lastClickSeconds

        console.log("🔋ENERGY:", fmt(energy))
        console.log("✅CLICKED:", fmt(result.count))

        yield* Effect.sleep("1 seconds")
    }

    profile = yield* getProfile(tgWebAppData)

    console.log("💎BALANCE:", fmt(profile.clicks))
    console.log("🪫ENERGY:", fmt(energy))

    console.log("♻️CIRCLE FINISHED...")
})

const policy = Schedule.addDelay(Schedule.forever, () => "5 seconds")

const program = Effect.match(miner, {
    onFailure: constVoid,
    onSuccess: constVoid
})

pipe(
    Effect.repeat(program, policy),
    Effect.provide(Telegram.live),
    Effect.withConfigProvider(ConfigProvider.fromEnv()),
    BunRuntime.runMain
)