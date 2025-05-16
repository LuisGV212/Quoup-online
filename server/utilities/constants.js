const CardNames = {
    ADMIN: "admin",
    SYSTEM_ADMIN: "system_admin",
    PM: "pm",
    CONTRACTOR: "contractor",
    ROOT_USER: "root_user",
    values: function () {
        return [this.ADMIN, this.SYSTEM_ADMIN, this.PM, this.CONTRACTOR, this.ROOT_USER]
    }
};
 
const Actions = {
    basic_access: {
        influence: "all",
        blockableBy: [],
        isChallengeable: false,
        moneyDelta: 1
    },
    guest_access: {
        influence: "all",
        blockableBy: [CardNames.ADMIN],
        isChallengeable: false,
        moneyDelta: 2
    },
    delete_user: {
        influence: "all",
        blockableBy: [],
        isChallengeable: false,
        moneyDelta: -7
    },
    collect_tokens: {
        influence: CardNames.ADMIN,
        blockableBy: [],
        isChallengeable: true,
        moneyDelta: 3
    },
    deactivate_user: {
        influence: CardNames.SYSTEM_ADMIN,
        blockableBy: [CardNames.ROOT_USER],
        isChallengeable: true,
        moneyDelta: -3
    },
    exchange_roles: {
        influence: CardNames.CONTRACTOR,
        blockableBy: [],
        isChallengeable: true,
        moneyDelta: 0
    },
    transfer_tokens: {
        influence: CardNames.PM,
        blockableBy: [CardNames.CONTRACTOR, CardNames.PM],
        isChallengeable: true,
        moneyDelta: 2
    }
};

const CounterActions = {
    block_guest_access: {
        influences: [CardNames.ADMIN]
    },
    block_transfer: {
        influences: [CardNames.CONTRACTOR, CardNames.PM]
    },
    block_deactivate: {
        influences: [CardNames.ROOT_USER]
    },
};

module.exports = {
    CardNames: CardNames,
    Actions: Actions,
    CounterActions: CounterActions,
}