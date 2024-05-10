import {Config, Context, Effect, Layer, Secret} from 'effect';
import {Api, TelegramClient} from 'telegram';
import {StringSession} from 'telegram/sessions';
import RequestWebView = Api.messages.RequestWebView;
import StartBot = Api.messages.StartBot;
import GetHistory = Api.messages.GetHistory;
import JoinChannel = Api.channels.JoinChannel;

const acquire = Effect.gen(function* () {
    const app = yield* Config.number('TG_API_ID');
    const hash = yield* Config.secret('TG_API_HASH');
    const session = yield* Config.secret('TG_SESSION_STRING');

    const client = new TelegramClient(new StringSession(Secret.value(session)), app, Secret.value(hash), {
        useIPV6: false,
        connectionRetries: 3,
    });

    yield* Effect.tryPromise(() => client.connect());

    const me: Api.User = yield* Effect.promise(() => client.getMe());
    yield* Effect.annotateLogsScoped({phone: me.phone, username: me.username, premium: me.premium})
    yield* Effect.logInfo("Connected to telegram")

    function getPeerId(entity: Api.TypeEntityLike) {
        return Effect.promise(() => client.getPeerId(entity));
    }

    function requestWebView(args: Pick<RequestWebView, 'url' | 'bot' | 'peer'>) {
        return Effect.promise(() => client.invoke(new RequestWebView({
            url: args.url,
            bot: args.bot,
            peer: args.peer,
            silent: true,
            platform: 'ios'
        })))
            .pipe(Effect.map(({url}) => {
                return new URL(url.replace('#tgWebAppData', '?tgWebAppData'))
            }));
    }

    function startBot(args: Pick<StartBot, | 'bot' | 'peer' | 'startParam'>) {
        return Effect.promise(() => client.invoke(new StartBot(args)));
    }

    function history(args: Pick<GetHistory, | 'peer' | 'offsetDate' | 'limit' | 'hash'>) {
        return Effect.promise(() => client.invoke(new GetHistory(args)));
    }

    function joinChannel(channel: Api.TypeEntityLike) {
        return Effect.promise(() => client.invoke(new JoinChannel({channel})));
    }

    return {me, client, getPeerId, requestWebView, startBot, history, joinChannel};
});

const release = ({client}: { client: TelegramClient }) => Effect.all([
    Effect.promise(() => client.destroy()),
    Effect.sleep("200 millis")
]);

const make = Effect.acquireRelease(acquire, release);

export class Telegram extends Context.Tag('Telegram')<Telegram, Effect.Effect.Success<typeof make>>() {
    static live = make.pipe(Layer.scoped(this));
}
