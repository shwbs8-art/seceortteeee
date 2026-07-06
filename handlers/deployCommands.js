require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');
const config = require('../config');

async function deploy() {
  const commands = [];
  const commandsPath = path.join(__dirname, '..', 'commands');
  const categories = fs.readdirSync(commandsPath).filter((f) =>
    fs.statSync(path.join(commandsPath, f)).isDirectory()
  );

  for (const category of categories) {
    const categoryPath = path.join(commandsPath, category);
    const files = fs.readdirSync(categoryPath).filter((f) => f.endsWith('.js'));
    for (const file of files) {
      const command = require(path.join(categoryPath, file));
      if (command?.data) commands.push(command.data.toJSON());
    }
  }

  const rest = new REST({ version: '10' }).setToken(config.token);

  try {
    console.log(`🔄 جاري نشر ${commands.length} أمر...`);

    if (config.guildId) {
      // نشر سريع على سيرفر محدد (مفيد أثناء التطوير)
      await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), {
        body: commands,
      });
      console.log(`✅ تم نشر الأوامر على السيرفر ${config.guildId} بنجاح.`);
    } else {
      // نشر عام (يستغرق حتى ساعة للظهور)
      await rest.put(Routes.applicationCommands(config.clientId), { body: commands });
      console.log('✅ تم نشر الأوامر عالمياً بنجاح.');
    }
  } catch (err) {
    console.error('❌ فشل نشر الأوامر:', err);
  }
}

deploy();
