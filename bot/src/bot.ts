import { Bot, Context, GrammyError, HttpError, InlineKeyboard, Keyboard } from "grammy";
import { config } from "./config";
import { prisma } from "./db";
import { InvalidPhoneError, formatPhone, normalizePhone } from "./phone";

const SHARE_PHONE_LABEL = "📱 Telefon raqamni ulashish";

export function createBot(): Bot {
  const bot = new Bot(config.botToken);

  bot.command("start", handleStart);
  bot.command("app", handleApp);
  bot.command("me", handleMe);
  bot.command("help", handleHelp);
  bot.on(":contact", handleContact);

  bot.on("message:text", async (ctx) => {
    if (ctx.message.text.startsWith("/")) return;
    await ctx.reply("Boshlash uchun /start buyrug'ini bosing.");
  });

  bot.catch((err) => {
    const e = err.error;
    if (e instanceof GrammyError) console.error(`[grammy] ${e.description}`);
    else if (e instanceof HttpError) console.error(`[http] ${e.message}`);
    else console.error(`[bot] ${(e as Error)?.message ?? e}`);
  });

  return bot;
}

function miniAppKeyboard(): InlineKeyboard | undefined {
  if (!config.miniAppUrl) return undefined;
  return new InlineKeyboard().webApp("🐝 Mini App'ni ochish", config.miniAppUrl);
}

function contactKeyboard() {
  return {
    keyboard: new Keyboard().requestContact(SHARE_PHONE_LABEL).resized().oneTime().build(),
    resize_keyboard: true,
    one_time_keyboard: true,
  };
}

async function handleStart(ctx: Context): Promise<void> {
  const from = ctx.from;
  if (!from) return;

  const linked = await prisma.user.findUnique({
    where: { telegramId: BigInt(from.id) },
  });

  // Has a real (positive) phone — onboarding fully complete
  if (linked && linked.phone > 0n) {
    await ctx.reply(
      `👋 Salom, ${from.first_name ?? "foydalanuvchi"}!\n\n` +
        `✅ Raqamingiz ulangan: <b>${formatPhone(linked.phone)}</b>\n\n` +
        `Mini App orqali kirishingiz mumkin.`,
      {
        parse_mode: "HTML",
        reply_markup: miniAppKeyboard(),
      },
    );
    return;
  }

  // No row, or row exists but only via Mini App (placeholder phone) — ask for contact
  await ctx.reply(
    `👋 BeeExpress'ga xush kelibsiz, ${from.first_name ?? ""}!\n\n` +
      `Ro'yxatdan o'tishni yakunlash uchun pastdagi tugma orqali telefon raqamingizni ulashing. ` +
      `Shundan keyin Mini App'dan to'liq foydalanasiz.`,
    { reply_markup: contactKeyboard() },
  );
}

async function handleApp(ctx: Context): Promise<void> {
  const kb = miniAppKeyboard();
  if (!kb) {
    await ctx.reply("Mini App URL hali sozlanmagan.");
    return;
  }
  await ctx.reply("Mini App'ni ochish uchun tugmani bosing:", { reply_markup: kb });
}

async function handleContact(ctx: Context): Promise<void> {
  const contact = ctx.message?.contact;
  const from = ctx.from;
  if (!contact || !from) return;

  if (contact.user_id !== from.id) {
    await ctx.reply("Iltimos, faqat o'z raqamingizni ulashing.", {
      reply_markup: contactKeyboard(),
    });
    return;
  }

  let phone: bigint;
  try {
    phone = normalizePhone(contact.phone_number);
  } catch (err) {
    if (err instanceof InvalidPhoneError) {
      await ctx.reply(
        "❌ Telefon raqam noto'g'ri formatda. BeeExpress faqat O'zbekiston (+998) raqamlarini qabul qiladi.",
      );
      return;
    }
    throw err;
  }

  const telegramId = BigInt(from.id);

  try {
    const byPhone = await prisma.user.findUnique({ where: { phone } });
    const byTg = await prisma.user.findUnique({ where: { telegramId } });

    if (byPhone && byTg && byPhone.id !== byTg.id) {
      await ctx.reply(
        "⚠️ Bu Telegram hisobi boshqa raqamga ulangan. Iltimos, support bilan bog'laning.",
      );
      return;
    }

    if (byPhone) {
      await prisma.user.update({
        where: { id: byPhone.id },
        data: {
          telegramId,
          telegramUsername: from.username ?? null,
          telegramFirst: from.first_name ?? null,
          telegramLast: from.last_name ?? null,
          telegramLinkedAt: new Date(),
        },
      });
    } else if (byTg) {
      // Mini App had created a row with placeholder phone — fill it in now.
      await prisma.user.update({
        where: { id: byTg.id },
        data: {
          phone,
          telegramUsername: from.username ?? null,
          telegramFirst: from.first_name ?? null,
          telegramLast: from.last_name ?? null,
          telegramLinkedAt: new Date(),
        },
      });
    } else {
      await prisma.user.create({
        data: {
          phone,
          telegramId,
          telegramUsername: from.username ?? null,
          telegramFirst: from.first_name ?? null,
          telegramLast: from.last_name ?? null,
          telegramLinkedAt: new Date(),
        },
      });
    }
  } catch (err) {
    console.error(`[contact] upsert failed: ${(err as Error).message}`);
    await ctx.reply("❌ Texnik xatolik. Birozdan keyin qayta urinib ko'ring.");
    return;
  }

  await ctx.reply(
    `✅ Raqamingiz ulandi!\n\n` +
      `Telefon: <b>${formatPhone(phone)}</b>\n\n` +
      `Endi Mini App orqali kirishingiz mumkin.`,
    {
      parse_mode: "HTML",
      reply_markup: miniAppKeyboard() ?? { remove_keyboard: true },
    },
  );
}

async function handleMe(ctx: Context): Promise<void> {
  const from = ctx.from;
  if (!from) return;

  const user = await prisma.user.findUnique({
    where: { telegramId: BigInt(from.id) },
    include: { role: true },
  });

  if (!user) {
    await ctx.reply("Hali ro'yxatdan o'tmagansiz. /start bosib telefonni ulang.", {
      reply_markup: contactKeyboard(),
    });
    return;
  }

  const role = user.role ? user.role.name : "Belgilanmagan";
  const phoneLine = user.phone > 0n ? formatPhone(user.phone) : "(hali ulanmagan — /start bosing)";
  await ctx.reply(
    `<b>Sizning hisobingiz</b>\n\n` +
      `Telefon: ${phoneLine}\n` +
      `Rol: ${role}\n` +
      `Ulangan: ${user.telegramLinkedAt?.toLocaleString("uz-UZ") ?? "—"}`,
    { parse_mode: "HTML" },
  );
}

async function handleHelp(ctx: Context): Promise<void> {
  await ctx.reply(
    `<b>BeeExpress yordam</b>\n\n` +
      `/start — botni boshlash va telefonni ulash\n` +
      `/app — Mini App'ni ochish\n` +
      `/me — hisobingiz ma'lumotlari\n` +
      `/help — yordam`,
    { parse_mode: "HTML", reply_markup: miniAppKeyboard() },
  );
}
