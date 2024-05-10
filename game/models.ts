import {Schema} from "@effect/schema";

export const Profile = Schema.Struct({
    id: Schema.Number,
    username: Schema.String,
    fullName: Schema.String,
    energy: Schema.Number,
    energyLimit: Schema.Number,
    clicks: Schema.Number,
    clickBoostSum: Schema.Number,
    energyBoostSum: Schema.Number,
    minerBoostSum: Schema.Number,
    banned: Schema.Boolean,
    researchPoints: Schema.Number,
    lastClickSeconds: Schema.Number,
})

export const Click = Schema.Struct({
    count: Schema.Number,
    currentEnergy: Schema.Number,
    lastClickSeconds: Schema.Number,
})