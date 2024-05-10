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

export type BoostActive = Schema.Schema.Type<typeof BoostActive>;

export const BoostActive = Schema.Struct({
    id: Schema.Number,
    metaId: Schema.Number,
    level: Schema.Number,
})

export type BoostMeta = Schema.Schema.Type<typeof BoostMeta>;

export const BoostMeta = Schema.Struct({
    id: Schema.Number,
    name: Schema.String,
    description: Schema.String,
    iconEmoji: Schema.String,
    type: Schema.String,
    power: Schema.Number,
    price: Schema.Number,
    priceModifier: Schema.Number,
})

export const ActiveBoosts = Schema.Struct({
    items: Schema.Array(BoostActive)
})

export const AllBoosts = Schema.Struct({
    items: Schema.Array(BoostMeta)
})

export const Click = Schema.Struct({
    count: Schema.Number,
    currentEnergy: Schema.Number,
    lastClickSeconds: Schema.Number,
})

export type Boost = {
    id: number
    name: string
    icon: string
    type: string
    level: number
    price: number
    grow: number
    eps: number
    eph: number
    pfs: number
    pfh: number
}