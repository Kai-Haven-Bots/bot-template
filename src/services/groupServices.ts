import { Guild, GuildChannel, GuildMember, GuildTextBasedChannel } from "discord.js";
import { client, sequelize } from "..";

export const create_group = async (leader: string, members: string [], guild: Guild, name: string) => {
    try{
        if(5>members.length) return "> At Least 5 Members Required.";
        if(members.length>15) return "> No More Than 15 Members.";

        let groups_model = sequelize.model('groups');

        let previous = await groups_model.findOne({
            where: {
                leader,
                members: members.join(' ')
            }
        })

        if(previous) return `> You Guys Already Got A Similar Chatroom! <#${previous.dataValues.channelId}>`;


        //creating the channel
        const category_id = process.env._GROUP_CATEGORY_ID;

        if(!category_id) return 'No Category Set For Chatroom';

        let channel = await guild.channels.create({
            name
        })

        await channel.setParent(category_id);

        await channel.permissionOverwrites.edit(guild.roles.everyone, {
            ViewChannel: false
        })


        for(let member of members){
            await channel.permissionOverwrites.edit(member, {
                ViewChannel: true,
                SendMessages: true,
                EmbedLinks: true,
                AttachFiles: true,
                UseExternalEmojis: true
            })
        }

        let created = await groups_model.create({
            leader,
            members: members.join(" "),
            channelId: channel.id,
            name
        })


        await send_group_log(`## 🟩 Group [${name}](${channel.url}) created by <@${leader}>`);
        await channel.send('Happy chatting! 🌈');
        return '> ✅ Chatroom Created! ' + channel.url;
    }catch(err:any){
        console.log("Err at /services/groupServices.ts/create_group()");
        console.log(err);
        throw new Error(err.message);
    }
}

export const add_member_to_group = async (channelId: string, member: string) => {
    try {
          //explicitely to add the user to cache
        try{
            await client.users.fetch(member);
        }catch(err: any){
            return "> Invalid ID";
        }


        let groups_model = sequelize.model('groups');

        // Find the group by channelId
        const group = await groups_model.findOne({
            where: {
                channelId
            }
        });

        if (!group) {
            return "> Chatroom not found.";
        }


        // Update the group's members list
        const currentMembers = group.dataValues.members.split(' ');

        if(currentMembers.length >= 15){
            return "> No More Than 15 members.";
        }
        
        if (!currentMembers.includes(member)) {
            currentMembers.push(member);

            await group.update({
                members: currentMembers.join(' ')
            })

            let channel = (await client.channels.fetch(group.dataValues.channelId)) as GuildChannel;
            
            await channel.permissionOverwrites.edit(member, {
                ViewChannel: true,
                SendMessages: true,
                EmbedLinks: true,
                AttachFiles: true,
                UseExternalEmojis: true
            })
        } else {
            return "> Member is already in the Chatroom.";
        }

        return '> Member added to the Chatroom!';
    } catch (err: any) {
        console.log("Err at /services/groupServices.ts/add_member_to_group()");
        console.log(err);
        throw new Error(err.message);
    }
}

export const kick_member_from_group = async (channelId: string, member: string, request_member: GuildMember) => {
    try {
          //explicitely to add the user to cache
          try{
            await client.users.fetch(member);
        }catch(err: any){
            return "> Invalid ID";
        }

        if(member === request_member.user.id) return "> You can't kick yourself."


        let groups_model = sequelize.model('groups');

        // Find the group by channelId
        const group = await groups_model.findOne({
            where: {
                channelId
            }
        });

        if (!group) {
            return "> Chatroom not found.";
        }

        if((group.dataValues.leader !== request_member.user.id) && !request_member.permissions.has('ModerateMembers')) return `> You aren't the leader of this Chatroom!`;

        // Remove the member from the group
      
        
        if (group.dataValues.members.includes(member)) {

            let currentMembers = group.dataValues.members.split(' ');

            currentMembers = currentMembers.filter((v: string) => v !== member)
            await group.update({
                members: currentMembers.join(' ')
            });


            let channel = (await client.channels.fetch(group.dataValues.channelId)) as GuildChannel;
            
            await channel.permissionOverwrites.edit(member, {
                ViewChannel: false,
                SendMessages: false,
                EmbedLinks: false,
                AttachFiles: false,
                UseExternalEmojis: false
            })
        } else {
            return "> Member is not in the Chatroom.";
        }

        return '> Member kicked from the Chatroom!';
    } catch (err: any) {
        console.log("Err at /services/groupServices.ts/kick_member_from_group()");
        console.log(err);
        throw new Error(err.message);
    }
}

