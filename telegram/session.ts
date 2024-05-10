import chalk from "chalk";
import {BunRuntime} from "@effect/platform-bun";
import {ConfigProvider, Console, Effect, pipe} from "effect";
import {Telegram} from "./client.ts";

pipe(
    Effect.gen(function* (_) {
        const client = yield* _(Telegram);

        yield* Console.log(chalk.bold.red("====> YOUR SESSION, STORE IT SECURELY!!! <===="))
        yield* Console.log(chalk.bold.green(client.client.session.save()))
        yield* Console.log(chalk.bold.red("====> YOUR SESSION, STORE IT SECURELY!!! <===="))
    }),
    Effect.provide(Telegram.live),
    Effect.withConfigProvider(ConfigProvider.fromEnv()),
    BunRuntime.runMain
)