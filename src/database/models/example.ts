import { Sequelize, INTEGER } from "sequelize";

export const model = (sequelize: Sequelize) => {
    sequelize.define('example', {
        test: {
            type: INTEGER
        }
    }, {timestamps: false})
}