"""
Minha Grana - Telegram Bot
Registre gastos pelo celular enviando mensagens como:
  agua debito itau 4.50
  gasolina credito xp 180
  netflix 55.90

Rode com: python -m bot.telegram_bot
"""

import os
import sys
import json
import logging
from datetime import date, datetime
from decimal import Decimal

import httpx
from dotenv import load_dotenv
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    CallbackQueryHandler,
    ContextTypes,
    filters,
)

# Add parent dir to path so we can import from app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

from bot.parser import parse_message, ParsedTransaction

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

API_BASE = os.getenv("API_BASE_URL", "http://localhost:8000/api")
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
ALLOWED_USERS = os.getenv("TELEGRAM_ALLOWED_USERS", "")

# Parse allowed user IDs
ALLOWED_USER_IDS: set[int] = set()
if ALLOWED_USERS:
    for uid in ALLOWED_USERS.split(","):
        uid = uid.strip()
        if uid.isdigit():
            ALLOWED_USER_IDS.add(int(uid))


# ── API helpers ──────────────────────────────────────────────────────────────

async def api_get(path: str) -> dict | list:
    async with httpx.AsyncClient() as client:
        r = await client.get(f"{API_BASE}{path}")
        r.raise_for_status()
        return r.json()


async def api_post(path: str, data: dict) -> dict:
    async with httpx.AsyncClient() as client:
        r = await client.post(f"{API_BASE}{path}", json=data)
        r.raise_for_status()
        return r.json()


async def get_categories() -> list[dict]:
    return await api_get("/categories")


async def get_banks() -> list[dict]:
    return await api_get("/banks")


async def get_payment_methods() -> list[dict]:
    return await api_get("/payment-methods")


# ── Auth check ───────────────────────────────────────────────────────────────

def is_authorized(update: Update) -> bool:
    if not ALLOWED_USER_IDS:
        return True  # No filter configured — allow all
    return update.effective_user.id in ALLOWED_USER_IDS


# ── Command handlers ─────────────────────────────────────────────────────────

async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_authorized(update):
        await update.message.reply_text("⛔ Acesso não autorizado.")
        return

    user_id = update.effective_user.id
    text = (
        "👋 *Bem-vindo ao Minha Grana Bot!*\n\n"
        "Registre seus gastos enviando mensagens como:\n\n"
        "`agua debito itau 4.50`\n"
        "`gasolina credito xp 180`\n"
        "`netflix 55,90`\n"
        "`almoco 32`\n\n"
        "📌 *Formato:* `descrição [método] [banco] valor`\n"
        "• Método e banco são opcionais (o bot pergunta se faltar)\n"
        "• Valor aceita vírgula ou ponto\n\n"
        "📋 *Comandos:*\n"
        "/ajuda — exemplos de uso\n"
        "/resumo — resumo do mês atual\n"
        "/ultimas — últimas 5 transações\n"
        f"/meuid — seu ID: `{user_id}`\n"
    )
    await update.message.reply_text(text, parse_mode="Markdown")


