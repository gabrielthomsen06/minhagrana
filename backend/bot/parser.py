import re
import unicodedata
from dataclasses import dataclass, field
from typing import Optional


def _normalize(text: str) -> str:
    """Remove accents and lowercase for comparison."""
    nfkd = unicodedata.normalize("NFKD", text)
    return "".join(c for c in nfkd if not unicodedata.combining(c)).lower()


@dataclass
class ParsedTransaction:
    description: str = ""
    amount: Optional[float] = None
    payment_method: Optional[str] = None  # "débito" or "crédito"
    bank: Optional[str] = None
    category: Optional[str] = None


# Aliases for payment methods
PAYMENT_METHOD_ALIASES = {
    "debito": "Débito",
    "débito": "Débito",
    "deb": "Débito",
    "credito": "Crédito",
    "crédito": "Crédito",
    "cred": "Crédito",
    "pix": "Débito",
}

# Amount pattern: matches numbers like 4.50, 4,50, 180, 1.200,50, 1200.50
AMOUNT_PATTERN = re.compile(
    r"\b(\d{1,3}(?:\.\d{3})*,\d{1,2})\b"  # 1.200,50 or 4,50 (BR format)
    r"|"
    r"\b(\d+\.?\d*)\b"  # 4.50 or 180 (US format / integer)
)


def _parse_amount(text: str) -> tuple[Optional[float], str]:
    """Extract amount from text. Returns (amount, text_without_amount)."""
    # Try BR format first: 1.200,50 or 4,50
    br_match = re.search(r"\b(\d{1,3}(?:\.\d{3})*,\d{1,2})\b", text)
    if br_match:
        raw = br_match.group(1)
        cleaned = raw.replace(".", "").replace(",", ".")
        remaining = text[: br_match.start()] + text[br_match.end() :]
        return float(cleaned), remaining.strip()

    # Try to find standalone numbers (not part of words)
    # Process from right to left to get the last number (most likely the amount)
    matches = list(re.finditer(r"(?<!\w)(\d+(?:\.\d{1,2})?)(?!\w)", text))
    if matches:
        match = matches[-1]
        remaining = text[: match.start()] + text[match.end() :]
        return float(match.group(1)), remaining.strip()

    return None, text


def _find_payment_method(text: str) -> tuple[Optional[str], str]:
    """Find payment method in text. Returns (method_name, text_without_method)."""
    lower = text.lower()
    for alias, method in sorted(PAYMENT_METHOD_ALIASES.items(), key=lambda x: -len(x[0])):
        pattern = re.compile(r"\b" + re.escape(alias) + r"\b", re.IGNORECASE)
        m = pattern.search(text)
        if m:
            remaining = text[: m.start()] + text[m.end() :]
            return method, remaining.strip()
    return None, text


def _find_bank(text: str, bank_names: list[str]) -> tuple[Optional[str], str]:
    """Find bank name in text. Returns (bank_name, text_without_bank).

    Uses accent-insensitive matching so 'itau' matches 'Itaú'.
    """
    text_norm = _normalize(text)
    for name in sorted(bank_names, key=lambda x: -len(x)):
        name_norm = _normalize(name)
        pattern = re.compile(r"\b" + re.escape(name_norm) + r"\b")
        m = pattern.search(text_norm)
        if m:
            # Remove the matched portion from the original text (same positions)
            remaining = text[: m.start()] + text[m.end() :]
            return name, remaining.strip()
    return None, text


def _find_category(description: str, categories: list[dict]) -> Optional[dict]:
    """Try to match description to a category.

    categories: list of dicts with keys 'id', 'name', 'type', 'icon'
    """
    desc_norm = _normalize(description.strip())

    # Direct match: description contains category name or vice versa
    for cat in categories:
        if cat["type"] == "income":
            continue
        cat_norm = _normalize(cat["name"])
        if cat_norm in desc_norm or desc_norm in cat_norm:
            return cat

    # Keyword-based matching
    keyword_map = {
        "Alimentação": [
            "agua", "água", "almoço", "almoco", "jantar", "lanche", "cafe", "café",
            "comida", "restaurante", "ifood", "pizza", "hamburguer", "hamburger",
            "sushi", "açaí", "acai", "padaria", "mercado", "supermercado",
            "feira", "frutas", "verduras", "cerveja", "bebida", "refrigerante",
            "suco", "sorvete", "chocolate", "doce", "bolo", "pão", "pao",
            "coxinha", "pastel", "marmita", "delivery", "rappi",
        ],
        "Gasolina": [
            "gasolina", "combustivel", "combustível", "etanol", "alcool", "álcool",
            "posto", "abastecimento", "diesel",
        ],
        "Carro": [
            "estacionamento", "pedágio", "pedagio", "lavagem", "oficina", "mecânico",
            "mecanico", "pneu", "óleo", "oleo", "ipva", "seguro carro",
            "multa", "borracharia",
        ],
        "Saúde": [
            "farmácia", "farmacia", "remédio", "remedio", "médico", "medico",
            "consulta", "exame", "dentista", "hospital", "plano de saúde",
            "academia", "suplemento", "vitamina",
        ],
        "Educação": [
            "curso", "livro", "faculdade", "escola", "udemy", "alura",
            "mensalidade", "material escolar", "apostila",
        ],
        "Lazer": [
            "cinema", "teatro", "show", "ingresso", "viagem", "hotel",
            "passeio", "parque", "jogo", "game", "steam", "playstation",
            "xbox", "bar", "balada", "festa",
        ],
        "Vestuário": [
            "roupa", "camisa", "camiseta", "calça", "calca", "sapato",
            "tênis", "tenis", "bermuda", "vestido", "blusa", "jaqueta",
            "meia", "cueca", "short",
        ],
        "Assinaturas": [
            "netflix", "spotify", "disney", "hbo", "amazon prime", "prime video",
            "youtube premium", "icloud", "google one", "chatgpt", "github",
            "nubank", "assinatura", "mensalidade", "plano",
        ],
        "Investimentos": [
            "investimento", "aporte", "tesouro", "ação", "acao", "fundo",
            "cdb", "lci", "lca", "cripto", "bitcoin", "renda fixa",
        ],
    }

    for cat_name, keywords in keyword_map.items():
        for kw in keywords:
            if _normalize(kw) in desc_norm:
                for cat in categories:
                    if cat["name"] == cat_name:
                        return cat

    return None


def parse_message(
    text: str,
    bank_names: list[str],
    categories: list[dict],
) -> ParsedTransaction:
    """Parse a user message into a transaction.

    Args:
        text: Raw message from user, e.g. "agua debito itau 4.50"
        bank_names: List of registered bank names, e.g. ["Itaú", "XP"]
        categories: List of category dicts with 'id', 'name', 'type', 'icon'

    Returns:
        ParsedTransaction with extracted fields
    """
    result = ParsedTransaction()
    remaining = text.strip()

    # 1. Extract amount
    result.amount, remaining = _parse_amount(remaining)

    # 2. Extract payment method
    result.payment_method, remaining = _find_payment_method(remaining)

    # 3. Extract bank
    matched_bank, remaining = _find_bank(remaining, bank_names)
    result.bank = matched_bank

    # 4. Clean up remaining text as description
    # Remove extra spaces
    result.description = re.sub(r"\s+", " ", remaining).strip()

    # 5. Try to match category from description
    cat = _find_category(result.description, categories)
    if cat:
        result.category = cat["name"]

    return result
