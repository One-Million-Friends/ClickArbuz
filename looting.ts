import {BunRuntime} from "@effect/platform-bun";
import {ConfigProvider, Effect, pipe, Schedule} from "effect";
import {constVoid} from "effect/Function";
import {activateReceipt, getProfile} from "./game/api.ts";
import {Telegram} from "./telegram/client.ts";

const seen = new Set<string>(["TrUEXoRgvv"])

const chats = [
    "-1002137310262",
    "-1001734166044",
]

const looting = (chatId: string) => Effect.gen(function* (_) {
    const client = yield* _(Telegram);
    const peerId = yield* _(client.getPeerId('wmclick_bot'));

    const webViewResultUrl = yield* client.requestWebView({
        url: `https://arbuzapp.betty.games/`,
        bot: peerId,
        peer: peerId,
    })

    const tgWebAppData = webViewResultUrl.searchParams.get('tgWebAppData')!
    if (!tgWebAppData) {
        return Effect.none
    }

    const profile = yield* getProfile(tgWebAppData)
    if (profile.banned) {
        console.log("🛑BANNED!!!")
        return Effect.none;
    }

    // @ts-ignore
    const history = yield* client.history({
        peer: yield* _(client.getPeerId(chatId)),
        limit: 5,
        addOffset: -1,
        offsetDate: Math.floor((new Date()).getTime() / 1000),
    })

    switch (history.className) {
        case "messages.ChannelMessages":
            for (const message of history.messages) {
                switch (message.className) {
                    case "Message":
                        for (const entity of message.entities || []) {
                            switch (entity.className) {
                                case "MessageEntityUrl":
                                    // Check if message contains t.me/wmclick_bot/click?startapp=ref_****_receipt_****
                                    const re = new RegExp(/ref_\S+_receipt_(\S+)/)

                                    const url = message.rawText.slice(entity.offset, entity.offset + entity.length)
                                    const result = re.exec(url)
                                    const receipt = result?.[1]

                                    if (receipt) {
                                        if (seen.has(receipt)) {
                                            return
                                        }

                                        console.log("🎯RECEIPT:", receipt)

                                        const r = yield* activateReceipt(tgWebAppData, receipt)
                                        if (r.status < 400) {
                                            console.log("✅ACTIVATED:", receipt)
                                        } else {
                                            console.log("‼️FAILED:", receipt)
                                        }

                                        seen.add(receipt)
                                    }
                            }
                        }
                }
            }
    }
})

const policy = Schedule.addDelay(Schedule.forever, () => "1 seconds")

pipe(
    Effect.forEach(chats, (chatId) => {
        const program = Effect.match(looting(chatId), {
            onFailure: constVoid,
            onSuccess: constVoid
        })

        return Effect.repeat(program, policy)
    }, {concurrency: "unbounded"}),
    Effect.provide(Telegram.live),
    Effect.withConfigProvider(ConfigProvider.fromEnv()),
    BunRuntime.runMain
)