async def cmd_ajuda(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_authorized(update):
        return

    categories = await get_categories()
    banks = await get_banks()

    cat_list = ", ".join(
        f"{c.get('icon', '')} {c['name']}"
        for c in categories
        if c.get("type") != "income"
    )
    bank_list = ", ".join(b["name"] for b in banks)

    text = (
        "📖 *Como usar:*\n\n"
        "*Exemplos:*\n"
        "`agua debito itau 4.50`\n"
        "`gasolina credito xp 180`\n"
        "`netflix 55,90`\n"
        "`farmacia debito 89.90`\n"
        "`almoco 32`\n\n"
        "O bot identifica automaticamente:\n"
        "• 💰 *Valor* — último número da mensagem\n"
        "• 💳 *Método* — debito/credito/pix\n"
        "• 🏦 *Banco* — pelo nome cadastrado\n"
        "• 📂 *Categoria* — pela descrição\n\n"
        "Se algo faltar, o bot pergunta com botões!\n\n"
        f"*Categorias:* {cat_list}\n\n"
        f"*Bancos:* {bank_list}\n"
    )
    await update.message.reply_text(text, parse_mode="Markdown")


async def cmd_resumo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_authorized(update):
        return

    today = date.today()
    try:
        summary = await api_get(f"/dashboard/summary?month={today.month}&year={today.year}")
    except Exception as e:
        await update.message.reply_text(f"❌ Erro ao buscar resumo: {e}")
        return

    income = summary.get("income", 0)
    expenses = summary.get("expenses", 0)
    balance = summary.get("balance", 0)

    sign = "+" if balance >= 0 else ""
    text = (
        f"📊 *Resumo de {today.month:02d}/{today.year}*\n\n"
        f"💵 Receitas: R$ {income:,.2f}\n"
        f"💸 Despesas: R$ {expenses:,.2f}\n"
        f"{'✅' if balance >= 0 else '🔴'} Saldo: {sign}R$ {balance:,.2f}"
    ).replace(",", "X").replace(".", ",").replace("X", ".")

    await update.message.reply_text(text, parse_mode="Markdown")


async def cmd_ultimas(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_authorized(update):
        return

    today = date.today()
    try:
        transactions = await api_get(
            f"/transactions?month={today.month}&year={today.year}"
        )
    except Exception as e:
        await update.message.reply_text(f"❌ Erro ao buscar transações: {e}")
        return

    if not transactions:
        await update.message.reply_text("📭 Nenhuma transação neste mês.")
        return

    last_5 = transactions[:5]
    lines = ["📋 *Últimas transações:*\n"]
    for t in last_5:
        icon = t.get("category", {}).get("icon", "")
        desc = t.get("description", "")
        amount = float(t.get("amount", 0))
        dt = t.get("date", "")
        tipo = "🔴" if t.get("type") == "expense" else "🟢"
        amount_str = f"R$ {amount:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
        lines.append(f"{tipo} {icon} {desc} — {amount_str} ({dt})")

    await update.message.reply_text("\n".join(lines), parse_mode="Markdown")


async def cmd_meuid(update: Update, context: ContextTypes.DEFAULT_TYPE):
    uid = update.effective_user.id
    await update.message.reply_text(
        f"🔑 Seu Telegram ID: `{uid}`\n\n"
        "Coloque esse valor em `TELEGRAM_ALLOWED_USERS` no `.env` para restringir o acesso.",
        parse_mode="Markdown",
    )


# ── Message handler (main flow) ─────────────────────────────────────────────

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_authorized(update):
        await update.message.reply_text("⛔ Acesso não autorizado.")
        return

    text = update.message.text.strip()
    if not text:
        return

    try:
        categories = await get_categories()
        banks = await get_banks()
        payment_methods = await get_payment_methods()
    except Exception as e:
        await update.message.reply_text(
            f"❌ Não consegui conectar ao backend. Ele está rodando?\n`{e}`",
            parse_mode="Markdown",
        )
        return

    bank_names = [b["name"] for b in banks]
    cat_dicts = [{"id": c["id"], "name": c["name"], "type": c.get("type", ""), "icon": c.get("icon", "")} for c in categories]

    parsed = parse_message(text, bank_names, cat_dicts)

    if parsed.amount is None:
        await update.message.reply_text(
            "❓ Não encontrei um valor na mensagem.\n"
            "Tente algo como: `agua debito itau 4.50`",
            parse_mode="Markdown",
        )
        return

    if not parsed.description:
        await update.message.reply_text(
            "❓ Não encontrei a descrição.\n"
            "Tente algo como: `agua debito itau 4.50`",
            parse_mode="Markdown",
        )
        return

    # Store parsed data in user context for callback flow
    context.user_data["pending"] = {
        "description": parsed.description,
        "amount": parsed.amount,
        "payment_method": None,
        "bank": None,
        "category_id": None,
        "date": date.today().isoformat(),
    }

    # Resolve payment method
    pm_id = None
    if parsed.payment_method:
        for pm in payment_methods:
            if pm["name"].lower() == parsed.payment_method.lower():
                pm_id = pm["id"]
                break
    context.user_data["pending"]["payment_method_id"] = pm_id

    # Resolve bank
    bank_id = None
    if parsed.bank:
        for b in banks:
            if b["name"].lower() == parsed.bank.lower():
                bank_id = b["id"]
                break
    context.user_data["pending"]["bank_id"] = bank_id

    # Resolve category
    cat_id = None
    if parsed.category:
        for c in categories:
            if c["name"].lower() == parsed.category.lower():
                cat_id = c["id"]
                break
    context.user_data["pending"]["category_id"] = cat_id

    # Check what's missing and ask via inline buttons
    if pm_id is None:
        keyboard = [
            [InlineKeyboardButton(pm["name"], callback_data=f"pm:{pm['id']}")]
            for pm in payment_methods
        ]
        await update.message.reply_text(
            f"💳 *{parsed.description}* — R$ {parsed.amount:,.2f}\n"
            "Qual o método de pagamento?".replace(",", "X").replace(".", ",").replace("X", "."),
            reply_markup=InlineKeyboardMarkup(keyboard),
            parse_mode="Markdown",
        )
        return

    if bank_id is None:
        keyboard = [
            [InlineKeyboardButton(b["name"], callback_data=f"bank:{b['id']}")]
            for b in banks
        ]
        await update.message.reply_text(
            f"🏦 *{parsed.description}* — R$ {parsed.amount:,.2f}\n"
            "Qual o banco?".replace(",", "X").replace(".", ",").replace("X", "."),
            reply_markup=InlineKeyboardMarkup(keyboard),
            parse_mode="Markdown",
        )
        return

    if cat_id is None:
        expense_cats = [c for c in categories if c.get("type") in ("expense", "both")]
        keyboard = []
        row = []
        for c in expense_cats:
            icon = c.get("icon", "")
            row.append(InlineKeyboardButton(f"{icon} {c['name']}", callback_data=f"cat:{c['id']}"))
            if len(row) == 2:
                keyboard.append(row)
                row = []
        if row:
            keyboard.append(row)

        await update.message.reply_text(
            f"📂 *{parsed.description}* — R$ {parsed.amount:,.2f}\n"
            "Qual a categoria?".replace(",", "X").replace(".", ",").replace("X", "."),
            reply_markup=InlineKeyboardMarkup(keyboard),
            parse_mode="Markdown",
        )
        return

    # All fields present — create transaction
    await create_transaction(update, context)


# ── Callback query handler (inline buttons) ─────────────────────────────────

async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()

    pending = context.user_data.get("pending")
    if not pending:
        await query.edit_message_text("⚠️ Nenhuma transação pendente. Envie uma nova mensagem.")
        return

    data = query.data

    if data.startswith("pm:"):
        pm_id = int(data.split(":")[1])
        pending["payment_method_id"] = pm_id

        # Still need bank?
        if pending.get("bank_id") is None:
            banks = await get_banks()
            keyboard = [
                [InlineKeyboardButton(b["name"], callback_data=f"bank:{b['id']}")]
                for b in banks
            ]
            await query.edit_message_text(
                f"🏦 *{pending['description']}* — Qual o banco?",
                reply_markup=InlineKeyboardMarkup(keyboard),
                parse_mode="Markdown",
            )
            return

        # Still need category?
        if pending.get("category_id") is None:
            await _ask_category(query, context)
            return

        await create_transaction_from_callback(query, context)

    elif data.startswith("bank:"):
        bank_id = int(data.split(":")[1])
        pending["bank_id"] = bank_id

        # Still need category?
        if pending.get("category_id") is None:
            await _ask_category(query, context)
            return

        await create_transaction_from_callback(query, context)

    elif data.startswith("cat:"):
        cat_id = int(data.split(":")[1])
        pending["category_id"] = cat_id
        await create_transaction_from_callback(query, context)


async def _ask_category(query, context):
    categories = await get_categories()
    expense_cats = [c for c in categories if c.get("type") in ("expense", "both")]
    keyboard = []
    row = []
    for c in expense_cats:
        icon = c.get("icon", "")
        row.append(InlineKeyboardButton(f"{icon} {c['name']}", callback_data=f"cat:{c['id']}"))
        if len(row) == 2:
            keyboard.append(row)
            row = []
    if row:
        keyboard.append(row)

    pending = context.user_data["pending"]
    await query.edit_message_text(
        f"📂 *{pending['description']}* — Qual a categoria?",
        reply_markup=InlineKeyboardMarkup(keyboard),
        parse_mode="Markdown",
    )


# ── Transaction creation ─────────────────────────────────────────────────────

async def create_transaction(update: Update, context: ContextTypes.DEFAULT_TYPE):
    pending = context.user_data.pop("pending", None)
    if not pending:
        return

    payload = {
        "type": "expense",
        "amount": pending["amount"],
        "description": pending["description"],
        "category_id": pending["category_id"],
        "bank_id": pending["bank_id"],
        "payment_method_id": pending["payment_method_id"],
        "date": pending["date"],
    }

    try:
        result = await api_post("/transactions", payload)
    except Exception as e:
        await update.message.reply_text(f"❌ Erro ao criar transação: `{e}`", parse_mode="Markdown")
        return

    await update.message.reply_text(_format_success(result), parse_mode="Markdown")


async def create_transaction_from_callback(query, context: ContextTypes.DEFAULT_TYPE):
    pending = context.user_data.pop("pending", None)
    if not pending:
        return

    payload = {
        "type": "expense",
        "amount": pending["amount"],
        "description": pending["description"],
        "category_id": pending["category_id"],
        "bank_id": pending["bank_id"],
        "payment_method_id": pending["payment_method_id"],
        "date": pending["date"],
    }

    try:
        result = await api_post("/transactions", payload)
    except Exception as e:
        await query.edit_message_text(f"❌ Erro ao criar transação: `{e}`", parse_mode="Markdown")
        return

    await query.edit_message_text(_format_success(result), parse_mode="Markdown")


def _format_success(result: dict) -> str:
    cat = result.get("category", {})
    bank = result.get("bank", {})
    pm = result.get("payment_method", {})
    amount = float(result.get("amount", 0))
    dt = result.get("date", "")

    amount_str = f"R$ {amount:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

    # Format date as DD/MM/YYYY
    try:
        dt_parsed = datetime.strptime(dt, "%Y-%m-%d")
        dt_str = dt_parsed.strftime("%d/%m/%Y")
    except Exception:
        dt_str = dt

    icon = cat.get("icon", "📂")
    return (
        f"✅ *Transação registrada!*\n\n"
        f"{icon} {cat.get('name', '?')} | {pm.get('name', '?')} | {bank.get('name', '?')}\n"
        f"💰 {amount_str}\n"
        f"📅 {dt_str}"
    )


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    if not BOT_TOKEN:
        print("[ERRO] TELEGRAM_BOT_TOKEN nao configurado no .env")
        print("1. Fale com @BotFather no Telegram")
        print("2. Crie um bot com /newbot")
        print("3. Copie o token e coloque no .env:")
        print("   TELEGRAM_BOT_TOKEN=seu_token_aqui")
        sys.exit(1)

    print("[BOT] Minha Grana Bot iniciando...")
    print(f"[API] {API_BASE}")
    if ALLOWED_USER_IDS:
        print(f"[AUTH] Usuarios permitidos: {ALLOWED_USER_IDS}")
    else:
        print("[AVISO] TELEGRAM_ALLOWED_USERS nao configurado - qualquer pessoa pode usar o bot!")
        print("        Use /meuid no bot para descobrir seu ID e configure no .env")

    app = Application.builder().token(BOT_TOKEN).build()

    # Commands
    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("ajuda", cmd_ajuda))
    app.add_handler(CommandHandler("resumo", cmd_resumo))
    app.add_handler(CommandHandler("ultimas", cmd_ultimas))
    app.add_handler(CommandHandler("meuid", cmd_meuid))

    # Inline button callbacks
    app.add_handler(CallbackQueryHandler(handle_callback))

    # Text messages (main flow)
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    print("[OK] Bot rodando! Mande uma mensagem no Telegram.")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
