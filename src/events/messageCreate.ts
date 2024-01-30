import { Client, Guild, GuildMember } from "discord.js";
import { access_roleId, errHandler, sequelize } from "..";
import { add_member_to_group, change_group_leader, change_group_name, create_group, delete_group, get_group_info, kick_member_from_group } from "../services/groupServices";

export const message_create_listener = (client: Client) => {
    client.on('messageCreate', async msg => {
        try{
          if(msg.author.bot) return;
          if(!msg.content.toLowerCase().startsWith('!chatroom') && !msg.content.toLowerCase().startsWith('!cr')) return;
          if(!msg.guild) return;

          if(!msg.member) return;

          if(!msg.member.roles.cache.has(access_roleId)){
            await msg.reply(`> Hi there! This feature is only available for Kai Royality members.`);
            return;
          }

          const args = msg.content.toLowerCase().split(" ");

          switch(args[1]){
            case "create":
                let name = args[2];
                if(!name){
                    await msg.reply(`> Usage: \`!chatroom create name users\``);
                    return;
                }

                let userIds = args.slice(3).map(v => v.replaceAll('<@', '').replaceAll('>', ''));
                //checking if the userIds are correct
                userIds.push(msg.author.id);

                if(userIds.length === 0){
                    await msg.reply(`> Usage: \`!chatroom create name users\``);
                    return;
                }

                for(let userId of userIds){
                    try{
                        let user = await client.users.fetch(userId);
                        if(!user) throw new Error();
                    }catch(err: any){
                        await msg.reply(`> Provided UserId "${userId}" Incorrect.`)
                        return;
                    }
                }

                const response = await create_group(msg.author.id, userIds, msg.guild as Guild, name)

                await msg.reply(response);
                return;

            case "delete":
                const response1 = await delete_group(msg.channelId, msg.member as GuildMember);
                await msg.reply(response1);
                return;
            case "info":
                const response2 = await get_group_info(msg.channelId)
                await msg.reply(response2);
                return;
            case "add":
                let toAdd = args[2];
                if(!toAdd){
                    await msg.reply(`> Usage: \`!chatroom add userId\``)
                    return;
                }
                const response3 = await add_member_to_group(msg.channelId, toAdd.replaceAll('<@', '').replaceAll('>', ''));
                await msg.reply(response3);
                return;

            case "remove":
            let toRemove = args[2];
                if(!toRemove){
                    await msg.reply(`> Usage: \`!chatroom remove userId\``)
                    return;
                }
                const response4 = await kick_member_from_group(msg.channelId, toRemove.replaceAll('<@', '').replaceAll('>', ''), msg.member as GuildMember);
                await msg.reply(response4);
                return;
            case "rename":
                let newName = args[2];
                if(!newName){
                    await msg.reply(`> Usage: \`!chatroom rename name\``)
                    return;
                }
                const response5 = await change_group_name(msg.channelId, newName);
                await msg.reply(response5);
                return;
            case "leader": 
            let newLeader = args[2];
                if(!newLeader){
                    await msg.reply(`> Usage: \`!chatroom leader userId\``)
                    return;
                }
                const response6 = await change_group_leader(msg.channelId, newLeader.replaceAll('<@', '').replaceAll('>', ''), msg.member as GuildMember);
                await msg.reply(response6);
                return;
            case "help":
                await msg.reply(`> :pencil: **Chatroom Commands**
                > 
                > > \`!chatroom create [room_name] [members]\` :star2: Creates a new chatroom with the specified name.
                > 
                > > \`!chatroom delete\` :no_entry_sign: Deletes the chatroom, removing it permanently.
                > 
                > > \`!chatroom info\` :information_source: Provides information about the chatroom, including its members and leader.
                > 
                > > \`!chatroom add [userId/mention]\` :heavy_plus_sign: Adds the mentioned user to the chatroom.
                > 
                > > \`!chatroom remove [userId/mention]\` :heavy_minus_sign: Removes the mentioned user from the chatroom.
                > 
                > > \`!chatroom leader [userId/mention]\` :crown: Sets the mentioned user as the leader of the chatroom.`);
                return;
          }

        }catch(err: any){
            console.log("Err at /events/messageCreate.ts/message_create_listener()");
            console.log(err);
            errHandler(err, msg)
        }
    })
}


