import { Client } from "discord.js";
import { errHandler, sequelize } from "..";

export const message_create_listener = (client: Client) => {
    client.on('messageCreate', async msg => {
        try{
           
        }catch(err: any){
            console.log("Err at /events/messageCreate.ts/message_create_listener()");
            console.log(err);
            errHandler(err, msg)
        }
    })
}


