const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');

function loadCommands(client) {
  client.commands = new Collection();
  const commandsPath = path.join(__dirname, '..', 'commands');
  const categories = fs.readdirSync(commandsPath).filter((f) =>
    fs.statSync(path.join(commandsPath, f)).isDirectory()
  );

  let count = 0;
  for (const category of categories) {
    const categoryPath = path.join(commandsPath, category);
    const files = fs.readdirSync(categoryPath).filter((f) => f.endsWith('.js'));
    for (const file of files) {
      const filePath = path.join(categoryPath, file);
      delete require.cache[require.resolve(filePath)];
      const command = require(filePath);
      if (!command?.data || !command?.execute) {
        console.warn(`[Commands] الأمر ${file} ناقص data أو execute، تم تجاهله.`);
        continue;
      }
      command.category = category;
      client.commands.set(command.data.name, command);
      count++;
    }
  }
  console.log(`[Commands] تم تحميل ${count} أمر بنجاح.`);
  return client.commands;
}

module.exports = { loadCommands };