export const change_group_leader = async (channelId: string, newLeader: string, request_member: GuildMember) => {
    try {
        let groups_model = sequelize.model('groups');

        // Find the group by channelId 
        const group = await groups_model.findOne({
            where: {
                channelId
            }
        });

        if (!group) {
            return "> Chatroom not found.";
        }

        if((group.dataValues.leader !== request_member.user.id) && !request_member.permissions.has('ModerateMembers')) return `> You aren't the leader of this Chatroom!`;

        // Update the group's leader
        await group.update({
            leader: newLeader
        })

        return '> Chatroom leader changed!';
    } catch (err: any) {
        console.log("Err at /services/groupServices.ts/change_group_leader()");
        console.log(err);
        throw new Error(err.message);
    }
}

export const delete_group = async (channelId: string, request_member: GuildMember) => {
    try {
        let groups_model = sequelize.model('groups');

        // Find the group by channelId
        const group = await groups_model.findOne({
            where: {
                channelId
            }
        });

        if (!group) {
            return "> Chatroom not found.";
        }

        if((group.dataValues.leader !== request_member.user.id) && !request_member.permissions.has('ModerateMembers')) return `> 🔴 You aren't the leader of this Chatroom!`;

        // Delete the associated channel
        const channel = (await client.channels.fetch(channelId)) as GuildTextBasedChannel;
        if (channel) {
            if(channel.parentId !== process.env._GROUP_CATEGORY_ID) return `> 🔴 The Chatroom isn't in the right category!`
            await channel.delete();
        }

        // Delete the group from the database
        await group.destroy();

        await send_group_log(`## 🔴 Group ${group.dataValues.name} deleted by <@${request_member.user.id}>`);

        return '> ✅ Chatroom deleted!';
    } catch (err: any) {
        console.log("Err at /services/groupServices.ts/delete_group()");
        console.log(err);
        throw new Error(err.message);
    }
}

export const get_group_info = async (channelId: string) => {
    try{
        let groups_model = sequelize.model('groups');

        // Find the group by channelId
        const group = await groups_model.findOne({
            where: {
                channelId
            }
        });

        if (!group) {
            return "> Chatroom not found.";
        }


        const {name, leader, members} = group.dataValues;

        let info = `## Chatroom Information
        > 📝 Name: **${name}**
        > 👑 Leader: <@${leader}> 
        > 🧑‍🤝‍🧑Members: ${members.split(" ").map((v: string) => `<@${v}>`).join(' ')}`;

        return info;
    }catch(err:any){
        console.log("Err at /services/groupServices.ts/get_group_info()");
        console.log(err);
        throw new Error(err.message);
    }
}

export const change_group_name = async (channelId: string, newName: string) => {
    try {
        let groups_model = sequelize.model('groups');

        // Find the group by channelId
        const group = await groups_model.findOne({
            where: {
                channelId
            }
        });

        if (!group) {
            return "> Group not found.";
        }

        // Update the group's name in the database
        await group.update({
            name: newName
        })

        // Find and update the associated channel name
        const channel = (await client.channels.fetch(channelId)) as GuildTextBasedChannel
        if (channel) {
            await channel.setName(newName);
        }

        return '> Group name changed!';
    } catch (err: any) {
        console.log("Err at /services/groupServices.ts/change_group_name()");
        console.log(err);
        throw new Error(err.message);
    }
}

export const send_group_log = async (text: string) => {
    try{
        let log_channel_Id = process.env._LOG_CHANNEL_ID;

        if(!log_channel_Id) return console.log("Log Channel Id not found.");

        const channel = (await client.channels.fetch(log_channel_Id)) as GuildTextBasedChannel;

        await channel.send(text);
        
    }catch(err:any){
        console.log("Err at /services/groupServices.ts/send_group_log()");
        console.log(err);
    }
}
