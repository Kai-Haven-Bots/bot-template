import { Sequelize, INTEGER, CHAR, STRING } from "sequelize";

export const model = (sequelize: Sequelize) => {
    sequelize.define('groups', {
        leader: {
            type: CHAR(25),
            allowNull: false
        },
        channelId: {
            type: CHAR(30),
            allowNull: false
        },
        name: {
            type: STRING,
            allowNull: false
        },
        members: {
            type: CHAR(30),
            defaultValue: ''
        }
    }, {timestamps: true})
}