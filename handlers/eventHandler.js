const fs = require('fs');
const path = require('path');

function loadEvents(client) {
  const eventsPath = path.join(__dirname, '..', 'events');
  const files = fs.readdirSync(eventsPath).filter((f) => f.endsWith('.js'));

  let count = 0;
  for (const file of files) {
    const filePath = path.join(eventsPath, file);
    delete require.cache[require.resolve(filePath)];
    const event = require(filePath);
    if (!event?.name || !event?.execute) {
      console.warn(`[Events] الحدث ${file} ناقص name أو execute، تم تجاهله.`);
      continue;
    }
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
    count++;
  }
  console.log(`[Events] تم تحميل ${count} حدث بنجاح.`);
}

module.exports = { loadEvents };
